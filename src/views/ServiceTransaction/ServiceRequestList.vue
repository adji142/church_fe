<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Permintaan Layanan</h1>
        <p class="page-subtitle">Kelola permintaan layanan, approval, dan penjadwalan jemaat</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari No. Request / Nama Jemaat..." 
            class="search-input"
            @input="debounceSearch"
          />
        </div>
        <button class="btn btn-primary" @click="createRequest">
          <Plus size="18" /> <span>Buat Permintaan</span>
        </button>
      </div>
    </div>

    <!-- Filters Section (Aligned with master-data-page theme) -->
    <div class="filter-tab-container">
        <div class="filter-tabs">
            <button 
                v-for="status in statuses" 
                :key="status.value" 
                :class="['tab-btn', selectedStatus === status.value ? 'active' : '']"
                @click="filterByStatus(status.value)"
            >
                {{ status.label }}
            </button>
        </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data...</p>
      </div>
      <div v-else-if="data.length === 0" class="empty-state">
        <div class="empty-icon"><FileText size="48" /></div>
        <p>Tidak ada permintaan layanan ditemukan.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 140px;">No. Request</th>
              <th>Jemaat</th>
              <th>Layanan</th>
              <th>Tanggal Request</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" class="row-hover">
              <td><span class="font-mono font-bold text-indigo">{{ item.request_number }}</span></td>
              <td>
                <div class="font-bold text-dark">{{ item.member?.nama_lengkap }}</div>
                <div class="text-xs text-muted">{{ item.member?.no_hp || '-' }}</div>
              </td>
              <td>
                <div class="font-bold text-dark">{{ item.service_type?.name }}</div>
                <div class="category-tag">{{ item.service_type?.category?.name || 'LAINNYA' }}</div>
              </td>
              <td>
                <div class="date-display">
                    <Calendar size="14" class="mr-1" />
                    {{ formatDate(item.requested_at) }}
                </div>
              </td>
              <td>
                <span :class="['status-badge', 'tr-' + item.status]">
                  {{ formatStatus(item.status) }}
                </span>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn view" @click="viewDetail(item)" title="Lihat Detail">
                    <Eye size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Footer -->
        <div class="pagination-footer">
          <div class="per-page-selector">
            <span class="text-xs font-bold text-muted">TAMPILKAN</span>
            <select v-model="pagination.per_page" @change="fetchData(1)">
              <option :value="10">10 data</option>
              <option :value="25">25 data</option>
              <option :value="50">50 data</option>
              <option :value="100">100 data</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> dari <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button 
                class="page-btn" 
                :disabled="pagination.current_page === 1" 
                @click="fetchData(pagination.current_page - 1)"
              >
                <ChevronLeft size="18" />
              </button>
              <button 
                class="page-btn" 
                :disabled="pagination.current_page === pagination.last_page" 
                @click="fetchData(pagination.current_page + 1)"
              >
                <ChevronRight size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { 
  Plus, Search, FileText, Eye, ChevronLeft, ChevronRight, Calendar
} from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();

const data = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedStatus = ref('');
const timer = ref(null);

const statuses = [
    { value: '', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'scheduled', label: 'Dijadwalkan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'cancelled', label: 'Dibatalkan' }
];

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0
});

const fetchData = async (page = 1) => {
    if (!auth.activeBranch) return;

    loading.value = true;
    try {
        const response = await axios.get('/service-requests', {
            params: {
                church_id: auth.activeBranch.id,
                page: page,
                per_page: pagination.value.per_page,
                search: searchQuery.value,
                status: selectedStatus.value
            }
        });
        data.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            per_page: response.data.per_page,
            total: response.data.total,
            from: response.data.from,
            to: response.data.to
        };
    } catch (error) {
        console.error("Fetch error", error);
    } finally {
        loading.value = false;
    }
};

const debounceSearch = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    fetchData(1);
  }, 500);
};

const filterByStatus = (status) => {
    selectedStatus.value = status;
    fetchData(1);
};

const createRequest = () => {
    router.push({ name: 'CreateServiceRequest' });
};

const viewDetail = (item) => {
    router.push({ name: 'ServiceRequestDetail', params: { id: item.id } });
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatStatus = (status) => {
    const map = {
        pending: 'Menunggu',
        approved: 'Disetujui',
        rejected: 'Ditolak',
        scheduled: 'Dijadwalkan',
        completed: 'Selesai',
        cancelled: 'Dibatalkan'
    };
    return map[status] || status;
};

watch(() => auth.activeBranch, () => fetchData(1), { immediate: true });

onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.master-data-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.025em;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  width: 320px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Filter Tab Container */
.filter-tab-container {
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
}

.filter-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem;
    background: #f1f5f9;
    border-radius: 0.75rem;
    width: fit-content;
}

.tab-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.tab-btn:hover {
    color: #334155;
}

.tab-btn.active {
    background: white;
    color: #6366f1;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Table Card */
.table-card {
  padding: 0;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.modern-table th {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #4b5563;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.modern-table td {
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  vertical-align: middle;
  border-bottom: 1px solid #f3f4f6;
}

.row-hover:hover {
  background-color: #f8fafc;
}

.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.font-bold { font-weight: 700; }
.text-indigo { color: #4f46e5; }
.text-dark { color: #1e293b; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.75rem; }

.category-tag {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 800;
    color: #6366f1;
    background: #eef2ff;
    padding: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    margin-top: 0.25rem;
}

.date-display {
    display: flex;
    align-items: center;
    color: #475569;
    font-size: 0.8125rem;
    font-weight: 500;
}

.mr-1 { margin-right: 0.25rem; }

.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.status-badge.tr-pending { background-color: #fef3c7; color: #d97706; }
.status-badge.tr-approved { background-color: #dbeafe; color: #2563eb; }
.status-badge.tr-scheduled { background-color: #e0e7ff; color: #4f46e5; }
.status-badge.tr-completed { background-color: #dcfce7; color: #166534; }
.status-badge.tr-rejected { background-color: #fee2e2; color: #991b1b; }
.status-badge.tr-cancelled { background-color: #f1f5f9; color: #64748b; }

/* Action Buttons */
.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  color: #6366f1;
  border-color: #c7d2fe;
}

/* Pagination Footer */
.pagination-footer {
  padding: 1.25rem 2rem;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.per-page-selector select {
  padding: 0.5rem 2.25rem 0.5rem 0.875rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e2e8f0;
  font-size: 0.8125rem;
  background: #f8fafc;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}

.per-page-selector select:hover {
  border-color: #6366f1;
  background-color: #ffffff;
}

.pagination-controls {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
}

.page-info b {
  color: #0f172a;
  font-weight: 700;
}

.page-buttons { display: flex; gap: 0.75rem; }

.page-btn {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.875rem;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-btn:hover:not(:disabled) {
  background: #f5f3ff;
  color: #6366f1;
  border-color: #c7d2fe;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #f1f5f9;
}

.loading-state, .empty-state {
  padding: 5rem 2rem;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #eef2ff;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.25rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Global / Reuse helper buttons from Categories */
.btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.875rem;
    font-weight: 700;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
}

.btn-primary {
    background: #6366f1;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1);
}

.btn-primary:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}
</style>


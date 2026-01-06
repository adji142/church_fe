<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Master Pekerjaan</h1>
        <p class="page-subtitle">Kelola daftar pekerjaan jemaat di cabang ini</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari pekerjaan..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Tambah Pekerjaan</span>
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
        <div class="empty-icon"><Search size="48" /></div>
        <p>Tidak ada data yang ditemukan.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 80px">No</th>
              <th>Nama Pekerjaan</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data" :key="item.id" class="row-hover">
              <td><span class="order-badge">{{ pagination.from + index }}</span></td>
              <td class="font-bold text-dark">{{ item.name }}</td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(item)" title="Ubah" :disabled="saving">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(item)" title="Hapus" :disabled="saving">
                    <Trash2 size="16" />
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
            <select v-model="pagination.per_page" @change="fetchData(1)" :disabled="saving">
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
                :disabled="pagination.current_page === 1 || saving" 
                @click="fetchData(pagination.current_page - 1)"
              >
                <ChevronLeft size="18" />
              </button>
              <button 
                class="page-btn" 
                :disabled="pagination.current_page === pagination.last_page || saving" 
                @click="fetchData(pagination.current_page + 1)"
              >
                <ChevronRight size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="!saving && closeModal()">
        <div class="modal-content">
          <div class="modal-header">
            <div class="header-icon">
              <Plus v-if="!editingId" size="24" />
              <Edit2 v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Pekerjaan' : 'Tambah Pekerjaan Baru' }}</h2>
              <p>{{ editingId ? 'Ubah informasi pekerjaan yang sudah ada' : 'Masukkan nama pekerjaan baru' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>
          
          <form @submit.prevent="saveData" class="modal-body">
            <div class="form-section">
              <div class="form-group full-width">
                <label class="form-label">Nama Pekerjaan</label>
                <div class="input-wrapper">
                  <Type size="18" class="input-icon" />
                  <input v-model="form.name" type="text" required placeholder="Contoh: PNS, Karyawan Swasta, Wiraswasta, dll." :disabled="saving" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Batal</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Menyimpan...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Pekerjaan' : 'Simpan Pekerjaan' }}</span>
                </template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Plus, Edit2, Trash2, X, Search, Check, Type, ChevronLeft, ChevronRight
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const data = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const timer = ref(null);

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0
});

const form = ref({
  name: '',
  branch_id: null
});

const fetchData = async (page = 1) => {
  if (!auth.activeBranch) return;
  
  loading.value = true;
  try {
    const response = await axios.get('/occupations', {
      params: { 
        branch_id: auth.activeBranch.id,
        page: page,
        per_page: pagination.value.per_page,
        search: searchQuery.value
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
    console.error('Failed to fetch occupations', error);
    Swal.fire('Error', 'Gagal memuat data pekerjaan.', 'error');
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

// Re-fetch when branch changes
watch(() => auth.activeBranch, (newBranch) => {
  if (newBranch) fetchData(1);
}, { immediate: true });

onMounted(() => {
  fetchData();
});

const openModal = (item = null) => {
  if (item) {
    editingId.value = item.id;
    form.value = { 
      name: item.name,
      branch_id: item.branch_id
    };
  } else {
    editingId.value = null;
    form.value = { 
      name: '', 
      branch_id: auth.activeBranch?.id 
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveData = async () => {
  if (!form.value.branch_id) {
    Swal.fire('Error', 'Silakan pilih cabang terlebih dahulu.', 'error');
    return;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/occupations/${editingId.value}`, form.value);
    } else {
      await axios.post('/occupations', form.value);
    }
    await fetchData(pagination.value.current_page);
    closeModal();
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Data pekerjaan telah diperbarui.',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire('Error', 'Gagal menyimpan data.', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    title: 'Apakah Anda yakin?',
    text: `Pekerjaan "${item.name}" akan dihapus permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/occupations/${item.id}`);
      await fetchData(pagination.value.current_page);
      Swal.fire('Dihapus!', 'Data telah berhasil dihapus.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Gagal menghapus data.', 'error');
    }
  }
};
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
  margin-bottom: 2.5rem;
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
  width: 300px;
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
  padding: 0.625rem 1rem 0.625rem 2.75rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Table Card */
.table-card {
  padding: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
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
}

.row-hover:hover {
  background-color: #f8fafc;
}

.order-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.75rem;
}

/* Action Buttons */
.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.action-btn.edit:hover:not(:disabled) { color: #6366f1; border-color: #c7d2fe; background: #f5f3ff; }
.action-btn.delete:hover:not(:disabled) { color: #ef4444; border-color: #fecaca; background: #fef2f2; }

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

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.per-page-selector select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e2e8f0;
  font-size: 0.8125rem;
  background: #f8fafc;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='dp 19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.25rem;
}

.per-page-selector select:hover {
  border-color: #6366f1;
  background-color: #ffffff;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
}

.page-info b {
  color: #0f172a;
  font-weight: 700;
}

.page-buttons {
  display: flex;
  gap: 0.75rem;
}

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

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}

.modal-header {
  padding: 1.75rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  position: relative;
}

.header-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.header-text h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.header-text p {
  font-size: 0.875rem;
  color: #64748b;
}

.close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #64748b;
}

.modal-body {
  padding: 2rem;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.modal-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.75rem;
  font-weight: 700;
}

/* Global Helpers */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.gap-3 { gap: 0.75rem; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.text-dark { color: #1e293b; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.75rem; }

.loading-state, .empty-state {
  padding: 4rem 2rem;
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
  margin: 0 auto 1rem;
}

.spinner.small {
  width: 1.25rem;
  height: 1.25rem;
  border-width: 2px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
  from { transform: scale(0.95) translateY(10px); }
  to { transform: scale(1) translateY(0); }
}
</style>

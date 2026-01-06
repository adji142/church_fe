<template>
  <div class="master-data-page wide">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Periode Keuangan</h1>
        <p class="page-subtitle">Kelola siklus pelaporan dan pembukuan anggaran gereja</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari periode..." 
            class="search-input"
            @input="debounceSearch"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()">
          <Plus size="18" /> <span>Tambah Periode</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data periode...</p>
      </div>
      <div v-else-if="data.length === 0" class="empty-state">
        <div class="empty-icon"><Calendar size="48" /></div>
        <p>Tidak ada periode ditemukan.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 250px">Nama Periode</th>
              <th>Rentang Tanggal</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" class="row-hover">
              <td>
                <div class="name-column">
                  <span class="font-bold text-dark">{{ item.name }}</span>
                  <span class="text-xs text-muted">ID: #{{ item.id }}</span>
                </div>
              </td>
              <td class="text-slate-600 font-medium">
                {{ formatDate(item.start_date) }}
                <ArrowRight size="12" class="mx-2 text-slate-300" />
                {{ formatDate(item.end_date) }}
              </td>
              <td>
                <span :class="['status-pill', item.is_active ? 'active' : 'inactive']">
                   {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
                </span>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(item)" title="Ubah">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(item)" title="Hapus">
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
            <span>TAMPILKAN</span>
            <select v-model="pagination.per_page" @change="fetchData(1)">
              <option :value="10">10 data</option>
              <option :value="25">25 data</option>
              <option :value="50">50 data</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> dari <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button class="page-btn" :disabled="pagination.current_page === 1" @click="fetchData(pagination.current_page - 1)">
                <ChevronLeft size="18" />
              </button>
              <button class="page-btn" :disabled="pagination.current_page === pagination.last_page" @click="fetchData(pagination.current_page + 1)">
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
              <h2>{{ editingId ? 'Update Periode' : 'Tambah Periode Baru' }}</h2>
              <p>{{ editingId ? 'Ubah informasi periode yang sudah ada' : 'Atur rentang waktu pembukuan finansial' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>

          <form @submit.prevent="saveData" class="modal-body">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Nama Periode <span class="required">*</span></label>
                <div class="input-wrapper">
                  <FileText size="18" class="input-icon" />
                  <input v-model="form.name" type="text" required placeholder="Contoh: Tahun Buku 2024" :disabled="saving" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tanggal Mulai <span class="required">*</span></label>
                <div class="input-wrapper">
                  <Calendar size="18" class="input-icon" />
                  <input v-model="form.start_date" type="date" required :disabled="saving" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tanggal Selesai <span class="required">*</span></label>
                <div class="input-wrapper">
                  <Calendar size="18" class="input-icon" />
                  <input v-model="form.end_date" type="date" required :disabled="saving" />
                </div>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Status Periode</label>
                <div class="status-toggle-group">
                  <button 
                    type="button" 
                    :class="['status-btn', { active: form.is_active }]"
                    @click="form.is_active = true"
                    :disabled="saving"
                  >Aktif</button>
                  <button 
                    type="button" 
                    :class="['status-btn', { active: !form.is_active }]"
                    @click="form.is_active = false"
                    :disabled="saving"
                  >Non-Aktif</button>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Menyimpan...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Data' : 'Simpan Periode' }}</span>
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
import { ref, onMounted } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Search, Plus, Edit2, Trash2, X, Check, ChevronLeft, ChevronRight, Calendar, ArrowRight, FileText
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
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 
});

const defaultForm = () => ({
  church_id: auth.activeBranch,
  name: '',
  start_date: '',
  end_date: '',
  is_active: true
});

const form = ref(defaultForm());

const fetchData = async (page = 1) => {
  loading.value = true;
  try {
    const res = await axios.get('/financial-periods', {
      params: { 
        page, 
        per_page: pagination.value.per_page, 
        search: searchQuery.value,
        church_id: auth.activeBranch
      }
    });
    data.value = res.data.data;
    pagination.value = {
      current_page: res.data.current_page,
      last_page: res.data.last_page,
      per_page: res.data.per_page,
      total: res.data.total,
      from: res.data.from,
      to: res.data.to
    };
  } catch (error) {
    console.error('Fetch error:', error);
  } finally {
    loading.value = false;
  }
};

const debounceSearch = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => fetchData(1), 500);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const openModal = (item = null) => {
  if (item) {
    editingId.value = item.id;
    form.value = { 
        ...item,
        start_date: item.start_date.split('T')[0],
        end_date: item.end_date.split('T')[0]
    };
  } else {
    editingId.value = null;
    form.value = defaultForm();
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveData = async () => {
  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/financial-periods/${editingId.value}`, form.value);
    } else {
      await axios.post('/financial-periods', form.value);
    }
    Swal.fire({ icon: 'success', title: 'Berhasil', timer: 2000, showConfirmButton: false });
    fetchData(pagination.value.current_page);
    closeModal();
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan data', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    title: 'Hapus Periode?',
    text: "Data yang dihapus tidak dapat dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/financial-periods/${item.id}`);
      fetchData();
      Swal.fire('Terhapus!', 'Periode telah dihapus.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Gagal menghapus data', 'error');
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.master-data-page {
  padding: 2rem;
  max-width: 1200px;
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

.card {
  background: #ffffff;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
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

.code-badge {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-family: monospace;
  font-weight: 600;
  color: #374151;
}

.type-tag {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #fee2e2; color: #991b1b; }

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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
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
  max-width: 600px;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}

.modal-content.large {
  background: white;
  width: 100%;
  max-width: 700px;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
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
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-section-title {
  grid-column: span 2;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-top: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-group.full-width {
  grid-column: span 2;
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

.input-wrapper input, .input-wrapper select, .input-wrapper textarea {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.status-toggle-group {
  display: flex;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.status-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #64748b;
}

.status-btn.active {
  background: white;
  color: #4f46e5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.modal-footer {
  padding: 1.5rem 2rem;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary { background: #6366f1; color: white; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); }

.btn-ghost { background: transparent; color: #64748b; }
.btn-ghost:hover:not(:disabled) { background: #f1f5f9; }

.btn-lg {
  padding: 0.75rem 1.75rem;
  font-weight: 700;
}

.required { color: #ef4444; margin-left: 2px; }

/* Global Helpers */
.schedule-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-range-display {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 700;
  gap: 0.375rem;
  background: #f5f3ff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  width: fit-content;
}

/* Global Helpers */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.gap-3 { gap: 0.75rem; }
.font-bold { font-weight: 700; }
.text-dark { color: #1e293b; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-right { text-align: right; }

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

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

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

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-section-title { grid-column: span 1; }
  .form-group.full-width { grid-column: span 1; }
}

.name-column {
  display: flex;
  flex-direction: column;
}
</style>

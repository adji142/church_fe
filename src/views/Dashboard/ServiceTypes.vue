<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Master Tipe Layanan</h1>
        <p class="page-subtitle">Kelola tipe layanan (contoh: Pernikahan, Baptisan) dan syarat dokumen</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari tipe layanan..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Tambah Tipe</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-section" v-if="categories.length > 0">
        <div class="filter-group">
            <span class="filter-label">Filter Kategori:</span>
            <div class="filter-buttons">
                <button 
                    :class="['filter-btn', !selectedFilterCategory ? 'active' : '']" 
                    @click="filterByCategory(null)"
                >
                    Semua
                </button>
                <button 
                    v-for="cat in categories" 
                    :key="cat.id" 
                    :class="['filter-btn', selectedFilterCategory === cat.id ? 'active' : '']"
                    @click="filterByCategory(cat.id)"
                >
                    {{ cat.name }}
                </button>
            </div>
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
              <th>Nama Layanan</th>
              <th>Kategori</th>
              <th>Code</th>
              <th>Config</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in data" :key="item.id" class="row-hover">
              <td><span class="order-badge">{{ pagination.from + index }}</span></td>
              <td>
                <div class="font-bold text-dark">{{ item.name }}</div>
                <div class="text-xs text-muted">{{ item.requirements?.length || 0 }} syarat dokumen</div>
              </td>
              <td>
                <span class="category-badge">{{ item.category?.name || '-' }}</span>
              </td>
              <td><span class="code-badge">{{ item.code || '-' }}</span></td>
              <td>
                 <div class="config-icons">
                    <span v-if="item.requires_approval" title="Butuh Approval"><CheckCircle size="14" class="icon-success"/> Approval</span>
                    <span v-if="item.has_schedule" title="Ada Jadwal"><Calendar size="14" class="icon-info"/> Jadwal</span>
                    <span v-if="item.has_document" title="Dokumen Lengkap"><FileText size="14" class="icon-warning"/> Dokumen </span>
                 </div>
              </td>
              <td>
                <span :class="['status-badge', item.is_active ? 'active' : 'inactive']">
                  {{ item.is_active ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </td>
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
        <div class="modal-content large-modal">
          <div class="modal-header">
            <div class="header-icon">
              <Plus v-if="!editingId" size="24" />
              <Edit2 v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Tipe Layanan' : 'Tambah Tipe Layanan' }}</h2>
              <p>{{ editingId ? 'Ubah informasi tipe layanan dan syaratnya' : 'Buat tipe layanan baru' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>
          
          <form @submit.prevent="saveData" class="modal-body">
            <div class="form-grid">
                 <!-- Left Column: Service Details -->
                 <div class="form-column">
                     <h3 class="section-title">Informasi Dasar</h3>
                     
                     <div class="form-group">
                        <label class="form-label">Kategori</label>
                        <select v-model="form.service_category_id" required class="select-input" :disabled="saving">
                            <option value="">Pilih Kategori</option>
                            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                        </select>
                     </div>

                     <div class="form-group">
                        <label class="form-label">Nama Layanan</label>
                        <input v-model="form.name" type="text" required placeholder="Contoh: Pemberkatan Nikah" :disabled="saving" class="text-input" />
                     </div>
                    
                     <div class="form-group">
                        <label class="form-label">Kode (Opsional)</label>
                        <input v-model="form.code" type="text" placeholder="Contoh: WEDDING" :disabled="saving" class="text-input" />
                     </div>

                      <div class="form-group">
                        <label class="form-label">Deskripsi</label>
                        <textarea v-model="form.description" rows="2" placeholder="Keterangan singkat..." :disabled="saving" class="text-area-input"></textarea>
                     </div>

                     <div class="form-group checkboxes-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="form.requires_approval" :disabled="saving">
                            <span>Perlu Approval</span>
                        </label>
                         <label class="checkbox-label">
                            <input type="checkbox" v-model="form.has_schedule" :disabled="saving">
                            <span>Ada Jadwal</span>
                        </label>
                         <label class="checkbox-label">
                            <input type="checkbox" v-model="form.has_document" :disabled="saving">
                            <span>Upload Dokumen</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="form.is_active" :disabled="saving">
                            <span>Status Aktif</span>
                        </label>
                     </div>
                 </div>

                 <!-- Right Column: Requirements -->
                 <div class="form-column requirements-column">
                      <div class="requirements-header">
                        <h3 class="section-title">Syarat Dokumen</h3>
                         <button type="button" class="btn-add-req" @click="addRequirement" :disabled="saving">
                            <Plus size="14" /> Tambah
                         </button>
                      </div>

                      <div class="requirements-list">
                          <div v-if="form.requirements.length === 0" class="empty-reqs">
                               Belum ada syarat dokumen.
                          </div>
                          <div v-for="(req, idx) in form.requirements" :key="idx" class="req-item">
                                <div class="req-content">
                                    <input 
                                        v-model="req.name" 
                                        type="text" 
                                        placeholder="Nama Dokumen (e.g., KTP)" 
                                        class="req-name-input" 
                                        :disabled="saving"
                                        required
                                    />
                                    <label class="req-checkbox">
                                        <input type="checkbox" v-model="req.is_required" :disabled="saving">
                                        <span>Wajib</span>
                                    </label>
                                </div>
                                <button type="button" class="btn-remove-req" @click="removeRequirement(idx)" :disabled="saving">
                                    <X size="16" />
                                </button>
                          </div>
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
                  <span>{{ editingId ? 'Update Layanan' : 'Simpan Layanan' }}</span>
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
  Plus, Edit2, Trash2, X, Search, Check, ChevronLeft, ChevronRight, CheckCircle, Calendar, FileText
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const data = ref([]);
const categories = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const selectedFilterCategory = ref(null);
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
  service_category_id: '',
  name: '',
  code: '',
  description: '',
  requires_approval: false,
  has_schedule: false,
  has_document: true,
  is_active: true,
  church_id: null,
  requirements: []
});

const fetchCategories = async () => {
    try {
        const response = await axios.get('/service-categories', {
             params: { 
                 church_id: auth.activeBranch.id, 
                 per_page: 100 // fetch all usually
             }
        });
        categories.value = response.data.data;
    } catch (error) {
        console.error("Failed to fetch categories", error);
    }
}

const fetchData = async (page = 1) => {
  if (!auth.activeBranch) return;
  
  loading.value = true;
  try {
    const response = await axios.get('/service-types', {
      params: { 
        church_id: auth.activeBranch.id,
        page: page,
        per_page: pagination.value.per_page,
        search: searchQuery.value,
        service_category_id: selectedFilterCategory.value
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
    console.error('Failed to fetch types', error);
    Swal.fire('Error', 'Gagal memuat data tipe layanan.', 'error');
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

const filterByCategory = (catId) => {
    selectedFilterCategory.value = catId;
    fetchData(1);
}

// Re-fetch when branch changes
watch(() => auth.activeBranch, async (newBranch) => {
  if (newBranch) {
      await fetchCategories();
      fetchData(1);
  }
}, { immediate: true });

onMounted(() => {
  fetchCategories();
  fetchData();
});

const addRequirement = () => {
    form.value.requirements.push({
        name: '',
        is_required: true
    });
};

const removeRequirement = (index) => {
    const req = form.value.requirements[index];
    if (req.id) {
        // Mark for deletion if existing
        req.delete = true;
        // In UI, effectively hide it or move it to a "deleted" list? 
        // For simplicity in this UI, we just hide it but keep it in array to send to backend with delete flag.
        // However, a simpler approach for user is just remove from array and handle "missing IDs" on backend?
        // My Controller logic expects `delete: true` for explicit deletion of existing.
        // So I should keep it but mark it. But to keep UI clean, let's keep it in array but hidden?
        // Better: filtered computed property for UI?
        // Let's just use `delete` flag and v-show="!req.delete"
    } else {
        form.value.requirements.splice(index, 1);
    }
};

const openModal = (item = null) => {
  if (item) {
    editingId.value = item.id;
    // Deep copy to avoid mutating original
    form.value = { 
        ...item,
        requirements: item.requirements ? item.requirements.map(r => ({...r})) : []
    };
  } else {
    editingId.value = null;
    form.value = { 
      service_category_id: '',
      name: '',
      code: '',
      description: '',
      requires_approval: false,
      has_schedule: false,
      has_document: false,
      is_active: true,
      church_id: auth.activeBranch?.id,
      requirements: []
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveData = async () => {
  if (!form.value.church_id) {
    Swal.fire('Error', 'Silakan pilih cabang/gereja terlebih dahulu.', 'error');
    return;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/service-types/${editingId.value}`, form.value);
    } else {
      await axios.post('/service-types', form.value);
    }
    await fetchData(pagination.value.current_page);
    closeModal();
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Data layanan telah diperbarui.',
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
    text: `Layanan "${item.name}" akan dihapus permanen!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/service-types/${item.id}`);
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
  max-width: 1200px; /* Wider for this page */
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

/* Filter Section */
.filter-section {
    margin-bottom: 1.5rem;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #4b5563;
}

.filter-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 0.375rem 0.875rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-btn:hover {
    background: #e2e8f0;
    color: #475569;
}

.filter-btn.active {
    background: #6366f1;
    color: white;
    border-color: #6366f1;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active { background-color: #dcfce7; color: #166534; }
.status-badge.inactive { background-color: #fee2e2; color: #991b1b; }

.category-badge {
    background: #e0e7ff;
    color: #4338ca;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
}

.code-badge {
    font-family: monospace;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #334155;
}

.config-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.config-icons span {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    color: #64748b;
    font-weight: 600;
}

.icon-success { color: #10b981; }
.icon-info { color: #3b82f6; }
.icon-warning { color: #f59e0b; }

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
  max-width: 500px; /* Default */
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}

.modal-content.large-modal {
    max-width: 900px;
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
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 2rem;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.form-column {
    display: flex;
    flex-direction: column;
}

.section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #334155;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
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

.text-input, .select-input, .text-area-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.text-input:focus, .select-input:focus, .text-area-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.checkboxes-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: #475569;
    cursor: pointer;
    user-select: none;
}

.checkbox-label input {
    width: 1rem;
    height: 1rem;
}

.requirements-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.5rem;
}

.requirements-header .section-title {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
}

.btn-add-req {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: #e0e7ff;
    color: #4338ca;
    border-radius: 0.375rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
}

.btn-add-req:hover {
    background: #c7d2fe;
}

.requirements-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.empty-reqs {
    text-align: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    border: 1px dashed #e2e8f0;
}

.req-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
}

.req-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.req-name-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    padding: 0.25rem;
    border-bottom: 1px solid transparent;
}

.req-name-input:focus {
    outline: none;
    border-bottom-color: #6366f1;
}

.req-checkbox {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: #64748b;
    cursor: pointer;
}

.btn-remove-req {
    background: transparent;
    border: none;
    color: #cbd5e1;
    cursor: pointer;
    padding: 2px;
}

.btn-remove-req:hover {
    color: #ef4444;
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

/* Transitions for Modal */
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

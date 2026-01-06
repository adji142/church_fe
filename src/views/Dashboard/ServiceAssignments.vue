<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Penugasan Pelayanan</h1>
        <p class="page-subtitle">Kelola penugasan jemaat ke departemen dan jabatan pelayanan</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari penugasan..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Tambah Penugasan</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card shadow-lg">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat data...</p>
      </div>
      <div v-else-if="data.length === 0" class="empty-state">
        <div class="empty-icon text-slate-300"><Search size="48" /></div>
        <p class="mt-4 font-medium text-slate-500">Tidak ada data penugasan ditemukan.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Jemaat</th>
              <th>Departemen</th>
              <th>Jabatan</th>
              <th>Periode</th>
              <th>Status</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" class="row-hover">
              <td>
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800">{{ item.member?.nama_lengkap || '-' }}</span>
                  <span class="text-xs text-slate-500">{{ item.member?.email || '-' }}</span>
                </div>
              </td>
              <td><span class="font-semibold text-indigo-600">{{ item.department?.name || '-' }}</span></td>
              <td><span class="text-sm">{{ item.position?.name || '-' }}</span></td>
              <td>
                <div class="flex flex-col text-xs">
                  <span>{{ formatDate(item.start_date) }}</span>
                  <span v-if="item.end_date" class="text-slate-500">s/d {{ formatDate(item.end_date) }}</span>
                </div>
              </td>
              <td>
                <span :class="['status-pill', item.status]">{{ item.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}</span>
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
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TAMPILKAN</span>
            <select v-model="pagination.per_page" @change="fetchData(1)" :disabled="saving">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> dari <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button class="page-btn" :disabled="pagination.current_page === 1 || saving" @click="fetchData(pagination.current_page - 1)">
                <ChevronLeft size="18" />
              </button>
              <button class="page-btn" :disabled="pagination.current_page === pagination.last_page || saving" @click="fetchData(pagination.current_page + 1)">
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
              <UserPlus v-if="!editingId" size="24" />
              <UserCog v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Penugasan' : 'Tambah Penugasan Baru' }}</h2>
              <p>{{ editingId ? 'Ubah informasi penugasan pelayanan' : 'Lengkapi formulir untuk menugaskan jemaat' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>

          <form @submit.prevent="saveData" class="modal-body custom-scrollbar">
            <div class="form-grid">
              <div class="form-group span-2">
                <label class="form-label">Jemaat <span class="text-red-500">*</span></label>
                <div class="searchable-select">
                  <div class="input-wrapper cursor-pointer" @click="toggleDropdown('jemaat')">
                    <User size="18" class="input-icon" />
                    <input 
                      type="text" 
                      :value="getSelectedJemaatName()" 
                      placeholder="Pilih Jemaat"
                      readonly
                      required
                    />
                    <ChevronDown size="18" style="position: absolute; right: 1rem; color: #94a3b8;" />
                  </div>
                  <div v-if="dropdowns.jemaat" class="select-dropdown">
                    <div class="search-box">
                      <Search size="16" class="search-icon" />
                      <input 
                        v-model="dropdowns.jemaatSearch" 
                        type="text" 
                        placeholder="Cari jemaat..."
                        class="search-input"
                        @click.stop
                      />
                    </div>
                    <ul class="options-list custom-scrollbar">
                      <li 
                        v-for="j in filteredJemaats" 
                        :key="j.id" 
                        @click="selectJemaat(j)"
                      >
                        {{ j.nama_lengkap }} - {{ j.email }}
                      </li>
                      <li v-if="filteredJemaats.length === 0" class="empty-option">Tidak ada data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Departemen <span class="text-red-500">*</span></label>
                <div class="searchable-select">
                  <div class="input-wrapper cursor-pointer" @click="toggleDropdown('department')">
                    <Briefcase size="18" class="input-icon" />
                    <input 
                      type="text" 
                      :value="getSelectedDepartmentName()" 
                      placeholder="Pilih Departemen"
                      readonly
                      required
                    />
                    <ChevronDown size="18" style="position: absolute; right: 1rem; color: #94a3b8;" />
                  </div>
                  <div v-if="dropdowns.department" class="select-dropdown">
                    <div class="search-box">
                      <Search size="16" class="search-icon" />
                      <input 
                        v-model="dropdowns.departmentSearch" 
                        type="text" 
                        placeholder="Cari departemen..."
                        class="search-input"
                        @click.stop
                      />
                    </div>
                    <ul class="options-list custom-scrollbar">
                      <li 
                        v-for="d in filteredDepartments" 
                        :key="d.id" 
                        @click="selectDepartment(d)"
                      >
                        {{ d.name }}
                      </li>
                      <li v-if="filteredDepartments.length === 0" class="empty-option">Tidak ada data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Jabatan <span class="text-red-500">*</span></label>
                <div class="searchable-select">
                  <div class="input-wrapper cursor-pointer" @click="toggleDropdown('position')">
                    <Award size="18" class="input-icon" />
                    <input 
                      type="text" 
                      :value="getSelectedPositionName()" 
                      placeholder="Pilih Jabatan"
                      readonly
                      required
                    />
                    <ChevronDown size="18" style="position: absolute; right: 1rem; color: #94a3b8;" />
                  </div>
                  <div v-if="dropdowns.position" class="select-dropdown">
                    <div class="search-box">
                      <Search size="16" class="search-icon" />
                      <input 
                        v-model="dropdowns.positionSearch" 
                        type="text" 
                        placeholder="Cari jabatan..."
                        class="search-input"
                        @click.stop
                      />
                    </div>
                    <ul class="options-list custom-scrollbar">
                      <li 
                        v-for="p in filteredPositions" 
                        :key="p.id" 
                        @click="selectPosition(p)"
                      >
                        {{ p.name }}
                      </li>
                      <li v-if="filteredPositions.length === 0" class="empty-option">Tidak ada data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tanggal Mulai <span class="text-red-500">*</span></label>
                <div class="input-wrapper">
                  <Calendar size="18" class="input-icon" />
                  <input v-model="form.start_date" type="date" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tanggal Selesai</label>
                <div class="input-wrapper">
                  <Calendar size="18" class="input-icon" />
                  <input v-model="form.end_date" type="date" />
                </div>
              </div>

              <div class="form-group span-2">
                <label class="form-label">Status</label>
                <div class="status-toggle-group">
                  <button type="button" class="status-btn" :class="{ active: form.status === 'active' }" @click="form.status = 'active'">
                    Aktif
                  </button>
                  <button type="button" class="status-btn" :class="{ active: form.status === 'inactive' }" @click="form.status = 'inactive'">
                    Tidak Aktif
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Batal</button>
            <button type="submit" class="btn btn-primary" @click="saveData" :disabled="saving">
              <span v-if="saving" class="spinner small"></span>
              <Check v-else size="18" />
              <span>{{ editingId ? 'Update' : 'Simpan' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { Plus, Edit2, Trash2, X, Search, Check, User, Calendar, ChevronLeft, ChevronRight, UserPlus, UserCog, Briefcase, Award, ChevronDown } from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const data = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const timer = ref(null);

const jemaats = ref([]);
const departments = ref([]);
const positions = ref([]);

const dropdowns = ref({
  jemaat: false,
  department: false,
  position: false,
  jemaatSearch: '',
  departmentSearch: '',
  positionSearch: ''
});

const pagination = ref({ 
  current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 
});

const defaultForm = () => ({
  member_id: '',
  department_id: '',
  position_id: '',
  branch_id: auth.activeBranch.id,
  start_date: '',
  end_date: '',
  status: 'active'
});

const form = ref(defaultForm());

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const debounceSearch = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => fetchData(1), 500);
};

const fetchData = async (page = 1) => {
  loading.value = true;
  try {
    const res = await axios.get('/service-assignments', {
      params: { page, per_page: pagination.value.per_page, search: searchQuery.value }
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
  } catch (e) {
    console.error(e);
    Swal.fire('Error', 'Gagal memuat data', 'error');
  } finally {
    loading.value = false;
  }
};

const fetchMasterData = async () => {
  try {
    const [j, d, p] = await Promise.all([
      axios.get('/jemaat', { params: { per_page: 1000 } }),
      axios.get('/departments', { params: { per_page: 1000 } }),
      axios.get('/positions', { params: { per_page: 1000 } })
    ]);
    jemaats.value = j.data.data || [];
    departments.value = d.data.data || [];
    positions.value = p.data.data || [];
    console.log('Departments:', departments.value);
    console.log('Positions:', positions.value);
  } catch (e) {
    console.error('Error fetching master data:', e);
  }
};

// Computed filters
const filteredJemaats = computed(() => {
  if (!dropdowns.value.jemaatSearch) return jemaats.value;
  return jemaats.value.filter(j => 
    j.nama_lengkap?.toLowerCase().includes(dropdowns.value.jemaatSearch.toLowerCase()) ||
    j.email?.toLowerCase().includes(dropdowns.value.jemaatSearch.toLowerCase())
  );
});

const filteredDepartments = computed(() => {
  if (!dropdowns.value.departmentSearch) return departments.value;
  return departments.value.filter(d => 
    d.name?.toLowerCase().includes(dropdowns.value.departmentSearch.toLowerCase())
  );
});

const filteredPositions = computed(() => {
  if (!dropdowns.value.positionSearch) return positions.value;
  return positions.value.filter(p => 
    p.name?.toLowerCase().includes(dropdowns.value.positionSearch.toLowerCase())
  );
});

// Dropdown functions
const toggleDropdown = (type) => {
  dropdowns.value.jemaat = type === 'jemaat' ? !dropdowns.value.jemaat : false;
  dropdowns.value.department = type === 'department' ? !dropdowns.value.department : false;
  dropdowns.value.position = type === 'position' ? !dropdowns.value.position : false;
};

const selectJemaat = (j) => {
  form.value.member_id = j.id;
  dropdowns.value.jemaat = false;
  dropdowns.value.jemaatSearch = '';
};

const selectDepartment = (d) => {
  form.value.department_id = d.id;
  dropdowns.value.department = false;
  dropdowns.value.departmentSearch = '';
};

const selectPosition = (p) => {
  form.value.position_id = p.id;
  dropdowns.value.position = false;
  dropdowns.value.positionSearch = '';
};

const getSelectedJemaatName = () => {
  const j = jemaats.value.find(j => j.id === form.value.member_id);
  return j ? `${j.nama_lengkap} - ${j.email}` : '';
};

const getSelectedDepartmentName = () => {
  const d = departments.value.find(d => d.id === form.value.department_id);
  return d ? d.name : '';
};

const getSelectedPositionName = () => {
  const p = positions.value.find(p => p.id === form.value.position_id);
  return p ? p.name : '';
};

// Close dropdowns on click outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.searchable-select')) {
      dropdowns.value.jemaat = false;
      dropdowns.value.department = false;
      dropdowns.value.position = false;
    }
  });
}

const openModal = (item = null) => {
  if (item) {
    editingId.value = item.id;
    form.value = { ...item, branch_id: item.branch_id || localStorage.getItem('active_branch_id') };
  } else {
    editingId.value = null;
    form.value = defaultForm();
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  form.value = defaultForm();
  editingId.value = null;
};

const saveData = async () => {
  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/service-assignments/${editingId.value}`, form.value);
      Swal.fire('Berhasil', 'Data penugasan berhasil diperbarui', 'success');
    } else {
      const res = await axios.post('/service-assignments', form.value);
      Swal.fire('Berhasil', res.data.message || 'Data penugasan berhasil disimpan', 'success');
    }
    closeModal();
    fetchData(pagination.value.current_page);
  } catch (e) {
    console.error('Save error:', e);
    
    // Handle validation errors
    if (e.response?.status === 422 && e.response?.data?.errors) {
      const errors = e.response.data.errors;
      
      // Save current form values and editing state
      const savedForm = { ...form.value };
      const savedEditingId = editingId.value;
      
      // Close modal temporarily
      showModal.value = false;
      
      // Field name translations
      const fieldTranslations = {
        'member_id': 'Jemaat',
        'department_id': 'Departemen',
        'position_id': 'Jabatan',
        'branch_id': 'Cabang',
        'start_date': 'Tanggal Mulai',
        'end_date': 'Tanggal Selesai',
        'status': 'Status'
      };
      
      let errorList = '<ul style="text-align: left; margin: 0; padding-left: 20px;">';
      
      Object.keys(errors).forEach(field => {
        const fieldName = fieldTranslations[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        errors[field].forEach(msg => {
          // Translate common error messages
          let translatedMsg = msg
            .replace('The ' + field + ' field is required.', `${fieldName} wajib diisi.`)
            .replace('The ' + field + ' must be a valid date.', `${fieldName} harus berupa tanggal yang valid.`)
            .replace('The ' + field + ' field must be a date after or equal to ' + field + '.', `${fieldName} harus sama atau setelah tanggal mulai.`)
            .replace(field, fieldName);
          
          errorList += `<li><strong>${fieldName}:</strong> ${translatedMsg}</li>`;
        });
      });
      
      errorList += '</ul>';
      
      Swal.fire({
        icon: 'error',
        title: 'Validasi Gagal',
        html: `<div style="font-size: 0.95rem;">${errorList}</div>`,
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'OK'
      }).then(() => {
        // Reopen modal with saved values
        form.value = savedForm;
        editingId.value = savedEditingId;
        showModal.value = true;
      });
    } else {
      // Save current form values and editing state for other errors too
      const savedForm = { ...form.value };
      const savedEditingId = editingId.value;
      
      // Close modal temporarily
      showModal.value = false;
      
      // Handle other errors
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: e.response?.data?.message || e.message || 'Terjadi kesalahan saat menyimpan data',
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'OK'
      }).then(() => {
        // Reopen modal with saved values
        form.value = savedForm;
        editingId.value = savedEditingId;
        showModal.value = true;
      });
    }
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    title: 'Hapus Penugasan?',
    text: `Yakin ingin menghapus penugasan ${item.member?.nama_lengkap}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/service-assignments/${item.id}`);
      Swal.fire('Terhapus!', 'Data penugasan berhasil dihapus', 'success');
      fetchData(pagination.value.current_page);
    } catch (e) {
      Swal.fire('Gagal', 'Gagal menghapus data', 'error');
    }
  }
};

onMounted(() => {
  fetchData();
  fetchMasterData();
});
</script>

<style scoped>
/* Exact copy of styles from Jemaat.vue for consistency */

.master-data-page {
  padding: 0;
  font-family: 'Outfit', 'Inter', sans-serif;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.title-group h1.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.title-group .page-subtitle {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  min-width: 320px;
}

.search-icon {
  position: absolute;
  left: 1.125rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.85rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 0.625rem;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-ghost {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-ghost:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table Section */
.card {
  background: white;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.modern-table th {
  background: #f9fafb;
  padding: 1.125rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #4b5563;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.modern-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.875rem;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.row-hover:hover {
  background-color: #f8fafc;
}

.status-pill {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-pill.active { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.status-pill.inactive { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

.actions-group {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.edit:hover { background: #f5f3ff; color: #6366f1; border-color: #c7d2fe; }
.action-btn.delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

/* Modal Styles */
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
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 1.75rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  position: relative;
}

.header-icon {
  width: 52px;
  height: 52px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.header-text h2 {
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
  letter-spacing: -0.025em;
}

.header-text p {
  font-size: 0.9rem;
  color: #64748b;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Modal Body */
.modal-body {
  padding: 2.25rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}

.span-2 { grid-column: span 2; }

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1.125rem;
  color: #94a3b8;
}

.input-wrapper input, .input-wrapper select {
  width: 100%;
  padding: 0.8125rem 1.125rem 0.8125rem 3rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #1e293b;
}

.input-wrapper input:focus, .input-wrapper select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-wrapper select {
  appearance: none;
  cursor: pointer;
}

.status-toggle-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.375rem;
  border-radius: 0.875rem;
  gap: 0.375rem;
  width: max-content;
}

.status-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  background: transparent;
}

.status-btn.active {
  background: white;
  color: #0f172a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.modal-footer {
  padding: 1.75rem 2.25rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 1.25rem;
  background: #f8fafc;
}

/* Pagination Section */
.pagination-footer {
  padding: 1.25rem 1.75rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.per-page-selector select {
  padding: 0.4rem 0.75rem;
  border-radius: 0.625rem;
  border: 1.5px solid #e2e8f0;
  font-size: 0.8rem;
  background: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.per-page-selector select:focus {
  border-color: #6366f1;
  outline: none;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
}

.page-buttons {
  display: flex;
  gap: 0.625rem;
}

.page-btn {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Spinner & Animations */
.loading-state, .empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Searchable Select */
.searchable-select {
  position: relative;
}

.cursor-pointer {
  cursor: pointer;
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  margin-top: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideInDown 0.2s ease-out;
}

@keyframes slideInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-box {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
  background: #f8fafc;
}

.search-box .search-icon {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding-left: 2.5rem;
  background: white;
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
  list-style: none;
  padding: 0.5rem 0;
  margin: 0;
}

.options-list li {
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.options-list li:hover {
  background: #f5f3ff;
  color: #6366f1;
  padding-left: 1.5rem;
}

.empty-option {
  padding: 1.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  font-style: italic;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }

/* SweetAlert2 High Z-Index */
:deep(.swal-high-z-index) {
  z-index: 99999 !important;
}
</style>

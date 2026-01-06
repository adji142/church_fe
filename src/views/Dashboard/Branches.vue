<template>
  <div class="branches-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Branch Management</h1>
        <p class="page-subtitle">Configure organization branches, legal permits, and social presence</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search branches..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Add Branch</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card shadow-soft">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading branches...</p>
      </div>
      <div v-else-if="branches.length === 0" class="empty-state">
        <div class="empty-icon text-slate-300"><Search size="48" /></div>
        <p class="mt-4 font-medium text-slate-500">No branches found matching your search.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Branch / Church Info</th>
              <th>Permit Status</th>
              <th>Contact & Digital</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="branch in branches" :key="branch.id" class="row-hover">
              <td class="branch-info-cell">
                <div class="flex items-center gap-3">
                  <div class="branch-logo-placeholder shadow-sm" :class="{ 'initials-bg': !branch.logo }">
                    <img v-if="branch.logo" :src="branch.logo" class="logo-img" />
                    <span v-else class="initials">{{ getInitials(branch.name) }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-800">{{ branch.nama_resmi_gereja || branch.name }}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="badge-pill code">{{ branch.code }}</span>
                      <span class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{{ branch.sinode || 'Independent' }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="branch.nomor_izin" class="permit-info">
                  <span class="badge-pill permit">
                    <FileCheck size="12" /> {{ branch.jenis_izin || 'Standard' }}
                  </span>
                  <div class="text-[11px] mt-1 text-slate-500 font-medium">{{ branch.nomor_izin }}</div>
                </div>
                <span v-else class="text-xs text-slate-400 italic">No permit data</span>
              </td>
              <td class="contact-cell">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                    <Phone size="12" class="text-indigo-400" /> <span>{{ branch.phone || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                    <Globe size="12" class="text-indigo-400" /> <span>{{ branch.website || '-' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(branch)" title="Edit Branch" :disabled="saving">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(branch)" title="Delete Branch" :disabled="saving">
                    <Trash2 size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Section -->
        <div class="pagination-footer">
          <div class="per-page-selector">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SHOWING</span>
            <select v-model="pagination.per_page" @change="fetchBranches(1)" :disabled="saving">
              <option :value="10">10 entries</option>
              <option :value="25">25 entries</option>
              <option :value="50">50 entries</option>
              <option :value="100">100 entries</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> <span class="text-slate-400 mx-1">of</span> <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button class="page-btn" :disabled="pagination.current_page === 1 || saving" @click="fetchBranches(pagination.current_page - 1)">
                <ChevronLeft size="18" />
              </button>
              <button class="page-btn" :disabled="pagination.current_page === pagination.last_page || saving" @click="fetchBranches(pagination.current_page + 1)">
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
        <div class="modal-content large">
          <div class="modal-header">
            <div class="header-icon">
              <Church v-if="!editingId" size="24" />
              <Settings v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Branch' : 'Register New Branch' }}</h2>
              <p>{{ editingId ? 'Modify configuration and branch details' : 'Fill in the information below to create a new branch profile' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>

          <!-- Tabs Navigation -->
          <div class="modal-tabs">
            <button class="tab-btn" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">
              <Info size="16" /> General Info
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'permits' }" @click="activeTab = 'permits'">
              <ShieldCheck size="16" /> Permits & Legal
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'contact' }" @click="activeTab = 'contact'">
              <MessageSquare size="16" /> Contact & Social
            </button>
          </div>
          
          <form @submit.prevent="saveBranch" class="modal-body custom-scrollbar">
            <!-- TAB: General -->
            <div v-show="activeTab === 'general'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">Nama Resmi Gereja</label>
                  <div class="input-wrapper">
                    <Church size="18" class="input-icon" />
                    <input v-model="form.nama_resmi_gereja" type="text" placeholder="Gereja Kristen Indonesia..." :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Display Name / Alias</label>
                  <div class="input-wrapper">
                    <Tag size="18" class="input-icon" />
                    <input v-model="form.name" type="text" required placeholder="GKI Cabang..." :disabled="saving" />
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Branch Code</label>
                  <div class="input-wrapper">
                    <Hash size="18" class="input-icon" />
                    <input v-model="form.code" type="text" placeholder="B-001" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Sinode</label>
                  <div class="input-wrapper">
                    <Layout size="18" class="input-icon" />
                    <input v-model="form.sinode" type="text" placeholder="Sinode GKI" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Negara</label>
                  <div class="input-wrapper">
                    <Flag size="18" class="input-icon" />
                    <input v-model="form.negara" type="text" placeholder="Indonesia" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Provinsi</label>
                  <div class="input-wrapper">
                    <Map size="18" class="input-icon" />
                    <select v-model="form.province_id" @change="fetchRegencies" :disabled="saving" class="styled-select">
                      <option value="">Select Province</option>
                      <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Kota / Kabupaten</label>
                  <div class="input-wrapper">
                    <MapPin size="18" class="input-icon" />
                    <select v-model="form.regency_id" :disabled="!form.province_id || saving" class="styled-select">
                      <option value="">Select City</option>
                      <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group span-2">
                  <label class="form-label">Alamat Lengkap</label>
                  <div class="input-wrapper">
                    <Navigation size="18" class="input-icon" />
                    <input v-model="form.address" type="text" placeholder="Jl. Contoh No. 123" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Kode Pos</label>
                  <div class="input-wrapper">
                    <Inbox size="18" class="input-icon" />
                    <input v-model="form.kode_pos" type="text" placeholder="12345" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Logo Gereja</label>
                  <div class="file-picker-container">
                    <div v-if="form.logo" class="preview-box">
                      <img :src="form.logo" class="preview-img" alt="Logo Preview" />
                      <button type="button" class="remove-file" @click="form.logo = ''">
                        <X size="14" />
                      </button>
                    </div>
                    <label v-else class="file-dropzone" :class="{ disabled: saving }">
                      <input type="file" accept="image/*" class="hidden-input" @change="handleFileChange($event, 'logo')" :disabled="saving" />
                      <div class="dropzone-content">
                        <Upload size="20" class="text-slate-400" />
                        <span>Upload Logo</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Permits -->
            <div v-show="activeTab === 'permits'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Jenis Izin</label>
                  <div class="input-wrapper">
                    <FileBadge size="18" class="input-icon" />
                    <input v-model="form.jenis_izin" type="text" placeholder="IMB / SK" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Nama Izin</label>
                  <div class="input-wrapper">
                    <FileText size="18" class="input-icon" />
                    <input v-model="form.nama_izin" type="text" placeholder="Izin Mendirikan Bangunan" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group span-2">
                  <label class="form-label">Nomor Izin</label>
                  <div class="input-wrapper">
                    <Bookmark size="18" class="input-icon" />
                    <input v-model="form.nomor_izin" type="text" placeholder="XXXX/YYYY/ZZZZ" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Tahun Izin</label>
                  <div class="input-wrapper">
                    <Calendar size="18" class="input-icon" />
                    <input v-model="form.tahun_izin" type="text" placeholder="2023" maxlength="4" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Tanggal Terbit</label>
                  <div class="input-wrapper">
                    <Clock size="18" class="input-icon" />
                    <input v-model="form.tanggal_terbit_izin" type="date" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Instansi Penerbit</label>
                  <div class="input-wrapper">
                    <Building size="18" class="input-icon" />
                    <input v-model="form.penerbit_izin" type="text" placeholder="Dinas Penanaman Modal" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Dokumen Izin</label>
                  <div class="file-picker-container">
                    <div v-if="form.file_izin" class="file-indicator">
                      <div class="flex items-center gap-2">
                        <FileText size="18" class="text-indigo-500" />
                        <span class="text-xs font-medium text-slate-600 truncate max-w-[150px]">Document Selected</span>
                      </div>
                      <button type="button" class="remove-file" @click="form.file_izin = ''">
                        <X size="14" />
                      </button>
                    </div>
                    <label v-else class="file-dropzone compact" :class="{ disabled: saving }">
                      <input type="file" @change="handleFileChange($event, 'file_izin')" class="hidden-input" :disabled="saving" />
                      <div class="dropzone-content">
                        <LinkIcon size="16" class="text-slate-400" />
                        <span>Upload File</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Digital -->
            <div v-show="activeTab === 'contact'" class="tab-pane">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Telepon Kantor</label>
                  <div class="input-wrapper">
                    <Phone size="18" class="input-icon" />
                    <input v-model="form.phone" type="text" placeholder="021-..." :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Official</label>
                  <div class="input-wrapper">
                    <Mail size="18" class="input-icon" />
                    <input v-model="form.email" type="email" placeholder="church@example.com" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">WhatsApp</label>
                  <div class="input-wrapper">
                    <MessageCircle size="18" class="input-icon" />
                    <input v-model="form.whatsapp" type="text" placeholder="+62..." :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Website</label>
                  <div class="input-wrapper">
                    <Globe size="18" class="input-icon" />
                    <input v-model="form.website" type="text" placeholder="www.yourchurch.org" :disabled="saving" />
                  </div>
                </div>
                
                <h3 class="section-divider span-2">SOCIAL PLATFORMS</h3>
                
                <div class="form-group">
                  <label class="form-label social-label insta">Instagram</label>
                  <div class="input-wrapper">
                    <Instagram size="18" class="input-icon insta-icon" />
                    <input v-model="form.instagram" type="text" placeholder="@yourchurch" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label social-label fb">Facebook</label>
                  <div class="input-wrapper">
                    <Facebook size="18" class="input-icon fb-icon" />
                    <input v-model="form.facebook" type="text" placeholder="facebook.com/..." :disabled="saving" />
                  </div>
                </div>
                <div class="form-group span-2">
                  <label class="form-label social-label yt">YouTube Channel</label>
                  <div class="input-wrapper">
                    <Youtube size="18" class="input-icon yt-icon" />
                    <input v-model="form.youtube" type="text" placeholder="youtube.com/c/..." :disabled="saving" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Cancel</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Saving...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Branch' : 'Register Branch' }}</span>
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
import { 
  Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  Building2, Mail, Phone, MapPin, Tag, Hash, Layout, Check, 
  Church, FileCheck, Globe, Info, ShieldCheck, MessageSquare,
  Flag, Map, Navigation, Inbox, Image, FileBadge, FileText, Bookmark,
  Calendar, Clock, Building, Link as LinkIcon, MessageCircle, Instagram, 
  Facebook, Youtube, Settings, Upload
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

// State
const branches = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const timer = ref(null);
const activeTab = ref('general');

const provinces = ref([]);
const regencies = ref([]);

const pagination = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

const form = ref({
  name: '', code: '', address: '', phone: '', email: '',
  nama_resmi_gereja: '', sinode: '', logo: '', province_id: '',
  regency_id: '', kode_pos: '', negara: 'Indonesia', jenis_izin: '',
  nama_izin: '', nomor_izin: '', tahun_izin: '', tanggal_terbit_izin: '',
  penerbit_izin: '', file_izin: '', whatsapp: '', website: '',
  instagram: '', facebook: '', youtube: ''
});

// Logic
const fetchProvinces = async () => {
  try {
    const res = await axios.get('/provinces');
    provinces.value = res.data;
  } catch (e) {
    console.error('Provinces fetch error', e);
  }
};

const fetchRegencies = async () => {
  if (!form.value.province_id) return (regencies.value = []);
  try {
    const res = await axios.get(`/regencies/${form.value.province_id}`);
    regencies.value = res.data;
  } catch (e) {
    console.error('Regencies fetch error', e);
  }
};

const fetchBranches = async (page = 1) => {
  loading.value = true;
  try {
    const response = await axios.get('/branches', {
      params: { page, per_page: pagination.value.per_page, search: searchQuery.value }
    });
    branches.value = response.data.data;
    const { current_page, last_page, per_page, total, from, to } = response.data;
    pagination.value = { current_page, last_page, per_page, total, from, to };
  } catch (error) {
    console.error('Fetch error', error);
  } finally {
    loading.value = false;
  }
};

const debounceSearch = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => fetchBranches(1), 500);
};

const handleFileChange = (event, field) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    form.value[field] = e.target.result;
  };
  reader.readAsDataURL(file);
};

const openModal = async (branch = null) => {
  activeTab.value = 'general';
  if (branch) {
    editingId.value = branch.id;
    form.value = { ...branch };
    if (branch.province_id) await fetchRegencies();
  } else {
    editingId.value = null;
    form.value = {
      name: '', code: '', address: '', phone: '', email: '',
      nama_resmi_gereja: '', sinode: '', logo: '', province_id: '',
      regency_id: '', kode_pos: '', negara: 'Indonesia', jenis_izin: '',
      nama_izin: '', nomor_izin: '', tahun_izin: '', tanggal_terbit_izin: '',
      penerbit_izin: '', file_izin: '', whatsapp: '', website: '',
      instagram: '', facebook: '', youtube: ''
    };
    regencies.value = [];
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
};

const saveBranch = async () => {
  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/branches/${editingId.value}`, form.value);
    } else {
      await axios.post('/branches', form.value);
    }
    await fetchBranches(pagination.value.current_page);
    closeModal();
    Swal.fire({ icon: 'success', title: 'Success!', text: 'Branch data updated.', timer: 2000, showConfirmButton: false });
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Save failed', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (branch) => {
  const result = await Swal.fire({
    title: 'Delete Branch?',
    text: `Confirm deleting ${branch.name}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete'
  });
  if (result.isConfirmed) {
    try {
      await axios.delete(`/branches/${branch.id}`);
      await fetchBranches(pagination.value.current_page);
      Swal.fire('Deleted!', 'Branch removed.', 'success');
    } catch (e) {
      Swal.fire('Error', 'Delete failed', 'error');
    }
  }
};

const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

onMounted(() => {
  fetchBranches();
  fetchProvinces();
});
</script>

<style scoped>
.branches-page {
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

.btn-lg {
  padding: 0.875rem 2rem;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table Section */
.card {
  background: white;
  border-radius: 1rem;
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
  padding: 1rem 1.5rem;
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

.branch-logo-placeholder {
  width: 44px;
  height: 44px;
  background: #f1f5f9;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.initials-bg {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
}

.initials {
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.75rem;
}

.badge-pill {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 700;
}

.badge-pill.code { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.badge-pill.permit { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }

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
  border-radius: 0.5rem;
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

.modal-content.large {
  max-width: 850px;
}

.modal-content {
  background: white;
  width: 100%;
  border-radius: 1.25rem;
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
  gap: 1.25rem;
  position: relative;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
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
}

/* Tab Navigation */
.modal-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  padding: 0 1.5rem;
}

.tab-btn {
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  position: relative;
  transition: all 0.2s;
}

.tab-btn.active { color: #6366f1; }
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #6366f1;
}

/* Modal Body */
.modal-body {
  padding: 2rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.span-2 { grid-column: span 2; }

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

.input-wrapper input, .styled-select {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.input-wrapper input:focus, .styled-select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.styled-select {
  appearance: none;
  cursor: pointer;
}

/* New File Picker Styles */
.file-picker-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-box {
  position: relative;
  width: 80px;
  height: 80px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-file {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-dropzone {
  flex: 1;
  height: 80px;
  border: 2px dashed #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-dropzone:hover:not(.disabled) {
  border-color: #6366f1;
  background: #f5f3ff;
}

.file-dropzone.compact {
  height: 48px;
}

.hidden-input {
  display: none;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.file-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
}

.section-divider {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.1em;
  margin-top: 1rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.5rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Pagination Section */
.pagination-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
}

.per-page-selector select {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  background: white;
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.page-info {
  font-size: 0.8rem;
  color: #6b7280;
}

.page-buttons {
  display: flex;
  gap: 0.5rem;
}

.page-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Social Icon Colors */
.insta-icon { color: #ec4899; }
.fb-icon { color: #1877f2; }
.yt-icon { color: #ff0000; }

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.tab-pane {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state, .empty-state {
  padding: 4rem;
  text-align: center;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid #f1f5f9;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
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

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
</style>

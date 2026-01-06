<template>
  <div class="master-data-page">
    <!-- Header Section -->
    <div class="header-section" v-if="request">
      <div class="header-left">
        <button class="back-btn" @click="router.push({ name: 'ServiceRequestList' })">
          <ArrowLeft size="20" />
        </button>
        <div class="title-group">
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ request.request_number }}</h1>
            <span :class="['status-badge', 'tr-' + request.status]">
              {{ formatStatus(request.status) }}
            </span>
          </div>
          <p class="page-subtitle">Layanan: {{ request.service_type?.name }}</p>
        </div>
      </div>
      <div class="header-actions" v-if="auth.user?.can_approve_service">
          <button v-if="request.status === 'pending'" class="btn btn-primary" @click="updateStatus('approved')">
            <Check size="18" /> <span>Setujui</span>
          </button>
          <button v-if="request.status === 'pending'" class="btn btn-danger" @click="updateStatus('rejected')">
            <X size="18" /> <span>Tolak</span>
          </button>
          <button v-if="request.status === 'scheduled'" class="btn btn-success" @click="updateStatus('completed')">
            <CheckCircle size="18" /> <span>Selesaikan</span>
          </button>
      </div>
    </div>

    <div v-if="!request" class="loading-full">
        <div class="spinner"></div>
        <p>Memuat detail permintaan...</p>
    </div>

    <div v-else class="detail-container">
        <div class="detail-grid">
            <!-- Main Column -->
            <div class="main-column">
                <!-- Info Card -->
                <div class="card info-card mb-6">
                    <div class="card-header">
                        <div class="card-icon"><Briefcase size="18" /></div>
                        <h3 class="card-title">Informasi Layanan & Jemaat</h3>
                    </div>
                    <div class="card-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Nama Jemaat</label>
                                <p class="text-dark font-bold">{{ request.member?.nama_lengkap }}</p>
                            </div>
                            <div class="info-item">
                                <label>NIK / Identitas</label>
                                <p>{{ request.member?.nik || '-' }}</p>
                            </div>
                            <div class="info-item">
                                <label>No. Telepon</label>
                                <p>{{ request.member?.no_hp || '-' }}</p>
                            </div>
                            <div class="info-item">
                                <label>Kategori Layanan</label>
                                <p><span class="category-tag">{{ request.service_type?.category?.name }}</span></p>
                            </div>
                            <div class="info-item full">
                                <label>Daftar Pesyaratan</label>
                                <div class="requirements-list">
                                    <div v-for="req in request.service_type?.requirements" :key="req.id" class="req-item">
                                        <CheckCircle v-if="hasDocument(req.name)" size="14" class="text-success" />
                                        <AlertCircle v-else size="14" class="text-warning" />
                                        <span>{{ req.name }} <small v-if="req.is_required" class="text-danger">*</small></span>
                                    </div>
                                </div>
                            </div>
                             <div class="info-item full" v-if="request.notes">
                                <label>Catatan Tambahan</label>
                                <div class="notes-box">{{ request.notes }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Documents Card -->
                <div class="card doc-card">
                    <div class="card-header">
                        <div class="card-icon"><FileText size="18" /></div>
                        <h3 class="card-title">Berkas & Dokumen</h3>
                        <label class="upload-btn" v-if="request.status !== 'completed' && request.status !== 'rejected'">
                            <input type="file" ref="fileInput" @change="handleFileUpload" hidden />
                            <UploadCloud size="16" /> <span>Upload</span>
                        </label>
                    </div>
                    <div class="card-body p-0">
                        <div v-if="request.documents?.length === 0" class="empty-docs">
                             <FileText size="32" class="mb-2 opacity-50" />
                             <p>Belum ada dokumen yang diunggah.</p>
                        </div>
                        <div v-else class="table-container">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>Nama Berkas</th>
                                        <th>Waktu Unggah</th>
                                        <th class="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="doc in request.documents" :key="doc.id" class="row-hover">
                                        <td>
                                            <div class="flex items-center gap-2">
                                                <div class="file-thumb"><FileText size="14" /></div>
                                                <span class="font-bold text-dark">{{ doc.document_name }}</span>
                                            </div>
                                        </td>
                                        <td class="text-xs text-muted">{{ formatDate(doc.uploaded_at) }}</td>
                                        <td class="text-right">
                                            <a :href="getFileUrl(doc.file_path)" target="_blank" class="action-btn-small" title="Lihat">
                                                <ExternalLink size="14" />
                                            </a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar Column -->
            <div class="sidebar-column">
                <!-- Schedule Card -->
                <div class="card mb-6">
                    <div class="card-header">
                        <div class="card-icon"><Calendar size="18" /></div>
                        <h3 class="card-title">Jadwal</h3>
                        <button v-if="request.status !== 'completed' && request.status !== 'rejected' && auth.user?.can_approve_service" 
                                class="icon-link-btn" @click="showScheduleModal = true">
                            <Edit size="16" />
                        </button>
                    </div>
                    <div class="card-body">
                         <div v-if="request.schedule" class="schedule-display">
                            <div class="sch-item">
                                <Clock size="14" class="text-indigo" /> 
                                <span>{{ formatDate(request.schedule.start_datetime) }}</span>
                            </div>
                            <div class="sch-item" v-if="request.schedule.location">
                                <MapPin size="14" class="text-indigo" /> 
                                <span>{{ request.schedule.location }}</span>
                            </div>
                         </div>
                         <div v-else class="text-muted text-xs italic">Belum ada jadwal yang diatur.</div>
                    </div>
                </div>

                <!-- Team Card -->
                <div class="card mb-6">
                    <div class="card-header">
                        <div class="card-icon"><Users size="18" /></div>
                        <h3 class="card-title">Petugas</h3>
                        <button v-if="request.status !== 'completed' && request.status !== 'rejected' && auth.user?.can_approve_service"
                                class="icon-link-btn" @click="showAssignModal = true">
                            <Plus size="16" />
                        </button>
                    </div>
                    <div class="card-body p-0">
                         <div v-if="request.assignments?.length === 0" class="p-5 text-center text-muted text-xs italic">
                            Petugas belum ditugaskan.
                         </div>
                         <div v-else class="assignment-list">
                            <div v-for="assign in request.assignments" :key="assign.id" class="assign-item">
                                <div class="user-avatar">{{ assign.user?.name?.charAt(0) }}</div>
                                <div class="assign-info">
                                    <div class="user-name">{{ assign.user?.name }}</div>
                                    <div class="user-role">{{ assign.position?.name || 'Petugas' }}</div>
                                </div>
                                <button v-if="request.status !== 'completed' && auth.user?.can_approve_service" class="delete-assign" @click="removeAssignment(assign.id)">
                                    <X size="14" />
                                </button>
                            </div>
                         </div>
                    </div>
                </div>

                <!-- History Timeline -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon"><History size="18" /></div>
                        <h3 class="card-title">Riwayat</h3>
                    </div>
                    <div class="card-body p-0">
                        <div class="timeline">
                            <div v-for="h in request.histories" :key="h.id" class="timeline-item">
                                <div class="timeline-point"></div>
                                <div class="timeline-content">
                                    <div class="tm-header">
                                        <span class="tm-status">{{ formatStatus(h.status_to || 'Created') }}</span>
                                        <span class="tm-date">{{ formatDateShort(h.created_at) }}</span>
                                    </div>
                                    <p class="tm-notes" v-if="h.notes">{{ h.notes }}</p>
                                    <p class="tm-user">Oleh: {{ h.user?.name || 'Sistem' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <Transition name="modal-fade">
        <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="header-icon"><Calendar size="24" /></div>
                    <div class="header-text">
                        <h2>Ubah Jadwal</h2>
                        <p>Waktu dan lokasi pelaksanaan layanan</p>
                    </div>
                    <button class="close-btn" @click="showScheduleModal = false"><X size="20" /></button>
                </div>
                <form @submit.prevent="saveSchedule" class="modal-body">
                    <div class="form-group mb-4">
                        <label class="form-label">Waktu Mulai</label>
                        <input v-model="scheduleForm.start_datetime" type="datetime-local" class="modal-input" required />
                    </div>
                    <div class="form-group mb-4">
                        <label class="form-label">Waktu Selesai</label>
                        <input v-model="scheduleForm.end_datetime" type="datetime-local" class="modal-input" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Lokasi</label>
                        <input v-model="scheduleForm.location" type="text" class="modal-input" placeholder="Contoh: Gereja Utama" />
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showScheduleModal = false">Batal</button>
                        <button type="submit" class="btn btn-primary">Simpan Jadwal</button>
                    </div>
                </form>
            </div>
        </div>
    </Transition>

    <Transition name="modal-fade">
        <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="header-icon"><Users size="24" /></div>
                    <div class="header-text">
                        <h2>Tugaskan Petugas</h2>
                        <p>Pilih petugas untuk membantu layanan ini</p>
                    </div>
                    <button class="close-btn" @click="showAssignModal = false"><X size="20" /></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Cari User / Staff</label>
                        <div class="autocomplete-wrapper">
                            <input v-model="userSearch" @input="searchUsers" type="text" placeholder="Ketik nama user..." class="modal-input"/>
                            <Transition name="fade-slide">
                                <div v-if="userResults.length > 0" class="autocomplete-results">
                                    <div v-for="u in userResults" :key="u.id" class="result-item" @click="selectUser(u)">
                                        <div class="font-bold text-dark">{{ u.name }}</div>
                                        <div class="text-xs text-muted">{{ u.email }}</div>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                    <div v-if="assignForm.user_id" class="selected-member-card mt-4">
                        <div class="check-icon"><CheckCircle size="18" /></div>
                        <div class="member-info">
                            <div class="member-name">{{ selectedUserName }}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showAssignModal = false">Batal</button>
                        <button type="button" class="btn btn-primary" @click="saveAssignment" :disabled="!assignForm.user_id">Tugaskan</button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import Swal from 'sweetalert2';
import { 
    ArrowLeft, Check, X, CheckCircle, AlertCircle, UploadCloud, FileText, Eye, Calendar, MapPin, Plus, 
    Briefcase, ExternalLink, History, Clock, Edit, Users
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const requestId = route.params.id;

const request = ref(null);
const fileInput = ref(null);
const showScheduleModal = ref(false);
const showAssignModal = ref(false);
const saving = ref(false);

const scheduleForm = ref({
    start_datetime: '',
    end_datetime: '',
    location: ''
});

const userSearch = ref('');
const userResults = ref([]);
const selectedUserName = ref('');
const assignForm = ref({ user_id: null });
const searchTimer = ref(null);

const fetchDetail = async () => {
    try {
        const response = await axios.get(`/service-requests/${requestId}`);
        request.value = response.data;
        if (request.value.schedule) {
            const toLocalISO = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                const offset = date.getTimezoneOffset() * 60000;
                return (new Date(date - offset)).toISOString().slice(0, 16);
            };
            scheduleForm.value = {
                start_datetime: toLocalISO(request.value.schedule.start_datetime),
                end_datetime: toLocalISO(request.value.schedule.end_datetime),
                location: request.value.schedule.location
            };
        }
    } catch (e) {
        Swal.fire('Error', 'Gagal memuat detail', 'error');
        router.push({ name: 'ServiceRequestList' });
    }
};

const updateStatus = async (status) => {
    const { value: notes } = await Swal.fire({
        title: 'Konfirmasi',
        text: `Ubah status menjadi ${formatStatus(status)}?`,
        input: 'textarea',
        inputPlaceholder: 'Tambahkan catatan...',
        showCancelButton: true
    });
    if (notes === undefined) return;

    try {
        await axios.put(`/service-requests/${requestId}/status`, { status, notes });
        fetchDetail();
        Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1500, showConfirmButton: false });
    } catch (e) { Swal.fire('Error', 'Gagal update status', 'error'); }
};

const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { value: docName } = await Swal.fire({
        title: 'Nama Dokumen',
        input: 'text',
        inputValue: file.name,
        showCancelButton: true
    });
    if (!docName) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_name', docName);

    try {
        await axios.post(`/service-requests/${requestId}/documents`, formData);
        fetchDetail();
        Swal.fire('Uploaded', 'Dokumen berhasil diunggah', 'success');
    } catch (e) { Swal.fire('Error', 'Gagal upload', 'error'); }
};

const hasDocument = (name) => request.value.documents?.some(d => d.document_name.toLowerCase().includes(name.toLowerCase()));

const saveSchedule = async () => {
    try {
        await axios.post(`/service-requests/${requestId}/schedule`, scheduleForm.value);
        showScheduleModal.value = false;
        fetchDetail();
        Swal.fire('Success', 'Jadwal disimpan', 'success');
    } catch (e) { Swal.fire('Error', 'Gagal simpan jadwal', 'error'); }
};

const searchUsers = () => {
     clearTimeout(searchTimer.value);
     searchTimer.value = setTimeout(async () => {
         try {
             const res = await axios.get('/users', { params: { search: userSearch.value } });
             userResults.value = res.data.data;
         } catch(e) {}
     }, 300);
};

const selectUser = (u) => {
    assignForm.value.user_id = u.id;
    selectedUserName.value = u.name;
    userResults.value = [];
    userSearch.value = u.name;
};

const saveAssignment = async () => {
    if (!assignForm.value.user_id) return;
    try {
        await axios.post(`/service-requests/${requestId}/assignments`, assignForm.value);
        showAssignModal.value = false;
        fetchDetail();
        assignForm.value.user_id = null;
        userSearch.value = '';
    } catch (e) { Swal.fire('Error', 'Gagal assign', 'error'); }
};

const removeAssignment = async (assignId) => {
    const res = await Swal.fire({ title: 'Hapus petugas?', icon: 'warning', showCancelButton: true });
    if (!res.isConfirmed) return;
     try {
        await axios.delete(`/service-requests/assignments/${assignId}`);
        fetchDetail();
    } catch (e) { Swal.fire('Error', 'Gagal hapus', 'error'); }
};

const getFileUrl = (path) => `${import.meta.env.VITE_API_URL}/storage/${path}`;
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
const formatStatus = (s) => ({
    pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
    scheduled: 'Dijadwalkan', completed: 'Selesai', cancelled: 'Batal'
}[s] || s);

onMounted(() => fetchDetail());
</script>

<style scoped>
.master-data-page {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-left { display: flex; align-items: center; gap: 1.5rem; }

.back-btn {
    width: 44px; height: 44px;
    background: white; border: 1px solid #e2e8f0; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b; transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.back-btn:hover { color: #6366f1; border-color: #6366f1; transform: translateX(-3px); }

.page-title { font-size: 1.875rem; font-weight: 800; color: #111827; margin: 0; }
.page-subtitle { color: #6b7280; font-size: 0.95rem; margin: 0; }

.header-actions { display: flex; gap: 0.75rem; }

.detail-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
}

/* Card Styling */
.card {
    background: white; border-radius: 1.25rem; border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;
}
.card-header {
    padding: 1.25rem 1.75rem; border-bottom: 1px solid #f1f5f9;
    background: #fcfcfd; display: flex; align-items: center; gap: 1rem;
}
.card-icon {
    width: 32px; height: 32px; background: white; border: 1px solid #e2e8f0;
    border-radius: 0.625rem; display: flex; align-items: center; justify-content: center;
    color: #6366f1;
}
.card-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; flex: 1; }
.card-body { padding: 1.75rem; }

/* Info Grid */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.info-item label { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.25rem; }
.info-item p { font-size: 0.95rem; color: #334155; margin: 0; }
.info-item.full { grid-column: 1 / -1; }

.category-tag { background: #eef2ff; color: #6366f1; font-size: 0.65rem; font-weight: 800; padding: 0.125rem 0.5rem; border-radius: 0.5rem; }

.requirements-list { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; }
.req-item {
    display: flex; align-items: center; gap: 0.35rem; background: #f8fafc;
    border: 1px solid #e2e8f0; padding: 0.25rem 0.75rem; border-radius: 0.5rem;
    font-size: 0.75rem; font-weight: 600;
}

.notes-box { background: #fffbeb; border: 1px solid #fef3c7; padding: 1rem; border-radius: 0.75rem; font-style: italic; color: #92400e; font-size: 0.875rem; }

/* Documents */
.upload-btn {
    display: inline-flex; align-items: center; gap: 0.5rem; background: #6366f1;
    color: white; padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.8125rem;
    font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.upload-btn:hover { background: #4f46e5; }
.empty-docs { padding: 3rem; text-align: center; color: #94a3b8; }

.modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.modern-table th { background: #f9fafb; padding: 0.75rem 1.5rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
.modern-table td { padding: 1rem 1.5rem; font-size: 0.875rem; vertical-align: middle; border-bottom: 1px solid #f3f4f6; }

.file-thumb { width: 28px; height: 28px; background: #f1f5f9; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #64748b; }

.action-btn-small { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }

/* Schedule */
.schedule-display { background: #f5f3ff; border: 1px solid #c7d2fe; padding: 1rem; border-radius: 0.875rem; }
.sch-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; color: #4b5563; font-size: 0.875rem; font-weight: 500; }
.sch-item:last-child { margin-bottom: 0; }

/* Assignments */
.assignment-list { padding: 0.5rem 0; }
.assign-item { padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #f1f5f9; position: relative; }
.assign-item:last-child { border-bottom: none; }
.user-avatar { width: 36px; height: 36px; background: #6366f1; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.875rem; }
.assign-info { flex: 1; }
.user-name { font-weight: 700; color: #1e293b; font-size: 0.875rem; }
.user-role { font-size: 0.75rem; color: #64748b; }
.delete-assign { opacity: 0; background: #fee2e2; color: #ef4444; border: none; width: 28px; height: 28px; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.assign-item:hover .delete-assign { opacity: 1; }

/* Timeline */
.timeline { padding: 1.5rem; position: relative; }
.timeline::before { content: ''; position: absolute; left: 1.85rem; top: 1.5rem; bottom: 1.5rem; width: 2px; background: #e2e8f0; }
.timeline-item { position: relative; padding-left: 2rem; margin-bottom: 1.5rem; }
.timeline-point { position: absolute; left: 0.125rem; top: 0.25rem; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; border: 3px solid white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); z-index: 1; }
.tm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
.tm-status { font-weight: 800; font-size: 0.75rem; color: #1e293b; text-transform: uppercase; }
.tm-date { font-size: 0.7rem; color: #94a3b8; }
.tm-notes { font-size: 0.8125rem; color: #4b5563; background: #f1f5f9; padding: 0.5rem; border-radius: 0.5rem; margin: 0.5rem 0; font-style: italic; }
.tm-user { font-size: 0.75rem; color: #94a3b8; }

/* Status Badges */
.status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; }
.status-badge.tr-pending { background: #fef3c7; color: #d97706; }
.status-badge.tr-approved { background: #dbeafe; color: #2563eb; }
.status-badge.tr-scheduled { background: #e0e7ff; color: #4f46e5; }
.status-badge.tr-completed { background: #dcfce7; color: #166534; }
.status-badge.tr-rejected { background: #fee2e2; color: #991b1b; }
.status-badge.tr-cancelled { background: #f1f5f9; color: #64748b; }

/* Buttons */
.btn { padding: 0.625rem 1.25rem; border-radius: 0.875rem; font-weight: 700; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; border: none; }
.btn-primary { background: #6366f1; color: white; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2); }
.btn-success { background: #10b981; color: white; }
.btn-danger { background: #ef4444; color: white; }
.btn-secondary { background: white; border: 1px solid #e2e8f0; color: #64748b; }
.btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }

.icon-link-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.25rem; border-radius: 0.5rem; transition: all 0.2s; }
.icon-link-btn:hover { background: #f1f5f9; color: #6366f1; }

.loading-full { padding: 10rem 0; text-align: center; color: #64748b; }
.spinner { width: 2.5rem; height: 2.5rem; border: 3px solid #eef2ff; border-top-color: #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.25rem; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem; }
.modal-content { background: white; width: 100%; max-width: 500px; border-radius: 1.25rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
.modal-header { padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 1.25rem; position: relative; }
.header-text h2 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
.header-text p { font-size: 0.875rem; color: #64748b; }
.close-btn { position: absolute; top: 1.25rem; right: 1.25rem; background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; }
.modal-body { padding: 2rem; }
.modal-footer { margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem; }
.modal-input { width: 100%; padding: 0.75rem 1rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.95rem; color: #1e293b; }
.form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; }

/* Autocomplete */
.autocomplete-wrapper { position: relative; }
.autocomplete-results { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; margin-top: 0.5rem; z-index: 100; box-shadow: 0 10px 15px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; }
.result-item { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
.result-item:hover { background: #f5f3ff; }

.selected-member-card { padding: 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; }
.check-icon { color: #10b981; }
.member-name { font-weight: 700; color: #166534; }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-content { animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes modal-in { from { transform: scale(0.95) translateY(10px); } to { transform: scale(1) translateY(0); } }

.mb-6 { margin-bottom: 1.5rem; }
.p-0 { padding: 0 !important; }
.text-indigo { color: #6366f1; }
.font-bold { font-weight: 700; }
.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }
.text-danger { color: #ef4444; }
.text-warning { color: #f59e0b; }
.text-success { color: #10b981; }
.text-muted { color: #94a3b8; }
.text-dark { color: #1e293b; }
.text-xs { font-size: 0.75rem; }
.italic { font-style: italic; }
</style>


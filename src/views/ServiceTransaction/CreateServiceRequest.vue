<template>
  <div class="master-data-page">
    <div class="header-section">
      <div class="header-left">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft size="20" />
        </button>
        <div class="title-group">
          <h1 class="page-title">Buat Permintaan Layanan</h1>
          <p class="page-subtitle">Buat permohonan layanan baru untuk jemaat</p>
        </div>
      </div>
    </div>

    <div class="form-container-centered">
         <form @submit.prevent="submitRequest" class="card premium-form-card">
              <div class="form-section">
                   <div class="section-header">
                       <div class="header-icon-small"><FilePlus size="18" /></div>
                       <h3 class="section-title">Informasi Dasar Permintaan</h3>
                   </div>
                   
                   <!-- Member Selection -->
                   <div class="form-group full-width">
                       <label class="form-label">Cari Jemaat (NIK / Nama)</label>
                         <div v-if="!selectedMember" class="autocomplete-wrapper">
                            <div class="input-wrapper">
                                <Search size="18" class="input-icon"/>
                                <input 
                                    v-model="memberSearch" 
                                    @input="searchMembers"
                                    type="text" 
                                    placeholder="Ketik nama jemaat..." 
                                    :disabled="saving"
                                />
                            </div>
                            <Transition name="fade-slide">
                                <div v-if="showMemberResults && memberResults.length > 0" class="autocomplete-results">
                                    <div 
                                        v-for="m in memberResults" 
                                        :key="m.id" 
                                        class="result-item"
                                        @click="selectMember(m)"
                                    >
                                        <div class="item-main">
                                            <span class="font-bold text-dark">{{ m.nama_lengkap }}</span>
                                            <span class="badge-nik">{{ m.nik }}</span>
                                        </div>
                                        <div class="text-xs text-muted">{{ m.no_hp || 'No HP tidak ada' }}</div>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                        <div v-if="selectedMember" class="selected-member-card">
                            <div class="check-icon"><CheckCircle size="18" /></div>
                            <div class="member-info">
                                <div class="member-name">{{ selectedMember.nama_lengkap }}</div>
                                <div class="member-sub">{{ selectedMember.nik }}</div>
                            </div>
                            <button v-if="auth.user?.can_approve_service" type="button" @click="selectedMember = null; form.member_id = ''" class="remove-btn">
                                <X size="14"/>
                            </button>
                        </div>
                   </div>

                   <!-- Service Type -->
                   <div class="form-group full-width mt-4">
                       <label class="form-label">Jenis Layanan</label>
                       <div class="input-wrapper">
                           <Type size="18" class="input-icon" />
                           <select v-model="form.service_type_id" required :disabled="saving" class="select-input">
                               <option value="">Pilih Layanan</option>
                               <option v-for="type in serviceTypes" :key="type.id" :value="type.id">
                                   {{ type.name }} ({{ type.category?.name }})
                               </option>
                           </select>
                       </div>
                   </div>

                   <!-- Date & Status (Bypass Ops) -->
                   <div class="form-grid mt-4" :class="{ 'single-col': !auth.user?.can_approve_service }">
                       <div class="form-group">
                           <label class="form-label">Tanggal Permintaan</label>
                           <div class="input-wrapper">
                               <Calendar size="18" class="input-icon" />
                               <input v-model="form.requested_at" type="datetime-local" :disabled="saving" required />
                           </div>
                       </div>
                       <div class="form-group" v-if="auth.user?.can_approve_service">
                           <label class="form-label">Status Awal</label>
                           <div class="input-wrapper">
                               <Layers size="18" class="input-icon" />
                               <select v-model="form.status" :disabled="saving" class="select-input">
                                   <option value="pending">Menunggu (Pending)</option>
                                   <option value="approved">Langsung Disetujui</option>
                                   <option value="scheduled">Langsung Dijadwalkan</option>
                                   <option value="completed">Langsung Selesai</option>
                               </select>
                           </div>
                       </div>
                   </div>

                   <!-- Notes -->
                   <div class="form-group full-width mt-4">
                       <label class="form-label">Catatan Tambahan</label>
                       <div class="input-wrapper">
                           <FileText size="18" class="input-icon" style="top: 1rem;" />
                           <textarea v-model="form.notes" rows="3" class="text-area-input" :disabled="saving" placeholder="Keterangan tambahan..."></textarea>
                       </div>
                   </div>
              </div>

              <div class="form-footer">
                  <button type="button" class="btn btn-secondary" @click="router.back()" :disabled="saving">Batal</button>
                   <button type="submit" class="btn btn-primary" :disabled="saving">
                    <template v-if="saving">
                        <div class="spinner small"></div>
                        <span>Menyimpan...</span>
                    </template>
                    <template v-else>
                        <Check size="18" />
                        <span>Buat Permintaan</span>
                    </template>
                   </button>
              </div>
         </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import { 
    ArrowLeft, Search, CheckCircle, X, Check, FilePlus, Calendar, Type, Layers, FileText
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const router = useRouter();

const serviceTypes = ref([]);
const memberSearch = ref('');
const memberResults = ref([]);
const showMemberResults = ref(false);
const selectedMember = ref(null);
const searchTimer = ref(null);
const saving = ref(false);

const now = new Date();
const offset = now.getTimezoneOffset() * 60000;
const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);

const form = ref({
    service_type_id: '',
    member_id: '',
    status: 'pending',
    requested_at: localISOTime,
    notes: ''
});

const fetchServiceTypes = async () => {
    try {
        const response = await axios.get('/service-types', {
            params: { church_id: auth.activeBranch.id, is_active: 1, per_page: 100 }
        });
        serviceTypes.value = response.data.data;
    } catch (e) { console.error(e); }
};

const searchMembers = () => {
    if (memberSearch.value.length < 2) {
        memberResults.value = [];
        showMemberResults.value = false;
        return;
    }

    clearTimeout(searchTimer.value);
    searchTimer.value = setTimeout(async () => {
        try {
            const response = await axios.get('/jemaat', {
                params: { church_id: auth.activeBranch.id, search: memberSearch.value, per_page: 5 }
            });
            memberResults.value = response.data.data;
            showMemberResults.value = true;
        } catch (e) {console.error(e);}
    }, 400);
};

const selectMember = (member) => {
    selectedMember.value = member;
    form.value.member_id = member.id;
    memberSearch.value = member.nama_lengkap;
    showMemberResults.value = false;
};

const submitRequest = async () => {
    if (!form.value.member_id) {
        Swal.fire('Error', 'Pilih jemaat terlebih dahulu', 'error');
        return;
    }
    if (!form.value.service_type_id) {
        Swal.fire('Error', 'Pilih jenis layanan', 'error');
        return;
    }

    saving.value = true;
    try {
        const payload = {
            ...form.value,
            church_id: auth.activeBranch.id
        };
        const response = await axios.post('/service-requests', payload);
        Swal.fire({
            icon: 'success', 
            title: 'Berhasil', 
            text: 'Permintaan layanan dibuat',
            showConfirmButton: false,
            timer: 1500
        });
        router.push({ name: 'ServiceRequestDetail', params: { id: response.data.id } });
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Gagal membuat permintaan', 'error');
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    if (auth.activeBranch) fetchServiceTypes();

    // Auto-select member if not an approver and linked member exists
    if (!auth.user?.can_approve_service && auth.user?.member) {
        selectMember(auth.user.member);
    }
});
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

.header-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
}

.back-btn {
    width: 44px;
    height: 44px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.back-btn:hover {
    color: #6366f1;
    border-color: #6366f1;
    transform: translateX(-3px);
    box-shadow: 0 4px 6px rgba(99, 102, 241, 0.1);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.025em;
  margin: 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.form-container-centered {
    max-width: 680px;
    margin: 0 auto;
}

.card {
    background: white;
    border-radius: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.premium-form-card {
    padding: 0;
}

.form-section {
    padding: 2.5rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1rem;
}

.header-icon-small {
    width: 36px;
    height: 36px;
    background: #eef2ff;
    color: #6366f1;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.form-group {
    margin-bottom: 1.25rem;
}

.full-width { grid-column: 1 / -1; }

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.form-grid.single-col {
    grid-template-columns: 1fr;
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
  pointer-events: none;
}

.input-wrapper input, .select-input, .text-area-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.text-area-input {
  resize: vertical;
  min-height: 100px;
}

.input-wrapper input:focus, .select-input:focus, .text-area-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

/* Autocomplete styling */
.autocomplete-wrapper {
    position: relative;
}

.autocomplete-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    margin-top: 0.5rem;
    z-index: 100;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-height: 280px;
    overflow-y: auto;
}

.result-item {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.2s;
}

.result-item:hover {
    background: #f5f3ff;
}

.item-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
}

.badge-nik {
    font-size: 0.7rem;
    background: #f1f5f9;
    padding: 0.125rem 0.5rem;
    border-radius: 0.5rem;
    color: #64748b;
    font-weight: 700;
}

.selected-member-card {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: slideIn 0.3s ease-out;
}

.check-icon { color: #10b981; }
.member-info { flex: 1; }
.member-name { font-weight: 700; color: #166534; font-size: 0.95rem; }
.member-sub { font-size: 0.75rem; color: #15803d; opacity: 0.8; }
.remove-btn {
    background: #ffffff;
    border: 1px solid #bbf7d0;
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #dc2626;
    transition: all 0.2s;
}
.remove-btn:hover { background: #fee2e2; border-color: #fecaca; }

.form-footer {
    background: #f8fafc;
    padding: 1.5rem 2.5rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    gap: 1.25rem;
}

/* Common Components */
.btn {
    padding: 0.75rem 1.75rem;
    border-radius: 1rem;
    font-weight: 700;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
}

.btn-primary {
    background: #6366f1;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover:not(:disabled) {
    background: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #64748b;
}

.btn-secondary:hover:not(:disabled) {
    background: #f8fafc;
    color: #334155;
    border-color: #cbd5e1;
}

.spinner {
  width: 1.5rem; height: 1.5rem;
  border: 2px solid white; border-top-color: transparent;
  border-radius: 50%; animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mt-4 { margin-top: 1rem; }
.text-xs { font-size: 0.75rem; }
.text-muted { color: #94a3b8; }
.text-dark { color: #1e293b; }
.font-bold { font-weight: 700; }

.select-input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1.25rem;
    padding-right: 2.75rem;
}

/* Transitions */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>


<template>
  <div class="public-page min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
    <div class="max-w-4xl w-full">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-slate-900 mb-2">Pembaruan Data Jemaat</h1>
        <p class="text-slate-500">Silakan verifikasi identitas Anda untuk memperbarui data.</p>
      </div>

      <!-- Step 1: Verification Form -->
      <div v-if="step === 1" class="card verification-card max-w-lg mx-auto shadow-xl bg-white p-8 rounded-2xl border border-slate-100">
        <div class="space-y-6">
          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <div class="input-wrapper">
              <User size="18" class="input-icon" />
              <input v-model="verifyForm.nama_lengkap" @input="toUppercase(verifyForm, 'nama_lengkap')" type="text" placeholder="NAMA LENGKAP SESUAI IDENTITAS" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Jenis Kelamin</label>
              <div class="input-wrapper">
                <Users size="18" class="input-icon" />
                <select v-model="verifyForm.jenis_kelamin">
                  <option value="" disabled>Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tanggal Lahir</label>
              <div class="input-wrapper">
                <Calendar size="18" class="input-icon" />
                <input v-model="verifyForm.tanggal_lahir" type="date" />
              </div>
            </div>
          </div>

          <button @click="verifyIdentity" :disabled="loading" class="btn btn-primary w-full py-3 h-auto text-base flex justify-center items-center gap-2">
            <span v-if="loading" class="spinner small"></span>
            <Search v-else size="20" />
            <span>Verifikasi Data</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Update Form -->
      <div v-else class="card update-card shadow-2xl bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div class="p-6 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold">{{ form.nama_lengkap }}</h2>
            <p class="text-slate-300 text-xs mt-1 uppercase tracking-wider font-mono">ID: {{ form.nik }}</p>
          </div>
          <button @click="step = 1" class="text-slate-300 hover:text-white transition-colors">
            <X size="24" />
          </button>
        </div>

        <div class="modal-tabs px-6 bg-slate-50 border-b">
          <button v-for="t in tabs" :key="t.id" :class="['tab-btn', { active: activeTab === t.id }]" @click="activeTab = t.id">
            <component :is="t.icon" size="16" />
            <span>{{ t.label }}</span>
          </button>
        </div>

        <div class="modal-body p-8 custom-scrollbar max-h-[70vh] overflow-y-auto">
          <!-- Copy logic from Jemaat.vue tabs here -->
          <!-- PRIBADI -->
          <div v-show="activeTab === 'pribadi'" class="tab-pane">
              <div class="photo-upload-section mb-8">
                <div class="photo-preview-container">
                  <div v-if="form.foto" class="photo-preview-wrapper">
                    <img :src="form.foto" alt="Preview Photo" class="photo-preview-image" />
                    <button type="button" class="remove-photo-btn" @click="form.foto = ''" title="Hapus Foto">
                      <X size="14" />
                    </button>
                  </div>
                  <div v-else class="photo-placeholder">
                    <Camera size="32" class="text-slate-300" />
                    <span class="text-[10px] uppercase font-bold text-slate-400 mt-2">Belum ada foto</span>
                  </div>
                </div>
                <div class="photo-upload-controls">
                  <label class="photo-upload-label">
                    <Upload size="16" />
                    <span>Unggah Foto Profil</span>
                    <input type="file" class="hidden" accept="image/*" @change="handlePhotoUpload" />
                  </label>
                  <p class="text-[10px] text-slate-400 mt-2">Maksimal 5MB. Format: JPG, PNG, WEBP.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">Nama Lengkap <span class="text-red-500">*</span></label>
                  <div class="input-wrapper">
                    <User size="18" class="input-icon" />
                    <input v-model="form.nama_lengkap" @input="toUppercase(form, 'nama_lengkap')" type="text" required />
                  </div>
                </div>

                <div class="form-group">
                  <div class="flex justify-between items-end mb-1">
                    <label class="form-label mb-0">NIK <span class="text-red-500">*</span></label>
                    <span :class="['text-[10px] font-bold', nikTouched && !isNikValid() ? 'text-red-500' : 'text-slate-400']">{{ form.nik.length }}/16</span>
                  </div>
                  <div :class="['input-wrapper', { 'error-ring': nikTouched && !isNikValid() }]">
                    <Hash size="18" class="input-icon" />
                    <input v-model="form.nik" @input="restrictNumeric(form, 'nik'); nikTouched = true" @blur="nikTouched = true" type="text" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Nama Panggilan</label>
                  <div class="input-wrapper">
                    <Tag size="18" class="input-icon" />
                    <input v-model="form.nama_panggilan" @input="toUppercase(form, 'nama_panggilan')" type="text" />
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Jenis Kelamin</label>
                  <div class="input-wrapper">
                    <Users size="18" class="input-icon" />
                    <select v-model="form.jenis_kelamin">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tempat Lahir</label>
                  <div class="input-wrapper">
                    <MapPin size="18" class="input-icon" />
                    <input v-model="form.tempat_lahir" @input="toUppercase(form, 'tempat_lahir')" type="text" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Lahir</label>
                  <div class="input-wrapper">
                    <Calendar size="18" class="input-icon" />
                    <input v-model="form.tanggal_lahir" type="date" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Golongan Darah</label>
                  <div class="input-wrapper">
                    <Droplet size="18" class="input-icon" />
                    <select v-model="form.golongan_darah">
                      <option value="">Pilih</option>
                      <option v-for="bg in bloodGroups" :key="bg" :value="bg">{{ bg }}</option>
                    </select>
                  </div>
                </div>
              </div>
          </div>

          <!-- KELUARGA & SOSIAL -->
          <div v-show="activeTab === 'keluarga'" class="tab-pane">
            <div class="form-grid">
              <div class="form-group span-2">
                <div class="flex justify-between items-end mb-1">
                  <label class="form-label mb-0">No. KK <span class="text-red-500">*</span></label>
                  <span :class="['text-[10px] font-bold', kkTouched && !isKkValid() ? 'text-red-500' : 'text-slate-400']">{{ form.no_kk.length }}/16</span>
                </div>
                <div :class="['input-wrapper', { 'error-ring': kkTouched && !isKkValid() }]">
                  <Hash size="18" class="input-icon" />
                  <input v-model="form.no_kk" @input="restrictNumeric(form, 'no_kk'); kkTouched = true" @blur="kkTouched = true" type="text" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Hubungan Keluarga <span class="text-red-500">*</span></label>
                <div class="input-wrapper">
                  <Users size="18" class="input-icon" />
                  <select v-model="form.hubungan_keluarga" required>
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Status Pernikahan</label>
                <div class="input-wrapper">
                  <Heart size="18" class="input-icon" />
                  <select v-model="form.status_pernikahan_id">
                    <option value="">Pilih</option>
                    <option v-for="s in masterData.maritalStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Pendidikan</label>
                <div class="input-wrapper">
                  <GraduationCap size="18" class="input-icon" />
                  <select v-model="form.pendidikan_id">
                    <option value="">Pilih</option>
                    <option v-for="e in masterData.educations" :key="e.id" :value="e.id">{{ e.name }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Pekerjaan</label>
                <div class="input-wrapper">
                  <Briefcase size="18" class="input-icon" />
                  <select v-model="form.pekerjaan_id">
                    <option value="">Pilih</option>
                    <option v-for="o in masterData.occupations" :key="o.id" :value="o.id">{{ o.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- KONTAK -->
          <div v-show="activeTab === 'gerejawi'" class="tab-pane">
            <div class="form-grid">
                <div class="form-group span-2">
                  <label class="form-label">No. HP / WhatsApp</label>
                  <div class="input-wrapper">
                    <Phone size="18" class="input-icon" />
                    <input v-model="form.no_hp" @input="restrictNumeric(form, 'no_hp', 15)" type="text" placeholder="08xxxxxxxxxx" />
                  </div>
                </div>

                <div class="form-group span-2">
                  <label class="form-label">Email</label>
                  <div class="input-wrapper">
                    <Mail size="18" class="input-icon" />
                    <input v-model="form.email" type="email" placeholder="contoh@email.com" />
                  </div>
                </div>
            </div>
          </div>

          <!-- ALAMAT -->
          <div v-show="activeTab === 'alamat'" class="tab-pane">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <h3 class="text-sm font-bold text-slate-800">Daftar Alamat</h3>
                  <p class="text-xs text-slate-500 mt-1">Kelola alamat KTP, Domisili, atau kantor.</p>
                </div>
                <button type="button" class="btn btn-secondary btn-sm h-10 px-4 flex items-center gap-2" @click="addAddress">
                  <Plus size="16" /> <span>Tambah Alamat</span>
                </button>
              </div>

              <div class="address-list flex flex-col gap-[2.5rem]">
                <div v-for="(addr, index) in form.alamats" :key="index" class="address-item relative p-6 bg-white border border-slate-200 rounded-2xl transition-all duration-300">
                  <div class="address-badge text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100 italic">
                    Alamat #{{ index + 1 }}
                  </div>
                  <button v-if="form.alamats.length > 1" type="button" class="remove-address-btn" @click="removeAddress(index)" title="Hapus Alamat">
                    <X size="14" />
                  </button>
                  
                  <div class="form-grid compact">
                    <div class="form-group span-2">
                      <label class="form-label text-xs">Caption Alamat (KTP, Domisili, dll)</label>
                      <input v-model="addr.caption_alamat" @input="toUppercase(addr, 'caption_alamat')" type="text" class="input-sm" required placeholder="CONTOH: KTP" />
                    </div>
                    <div class="form-group span-2">
                      <label class="form-label text-xs">Alamat Lengkap</label>
                      <input v-model="addr.alamat_lengkap" @input="toUppercase(addr, 'alamat_lengkap')" type="text" class="input-sm" required placeholder="JL. NAMA JALAN NO. 123" />
                    </div>

                    <div class="form-group searchable-select">
                      <label class="form-label text-xs">Provinsi</label>
                      <div class="input-wrapper">
                        <input :value="addr.provinsi" @click="toggleRegionalDropdown('provinsi-' + index)" readonly type="text" class="input-sm cursor-pointer" placeholder="CARI PROVINSI..." />
                        <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                      </div>
                      <div v-if="regionalDropdowns.active === 'provinsi-' + index" class="select-dropdown">
                        <div class="search-box">
                          <Search size="14" class="search-icon" />
                          <input v-model="regionalDropdowns.search" type="text" placeholder="Ketik nama provinsi..." class="search-input input-sm" @click.stop autofocus />
                        </div>
                        <ul class="options-list custom-scrollbar">
                          <li v-for="p in filterRegions(masterData.provinces)" :key="p.id" @click="selectRegion(addr, 'provinsi', p)">
                            {{ p.name }}
                          </li>
                          <li v-if="filterRegions(masterData.provinces).length === 0" class="empty-option">Tidak ditemukan</li>
                        </ul>
                      </div>
                    </div>

                    <div class="form-group searchable-select">
                      <label class="form-label text-xs">Kota/Kabupaten</label>
                      <div class="input-wrapper">
                        <input :value="addr.kota" @click="toggleRegionalDropdown('kota-' + index)" :disabled="!addr.provinsi" readonly type="text" class="input-sm cursor-pointer" placeholder="CARI KOTA..." />
                        <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                      </div>
                      <div v-if="regionalDropdowns.active === 'kota-' + index" class="select-dropdown">
                        <div class="search-box">
                          <Search size="14" class="search-icon" />
                          <input v-model="regionalDropdowns.search" type="text" placeholder="Ketik nama kota..." class="search-input input-sm" @click.stop autofocus />
                        </div>
                        <ul class="options-list custom-scrollbar">
                          <li v-for="r in filterRegions(masterData.regencies[addr._province_id])" :key="r.id" @click="selectRegion(addr, 'kota', r)">
                            {{ r.name }}
                          </li>
                          <li v-if="filterRegions(masterData.regencies[addr._province_id] || []).length === 0" class="empty-option">Pilih provinsi dahulu</li>
                        </ul>
                      </div>
                    </div>

                    <div class="form-group searchable-select">
                      <label class="form-label text-xs">Kecamatan</label>
                      <div class="input-wrapper">
                        <input :value="addr.kecamatan" @click="toggleRegionalDropdown('kecamatan-' + index)" :disabled="!addr.kota" readonly type="text" class="input-sm cursor-pointer" placeholder="CARI KECAMATAN..." />
                        <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                      </div>
                      <div v-if="regionalDropdowns.active === 'kecamatan-' + index" class="select-dropdown">
                        <div class="search-box">
                          <Search size="14" class="search-icon" />
                          <input v-model="regionalDropdowns.search" type="text" placeholder="Ketik nama kecamatan..." class="search-input input-sm" @click.stop autofocus />
                        </div>
                        <ul class="options-list custom-scrollbar">
                          <li v-for="d in filterRegions(masterData.districts[addr._regency_id])" :key="d.id" @click="selectRegion(addr, 'kecamatan', d)">
                            {{ d.name }}
                          </li>
                          <li v-if="filterRegions(masterData.districts[addr._regency_id] || []).length === 0" class="empty-option">Pilih kota dahulu</li>
                        </ul>
                      </div>
                    </div>

                    <div class="form-group searchable-select">
                      <label class="form-label text-xs">Kelurahan/Desa</label>
                      <div class="input-wrapper">
                        <input :value="addr.kelurahan" @click="toggleRegionalDropdown('kelurahan-' + index)" :disabled="!addr.kecamatan" readonly type="text" class="input-sm cursor-pointer" placeholder="CARI KELURAHAN..." />
                        <ChevronDown size="14" class="absolute right-3 text-slate-400" />
                      </div>
                      <div v-if="regionalDropdowns.active === 'kelurahan-' + index" class="select-dropdown">
                        <div class="search-box">
                          <Search size="14" class="search-icon" />
                          <input v-model="regionalDropdowns.search" type="text" placeholder="Ketik nama kelurahan..." class="search-input input-sm" @click.stop autofocus />
                        </div>
                        <ul class="options-list custom-scrollbar">
                          <li v-for="v in filterRegions(masterData.villages[addr._district_id])" :key="v.id" @click="selectRegion(addr, 'kelurahan', v)">
                            {{ v.name }}
                          </li>
                          <li v-if="filterRegions(masterData.villages[addr._district_id] || []).length === 0" class="empty-option">Pilih kecamatan dahulu</li>
                        </ul>
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label text-xs">RT</label>
                      <input v-model="addr.rt" @input="restrictNumeric(addr, 'rt', 5)" type="text" class="input-sm" maxlength="5" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">RW</label>
                      <input v-model="addr.rw" @input="restrictNumeric(addr, 'rw', 5)" type="text" class="input-sm" maxlength="5" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Kode Pos</label>
                      <input v-model="addr.kode_pos" @input="restrictNumeric(addr, 'kode_pos', 10)" type="text" class="input-sm" maxlength="10" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Negara</label>
                      <input v-model="addr.negara" @input="toUppercase(addr, 'negara')" type="text" class="input-sm" />
                    </div>
                    <div class="form-group span-4 flex items-center gap-2 mt-2">
                      <input :id="'utama-' + index" type="checkbox" v-model="addr.is_utama" @change="ensureOnePrimary(index)" />
                      <label :for="'utama-' + index" class="text-xs font-bold text-slate-600 uppercase cursor-pointer">Jadikan Alamat Utama</label>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>

        <div class="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button @click="saveData" :disabled="loading" class="btn btn-primary h-12 px-10 flex items-center gap-2">
            <span v-if="loading" class="spinner small"></span>
            <Check v-else size="18" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '../../axios';
import { 
  User, Users, Calendar, Search, X, Check, Hash, Tag, MapPin, 
  Droplet, Heart, GraduationCap, Briefcase, Mail, Phone, Plus, 
  Upload, Camera, ChevronDown
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const step = ref(1);
const loading = ref(false);
const activeTab = ref('pribadi');
const nikTouched = ref(false);
const kkTouched = ref(false);

const verifyForm = ref({
  nama_lengkap: '',
  jenis_kelamin: '',
  tanggal_lahir: ''
});

const defaultForm = () => ({
  id: null,
  nik: '',
  no_kk: '',
  nama_lengkap: '',
  nama_panggilan: '',
  jenis_kelamin: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  golongan_darah: '',
  hubungan_keluarga: '',
  status_pernikahan_id: '',
  pendidikan_id: '',
  pekerjaan_id: '',
  no_hp: '',
  email: '',
  foto: '',
  alamats: []
});

const form = ref(defaultForm());

const tabs = [
  { id: 'pribadi', label: 'Pribadi', icon: User },
  { id: 'keluarga', label: 'Keluarga', icon: Heart },
  { id: 'gerejawi', label: 'Kontak', icon: Phone },
  { id: 'alamat', label: 'Alamat', icon: MapPin },
];

const bloodGroups = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const masterData = ref({
  provinces: [],
  regencies: {},
  districts: {},
  villages: {},
  maritalStatuses: [],
  educations: [],
  occupations: []
});

const regionalDropdowns = ref({
  active: null,
  search: ''
});

onMounted(async () => {
  try {
    const [p, ms, ed, oc, ca, mjs] = await Promise.all([
      axios.get('/provinces'),
      axios.get('/public/marital-statuses'),
      axios.get('/public/educations'),
      axios.get('/public/occupations'),
      axios.get('/public/church-areas'),
      axios.get('/public/member-statuses')
    ]);
    masterData.value.provinces = p.data.data || p.data;
    masterData.value.maritalStatuses = ms.data.data || ms.data;
    masterData.value.educations = ed.data.data || ed.data;
    masterData.value.occupations = oc.data.data || oc.data;
    masterData.value.churchAreas = ca.data.data || ca.data;
    masterData.value.memberStatuses = mjs.data.data || mjs.data;
  } catch (e) {
    console.error('Fetch master data error:', e);
  }
});

const toUppercase = (obj, field) => {
  if (obj[field]) obj[field] = obj[field].toUpperCase();
};

const restrictNumeric = (obj, field, max = 16) => {
  let val = obj[field].replace(/\D/g, '');
  if (val.length > max) val = val.slice(0, max);
  obj[field] = val;
};

const isNikValid = () => form.value.nik.length >= 10 && form.value.nik.length <= 16;
const isKkValid = () => form.value.no_kk.length >= 10 && form.value.no_kk.length <= 16;

const verifyIdentity = async () => {
  if (!verifyForm.value.nama_lengkap || !verifyForm.value.jenis_kelamin || !verifyForm.value.tanggal_lahir) {
    Swal.fire('Info', 'Harap isi semua kolom verifikasi', 'info');
    return;
  }

  loading.value = true;
  try {
    const res = await axios.post('/public/jemaat/verify', verifyForm.value);
    if (res.data.success) {
      form.value = JSON.parse(JSON.stringify(res.data.data));
      // Prefetch regional data for current addresses
      for (const addr of form.value.alamats) {
        if (addr.provinsi) {
          const prov = masterData.value.provinces.find(p => p.name === addr.provinsi);
          if (prov) {
             addr._province_id = prov.id;
             await fetchRegencies(prov.id);
             const reg = (masterData.value.regencies[prov.id] || []).find(r => r.name === addr.kota);
             if (reg) {
                 addr._regency_id = reg.id;
                 await fetchDistricts(reg.id);
                 const dist = (masterData.value.districts[reg.id] || []).find(d => d.name === addr.kecamatan);
                 if (dist) {
                     addr._district_id = dist.id;
                     await fetchVillages(dist.id);
                 }
             }
          }
        }
      }
      step.value = 2;
    }
  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'Data tidak ditemukan', 'error');
  } finally {
    loading.value = false;
  }
};

const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
      else { if (h > MAX) { w *= MAX / h; h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      form.value.foto = canvas.toDataURL('image/jpeg', 0.7);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Regional logic (cloned from Jemaat.vue)
const fetchRegencies = async (id) => {
  if (!id || masterData.value.regencies[id]) return;
  const res = await axios.get(`/regencies/${id}`);
  const data = res.data.data || res.data;
  masterData.value.regencies[id] = Array.isArray(data) ? data : [];
};
const fetchDistricts = async (id) => {
  if (!id || masterData.value.districts[id]) return;
  const res = await axios.get(`/districts/${id}`);
  const data = res.data.data || res.data;
  masterData.value.districts[id] = Array.isArray(data) ? data : [];
};
const fetchVillages = async (id) => {
  if (!id || masterData.value.villages[id]) return;
  const res = await axios.get(`/villages/${id}`);
  const data = res.data.data || res.data;
  masterData.value.villages[id] = Array.isArray(data) ? data : [];
};

const toggleRegionalDropdown = (id) => {
    regionalDropdowns.value.active = regionalDropdowns.value.active === id ? null : id;
    regionalDropdowns.value.search = '';
};

const selectRegion = async (addr, type, item) => {
  if (type === 'provinsi') {
    addr.provinsi = item.name;
    addr._province_id = item.id;
    addr.kota = addr.kecamatan = addr.kelurahan = '';
    addr._regency_id = addr._district_id = null;
    await fetchRegencies(item.id);
  } else if (type === 'kota') {
    addr.kota = item.name;
    addr._regency_id = item.id;
    addr.kecamatan = addr.kelurahan = '';
    addr._district_id = null;
    await fetchDistricts(item.id);
  } else if (type === 'kecamatan') {
    addr.kecamatan = item.name;
    addr._district_id = item.id;
    addr.kelurahan = '';
    await fetchVillages(item.id);
  } else if (type === 'kelurahan') {
    addr.kelurahan = item.name;
  }
  regionalDropdowns.value.active = null;
  regionalDropdowns.value.search = '';
};

const filterRegions = (list) => {
  if (!list) return [];
  const s = regionalDropdowns.value.search.toLowerCase();
  const filtered = s ? list.filter(item => item.name.toLowerCase().includes(s)) : list;
  return filtered.slice(0, 100);
};

const addAddress = () => {
    form.value.alamats.push({
        caption_alamat: '', alamat_lengkap: '', rt: '', rw: '', 
        kelurahan: '', kecamatan: '', kota: '', provinsi: '', 
        kode_pos: '', negara: 'INDONESIA', is_utama: form.value.alamats.length === 0
    });
};

const removeAddress = (idx) => {
    form.value.alamats.splice(idx, 1);
    if (form.value.alamats.length > 0 && !form.value.alamats.some(a => a.is_utama)) {
        form.value.alamats[0].is_utama = true;
    }
};

const ensureOnePrimary = (idx) => {
    form.value.alamats.forEach((a, i) => { if (i !== idx) a.is_utama = false; });
    if (!form.value.alamats.some(a => a.is_utama)) form.value.alamats[idx] = true;
};

const saveData = async () => {
  nikTouched.value = kkTouched.value = true;
  if (!isNikValid() || !isKkValid()) {
    Swal.fire('Error', 'Periksa kembali NIK dan No. KK (10-16 digit)', 'error');
    return;
  }

  loading.value = true;
  try {
    const res = await axios.put(`/public/jemaat/update/${form.value.id}`, form.value);
    if (res.data.success) {
      await Swal.fire('Berhasil', res.data.message, 'success');
      step.value = 1;
      form.value = defaultForm();
      verifyForm.value = { nama_lengkap: '', jenis_kelamin: '', tanggal_lahir: '' };
    }
  } catch (e) {
    Swal.fire('Gagal', e.response?.data?.message || 'Gagal menyimpan data', 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Exact copy of styles from Jemaat.vue for consistency */

.public-page {
  font-family: 'Outfit', 'Inter', sans-serif;
  color: #1e293b;
  background: #f3f4f6;
  min-height: 100vh;
}

.verification-card {
  border-top: 3px solid #6366f1;
}

.update-card {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Form Elements - Exact copy from Jemaat.vue */
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

.input-wrapper input, .input-wrapper select, .input-wrapper textarea, .input-sm {
  width: 100%;
  padding: 0.8125rem 1.125rem 0.8125rem 3rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #1e293b;
}

.input-sm {
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
}

.input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus, .input-sm:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-wrapper select {
  appearance: none;
  cursor: pointer;
}

.input-wrapper textarea {
  padding-left: 1.125rem;
  resize: vertical;
  min-height: 100px;
}

/* Button Styles - Exact copy from Jemaat.vue */
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

/* Modal/Card Styles */
.card {
  background: white;
  border-radius: 1.25rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* Tab Navigation - Exact copy from Jemaat.vue */
.modal-tabs {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  padding: 0 1.5rem;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.modal-tabs::-webkit-scrollbar { display: none; }

.tab-btn {
  padding: 1.125rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover:not(.active) {
  color: #475569;
  background: #f1f5f9;
}

.tab-btn.active { color: #6366f1; }
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #6366f1;
  border-radius: 3px 3px 0 0;
}

/* Modal Body */
.modal-body {
  padding: 2.25rem;
  overflow-y: auto;
}

/* Form Grid - Exact copy from Jemaat.vue */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}

.form-grid.compact {
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }

/* Address Management - Exact copy from Jemaat.vue */
.address-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.address-item {
  position: relative;
  padding: 2.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
}

.address-item:hover {
  border-color: #6366f1;
  background: #fcfcff;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.05);
  transform: translateY(-2px);
}

.address-badge {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
}

.remove-address-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.remove-address-btn:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
  transform: rotate(90deg);
}

/* Photo Upload Section - Exact copy from Jemaat.vue */
.photo-upload-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 1.25rem;
}

.photo-preview-container {
  width: 100px;
  height: 100px;
  border-radius: 1rem;
  background: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.photo-preview-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.photo-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.remove-photo-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
  z-index: 10;
}

.remove-photo-btn:hover {
  transform: scale(1.1);
  background: #dc2626;
}

.photo-upload-controls {
  display: flex;
  flex-direction: column;
}

.photo-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.photo-upload-label:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f3ff;
}

/* Searchable Select - Exact copy from Jemaat.vue */
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

/* Validation Styles - Exact copy from Jemaat.vue */
.error-ring {
  border-color: #ef4444 !important;
  background: #fffafa !important;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
}

.error-ring .input-icon {
  color: #ef4444 !important;
}

.error-ring input {
  color: #b91c1c !important;
}

/* Global Uppercase for Inputs */
input[type="text"]:not(.search-input), 
textarea {
  text-transform: uppercase;
}

input::placeholder,
textarea::placeholder {
  text-transform: none;
}

/* Spinner & Animations - Exact copy from Jemaat.vue */
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

.tab-pane {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Custom Scrollbar - Exact copy from Jemaat.vue */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; background-clip: content-box; }

/* Responsive */
@media (max-width: 768px) {
  .form-grid, .form-grid.compact {
    grid-template-columns: 1fr !important;
  }
  .span-2, .span-3, .span-4 { grid-column: span 1 !important; }
  .modal-tabs { gap: 0.5rem; padding: 0 0.75rem; }
  .photo-upload-section { flex-direction: column; text-align: center; }
  .modal-body { padding: 1.5rem; }
}
</style>

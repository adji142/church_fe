<template>
  <div class="master-data-page wide">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Transaksi Kas</h1>
        <p class="page-subtitle">Pencatatan buku kas, donasi, persembahan, dan pengeluaran operasional</p>
      </div>
      <div class="header-actions">
        <!-- Search -->
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari referensi atau deskripsi..." 
            class="search-input"
            @input="debounceSearch"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()">
          <Plus size="18" /> <span>Catat Transaksi</span>
        </button>
      </div>
    </div>

    <!-- Quick Filters Dashboard -->
    <div class="card filter-card mb-8">
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-8">
            <div class="filter-item">
              <span class="filter-label">Tipe Aliran Kas</span>
              <div class="filter-pills">
                <button class="pill-btn" :class="{ active: filterType === '' }" @click="filterType = ''; fetchData(1)">Semua</button>
                <button class="pill-btn" :class="{ active: filterType === 'income' }" @click="filterType = 'income'; fetchData(1)">Masuk</button>
                <button class="pill-btn" :class="{ active: filterType === 'expense' }" @click="filterType = 'expense'; fetchData(1)">Keluar</button>
              </div>
            </div>
            
            <div class="v-divider"></div>
            
            <div class="filter-item">
              <span class="filter-label">Kategori</span>
              <select v-model="filterCategory" @change="fetchData(1)" class="filter-select-minimal">
                <option value="">Semua Kategori</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="text-right">
            <span class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total Terfilter</span>
            <span class="text-xl font-black text-indigo-600">{{ formatCurrency(pagination.total_amount_sum || 0) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat catatan kas...</p>
      </div>

      <div v-else-if="data.length === 0" class="empty-state">
        <div class="empty-icon"><Banknote size="48" /></div>
        <p>Tidak ada transaksi ditemukan.</p>
      </div>

      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 180px">Tanggal & Ref</th>
              <th>Deskripsi / Kategori</th>
              <th style="width: 120px">Tipe</th>
              <th style="width: 150px">Metode / Dana</th>
              <th class="text-right" style="width: 180px">Jumlah Total</th>
              <th class="text-right" style="width: 120px">Petugas</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data" :key="item.id" class="row-hover">
              <td>
                <div class="name-column">
                  <span class="font-bold text-dark">{{ formatDate(item.transaction_date) }}</span>
                  <span class="text-xs text-muted">ID: #{{ item.id }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-col max-w-[300px]">
                  <span class="text-dark font-medium text-sm truncate" :title="item.description">{{ item.description || '-' }}</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="type-tag">{{ item.cash_category?.name }}</span>
                    <span v-if="item.denominations_count || item.denominations?.length" class="code-badge text-[10px]">BERINCIAN</span>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['status-pill', item.type === 'income' ? 'active' : 'inactive']">
                   {{ item.type === 'income' ? 'Masuk' : 'Keluar' }}
                </span>
              </td>
              <td>
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-slate-600">{{ item.payment_method?.name }}</span>
                  <span v-if="item.fund" class="text-[10px] text-amber-600 font-bold">{{ item.fund?.name }}</span>
                </div>
              </td>
              <td class="text-right">
                <div :class="['currency-text', item.type === 'income' ? 'text-emerald-600' : 'text-rose-600']">
                  {{ formatCurrency(item.total_amount) }}
                </div>
              </td>
              <td class="text-right">
                 <div class="text-[10px] font-bold text-muted uppercase">{{ item.creator?.name || 'Sistem' }}</div>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(item)" title="Edit">
                    <Edit2 size="14" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(item)" title="Hapus">
                    <Trash2 size="14" />
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

    <!-- Premium Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="!saving && closeModal()">
        <div class="modal-content extra-large h-[90vh]">
          <div class="modal-header">
            <div class="header-icon">
              <Banknote size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Transaksi' : 'Catat Transaksi Baru' }}</h2>
              <p>Lengkapi detail pemasukan atau pengeluaran kas di bawah ini</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving">
              <X size="20" />
            </button>
          </div>

          <!-- Tabs Section -->
          <div class="modal-tabs-section">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['modal-tab-btn', activeTab === tab.id ? 'active' : '']"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" size="16" />
              <span>{{ tab.label }}</span>
              <div v-if="tab.count" class="tab-badge">{{ tab.count }}</div>
            </button>
          </div>

          <form @submit.prevent="saveData" class="modal-body custom-scrollbar">
            <!-- TAB: DASAR -->
            <div v-show="activeTab === 'basic'" class="animate-fade-in">
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label">Tipe Transaksi <span class="required">*</span></label>
                  <div class="type-selector-group">
                    <button 
                      type="button" 
                      class="type-selector income" 
                      :class="{ active: form.type === 'income' }"
                      @click="form.type = 'income'"
                    >
                      <ArrowUpCircle size="20" />
                      <div class="text-left">
                        <span class="block text-xs font-bold">PEMASUKAN</span>
                        <span class="block text-[10px] opacity-70">Uang Masuk / Kas In</span>
                      </div>
                    </button>
                    <button 
                      type="button" 
                      class="type-selector expense" 
                      :class="{ active: form.type === 'expense' }"
                      @click="form.type = 'expense'"
                    >
                      <ArrowDownCircle size="20" />
                      <div class="text-left">
                        <span class="block text-xs font-bold">PENGELUARAN</span>
                        <span class="block text-[10px] opacity-70">Uang Keluar / Kas Out</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Transaksi <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <Calendar size="18" class="input-icon" />
                    <input v-model="form.transaction_date" type="date" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Kategori Kas <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <Tag size="18" class="input-icon" />
                    <select v-model="form.cash_category_id" required>
                      <option :value="null" disabled>Pilih Kategori</option>
                      <option 
                        v-for="cat in filteredCategories" 
                        :key="cat.id" 
                        :value="cat.id"
                      >
                        {{ cat.name }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Metode Pembayaran <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <CreditCard size="18" class="input-icon" />
                    <select v-model="form.payment_method_id" required>
                       <option :value="null" disabled>Pilih Metode</option>
                       <option v-for="pm in paymentMethods" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Dana / Fund (Opsi)</label>
                  <div class="input-wrapper">
                    <Briefcase size="18" class="input-icon" />
                    <select v-model="form.fund_id">
                      <option :value="null">Kas Utama / Tanpa Dana Khusus</option>
                      <option v-for="f in funds" :key="f.id" :value="f.id">{{ f.name }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label">Nomor Referensi</label>
                  <div class="input-wrapper">
                    <Hash size="18" class="input-icon" />
                    <input v-model="form.reference_number" type="text" placeholder="Contoh: INV-2023-001" />
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label text-indigo-600">Total Nominal Transaksi <span class="required">*</span></label>
                  <div class="amount-entry-card shadow-sm">
                    <div class="currency-symbol">RP</div>
                    <input 
                      v-model="form.total_amount" 
                      type="number" 
                      step="1" 
                      required 
                      placeholder="0" 
                      class="amount-input"
                    />
                    <div v-if="denominationTotal > 0 || envelopeTotal > 0" class="amount-sync-warning animate-bounce-subtle">
                      <div v-if="denominationTotal > 0 && denominationTotal !== parseFloat(form.total_amount)" class="sync-item">
                        <AlertCircle size="12" />
                        <span>Sesuai Denominasi: {{ formatCurrency(denominationTotal) }}</span>
                        <button type="button" @click="form.total_amount = denominationTotal">Sinkronkan</button>
                      </div>
                      <div v-if="envelopeTotal > 0 && envelopeTotal !== parseFloat(form.total_amount)" class="sync-item">
                        <AlertCircle size="12" />
                        <span>Sesuai Amplop: {{ formatCurrency(envelopeTotal) }}</span>
                        <button type="button" @click="form.total_amount = envelopeTotal">Sinkronkan</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group full-width">
                  <label class="form-label">Keterangan / Deskripsi</label>
                  <div class="input-wrapper plain">
                    <textarea v-model="form.description" rows="3" placeholder="Tuliskan catatan detail transaksi di sini..." class="custom-scrollbar"></textarea>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: DENOMINATIONS -->
            <div v-show="activeTab === 'denominations'" class="animate-fade-in">
              <div class="section-notice mb-6 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl flex gap-3 items-start">
                <Info size="20" class="mt-0.5" />
                <div>
                  <p class="font-bold text-sm">Rincian Denominasi (Pecahan Uang)</p>
                  <p class="text-xs opacity-80">Gunakan bagian ini untuk merinci jumlah lembaran uang tunai yang diterima atau dikeluarkan.</p>
                </div>
              </div>

              <div class="denominations-table-container">
                <table class="denominations-table">
                  <thead>
                    <tr>
                      <th class="w-[250px]">Pecahan (RP)</th>
                      <th>Jumlah (Lembar)</th>
                      <th class="text-right">Subtotal</th>
                      <th class="w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(denom, index) in form.denominations" :key="index" class="denom-row">
                      <td>
                        <div class="compact-input-wrapper">
                          <input v-model="denom.denomination_value" type="number" @input="updateDenomTotal(index)" class="compact-input font-bold" />
                        </div>
                      </td>
                      <td>
                         <div class="compact-input-wrapper">
                          <input v-model="denom.quantity" type="number" @input="updateDenomTotal(index)" class="compact-input" />
                        </div>
                      </td>
                      <td class="text-right">
                        <span class="text-sm font-extrabold text-slate-700">{{ formatCurrency(denom.subtotal) }}</span>
                      </td>
                      <td class="text-right">
                        <div class="actions-group">
                          <button type="button" @click="removeDenom(index)" class="action-btn delete" title="Hapus Baris">
                            <Trash2 size="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="form.denominations.length === 0">
                      <td colspan="4" class="py-12 text-center text-slate-400 italic">Belum ada rincian pecahan. Tambahkan untuk memudahkan penghitungan uang tunai.</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-indigo-50/30">
                      <td colspan="2" class="text-right font-bold text-slate-500 uppercase text-[10px] py-4">Total Denominasi</td>
                      <td class="text-right py-4">
                        <span class="text-lg font-black text-indigo-600">{{ formatCurrency(denominationTotal) }}</span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
                <button type="button" @click="addDenom" class="add-row-btn mt-4">
                  <Plus size="16" /> Tambah Pecahan Baru
                </button>
              </div>
            </div>

            <!-- TAB: ENVELOPES -->
            <div v-show="activeTab === 'envelopes'" class="animate-fade-in">
              <div class="section-notice mb-6 bg-blue-50 text-blue-700 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                <Info size="20" class="mt-0.5" />
                <div>
                  <p class="font-bold text-sm">Rincian Amplop Jemaat</p>
                  <p class="text-xs opacity-80">Catat persembahan atau pembayaran yang menggunakan bantuan amplop untuk identifikasi jemaat.</p>
                </div>
              </div>

              <div class="envelope-grid">
                <div v-for="(env, index) in form.envelopes" :key="index" class="envelope-card-premium animate-slide-in">
                  <div class="envelope-card-header">
                    <span class="env-index">#{{ index + 1 }}</span>
                    <div class="actions-group">
                      <button type="button" @click="removeEnvelope(index)" class="action-btn delete" title="Hapus Amplop">
                        <Trash2 size="14" />
                      </button>
                    </div>
                  </div>
                  <div class="envelope-card-body">
                    <div class="env-form-group">
                       <label>NOMINAL (RP)</label>
                       <input v-model="env.amount" type="number" class="env-input font-bold text-indigo-600" />
                    </div>
                    <div class="env-form-group">
                       <label>NO. AMPLOP</label>
                       <input v-model="env.envelope_number" type="text" placeholder="Opsional" class="env-input" />
                    </div>
                    <div class="env-form-group col-span-2">
                       <label>JEMAAT / PENGIRIM</label>
                       <select v-model="env.member_id" class="env-select">
                         <option :value="null">Anonim / Internal Gereja</option>
                         <option v-for="m in members" :key="m.id" :value="m.id">{{ m.nama_lengkap }} ({{ m.no_anggota }})</option>
                       </select>
                    </div>
                    <div class="env-form-group col-span-2">
                       <label>CATATAN KHUSUS</label>
                       <textarea v-model="env.notes" class="env-textarea" placeholder="Tuliskan jika ada pesan khusus pada amplop..." rows="1"></textarea>
                    </div>
                  </div>
                </div>

                <button type="button" @click="addEnvelope" class="add-envelope-btn">
                  <div class="icon-circle-btn"><Plus size="24" /></div>
                  <span class="font-bold text-xs">TAMBAH AMPLOP</span>
                </button>
              </div>

              <div class="envelope-summary-bar mt-8">
                 <div class="flex flex-col">
                   <span class="text-[10px] font-bold text-slate-400 uppercase">Total Amplop Terdata</span>
                   <span class="text-2xl font-black text-slate-800">{{ formatCurrency(envelopeTotal) }}</span>
                 </div>
                 <div class="h-10 w-[1px] bg-slate-200"></div>
                 <div class="flex flex-col text-right">
                   <span class="text-[10px] font-bold text-slate-400 uppercase">Jumlah Item</span>
                   <span class="text-2xl font-black text-indigo-600">{{ form.envelopes.length }} <span class="text-xs text-slate-400 font-medium italic">amplop</span></span>
                 </div>
              </div>
            </div>
          </form>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <div class="left-controls text-[10px] text-muted font-medium">
              <span class="flex items-center gap-1"><AlertCircle size="12" /> Tanda <span class="text-rose-500 font-bold">*</span> wajib diisi demi validitas audit data.</span>
            </div>
            <div class="right-actions">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Batal</button>
              <button type="button" @click="saveData" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Menyimpan...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Konfirmasi Perubahan' : 'Simpan Transaksi' }}</span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Search, Plus, Edit2, Trash2, X, Check, ChevronLeft, ChevronRight, 
  Banknote, Calendar, Tag, CreditCard, Briefcase, Hash, 
  ArrowUpRight, ArrowDownRight, ArrowUpCircle, ArrowDownCircle,
  XCircle, Info, AlertCircle, FileText, User, List, Layers
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const data = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const filterType = ref('');
const filterCategory = ref('');
const timer = ref(null);
const activeTab = ref('basic');

const defaultForm = () => ({
  church_id: auth.activeBranch,
  transaction_date: new Date().toISOString().split('T')[0],
  type: 'income',
  total_amount: 0,
  cash_category_id: null,
  payment_method_id: null,
  fund_id: null,
  description: '',
  reference_number: '',
  denominations: [],
  envelopes: []
});

const form = ref(defaultForm());

// Tabs Metadata
const tabs = computed(() => [
  { id: 'basic', label: 'Informasi Dasar', icon: List },
  { id: 'denominations', label: 'Denominasi', icon: Layers, count: form.value.denominations.length },
  { id: 'envelopes', label: 'Rincian Amplop', icon: FileText, count: form.value.envelopes.length }
]);

const filteredCategories = computed(() => {
    return categories.value.filter(c => c.type === form.value.type);
});

const denominationTotal = computed(() => {
  return form.value.denominations.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
});

const envelopeTotal = computed(() => {
  return form.value.envelopes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
});

// Auto-reset category if not in filtered list
watch(() => form.value.type, (newType) => {
    if (form.value.cash_category_id) {
        const exists = categories.value.find(c => c.id === form.value.cash_category_id && c.type === newType);
        if (!exists) form.value.cash_category_id = null;
    }
});

const categories = ref([]);
const paymentMethods = ref([]);
const funds = ref([]);
const members = ref([]);

const pagination = ref({ 
    current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 
});

const fetchMasterData = async () => {
    try {
        const [catRes, pmRes, fnRes, memRes] = await Promise.all([
            axios.get('/cash-categories', { params: { per_page: 999, church_id: auth.activeBranch } }),
            axios.get('/payment-methods', { params: { per_page: 999, church_id: auth.activeBranch } }),
            axios.get('/funds', { params: { per_page: 999, church_id: auth.activeBranch } }),
            axios.get('/jemaat', { params: { per_page: 999, church_id: auth.activeBranch } })
        ]);
        categories.value = catRes.data.data;
        paymentMethods.value = pmRes.data.data;
        funds.value = fnRes.data.data;
        members.value = memRes.data.data;
    } catch (error) {
        console.error('Master data failed', error);
    }
};

const fetchData = async (page = 1) => {
  loading.value = true;
  try {
    const res = await axios.get('/cash-transactions', {
      params: { 
        page, 
        per_page: pagination.value.per_page, 
        search: searchQuery.value,
        type: filterType.value,
        cash_category_id: filterCategory.value,
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
  return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

// Form Handlers
const addDenom = () => {
  form.value.denominations.push({ denomination_value: 0, quantity: 1, subtotal: 0 });
};

const removeDenom = (index) => {
  form.value.denominations.splice(index, 1);
};

const updateDenomTotal = (index) => {
  const d = form.value.denominations[index];
  d.subtotal = (d.denomination_value || 0) * (d.quantity || 0);
};

const addEnvelope = () => {
  form.value.envelopes.push({ envelope_number: '', amount: 0, member_id: null, notes: '' });
};

const removeEnvelope = (index) => {
  form.value.envelopes.splice(index, 1);
};

const openModal = (item = null) => {
  activeTab.value = 'basic';
  if (item) {
    editingId.value = item.id;
    form.value = { 
        ...item,
        transaction_date: item.transaction_date.split('T')[0],
        denominations: item.denominations || [],
        envelopes: item.envelopes || []
    };
  } else {
    editingId.value = null;
    form.value = defaultForm();
    if (categories.value.length) {
        const firstIncome = categories.value.find(c => c.type === 'income');
        if (firstIncome) form.value.cash_category_id = firstIncome.id;
    }
    if (paymentMethods.value.length) form.value.payment_method_id = paymentMethods.value[0].id;
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveData = async () => {
  // Simple validation for required fields
  if (!form.value.cash_category_id || !form.value.payment_method_id || !form.value.total_amount) {
     Swal.fire('Input Tidak Lengkap', 'Silakan lengkapi kategori, metode, dan jumlah nominal.', 'warning');
     return;
  }

  saving.value = true;
  try {
    const payload = { ...form.value };
    if (editingId.value) {
      await axios.put(`/cash-transactions/${editingId.value}`, payload);
    } else {
      await axios.post('/cash-transactions', payload);
    }
    Swal.fire({ 
        icon: 'success', 
        title: 'Berhasil', 
        text: 'Transaksi telah dicatat ke buku kas.',
        timer: 2000, 
        showConfirmButton: false 
    });
    fetchData(pagination.value.current_page);
    closeModal();
  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (item) => {
  const result = await Swal.fire({
    title: 'Hapus Transaksi?',
    text: "Data finansial yang dihapus akan mempengaruhi laporan keuangan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'Ya, Hapus Permanen'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/cash-transactions/${item.id}`);
      fetchData();
      Swal.fire('Terhapus!', 'Catatan transaksi telah dikeluarkan dari buku kas.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Gagal menghapus data', 'error');
    }
  }
};

onMounted(() => {
  fetchMasterData();
  fetchData();
});
</script>

<style scoped>
.master-data-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.master-data-page.wide { max-width: 1600px; }
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 2rem; }
.title-group { flex: 1; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; margin-bottom: 0.25rem; }
.page-subtitle { color: #6b7280; font-size: 0.95rem; }
.header-actions { display: flex; gap: 1rem; align-items: center; }
.search-wrapper { position: relative; width: 300px; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; }
.search-input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.75rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.search-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; cursor: pointer; border: 1px solid transparent; }
.btn-primary { background: #6366f1; color: white; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); }
.btn-ghost { background: transparent; color: #64748b; }
.btn-ghost:hover { background: #f1f5f9; color: #1e293b; }
.card { background: white; border-radius: 1.5rem; border: 1px solid #e2e8f0; }
.filter-card { border: none; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.03); }
.filter-item { display: flex; flex-direction: column; gap: 0.5rem; }
.filter-label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
.filter-pills { display: flex; gap: 0.5rem; }
.pill-btn { padding: 0.5rem 1.25rem; border-radius: 2rem; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #64748b; transition: all 0.2s; border: none; }
.pill-btn.active { background: #6366f1; color: white; box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.4); }
.v-divider { width: 1px; height: 32px; background: #e2e8f0; }
.filter-select-minimal { border: none; font-size: 13px; font-weight: 600; color: #475569; outline: none; cursor: pointer; background: transparent; }
.table-card { padding: 0; overflow: hidden; border: 1px solid #e5e7eb; }
.modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.modern-table th { background: #f9fafb; padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; }
.modern-table td { padding: 1rem 1.5rem; font-size: 0.875rem; vertical-align: middle; }
.row-hover:hover { background-color: #f8fafc; }
.name-column { display: flex; flex-direction: column; }
.type-tag { background: #eff6ff; color: #2563eb; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; width: fit-content; }
.code-badge { background: #f3f4f6; padding: 0.2rem 0.6rem; border-radius: 0.375rem; font-family: monospace; font-weight: 700; color: #374151; width: fit-content; }
.status-pill { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #fee2e2; color: #991b1b; }
.actions-group { display: flex; gap: 0.5rem; justify-content: flex-end; }
.action-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; border: 1px solid #e5e7eb; background: white; color: #64748b; transition: all 0.2s; }
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.action-btn.edit:hover { color: #6366f1; border-color: #c7d2fe; background: #f5f3ff; }
.action-btn.delete:hover { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
.pagination-footer { padding: 1.25rem 2rem; background: #ffffff; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
.per-page-selector { display: flex; align-items: center; gap: 0.875rem; }
.per-page-selector select { padding: 0.5rem 0.75rem; border-radius: 0.75rem; border: 1.5px solid #e2e8f0; font-size: 0.8125rem; font-weight: 700; color: #475569; appearance: none; background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E") no-repeat right 0.75rem center / 1rem; padding-right: 2.25rem; }
.pagination-controls { display: flex; align-items: center; gap: 2rem; }
.page-info { font-size: 0.875rem; color: #64748b; }
.page-info b { color: #0f172a; font-weight: 700; }
.page-buttons { display: flex; gap: 0.75rem; }
.page-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 0.875rem; border: 1.5px solid #e2e8f0; background: white; color: #64748b; transition: all 0.2s; cursor: pointer; }
.page-btn:hover:not(:disabled) { background: #f5f3ff; color: #6366f1; transform: translateY(-2px); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem; }
.modal-content.extra-large { background: white; width: 100%; max-width: 1000px; border-radius: 1.25rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; max-height: 90vh; }
.modal-header { padding: 1.75rem 2rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 1.25rem; position: relative; }
.header-icon { width: 48px; height: 48px; background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #6366f1; }
.header-text h2 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
.header-text p { font-size: 0.875rem; color: #64748b; }
.close-btn { position: absolute; top: 1.25rem; right: 1.25rem; background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; }
.modal-tabs-section { display: flex; gap: 0.5rem; padding: 0.5rem 2.5rem; background: #fbfcfe; border-bottom: 1px solid #f1f5f9; }
.modal-tab-btn { padding: 1rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; font-size: 12px; font-weight: 700; color: #94a3b8; border-bottom: 3px solid transparent; background: transparent; border: none; cursor: pointer; }
.modal-tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
.tab-badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 10px; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; }
.modal-body { padding: 2rem; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.form-group.full-width { grid-column: span 2; }
.form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 1rem; color: #94a3b8; }
.input-wrapper input, .input-wrapper select, .input-wrapper textarea { width: 100%; padding: 0.75rem 1rem 0.75rem 2.85rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.875rem; font-size: 0.95rem; color: #1e293b; transition: all 0.2s; outline: none; }
.input-wrapper input:focus, .input-wrapper select:focus, .input-wrapper textarea:focus { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08); }
.type-selector-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.type-selector { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 1.25rem; border: 2px solid #f1f5f9; background: #f8fafc; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
.type-selector.income.active { border-color: #10b981; background: #ecfdf5; color: #059669; }
.type-selector.expense.active { border-color: #f43f5e; background: #fff1f2; color: #e11d48; }
.amount-entry-card { background: #f5f3ff; border: 2px solid #e0e7ff; border-radius: 2rem; display: flex; align-items: center; padding: 1.5rem 2rem; position: relative; }
.currency-symbol { font-size: 1.5rem; font-weight: 900; color: #6366f1; margin-right: 1.5rem; border-right: 2px solid #e0e7ff; padding-right: 1.5rem; }
.amount-input { background: transparent; border: none; font-size: 2.5rem; font-weight: 950; color: #4338ca; width: 100%; outline: none; }
.amount-sync-warning { position: absolute; top: 100%; right: 1rem; margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; z-index: 5; }
.sync-item { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
.sync-item button { color: #6366f1; text-decoration: underline; margin-left: 0.5rem; border: none; background: transparent; font-weight: 800; cursor: pointer; }
.denominations-table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
.denominations-table th { font-size: 10px; font-weight: 800; color: #94a3b8; padding: 0 1rem; text-transform: uppercase; }
.denom-row td { background: #f8fafc; padding: 1rem; }
.denom-row td:first-child { border-top-left-radius: 1.25rem; border-bottom-left-radius: 1.25rem; border-left: 3px solid #6366f1; }
.denom-row td:last-child { border-top-right-radius: 1.25rem; border-bottom-right-radius: 1.25rem; }
.compact-input { width: 100%; background: white !important; border: 1.5px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem !important; font-size: 13px; font-weight: 600; outline: none; }
.add-row-btn { width: 100%; padding: 1rem; border-radius: 1.25rem; border: 2px dashed #e2e8f0; background: white; color: #6366f1; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; }
.envelope-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.envelope-card-premium { background: white; border-radius: 1.5rem; border: 1.5px solid #f1f5f9; overflow: hidden; }
.envelope-card-header { padding: 0.75rem 1.25rem; background: #fbfcfe; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.env-index { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 950; color: #cbd5e1; }
.env-remove-btn { color: #fca5a5; background: transparent; border: none; cursor: pointer; }
.envelope-card-body { padding: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.env-form-group label { font-size: 9px; font-weight: 800; color: #94a3b8; margin-bottom: 0.4rem; display: block; text-transform: uppercase; }
.env-input, .env-select, .env-textarea { width: 100%; border: 1.5px solid #f1f5f9; border-radius: 0.75rem; padding: 0.625rem !important; font-size: 12px; font-weight: 600; outline: none; background: #f8fafc !important; }
.add-envelope-btn { border-radius: 1.5rem; border: 3px dashed #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 2rem; color: #94a3b8; cursor: pointer; background: transparent; }
.envelope-summary-bar { background: #f8fafc; border-radius: 1.5rem; padding: 1.5rem 2.5rem; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 2.5rem; }
.modal-footer { padding: 1.5rem 2rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
.spinner { width: 2rem; height: 2rem; border: 3px solid #f3f3f3; border-top: 3px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
.spinner.small { width: 1rem; height: 1rem; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state, .empty-state { padding: 4rem 2rem; text-align: center; color: #64748b; display: flex; flex-direction: column; gap: 1rem; }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>

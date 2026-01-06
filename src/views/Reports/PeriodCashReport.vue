<template>
  <div class="master-data-page wide">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Laporan Kas per Periode</h1>
        <p class="page-subtitle">Rekapitulasi keuangan berdasarkan periode (mingguan/bulanan)</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="fetchReport">
          <RefreshCcw size="18" :class="{ 'animate-spin': loading }" /> <span>Refresh Laporan</span>
        </button>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card filter-card report-section-gap">
      <div class="p-6">
        <div class="flex flex-wrap items-end gap-6">
          <div class="filter-item flex-1 min-w-[300px]">
            <span class="filter-label">Periode Tanggal</span>
            <div class="flex items-center gap-2">
              <div class="input-wrapper-report flex-1">
                <Calendar size="16" class="input-icon" />
                <input v-model="filters.start_date" type="date" @change="fetchReport" class="report-input" />
              </div>
              <span class="text-slate-400 font-bold">s/d</span>
              <div class="input-wrapper-report flex-1">
                <Calendar size="16" class="input-icon" />
                <input v-model="filters.end_date" type="date" @change="fetchReport" class="report-input" />
              </div>
            </div>
          </div>
        
        </div>
      </div>

      <div class="p-6">
        <div class="filter-item min-w-[200px]">
            <span class="filter-label">Cabang / Branch</span>
            <div class="input-wrapper-report">
              <MapPin size="16" class="input-icon" />
              <select v-model="filters.church_id" @change="fetchReport" class="report-select">
                <option :value="null">Semua Cabang</option>
                <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
          </div>

          <div class="filter-item min-w-[200px]">
            <span class="filter-label">Jenis Dana (Fund)</span>
            <div class="input-wrapper-report">
              <Briefcase size="16" class="input-icon" />
              <select v-model="filters.fund_id" @change="fetchReport" class="report-select">
                <option :value="null">Semua Dana</option>
                <option v-for="f in funds" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </div>
          </div>
      </div>
    </div>

    <!-- Table Section -->
    <div class="card table-card shadow-sm border-slate-200">
      <div v-if="loading" class="loading-state h-64">
        <div class="spinner"></div>
        <p>Menghasilkan laporan...</p>
      </div>

      <div v-else-if="reportData.length === 0" class="empty-state h-64">
        <div class="empty-icon"><FileText size="48" /></div>
        <p>Tidak ada data periode ditemukan.</p>
      </div>

      <div v-else class="table-container shadow-none">
        <table class="modern-table border-none">
          <thead class="bg-slate-50/50">
            <tr>
              <th>Periode</th>
              <th class="text-right">Saldo Awal</th>
              <th class="text-right">Total Masuk</th>
              <th class="text-right">Total Keluar</th>
              <th class="text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in reportData" :key="index" class="row-hover border-b border-slate-100 last:border-0">
              <td class="font-medium text-slate-700">
                <div class="flex flex-col">
                    <span class="font-bold">{{ item.period_name }}</span>
                    <span class="text-[10px] text-slate-400">{{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}</span>
                </div>
              </td>
              <td class="text-right font-semibold text-slate-600">
                {{ formatCurrency(item.opening_balance) }}
              </td>
              <td class="text-right font-bold text-emerald-600">
                {{ formatCurrency(item.total_income) }}
              </td>
              <td class="text-right font-bold text-rose-600">
                {{ formatCurrency(item.total_expense) }}
              </td>
              <td class="text-right font-black text-indigo-600">
                {{ formatCurrency(item.closing_balance) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Calendar, MapPin, Briefcase, RefreshCcw, FileText
} from 'lucide-vue-next';

const auth = useAuthStore();
const loading = ref(true);
const reportData = ref([]);

// Default to current month
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

const filters = ref({
  start_date: firstDay,
  end_date: lastDay,
  church_id: auth.activeBranch,
  fund_id: null
});

const branches = ref([]);
const funds = ref([]);

const fetchMasterData = async () => {
  try {
    const [branchRes, fundRes] = await Promise.all([
      axios.get('/branches', { params: { per_page: 999 } }),
      axios.get('/funds', { params: { per_page: 999 } })
    ]);
    branches.value = branchRes.data.data;
    funds.value = fundRes.data.data;
  } catch (error) {
    console.error('Failed to fetch filter options', error);
  }
};

const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/reports/cash-period', {
      params: filters.value
    });
    reportData.value = res.data.data;
  } catch (error) {
    console.error('Failed to fetch report', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(val);
};

onMounted(() => {
  fetchMasterData();
  fetchReport();
});
</script>

<style scoped>
.master-data-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.master-data-page.wide { max-width: 1600px; }
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; gap: 2rem; }
.page-title { font-size: 1.875rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; margin-bottom: 0.25rem; }
.page-subtitle { color: #6b7280; font-size: 0.95rem; }

.report-section-gap { margin-bottom: 1rem; }

.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; cursor: pointer; border: 1px solid transparent; }
.btn-primary { background: #6366f1; color: white; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }

.card { background: white; border-radius: 1.25rem; border: 1px solid #e2e8f0; }
.filter-card { border: none; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); }

.filter-label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
.input-wrapper-report { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 0.875rem; color: #94a3b8; pointer-events: none; }
.report-input, .report-select { width: 100%; padding: 0.625rem 0.875rem 0.625rem 2.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.875rem; color: #334155; font-weight: 600; outline: none; transition: all 0.2s; }
.report-input:focus, .report-select:focus { border-color: #6366f1; background-color: white; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

/* Table overrides */
.modern-table th { font-weight: 800; font-size: 0.7rem; color: #64748b; padding: 1.25rem 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
.modern-table td { padding: 1.25rem 1.5rem; vertical-align: middle; font-size: 0.875rem; }
.row-hover:hover { background-color: #fbfcfe; }

.loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #94a3b8; }
.spinner { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>

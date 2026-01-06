<template>
  <div class="master-data-page dashboard-viewport">
    <!-- Header Section -->
    <div class="header-section mb-10">
      <div class="title-group">
        <h1 class="page-title !text-4xl">Dashboard Overview</h1>
        <div class="flex items-center gap-2 mt-1">
          <div class="w-10 h-1 bg-indigo-600 rounded-full"></div>
          <p class="page-subtitle !text-slate-500 !italic">Ringkasan aktivitas gereja di cabang {{ auth.activeBranch?.name }}</p>
        </div>
      </div>
      <div class="header-time-premium hidden lg:flex flex-col items-end">
        <span class="digital-clock">{{ currentTime }}</span>
        <span class="calendar-date">{{ currentDate }}</span>
      </div>
    </div>

    <!-- Full Dashboard - Only if user has akses_dashboard -->
    <template v-if="auth.user?.akses_dashboard">
      <!-- Summary Cards Row - FORCED SINGLE ROW -->
      <div class="stats-container-premium mb-20">
        <!-- Total Jemaat Card -->
        <div class="card stat-card-premium blue-wing group">
          <div class="stat-main">
            <div class="stat-icon-bg bg-blue-50 text-blue-600"> 
              <Users size="28" />
            </div>
            <div class="stat-details">
              <span class="stat-tag text-blue-600 bg-blue-50">Active</span>
              <div class="stat-number">{{ stats.total_members || 0 }}</div>
              <h3 class="stat-title">Total Jemaat</h3>
            </div>
          </div>
          <div class="hover-glow bg-blue-400/20"></div>
        </div>

        <!-- Served Members Card -->
        <div class="card stat-card-premium green-wing group">
          <div class="stat-main">
            <div class="stat-icon-bg bg-emerald-50 text-emerald-600">
              <CheckCircle size="28" />
            </div>
            <div class="stat-details">
              <span class="stat-tag text-emerald-600 bg-emerald-50">Success</span>
              <div class="stat-number">{{ stats.served_members || 0 }}</div>
              <h3 class="stat-title">Layanan Selesai</h3>
            </div>
          </div>
          <div class="hover-glow bg-emerald-400/20"></div>
        </div>

        <!-- Active Servers Card -->
        <div class="card stat-card-premium amber-wing group">
          <div class="stat-main">
            <div class="stat-icon-bg bg-amber-50 text-amber-600">
              <Briefcase size="28" />
            </div>
            <div class="stat-details">
              <span class="stat-tag text-amber-600 bg-amber-50">Assigned</span>
              <div class="stat-number">{{ stats.active_servers || 0 }}</div>
              <h3 class="stat-title">Pelayan Aktif</h3>
            </div>
          </div>
          <div class="hover-glow bg-amber-400/20"></div>
        </div>
      </div>

      <!-- Birthdays Row -->
      <div class="content-section mt-2">
        <div class="card table-card premium-shadow overflow-hidden">
          <div class="card-header-bar">
            <div class="flex items-center gap-4">
              <div class="header-icon-box bg-pink-500">
                <Cake size="24" class="text-white" />
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-800">Ulang Tahun Bulan Ini</h2>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ currentMonthName + ', ' + currentYear }}</p>
              </div>
            </div>
            <div class="count-pill">
               <span class="pulse-dot"></span>
               <b>{{ birthdays.length }}</b> Jemaat
            </div>
          </div>
          
          <div class="table-v-scroll custom-scrollbar">
            <div v-if="loading" class="table-loading-state">
              <div class="spinner-dual"></div>
              <p>Menyelaraskan Data Jemaat...</p>
            </div>
            
            <table v-else-if="birthdays.length > 0" class="modern-table">
              <thead>
                <tr>
                  <th class="text-center w-16">No</th>
                  <th>Informasi Jemaat</th>
                  <th>Tanggal Lahir</th>
                  <th class="text-center">Umur</th>
                  <th class="text-right pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(person, idx) in birthdays" :key="person.id" class="row-hover-premium">
                  <td class="text-center">
                    <span class="row-number">{{ idx + 1 }}</span>
                  </td>
                  <td>
                    <div class="user-info-cell">
                      <div class="user-avatar shadow-sm">
                        <img v-if="person.foto" :src="person.foto" />
                        <div v-else class="avatar-letter">
                          {{ person.nama_lengkap.charAt(0) }}
                        </div>
                      </div>
                      <div class="user-text">
                        <span class="user-name">{{ person.nama_lengkap }}</span>
                        <span class="user-status">Anggota Aktif</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="date-badge">
                      <Calendar size="12" />
                      <span>{{ formatDate(person.tanggal_lahir) }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="age-pill">{{ calculateAge(person.tanggal_lahir) }} th</span>
                  </td>
                  <td class="text-right pr-8">
                    <button class="btn-wa-action" @click="sendWish(person)">
                      <Send size="14" /> 
                      <span>Kirim Ucapan</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-else class="empty-data-state py-20">
              <div class="empty-icon-circle">
                <CalendarX size="40" class="text-slate-300" />
              </div>
              <p>Tidak ada jemaat yang berulang tahun pada bulan ini.</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Greeting Only - If user doesn't have akses_dashboard -->
    <template v-else>
      <div class="greeting-container">
        <div class="card greeting-card">
          <div class="greeting-content">
            <div class="greeting-icon">
              <Users size="64" class="text-indigo-400" />
            </div>
            <h2 class="greeting-title">Selamat Datang, {{ auth.user?.name }}!</h2>
            <p class="greeting-subtitle">Anda terhubung ke cabang <b>{{ auth.activeBranch?.name }}</b></p>
            <div class="greeting-time">
              <div class="time-display-large">{{ currentTime }}</div>
              <div class="date-display-large">{{ currentDate }}</div>
            </div>
            <div class="greeting-message">
              <p>Akses dashboard Anda terbatas. Silakan hubungi administrator untuk informasi lebih lanjut.</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { 
  Users, CheckCircle, Briefcase, Cake, Send, CalendarX, Calendar
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const stats = ref({});
const birthdays = ref([]);
const loading = ref(true);

const currentTime = ref('');
const currentDate = ref('');
const currentMonthName = computed(() => {
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());
});
const currentYear = computed(() => {
  return new Intl.DateTimeFormat('id-ID', { year: 'numeric' }).format(new Date());
});

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const fetchData = async () => {
  if (!auth.activeBranch) return;
  
  loading.value = true;
  try {
    const res = await axios.get('/dashboard/stats', {
      params: { church_id: auth.activeBranch.id }
    });
    stats.value = res.data.stats;
    birthdays.value = res.data.birthdays;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
};

const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const sendWish = (person) => {
  Swal.fire({
    title: 'Kirim Ucapan?',
    html: `Kirim pesan selamat ulang tahun untuk <b class="text-indigo-600">${person.nama_lengkap}</b>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Kirim WA',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#94a3b8',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      const text = `Selamat ulang tahun ke-${calculateAge(person.tanggal_lahir)} untuk Bapak/Ibu/Sdr ${person.nama_lengkap}. Tuhan Yesus Memberkati!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  });
};

watch(() => auth.activeBranch, () => {
  fetchData();
});

onMounted(() => {
  updateTime();
  setInterval(updateTime, 1000);
  fetchData();
});
</script>

<style scoped>
.dashboard-viewport {
  padding: 2.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Clock Styling */
.digital-clock {
  font-size: 2.5rem;
  font-weight: 900;
  color: #4f46e5;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}

.calendar-date {
  font-size: 0.8rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* FORCED SINGLE ROW FLEX */
.stats-container-premium {
  display: flex;
  gap: 2rem;
  width: 100%;
  margin-bottom: 2rem; /* 80px gap between stats and birthday section */
}

.stat-card-premium {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 1.75rem;
  border-radius: 1.5rem;
  background: white;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card-premium:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.stat-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 2;
}

.stat-icon-bg {
  width: 60px;
  height: 60px;
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8);
}

.stat-tag {
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  display: inline-block;
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
}

.stat-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 0.25rem;
}

.hover-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.stat-card-premium:hover .hover-glow {
  opacity: 1;
}

/* Wing Accents */
.blue-wing { border-bottom: 4px solid #3b82f6; }
.green-wing { border-bottom: 4px solid #10b981; }
.amber-wing { border-bottom: 4px solid #f59e0b; }

/* Table Section */
.card-header-bar {
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px -4px rgba(236, 72, 153, 0.3);
}

.count-pill {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-radius: 99px;
  font-size: 0.8rem;
  color: #475569;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.table-v-scroll {
  max-height: 500px;
  overflow-y: auto;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: #f1f5f9;
}

.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-letter {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-weight: 900; background: #eef2ff; color: #6366f1;
}

.user-name { display: block; font-weight: 800; color: #1e293b; }
.user-status { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

.row-number { font-weight: 900; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; }

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #fdf2f8;
  color: #db2777;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.age-pill {
  background: #f0fdf4;
  color: #166534;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid #dcfce7;
}

.btn-wa-action {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.125rem;
  background: #10b981;
  color: white;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-wa-action:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.empty-data-state {
  text-align: center;
  color: #94a3b8;
  font-weight: 600;
}

.empty-icon-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: #f8fafc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Spinner */
.table-loading-state {
  padding: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #64748b;
  font-weight: 700;
  gap: 1.5rem;
}

.spinner-dual {
  width: 32px;
  height: 32px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-bottom-color: #6366f1;
  border-radius: 50%;
  animation: dual-spin 1s linear infinite;
}

@keyframes dual-spin {
  to { transform: rotate(360deg); }
}

/* Greeting Section */
.greeting-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.greeting-card {
  max-width: 700px;
  width: 100%;
  padding: 4rem 3rem;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
}

.greeting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.greeting-icon {
  width: 120px;
  height: 120px;
  background: #eef2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.greeting-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0;
}

.greeting-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 600;
}

.greeting-time {
  margin: 2rem 0;
  padding: 2rem;
  background: white;
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.time-display-large {
  font-size: 3rem;
  font-weight: 900;
  color: #4f46e5;
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.5rem;
}

.date-display-large {
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.greeting-message {
  padding: 1.5rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 1rem;
  color: #92400e;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .stats-container-premium { flex-wrap: wrap; }
  .stat-card-premium { flex: 1 1 calc(50% - 1rem); }
}

@media (max-width: 768px) {
  .stat-card-premium { flex: 1 1 100%; }
  .greeting-card { padding: 2rem 1.5rem; }
  .greeting-title { font-size: 1.75rem; }
  .time-display-large { font-size: 2rem; }
}
</style>

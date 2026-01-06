<template>
  <div class="users-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage system users, their access levels and assigned branches</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..." 
            class="search-input"
            @input="debounceSearch"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Add User</span>
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading user directory...</p>
      </div>
      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-icon"><Search size="48" /></div>
        <p>No users match your criteria.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>User Info</th>
              <th>Roles</th>
              <th>Branches</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="row-hover">
              <td class="user-info-cell">
                <div class="flex items-center gap-3">
                  <div class="avatar-circle">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-dark">{{ user.name }}</span>
                    <span class="text-xs text-muted">{{ user.email }}</span>
                    <span v-if="user.member" class="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                       <User size="10" /> Member: {{ user.member.nama_lengkap }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="badges-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="role in user.roles" :key="role.id" class="badge-pill role">
                    {{ role.name }}
                  </span>
                  <span v-if="!user.roles?.length" class="text-xs text-muted">No roles</span>
                </div>
              </td>
              <td class="badges-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="branch in user.branches" :key="branch.id" class="badge-pill branch">
                    {{ branch.name }}
                  </span>
                  <span v-if="!user.branches?.length" class="text-xs text-muted">No branches</span>
                </div>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(user)" title="Edit User" :disabled="saving">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="confirmDelete(user)" title="Delete User" :disabled="saving">
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
            <span class="text-xs font-bold text-muted">SHOWING</span>
            <select v-model="pagination.per_page" @change="fetchUsers(1)" :disabled="saving">
              <option :value="10">10 entries</option>
              <option :value="25">25 entries</option>
              <option :value="50">50 entries</option>
              <option :value="100">100 entries</option>
            </select>
          </div>
          
          <div class="pagination-controls">
            <span class="page-info">
              <b>{{ pagination.from || 0 }}-{{ pagination.to || 0 }}</b> of <b>{{ pagination.total }}</b>
            </span>
            <div class="page-buttons">
              <button 
                class="page-btn" 
                :disabled="pagination.current_page === 1 || saving" 
                @click="fetchUsers(pagination.current_page - 1)"
              >
                <ChevronLeft size="18" />
              </button>
              <button 
                class="page-btn" 
                :disabled="pagination.current_page === pagination.last_page || saving" 
                @click="fetchUsers(pagination.current_page + 1)"
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
        <div class="modal-content large">
          <div class="modal-header">
            <div class="header-icon">
              <UserPlus v-if="!editingId" size="24" />
              <UserCog v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Account' : 'New User Account' }}</h2>
              <p>{{ editingId ? 'Modify credentials and access for this user' : 'Fill in the information below to create a new user profile' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>
          
          <form @submit.prevent="saveUser" class="modal-body">
            <div class="form-grid-main">
              <!-- Left: Basic Info -->
              <div class="form-section">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <div class="input-wrapper">
                    <User size="18" class="input-icon" />
                    <input v-model="form.name" type="text" required placeholder="Full Name" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <div class="input-wrapper">
                    <Mail size="18" class="input-icon" />
                    <input v-model="form.email" type="email" required placeholder="email@example.com" :disabled="saving" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    {{ editingId ? 'New Password (Optional)' : 'Default Password' }}
                  </label>
                  <div class="input-wrapper">
                    <Key size="18" class="input-icon" />
                    <input 
                      v-model="form.password" 
                      type="password" 
                      :required="!editingId" 
                      placeholder="••••••••" 
                      :disabled="saving"
                    />
                  </div>
                </div>

                <div class="form-group mt-4">
                  <label class="form-label">Linked Jemaat Member</label>
                  <div class="selection-box">
                    <div class="box-header">
                      <User size="16" />
                      <span>Search Member</span>
                    </div>
                    <div class="search-wrapper-inner">
                       <input 
                         type="text" 
                         v-model="jemaatSearch" 
                         @input="searchJemaat" 
                         placeholder="Type name or NIK..." 
                         class="search-input-small"
                       />
                       <Search size="14" class="search-icon-small" />
                    </div>
                    <div class="box-content mini-list">
                       <div v-if="searchingJemaat" class="text-xs text-center py-2">Searching...</div>
                       <div v-else-if="jemaatOptions.length === 0 && jemaatSearch.length >= 2" class="text-xs text-center py-2">No members found</div>
                       
                       <div 
                         v-for="j in jemaatOptions" 
                         :key="j.id" 
                         class="jemaat-option" 
                         :class="{ selected: form.member_id === j.id }"
                         @click="selectJemaat(j)"
                       >
                         <div class="flex flex-col">
                           <span class="text-sm font-bold">{{ j.nama_lengkap }}</span>
                           <span class="text-[10px] text-muted">NIK: {{ j.nik }}</span>
                         </div>
                       </div>

                       <div v-if="selectedMemberName" class="selected-member-pill">
                         <Check size="12" class="text-green-500" />
                         <span class="text-xs text-dark">Linked: <b>{{ selectedMemberName }}</b></span>
                         <button type="button" class="clear-selection" @click.stop="clearJemaat">
                           <X size="12" />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Selection Boxes -->
              <div class="selection-area">
                <div class="selection-box">
                  <div class="box-header">
                    <ShieldCheck size="16" />
                    <span>Assign Roles</span>
                  </div>
                  <div class="box-content checkboxes">
                    <label v-for="role in allRoles" :key="role?.id" class="checkbox-item" :class="{ selected: form.roles.includes(role?.id) }">
                      <input type="checkbox" :value="role?.id" v-model="form.roles" :disabled="saving" />
                      <span class="label-text">{{ role?.name }}</span>
                    </label>
                  </div>
                </div>

                <div class="selection-box mt-4">
                  <div class="box-header">
                    <Building size="16" />
                    <span>Branch Access</span>
                  </div>
                  <div class="box-content checkboxes">
                    <label v-for="branch in allBranches" :key="branch?.id" class="checkbox-item" :class="{ selected: form.branches.includes(branch?.id) }">
                      <input type="checkbox" :value="branch?.id" v-model="form.branches" :disabled="saving" />
                      <span class="label-text">{{ branch?.name }}</span>
                    </label>
                  </div>
                </div>

                <div class="selection-box mt-4">
                  <div class="box-header">
                    <Key size="16" />
                    <span>Service Permissions</span>
                  </div>
                  <div class="box-content checkboxes">
                    <label class="checkbox-item" :class="{ selected: form.can_request_service }">
                      <input type="checkbox" v-model="form.can_request_service" :disabled="saving" />
                      <span class="label-text">Can Request Service</span>
                    </label>
                    <label class="checkbox-item" :class="{ selected: form.can_approve_service }">
                      <input type="checkbox" v-model="form.can_approve_service" :disabled="saving" />
                      <span class="label-text">Can Approve Service</span>
                    </label>
                  </div>
                </div>

                <div class="selection-box mt-4">
                  <div class="box-header">
                    <Building size="16" />
                    <span>Dashboard Access</span>
                  </div>
                  <div class="box-content checkboxes">
                    <label class="checkbox-item" :class="{ selected: form.akses_dashboard }">
                      <input type="checkbox" v-model="form.akses_dashboard" :disabled="saving" />
                      <span class="label-text">Allow Dashboard Access</span>
                    </label>
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
                  <span>{{ editingId ? 'Update User' : 'Register User' }}</span>
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
  UserPlus, UserCog, Mail, Key, User, ShieldCheck, Building, Check
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

// State
const users = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');
const timer = ref(null);

const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0
});

const allRoles = ref([]);
const allBranches = ref([]);

const form = ref({
  name: '',
  email: '',
  password: '',
  roles: [],
  branches: [],
  can_request_service: false,
  can_approve_service: false,
  member_id: null,
  akses_dashboard: true
});

const jemaatSearch = ref('');
const jemaatOptions = ref([]);
const searchingJemaat = ref(false);
const selectedMemberName = ref('');
const jemaatTimer = ref(null);

// Logic
const fetchUsers = async (page = 1) => {
  loading.value = true;
  try {
    const response = await axios.get('/users', {
      params: {
        page: page,
        per_page: pagination.value.per_page,
        search: searchQuery.value
      }
    });
    users.value = response.data.data;
    pagination.value = {
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
      from: response.data.from,
      to: response.data.to
    };
  } catch (error) {
    console.error('Fetch users failed', error);
  } finally {
    loading.value = false;
  }
};

const fetchOptions = async () => {
  try {
    const [rolesRes, branchesRes] = await Promise.all([
      axios.get('/roles'),
      axios.get('/branches')
    ]);
    allRoles.value = rolesRes.data;
    allBranches.value = branchesRes.data.data || branchesRes.data;
  } catch (error) {
    console.error('Fetch options failed', error);
  }
};

const debounceSearch = () => {
  clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    fetchUsers(1);
  }, 500);
};

onMounted(() => {
  fetchUsers();
  fetchOptions();
});

const openModal = (user = null) => {
  if (user) {
    editingId.value = user.id;
    form.value = {
      name: user.name,
      email: user.email,
      password: '',
      roles: (user.roles || []).map(r => r?.id).filter(id => id),
      branches: (user.branches || []).map(b => b?.id).filter(id => id),
      can_request_service: !!user.can_request_service,
      can_approve_service: !!user.can_approve_service,
      member_id: user.member_id,
      akses_dashboard: user.akses_dashboard !== undefined ? !!user.akses_dashboard : true
    };
    selectedMemberName.value = user.member?.nama_lengkap || '';
    jemaatSearch.value = '';
    jemaatOptions.value = [];
  } else {
    editingId.value = null;
    form.value = { 
        name: '', email: '', password: '', 
        roles: [], branches: [], 
        can_request_service: true, can_approve_service: false,
        member_id: null,
        akses_dashboard: true
    };
    selectedMemberName.value = '';
    jemaatSearch.value = '';
    jemaatOptions.value = [];
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingId.value = null;
};

const saveUser = async () => {
  saving.value = true;
  try {
    const data = { ...form.value };
    if (editingId.value) {
      if (!data.password) delete data.password;
      await axios.put(`/users/${editingId.value}`, data);
    } else {
      await axios.post('/users', data);
    }
    
    await fetchUsers(pagination.value.current_page);
    closeModal();
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'User profile has been updated.',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to save user.';
    Swal.fire('Error', message, 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async (user) => {
  const result = await Swal.fire({
    title: 'Delete User?',
    text: `Are you sure you want to remove ${user.name}? This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete account'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/users/${user.id}`);
      await fetchUsers(pagination.value.current_page);
      Swal.fire('Deleted!', 'User account has been removed.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to delete user.', 'error');
    }
  }
};
const searchJemaat = () => {
  if (!jemaatSearch.value || jemaatSearch.value.length < 2) {
    jemaatOptions.value = [];
    return;
  }
  
  clearTimeout(jemaatTimer.value);
  jemaatTimer.value = setTimeout(async () => {
    searchingJemaat.value = true;
    try {
      const response = await axios.get('/jemaat', {
        params: { search: jemaatSearch.value, per_page: 5 }
      });
      jemaatOptions.value = response.data.data || response.data;
    } catch (error) {
      console.error('Jemaat search failed', error);
    } finally {
      searchingJemaat.value = false;
    }
  }, 400);
};

const selectJemaat = (j) => {
  form.value.member_id = j.id;
  selectedMemberName.value = j.nama_lengkap;
  jemaatOptions.value = [];
  jemaatSearch.value = '';
};

const clearJemaat = () => {
  form.value.member_id = null;
  selectedMemberName.value = '';
};
</script>

<style scoped>
.users-page {
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

.user-info-cell {
  min-width: 250px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
}

.badge-pill {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.badge-pill.role {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.badge-pill.branch {
  background: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

/* Pagination Footer */
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

.modal-content.large {
  max-width: 850px;
}

.modal-content {
  background: white;
  width: 100%;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
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

.modal-body {
  padding: 2rem;
}

.form-grid-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
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

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  font-size: 0.95rem;
}

/* Selection Area */
.selection-box {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  overflow: hidden;
}

.box-header {
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
}

.box-content {
  padding: 0.75rem;
  max-height: 180px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 0.25rem;
}

.checkbox-item.selected {
  background: #eef2ff;
  color: #4f46e5;
}

.modal-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Base Styles */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.gap-3 { gap: 0.75rem; }
.gap-1 { gap: 0.25rem; }
.mt-4 { margin-top: 1rem; }
.font-bold { font-weight: 700; }
.text-dark { color: #1e293b; }
.text-muted { color: #64748b; }
.text-right { text-align: right; }

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
}

.action-btn.edit:hover { background: #f5f3ff; color: #6366f1; border-color: #c7d2fe; }
.action-btn.delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

.loading-state {
  padding: 4rem;
  text-align: center;
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

.spinner.small { width: 1.25rem; height: 1.25rem; border-width: 2px; margin: 0 0.5rem 0 0; }

@keyframes spin { to { transform: rotate(360deg); } }
/* Jemaat Search Specifics */
.search-wrapper-inner {
  position: relative;
  padding: 0.5rem 0.75rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.search-input-small {
  width: 100%;
  padding: 0.4rem 0.75rem 0.4rem 2.25rem;
  font-size: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #f8fafc;
}

.search-icon-small {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.jemaat-option {
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  margin-bottom: 0.25rem;
  transition: all 0.2s;
}

.jemaat-option:hover {
  background: #f1f5f9;
}

.jemaat-option.selected {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.selected-member-pill {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-selection {
  margin-left: auto;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.clear-selection:hover {
  color: #ef4444;
}

.mini-list {
  max-height: 200px;
}
</style>

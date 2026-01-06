<template>
  <div class="roles-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Role Management</h1>
        <p class="page-subtitle">Configure system roles, permissions, and menu accessibility</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search roles..." 
            class="search-input"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Add Role</span>
        </button>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading roles and permissions...</p>
      </div>
      <div v-else-if="filteredRoles.length === 0" class="empty-state">
        <div class="empty-icon"><Search size="48" /></div>
        <p>No roles found matching your search.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 200px">Role Name</th>
              <th>Permissions</th>
              <th>Menu Access</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in filteredRoles" :key="role.id" class="row-hover">
              <td class="role-name-cell">
                <div class="flex items-center gap-3">
                  <div class="status-indicator"></div>
                  <span class="font-bold">{{ role.name }}</span>
                </div>
              </td>
              <td class="badges-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="p in role.permissions" :key="p.id" class="badge-pill permission">
                    {{ p.name }}
                  </span>
                  <span v-if="!role.permissions?.length" class="text-xs text-muted">No permissions</span>
                </div>
              </td>
              <td class="badges-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="m in role.menus" :key="m.id" class="badge-pill menu">
                    {{ m.title }}
                  </span>
                  <span v-if="!role.menus?.length" class="text-xs text-muted">No menus</span>
                </div>
              </td>
              <td>
                <div class="actions-group">
                  <button class="action-btn edit" @click="openModal(role)" title="Edit Role" :disabled="saving">
                    <Edit2 size="16" />
                  </button>
                  <button class="action-btn delete" @click="deleteRole(role.id)" title="Delete Role" :disabled="saving">
                    <Trash2 size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="!saving && closeModal()">
        <div class="modal-content large">
          <div class="modal-header">
            <div class="header-icon">
              <Shield v-if="!editingId" size="24" />
              <Edit2 v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Role' : 'Create New Role' }}</h2>
              <p>{{ editingId ? 'Modify existing system permissions and access' : 'Define new access levels for system users' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>
          
          <form @submit.prevent="saveRole" class="modal-body">
            <div class="form-section">
              <div class="form-group full-width">
                <label class="form-label">Role Name</label>
                <div class="input-wrapper">
                  <Type size="18" class="input-icon" />
                  <input v-model="form.name" type="text" required placeholder="Display name (e.g. System Admin)" :disabled="saving" />
                </div>
              </div>

              <div class="selection-grid">
                <!-- Permissions Selection -->
                <div class="selection-box">
                  <div class="box-header">
                    <Lock size="16" />
                    <span>Permissions</span>
                  </div>
                  <div class="box-content checkboxes">
                    <label v-for="p in allPermissions" :key="p.id" class="checkbox-item" :class="{ selected: form.permissions.includes(p.id) }">
                      <input type="checkbox" :value="p.id" v-model="form.permissions" :disabled="saving" />
                      <span class="label-text">{{ p.name }}</span>
                    </label>
                    <div v-if="!allPermissions.length" class="text-xs text-muted p-4">No permissions available</div>
                  </div>
                </div>

                <!-- Menus Selection (Tree) -->
                <div class="selection-box">
                  <div class="box-header">
                    <Layout size="16" />
                    <span>Menu Accessibility</span>
                  </div>
                  <div class="box-content hierarchical">
                    <template v-for="menu in menuTree" :key="menu.id">
                      <!-- Parent Menu -->
                      <div class="tree-item parent">
                        <button type="button" class="expand-toggle" @click="toggleExpand(menu.id)" v-if="menu.children?.length">
                          <ChevronDown size="14" :class="{ 'rotate-n90': !expandedMenus.has(menu.id) }" />
                        </button>
                        <div v-else class="expand-spacer"></div>
                        <label class="checkbox-item" :class="{ selected: form.menus.includes(menu.id) }">
                          <input 
                            type="checkbox" 
                            :checked="form.menus.includes(menu.id)" 
                            @change="e => handleMenuSelection(menu, e.target.checked)"
                            :disabled="saving" 
                          />
                          <span class="label-text font-bold text-slate-800">{{ menu.title }}</span>
                        </label>
                      </div>
                      
                      <!-- Level 2 and Below (Recursive/Loop) -->
                      <template v-if="expandedMenus.has(menu.id)">
                        <template v-for="child in menu.children" :key="child.id">
                          <div class="tree-item child pl-10">
                            <button type="button" class="expand-toggle" @click="toggleExpand(child.id)" v-if="child.children?.length">
                              <ChevronDown size="12" :class="{ 'rotate-n90': !expandedMenus.has(child.id) }" />
                            </button>
                            <div v-else class="expand-spacer small"></div>
                            <label class="checkbox-item" :class="{ selected: form.menus.includes(child.id) }">
                              <input 
                                type="checkbox" 
                                :checked="form.menus.includes(child.id)" 
                                @change="e => handleMenuSelection(child, e.target.checked)"
                                :disabled="saving" 
                              />
                              <span class="label-text font-semibold">{{ child.title }}</span>
                            </label>
                          </div>
                          
                          <!-- Level 3 -->
                          <template v-if="expandedMenus.has(child.id)">
                            <div v-for="grandchild in child.children" :key="grandchild.id" class="tree-item grandchild pl-20">
                              <div class="expand-spacer smaller"></div>
                              <label class="checkbox-item" :class="{ selected: form.menus.includes(grandchild.id) }">
                                <input 
                                  type="checkbox" 
                                  :checked="form.menus.includes(grandchild.id)" 
                                  @change="e => handleMenuSelection(grandchild, e.target.checked)"
                                  :disabled="saving" 
                                />
                                <span class="label-text text-slate-500">{{ grandchild.title }}</span>
                              </label>
                            </div>
                          </template>
                        </template>
                      </template>
                    </template>
                    <div v-if="!menuTree.length" class="text-xs text-muted p-4">No menus available</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Discard</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Saving Changes...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Role' : 'Confirm & Save' }}</span>
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
import { ref, onMounted, computed } from 'vue';
import axios from '../../axios';
import { 
  Plus, Edit2, Trash2, X, Search, Check, Type, 
  Shield, Lock, Layout, ChevronDown 
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const roles = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');

const allPermissions = ref([]);
const menuTree = ref([]);
const expandedMenus = ref(new Set());

const form = ref({
  name: '',
  permissions: [],
  menus: []
});

const toggleExpand = (id) => {
  if (expandedMenus.value.has(id)) {
    expandedMenus.value.delete(id);
  } else {
    expandedMenus.value.add(id);
  }
  // Trigger reactivity
  expandedMenus.value = new Set(expandedMenus.value);
};

const handleMenuSelection = (menu, isChecked) => {
  const currentMenus = new Set(form.value.menus);
  
  const processDescendants = (item, checked) => {
    if (checked) currentMenus.add(item.id);
    else currentMenus.delete(item.id);
    
    if (item.children) {
      item.children.forEach(child => processDescendants(child, checked));
    }
  };

  const processAncestors = (menuId) => {
    // We need to find the ancestors. Since our tree is nested, we can trace back if we had parent references.
    // Alternatively, we can search the tree for this menuId and collect its parents.
    const ancestors = [];
    const findAncestors = (list, targetId, path = []) => {
      for (const item of list) {
        if (item.id === targetId) {
          ancestors.push(...path);
          return true;
        }
        if (item.children && findAncestors(item.children, targetId, [...path, item.id])) {
          return true;
        }
      }
      return false;
    };
    findAncestors(menuTree.value, menuId);
    ancestors.forEach(id => currentMenus.add(id));
  };

  processDescendants(menu, isChecked);
  if (isChecked) {
    processAncestors(menu.id);
  }

  form.value.menus = Array.from(currentMenus);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [rolesRes, permRes, menuRes] = await Promise.all([
      axios.get('/roles'),
      axios.get('/permissions'),
      axios.get('/menus-tree')
    ]);
    roles.value = rolesRes.data;
    allPermissions.value = permRes.data;
    menuTree.value = menuRes.data;
  } catch (error) {
    console.error('Failed to fetch data', error);
  } finally {
    loading.value = false;
  }
};

const filteredRoles = computed(() => {
  if (!searchQuery.value) return roles.value;
  const query = searchQuery.value.toLowerCase();
  return roles.value.filter(role => role.name.toLowerCase().includes(query));
});

onMounted(fetchData);

const openModal = (role = null) => {
  if (role) {
    editingId.value = role.id;
    form.value = {
      name: role.name,
      permissions: role.permissions.map(p => p.id),
      menus: role.menus.map(m => m.id)
    };
  } else {
    editingId.value = null;
    form.value = { name: '', permissions: [], menus: [] };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveRole = async () => {
  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/roles/${editingId.value}`, form.value);
    } else {
      await axios.post('/roles', form.value);
    }
    await fetchData();
    closeModal();
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Role settings have been updated.',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire('Error', 'Failed to save role configuration.', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteRole = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This action will revoke access for all users assigned to this role!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/roles/${id}`);
      await fetchData();
      Swal.fire('Deleted!', 'The role has been removed.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to delete role.', 'error');
    }
  }
};
</script>

<style scoped>
.roles-page {
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

.status-indicator {
  width: 4px;
  height: 20px;
  background: #6366f1;
  border-radius: 2px;
}

.badges-cell {
  max-width: 400px;
}

.badge-pill {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 2rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-pill.permission {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.badge-pill.menu {
  background: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
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
  max-width: 800px;
}

.modal-content {
  background: white;
  width: 100%;
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
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
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #64748b;
}

.modal-body {
  padding: 2rem;
}

/* Selection Grids */
.selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.selection-box {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.box-header {
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.box-content {
  padding: 0.75rem;
  max-height: 250px;
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

.checkbox-item:hover {
  background: #ffffff;
}

.checkbox-item.selected {
  background: #eef2ff;
  color: #4f46e5;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  cursor: pointer;
}

.label-text {
  font-size: 0.875rem;
}

.modal-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Transitions */
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

/* Global Helpers */
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.pl-6 { padding-left: 1.5rem; }
.pl-10 { padding-left: 2.25rem; }
.pl-20 { padding-left: 3.75rem; }
.text-right { text-align: right; }

.tree-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  position: relative;
}

.tree-item::before {
  content: '';
  position: absolute;
  left: 0.65rem;
  top: -0.5rem;
  bottom: 0.5rem;
  border-left: 1px solid #e2e8f0;
}

.tree-item.parent::before {
  display: none;
}

.expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s;
}

.expand-toggle:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.expand-spacer { width: 20px; flex-shrink: 0; }
.expand-spacer.small { width: 18px; }
.expand-spacer.smaller { width: 16px; }

.rotate-n90 {
  transform: rotate(-90deg);
}
.font-bold { font-weight: 700; }
.text-muted { color: #94a3b8; }

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
  color: #1e293b;
  transition: all 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}
</style>

<template>
  <div class="menus-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Menu Management</h1>
        <p class="page-subtitle">Configure your application's navigation structure</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search size="18" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search menus..." 
            class="search-input"
            :disabled="saving"
          />
        </div>
        <button class="btn btn-primary" @click="openModal()" :disabled="saving">
          <Plus size="18" /> <span>Add Menu</span>
        </button>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading menus...</p>
      </div>
      <div v-else-if="filteredMenus.length === 0" class="empty-state">
        <div class="empty-icon"><Search size="48" /></div>
        <p>No menus found matching your search.</p>
      </div>
      <div v-else class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Icon</th>
              <th>Order</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="menu in filteredMenus" :key="menu.id">
              <tr class="row-parent">
                <td class="title-cell">
                   <div class="flex items-center gap-3">
                     <div class="status-indicator"></div>
                     <ChevronDown v-if="menu.children?.length" size="16" class="text-secondary" />
                     <span class="font-bold">{{ menu.title }}</span>
                   </div>
                </td>
                <td class="url-cell"><code>{{ menu.url }}</code></td>
                <td>
                  <div class="icon-badge">
                    <component :is="getIcon(menu.icon)" size="18" v-if="menu.icon" />
                    <span v-else class="text-xs text-muted">None</span>
                  </div>
                </td>
                <td><span class="order-badge">{{ menu.order }}</span></td>
                <td>
                  <div class="actions-group">
                    <button class="action-btn edit" @click="openModal(menu)" title="Edit Menu" :disabled="saving">
                      <Edit2 size="16" />
                    </button>
                    <button class="action-btn delete" @click="deleteMenu(menu.id)" title="Delete Menu" :disabled="saving">
                      <Trash2 size="16" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Children (Level 2) -->
              <template v-for="child in menu.children" :key="child.id">
                <tr class="row-child">
                  <td class="title-cell pl-10">
                    <div class="flex items-center gap-2">
                      <CornerDownRight size="14" class="text-muted" />
                      <span class="font-semibold">{{ child.title }}</span>
                    </div>
                  </td>
                  <td class="url-cell"><code>{{ child.url }}</code></td>
                  <td>
                    <div class="icon-badge small">
                      <component :is="getIcon(child.icon)" size="16" v-if="child.icon" />
                    </div>
                  </td>
                  <td><span class="order-badge small">{{ child.order }}</span></td>
                  <td>
                    <div class="actions-group">
                      <button class="action-btn edit" @click="openModal(child)" title="Edit Menu" :disabled="saving">
                        <Edit2 size="16" />
                      </button>
                      <button class="action-btn delete" @click="deleteMenu(child.id)" title="Delete Menu" :disabled="saving">
                        <Trash2 size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Grandchildren (Level 3) -->
                <tr v-for="grandchild in child.children" :key="grandchild.id" class="row-grandchild">
                  <td class="title-cell pl-20">
                    <div class="flex items-center gap-2">
                      <CornerDownRight size="12" class="text-muted opacity-50" />
                      <span class="text-slate-600">{{ grandchild.title }}</span>
                    </div>
                  </td>
                  <td class="url-cell"><code>{{ grandchild.url }}</code></td>
                  <td>
                    <div class="icon-badge smaller">
                      <component :is="getIcon(grandchild.icon)" size="14" v-if="grandchild.icon" />
                    </div>
                  </td>
                  <td><span class="order-badge smaller">{{ grandchild.order }}</span></td>
                  <td>
                    <div class="actions-group">
                      <button class="action-btn edit" @click="openModal(grandchild)" title="Edit Menu" :disabled="saving">
                        <Edit2 size="16" />
                      </button>
                      <button class="action-btn delete" @click="deleteMenu(grandchild.id)" title="Delete Menu" :disabled="saving">
                        <Trash2 size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="!saving && closeModal()">
        <div class="modal-content">
          <div class="modal-header">
            <div class="header-icon">
              <Plus v-if="!editingId" size="24" />
              <Edit2 v-else size="24" />
            </div>
            <div class="header-text">
              <h2>{{ editingId ? 'Update Menu' : 'Create New Menu' }}</h2>
              <p>{{ editingId ? 'Modify existing menu configuration' : 'Add a new item to your navigation' }}</p>
            </div>
            <button class="close-btn" @click="closeModal" :disabled="saving"><X size="20" /></button>
          </div>
          
          <form @submit.prevent="saveMenu" class="modal-body">
            <div class="form-section">
              <div class="form-group full-width">
                <label class="form-label">Menu Title</label>
                <div class="input-wrapper">
                  <Type size="18" class="input-icon" />
                  <input v-model="form.title" type="text" required placeholder="Display name" :disabled="saving" />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">URL Path</label>
                  <div class="input-wrapper">
                    <Link size="18" class="input-icon" />
                    <input v-model="form.url" type="text" placeholder="/dashboard" :disabled="saving" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Icon Name</label>
                  <div class="input-wrapper">
                    <component :is="getIcon(form.icon) || 'Circle'" size="18" class="input-icon" />
                    <input v-model="form.icon" type="text" placeholder="home, users, etc." :disabled="saving" />
                  </div>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Parent Category</label>
                  <div class="input-wrapper">
                    <Layers size="18" class="input-icon" />
                    <select v-model="form.parent_id" :disabled="saving">
                      <option :value="null">Top Level Menu</option>
                      <option v-for="m in flatParentOptions" :key="m.id" :value="m.id">
                        {{ m.title }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Sort Order</label>
                  <div class="input-wrapper">
                    <Hash size="18" class="input-icon" />
                    <input v-model.number="form.order" type="number" :disabled="saving" />
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" @click="closeModal" :disabled="saving">Discard</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="saving">
                <template v-if="saving">
                  <div class="spinner small"></div>
                  <span>Saving...</span>
                </template>
                <template v-else>
                  <Check size="18" />
                  <span>{{ editingId ? 'Update Menu' : 'Confirm & Save' }}</span>
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
import * as LucideIcons from 'lucide-vue-next';
import { 
  Plus, Edit2, Trash2, X, ChevronDown, CornerDownRight, 
  Search, Check, Type, Link, Layers, Hash, HelpCircle, Circle
} from 'lucide-vue-next';
import Swal from 'sweetalert2';

const menus = ref([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref(null);
const searchQuery = ref('');

const form = ref({
  title: '',
  url: '',
  icon: '',
  parent_id: null,
  order: 0
});

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/menus-tree');
    menus.value = response.data;
  } catch (error) {
    console.error('Failed to fetch menus', error);
  } finally {
    loading.value = false;
  }
};

const filteredMenus = computed(() => {
  if (!searchQuery.value) return menus.value;
  
  const query = searchQuery.value.toLowerCase();
  
  return menus.value.reduce((acc, menu) => {
    // 1. Check if parent matches
    const matchesParent = menu.title.toLowerCase().includes(query);
    
    // 2. Check children (Level 2)
    const filteredChildren = menu.children?.reduce((childAcc, child) => {
      const matchesChild = child.title.toLowerCase().includes(query);
      
      // 3. Check grandchildren (Level 3)
      const matchingGrandchildren = child.children?.filter(gc => 
        gc.title.toLowerCase().includes(query)
      ) || [];

      if (matchesChild || matchingGrandchildren.length > 0) {
        childAcc.push({
          ...child,
          children: matchingGrandchildren
        });
      }
      return childAcc;
    }, []) || [];

    if (matchesParent || filteredChildren.length > 0) {
      acc.push({
        ...menu,
        children: filteredChildren
      });
    }
    return acc;
  }, []);
});

const flatParentOptions = computed(() => {
  const options = [];
  menus.value.forEach(parent => {
    options.push({ id: parent.id, title: parent.title, level: 1 });
    parent.children?.forEach(child => {
      options.push({ id: child.id, title: `— ${child.title}`, level: 2 });
    });
  });
  return options;
});

onMounted(fetchData);

const getIcon = (name) => {
  if (!name) return null;
  const pascalName = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return LucideIcons[pascalName] || HelpCircle;
};

const openModal = (menu = null) => {
  if (menu) {
    editingId.value = menu.id;
    form.value = { 
      title: menu.title,
      url: menu.url,
      icon: menu.icon,
      parent_id: menu.parent_id,
      order: menu.order
    };
  } else {
    editingId.value = null;
    form.value = { title: '', url: '', icon: '', parent_id: null, order: 0 };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveMenu = async () => {
  saving.value = true;
  try {
    if (editingId.value) {
      await axios.put(`/menus/${editingId.value}`, form.value);
    } else {
      await axios.post('/menus', form.value);
    }
    await fetchData();
    closeModal();
    Swal.fire({
      icon: 'success',
      title: 'Saved!',
      text: 'Menu configuration has been updated.',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire('Error', 'Failed to save menu configuration.', 'error');
  } finally {
    saving.value = false;
  }
};

const deleteMenu = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "All associated sub-menus will also be removed!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`/menus/${id}`);
      await fetchData();
      Swal.fire('Deleted!', 'The menu has been removed.', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to delete menu.', 'error');
    }
  }
};
</script>

<style scoped>
.menus-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Refinement */
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

/* Table Style Improvements */
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

.row-parent {
  background-color: #ffffff;
}

.row-parent:hover {
  background-color: #f8fafc;
}

.row-child {
  background-color: #fafafa;
}

.row-child td {
  border-top: 1px dashed #e5e7eb;
}

.row-grandchild {
  background-color: #fcfcfc;
}

.row-grandchild:hover {
  background-color: #f8fafc;
}

.row-grandchild td {
  border-top: 1px dotted #e5e7eb;
}

.status-indicator {
  width: 4px;
  height: 20px;
  background: #6366f1;
  border-radius: 2px;
}

.url-cell code {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 0.375rem;
  color: #475569;
  font-size: 0.8rem;
}

.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 0.5rem;
}

.icon-badge.small {
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  color: #64748b;
}

.order-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.75rem;
}

/* Modern Action Buttons */
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

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.action-btn.edit:hover {
  color: #6366f1;
  border-color: #c7d2fe;
  background: #f5f3ff;
}

.action-btn.delete:hover {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

/* Refined Modal Styling */
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
  max-width: 550px;
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

.close-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}

.modal-body {
  padding: 2rem;
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

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.full-width {
  grid-column: span 2;
}

.modal-footer {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: none;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-lg {
  padding: 0.75rem 1.75rem;
  font-weight: 700;
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

.modal-fade-leave-active .modal-content {
  animation: modal-in 0.2s reverse ease-in;
}

@keyframes modal-in {
  from { transform: scale(0.95) translateY(10px); }
  to { transform: scale(1) translateY(0); }
}

/* Helper Utilities */
.flex { display: flex; }
.items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.pl-10 { padding-left: 2.5rem !important; }
.pl-20 { padding-left: 4.5rem !important; }
.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.text-muted { color: #94a3b8; }
.text-secondary { color: #64748b; }

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
</style>

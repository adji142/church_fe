<template>
  <div class="org-structure-page">
    <div class="header-section">
      <div class="title-group">
        <h1 class="page-title">Struktur Organisasi</h1>
        <p class="page-subtitle">Visualisasi hierarki departemen dan jabatan organisasi</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost" @click="fetchTreeData" :disabled="loading">
          <RefreshCw size="18" :class="{ 'spin-anim': loading }" />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <div class="card tree-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Menyusun hierarki organisasi...</p>
      </div>
      <div v-else-if="treeData.length === 0" class="empty-state">
        <div class="empty-icon"><Layers size="48" /></div>
        <p>Struktur belum didefinisikan. Silakan tambahkan departemen terlebih dahulu.</p>
        <router-link to="/departments" class="btn btn-primary mt-4">Ke Master Departemen</router-link>
      </div>
      <div v-else class="tree-container">
        <!-- Root Level -->
        <tree-node 
          v-for="node in treeData" 
          :key="node.id" 
          :node="node" 
          :type="'department'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from '../../axios';
import { useAuthStore } from '../../stores/auth';
import { RefreshCw, Layers } from 'lucide-vue-next';
import TreeNode from './components/TreeNode.vue'; // We'll create this

const auth = useAuthStore();
const treeData = ref([]);
const loading = ref(true);

const fetchTreeData = async () => {
  if (!auth.activeBranch) return;
  
  loading.value = true;
  try {
    const response = await axios.get('/departments-tree', {
      params: { branch_id: auth.activeBranch.id }
    });
    treeData.value = response.data;
  } catch (error) {
    console.error('Failed to fetch tree data', error);
  } finally {
    loading.value = false;
  }
};

watch(() => auth.activeBranch, (newBranch) => {
  if (newBranch) fetchTreeData();
}, { immediate: true });

onMounted(fetchTreeData);
</script>

<style scoped>
.org-structure-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #111827;
}

.tree-card {
  background: white;
  border-radius: 1.25rem;
  padding: 2.5rem;
  min-height: 400px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state, .empty-state {
  padding: 4rem 0;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #f1f5f9;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mt-4 { margin-top: 1rem; }
</style>

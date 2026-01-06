<template>
  <div class="tree-node" :class="type">
    <div class="node-content" @click="toggle">
      <div class="icon-box">
        <component :is="type === 'department' ? Landmark : UserRound" size="18" />
      </div>
      <div class="node-info">
        <span class="node-name">{{ node.name }}</span>
        <span class="node-type">{{ type === 'department' ? 'DEPARTEMEN' : 'JABATAN' }}</span>
      </div>
      <div v-if="hasChildren" class="expand-icon">
        <ChevronRight size="16" :class="{ 'rotated': isOpen }" />
      </div>
    </div>

    <Transition name="slide-fade">
      <div v-if="isOpen && hasChildren" class="node-children">
        <!-- Sub Departments -->
        <tree-node 
          v-for="child in node.children" 
          :key="'dept-' + child.id" 
          :node="child" 
          :type="'department'"
        />
        <!-- Positions in this Department -->
        <tree-node 
          v-for="pos in node.positions" 
          :key="'pos-' + pos.id" 
          :node="pos" 
          :type="'position'"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ChevronRight, Landmark, UserRound } from 'lucide-vue-next';

const props = defineProps({
  node: { type: Object, required: true },
  type: { type: String, default: 'department' }
});

const isOpen = ref(true);

const hasChildren = computed(() => {
  return (props.node.children?.length > 0) || (props.node.positions?.length > 0);
});

const toggle = () => {
  if (hasChildren.value) {
    isOpen.value = !isOpen.value;
  }
};
</script>

<style scoped>
.tree-node {
  display: flex;
  flex-direction: column;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
  min-width: 200px;
  gap: 1rem;
  position: relative;
  z-index: 2;
}

.tree-node.position .node-content {
  background: #f8fafc;
  border-style: dashed;
}

.node-content:hover {
  border-color: #6366f1;
  transform: translateX(4px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.icon-box {
  width: 36px;
  height: 36px;
  background: #f5f3ff;
  color: #6366f1;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-node.position .icon-box {
  background: #f1f5f9;
  color: #64748b;
}

.node-info {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.9rem;
}

.node-type {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.expand-icon {
  margin-left: auto;
  color: #94a3b8;
}

.rotated {
  transform: rotate(90deg);
}

.node-children {
  padding-left: 2rem;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-left: 2px solid #f1f5f9;
  margin-left: 1.15rem;
  position: relative;
}

/* Connectors */
.node-children::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 1.5rem;
  width: 2px;
  background: #f1f5f9;
}

.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

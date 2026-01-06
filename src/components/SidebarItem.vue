<template>
  <div class="sidebar-item">
    <!-- Item with Children -->
    <div v-if="item.children && item.children.length > 0">
      <div class="menu-item has-children" @click="toggle" :class="{ 'expanded': isOpen }">
        <component :is="iconComponent" class="menu-icon" v-if="iconComponent" />
        <span class="menu-label">{{ item.name }}</span>
        <component :is="ChevronDown" class="chevron-icon" :class="{ 'rotate': isOpen }" />
      </div>
      <div v-show="isOpen" class="submenu">
        <SidebarItem 
          v-for="child in item.children" 
          :key="child.id" 
          :item="child" 
        />
      </div>
    </div>

    <!-- Item without Children -->
    <router-link 
      v-else 
      :to="item.url" 
      class="menu-item" 
      active-class="active"
    >
      <component :is="iconComponent" class="menu-icon" v-if="iconComponent" />
      <span class="menu-label">{{ item.name }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as LucideIcons from 'lucide-vue-next';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const iconComponent = computed(() => {
  if (!props.item.icon) return null;
  // Convert kebab-case (home) to PascalCase (Home) for Lucide
  // Or simply lookup if keys match. Lucide exports PascalCase components.
  // 'home' -> 'Home', 'map-pin' -> 'MapPin'
  
  const iconName = props.item.icon.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
    
  return LucideIcons[iconName] || null;
});
</script>

<style scoped>
.sidebar-item {
  width: 100%;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-item.active {
  background-color: rgba(var(--primary-rgb), 0.1);
  border-left-color: var(--primary-color);
  color: var(--primary-color);
}

.menu-icon {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  opacity: 0.7;
}

.menu-item:hover .menu-icon,
.menu-item.active .menu-icon {
  opacity: 1;
}

.menu-label {
  flex: 1;
}

.chevron-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s;
}

.rotate {
  transform: rotate(180deg);
}

.submenu {
  padding-left: 1.5rem; /* Indent content */
}
</style>

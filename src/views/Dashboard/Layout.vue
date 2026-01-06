<template>
  <div class="dashboard-layout">
    <!-- Overlay for mobile -->
    <div 
      class="sidebar-overlay" 
      :class="{ 'show': isSidebarOpen }"
      @click="isSidebarOpen = false"
    ></div>

    <aside class="sidebar" :class="{ 'open': isSidebarOpen }">
      <div class="sidebar-header">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">⛪</span> 
            <span>E-Church</span>
        </div>
        <button class="mobile-close-btn" @click="isSidebarOpen = false">
            <X size="24" />
        </button>
      </div>
      
      <nav>
        <div v-if="auth.isLoading" class="loading-state">
           <div v-for="n in 5" :key="n" class="skeleton-item"></div>
        </div>
        <div v-else>
            <SidebarItem 
                v-for="item in menuItems" 
                :key="item.id" 
                :item="item" 
            />
            <!-- Management (Manual links for now) -->
             <!-- <div style="padding: 1rem 0 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">
              Management
            </div>
            <SidebarItem 
              :item="{ id: 'm1', name: 'Role Management', icon: 'shield', url: '/roles' }" 
            />
            <SidebarItem 
              :item="{ id: 'm2', name: 'Menu Management', icon: 'menu', url: '/menus' }" 
            /> -->
        </div>
      </nav>

      <div style="margin-top: auto;">
        
        <div v-if="auth.activeBranch" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: #eef2ff; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <Building :size="16" class="text-primary" style="color: var(--primary-color);" />
            <div>
                <p style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">Active Branch</p>
                <p style="font-size: 0.85rem; font-weight: 600; color: var(--primary-color);">{{ auth.activeBranch.name }}</p>
            </div>
        </div>

        <div style="padding: 1rem; border-top: 1px solid var(--border-color); margin-bottom: 1rem;">
            <p style="font-size: 0.875rem; font-weight: 500;">{{ auth.user?.name }}</p>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">{{ auth.user?.email }}</p>
        </div>
        <button @click="showPasswordModal = true" class="btn btn-ghost" style="width: 100%; margin-bottom: 0.5rem;">
          <Key size="18" />
          Change Password
        </button>
        <button @click="handleLogout" class="btn btn-secondary" style="width: 100%;">
          Logout
        </button>
      </div>
    </aside>

    <!-- Branch Selection Modal -->
    <div v-if="showBranchModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="card" style="width: 100%; max-width: 450px;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Select Branch</h2>
                <p style="color: var(--text-secondary);">Please select a branch to continue</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button 
                    v-for="branch in auth.user?.branches" 
                    :key="branch.id"
                    @click="selectBranch(branch)"
                    class="branch-select-btn"
                >
                    <Building :size="20" />
                    <span style="flex: 1; text-align: left;">{{ branch.name }}</span>
                    <CheckCircle :size="20" style="opacity: 0;" />
                </button>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showPasswordModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
        <div class="card" style="width: 100%; max-width: 450px;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="font-size: 1.25rem; font-weight: 700;">Change Password</h2>
                    <button @click="closePasswordModal" style="background: none; border: none; cursor: pointer; padding: 0.5rem;">
                        <X :size="20" />
                    </button>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">Update your account password</p>
            </div>
            
            <form @submit.prevent="changePassword" style="padding: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Current Password</label>
                    <input 
                        v-model="passwordForm.current_password" 
                        type="password" 
                        required 
                        placeholder="Enter current password"
                        style="width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: 0.5rem;"
                        :disabled="changingPassword"
                    />
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">New Password</label>
                    <input 
                        v-model="passwordForm.new_password" 
                        type="password" 
                        required 
                        placeholder="Enter new password"
                        style="width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: 0.5rem;"
                        :disabled="changingPassword"
                    />
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Confirm New Password</label>
                    <input 
                        v-model="passwordForm.new_password_confirmation" 
                        type="password" 
                        required 
                        placeholder="Confirm new password"
                        style="width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: 0.5rem;"
                        :disabled="changingPassword"
                    />
                </div>
                
                <div style="display: flex; gap: 0.75rem;">
                    <button type="button" @click="closePasswordModal" class="btn btn-ghost" style="flex: 1;" :disabled="changingPassword">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 1;" :disabled="changingPassword">
                        {{ changingPassword ? 'Updating...' : 'Update Password' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <main class="main-content">
      <header class="mobile-header">
        <button class="menu-btn" @click="toggleSidebar">
            <Menu size="24" />
        </button>
      </header>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import SidebarItem from '../../components/SidebarItem.vue';
import { Menu, X, CheckCircle, Building, Key } from 'lucide-vue-next';

const auth = useAuthStore();
const router = useRouter();
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Change Password Logic
const showPasswordModal = ref(false);
const changingPassword = ref(false);
const passwordForm = ref({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
});

const closePasswordModal = () => {
    showPasswordModal.value = false;
    passwordForm.value = {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    };
};

const changePassword = async () => {
    if (passwordForm.value.new_password !== passwordForm.value.new_password_confirmation) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'New password confirmation does not match',
        });
        return;
    }

    changingPassword.value = true;
    try {
        const result = await auth.changePassword(passwordForm.value);
        
        if (result.success) {
            closePasswordModal();
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Password changed successfully',
            });
        } else {
            let errorMessage = result.message;
            if (result.errors) {
                // Combine all error messages
                errorMessage = Object.values(result.errors).flat().join('\n');
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: errorMessage,
            });
        }
    } catch (e) {
         Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred',
        });
    } finally {
        changingPassword.value = false;
    }
};

const showBranchModal = computed(() => {
    // Show modal if user is loaded, has branches > 1, and no active branch is selected
    return auth.user && 
           auth.user.branches && 
           auth.user.branches.length > 1 && 
           !auth.activeBranch;
});

const selectBranch = (branch) => {
    auth.setActiveBranch(branch);
};

const menuItems = computed(() => {
    return auth.user?.menus || [];
});

const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You will be logged out of your session",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, logout!'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'Logging out...',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await auth.logout();
      Swal.close();
      router.push('/login');
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Logout Failed',
        text: 'Something went wrong',
      });
    }
  }
};
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.sidebar-header {
  margin-bottom: 2rem;
  padding: 0 0.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-link {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 0.5rem;
  margin-bottom: 0.25rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: var(--bg-color);
  color: var(--primary-color);
}

.nav-link.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.main-content {
  flex: 1;
  background-color: var(--bg-color);
  padding: 2rem;
}

/* Skeleton Loader */
.loading-state {
    padding: 0.5rem;
}

.skeleton-item {
  height: 40px;
  background: #f0f0f0;
  margin-bottom: 8px;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* Mobile Header */
.mobile-header {
  display: none;
  margin-bottom: 1rem;
}

.menu-btn, .mobile-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-close-btn {
  display: none;
  margin-left: auto;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.sidebar-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

/* Responsive Breakpoint */
@media (max-width: 1024px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    box-shadow: 4px 0 24px rgba(0,0,0,0.1);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
    align-items: center;
  }

  .mobile-close-btn {
    display: flex;
    align-items: center;
  }
}


/* Branch Select Button */
.branch-select-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    background: white;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    color: var(--text-color);
    width: 100%;
}

.branch-select-btn:hover {
    border-color: var(--primary-color);
    background: #eef2ff;
    color: var(--primary-color);
}

.branch-select-btn:hover svg {
    opacity: 1 !important;
    color: var(--primary-color);
}
</style>

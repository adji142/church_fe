import { defineStore } from 'pinia';
import axios from '../axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
        activeBranch: JSON.parse(localStorage.getItem('activeBranch')) || null,
        isLoading: false,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
    },
    actions: {
        setActiveBranch(branch) {
            this.activeBranch = branch;
            localStorage.setItem('activeBranch', JSON.stringify(branch));
        },
        async login(credentials) {
            try {
                this.isLoading = true;
                const response = await axios.post('/login', credentials);
                this.token = response.data.access_token;
                this.user = response.data.user;
                localStorage.setItem('token', this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

                // Auto-select branch if only 1
                if (this.user.branches && this.user.branches.length === 1) {
                    this.setActiveBranch(this.user.branches[0]);
                } else {
                    // Reset active branch on new login to force selection if multiple
                    // Or keep it if it matches one of the user's branches? 
                    // Safer to reset if it's a fresh login to avoid stale data from other user
                    this.activeBranch = null;
                    localStorage.removeItem('activeBranch');
                }

                return true;
            } catch (error) {
                console.error('Login failed', error);
                return false;
            } finally {
                this.isLoading = false;
            }
        },
        async register(userData) {
            try {
                this.isLoading = true;
                const response = await axios.post('/register', userData);
                this.token = response.data.access_token;
                this.user = response.data.user;
                localStorage.setItem('token', this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                return true;
            } catch (error) {
                console.error('Registration failed', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        async changePassword(passwordData) {
            try {
                this.isLoading = true;
                const response = await axios.post('/change-password', passwordData);
                return { success: true, message: response.data.message };
            } catch (error) {
                console.error('Change password failed', error);
                if (error.response && error.response.data && error.response.data.errors) {
                     return { success: false, errors: error.response.data.errors };
                }
                return { success: false, message: error.response?.data?.message || 'Failed to change password' };
            } finally {
                this.isLoading = false;
            }
        },
        async logout() {
            try {
                this.isLoading = true;
                await axios.post('/logout');
            } catch (error) {
                console.error('Logout error', error);
            } finally {
                this.token = null;
                this.user = null;
                this.activeBranch = null;
                this.isLoading = false;
                localStorage.removeItem('token');
                localStorage.removeItem('activeBranch');
                delete axios.defaults.headers.common['Authorization'];
            }
        },
        async fetchUser() {
            if (!this.token) return;
            try {
                this.isLoading = true;
                const response = await axios.get('/me');
                this.user = response.data;

                // Auto-select if only 1 branch
                if (this.user.branches && this.user.branches.length === 1) {
                    // Only set if not already set or different
                    if (!this.activeBranch || this.activeBranch.id !== this.user.branches[0].id) {
                        this.setActiveBranch(this.user.branches[0]);
                    }
                }

                // If activeBranch is set but user doesn't have access to it anymore (rare edge case), clear it
                if (this.activeBranch && this.user.branches) {
                    const hasBranch = this.user.branches.find(b => b.id === this.activeBranch.id);
                    if (!hasBranch) {
                        this.activeBranch = null;
                        localStorage.removeItem('activeBranch');
                    }
                }

            } catch (error) {
                this.logout();
            } finally {
                this.isLoading = false;
            }
        }
    }
});

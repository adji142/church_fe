<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Welcome Back</h1>
      <p class="auth-subtitle">Sign in to your account</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="label">Email Address</label>
          <input v-model="email" type="email" class="input" required placeholder="you@example.com">
        </div>
        
        <div class="form-group">
          <label class="label">Password</label>
          <input v-model="password" type="password" class="input" required placeholder="••••••••">
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" :disabled="isLoading">
          {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>

        <div style="text-align: center; margin-top: 1rem;">
            <router-link to="/register" style="color: var(--text-secondary); font-size: 0.875rem;">
                Don't have an account? Sign up
            </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const auth = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
    isLoading.value = true;
    try {
        const success = await auth.login({ email: email.value, password: password.value });
        if (success) {
            Swal.fire({
                icon: 'success',
                title: 'Welcome Back!',
                text: 'Login successful',
                showConfirmButton: false,
                timer: 1500
            });
            auth.fetchUser();
            router.push('/');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid email or password',
            });
        }
    } catch (e) {
         Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong',
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

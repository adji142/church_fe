import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('../views/Auth/Login.vue'),
            meta: { guest: true }
        },
        {
            path: '/update-data',
            name: 'JemaatSelfUpdate',
            component: () => import('../views/Public/JemaatSelfUpdate.vue')
        },
        {
            path: '/dashboard',
            redirect: '/'
        },
        {
            path: '/',
            component: () => import('../views/Dashboard/Layout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'Dashboard',
                    component: () => import('../views/Dashboard/Dashboard.vue')
                },
                {
                    path: 'roles',
                    name: 'Roles',
                    component: () => import('../views/Dashboard/Roles.vue')
                },
                {
                    path: 'menus',
                    name: 'Menus',
                    component: () => import('../views/Dashboard/Menus.vue')
                },
                {
                    path: 'users',
                    name: 'Users',
                    component: () => import('../views/Dashboard/Users.vue')
                },
                {
                    path: 'branches',
                    name: 'Branches',
                    component: () => import('../views/Dashboard/Branches.vue')
                },
                {
                    path: 'statuspernikahan',
                    name: 'MaritalStatuses',
                    component: () => import('../views/Dashboard/MaritalStatuses.vue')
                },
                {
                    path: 'statusjemaat',
                    name: 'MemberStatuses',
                    component: () => import('../views/Dashboard/MemberStatuses.vue')
                },
                {
                    path: 'pendidikan',
                    name: 'Educations',
                    component: () => import('../views/Dashboard/Educations.vue')
                },
                {
                    path: 'pekerjaan',
                    alias: 'jabatan',
                    name: 'Occupations',
                    component: () => import('../views/Dashboard/Occupations.vue')
                },
                {
                    path: 'wilayah',
                    alias: 'dept',
                    name: 'ChurchAreas',
                    component: () => import('../views/Dashboard/ChurchAreas.vue')
                },
                {
                    path: 'jenis-cell',
                    name: 'CellTypes',
                    component: () => import('../views/Dashboard/CellTypes.vue')
                },
                {
                    
                    path: 'cell',
                    name: 'Cells',
                    component: () => import('../views/Dashboard/Cells.vue')
                },
                {
                    path: 'departments',
                    name: 'Departments',
                    component: () => import('../views/Dashboard/Departments.vue')
                },
                {
                    path: 'positions',
                    name: 'Positions',
                    alias: 'jabatan-struktur',
                    component: () => import('../views/Dashboard/Positions.vue')
                },
                {
                    path: 'org-structure',
                    name: 'OrgStructure',
                    component: () => import('../views/Dashboard/OrgStructure.vue')
                },
                {
                    path: 'jemaat',
                    name: 'Jemaat',
                    component: () => import('../views/Dashboard/Jemaat.vue')
                },
                {
                    path: 'penugasan-pelayanan',
                    name: 'ServiceAssignments',
                    component: () => import('../views/Dashboard/ServiceAssignments.vue')
                },
                {
                    path: 'service-categories',
                    name: 'ServiceCategories',
                    component: () => import('../views/Dashboard/ServiceCategories.vue')
                },
                {
                    path: 'service-types',
                    name: 'ServiceTypes',
                    component: () => import('../views/Dashboard/ServiceTypes.vue')
                },
                // Service Transactions
                {
                    path: 'service-requests',
                    name: 'ServiceRequestList',
                    component: () => import('../views/ServiceTransaction/ServiceRequestList.vue')
                },
                {
                    path: 'service-requests/create',
                    name: 'CreateServiceRequest',
                    component: () => import('../views/ServiceTransaction/CreateServiceRequest.vue')
                },
                {
                    path: 'service-requests/:id',
                    name: 'ServiceRequestDetail',
                    component: () => import('../views/ServiceTransaction/ServiceRequestDetail.vue')
                },
                // Finance Master Data
                {
                    path: 'finance/cash-categories',
                    name: 'CashCategories',
                    component: () => import('../views/Finance/CashCategories.vue')
                },
                {
                    path: 'finance/payment-methods',
                    name: 'PaymentMethods',
                    component: () => import('../views/Finance/PaymentMethods.vue')
                },
                {
                    path: 'finance/funds',
                    name: 'Funds',
                    component: () => import('../views/Finance/Funds.vue')
                },
                {
                    path: 'finance/financial-periods',
                    name: 'FinancialPeriods',
                    component: () => import('../views/Finance/FinancialPeriods.vue')
                },
                {
                    path: 'finance/cash-transactions',
                    name: 'CashTransactions',
                    component: () => import('../views/Finance/CashTransactions.vue')
                },
                {
                    path: 'finance/reports/cash-daily',
                    name: 'DailyCashReport',
                    component: () => import('../views/Reports/DailyCashReport.vue')
                },
                {
                    path: 'finance/reports/cash-period',
                    name: 'PeriodCashReport',
                    component: () => import('../views/Reports/PeriodCashReport.vue')
                },
                {
                    path: 'finance/reports/cash-category',
                    name: 'CategoryCashReport',
                    component: () => import('../views/Reports/CategoryCashReport.vue')
                },
                {
                    path: 'finance/reports/cash-fund',
                    name: 'FundReport',
                    component: () => import('../views/Reports/FundReport.vue')
                }
            ]
        }
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const token = localStorage.getItem('token');

    if (token && !authStore.user) {
        authStore.fetchUser().catch(() => {
             // Token might be invalid
             authStore.logout();
             next({ name: 'Login' });
        });
    }

    if (to.meta.requiresAuth && !token) {
        next({ name: 'Login' });
    } else if (to.meta.guest && token) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router;

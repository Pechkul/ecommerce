import Login from "@components/anonymous/Login.vue";
import PageNotFound from "@components/anonymous/pageNotFound.vue";
import MainLayout from "@components/secured/layouts/Main.vue";
import Home from "@components/secured/home/Main.vue";
import Customers from "@components/secured/customers/Main.vue";
import CustomerCreate from "@components/secured/customers/Create.vue";
import CustomerEdit from "@components/secured/customers/Edit.vue";
import Cashier from "@components/secured/cashier/Main.vue";
import Orders from "@components/secured/orders/Main.vue";
import Products from "@components/secured/products/Main.vue";
import Reports from "@components/secured/Reports.vue";
import Settings from "@components/secured/settings/Main.vue";
import Payment from "@components/secured/Payment.vue";
import { createRouter, createWebHistory } from "vue-router";
import I18n from '@src/plugins/i18n';

const routes = [
    {
        path: "/",
        component: Login,
        meta: { title_key: 'pos.login_form.title' },
    },
    {
        path: "/:pathMatch(.*)*",
        component: PageNotFound,
    },
    {
        path: "/home",
        component: MainLayout,
        meta: {
            requiresAuth: true,
            title_key: 'pos.home.title'
        },
        children: [
            {
                path: "/home",
                component: Home,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.home.title'
                },
            },
            {
                path: "/customers",
                component: Customers,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.customers.title'
                },
            },
            {
                path: "/customers/create",
                component: CustomerCreate,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.customers.create.title'
                },
            },
            {
                path: "/customers/edit/:id/:type",
                component: CustomerEdit,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.customers.edit.title'
                },
            },
            {
                path: "/cashier/:tab?",
                component: Cashier,
                props: true,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.cashier.title'
                },
            },
            {
                path: "/orders/:tab?",
                component: Orders,
                props: true,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.orders.title'
                }
            },
            {
                path: "/products/:tab?",
                component: Products,
                props: true,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.products.title'
                },
            },
            {
                path: "/reports",
                component: Reports,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.reports.title'
                },
            },
            {
                path: "/settings/:tab?",
                component: Settings,
                props: true,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.settings.title'
                },
            },
            {
                path: "/payment/:id",
                component: Payment,
                meta: {
                    requiresAuth: true,
                    title_key: 'pos.payment.title'
                },
            },
        ],
    },
];

const baseMeta = document.querySelector('meta[name="base-url"]');

const base = baseMeta
    ? baseMeta.getAttribute('content')
    : window.location.origin;

const url = new URL(base);

let basePath = url.pathname;

if (basePath === '/') {
    basePath = '';
}

const router = createRouter({
    history: createWebHistory(`${basePath}/pos/`),
    routes,
});

router.beforeEach((to, from, next) => {
    if (to?.meta?.title_key) {
        document.title = I18n.global.t(to.meta.title_key);
    }

    const accessToken = localStorage.getItem('accessToken');

    if (
        to.matched.some(record => record.meta.requiresAuth)
        && ! accessToken
    ) {
        next('/');
    } else if (
        to.path === '/'
        && accessToken
    ) {
        next('/home');
    } else {
        next();
    }
});

export default router;

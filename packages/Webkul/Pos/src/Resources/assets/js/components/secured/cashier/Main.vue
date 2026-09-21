<template>
    <Tab
        :current="tab"
        :tabs="tabs"
        routeBase="/cashier"
    />
</template>

<script setup>
    import CashDrawer from '@components/secured/cashier/CashDrawer.vue';
    import TodaySale from '@components/secured/cashier/TodaySale.vue';
    import SaleHistory from '@components/secured/cashier/SaleHistory.vue';

    const props = defineProps({
        tab: String
    });

    const tabs = [
        {
            key: 'cash-drawer',
            component: CashDrawer,
            titleKey: 'pos.cashier.cash_drawer.title',
        },
        {
            key: 'today-sale',
            component: TodaySale,
            titleKey: 'pos.cashier.today_sale.title',
        },
        {
            key: 'sale-history',
            component: SaleHistory,
            titleKey: 'pos.cashier.sale_history.title',
        },
    ];
</script>

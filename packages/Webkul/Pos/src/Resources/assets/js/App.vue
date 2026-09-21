<template>
    <span>
        <OfflineSyncWorker />
        <SyncWorker />

        <router-view v-slot="{ Component }">
            <Component :is="Component" />
        </router-view>
    </span>
</template>

<script setup>
import OfflineSyncWorker from '@components/secured/orders/OfflineSyncWorker.vue';
import SyncWorker from '@components/secured/SyncWorker.vue';
</script>

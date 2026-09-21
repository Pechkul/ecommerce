<template></template>

<script setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useOfflineSync } from '@src/composable/offline-sync';
import { useIndexedDB } from '@src/composable/indexed-db';

const emitter = inject('emitter');
const isOnline = inject('isOnline');
const { syncSingleOrder } = useOfflineSync();
const DB = useIndexedDB();
const syncing = ref(false);
const syncQueue = ref([]);

/**
 * Process queue one order at a time
 */
const processQueue = async () => {
    if (syncing.value || ! isOnline?.value) {
        return;
    }

    if (! localStorage.getItem('accessToken')) {
        return;
    }

    if (syncQueue.value.length === 0) {
        return;
    }

    syncing.value = true;

    try {
        while (syncQueue.value.length > 0) {
            if (! isOnline?.value) {
                break;
            }

            const offlineOrder = syncQueue.value[0];

            await syncSingleOrder(offlineOrder);

            syncQueue.value.shift();
        }
    } finally {
        syncing.value = false;
    }
};

/**
 * Add orders to queue and start processing
 */
const handleSyncRequest = async () => {
    const offlineOrders = await DB.getAllItems('offline_orders');
    const agent = await DB.getAgent();

    // Safety check
    if (!offlineOrders || !Array.isArray(offlineOrders)) return;
    if (!agent?.outlet?.id) return;
    if (!localStorage.getItem('accessToken')) return;

    const filteredOrders = offlineOrders.filter(
        order => order.outlet_id === agent.outlet.id
    );

    // Add new orders to queue and update existing ones
    for (const order of filteredOrders) {
        const index = syncQueue.value.findIndex(o => o.id === order.id);

        if (index === -1) {
            syncQueue.value.push(order);
        } else {
            syncQueue.value[index] = order;
        }
    }

    processQueue();
};

if (isOnline) {
    watch(isOnline, (online) => {
        if (online) {
            processQueue();
        }
    });
}

onMounted(() => {
    emitter?.on('sync_offline_orders', handleSyncRequest);
    handleSyncRequest();
});

onBeforeUnmount(() => {
    emitter?.off('sync_offline_orders', handleSyncRequest);
});
</script>

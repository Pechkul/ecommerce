<template></template>

<script setup>
import { inject, onMounted } from 'vue';
import { useSyncEntities } from '@src/composable/sync-entities';

const emitter = inject('emitter');
const { initiateSyncProcess } = useSyncEntities();

onMounted(() => {
    emitter?.on('sync_entities_start', initiateSyncProcess);
});
</script>

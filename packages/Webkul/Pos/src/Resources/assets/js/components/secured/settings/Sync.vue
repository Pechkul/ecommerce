<template>
    <div class="box-shadow grid gap-6 rounded-lg bg-white dark:bg-gray-900 p-4">
        <div
            v-for="(entity, entityName) in syncEntities"
            :key="entityName"
            class="p-3 border rounded-lg transition"
            :class="[
                true
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-600'
            ]"
        >
            <div class="flex justify-between mb-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ $t(`pos.settings.sync.${entityName}`) }}
                </span>

                <span class="text-sm font-bold text-gray-700 dark:text-gray-100">
                    {{ entity.syncProgress }}%
                </span>
            </div>

            <div class="w-full bg-gray-200 dark:bg-gray-800 rounded h-1.5">
                <div
                    class="bg-slate-600 dark:bg-gray-300 h-1.5 rounded"
                    :style="{ width: `${entity.syncProgress}%` }"
                >
                </div>
            </div>

            <div class="text-xs mt-1.5 flex justify-between text-gray-600 dark:text-gray-400">
                <span>
                    {{ entity.syncedCount }} / {{ entity.totalRecords }}
                    {{ $t('pos.settings.sync.records') }}
                </span>

                <span
                    v-if="entity.isActive"
                    class="text-blue-600"
                >
                    {{ $t('pos.settings.sync.fetching') }}
                </span>

                <span
                    v-else-if="entity.syncProgress === 100"
                    class="text-green-600 dark:text-green-400"
                >
                    {{ $t('pos.settings.sync.completed') }}
                </span>

                <span
                    v-else
                    class="text-gray-500 dark:text-gray-500"
                >
                    {{ $t('pos.settings.sync.ready') }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, inject } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useSyncEntities } from '@src/composable/sync-entities';

    const { t } = useI18n();
    const emitter = inject('emitter');
    const { syncEntities, initiateSyncProcess } = useSyncEntities();

    onMounted(() => {
        initiateSyncProcess();

        const message = localStorage.getItem('loginMessage');

        if (message) {
            emitter?.emit('add_flash', {
                type: 'success',
                message: message
            });

            localStorage.removeItem('loginMessage');
        }
    });


</script>
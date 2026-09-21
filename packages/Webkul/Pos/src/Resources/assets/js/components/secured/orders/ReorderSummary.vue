<template>
    <Teleport to="body">
        <Modal ref="summaryModal">
            <template v-slot:header>
                <label class="flex items-center justify-between w-full">
                    {{ $t('pos.orders.reorder.summary.title', 'Reorder Summary') }}
                </label>
            </template>

            <template v-slot:content="{ toggle }">
                <div class="grid gap-4 min-w-[400px]">
                    <div v-if="summary" class="flex flex-col gap-4">
                        <!-- Added items -->
                        <div class="grid gap-1">
                            <p class="font-semibold text-green-600 dark:text-green-500">
                                {{ $t('pos.orders.reorder.summary.added', { count: summary.added }) }}
                            </p>
                        </div>

                        <!-- Modified items -->
                        <div v-if="summary.modified?.length" class="grid gap-2 border-t pt-2 dark:border-gray-700">
                            <p class="font-semibold text-orange-500 dark:text-orange-400">
                                {{ $t('pos.orders.reorder.summary.modified_label') }}
                            </p>
                            <ul class="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                                <li v-for="(item, index) in summary.modified" :key="index">
                                    <strong>{{ item.name }}</strong>
                                    <span class="text-xs text-gray-500">({{ item.sku }})</span>
                                    <br>
                                    {{ $t('pos.orders.reorder.summary.modified_message', { requested: item.requestedQty, added: item.addedQty }) }}
                                </li>
                            </ul>
                        </div>

                        <!-- Skipped items -->
                        <div v-if="summary.skipped?.length" class="grid gap-2 border-t pt-2 dark:border-gray-700">
                            <p class="font-semibold text-red-600 dark:text-red-500">
                                {{ $t('pos.orders.reorder.summary.skipped_label') }}
                            </p>
                            <ul class="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                                <li v-for="(item, index) in summary.skipped" :key="index">
                                    <strong>{{ item.name }}</strong>
                                    <span class="text-xs text-gray-500">({{ item.sku }})</span>
                                    <br>
                                    <span class="text-red-500 dark:text-red-400">{{ item.reason }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="flex justify-end gap-6 mt-4">
                        <button
                            type="button"
                            class="primary-button w-36"
                            @click="toggle"
                        >
                            {{ $t('pos.orders.reorder.summary.close_btn') }}
                        </button>
                    </div>
                </div>
            </template>
        </Modal>
    </Teleport>
</template>

<script setup>
    import { ref } from 'vue';

    const summaryModal = ref(null);
    const summary = ref(null);

    const open = (summaryData) => {
        summary.value = summaryData;
        summaryModal.value.toggle();
    };

    defineExpose({
        open
    });
</script>

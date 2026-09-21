<template>
    <div class="fixed top-[68px] hidden h-[calc(100vh-68px)] w-[clamp(420px,_30vw,_600px)] flex-col justify-between bg-white dark:bg-gray-900 xl:flex ltr:right-0 rtl:left-0">
        <template v-if="outletOrder?.order">
            <div class="flex flex-col px-3">
                <div class="flex flex-col px-2.5 py-4 border-b bg-white dark:bg-gray-900">
                    <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {{ $t('pos.orders.info.order_id') }} #{{ outletOrder.order?.id }}
                    </p>

                    <p class="text-sm leading-4 text-gray-700 dark:text-gray-300">
                        {{ outletOrder.order?.customer?.name }}
                    </p>
                </div>

                <div class="flex h-[calc(100vh-400px)] flex-col gap-1 overflow-y-auto overflow-x-hidden py-2">
                    <div
                        class="flex min-h-14 flex-col gap-4 rounded-lg p-2"
                        :class="[
                        index % 2 === 0
                            ? 'bg-zinc-50 dark:bg-gray-900'
                            : 'bg-white dark:bg-gray-900',
                        ]"
                        v-for="(item, index) in outletOrder.order?.items"
                        :key="index"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex gap-2.5">
                                <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                    {{ index + 1 }}.
                                </p>

                                <div class="flex flex-col">
                                    <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                        {{ item.name }}
                                    </p>

                                    <p class="text-sm font-normal leading-4 text-neutral-400 dark:text-neutral-400">
                                        {{ $t('pos.orders.info.sku', { sku: item.sku }) }}
                                    </p>

                                    <p class="text-sm font-normal leading-4 text-neutral-400 dark:text-neutral-400">
                                        {{ $t('pos.orders.info.qty', { qty: item.qtyOrdered ?? item.quantity }) }}
                                    </p>
                                </div>
                            </div>

                            <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                <template v-if="item.baseDiscountAmount">
                                    <div class="text-xs text-gray-400 dark:text-gray-500 line-through">
                                        {{ formatPrice(item?.price) }}
                                    </div>

                                    <div class="text-base font-semibold leading-5 text-green-600 dark:text-green-500">
                                        {{ formatPrice(item?.price - item?.baseDiscountAmount) }}
                                    </div>
                                </template>

                                <template v-else>
                                    <span class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                        {{ formatPrice(item.totalInclTax ?? item.total) }}
                                    </span>
                                </template>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-4 bg-zinc-50 dark:bg-gray-900 p-3">
                <div class="flex flex-col gap-1">
                    <div class="flex justify-between">
                        <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-100">
                            {{ $t('pos.orders.info.subtotal') }}
                        </p>

                        <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                            {{ formatPrice(outletOrder.order?.subTotal) }}
                        </p>
                    </div>

                    <div class="flex justify-between">
                        <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-100">
                            {{ $t('pos.orders.info.tax') }}
                        </p>

                        <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                            <template v-if="outletOrder.order?.taxAmount">
                                {{ formatPrice(outletOrder.order.taxAmount) }}
                            </template>

                            <template v-else>
                                {{ formatPrice(outletOrder.order?.taxTotal ?? 0) }}
                            </template>
                        </p>
                    </div>

                    <div class="flex justify-between">
                        <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-100">
                            {{ $t('pos.orders.info.discount') }}
                        </p>

                        <p class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                            {{ formatPrice(outletOrder.order?.discountAmount ?? 0) }}
                        </p>
                    </div>
                </div>

                <div class="flex justify-between">
                    <p class="text-xl font-medium leading-6 text-gray-900 dark:text-gray-100">
                        {{ $t('pos.common.cart.payable_amount') }}
                    </p>

                    <p class="text-xl font-medium leading-6 text-gray-900 dark:text-gray-100">
                        {{ formatPrice(outletOrder.order?.grandTotal) }}
                    </p>
                </div>

                <div class="flex gap-2.5">
                    <button
                        v-if="showSyncButton"
                        type="button"
                        class="primary-button flex-1"
                        @click="handleSyncOrderRequest()"
                    >
                        <span class="icon-sync text-2xl"></span>

                        {{ $t('pos.orders.offline.sync_order') }}
                    </button>

                    <button
                        v-if="showReturnButton"
                        type="button"
                        class="danger-button flex-1"
                        @click="handleReturnOrderRequest()"
                    >
                        <span
                            class="icon-sync text-2xl dark:text-gray-100"
                            :class="isReturnButtonLoading ? 'animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]' : ''"
                        ></span>

                        {{ $t('pos.orders.history.return_btn') }}
                    </button>

                    <button
                        type="button"
                        class="secondary-button flex-1"
                        @click="handleReorderRequest()"
                        :disabled="isReorderButtonLoading"
                    >
                        <span
                            class="icon-sync text-2xl dark:text-gray-100"
                            :class="isReorderButtonLoading ? 'animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]' : ''"
                        ></span>

                        {{ $t('pos.orders.info.reorder', 'Reorder') }}
                    </button>

                    <div class="flex-1">
                        <Print :outletOrder="outletOrder" />
                    </div>
                </div>

                <template v-if="outletOrder?.orderNote">
                    <button
                        type="button"
                        class="secondary-button w-full"
                        @click="orderNoteModal.toggle()"
                    >
                        <span class="icon-information text-2xl"></span>

                        {{ $t('pos.common.cart.note') }}
                    </button>
                </template>
            </div>
        </template>

        <template v-else>
            <div class="flex h-full items-center justify-center px-8">
                <p class="text-base font-normal text-gray-900 dark:text-gray-100">
                {{ $t('pos.orders.info.no_order_selected') }}
                </p>
            </div>
        </template>

        <Teleport to="body">
            <Modal ref="orderNoteModal">
                <template v-slot:header>
                    <label class="text-base leading-5 text-gray-900 dark:text-white">
                        {{ $t('pos.common.cart.order_note_form.title') }}
                    </label>
                </template>

                <template v-slot:content="{ toggle }">
                    <div class="grid gap-4">
                        <div class="p-3 text-base text-gray-700 bg-gray-100 border border-gray-200 rounded min-h-[100px] dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 whitespace-pre-wrap">
                            {{ outletOrder?.orderNote }}
                        </div>

                        <div class="flex justify-end gap-6 cursor-pointer">
                            <button
                                type="button"
                                class="transparent-button w-36"
                                @click="toggle"
                            >
                                {{ $t('pos.common.cart.order_note_form.cancel_btn_title') }}
                            </button>
                        </div>
                    </div>
                </template>
            </Modal>

            <ReorderSummary ref="reorderSummaryModal" />
        </Teleport>
    </div>
</template>

<script setup>
    import { ref, onMounted, inject } from 'vue';
    import Print from '@components/secured/common/Print.vue';
    import { useOutlet } from '@src/composable/outlet';
    import { useReorder } from '@src/composable/reorder';
    import ReorderSummary from '@components/secured/orders/ReorderSummary.vue';

    /**
     * Inject the dependency
     */
    const emitter = inject('emitter');

    /**
     * General variables
     */
    const { formatPrice } = useOutlet();

    const emit = defineEmits(['syncOrder', 'returnOrder']);

    const props = defineProps({
        outletOrder: {
            type: Object,
            required: true,
        },
        showSyncButton: {
            type: Boolean,
            required: false,
        },
        showReturnButton: {
            type: Boolean,
            required: false,
        },
    });

    /**
     * Data to be used in the component
     */
    const isReturnButtonLoading = ref(false);
    const orderNoteModal = ref(null);

    onMounted(() => {
        emitter?.on('returned_order_done', handleReturnOrderResponse);
    });

    /**
     * Emit sync order event to parent component
     */
    const handleSyncOrderRequest = () => {
        emit('syncOrder', props.outletOrder);
    };

    /**
     * Emit return order event to parent component
     */
    const handleReturnOrderRequest = () => {
        isReturnButtonLoading.value = true;

        emit('returnOrder', props.outletOrder);
    };

    const handleReturnOrderResponse = () => {
        isReturnButtonLoading.value = false;
    };

    /**
     * Reorder Logic
     */
    const { processReorder } = useReorder();
    const isReorderButtonLoading = ref(false);
    const reorderSummaryModal = ref(null);

    const handleReorderRequest = async () => {
        if (!props.outletOrder) return;

        isReorderButtonLoading.value = true;
        const summary = await processReorder(props.outletOrder);
        isReorderButtonLoading.value = false;

        if (summary && (summary.added > 0 || summary.skipped.length > 0 || summary.modified.length > 0)) {
            reorderSummaryModal.value.open(summary);
        }
    };
</script>

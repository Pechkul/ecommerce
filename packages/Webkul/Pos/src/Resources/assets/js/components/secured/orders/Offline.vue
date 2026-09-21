<template>
    <div class="flex gap-4">
        <div class="flex flex-1 flex-col gap-4 max-xl:flex-auto">
            <div class="grid gap-4">
                <!-- Title and Button -->
                <div class="flex h-12 items-center justify-between"
                    v-if="isOnline && offlineOrders.length"
                >
                    <button
                        type="button"
                        class="primary-button"
                        @click="syncOfflineOrders"
                    >
                        <span class="icon-sync text-2xl"></span>

                        <span class="max-sm:hidden">
                            {{ $t('pos.orders.offline.sync_all_orders') }}
                        </span>
                    </button>
                </div>

                <!-- Content Wrapper -->
                <div class="w-full rounded-lg bg-white dark:bg-gray-900 p-4">
                    <!-- Search Input -->
                    <div
                        v-if="isOnline && offlineOrders.length"
                        class="relative mb-4 flex items-center text-gray-900 dark:text-gray-200"
                        >
                        <input
                            type="text"
                            class="h-12 w-full px-8 text-base font-normal leading-5 bg-transparent border-b text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                            :placeholder="$t('pos.orders.offline.search_order_id')"
                            v-model="searchTerm"
                        />

                        <i class="icon-search left absolute top-3.5 flex items-center text-xl leading-5 dark:text-gray-100"></i>
                    </div>

                    <template v-if="loading">
                        <OrderListSkeleton />
                    </template>

                    <template v-else>
                        <div v-if="offlineOrders.length">
                            <!-- Desktop Table View (hidden on mobile) -->
                            <div class="hidden md:block overflow-x-auto">
                                <!-- Header Labels -->
                                <div class="grid grid-cols-5 gap-4 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-300 dark:border-gray-600 pb-3 mb-3 select-none">
                                    <div>{{ $t('pos.orders.offline.order_id') }}</div>

                                    <div>{{ $t('pos.orders.offline.total') }}</div>

                                    <div>{{ $t('pos.orders.offline.qty') }}</div>

                                    <div>{{ $t('pos.orders.offline.date') }}</div>

                                    <div></div>
                                </div>

                                <!-- Orders Data -->
                                <div
                                    v-for="(offlineOrder, index) in offlineOrders"
                                    :key="index"
                                    @click="currentOrder = offlineOrder;"
                                    :class="[
                                        'grid grid-cols-5 items-center gap-4 py-3 px-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                                        index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800/50' : ''
                                    ]"
                                >
                                    <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        # {{ offlineOrder.order?.id }}
                                    </div>

                                    <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        <template v-if="offlineOrder?.order?.discountAmount">
                                            <span class="text-gray-400 text-[12px] mr-1 line-through">
                                                {{ formatPrice(offlineOrder?.order?.subTotal) }}
                                            </span>

                                            <span class="text-green-600 dark:text-green-500">
                                                {{ formatPrice(offlineOrder?.order?.grandTotal) }}
                                            </span>
                                        </template>

                                        <template v-else>
                                            {{ formatPrice(offlineOrder?.order?.grandTotal) }}
                                        </template>
                                    </div>

                                    <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {{ offlineOrder.order?.itemsQty }}
                                    </div>

                                    <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {{ formatDate(offlineOrder.date) }}
                                    </div>

                                    <div class="justify-self-end">
                                        <template v-if="offlineOrder?.isReturned">
                                            <div class="inline-flex items-center gap-2 px-3 py-1.5 h-[36px] rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                                                <span class="text-[#16a34a] dark:text-green-400 text-sm font-bold">✓</span>

                                                <span class="text-sm font-semibold text-[#16a34a] dark:text-green-400">
                                                    {{ $t('pos.orders.offline.returned') }}
                                                </span>
                                            </div>
                                        </template>

                                        <template v-else>
                                            <button
                                                class="inline-flex items-center gap-2 px-3 py-1.5 h-[36px] rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 shadow-sm active:scale-[0.97] transition-transform duration-150"
                                                @click.stop="returnOrder(offlineOrder)"
                                            >
                                                <span class="text-sm">←</span>

                                                <span>{{ $t('pos.orders.offline.return') }}</span>
                                            </button>
                                        </template>
                                    </div>
                                </div>
                            </div>

                            <!-- Mobile Card View (visible only on mobile) -->
                            <div class="md:hidden space-y-3">
                                <div
                                    v-for="(offlineOrder, index) in offlineOrders"
                                    :key="index"
                                    @click="showOrderInfo(offlineOrder)"
                                    class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                >
                                    <!-- Date Header -->
                                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                        <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                            {{ formatDate(offlineOrder.date) }}
                                        </h3>

                                        <span class="text-xs text-gray-500 dark:text-gray-400">
                                            #{{ index + 1 }}
                                        </span>
                                    </div>

                                    <!-- Payment Details Grid -->
                                    <div class="grid grid-cols-2 items-center gap-3 mb-3">
                                        <div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                {{ $t('pos.orders.history.order_id') }}
                                            </div>

                                            <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                # {{ offlineOrder.id }}
                                            </div>
                                        </div>

                                        <div class="justify-self-end">
                                            <template v-if="offlineOrder?.isReturned">
                                                <div class="inline-flex items-center gap-2 px-3 py-1.5 h-[36px] rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
                                                    <span class="text-[#16a34a] dark:text-green-400 text-sm font-bold">✓</span>

                                                    <span class="text-sm font-semibold text-[#16a34a] dark:text-green-400">
                                                        {{ $t('pos.orders.offline.returned') }}
                                                    </span>
                                                </div>
                                            </template>

                                            <template v-else>
                                                <button
                                                    class="inline-flex items-center gap-2 px-3 py-1.5 h-[36px] rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 shadow-sm active:scale-[0.97] transition-transform duration-150"
                                                    @click.stop="returnOrder(offlineOrder)"
                                                >
                                                    <span class="text-sm">←</span>

                                                    <span>{{ $t('pos.orders.offline.return') }}</span>
                                                </button>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- No records message -->
                        <div
                            v-else
                            class="py-8 text-center text-gray-700 dark:text-gray-300"
                            >
                            <div class="text-gray-400 dark:text-gray-500 text-4xl mb-3">📋</div>

                            <div class="font-medium mb-1">
                                {{ $t('pos.orders.offline.no_orders') }}
                            </div>
                        </div>
                    </template>

                    <!-- Pagination Controls -->
                    <Pagination
                        :loading="loading"
                        :pageInfo="pageInfo"
                        @page-change="goToPage"
                    />
                </div>
            </div>
        </div>

        <!-- For Desktop view -->
        <Info
            :outletOrder="currentOrder"
            :showSyncButton="isOnline"
            @syncOrder="handleOrderSync"
        />

        <!-- For Mobile view -->
        <Teleport to="body">
            <Drawer ref="orderInfoDrawer">
                <template v-slot:header>
                    <div class="flex flex-col px-2 py-4">
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                            {{ $t('pos.orders.info.order_id') }} #{{ currentOrder.order?.id }}
                        </p>

                        <p class="text-sm leading-4 text-gray-700 dark:text-gray-300">
                            {{ currentOrder.order?.customer?.name }}
                        </p>
                    </div>
                </template>

                <template v-slot:content>
                    <div class="flex min-h-full flex-col justify-between">
                        <div class="flex flex-col gap-1 overflow-hidden p-4">
                            <div
                                class="flex min-h-14 flex-col gap-4 rounded-lg p-2"
                                :class="index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800' : ''"
                                v-for="(item, index) in currentOrder?.order?.items"
                                :key="index"
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex gap-2.5">
                                        <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                            {{ index + 1 }}.
                                        </p>

                                        <div class="flex flex-col">
                                            <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                                {{ item.name }}
                                            </p>

                                            <p class="text-sm font-normal leading-4 text-neutral-400 dark:text-neutral-400">
                                                {{ item.sku }}
                                            </p>
                                        </div>
                                    </div>

                                    <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                        {{ formatPrice(item?.price) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4 bg-gray-100 dark:bg-gray-800 p-4">
                            <div class="flex flex-col gap-1">
                                <div class="flex justify-between">
                                    <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-300">
                                        {{ $t('pos.orders.info.subtotal') }}
                                    </p>

                                    <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                        {{ formatPrice(currentOrder.order?.subTotal) }}
                                    </p>
                                </div>

                                <div class="flex justify-between">
                                    <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-300">
                                        {{ $t('pos.orders.info.tax') }}
                                    </p>

                                    <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                        {{ formatPrice(currentOrder.order?.taxTotal ?? 0) }}
                                    </p>
                                </div>

                                <div class="flex justify-between">
                                    <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-300">
                                        {{ $t('pos.orders.info.discount') }}
                                    </p>

                                    <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                                        {{ formatPrice(currentOrder.order?.discountAmount ?? 0) }}
                                    </p>
                                </div>
                            </div>

                            <div class="flex justify-between">
                                <p class="text-xl font-medium leading-6 text-gray-900 dark:text-white">
                                    {{ $t('pos.common.cart.payable_amount') }}
                                </p>

                                <p class="text-xl font-medium leading-6 text-gray-900 dark:text-white">
                                    {{ formatPrice(currentOrder.order?.grandTotal) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-slot:footer>
                    <div class="flex gap-2.5">
                        <button
                            v-if="isOnline"
                            type="button"
                            class="primary-button flex-1"
                            @click="handleOrderSync(currentOrder)"
                        >
                            <span class="icon-sync text-2xl"></span>

                            {{ $t('pos.orders.offline.sync_order') }}
                        </button>

                        <button
                            type="button"
                            class="secondary-button flex-1"
                            @click="handleReorderRequest(currentOrder)"
                            :disabled="isReorderButtonLoading"
                        >
                            <span 
                                class="icon-sync text-2xl dark:text-gray-100"
                                :class="isReorderButtonLoading ? 'animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]' : ''"
                            ></span>

                            {{ $t('pos.orders.info.reorder', 'Reorder') }}
                        </button>

                        <div class="flex-1">
                            <Print :outletOrder="currentOrder" />
                        </div>
                    </div>
                </template>
            </Drawer>

            <ReorderSummary ref="reorderSummaryModal" />
        </Teleport>
    </div>
</template>

<script setup>
    import { ref, watch, onBeforeMount, inject, toRaw } from 'vue';
    import { useI18n } from 'vue-i18n';
    import Info from '@components/secured/orders/Info.vue';
    import Print from '@components/secured/common/Print.vue';
    import OrderListSkeleton from '@skeletons/orders/List.vue';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import { useOutlet } from '@src/composable/outlet';
    import { useOfflineSync } from '@src/composable/offline-sync';
    import { useReorder } from '@src/composable/reorder';
    import ReorderSummary from '@components/secured/orders/ReorderSummary.vue';

    /**
     * General variables
     */
    const { t } = useI18n();
    const DB = useIndexedDB();
    const { formatDate, formatPrice } = useOutlet();
    const emitter = inject('emitter');
    const isOnline = inject('isOnline');
    const { syncSingleOrder, syncAllOrders } = useOfflineSync();

    /**
     * Lifecycle hooks
     */
    const offlineOrders = ref([]);
    const pageInfo = ref({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        count: 0
    });
    const perPage = 5;
    const loading = ref(true);

    onBeforeMount(async () => {
        await fetchOfflineOrders();
    });

    /**
     * Paginator
     */
    const fetchOfflineOrders = async (page = 1) => {
        await searchOrder(searchTerm.value || '', page, perPage);
    };

    const goToPage = (page) => {
        fetchOfflineOrders(page);
    };

    /**
     * Show order info
     */
    const orderInfoDrawer = ref(null);
    const currentOrder = ref({});
    const showOrderInfo = (order) => {
        currentOrder.value = order;

        orderInfoDrawer.value.open();
    }

    /**
     * Search term
     */
    const searchTerm = ref('');

    watch(searchTerm, (newValue) => {
        searchOrder(newValue);
    });

    /**
     * Search order
     */
    const searchOrder = async (searchTerm = '', page = 1, limit = 5) => {
        loading.value = true;
        
        const agent = await DB.getAgent();
        const db = await DB.getDb();
        const tx = db.transaction('offline_orders', 'readonly');
        const store = tx.objectStore('offline_orders');

        const term = searchTerm.toLowerCase();
        const filteredData = [];

        let cursor = await store.openCursor(null, 'prev');

        while (cursor) {
            const value = cursor.value;

            if (! value.outlet_id || value.outlet_id === agent.outlet.id) {
                if (
                    ! term
                    || value?.id?.toString().includes(term)
                ) {
                    filteredData.push(value);
                }
            }

            cursor = await cursor.continue();
        }

        const total = filteredData.length;
        const lastPage = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        const paginatedData = filteredData.slice(offset, offset + limit);

        offlineOrders.value = paginatedData;
        pageInfo.value = {
            currentPage: page,
            lastPage: lastPage,
            total: total,
            count: paginatedData.length
        };

        loading.value = false;
    };

    const refreshOfflineOrders = async () => {
        if (searchTerm.value) {
            await searchOrder(searchTerm.value, pageInfo.value.currentPage);
        } else {
            await fetchOfflineOrders(pageInfo.value.currentPage);
        }
    };

    /**
     * Sync order
     */
    const handleOrderSync = async (outletOrder) => {
        await syncSingleOrder(outletOrder, {
            onSynced: async () => {
                if (orderInfoDrawer.value) {
                    orderInfoDrawer.value.close();
                }

                if (currentOrder.value.id === outletOrder.id) {
                    currentOrder.value = {};
                }

                await refreshOfflineOrders();
            },
        });
    };

    /**
     * Sync all orders sequentially
     */
    const syncOfflineOrders = async () => {
        await syncAllOrders({
            onOrderSynced: refreshOfflineOrders,
        });
    };

    /**
     * Remove the order from the IndexedDB
     */
    const returnOrder = (order) => {
        emitter.emit('open_confirm_modal', {
            agree: async () => {
                DB.updateItem('offline_orders', {
                    ...toRaw(order),
                    isReturned: true,
                }).then(async () => {
                    if (searchTerm.value) {
                        await searchOrder(searchTerm.value);
                    } else {
                        await fetchOfflineOrders();
                    }
                    
                    emitter.emit('sync_offline_orders');
                });

                emitter.emit('add_flash', {
                    type: 'success',
                    message: t('pos.orders.offline.return_success'),
                });
            }
        });
    };

    /**
     * Reorder Logic
     */
    const { processReorder } = useReorder();
    const isReorderButtonLoading = ref(false);
    const reorderSummaryModal = ref(null);

    const handleReorderRequest = async (orderToReorder) => {
        if (!orderToReorder) return;
        
        isReorderButtonLoading.value = true;
        const summary = await processReorder(orderToReorder);
        isReorderButtonLoading.value = false;

        if (summary && (summary.added > 0 || summary.skipped.length > 0 || summary.modified.length > 0)) {
            if (orderInfoDrawer.value) {
                orderInfoDrawer.value.close();
            }
            reorderSummaryModal.value.open(summary);
        }
    };
</script>

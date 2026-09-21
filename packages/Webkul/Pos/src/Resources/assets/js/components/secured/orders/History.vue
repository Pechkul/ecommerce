<template>
    <div class="flex gap-4 max-sm:flex-col">
        <div class="w-full rounded-lg bg-white dark:bg-gray-900 p-4">
            <div class="relative mb-4 flex items-center text-gray-900 dark:text-gray-200">
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
                <div v-if="outletOrders.length">
                    <!-- Desktop Table View (hidden on mobile) -->
                    <div class="hidden md:block overflow-x-auto">
                        <!-- Header Labels -->
                        <div class="grid grid-cols-5 gap-4 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-300 dark:border-gray-600 pb-3 mb-3 select-none">
                            <div>{{ $t('pos.orders.history.order_id') }}</div>

                            <div>{{ $t('pos.orders.history.total_qty') }}</div>

                            <div>{{ $t('pos.orders.history.total_sales') }}</div>

                            <div>{{ $t('pos.orders.history.order_status.title') }}</div>

                            <div>{{ $t('pos.orders.history.date') }}</div>
                        </div>

                        <!-- Orders Data -->
                        <div
                            v-for="(outletOrder, index) in outletOrders"
                            :key="index"
                            @click="currentOrder = outletOrder;"
                            :class="[
                                'grid grid-cols-5 gap-4 py-3 px-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                                index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800/50' : ''
                            ]"
                        >
                            <div class="text-gray-900 dark:text-gray-100 text-sm">
                                # {{ outletOrder?.order?.id }}
                            </div>

                            <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                {{ outletOrder?.order?.totalQtyOrdered }}
                            </div>

                            <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                <template v-if="outletOrder?.order?.discountAmount">
                                    <span class="text-gray-400 text-[12px] mr-1 line-through">
                                        {{ formatPrice(outletOrder?.order?.subTotal) }}
                                    </span>

                                    <span class="text-green-600 dark:text-green-500">
                                        {{ formatPrice(outletOrder?.order?.grandTotal) }}
                                    </span>
                                </template>

                                <template v-else>
                                    {{ formatPrice(outletOrder?.order?.grandTotal) }}
                                </template>
                            </div>

                            <div class="text-gray-900 dark:text-gray-100 text-sm font-semibold">
                                <template v-if="outletOrder?.order?.status == 'completed'">
                                    <span class="label-success dark:label-success-dark">
                                        {{ $t('pos.orders.history.order_status.completed') }}
                                    </span>
                                </template>

                                <template v-else-if="outletOrder?.order?.status == 'closed'">
                                    <span class="label-closed dark:label-closed-dark">
                                        {{ $t('pos.orders.history.order_status.returned') }}
                                    </span>
                                </template>
                            </div>

                            <div class="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                {{ outletOrder?.order?.createdAt }}
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Card View (visible only on mobile) -->
                    <div class="md:hidden space-y-3">
                        <div
                            v-for="(outletOrder, index) in outletOrders"
                            :key="index"
                            @click="showOrderInfo(outletOrder)"
                            class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                        >
                            <!-- Date Header -->
                            <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    {{ outletOrder?.order?.createdAt }}
                                </h3>

                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    #{{ index + 1 }}
                                </span>
                            </div>

                            <!-- Payment Details Grid -->
                            <div class="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {{ $t('pos.orders.history.order_id') }}
                                    </div>

                                    <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        # {{ outletOrder?.order?.id }}
                                    </div>
                                </div>

                                <div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {{ $t('pos.orders.history.total_sales') }}
                                    </div>

                                    <div class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {{ formatPrice(outletOrder?.order?.grandTotal) }}
                                    </div>
                                </div>
                            </div>

                            <!-- Total Sale (prominent) -->
                            <div class="mb-3">
                                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    {{ $t('pos.orders.history.order_status.title') }}
                                </div>

                                <div class="font-bold text-gray-900 dark:text-gray-100 text-base">
                                    <template v-if="outletOrder?.order?.status == 'completed'">
                                        <span class="label-success dark:label-success-dark">
                                            {{ $t('pos.orders.history.order_status.completed') }}
                                        </span>
                                    </template>

                                    <template v-else-if="outletOrder?.order?.status == 'closed'">
                                        <span class="label-closed dark:label-closed-dark">
                                            {{ $t('pos.orders.history.order_status.returned') }}
                                        </span>
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
                        {{ $t('pos.orders.history.no_records') }}
                    </div>

                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ $t('pos.orders.history.no_records_desc') }}
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

        <!-- For Desktop view -->
        <Info
            :outletOrder="currentOrder"
            :showReturnButton="isOrderCanBeReturned && isOnline"
            @returnOrder="handleOrderReturn"
        />

        <!-- For Mobile view -->
        <Teleport to="body">
            <Drawer ref="orderInfoDrawer">
                <template v-slot:header>
                    <div class="flex flex-col px-2 py-4">
                        <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                            {{ $t('pos.orders.info.order_id') }} #{{ currentOrder.order?.id }}
                        </p>

                        <p class="text-sm leading-4 dark:text-gray-300">
                            {{ currentOrder.order?.customer?.name }}
                        </p>
                    </div>
                </template>

                <template v-slot:content>
                    <div class="flex min-h-full flex-col justify-between">
                        <div class="flex flex-col gap-1 overflow-hidden p-4">
                            <div
                                class="flex min-h-14 flex-col gap-4 rounded-lg p-2"
                                :class="[index % 2 == 0 ? 'bg-gray-100 dark:bg-gray-800' : '']"
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
                                        {{ formatPrice(currentOrder.order?.taxAmount ?? 0) }}
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
                    <div class="flex flex-col gap-2.5">
                        <div class="flex gap-2.5">
                            <button
                                v-if="isOnline"
                                type="button"
                                class="danger-button flex-1"
                                @click="handleOrderReturn(currentOrder)"
                            >
                                <span class="icon-sync text-2xl"></span>

                                {{ $t('pos.orders.history.return_btn') }}
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

                        <template v-if="currentOrder?.orderNote">
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
            </Drawer>

            <Modal ref="orderNoteModal">
                <template v-slot:header>
                    <label class="text-base leading-5 text-gray-900 dark:text-white">
                        {{ $t('pos.common.cart.order_note_form.title') }}
                    </label>
                </template>

                <template v-slot:content="{ toggle }">
                    <div class="grid gap-4">
                        <div class="p-3 text-base text-gray-700 bg-gray-100 border border-gray-200 rounded min-h-[100px] dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 whitespace-pre-wrap">
                            {{ currentOrder?.orderNote }}
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
    import { ref, inject, watch, computed, onBeforeMount } from 'vue';
    import { useI18n } from 'vue-i18n';
    import Info from '@components/secured/orders/Info.vue';
    import Print from '@components/secured/common/Print.vue';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import OrderListSkeleton from '@skeletons/orders/List.vue';
    import { useMutation } from '@vue/apollo-composable';
    import { RETURN_ORDER } from '@src/graphql/orders';
    import { useOutlet } from '@src/composable/outlet';
    import { useReorder } from '@src/composable/reorder';
    import ReorderSummary from '@components/secured/orders/ReorderSummary.vue';

    /**
     * General variables
     */
    const DB = useIndexedDB();
    const emitter = inject('emitter');
    const isOnline = inject('isOnline');
    const { t } = useI18n();
    const { formatPrice } = useOutlet();

    /**
     * Fetch orders
     */
    const outletOrders = ref([]);
    const pageInfo = ref({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        count: 0
    });
    const perPage = 5;
    const loading = ref(true);

    onBeforeMount(async () => {
        fetchPaginatedOrders();
    });

    /**
     * Paginator
     */
    const fetchPaginatedOrders = async (page = 1) => {
        loading.value = true;

        const result = await DB.paginateItems('orders', page, perPage);

        outletOrders.value = result.data;
        pageInfo.value = result.paginatorInfo;

        loading.value = false;
    };

    const goToPage = (page) => {
        if (normalizeSearchValue(searchTerm.value)) {
            searchOrder(searchTerm.value, page);

            return;
        }

        fetchPaginatedOrders(page);
    };

    /**
     * Show order info
     */
    const currentOrder = ref({});
    const orderInfoDrawer = ref(null);
    const orderNoteModal = ref(null);
    const showOrderInfo = (order) => {
        currentOrder.value = order;

        orderInfoDrawer.value.open();
    };

    /**
     * Search term
     */
    const searchTerm = ref('');

    const normalizeSearchValue = (value = '') => {
        return String(value ?? '').trim().toLowerCase();
    };

    const getOrderStatusSearchTerms = (status = '') => {
        const normalizedStatus = normalizeSearchValue(status);
        const statusTerms = new Set([normalizedStatus]);

        if (normalizedStatus === 'completed') {
            statusTerms.add(normalizeSearchValue(t('pos.orders.history.order_status.completed')));
        }

        if (normalizedStatus === 'closed') {
            statusTerms.add('returned');
            statusTerms.add(normalizeSearchValue(t('pos.orders.history.order_status.returned')));
        }

        return [...statusTerms].filter(Boolean);
    };

    const matchesOrderSearch = (order, term) => {
        if (! term) {
            return true;
        }

        const orderId = normalizeSearchValue(order?.id);
        const isNumericTerm = /^\d+$/.test(term);

        if (isNumericTerm) {
            return orderId === term;
        }

        const searchableFields = [
            order?.customerFirstName,
            order?.customerLastName,
            order?.customerEmail,
            order?.customer?.name,
            order?.customer?.email,
        ].map(normalizeSearchValue).filter(Boolean);

        return orderId.includes(term)
            || searchableFields.some((field) => field.includes(term))
            || getOrderStatusSearchTerms(order?.status).some((statusTerm) => statusTerm.includes(term));
    };

    watch(searchTerm, (newValue) => {
        searchOrder(newValue, 1);
    });

    /**
     * Search order
     */
    const searchOrder = async (searchTerm = '', page = 1, limit = 5) => {
        loading.value = true;

        const db = await DB.getDb();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');

        const term = normalizeSearchValue(searchTerm);
        const filteredData = [];

        let cursor = await store.openCursor(null, 'prev');

        while (cursor) {
            const value = cursor.value;

            if (matchesOrderSearch(value.order, term)) {
                filteredData.push(value);
            }

            cursor = await cursor.continue();
        }

        const total = filteredData.length;
        const lastPage = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        const paginatedData = filteredData.slice(offset, offset + limit);

        outletOrders.value = paginatedData;
        pageInfo.value = {
            currentPage: page,
            lastPage: lastPage,
            total: total,
            count: paginatedData.length
        };

        loading.value = false;
    };

    /**
     * Handle order return
     */
    const isOrderCanBeReturned = computed(() => {
        return currentOrder.value?.order?.items?.some(item => {
            return item.qtyInvoiced - item.qtyRefunded > 0;
        });
    });

    const { mutate: returnOrder } = useMutation(RETURN_ORDER);

    const handleOrderReturn = async (outletOrder) => {
        const input = {
            orderId: outletOrder.order.id,
            items: outletOrder.order.items.map(item => {
                return {
                    itemId: parseInt(item.id),
                    qty: item.qtyInvoiced - item.qtyRefunded,
                };
            }),
        };

        returnOrder({ input }).then(async (response) => {
            const { returnOrder } = response.data;

            emitter.emit('add_flash', {
                type: 'success',
                message: returnOrder.message,
            });

            const { outletOrder } = returnOrder;

            await DB.updateItem('orders', outletOrder);

            currentOrder.value = outletOrder;

            if (searchTerm.value) {
                searchOrder(searchTerm.value);
            } else {
                fetchPaginatedOrders(pageInfo.value.currentPage);
            }

            emitter.emit('returned_order_done');
        }).catch((error) => {
            emitter.emit('add_flash', {
                type: 'error',
                message: error.message,
            });
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

<template>
    <Teleport to="body">
        <Modal ref="customerSelectorModal">
            <template v-slot:header="{ toggle }">
                <div class="flex items-center justify-between gap-4">
                    <span class="text-gray-900 dark:text-gray-100">
                        {{ $t('pos.customers.title') }}
                    </span>

                    <span
                        class="icon-cross cursor-pointer text-2xl text-gray-900 dark:text-gray-100 hover:text-slate-600 dark:hover:text-slate-300"
                        @click="toggle"
                    ></span>
                </div>
            </template>

            <template v-slot:content>
                <div class="flex h-[540px] min-h-[420px] flex-col gap-4 overflow-hidden">
                    <div class="flex items-center justify-between gap-2.5 rounded-lg bg-white dark:bg-gray-900 max-sm:flex-col max-sm:items-stretch">
                        <div class="flex h-12 gap-2.5">
                            <div
                                v-for="type in ['customers', 'offline_customers']"
                                :key="type"
                                class="flex cursor-pointer items-center rounded-lg border-2 border-transparent px-3 py-2 text-base font-medium"
                                :class="[
                                    activeTab === type
                                        ? 'bg-gray-100 text-slate-600 !border-slate-600 dark:bg-gray-800 dark:text-slate-300 dark:!border-slate-400'
                                        : 'text-gray-900 dark:text-gray-100'
                                ]"
                                @click="activeTab = type"
                            >
                                {{ $t(`pos.customers.${type}`) }}
                            </div>
                        </div>

                        <button
                            type="button"
                            class="primary-button shrink-0"
                            @click="handleAddCustomer"
                        >
                            <span class="icon-plus text-2xl dark:text-gray-100"></span>

                            {{ $t('pos.customers.add_new_btn') }}
                        </button>
                    </div>

                    <div class="relative text-gray-900 dark:text-gray-100">
                        <input
                            v-model="searchTerm"
                            type="text"
                            class="h-12 w-full border-b bg-transparent px-8 text-base font-normal leading-5"
                            :placeholder="$t('pos.customers.search_customers')"
                        >

                        <i class="icon-search absolute left-0 top-3.5 flex items-center text-xl leading-5 dark:text-gray-100"></i>
                    </div>

                    <div class="min-h-0 overflow-hidden">
                        <template v-if="isLoading">
                            <div class="h-full overflow-y-auto pr-1">
                                <CustomerListSkeleton />
                            </div>
                        </template>

                        <template v-else>
                            <div
                                v-if="customers.length"
                                class="flex h-full flex-col gap-2 overflow-y-auto pr-1"
                            >
                                <div
                                    v-for="customer in customers"
                                    :key="`${activeTab}-${customer.id}`"
                                    class="flex items-center justify-between gap-3 rounded-lg border border-transparent p-2.5 transition hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                                    :class="[
                                        isSelectedCustomer(customer)
                                            ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-gray-800'
                                            : ''
                                    ]"
                                >
                                    <button
                                        type="button"
                                        :title="$t('pos.customers.select_btn')"
                                        class="flex flex-1 items-center gap-2.5 text-left"
                                        @click="selectCustomer(customer)"
                                    >
                                        <template v-if="customer.imageUrl">
                                            <img
                                                :src="customer.imageUrl"
                                                class="h-12 w-12 rounded"
                                                alt="profile image"
                                            >
                                        </template>

                                        <template v-else>
                                            <img
                                                src="/src/Resources/assets/images/user-placeholder.png"
                                                class="h-12 w-12 rounded dark:invert"
                                                alt="profile image"
                                            >
                                        </template>

                                        <div class="grid gap-1">
                                            <p class="text-base font-normal leading-5 text-gray-900 dark:text-gray-100">
                                                {{ customer.firstName }} {{ customer.lastName }}
                                            </p>

                                            <p class="text-base font-normal leading-5 text-neutral-400 dark:text-neutral-400">
                                                {{ customer.email }}
                                            </p>

                                            <p
                                                v-if="customer.phone"
                                                class="text-sm font-normal leading-4 text-neutral-400 dark:text-neutral-400"
                                            >
                                                {{ customer.phone }}
                                            </p>
                                        </div>
                                    </button>

                                    <template v-if="isSelectedCustomer(customer)">
                                        <span class="icon-check text-2xl text-slate-600 dark:text-slate-300"></span>
                                    </template>
                                </div>
                            </div>

                            <div
                                v-else
                                class="flex h-full items-center justify-center text-center text-gray-700 dark:text-gray-300"
                            >
                                <div class="font-medium">
                                    {{ $t('pos.customers.no_customers_found') }}
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="min-h-[96px] flex-none">
                        <Pagination
                            :loading="isLoading"
                            :pageInfo="pageInfo"
                            @page-change="goToPage"
                        />
                    </div>
                </div>
            </template>
        </Modal>
    </Teleport>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { useCustomerList } from '@src/composable/customer-list';
    import CustomerListSkeleton from '@skeletons/customers/List.vue';

    const router = useRouter();
    const customerSelectorModal = ref(null);

    const props = defineProps({
        selectedCustomer: {
            type: Object,
            default: () => ({}),
        },
    });

    const emit = defineEmits(['select']);

    const {
        activeTab,
        customers,
        searchTerm,
        pageInfo,
        isLoading,
        refreshCustomers,
        goToPage,
    } = useCustomerList();

    const selectedCustomerKey = computed(() => {
        if (! props.selectedCustomer?.id) {
            return null;
        }

        return `${props.selectedCustomer.isOffline ? 'offline_customers' : 'customers'}-${props.selectedCustomer.id}`;
    });

    const isSelectedCustomer = (customer) => {
        return selectedCustomerKey.value === `${activeTab.value}-${customer.id}`;
    };

    const open = async () => {
        searchTerm.value = '';
        activeTab.value = props.selectedCustomer?.isOffline ? 'offline_customers' : 'customers';
        await refreshCustomers(1);
        customerSelectorModal.value?.open();
    };

    const close = () => {
        customerSelectorModal.value?.close();
    };

    const selectCustomer = (customer) => {
        emit('select', JSON.parse(JSON.stringify({
            ...customer,
            isOffline: activeTab.value === 'offline_customers',
        })));
    };

    const handleAddCustomer = () => {
        close();
        router.push({ path: '/customers/create' });
    };

    defineExpose({
        open,
        close,
    });
</script>

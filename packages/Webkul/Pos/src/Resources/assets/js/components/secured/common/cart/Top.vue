<template>
    <div class="flex h-12 items-center justify-between gap-2.5 px-3 cursor-pointer">
        <button
            type="button"
            class="flex items-center text-left"
            @click="emit('open-customer-selector')"
        >
            <template v-if="customer?.id">
                <div class="flex items-center gap-2.5">
                    <template v-if="customer.imageUrl">
                        <img
                            :src="customer.imageUrl"
                            class="h-11 w-11 rounded-full"
                            alt="profile image"
                        >
                    </template>

                    <template v-else>
                        <img
                            src="@images/user-placeholder.png"
                            class="h-11 w-11 rounded-full dark:invert"
                            alt="profile image"
                        >
                    </template>

                    <div class="grid">
                        <p class="text-base font-semibold leading-5 text-gray-900 dark:text-white">
                            {{ `${customer?.firstName} ${customer?.lastName}` }}
                        </p>

                        <p class="text-sm font-normal leading-4 text-neutral-400 dark:text-gray-400">
                            {{ customer?.email }}
                        </p>
                    </div>
                </div>
            </template>

            <template v-else>
                <div class="flex items-center gap-2.5">
                    <img
                        src="@images/user-placeholder.png"
                        class="h-11 w-11 rounded-full"
                        alt="profile image"
                    >

                    <p class="text-base leading-5 text-gray-900 dark:text-white">
                        {{ $t('pos.common.cart.add_customer') }}
                    </p>
                </div>
            </template>
        </button>
        <div>
            <div class="flex items-center gap-2.5">
                <div v-if="customer?.id" class="flex items-center justify-center gap-2.5">
                    <div
                        class="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition duration-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                        @click="emit('open-customer-selector')"
                        :title="$t('pos.common.cart.change_customer')"
                    >
                        <img
                            src="@images/change-user.svg"
                            class="h-6 w-6 dark:hidden"
                            alt="Change Customer"
                        >

                        <img
                            src="@images/change-user-dark.svg"
                            class="hidden h-6 w-6 dark:block"
                            alt="Change Customer"
                        >
                    </div>

                    <div
                        v-if="! cart.itemsCount || cart?.itemsCount == 0"
                        class="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition duration-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                        @click="removeCustomer()"
                        :title="$t('pos.common.cart.remove_customer')"
                    >
                        <span class="icon-delete cursor-pointer rounded-md p-1 text-2xl transition-all dark:text-white"></span>
                    </div>
                </div>
                <div
                    v-if="cart?.itemsCount > 0"
                    class="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition duration-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    @click="removeCart()"
                    :title="$t('pos.common.cart.remove_cart')"
                >
                    <span class="icon-delete cursor-pointer rounded-md p-1 text-2xl transition-all dark:text-white">
                    </span>

                    <span
                        class="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 px-1 text-xs text-white"
                    >
                        {{ cart.itemsCount }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { inject } from 'vue';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import CartManager from '@src/helpers/Cart';

    const DB = useIndexedDB();

    const props = defineProps({
        customer: {
            type: Object,
            required: true
        },
        cart: {
            type: Object,
            required: true
        },
    });

    const emit = defineEmits(['get-cart', 'open-customer-selector']);

    /**
     * General use imports
     */
    const emitter = inject('emitter');

    /**
     * Cart remove function
     */
    const removeCart = async () => {
        emitter.emit('open_confirm_modal', {
            agree: async () => {
                const cartManager = new CartManager();

                await cartManager.removeCart().then(() => {
                    emit('get-cart');
                });

                return;
            },
        });
    };

    const removeCustomer = async () => {
        emitter.emit('open_confirm_modal', {
            agree: async () => {
                await DB.deleteAllItems('cart_customer');

                emitter.emit('customer_changed');
            },
        });
    };
</script>

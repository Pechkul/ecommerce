<template>
    <div
        v-if="layout === 'default'"
        class="fixed flex h-[calc(100vh-68px)] w-[clamp(420px,_30vw,_600px)] flex-col justify-between border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ltr:right-0 rtl:left-0"
    >
        <div class="flex flex-col">
            <div class="flex-1 py-4 shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.1)_inset] dark:shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.05)_inset]">
                <CartTop
                    :customer="customer"
                    :cart="cart"
                    @get-cart="getCart"
                    @open-customer-selector="openCustomerSelector"
                />
            </div>

            <div class="h-[calc(100vh-420px)] overflow-y-auto px-3 py-4">
                <CartItem
                    v-for="(item, index) in cart?.items"
                    :key="index"
                    :item="item"
                    :index="index"
                    :customer="customer"
                    @get-cart="getCart"
                />
            </div>
        </div>

        <CartBottom
            :cart="cart"
            :customer="customer"
            @get-cart="getCart"
        />        
    </div>

    <div v-else>
        <!-- Mobile view -->
        <div class="fixed bottom-0 left-0 right-0 flex w-full items-center justify-between gap-10 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-2.5 xl:hidden">
            <div class="flex flex-col gap-y-0.5">
                <p class="text-lg font-medium leading-6 text-gray-800 dark:text-white">
                    {{ formatPrice(cart?.grandTotal ?? 0) }}
                </p>

                <p class="text-sm leading-4 text-gray-600 dark:text-gray-400">
                    {{ $t('pos.home.items_in_cart', { count: cart?.items?.length ?? 0 }) }}
                </p>
            </div>

            <button
                class="secondary-button px-6 dark:text-white"
                @click="$refs.mobileCartDrawer.toggle()"
            >
                <span class="icon-cart text-2xl leading-6"></span>

                <span class="text-base font-semibold">
                    {{ $t('pos.home.view_cart_btn') }}
                </span>
            </button>
        </div>

        <Teleport to="body">
            <Drawer ref="mobileCartDrawer">
                <template v-slot:header>
                    <div class="px-2 py-4 bg-white dark:bg-gray-900">
                        <CartTop
                            :customer="customer"
                            :cart="cart"
                            @get-cart="getCart"
                            @open-customer-selector="openCustomerSelector"
                        />
                    </div>
                </template>

                <template v-slot:content>
                    <div class="flex h-full flex-col px-3 bg-white dark:bg-gray-900">
                        <CartItem
                            v-for="(item, index) in cart?.items"
                            :key="index"
                            :item="item"
                            :index="index"
                            :customer="customer"
                            @get-cart="getCart"
                        />
                    </div>
                </template>

                <template v-slot:footer>
                    <CartBottom
                        :cart="cart"
                        :customer="customer"
                        @get-cart="getCart"
                    />
                </template>
            </Drawer>
        </Teleport>

    </div>

    <CustomerSelector
        ref="customerSelectorModal"
        :selected-customer="customer"
        @select="handleCustomerSelected"
    />
</template>

<script setup>
    import { useI18n } from 'vue-i18n';
    import { useOutlet } from '@src/composable/outlet';
    import { onMounted, ref, inject, onBeforeUnmount, toRaw } from 'vue';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import CartTop from '@components/secured/common/cart/Top.vue';
    import CartItem from '@components/secured/common/cart/Item.vue';
    import CartBottom from '@components/secured/common/cart/Bottom.vue';
    import CustomerSelector from '@components/secured/common/cart/CustomerSelector.vue';
    import CartManager from '@src/helpers/Cart';
    
    /**
     * General use imports
     */
    const emitter = inject('emitter');
    const DB = useIndexedDB();
    const { formatPrice } = useOutlet();
    const { t } = useI18n();

    /**
     * Props
     */
    defineProps({
        layout: {
            type: String,
            default: 'default',
        },
    })

    /**
     * Cart management
     */
    const cart = ref({});
    const customerSelectorModal = ref(null);
    
    const getCart = async () => {
        const data = await DB.getCart();

        cart.value = data || {};
    };

    /**
     * Customer management
     */
    const customer = ref({});

    const normalizeCustomerForStorage = (selectedCustomer = {}) => {
        const customerData = Array.isArray(selectedCustomer)
            ? (selectedCustomer[0] ?? {})
            : (selectedCustomer ?? {});

        return JSON.parse(JSON.stringify(customerData));
    };

    const setCartCustomer = async (selectedCustomer = null) => {
        const data = selectedCustomer || await DB.getCartCustomer();

        customer.value = data || {};

        const currentCart = await DB.getCart();

        if (
            currentCart?.id
            && customer.value?.id
        ) {
            await DB.updateItem('cart', {
                ...toRaw(currentCart),
                customerId: customer.value.id,
                customerFirstName: customer.value.firstName,
                customerLastName: customer.value.lastName,
                customerEmail: customer.value.email,
            });
        }

        await getCart();
    };

    const updateCartCustomer = async (selectedCustomer = {}) => {
        const normalizedCustomer = normalizeCustomerForStorage(selectedCustomer);

        await DB.deleteAllItems('cart_customer');

        if (normalizedCustomer?.id) {
            await DB.addItem('cart_customer', normalizedCustomer);
        }

        await setCartCustomer(normalizedCustomer);
    };

    const openCustomerSelector = () => {
        customerSelectorModal.value?.open();
    };

    const handleCustomerSelected = async (selectedCustomer) => {
        await updateCartCustomer(selectedCustomer);
        customerSelectorModal.value?.close();
    };

    /**
     * Add to cart
     */
    const addToCart = async (productData) => {
        if (! customer.value?.id) {
            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.common.cart.no_customer_selected'),
            });

            return;
        }

        productData = {
            ...productData,
            cartId: cart.value?.id,
            customerId: customer.value?.id,
        };

        const cartManager = new CartManager();

        cartManager.addToCart(productData).then(() => {
            getCart();
        }).catch(error => {
            emitter.emit('add_flash', {
                type: 'warning',
                message: error,
            });
        })
    };

    /**
     * Global events
     */
    const registerEvents = () => {
        emitter.on('add_to_cart', addToCart);

        emitter.on('customer_changed', setCartCustomer);

        emitter.on('get-cart', getCart);
    };

    /**
     * Lifecycle hooks
     */
    onMounted(async () => {
        registerEvents();

        getCart();

        setCartCustomer();
    });

    onBeforeUnmount(() => {
        emitter.off('add_to_cart');

        emitter.off('customer_changed');

        emitter.off('get-cart');
    });
</script>

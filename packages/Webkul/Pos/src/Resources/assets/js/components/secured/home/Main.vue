<template>
    <div class="flex h-full gap-4 overflow-hidden">
        <div class="padding-right flex-1 overflow-hidden py-4">
            <div class="flex flex-col gap-4">
                <category 
                    v-model="selectedCategoryId" 
                    :categories="categories" 
                    @category-selected="handleCategorySelection" 
                />

                <div class="grid gap-4 [grid-template-columns:repeat(auto-fill,_minmax(172px,_1fr))]">
                    <div
                        class="box-shadow flex max-w-[300px] cursor-pointer flex-col gap-2 rounded-lg bg-white dark:bg-gray-900 p-3"
                        v-for="(product, index) in products"
                        :key="index"
                        @click="addToCart(product)"
                    >
                        <template v-if="product.images?.length">
                            <img
                                :src="product.images[0].url"
                                class="aspect-square rounded sm:max-w-[150px] md:max-w-[210px]"
                                alt="product image"
                            >
                        </template>

                        <template v-else>
                            <img
                                src="@images/product-placeholder.webp"
                                class="aspect-square rounded sm:max-w-[150px] md:max-w-[210px] dark:invert"
                                alt="product image"
                            >
                        </template>

                        <div class="flex h-full flex-col justify-between gap-2">
                            <div class="flex flex-col items-center gap-1">
                                <p class="truncate-text-2 text-center text-base font-normal leading-5 text-gray-900 dark:text-gray-100">
                                    {{ product.name }}
                                </p>

                                <p
                                    class="flex gap-1.5 text-base font-normal leading-5 text-gray-900 dark:text-gray-100"
                                    v-html="product.priceHtml"
                                >
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Teleport to="body">
            <!-- Cart (Mobile view only) -->
            <Cart
                v-if="isMobileOrTab"
                :layout="'drawer'"
            />

            <Modal ref="productModal">
                <template v-slot:header="{ toggle }">
                    <div class="flex justify-between gap-2.5">
                        <span class="text-gray-900 dark:text-gray-100">
                            {{ modalProduct.name }}
                        </span>

                        <span
                            class="icon-cross cursor-pointer text-2xl text-gray-900 dark:text-gray-100 hover:text-slate-600 dark:hover:text-slate-300"
                            @click="toggle"
                        ></span>
                    </div>
                </template>
                
                <template v-slot:content>
                    <View
                        :product="modalProduct"
                        :productModal="productModal"
                    />
                </template>
            </Modal>

            <Modal ref="receiptPrintModal">
                <template v-slot:header="{ toggle }">
                    <div class="flex justify-between gap-2.5">
                        <div class="flex items-center gap-2.5">
                            <span class="icon-warning cursor-pointer text-2xl text-gray-900 dark:text-yellow-400"></span>
                            
                            <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {{ $t('pos.home.print_confirmation_title') }}
                            </p>
                        </div>

                        <span
                            class="icon-cross cursor-pointer text-2xl text-gray-900 dark:text-gray-100 hover:text-slate-600 dark:hover:text-slate-300"
                            @click="toggle"
                        ></span>
                    </div>
                </template>
                
                <template v-slot:content>
                    <p class="pb-2.5 text-base font-normal text-gray-900 dark:text-gray-100">
                        {{ $t('pos.home.print_confirm_message') }}
                    </p>

                    <Print :outletOrder="outletOrder" />
                </template>
            </Modal>
        </Teleport>

        <!-- Cart (Desktop View Only) -->
        <Cart v-if="! isMobileOrTab" />
    </div>
</template>

<script setup>
    import { ref, onMounted, inject, onBeforeUnmount } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import { useWindowWidth } from '@src/composable/window';
    import Category from '@components/secured/home/Category.vue';
    import View from '@components/secured/home/products/View.vue';
    import Print from '@components/secured/common/Print.vue';

    /**
     * General variables
     */
    const emitter = inject('emitter');
    const DB = useIndexedDB();
    const { t } = useI18n();
    const { isMobileOrTab } = useWindowWidth();

    /**
     * Fetch products and categories
     */
    const products = ref([]);
    const categories = ref([]);
    
    onMounted(async () => {
        categories.value = await DB.getItem('categories', 1).then(data => data?.categories) || [];

        products.value = await DB.getAllItems('products');        
    });

    /**
     * Category Navigation
     */
    const selectedCategoryId = ref(0);

    /**
     * Handle category selection
     */
    const handleCategorySelection = async (categoryId) => {
        selectedCategoryId.value = categoryId;

        const allProducts = await DB.getAllItems('products');

        if (! allProducts.length) {
            return;
        }

        if (categoryId) {
            products.value = allProducts.filter(product => 
                product.categories.some(category => category.id == categoryId)
            );
        } else {
            products.value = allProducts;
        }
    };

    /**
     * Search product
     */
    const searchProduct = async (searchTerm) => {        
        if (searchTerm) {
            products.value = await DB.getAllItems('products').then(data => {
                return data.filter(product => {
                    const term = searchTerm.toLowerCase();

                    return product.name.toLowerCase().includes(term)
                        || product.sku.toLowerCase().includes(term);
                });
            });
        } else {
            products.value = await DB.getAllItems('products');
        }
    };

    /**
     * Search product by barcode
     */
    const searchBarcodeProduct = (barcode) => {
        const product = products.value.find(product => product.barcode === barcode);        

        if (product) {
            addToCart(product);
        } else {
            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.home.products.no_barcode_product'),
            });
        }
    };

    /**
     * Add product to cart
     */
    const productModal = ref(null);
    const modalProduct = ref(null);

    const addToCart = (product) => {
        if (['simple', 'virtual'].includes(product.type)) {
            if (product.customizableOptions.length) {
                modalProduct.value = product;
                
                productModal.value.toggle();
            } else {
                emitter.emit('add_to_cart', {
                    productId: product.id,
                    quantity: 1,
                });
            }
        } else {
            modalProduct.value = product;
            
            productModal.value.toggle();
        }
    }

    /**
     * Listen for search product event
     */
    const registerEvents = () => {
        emitter.on('search_barcode', searchBarcodeProduct);

        emitter.on('search_product', searchProduct);

        emitter.on('new_product', async () => {
            products.value = await DB.getAllItems('products');
        });

        emitter.on('sync_entities_ended', async () => {
            products.value = await DB.getAllItems('products');
        });
    };

    /**
     * Check for receipt print
     */
    const outletOrder = ref(null);

    const receiptPrintModal = ref(null);

    const checkForReceiptPrint = () => {
        DB.getAgent().then(agent => {
            const outletOrderData = localStorage.getItem('outlet_order');        

            if (
                agent
                && Boolean(agent.outlet?.receipt?.showPrintConfirmation)
                && outletOrderData
            ) {
                outletOrder.value = JSON.parse(outletOrderData);

                receiptPrintModal.value.toggle();
            }

            localStorage.removeItem('outlet_order');
        });
    };

    onMounted(() => {
        registerEvents();

        checkForReceiptPrint();
    });

    onBeforeUnmount(() => {
        emitter.off('search_barcode');
        emitter.off('search_product');
        emitter.off('new_product');
    });
</script>
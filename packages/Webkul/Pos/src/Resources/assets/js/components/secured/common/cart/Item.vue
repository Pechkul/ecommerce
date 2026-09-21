<template>
    <div
        ref="itemElement"
        class="group relative rounded-xl border mb-3 overflow-hidden transition-all duration-500"
        :class="{
            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900': !showMore && !isHighlighted,
            'border-green-500 dark:border-green-600 bg-gradient-to-r from-green-50 to-white dark:from-green-950/30 dark:to-gray-900 shadow-md': showMore,
            'ring-1 ring-yellow-400 dark:ring-yellow-500 ring-opacity-75 shadow-lg bg-yellow-50/30 dark:bg-yellow-950/20 border-yellow-400 dark:border-yellow-600': isHighlighted && highlightType === 'new',
            'ring-1 ring-blue-400 dark:ring-blue-500 ring-opacity-75 shadow-lg bg-blue-50/30 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600': isHighlighted && highlightType === 'repeated'
        }"
    >
        <!-- Main Row -->
        <div class="flex items-center justify-between gap-4 p-4">
            <!-- Left Section -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <!-- Expand Button -->
                <button
                    class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    @click="showMore = !showMore"
                >
                    <span
                        class="text-xl"
                        :class="[
                            showMore ? 'icon-chevron-down text-green-600 dark:text-green-500' : 'icon-chevron-right text-gray-400 dark:text-gray-500'
                        ]"
                    >
                    </span>
                </button>

                <!-- Item Name -->
                <h3
                    class="text-base font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer"
                    :title="item.name"
                >
                    {{ item.name }}
                </h3>

                <span>
                    x
                </span>

                <!-- Item Number Badge -->
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {{ item.quantity }}
                    </span>
                </div>
            </div>

            <!-- Right Section -->
            <div class="flex items-center gap-3 flex-shrink-0">
                <!-- Price Display -->
                <div class="text-right">
                    <template v-if="item.customPrice">
                        <div class="text-xs text-gray-400 dark:text-gray-500 line-through">
                            {{ formatPrice(item.product?.price) }}
                        </div>

                        <div class="text-lg font-bold text-green-600 dark:text-green-500">
                            {{ formatPrice(item?.customPrice) }}
                        </div>
                    </template>

                    <template v-else>
                        <span class="text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {{ formatPrice(item?.price) }}
                        </span>
                    </template>
                </div>

                <!-- Remove Button -->
                <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30"
                    @click="removeCartItem(item)"
                    aria-label="Remove item"
                >
                    <span class="icon-cross text-lg text-red-600 dark:text-red-500"></span>
                </button>
            </div>
        </div>

        <!-- Expanded Details -->
        <div
            v-if="showMore"
            class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        >
            <div class="p-4 space-y-4">
                <!-- Attributes -->
                <template v-if="hasAttributes">
                    <div class="space-y-1.5">
                        <div
                            v-for="(option, key) in item.additional.attributes"
                            :key="key"
                            class="flex items-start gap-2"
                        >
                            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {{ option.attributeName }}:
                            </span>

                            <span class="text-sm text-gray-800 dark:text-gray-200 break-words">
                                {{ option.optionLabel }}
                            </span>
                        </div>
                    </div>
                </template>

                <!-- Quantity and Discount Controls -->
                <div class="grid grid-cols-2 gap-4">
                    <!-- Quantity Controls -->
                    <div class="space-y-2">
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {{ $t('pos.common.cart.quantity') }}
                        </span>

                        <div class="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                            <!-- Decrement Button -->
                            <button
                                class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                @click="item.quantity--; updateCartItemQty(item)"
                                :disabled="item.quantity <= 1"
                            >
                                <span class="icon-minus text-lg text-gray-700 dark:text-gray-300"></span>
                            </button>

                            <!-- Quantity -->
                            <span class="flex-1 text-center text-base font-semibold text-gray-900 dark:text-gray-100">
                                {{ item.quantity }}
                            </span>

                            <!-- Increment Button -->
                            <button
                                class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                @click="item.quantity++; updateCartItemQty(item)"
                                aria-label="Increase quantity"
                            >
                                <span class="icon-plus text-lg text-gray-700 dark:text-gray-300"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Discount Controls -->
                    <div
                        v-if="item.type !== 'bundle'"
                        class="space-y-2"
                    >
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {{ $t('pos.common.cart.discount') }}
                        </span>

                        <div class="flex items-center gap-2">
                            <!-- Discount Input -->
                            <div class="relative flex-1">
                                <input
                                    type="number"
                                    v-model="discountPercentage"
                                    :placeholder="getAdditionalDiscountPercentage(item).toString()"
                                    class="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent"
                                    min="0"
                                    max="99.99"
                                    maxlength="5"
                                    step="0.01"
                                />

                                <div class="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded bg-gray-100 dark:bg-gray-800">
                                    <span class="icon-percentage text-base text-gray-600 dark:text-gray-400"></span>
                                </div>
                            </div>

                            <!-- Apply Button -->
                            <button
                                class="h-10 w-10 flex-shrink-0 rounded-lg bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 flex items-center justify-center transition-colors"
                                @click="applyAdditionalDiscount(item)"
                                aria-label="Apply discount"
                            >
                                <span class="icon-checkout text-xl text-white rtl:rotate-180"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Current Discount Display -->
                <div
                    v-if="item.customPrice"
                    class="text-xs text-green-600 dark:text-green-500 font-medium"
                >
                    {{ $t('pos.common.cart.discount_applied', {
                        percentage: getAdditionalDiscountPercentage(item)
                    }) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed, inject, watch, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    import CartManager from '@src/helpers/Cart';
    import { useOutlet } from '@src/composable/outlet';

    const props = defineProps({
        item: {
            type: Object,
            required: true,
        },
        index: {
            type: Number,
            required: true,
        },
        customer: {
            type: Object,
            required: true,
        },
    });

    /**
     * General use imports
     */
    const { formatPrice } = useOutlet();

    const emit = defineEmits(['get-cart']);
    const emitter = inject('emitter');
    const { t } = useI18n();

    /**
     * Template ref for smooth scroll
     */
    const itemElement = ref(null);

    /**
     * State management
     */
    const showMore = ref(false);
    const discountPercentage = ref(0);
    const isHighlighted = ref(false);
    const highlightType = ref('new'); // 'new' for new item, 'repeated' for repeated product
    let highlightTimeout = null;
    const previousQuantity = ref(props.item.quantity);

    /**
     * Check if product is repeated (quantity increased from previous)
     */
    const isRepeatedProduct = computed(() => {
        return previousQuantity.value > 0 && props.item.quantity > previousQuantity.value;
    });

    /**
     * Trigger highlight animation with type
     */
    const triggerHighlight = (type = 'new') => {
        highlightType.value = type;
        isHighlighted.value = true;

        // Clear previous timeout if exists
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
        }

        // Remove highlight after 1 second (reduced from 2)
        highlightTimeout = setTimeout(() => {
            isHighlighted.value = false;
        }, 700);
    };

    /**
     * Watch for quantity changes to detect duplicates
     */
    watch(() => props.item.quantity, (newQuantity, oldQuantity) => {
        // If quantity increased, it's a duplicate product being added
        if (newQuantity > oldQuantity && oldQuantity > 0) {
            triggerHighlight('repeated');
            previousQuantity.value = newQuantity;

            // Scroll to item immediately
            if (itemElement.value) {
                const parentScroller = itemElement.value.closest('.overflow-y-auto');
                if (parentScroller) {
                    itemElement.value?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }
            }
        }
    });

    /**
     * Smooth scroll to item when mounted (newly added)
     */
    onMounted(() => {
        if (itemElement.value) {
            // Find the parent scrollable container
            const parentScroller = itemElement.value.closest('.overflow-y-auto');

            if (parentScroller) {
                setTimeout(() => {
                    itemElement.value?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end'
                    });
                }, 50);
            }

            // Trigger highlight animation on mount - only for new items (quantity = 1)
            if (props.item.quantity === 1) {
                triggerHighlight('new');
            }
        }
    });

    /**
     * Watch discount percentage to prevent values above 100
     */
    watch(discountPercentage, (newValue) => {
        if (newValue > 100) {
            discountPercentage.value = 99.99;

            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.common.cart.discount_max_exceeded'),
            });
        }
    });

    /**
     * Check if item has attributes
     */
    const hasAttributes = computed(() => {
        return props.item.additional?.attributes
            && Object.keys(props.item.additional.attributes).length > 0;
    });

    /**
     * Update cart item
     */
    const updateCartItemQty = async (item) => {
        if (item.product.quantity < item.quantity) {
            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.common.cart.insufficient_stock_warning', {
                    product: item.name,
                }),
            });

            item.quantity = item.product.quantity;

            return;
        }

        const parsedCustomPrice = parseFloat(item.customPrice);
        const input = {
            cartId: item.cartId,
            customerId: props.customer.id,
            qty: [{
                cartItemId: item.id,
                customPrice: Number.isNaN(parsedCustomPrice) ? 0 : parsedCustomPrice,
                quantity: parseInt(item.quantity),
                additionalDiscountPercentage: getAdditionalDiscountPercentage(item),
            }],
        };

        const cartManager = new CartManager();

        await cartManager.updateItems(input).then(() => {
            // Trigger highlight when item is updated - use 'repeated' type for quantity increase
            triggerHighlight('repeated');
            emit('get-cart');
        });
    };

    /**
     * Apply additional discount
     */
    const applyAdditionalDiscount = (item) => {
        const finalPrice = parseFloat(item.product.basePrice);
        const percentage = parseFloat(discountPercentage.value);

        if (
            isNaN(percentage)
            || percentage <= 0
        ) {
            item.customPrice = 0;
        } else {
            item.customPrice = finalPrice - ((percentage / 100) * finalPrice);
        }

        updateCartItemQty(item);
    };

    /**
     * Get additional discount percentage
     */
    const getAdditionalDiscountPercentage = (item) => {
        const finalPrice = parseFloat(item.product.basePrice);
        const customPrice = parseFloat(item.customPrice);

        if (
            isNaN(customPrice)
            || customPrice <= 0
        ) {
            return 0;
        }

        const discount = ((finalPrice - customPrice) / finalPrice) * 100;

        return parseFloat(discount.toFixed(2));
    };

    /**
     * Remove cart item
     */
    const removeCartItem = async (item) => {
        const cartManager = new CartManager();

        await cartManager.removeItem(item.id).then(() => {
            emit('get-cart');
        });

        return;
    };
</script>

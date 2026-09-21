<template>
    <div>
        <div
            v-if="outlet?.receipt"
            class="mx-2 mb-5 hidden max-w-[140mm] p-2"
            ref="printableContent"
        >
            <div
                v-if="
                    outlet.receipt.displayLogo
                    || outlet.receipt.displayOutletName
                "
                class="flex flex-col items-center border-b border-gray-300 pb-4"
            >
                <img
                    v-if="outlet.receipt.displayLogo"
                    :src="outlet.receipt.logoUrl"
                    class="rounded"
                    :style="`
                        width: ${outlet.receipt.logoWidth}px;
                        height: ${outlet.receipt.logoHeight}px;
                    `"
                    :alt="outlet.receipt.logoAlt"
                />

                <div
                    v-if="outlet.receipt.displayOutletName"
                    class="mt-2"
                >
                    <h2 class="text-lg font-bold">
                        {{ outlet.name }}
                    </h2>
                </div>
            </div>

            <div
                v-if="outlet.receipt.displayOutletAddress"
                class="border-b border-gray-300 py-4"
            >
                <div>
                    <h2 class="text-base font-bold mb-2">
                        {{ $t('pos.orders.print.contact_info') }}
                    </h2>

                    <p class="text-sm leading-relaxed text-gray-600">
                        <span class="font-semibold">Address:</span> {{ `${outlet?.address}, ${outlet?.city}, ${outlet?.state}, ${outlet?.country}, ${outlet?.postcode}` }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.email') }}:</span> {{ outlet.email }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.phone') }}:</span> {{ outlet.phone }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.website') }}:</span> {{ outlet.website }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.customer_care') }}:</span> {{ outlet.customerCareNumber }}
                    </p>
                </div>
            </div>

            <div
                v-if="outlet.receipt.headerContent"
                v-html="outlet.receipt.headerContent"
                class="border-b border-gray-300 py-4 text-sm text-gray-600"
            >
            </div>

            <table class="w-full border-collapse py-4">
                <tbody>
                    <tr
                        v-if="outlet.receipt.displayDate"
                        class="border-b border-gray-300"
                    >
                        <td class="p-2 font-semibold">
                            {{ $t('pos.orders.print.date') }}
                        </td>

                        <td class="p-2 text-right">
                            {{ outletOrder?.order?.createdAt }}
                        </td>
                    </tr>

                    <tr
                        v-if="outlet?.receipt?.displayOrderId"
                        class="border-b border-gray-300"
                    >
                        <td class="p-2 font-semibold">
                            {{ outlet.receipt.orderIdLabel ?? $t('pos.orders.print.order_id') }}
                        </td>
                        
                        <td class="p-2 text-right">
                            #{{ outletOrder?.order?.id }}
                        </td>
                    </tr>

                    <tr
                        v-if="outlet?.receipt?.displayCashierName"
                        class="border-b border-gray-300"
                    >
                        <td class="p-2 font-semibold">
                            {{ outlet.receipt.cashierLabel ?? $t('pos.orders.print.cashier') }}
                        </td>
                        
                        <td class="p-2 text-right">
                            {{ `${agent?.firstName} ${agent?.lastName}` }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div
                v-if="outlet.receipt.displayCustomerName"
                class="border-b border-gray-300 py-4"
            >
                <div>
                    <h2 class="text-base font-bold mb-2">
                        {{ $t('pos.orders.print.customer') }}
                    </h2>

                    <p class="text-sm leading-relaxed text-gray-600">
                        <span class="font-semibold">{{ $t('pos.orders.print.name') }}:</span>
                        {{ `${outletOrder?.order?.customerFirstName} ${outletOrder?.order?.customerLastName}` }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.email') }}:</span>
                        {{ outletOrder?.order?.customerEmail }}<br />
                        <span class="font-semibold">{{ $t('pos.orders.print.phone') }}:</span>
                        {{ outletOrder?.order?.customer?.phone }}<br />
                    </p>
                </div>
            </div>

            <div class="max-w-[140mm] mt-4">
                <div class="grid grid-cols-4 gap-2 bg-gray-200 p-2 text-sm font-bold">
                    <div>{{ $t('pos.orders.print.item') }}</div>
                    <div class="text-center">{{ $t('pos.orders.print.qty') }}</div>
                    <div class="text-right">{{ $t('pos.orders.print.price') }}</div>
                    <div class="text-right">{{ $t('pos.orders.print.total') }}</div>
                </div>

                <div
                    v-for="(item, index) in outletOrder?.order?.items"
                    :key="index"
                    class="grid grid-cols-4 gap-2 border-b border-gray-300 p-2"
                >
                    <div class="flex flex-col gap-y-1">
                        <div class="text-sm font-medium">{{ item.name }}</div>

                        <div class="flex flex-col gap-1">
                            <div
                                v-for="option in keysToCamel(item.additional?.attributes)"
                                :key="option.attributeName"
                                class="flex flex-wrap gap-x-1 text-xs"
                            >
                                <span class="text-gray-500">
                                    {{ option.attributeName }}:
                                </span>
                                <span class="text-gray-600">
                                    {{ option.optionLabel }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="text-center text-sm">{{ item.qtyOrdered ?? item.quantity }}</div>
                    <div class="text-right text-sm">
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
                                {{ formatPrice(item?.price) }}
                            </span>
                        </template>
                    </div>

                    <div class="text-right text-sm font-medium">{{ formatPrice(item?.total) }}</div>
                </div>

                <div
                    v-if="outletOrder?.order"
                    class="border-t border-gray-300 mt-2"
                >
                    <div class="grid grid-cols-4 gap-2 bg-gray-50 p-2 text-sm font-medium">
                        <div class="col-span-2"></div>
                        <div class="text-right">{{ $t('pos.orders.print.total_qty') }}</div>
                        <div class="text-right">{{ outletOrder?.order?.totalQtyOrdered ?? outletOrder?.order?.itemsQty }}</div>
                    </div>

                    <div
                        v-if="outlet.receipt.displaySubTotal"
                        class="grid grid-cols-4 gap-2 p-2 text-sm"
                    >
                        <div class="col-span-2"></div>
                        <div class="text-right font-medium">
                            {{ outlet.receipt.subTotalLabel ?? $t('pos.orders.print.subtotal') }}
                        </div>
                        <div class="text-right">
                            {{ formatPrice(outletOrder?.order?.subTotal) }}
                        </div>
                    </div>

                    <div
                        v-if="outlet.receipt.displayDiscount && outletOrder?.order?.discountAmount"
                        class="grid grid-cols-4 gap-2 p-2 text-sm text-red-600"
                    >
                        <div class="col-span-2"></div>
                        <div class="text-right font-medium">
                            {{ outlet.receipt.discountLabel ?? $t('pos.orders.print.discount') }}
                        </div>
                        <div class="text-right">
                            -{{ formatPrice(outletOrder?.order?.discountAmount) }}
                        </div>
                    </div>

                    <div
                        v-if="outlet.receipt.displayTax"
                        class="grid grid-cols-4 gap-2 p-2 text-sm"
                    >
                        <div class="col-span-2"></div>
                        <div class="text-right font-medium">
                            {{ outlet.receipt.taxLabel ?? $t('pos.orders.print.tax') }}
                        </div>
                        <div class="text-right">
                            {{ formatPrice(outletOrder.order?.taxAmount ?? outletOrder.order?.taxTotal ?? 0) }}
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-2 bg-gray-100 p-2 text-base font-bold border-t-2 border-gray-300">
                        <div class="col-span-2"></div>
                        <div class="text-right">
                            {{ outlet?.receipt?.grandTotalLabel ?? $t('pos.orders.print.grand_total') }}
                        </div>
                        <div class="text-right">
                            {{ formatPrice(outletOrder?.order?.grandTotal) }}
                        </div>
                    </div>

                    <div
                        v-if="outlet.receipt.displayChangeAmount && outletOrder?.customerCredit?.changeAmount"
                        class="grid grid-cols-4 gap-2 p-2 text-sm"
                    >
                        <div class="col-span-2"></div>
                        <div class="text-right font-medium">
                            {{ outlet.receipt.creditChangeLabel ?? $t('pos.orders.print.change') }}
                        </div>
                        <div class="text-right">
                            {{ formatPrice(outletOrder?.customerCredit?.changeAmount) }}
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="
                    outlet.receipt.showOrderBarcode
                    && outletOrder?.barcodeUrl
                "
                class="flex flex-col items-center border-t border-gray-300 pt-4 mt-4"
            >
                <img
                    :src="outletOrder.barcodeUrl"
                    class="max-w-full h-16"
                    alt="Order Barcode"
                />
            </div>

            <div
                v-if="outlet.receipt.footerContent"
                class="border-t border-gray-300 pt-4 mt-4 text-sm text-center text-gray-600"
            >
                <p v-html="outlet.receipt.footerContent"></p>
            </div>
        </div>

        <button
            type="button"
            class="secondary-button w-full"
            @click="printInvoice"
        >
            <span class="icon-print text-2xl"></span>
            {{ $t('pos.orders.print.btn_title') }}
        </button>
    </div>
</template>

<script setup>
    import { ref, inject, onBeforeMount } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import { useOutlet } from '@src/composable/outlet';
    import { keysToCamel } from '@src/utils/case-converter';

    const props = defineProps({
        outletOrder: {
            type: Object,
            required: true
        }
    });    

    /**
     * Inject the dependency.
     */
    const DB = useIndexedDB();
    const emitter = inject('emitter');
    const { t } = useI18n();
    const { formatPrice } = useOutlet();

    const agent = ref({});
    const outlet = ref({});

    onBeforeMount(async () => {        
        agent.value = await DB.getAgent();
        outlet.value = agent.value?.outlet || {};
    });
    
    /**
     * Method to print invoice.
     */
    const printableContent = ref(null);

    const printInvoice = () => {        
        if (
            ! outlet.value?.receipt
            || Object.keys(outlet.value?.receipt).length === 0
        ) {
            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.orders.print.no_receipt'),
            });

            return;
        }

        /**
         * Get the html content to print.
         */
        const printableHtml = printableContent.value.innerHTML;

        if (! printableHtml) {
            return;
        }

        /**
         * Get the styles and html content to print.
         */
        let stylesHtml = '';
        for (const node of [...document.querySelectorAll('link[rel="stylesheet"], style')]) {
            stylesHtml += node.outerHTML;
        }

        /**
         * Open a new window and print the content.
         */
        const printWindow = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');

        printWindow.document.write(
            `<!DOCTYPE html>
                <html>
                    <head>
                        <title>${outlet?.receipt?.title || 'POS Receipt'}</title>
                        ${stylesHtml}
                    </head>
                    <body>
                        ${printableHtml}
                    </body>
                </html>
            `);

        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };
</script>
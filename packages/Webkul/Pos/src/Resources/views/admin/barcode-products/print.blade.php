<x-admin::layouts>
    <!-- Title of the page -->
    <x-slot:title>
        @lang('pos::app.admin.barcode-products.print.title')
    </x-slot:title>

    @push('styles')
        <style>
            /* =========================================================
               CSS ล็อกขนาดแบบ Strict เพื่อลบหน้า 2 ออกถาวร
               ========================================================= */

            /* 1. บังคับขอบกระดาษจริงของไดรเวอร์เครื่องพิมพ์ให้เป็น 0 */
            @page {
                size: 100mm 50mm;
                margin: 0 !important;
            }

            @media print {
                /* 2. รีเซ็ตพื้นที่รวมทั้งหมดเพื่อป้องกันการสะสมความสูง (Margin/Padding Accumulation) */
                html, body {
                    width: 100mm !important;
                    height: 50mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }

                /* 3. ซ่อนองค์ประกอบอื่นๆ ทั้งหมด */
                body * {
                    visibility: hidden !important;
                }

                /* 4. แสดงเฉพาะส่วนพิมพ์ */
                #printable-area, #printable-area * {
                    visibility: visible !important;
                }

                /* 5. ล็อก Container ไม่ให้ยืด/ขยายเกิน 50mm แน่นอน */
                #printable-area {
                    position: fixed !important; /* เปลี่ยนเป็น fixed เพื่อตรึงตำแหน่งไม่ให้เลื่อนหลุด */
                    left: 0 !important;
                    top: 0 !important;
                    width: 100mm !important;
                    height: 50mm !important;
                    margin: 2mm !important;
                    padding: 2mm !important;
                    background: transparent !important;
                    overflow: hidden !important;
                }

                /* 6. ตัวการ์ดสติกเกอร์ (ปรับความสูงรวมเป็น 49.5mm เพื่อเผื่อ Pixel Tolerance ของเครื่องพิมพ์) */
                .barcode-sticker-page {
                    width: 99mm !important;
                    height: 49mm !important; /* เผื่อระยะขาดเกินให้ไม่ล้นหน้าแรก */
                    box-sizing: border-box !important;
                    padding: 2mm 2mm !important;
                    display: grid !important;
                    grid-template-rows: 35mm 11.5mm !important; /* รวมกันเท่ากับ 46.5mm + padding = 48.5mm */
                    align-items: center !important;
                    justify-items: center !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    page-break-after: avoid !important; /* ห้ามตัดขึ้นหน้าใหม่ */
                    break-after: avoid !important;
                }

                /* 7. รูปบาร์โค้ดแนวนอน */
                .barcode-sticker-page img {
                    width: 100% !important;
                    height: 35mm !important;
                    max-height: 35mm !important;
                    object-fit: fill !important;
                    display: block !important;
                    margin: 0 !important;
                }

                /* 8. ข้อความชื่อสินค้า */
                .barcode-sticker-page p {
                    color: #000 !important;
                    font-size: 10pt !important;
                    font-weight: bold !important;
                    line-height: 1.1 !important;
                    text-align: center !important;
                    word-break: break-word !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    display: -webkit-box !important;
                    -webkit-line-clamp: 2 !important;
                    -webkit-box-orient: vertical !important;
                    overflow: hidden !important;
                }
            }
        </style>
    @endpush

    <div class="print-barcode flex items-center justify-between gap-4 max-sm:flex-wrap">
        <p class="text-xl font-bold text-gray-800 dark:text-white">
            @lang('pos::app.admin.barcode-products.print.title')
        </p>

        <div class="flex items-center gap-x-2.5">
            <!-- Back Button -->
            <a
                href="{{ route('admin.pos.barcode_products.index') }}"
                class="transparent-button hover:bg-gray-200 dark:text-white dark:hover:bg-gray-800"
            >
                @lang('pos::app.admin.barcode-products.print.back-btn')
            </a>

            <!-- Save Button -->
            <button
                class="primary-button"
                id="print-barcode"
            >
                @lang('pos::app.admin.barcode-products.print.btn-title')
            </button>
        </div>
    </div>

    <v-print-barcode />

    @pushOnce('scripts')
        <script
            type="text/x-template"
            id="v-print-barcode-template"
        >
            <div class="mt-3 flex gap-2 max-xl:flex-wrap">
                <div class="flex flex-1 flex-col gap-2 max-xl:flex-auto">
                    <x-admin::form
                        v-slot="{ meta, errors, handleSubmit }"
                        as="div"
                    >
                        <form
                            class="quantity mb-2"
                            @submit="handleSubmit($event, submitForm)"
                        >
                            <x-admin::form.control-group class="w-[250px]">
                                <x-admin::form.control-group.label class="required">
                                    @lang('pos::app.admin.barcode-products.print.qty')
                                </x-admin::form.control-group.label>

                                <x-admin::form.control-group.control
                                    type="text"
                                    name="quantity"
                                    rules="required|numeric|min_value:1|max_value:100"
                                    v-model="quantity"
                                />

                                <x-admin::form.control-group.error control-name="quantity" />
                            </x-admin::form.control-group>
                        </form>
                    </x-admin::form>

                    <!-- พื้นที่ printable-area ลบ Padding ทั้งหมดออกสำหรับโหมดพิมพ์ -->
                    <div
                        id="printable-area"
                        class="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg"
                        v-if="isValidBarcode"
                    >
                        <div
                            v-for="(barcode, index) in barcode"
                            :key="index"
                        >
                            <!-- ถอดคลาส pr-10 pb-10 ของดั้งเดิมออก เพื่อไม่ให้ดันเกิดหน้า 2 -->
                            <div
                                class="barcode-sticker-page"
                                v-for="n in parseInt(quantity)"
                            >
                                <img :src="barcode.img_url" />

                                <p
                                    v-if="printProductName"
                                    v-text="barcode.product_name"
                                    class="mt-2 text-center dark:text-white"
                                >
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </script>

        <script type="module">
            app.component('v-print-barcode', {
                template: '#v-print-barcode-template',

                data() {
                    return {
                        barcode: @json($barcode),

                        printProductName: @json(core()->getConfigData('pos.settings.barcode.print_product_name')),

                        quantity: 1,
                    }
                },

                mounted() {
                    document.getElementById('print-barcode').addEventListener('click', () => {
                        window.print();
                    });
                },

                computed: {
                    isValidBarcode() {
                        if (
                            this.barcode.length > 0
                            && this.barcode[0].img_url
                            && this.quantity > 0
                            && this.quantity <= 100
                        ) {
                            return true;
                        }
                    },
                },

                methods: {
                    submitForm() {
                        if (this.isValidBarcode) {
                            window.print();
                        }
                    }
                }
            });
        </script>
    @endPushOnce
</x-admin::layouts>

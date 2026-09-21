<template>
    <header class="sticky top-0 z-[10001] shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.1)_inset] bg-white dark:bg-gray-900 dark:shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.1)_inset]">
        <!-- Desktop View -->
        <section class="hidden items-center justify-between p-2.5 xl:flex">
            <div class="flex items-center gap-1.5">
                <!-- Heading -->
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {{ $t('pos.layout.header.title') }}
                </h1>

                <div
                    v-if="$route.path.split('/')[1] == 'home'"
                    class="ml-10 flex items-center gap-x-2"
                >
                    <!-- Search Bar -->
                    <div class="relative flex w-[486px] max-w-[486px] items-center max-lg:w-[400px] ltr:ml-2.5 rtl:mr-2.5 text-gray-900 dark:text-gray-100">
                        <input
                            type="text"
                            class="h-12 w-full rounded-md px-3.5 py-3 text-base font-normal leading-5 bg-gray-100 text-gray-900 placeholder-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                            :placeholder="$t('pos.layout.header.search_products')"
                            @input="searchProduct"
                        >

                        <i
                            class="icon-search absolute top-3 flex items-center text-2xl ltr:right-2 rtl:left-2 text-gray-900 dark:text-gray-100"
                        ></i>
                    </div>

                    <!-- Barcode Scanner -->
                    <div
                        v-if="showBarcodeScanner"
                        class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                        @click="$refs.barcodeModal.open()"
                    >
                        <i class="icon-barcode text-2xl text-gray-900 dark:text-gray-100"></i>
                    </div>

                    <!-- Product List -->
                    <div
                        class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                        @click="$refs.productCreateModal.open()"
                    >
                        <i class="icon-box text-2xl text-gray-900 dark:text-gray-100"></i>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-x-2">
                <!-- Sync Tab -->
                <div
                    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    @click="startSyncing()"
                >
                    <i class="icon-sync text-2xl text-gray-900 dark:text-gray-100" :class="{'animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]': isSyncing}"></i>
                </div>

                <!-- Toggle full screen -->
                <div
                    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    @click="toggleFullScreen()"
                >
                    <i class="icon-fullscreen text-2xl text-gray-900 dark:text-gray-100"></i>
                </div>

                <!-- Toggle dark mode -->
                <div
                    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700"
                    @click="toggleDarkMode()"
                >
                    <span class="text-2xl icon-dark-mode text-gray-900 dark:icon-light-mode dark:text-gray-100">
                    </span>
                </div>

                <!-- Network -->
                <div class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-700">
                    <i
                        :class="[isOnline ? 'text-green-600' : 'text-red-500']"
                        class="icon-network text-2xl"
                    >
                    </i>
                </div>

                <router-link
                    to="/orders/hold"
                    class="transparent-button"
                >
                    <i class="icon-hold-cart text-2xl text-gray-900 dark:text-gray-100"></i>

                    <span class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                        {{ $t('pos.layout.header.hold_orders') }}
                    </span>
                </router-link>
            </div>
        </section>

        <!-- Mobile View -->
        <section
            v-if="$route.path.split('/')[1] != 'payment'"
            class="flex items-center gap-2.5 p-2 xl:hidden"
        >
            <div
                class="flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900"
                @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
                <span class="icon-menu text-2xl text-gray-900 dark:text-gray-100"></span>
            </div>

            <template v-if="$route.path.split('/')[1] == 'home'">
                <!-- Search Bar -->
                <div class="relative flex w-full items-center text-gray-900 dark:text-gray-100">
                    <input
                        type="text"
                        class="h-12 w-full rounded-md px-3.5 py-3 text-base font-normal leading-5 bg-gray-100 text-gray-800 placeholder-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
                        :placeholder="$t('pos.layout.header.search_products')"
                        @input="searchProduct"
                    >

                    <i class="icon-search absolute top-3 flex items-center text-2xl ltr:right-2 rtl:left-2 text-gray-900 dark:text-gray-100"
                    ></i>
                </div>

                <!-- Barcode Scanner -->
                <div
                    v-if="showBarcodeScanner"
                    class="flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900"
                    @click="$refs.barcodeModal.open()"
                >
                    <i class="icon-barcode text-2xl text-gray-900 dark:text-gray-100"></i>
                </div>

                <!-- Product List -->
                <div
                    class="flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900"
                    @click="$refs.productCreateModal.open()"
                >
                    <i class="icon-box text-2xl text-gray-900 dark:text-gray-100"></i>
                </div>
            </template>

            <template v-else>
                <p class="text-xl font-medium leading-6 text-gray-900 dark:text-gray-100">
                    {{ $t(`pos.layout.sidebar.${$route.path.split('/')[1]}`) }}
                </p>
            </template>
        </section>

        <Teleport to="body">
            <transition
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 transform -translate-x-full"
                enter-to-class="opacity-100 transform translate-x-0"
                leave-active-class="transition ease-in duration-300"
                leave-from-class="opacity-100 transform translate-x-0"
                leave-to-class="opacity-0 transform -translate-x-full"
            >
                <div
                    class="fixed bottom-0 left-0 right-0 top-0 z-[10002] w-full bg-white dark:bg-gray-900"
                    v-if="isMobileMenuOpen"
                >
                    <div class="flex h-full flex-col justify-between bg-zinc-50 dark:bg-gray-900">
                        <div class="flex flex-col gap-y-1">
                            <div class="flex h-16 justify-between gap-2 px-4 py-5">
                                <!-- Heading -->
                                <h1 class="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                                    {{ $t('pos.layout.header.title') }}
                                </h1>

                                <div class="flex items-center gap-x-6">
                                    <!-- Setting Page -> Sync Tab -->
                                    <router-link
                                        to="/settings/sync"
                                        @click="isMobileMenuOpen = !isMobileMenuOpen"
                                        class="flex cursor-pointer items-center justify-center text-gray-900 dark:text-gray-100"
                                    >
                                        <i class="icon-sync text-2xl text-gray-900 dark:text-gray-100"></i>
                                    </router-link>

                                    <!-- Toggle dark mode -->
                                    <div
                                        class="flex cursor-pointer items-center justify-center text-gray-900 dark:text-gray-100"
                                        @click="toggleDarkMode()"
                                    >
                                        <span
                                            class="text-2xl icon-dark-mode dark:icon-light-mode"
                                        >
                                        </span>
                                    </div>

                                    <!-- Network -->
                                    <div class="flex cursor-pointer items-center justify-center">
                                        <i
                                            :class="[isOnline ? 'text-green-600' : 'text-red-500']"
                                            class="icon-network text-2xl"
                                        >
                                        </i>
                                    </div>

                                    <!-- Close -->
                                    <div
                                        class="flex cursor-pointer items-center justify-center text-gray-900 dark:text-gray-100"
                                        @click="isMobileMenuOpen = !isMobileMenuOpen"
                                    >
                                        <span class="icon-cross rounded-full border-2 border-gray-900 dark:border-gray-100 text-lg leading-6"></span>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-2.5 p-4 lg:grid-cols-4">
                                <router-link
                                    v-for="(menuItem, index) in menuItems"
                                    :key="index"
                                    :to="menuItem.path"
                                    :class="[
                                        'grid aspect-square cursor-pointer place-items-center content-center rounded-lg',
                                        $route.path.split('/')[1] === menuItem.name
                                            ? 'text-slate-600 border-2 border-slate-600 bg-gray-100 dark:text-white dark:border-white dark:bg-gray-900'
                                            : 'text-neutral-400 dark:text-neutral-500',
                                        'hover:text-slate-600 dark:hover:text-white'
                                    ]"
                                    @click="isMobileMenuOpen = !isMobileMenuOpen"
                                >
                                    <i
                                        class="icon text-2xl"
                                        :class="menuItem.icon"
                                    ></i>

                                    <span class="text-center text-[12px] font-medium leading-4">
                                        {{ $t(`pos.layout.sidebar.${menuItem.name}`) }}
                                    </span>
                                </router-link>
                            </div>
                        </div>

                        <div class="flex justify-between gap-2.5 border-t bg-white dark:bg-gray-900 px-4">
                            <div class="flex items-center justify-center gap-2.5">
                                <template v-if="agent?.imageUrl">
                                    <img
                                        :src="agent.imageUrl"
                                        class="h-10 w-10 cursor-pointer rounded-full"
                                        alt="profile image"
                                    >
                                </template>

                                <template v-else>
                                    <img
                                        src="@images/user-placeholder.png"
                                        class="h-10 w-10 cursor-pointer rounded-full"
                                        alt="profile image"
                                    >
                                </template>

                                <div class="flex flex-col gap-1">
                                    <span class="text-base font-semibold leading-5 text-gray-900 dark:text-gray-100">
                                        {{ `${agent?.firstName} ${agent?.lastName}` }}
                                    </span>

                                    <span class="text-[12px] font-medium leading-4 text-gray-600 dark:text-gray-400">
                                        {{ agent?.email }}
                                    </span>
                                </div>
                            </div>

                            <div
                                class="grid h-20 w-20 cursor-pointer place-items-center content-center rounded-lg text-neutral-400 hover:text-slate-600 dark:hover:text-slate-300"
                                @click="logout()"
                            >
                                <i class="icon icon-logout text-2xl"></i>

                                <span class="text-[12px] font-medium leading-4">
                                    {{ $t('pos.layout.sidebar.logout') }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>

            <Modal ref="barcodeModal">
                <template v-slot:header>
                    <Label for="email" class="required">
                        {{ $t('pos.layout.header.barcode_form.title') }}
                    </Label>
                </template>

                <template v-slot:content="{ toggle }">
                    <v-form
                        class="grid gap-4"
                        @submit="submitBarcodeForm"
                    >
                        <ControlGroup>
                            <Field
                                :type="'text'"
                                :name="'barcode'"
                                :id="'barcode'"
                                :rules="'required'"
                                :placeholder="$t('pos.layout.header.barcode_form.barcode_placeholder')"
                            />

                            <Error :name="'barcode'" />
                        </ControlGroup>

                        <div class="flex justify-end gap-6">
                            <button
                                type="button"
                                class="transparent-button w-36"
                                @click="toggle"
                            >
                                {{ $t('pos.layout.header.barcode_form.cancel_btn_title') }}
                            </button>

                            <button
                                type="submit"
                                class="primary-button w-36"
                            >
                                {{ $t('pos.layout.header.barcode_form.proceed_btn_title') }}
                            </button>
                        </div>
                    </v-form>
                </template>
            </Modal>

            <Modal ref="productCreateModal">
                <template v-slot:header>
                    {{ $t('pos.layout.header.product_create_form.title') }}
                </template>

                <template v-slot:content="{ toggle }">
                    <v-form v-slot="{ handleSubmit }">
                        <form
                            class="flex flex-col justify-start gap-4"
                            @submit="handleSubmit($event, submitProductForm)"
                        >
                            <ControlGroup>
                                <Label for="name" class="required">
                                    {{ $t('pos.layout.header.product_create_form.name') }}
                                </Label>

                                <Field
                                    :type="'text'"
                                    :name="'name'"
                                    :id="'name'"
                                    :rules="'required'"
                                    :placeholder="$t('pos.layout.header.product_create_form.name')"
                                />

                                <Error :name="'name'" />
                            </ControlGroup>

                            <div :class="[showProductSkuField ? 'flex max-sm:flex-col max-sm:gap-4 gap-2.5' : '']">
                                <ControlGroup
                                    v-if="showProductSkuField"
                                    className="flex-1"
                                >
                                    <Label for="sku" class="required">
                                        {{ $t('pos.layout.header.product_create_form.sku') }}
                                    </Label>

                                    <Field
                                        :type="'text'"
                                        :name="'sku'"
                                        :id="'sku'"
                                        :rules="'required'"
                                        :placeholder="$t('pos.layout.header.product_create_form.sku')"
                                    />

                                    <Error :name="'sku'" />
                                </ControlGroup>

                                <ControlGroup className="flex-1">
                                    <Label for="price" class="required">
                                        {{ $t('pos.layout.header.product_create_form.price') }}
                                    </Label>

                                    <Field
                                        :type="'text'"
                                        :name="'price'"
                                        :id="'price'"
                                        :rules="'required|decimal:2|min_value:0'"
                                        :placeholder="$t('pos.layout.header.product_create_form.price')"
                                    />

                                    <Error :name="'price'" />
                                </ControlGroup>
                            </div>

                            <div class="flex gap-2.5 max-sm:flex-col max-sm:gap-4">
                                <ControlGroup className="flex-1">
                                    <Label for="quantity" class="required">
                                        {{ $t('pos.layout.header.product_create_form.quantity') }}
                                    </Label>

                                    <Field
                                        :type="'text'"
                                        :name="'quantity'"
                                        :id="'quantity'"
                                        :rules="'required|integer|min_value:0'"
                                        :placeholder="$t('pos.layout.header.product_create_form.quantity')"
                                    />

                                    <Error :name="'quantity'" />
                                </ControlGroup>

                                <ControlGroup className="flex-1">
                                    <Label for="weight" class="required">
                                        {{ $t('pos.layout.header.product_create_form.weight') }}
                                    </Label>

                                    <Field
                                        :type="'text'"
                                        :name="'weight'"
                                        :id="'weight'"
                                        :rules="'required|decimal:2|min_value:0'"
                                        :placeholder="$t('pos.layout.header.product_create_form.weight')"
                                    />

                                    <Error :name="'weight'" />
                                </ControlGroup>
                            </div>

                            <div class="flex justify-end gap-6 max-sm:justify-between">
                                <button
                                    type="button"
                                    class="transparent-button w-36 max-sm:w-full"
                                    @click="toggle"
                                >
                                    {{ $t('pos.layout.header.product_create_form.cancel_btn_title') }}
                                </button>

                                <Button
                                    type="submit"
                                    class="primary-button w-36 max-sm:w-full"
                                    :label="$t('pos.layout.header.product_create_form.proceed_btn_title')"
                                    :isLoading="isCreatingProduct"
                                />
                            </div>
                        </form>
                    </v-form>
                </template>
            </Modal>
        </Teleport>
    </header>
</template>

<script setup>
    import { inject, ref, onMounted, onBeforeUnmount, watchEffect, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';
    import { useOutlet } from '@src/composable/outlet';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import { useMutation } from '@vue/apollo-composable';
    import { CREATE_PRODUCT } from '@src/graphql/products';
    import { LOGOUT } from '@src/graphql/session';
    import { useCookies } from '@src/composable/cookies';
    import { useWindowWidth } from '@src/composable/window';

    /**
     * General Imports
     */
    const { t } = useI18n();
    const DB = useIndexedDB();
    const emitter = inject('emitter');
    const isOnline = inject('isOnline');
    const cookies = useCookies();
    const { getMenuItems } = useOutlet();
    const { isMobileOrTab } = useWindowWidth();
    const isSyncing = ref(false);

    /**
     * Mobile Menu
     */
    const menuItems = getMenuItems();
    const isMobileMenuOpen = ref(false);

watch(isMobileOrTab, (value) => {
        if (!value) {
            // Desktop aate hi menu band ho jaye
            isMobileMenuOpen.value = false;
        }
    });

    onMounted(() => {
        emitter?.on('sync_entities_started', handleSyncEntitiesStartRequest);

        emitter?.on('sync_entities_ended', handleSyncEntitiesEndRequest);
    });

    /**
     * Sync Entities Handlers on Events
     */
    const handleSyncEntitiesStartRequest = async () => {
        isSyncing.value = true;
    };

    /**
     * Sync Entities Handlers off Events
     */
    const handleSyncEntitiesEndRequest = async () => {
        isSyncing.value = false;
    };

    /**
     * Start Syncing
     */
    const startSyncing = () => {
        emitter.emit('sync_entities_start');

        router.push({ path: '/settings/sync' });
    };

    /**
     * Search Products
     */
    const searchProduct = (e) => {
        let searchTerm = e.target.value;

        emitter.emit('search_product', searchTerm);
    };

    /**
     * Product Form
     */
    const productCreateModal = ref(null);

    const { mutate: createProduct, loading: isCreatingProduct } = useMutation(CREATE_PRODUCT);

    const submitProductForm = (params, { setErrors, resetForm }) => {
        if (! isOnline.value) {
            emitter.emit('add_flash', {
                type: 'error',
                message: t('pos.common.flash_messages.offline_error'),
            });

            productCreateModal.value.toggle();

            return;
        }

        createProduct({ input: {
            name: params.name,
            sku: params.sku || '',
            price: parseFloat(params.price),
            quantity: parseInt(params.quantity),
            weight: parseFloat(params.weight),
        } }).then(async (response) => {
            const { createOutletProduct } = response?.data;

            if (createOutletProduct?.success) {
                emitter.emit('add_flash', {
                    type: 'success',
                    message: createOutletProduct?.message,
                });

                resetForm();

                productCreateModal.value.toggle();

                await DB.addItem('products', createOutletProduct.product);

                emitter.emit('new_product', createOutletProduct.product);

                emitter.emit('add_to_cart', {
                    productId: createOutletProduct.product.id,
                    quantity: 1,
                });
            } else {
                if (createOutletProduct?.errors) {
                    setErrors(JSON.parse(createOutletProduct.errors));
                }
            }
        });
    };

    /**
     * Show Barcode Scanner
     */
    const showBarcodeScanner = ref(false);
    const showProductSkuField = ref(false);

    onMounted(() => {
        DB.getItem('configurations', 1).then(data => {
            showBarcodeScanner.value = data.configurations?.find(config => config.code == 'pos.settings.barcode.hide')?.value == '1' ? false : true;

            showProductSkuField.value = data.configurations?.find(config => config.code == 'pos.settings.product.allow_sku')?.value == '1' ? true : false;
        });
    });

    /**
     * Barcode Form
     */
    const barcodeModal = ref(null);

    const submitBarcodeForm = (e) => {
        let barcode = e.barcode;
        const prefix = getBarcodePrefix();

        if (
            prefix
            && ! barcode.startsWith(prefix)
        ) {
            barcode = prefix + barcode;
        }

        emitter.emit('search_barcode', barcode);

        barcodeModal.value.toggle();
    };

    /**
     * Get Agent Profile
     */
    const agent = ref({});

    watchEffect(async () => {
        agent.value = await DB.getAgent();
    });

    /**
     * Logout
     */
    const { mutate:agentLogout } = useMutation(LOGOUT);

    const router = useRouter();

    const logout = async () => {
        try {
            const data = await agentLogout();

            if (data?.data?.agentLogout?.success) {
                localStorage.removeItem('accessToken');

                router.push({path: '/'});
            }
        } catch (err) {}
    };

    /**
     * If mobile menu is open, disable body scroll
     */
    watch(isMobileMenuOpen, (value) => {
        if (value) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    /**
     * Get Configurations
     */
    const getBarcodePrefix = () => {
        DB.getItem('configurations', 1).then(data => {
            return data.configurations?.find(config => config.code == 'pos.settings.barcode.prefix')?.value;
        });
    };

    /**
     * Full Screen
     */
    const toggleFullScreen = () => {
        if (! document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    /**
     * Dark Mode
     */
    const isDarkMode = ref(cookies.get('dark-mode'));

    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;

        if (isDarkMode.value) {
            document.documentElement.classList.add('dark');

            cookies.set('dark-mode', true);
        } else {
            document.documentElement.classList.remove('dark');

            cookies.set('dark-mode', false);
        }
    };

    /**
     * Keyboard Shortcuts
     */
    onMounted(() => {
        emitter.on('toggle_dark_mode', toggleDarkMode);

        emitter.on('open_barcode_model', () => {
            barcodeModal.value.toggle();
        });

        emitter.on('open_product_create_model', () => {
            productCreateModal.value.toggle();
        });
    });

    onBeforeUnmount(() => {
        emitter.off('toggle_dark_mode');

        emitter.off('open_barcode_model');

        emitter.off('open_product_create_model');
    });
</script>

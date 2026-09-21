<template>
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto mt-12 grid w-full max-w-[370px] justify-center gap-10 px-4 sm:px-0">
            <div class="grid justify-items-center gap-2.5">
                <div class="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white dark:bg-slate-800">
                    <template v-if="getConfigData('pos_logo')">
                        <img
                            :src="getConfigData('pos_logo')"
                            alt="POS Logo"
                            width="34"
                            height="46"
                        />
                    </template>

                    <template v-else>
                        <img
                            src="@images/logo.png"
                            alt="POS Logo"
                            width="34"
                            height="46"
                        />
                    </template>
                </div>

                <h1 class="max-w-full truncate text-3xl font-semibold text-gray-900 dark:text-white">
                    {{ getConfigData('heading_on_login') ?? $t('pos.title') }}
                </h1>
            </div>

            <v-form v-slot="{ handleSubmit }">
                <form
                    class="grid gap-6 rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-9"
                    @submit="handleSubmit($event, submitForm)"
                >
                    <h2 class="truncate text-2xl font-semibold leading-7 text-gray-900 dark:text-white">
                        {{ getConfigData('sub_heading_on_login') ?? $t('pos.login_form.title') }}
                    </h2>

                    <ControlGroup>
                        <Label for="username">
                            {{ $t('pos.login_form.user_name') }}
                        </Label>

                        <Field
                            :type="'text'"
                            :name="'username'"
                            :id="'username'"
                            :rules="'required'"
                            :placeholder="$t('pos.login_form.user_name_placeholder')"
                        />

                        <Error :name="'username'" />
                    </ControlGroup>

                    <ControlGroup>
                        <Label for="password">
                            {{ $t('pos.login_form.password') }}
                        </Label>

                        <div class="relative">
                            <Field
                                :type="showPassword ? 'text' : 'password'"
                                :name="'password'"
                                :id="'password'"
                                :rules="'required'"
                                :placeholder="$t('pos.login_form.password_placeholder')"
                            />

                            <span
                                :class="showPassword ? 'icon-eye-off' : 'icon-eye'"
                                class="absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer text-2xl leading-6 opacity-60 dark:text-white"
                                @click="showPassword = !showPassword"
                            >
                            </span>
                        </div>

                        <Error :name="'password'" />
                    </ControlGroup>

                    <Field
                        :type="'checkbox'"
                        :name="'remember'"
                        :id="'remember'"
                        :label="$t('pos.login_form.remember_password')"
                    />

                    <Button
                        type="submit"
                        class="primary-button"
                        :label="$t('pos.login_form.login_btn_title')"
                        :isLoading="isSubmittingForm"
                    />
                </form>
            </v-form>
        </div>

        <footer class="mx-4 sm:mx-10 md:mx-20 lg:mx-32">
            <div class="mb-5 mt-10 flex flex-col gap-3.5 text-center">
                <p
                    class="text-sm font-normal leading-4 text-gray-900 dark:text-gray-400"
                    v-html="getConfigData('footer_content') ?? $t('pos.footer.warning')"
                >
                </p>

                <p class="text-sm font-normal leading-4 text-gray-900 dark:text-gray-400">
                    {{ getConfigData('footer_note') ?? $t('pos.footer.copyright') }}
                </p>
            </div>
        </footer>

        <FlashMessage />

        <Loader />
    </div>
</template>

<script setup>
    import { ref, onMounted, watch, inject } from 'vue';
    import { useCookies } from '@src/composable/cookies';
    import { useApolloClient, useQuery, useMutation } from '@vue/apollo-composable';
    import { FETCH_GLOBAL_DATA } from '@src/graphql/global';
    import { LOGIN } from '@src/graphql/session';
    import { useRouter } from 'vue-router';
    import { useIndexedDB } from '@src/composable/indexed-db';
    import FlashMessage from '@components/shared/FlashMessage.vue';
    import Loader from '@components/shared/Loader.vue';

    /**
     * General Variables
     */
    const router = useRouter();
    const DB = useIndexedDB();
    const emitter = inject('emitter');
    const cookies = useCookies();
    const { client } = useApolloClient();

    /**
     * Local State
     */
    const showPassword = ref(false);

    /**
     * Fetch Global Data
     */
    const configurations = ref([]);

    const { result } = useQuery(FETCH_GLOBAL_DATA);

    watch(() => result?.value?.fetchGlobalData, (data) => {
        if (data) {
            configurations.value = data.configurations;

            DB.updateItem('categories', {
                id: 1,
                categories: data.categories,
            });

            DB.updateItem('configurations', {
                id: 1,
                configurations: data.configurations,
            });

            DB.updateItem('locales_currencies', {
                id: 1,
                currencies: data.currencies,
                locales: data.locales,
            });

            DB.updateItem('exchange_rates', {
                id: 1,
                exchangeRates: data.exchangeRates,
            });

            DB.updateItem('tax_categories', {
                id: 1,
                taxCategories: data.taxCategories,
            });

            DB.updateItem('countries_states', {
                id: 1,
                countries: data.countries,
                countryStates: data.countryStates,
            });

            cookies.set('default_country', data.defaultCountry);

            if (! cookies.get('locale')) {
                cookies.set('locale', JSON.stringify(data.locales.find(locale => locale.code === data.defaultLocale)));
            }

            if (! cookies.get('currency')) {
                cookies.set('currency', JSON.stringify(data.currencies.find(currency => currency.code === data.baseCurrency)));
            }
        }
    });

    const { mutate: login, loading: isSubmittingForm } = useMutation(LOGIN);

    const submitForm = (params, { setErrors, resetForm }) => {
        login({
            input: {
                username: params.username,
                password: params.password,
                remember: Boolean(params.remember),
            },
        }).then(async(response) => {
            const agentLogin = response?.data?.agentLogin;

            if (agentLogin?.success === true) {
                localStorage.setItem('accessToken', agentLogin.accessToken);

                localStorage.setItem('loginMessage', agentLogin.message);

                await client.clearStore();

                await clearOfflineRecords(await DB.getAgent(), agentLogin.agent);

                await DB.deleteAllItems('agent');

                await DB.addItem('agent', agentLogin.agent);

                router.push({ path: '/settings/sync' });
            } else if (agentLogin.success === false) {
                if (agentLogin.errors) {
                    setErrors(JSON.parse(agentLogin.errors));
                } else {
                    emitter.emit('add_flash', {
                        type: 'error',
                        message: agentLogin.message,
                    });
                }
            }
        });
    };

    /**
     * Clear offline Records
     */
    const clearOfflineRecords = async (prevAgent, currentAgent) => {
        if (
            prevAgent
            && prevAgent.outletId !== currentAgent.outletId
        ) {
            [
                'products',
                'customers',
                'cart_customer',
                'cart',
                'orders',
            ].forEach(async (tableName) => await DB.deleteAllItems(tableName));
        }
    };

    /**
     * Get Configurations
     */
    const getConfigData = (code) => {
        return configurations.value.find(config => config.code === `pos.settings.general.${code}`)?.value;
    };

    onMounted(() => {
        const message = localStorage.getItem('forceLogoutMessage');

        if (message) {
            emitter?.emit('add_flash', {
                type: 'error',
                message: message
            });

            localStorage.removeItem('forceLogoutMessage');
        }
    });
</script>

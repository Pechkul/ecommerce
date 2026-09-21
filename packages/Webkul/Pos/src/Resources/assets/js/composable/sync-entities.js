import { reactive, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApolloClient } from '@vue/apollo-composable';
import { PRODUCTS } from '@src/graphql/home';
import { CUSTOMERS } from '@src/graphql/customers';
import { ORDERS } from '@src/graphql/orders';
import { useRouter } from 'vue-router';
import { useIndexedDB } from '@src/composable/indexed-db';

export const useSyncEntities = () => {
    const { t } = useI18n();
    const apolloClient = useApolloClient();
    const DB = useIndexedDB();
    const router = useRouter();
    const emitter = inject('emitter');
    const isOnline = inject('isOnline');

    const entitySelections = reactive({
        products: true,
        customers: true,
        orders: true
    });

    const syncEntities = reactive({
        products: {
            gqlQuery: PRODUCTS,
            syncedData: [],
            syncProgress: 0,
            dataKey: 'getOutletProducts',
            storageKey: 'products',
            icon: 'icon-products',
            isActive: false,
            totalRecords: 0,
            syncedCount: 0,
            batchSize: 20,
        },
        customers: {
            gqlQuery: CUSTOMERS,
            syncedData: [],
            syncProgress: 0,
            dataKey: 'getCustomers',
            storageKey: 'customers',
            icon: 'icon-customers',
            isActive: false,
            totalRecords: 0,
            syncedCount: 0,
            batchSize: 20,
        },
        orders: {
            gqlQuery: ORDERS,
            syncedData: [],
            syncProgress: 0,
            dataKey: 'getOrders',
            storageKey: 'orders',
            icon: 'icon-orders',
            isActive: false,
            totalRecords: 0,
            syncedCount: 0,
            batchSize: 20,
        }
    });

    const fetchEntityData = async (entityName) => {
        const entity = syncEntities[entityName];
        let currentPage = 1;
        let hasMorePages = true;
        
        entity.isActive = true;
        entity.syncProgress = 0;
        entity.syncedData = [];
        entity.syncedCount = 0;
        entity.totalRecords = 0;

        try {
            while (hasMorePages) {
                const { data } = await apolloClient.client.query({
                    query: entity.gqlQuery,
                    variables: {
                        page: currentPage,
                        first: entity.batchSize
                    },
                });

                const entityData = data[entity.dataKey];
                
                if (! entityData) {
                    break;
                }

                const items = entityData.data || [];
                const paginatorInfo = entityData.paginatorInfo || {};
                const total = paginatorInfo.total || 0;
                const lastPage = paginatorInfo.lastPage || 1;

                if (currentPage === 1) {
                    entity.totalRecords = total;
                }

                const processingPromises = items.map(async (item) => {
                    const existingIndex = entity.syncedData.findIndex(existing => existing.id === item.id);
                    
                    if (existingIndex === -1) {
                        entity.syncedData.push(item);
                        entity.syncedCount++;
                        
                        try {
                            await DB.updateItem(entity.storageKey, item);
                        } catch (dbError) {
                            console.warn(`Failed to store ${entityName} item ${item.id}:`, dbError);
                        }
                    }
                });

                await Promise.allSettled(processingPromises);

                if (entity.totalRecords > 0) {
                    entity.syncProgress = Math.min(
                        Math.round((entity.syncedCount / entity.totalRecords) * 100),
                        100
                    );
                } else {
                    entity.syncProgress = 100;
                }

                hasMorePages = currentPage < lastPage;
                currentPage++;

                if (hasMorePages) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            entity.syncProgress = 100;
        } catch (error) {
            if (error?.networkError?.result?.force_logout) {
                return;
            }

            console.error(`Error syncing ${entityName}:`, error);
        } finally {
            entity.isActive = false;
        }
    };

    const initiateSyncProcess = async () => {
        if (! isOnline?.value) {
            emitter?.emit('add_flash', {
                type: 'warning',
                message: t('pos.common.flash_messages.offline_error'),
            });

            return;
        }

        emitter?.emit('sync_entities_started');

        const selectedEntityNames = Object.keys(entitySelections)
            .filter(entityName => entitySelections[entityName]);

        if (selectedEntityNames.length === 0) {
            return;
        }

        await Promise.all(selectedEntityNames.map(async (entityName) => {
            const entity = syncEntities[entityName];

            entity.syncProgress = 0;
            entity.syncedData = [];
            entity.syncedCount = 0;
            entity.totalRecords = 0;

            await DB.deleteAllItems(entity.storageKey);
        }));

        const concurrencyLimit = 2;
        const executingPromises = [];

        for (let i = 0; i < selectedEntityNames.length; i += concurrencyLimit) {
            const batch = selectedEntityNames.slice(i, i + concurrencyLimit);
            const batchPromises = batch.map(entityName => fetchEntityData(entityName));
            
            executingPromises.push(...batchPromises);
            
            await Promise.allSettled(batchPromises);
        }

        await Promise.allSettled(executingPromises);
        
        emitter?.emit('sync_entities_ended');
    
        setTimeout(() => {
            router.push({ path: '/home' });
        }, 2000);
    };

    return {
        entitySelections,
        syncEntities,
        initiateSyncProcess,
    };
};

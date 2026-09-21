import { inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIndexedDB } from '@src/composable/indexed-db';
import { useMutation } from '@vue/apollo-composable';
import { SYNC_ORDER, RETURN_ORDER } from '@src/graphql/orders';

/**
 * Shared helpers to sync offline orders.
 */
export const useOfflineSync = () => {
    const DB = useIndexedDB();
    const emitter = inject('emitter');
    const isOnline = inject('isOnline');
    const { t } = useI18n();
    const { mutate } = useMutation(SYNC_ORDER);
    const { mutate: returnMutate } = useMutation(RETURN_ORDER);

    const syncSingleOrder = async (offlineOrder, { onSynced } = {}) => {
        if (!isOnline?.value) {
            emitter?.emit('add_flash', {
                type: 'warning',
                message: t('pos.common.flash_messages.offline_error'),
            });

            return false;
        }

        if (!localStorage.getItem('accessToken')) {

            return false;
        }

        try {
            const payload = {
                ...offlineOrder.input,
            };

            const response = await mutate({ input: payload });

            const { syncOrder } = response.data;

            if (!syncOrder?.success) {

                return;
            }

            if (offlineOrder?.isReturned) {
                const returnInput = {
                    orderId: parseInt(syncOrder.outletOrder.order.id),
                    items: syncOrder.outletOrder.order.items.map(item => {
                        return {
                            itemId: parseInt(item.id),
                            qty: parseInt(item.qtyInvoiced) - parseInt(item.qtyRefunded),
                        };
                    }),
                };

                const returnResponse = await returnMutate({ input: returnInput });

                if (returnResponse?.data?.returnOrder?.outletOrder) {
                    syncOrder.outletOrder = returnResponse.data.returnOrder.outletOrder;
                }
            }

            await DB.deleteItem('offline_orders', offlineOrder.id);
            await DB.updateItem('orders', syncOrder.outletOrder);

            if (onSynced) {
                await onSynced(syncOrder.outletOrder);
            }

            return true;
        } catch (error) {
            emitter?.emit('add_flash', {
                type: 'error',
                message: t('pos.common.flash_messages.error_message'),
            });

            return false;
        }
    };

    const syncAllOrders = async ({ onOrderSynced } = {}) => {
        const offlineOrders = await DB.getAllItems('offline_orders');

        for (const offlineOrder of offlineOrders) {
            await syncSingleOrder(offlineOrder, {
                onSynced: onOrderSynced,
            });
        }
    };

    return {
        syncSingleOrder,
        syncAllOrders,
    };
};

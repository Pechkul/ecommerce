import { inject, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIndexedDB } from '@src/composable/indexed-db';
import CartManager from '@src/helpers/Cart';

const parseInteger = (value, fallback = null) => {
    const parsedValue = parseInt(value, 10);

    return Number.isNaN(parsedValue)
        ? fallback
        : parsedValue;
};

const normalizeId = (value) => {
    if (
        value === null
        || value === undefined
        || value === ''
    ) {
        return null;
    }

    return String(value);
};

const normalizeEmail = (value) => {
    if (! value) {
        return null;
    }

    return String(value).trim().toLowerCase();
};

const parseAdditional = (additional) => {
    if (
        ! additional
        || typeof additional !== 'object'
    ) {
        if (typeof additional === 'string') {
            try {
                return JSON.parse(additional);
            } catch {
                return {};
            }
        }

        return {};
    }

    return additional;
};

const buildItemMeta = (item, product = null) => ({
    name: item?.name || product?.name || 'Product',
    sku: item?.sku || product?.sku || '-',
});

const getRequestedQuantity = (item, additional) => {
    return parseInteger(
        item?.qtyOrdered
        ?? item?.qty_ordered
        ?? item?.quantity
        ?? additional?.quantity,
        1
    ) || 1;
};

const getStockLimit = (value) => {
    if (
        value === null
        || value === undefined
        || value === ''
    ) {
        return null;
    }

    return parseInteger(value, 0);
};

const isProductActive = (product) => {
    if (! product) {
        return false;
    }

    if (! Object.prototype.hasOwnProperty.call(product, 'status')) {
        return true;
    }

    if (typeof product.status === 'boolean') {
        return product.status;
    }

    if (typeof product.status === 'number') {
        return product.status === 1;
    }

    const normalizedStatus = String(product.status).toLowerCase();

    return ['1', 'true', 'active'].includes(normalizedStatus);
};

const buildSkippedItem = (item, reason, product = null) => ({
    ...buildItemMeta(item, product),
    reason,
});

const getVariantProduct = (product, variantId) => {
    return product?.variants?.find(variant => normalizeId(variant.id) === normalizeId(variantId)) || null;
};

const normalizeSuperAttributes = (superAttributes) => {
    if (Array.isArray(superAttributes)) {
        return superAttributes
            .map(attribute => ({
                attributeId: parseInteger(attribute.attributeId ?? attribute.attribute_id, null),
                attributeOptionId: parseInteger(attribute.attributeOptionId ?? attribute.attribute_option_id, null),
            }))
            .filter(attribute => {
                return attribute.attributeId !== null && attribute.attributeOptionId !== null;
            });
    }

    if (
        superAttributes
        && typeof superAttributes === 'object'
    ) {
        return Object.entries(superAttributes).map(([attributeId, attributeOptionId]) => ({
            attributeId: parseInteger(attributeId, null),
            attributeOptionId: parseInteger(
                Array.isArray(attributeOptionId)
                    ? attributeOptionId[0]
                    : attributeOptionId,
                null
            ),
        })).filter(attribute => {
            return attribute.attributeId !== null && attribute.attributeOptionId !== null;
        });
    }

    return [];
};

const normalizeCustomizableOptions = (additional) => {
    const requestedOptions = additional?.customizableOptions || additional?.customizable_options;

    if (! requestedOptions) {
        return [];
    }

    if (Array.isArray(requestedOptions)) {
        return requestedOptions
            .map(option => ({
                id: parseInteger(option.id, null),
                value: option.value ?? option.values ?? null,
                file: option.file ?? null,
            }))
            .filter(option => option.id !== null && (option.value !== null || option.file));
    }

    if (typeof requestedOptions === 'object') {
        return Object.entries(requestedOptions).map(([id, value]) => ({
            id: parseInteger(id, null),
            value: Array.isArray(value)
                ? value
                : [value],
        })).filter(option => option.id !== null);
    }

    return [];
};

const normalizeBundleSelections = (product, additional) => {
    const requestedOptions = additional?.bundle_options || additional?.bundleOptions;
    const requestedQuantities = additional?.bundle_option_qty || additional?.bundleOptionQty || {};

    if (
        ! requestedOptions
        || typeof requestedOptions !== 'object'
    ) {
        return [];
    }

    return Object.entries(requestedOptions).map(([optionId, selectedIds]) => {
        const option = product?.options?.find(item => normalizeId(item.id) === normalizeId(optionId));
        const normalizedSelectedIds = (Array.isArray(selectedIds) ? selectedIds : [selectedIds])
            .map(value => parseInteger(value, null))
            .filter(value => value !== null);

        const quantity = parseInteger(
            Array.isArray(requestedQuantities[optionId])
                ? requestedQuantities[optionId][0]
                : requestedQuantities[optionId],
            null
        );

        return {
            option,
            optionId: parseInteger(optionId, null),
            selectedIds: normalizedSelectedIds,
            quantity,
        };
    }).filter(selection => selection.optionId !== null);
};

const normalizeBookingPayload = (booking) => {
    if (
        ! booking
        || typeof booking !== 'object'
    ) {
        return null;
    }

    const normalizedBooking = {};

    if (booking.date) {
        normalizedBooking.date = booking.date;
    }

    if (booking.dateFrom || booking.date_from) {
        normalizedBooking.dateFrom = booking.dateFrom || booking.date_from;
    }

    if (booking.dateTo || booking.date_to) {
        normalizedBooking.dateTo = booking.dateTo || booking.date_to;
    }

    if (booking.note) {
        normalizedBooking.note = booking.note;
    }

    if (booking.rentingType || booking.renting_type) {
        normalizedBooking.rentingType = booking.rentingType || booking.renting_type;
    }

    if (booking.slot) {
        if (typeof booking.slot === 'string') {
            const [from, to] = booking.slot.split('-').map(value => parseInteger(value, null));

            if (
                from !== null
                && to !== null
            ) {
                normalizedBooking.slot = { from, to };
            }
        } else if (typeof booking.slot === 'object') {
            const from = parseInteger(booking.slot.from, null);
            const to = parseInteger(booking.slot.to, null);

            if (
                from !== null
                && to !== null
            ) {
                normalizedBooking.slot = { from, to };
            }
        }
    }

    if (Array.isArray(booking.qty)) {
        normalizedBooking.qty = booking.qty
            .map(item => ({
                ticketId: parseInteger(item.ticketId ?? item.ticket_id, null),
                quantity: parseInteger(item.quantity, 0),
            }))
            .filter(item => item.ticketId !== null && item.quantity > 0);
    } else if (
        booking.qty
        && typeof booking.qty === 'object'
    ) {
        normalizedBooking.qty = Object.entries(booking.qty).map(([ticketId, quantity]) => ({
            ticketId: parseInteger(ticketId, null),
            quantity: parseInteger(Array.isArray(quantity) ? quantity[0] : quantity, 0),
        })).filter(item => item.ticketId !== null && item.quantity > 0);
    }

    return Object.keys(normalizedBooking).length
        ? normalizedBooking
        : null;
};

const reserveStock = (reservations, key, stockLimit, requestedQuantity) => {
    if (requestedQuantity <= 0) {
        return 0;
    }

    if (stockLimit === null) {
        return requestedQuantity;
    }

    const usedQuantity = reservations.get(key) || 0;
    const availableQuantity = Math.max(stockLimit - usedQuantity, 0);
    const allocatableQuantity = Math.min(requestedQuantity, availableQuantity);

    if (allocatableQuantity > 0) {
        reservations.set(key, usedQuantity + allocatableQuantity);
    }

    return allocatableQuantity;
};

export const useReorder = () => {
    const { t } = useI18n();
    const DB = useIndexedDB();
    const emitter = inject('emitter');

    const resolveOrderCustomer = async (order) => {
        const orderCustomerId = normalizeId(order?.customer?.id || order?.customerId || order?.customer_id);
        const orderCustomerEmail = normalizeEmail(order?.customerEmail || order?.customer?.email);
        const customers = await Promise.all([
            DB.getAllItems('customers'),
            DB.getAllItems('offline_customers'),
        ]).then(([onlineCustomers, offlineCustomers]) => {
            return [...onlineCustomers, ...offlineCustomers];
        });

        if (orderCustomerId) {
            const matchingById = customers.find(customer => normalizeId(customer?.id) === orderCustomerId);

            if (matchingById) {
                return matchingById;
            }
        }

        if (! orderCustomerEmail) {
            return null;
        }

        return customers.find(customer => normalizeEmail(customer?.email) === orderCustomerEmail) || null;
    };

    const prepareSimplePayload = (product, item, additional, reservations) => {
        const requestedQuantity = getRequestedQuantity(item, additional);
        const productQuantity = getStockLimit(product.quantity);
        const quantityToAdd = reserveStock(
            reservations,
            `${product.type}:${product.id}`,
            productQuantity,
            requestedQuantity
        );

        if (quantityToAdd <= 0) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.out_of_stock'), product),
            };
        }

        const payload = {
            productId: product.id,
            quantity: quantityToAdd,
        };

        const customizableOptions = normalizeCustomizableOptions(additional);

        if (customizableOptions.length) {
            payload.customizableOptions = customizableOptions;
        }

        return {
            payload,
            modified: quantityToAdd !== requestedQuantity,
            requestedQty: requestedQuantity,
            addedQty: quantityToAdd,
        };
    };

    const prepareConfigurablePayload = (product, item, additional, reservations) => {
        const requestedQuantity = getRequestedQuantity(item, additional);
        const selectedConfigurableOption = parseInteger(
            additional?.selected_configurable_option ?? additional?.selectedConfigurableOption,
            null
        );

        if (selectedConfigurableOption === null) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        const childProduct = getVariantProduct(product, selectedConfigurableOption);

        if (! childProduct) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.deleted'), product),
            };
        }

        if (! isProductActive(childProduct)) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.disabled'), product),
            };
        }

        const variantQuantity = getStockLimit(
            product?.variantConfigurations?.variant_quantities?.[selectedConfigurableOption]
            ?? childProduct.quantity
        );

        const quantityToAdd = reserveStock(
            reservations,
            `configurable:${product.id}:${selectedConfigurableOption}`,
            variantQuantity,
            requestedQuantity
        );

        if (quantityToAdd <= 0) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.out_of_stock'), product),
            };
        }

        const superAttribute = normalizeSuperAttributes(
            additional?.super_attribute ?? additional?.superAttribute
        );

        if (! superAttribute.length) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        return {
            payload: {
                productId: product.id,
                quantity: quantityToAdd,
                superAttribute,
                selectedConfigurableOption,
            },
            modified: quantityToAdd !== requestedQuantity,
            requestedQty: requestedQuantity,
            addedQty: quantityToAdd,
        };
    };

    const prepareDownloadablePayload = (product, item, additional) => {
        const links = Array.isArray(additional?.links)
            ? additional.links
            : Array.isArray(additional?.downloadable_links)
                ? additional.downloadable_links
                : [];

        const normalizedLinks = links
            .map(linkId => parseInteger(linkId, null))
            .filter(linkId => linkId !== null);

        if (! normalizedLinks.length) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_links'), product),
            };
        }

        const validLinks = normalizedLinks.filter(linkId => {
            return product?.downloadableLinks?.some(link => normalizeId(link.id) === normalizeId(linkId));
        });

        if (validLinks.length !== normalizedLinks.length) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_links'), product),
            };
        }

        return {
            payload: {
                productId: product.id,
                quantity: 1,
                links: validLinks,
            },
            modified: false,
            requestedQty: 1,
            addedQty: 1,
        };
    };

    const prepareGroupedPayload = async (product, item, additional, reservations) => {
        const qtyList = Array.isArray(additional?.qty)
            ? additional.qty
            : [];

        if (! qtyList.length) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        const normalizedQty = [];
        let wasModified = false;

        for (const qtyItem of qtyList) {
            const groupedProductId = parseInteger(qtyItem.productId ?? qtyItem.product_id, null);
            const requestedQuantity = parseInteger(qtyItem.quantity, 0);

            if (
                groupedProductId === null
                || requestedQuantity <= 0
            ) {
                continue;
            }

            const groupedProduct = await DB.getItem('products', groupedProductId);

            if (
                ! groupedProduct
                || ! isProductActive(groupedProduct)
            ) {
                continue;
            }

            const quantityToAdd = reserveStock(
                reservations,
                `simple:${groupedProduct.id}`,
                getStockLimit(groupedProduct.quantity),
                requestedQuantity
            );

            if (quantityToAdd <= 0) {
                continue;
            }

            if (quantityToAdd !== requestedQuantity) {
                wasModified = true;
            }

            normalizedQty.push({
                productId: groupedProduct.id,
                quantity: quantityToAdd,
            });
        }

        if (! normalizedQty.length) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.out_of_stock'), product),
            };
        }

        const requestedQty = qtyList.reduce((total, qtyItem) => {
            return total + (parseInteger(qtyItem.quantity, 0) || 0);
        }, 0);

        const addedQty = normalizedQty.reduce((total, qtyItem) => total + qtyItem.quantity, 0);

        return {
            payload: {
                productId: product.id,
                quantity: 1,
                qty: normalizedQty,
            },
            modified: wasModified,
            requestedQty,
            addedQty,
        };
    };

    const prepareBundlePayload = (product, item, additional, reservations) => {
        const bundleSelections = normalizeBundleSelections(product, additional);

        if (! bundleSelections.length) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        const bundleOptions = [];
        let wasModified = false;
        let requestedQty = 1;
        let addedQty = 1;

        for (const selection of bundleSelections) {
            const option = selection.option;

            if (
                ! option
                || ! selection.selectedIds.length
            ) {
                return {
                    skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
                };
            }

            const requestedOptionQty = selection.quantity || option.products?.[0]?.qty || 1;
            const selectedProducts = selection.selectedIds.map(selectedId => {
                return option.products?.find(optionProduct => normalizeId(optionProduct.id) === normalizeId(selectedId));
            }).filter(Boolean);

            if (selectedProducts.length !== selection.selectedIds.length) {
                return {
                    skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
                };
            }

            let maxAllowedOptionQty = requestedOptionQty;

            for (const selectedProduct of selectedProducts) {
                if (selectedProduct.inStock === false) {
                    maxAllowedOptionQty = 0;
                    break;
                }

                const inventory = getStockLimit(selectedProduct.inventory);

                if (inventory === null) {
                    continue;
                }

                const reservedQuantity = reservations.get(`bundle:${selectedProduct.productId}`) || 0;
                const remainingQuantity = Math.max(inventory - reservedQuantity, 0);

                maxAllowedOptionQty = Math.min(maxAllowedOptionQty, remainingQuantity);
            }

            if (maxAllowedOptionQty <= 0) {
                return {
                    skip: buildSkippedItem(item, t('pos.orders.reorder.reason.out_of_stock'), product),
                };
            }

            selectedProducts.forEach(selectedProduct => {
                const reservationKey = `bundle:${selectedProduct.productId}`;
                const reservedQuantity = reservations.get(reservationKey) || 0;

                reservations.set(reservationKey, reservedQuantity + maxAllowedOptionQty);
            });

            if (maxAllowedOptionQty !== requestedOptionQty) {
                wasModified = true;
            }

            requestedQty = Math.max(requestedQty, requestedOptionQty);
            addedQty = Math.max(addedQty, maxAllowedOptionQty);

            bundleOptions.push({
                bundleOptionId: selection.optionId,
                bundleOptionProductId: selection.selectedIds,
                qty: maxAllowedOptionQty,
            });
        }

        return {
            payload: {
                productId: product.id,
                quantity: getRequestedQuantity(item, additional),
                bundleOptions,
            },
            modified: wasModified,
            requestedQty,
            addedQty,
        };
    };

    const prepareBookingPayload = (product, item, additional) => {
        const booking = normalizeBookingPayload(additional?.booking);

        if (! booking) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        const bookingProduct = product?.booking?.find(bookingItem => {
            return normalizeId(bookingItem.productId) === normalizeId(product.id);
        }) || product?.booking?.[0];

        if (! bookingProduct) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.deleted'), product),
            };
        }

        if (
            bookingProduct.type === 'event'
            && ! booking.qty?.length
        ) {
            return {
                skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
            };
        }

        if (bookingProduct.type === 'event') {
            const hasInvalidTicket = booking.qty.some(ticket => {
                return ! bookingProduct.eventTickets?.some(eventTicket => {
                    return normalizeId(eventTicket.id) === normalizeId(ticket.ticketId);
                });
            });

            if (hasInvalidTicket) {
                return {
                    skip: buildSkippedItem(item, t('pos.common.cart.missing_options'), product),
                };
            }
        }

        return {
            payload: {
                productId: product.id,
                quantity: getRequestedQuantity(item, additional),
                booking,
            },
            modified: false,
            requestedQty: getRequestedQuantity(item, additional),
            addedQty: getRequestedQuantity(item, additional),
        };
    };

    const prepareOrderItem = async (item, reservations) => {
        const additional = parseAdditional(item?.additional);
        const productId = parseInteger(
            item?.productId
            ?? item?.product_id
            ?? additional?.product_id
            ?? additional?.productId,
            null
        );

        if (productId === null) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.deleted')),
            };
        }

        const product = await DB.getItem('products', productId);

        if (! product) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.deleted')),
            };
        }

        if (! isProductActive(product)) {
            return {
                skip: buildSkippedItem(item, t('pos.orders.reorder.reason.disabled'), product),
            };
        }

        switch (product.type) {
            case 'configurable':
                return prepareConfigurablePayload(product, item, additional, reservations);

            case 'downloadable':
                return prepareDownloadablePayload(product, item, additional);

            case 'grouped':
                return await prepareGroupedPayload(product, item, additional, reservations);

            case 'bundle':
                return prepareBundlePayload(product, item, additional, reservations);

            case 'booking':
                return prepareBookingPayload(product, item, additional);

            case 'virtual':
            case 'simple':
            default:
                return prepareSimplePayload(product, item, additional, reservations);
        }
    };

    const setCartCustomer = async (customer) => {
        await DB.deleteAllItems('cart_customer');

        await DB.addItem('cart_customer', toRaw(customer));

        emitter.emit('customer_changed', toRaw(customer));
    };

    const holdCurrentCart = async (cartManager) => {
        await cartManager.setCart();

        const activeCart = cartManager.cart;

        if (! activeCart?.items?.length) {
            return;
        }

        const agent = await DB.getAgent();
        const cartData = toRaw(activeCart);

        cartData.outlet_id = agent?.outlet?.id || null;

        await DB.addItem('hold_orders', cartData);
        await cartManager.removeCart();

        emitter.emit('add_flash', {
            type: 'info',
            message: t('pos.orders.reorder.cart_held'),
        });
    };

    const processReorder = async (payload) => {
        const order = payload?.order || payload;
        const summary = {
            added: 0,
            skipped: [],
            modified: [],
        };

        if (! order?.items?.length) {
            return summary;
        }

        const orderCustomer = await resolveOrderCustomer(order);

        if (! orderCustomer?.id) {
            emitter.emit('add_flash', {
                type: 'warning',
                message: t('pos.orders.reorder.select_customer_first'),
            });

            return null;
        }

        const reservations = new Map();
        const preparedItems = [];

        for (const item of order.items) {
            const preparedItem = await prepareOrderItem(item, reservations);

            if (preparedItem.skip) {
                summary.skipped.push(preparedItem.skip);

                continue;
            }

            preparedItems.push({
                item,
                ...preparedItem,
            });
        }

        if (! preparedItems.length) {
            return summary;
        }

        const cartManager = new CartManager();

        await holdCurrentCart(cartManager);
        await setCartCustomer(orderCustomer);

        for (const preparedItem of preparedItems) {
            try {
                await cartManager.addToCart(preparedItem.payload);

                summary.added++;

                if (preparedItem.modified) {
                    summary.modified.push({
                        ...buildItemMeta(preparedItem.item),
                        requestedQty: preparedItem.requestedQty,
                        addedQty: preparedItem.addedQty,
                    });
                }
            } catch (error) {
                summary.skipped.push(buildSkippedItem(
                    preparedItem.item,
                    error?.message || String(error)
                ));
            }
        }

        emitter.emit('get-cart');

        return summary;
    };

    return {
        processReorder,
    };
};

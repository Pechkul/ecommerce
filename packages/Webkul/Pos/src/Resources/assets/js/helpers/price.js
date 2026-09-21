const normalizeNumber = (value) => {
    const parsedValue = parseFloat(value);

    return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const normalizeQuantity = (quantity) => {
    const parsedQuantity = parseInt(quantity, 10);

    return Number.isNaN(parsedQuantity) || parsedQuantity < 1 ? 1 : parsedQuantity;
};

const getComparableCustomerGroupId = (customerGroupId) => {
    if (
        customerGroupId === null
        || customerGroupId === undefined
        || customerGroupId === ''
    ) {
        return null;
    }

    return parseInt(customerGroupId, 10);
};

export const getDiscountedProductPrice = (product) => {
    const regularPrice = normalizeNumber(product?.price);
    const specialPrice = normalizeNumber(product?.specialPrice);

    if (! specialPrice) {
        return regularPrice;
    }

    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const fromDate = product?.specialPriceFrom
        ? new Date(product.specialPriceFrom).setHours(0, 0, 0, 0)
        : null;

    const toDate = product?.specialPriceTo
        ? new Date(product.specialPriceTo).setHours(0, 0, 0, 0)
        : null;

    const isInRange = fromDate && toDate
        ? currentDate >= fromDate && currentDate <= toDate
        : true;

    if (! isInRange) {
        return regularPrice;
    }

    return Math.min(regularPrice, specialPrice);
};

export const getCustomerGroupProductPrice = (product, quantity = 1, customerGroupId = null) => {
    const regularPrice = normalizeNumber(product?.price);
    const matchedCustomerGroupId = getComparableCustomerGroupId(customerGroupId);
    const customerGroupPrices = Array.isArray(product?.customerGroupPrices)
        ? product.customerGroupPrices
        : [];

    if (! customerGroupPrices.length) {
        return regularPrice;
    }

    let lastQuantity = 1;
    let lastPrice = regularPrice;
    let lastCustomerGroupId = null;

    for (const customerGroupPrice of customerGroupPrices) {
        const priceQuantity = normalizeQuantity(customerGroupPrice?.qty);
        const priceCustomerGroupId = getComparableCustomerGroupId(customerGroupPrice?.customerGroupId);

        if (priceQuantity > normalizeQuantity(quantity) || priceQuantity < lastQuantity) {
            continue;
        }

        if (
            matchedCustomerGroupId === null
            && priceCustomerGroupId !== null
        ) {
            continue;
        }

        if (
            matchedCustomerGroupId !== null
            && priceCustomerGroupId !== null
            && priceCustomerGroupId !== matchedCustomerGroupId
        ) {
            continue;
        }

        if (
            priceQuantity === lastQuantity
            && lastCustomerGroupId !== null
            && priceCustomerGroupId === null
        ) {
            continue;
        }

        let calculatedPrice = lastPrice;

        if (customerGroupPrice?.valueType === 'discount') {
            const discountValue = normalizeNumber(customerGroupPrice?.value);

            if (
                discountValue < 0
                || discountValue > 100
            ) {
                continue;
            }

            calculatedPrice = regularPrice - ((regularPrice * discountValue) / 100);
        } else {
            calculatedPrice = normalizeNumber(customerGroupPrice?.value);

            if (
                calculatedPrice < 0
                || calculatedPrice >= lastPrice
            ) {
                continue;
            }
        }

        lastPrice = calculatedPrice;
        lastQuantity = priceQuantity;
        lastCustomerGroupId = priceCustomerGroupId;
    }

    return lastPrice;
};

export const getFinalProductPrice = (product, quantity = 1, customerGroupId = null) => {
    return Math.min(
        getDiscountedProductPrice(product),
        getCustomerGroupProductPrice(product, quantity, customerGroupId)
    );
};

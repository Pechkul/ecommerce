import { gql } from '@apollo/client/core';

export const GET_REQUESTED_PRODUCTS = gql`
    query getRequestedProducts(
        $page: Int!,
        $first: Int!,
        $query: String!
    ) {
        getRequestedProducts(
            page: $page,
            first: $first,
            query: $query
        ) {
            paginatorInfo {
                count
                currentPage
                lastPage
                total
            }
            data {
                id
                name
                comment
                requestedQuantity
                requestStatus
                createdAt
                updatedAt
            }
        }
    }
`;

export const GET_LOW_STOCK_PRODUCTS = gql`
    query getLowStockProducts(
        $first: Int!
        $page: Int!
    ) {
        getLowStockProducts(
            first: $first
            page: $page
        ) {
            paginatorInfo {
                count
                currentPage
                lastPage
                total
            }
            data {
                id
                sku
                type
                name
                quantity
                price
                priceHtml
                images {
                    id
                    url
                }
            }
        }
    }
`;

export const REQUEST_PRODUCT_QTY = gql`
    mutation requestProductQty ($input: requestProductQtyInput!) {
        requestProductQty (input: $input) {
            success
            message
        }
    }
`;

export const CREATE_PRODUCT = gql`
    mutation createOutletProduct ($input: createOutletProductInput!) {
        createOutletProduct (input: $input) {
            success
            errors
            message
            product {
                id
                sku
                type
                name
                quantity
                price
                convertedPrice
                taxCategoryId
                barcode
                priceHtml
                images {
                    id
                    url
                }
                categories {
                    id
                    name
                    parentId
                    children {
                        id
                        name
                        parentId
                    }
                }
                customizableOptions {
                    id
                    label
                    productId
                    type
                    isRequired
                    maxCharacters
                    supportedFileExtensions
                    sortOrder
                    product {
                        id
                        sku
                        name
                        type
                    }
                    translations {
                        id
                        locale
                        label
                        productCustomizableOptionId
                    }
                    customizableOptionPrices {
                        id
                        isDefault
                        isUserDefined
                        label
                        price
                        productCustomizableOptionId
                        qty
                        sortOrder
                    }
                }
                options {
                    id
                    label
                    type
                    isRequired
                    sortOrder
                    products {
                        id
                        qty
                        name
                        productId
                        isDefault
                        sortOrder
                        inStock
                        inventory
                        price {
                            regular {
                                price
                                formattedPrice
                            }
                            final {
                                price
                                formattedPrice
                            }
                        }
                    }
                }
            }
        }
    }
`;

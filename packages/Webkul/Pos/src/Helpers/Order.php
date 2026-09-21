<?php

namespace Webkul\Pos\Helpers;

use Illuminate\Support\Carbon;
use Webkul\Product\Repositories\ProductBundleOptionProductRepository;
use Webkul\Product\Repositories\ProductBundleOptionRepository;
use Webkul\Product\Repositories\ProductCustomizableOptionRepository;
use Webkul\Product\Repositories\ProductRepository;

class Order
{
    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct(
        protected ProductRepository $productRepository,
        protected ProductBundleOptionRepository $productBundleOptionRepository,
        protected ProductBundleOptionProductRepository $productBundleOptionProductRepository,
        protected ProductCustomizableOptionRepository $productCustomizableOptionRepository
    ) {}

    /**
     * Get Download Product's Links Price
     *
     * @param  object  $product
     * @param  array  $additional
     * @return float
     */
    public function getDownloadLinkPrice($product, $additional)
    {
        $linkPrice = 0;

        foreach ($product->downloadable_links as $link) {
            if (! in_array($link->id, $additional['links'])) {
                continue;
            }

            $linkPrice += $link->price;
        }

        return $linkPrice;
    }

    /**
     * Format the requested bundle options.
     * This is a cleaned and formatted version of the bundle options requested by the user.
     */
    public function formatRequestedBundleOptions(array &$data): array
    {
        if (! empty($data['bundle_options'])) {
            $bundleOptions = [];
            $bundleOptionQty = [];

            foreach ($data['bundle_options'] as $option) {
                if (
                    ! empty($option['bundle_option_id'])
                    && ! empty($option['bundle_option_product_id'])
                    && ! empty($option['qty'])
                ) {
                    $bundleOptions[$option['bundle_option_id']] = $option['bundle_option_product_id'];

                    $bundleOptionQty[$option['bundle_option_id']] = $option['qty'];
                }
            }

            $data['bundle_options'] = $bundleOptions;
            $data['bundle_option_qty'] = $bundleOptionQty;
        }

        return $data;
    }

    /**
     * Get Bundle Product's Price
     *
     * @param  array  $additional
     * @return float
     */
    public function getBundleProductPrice($additional)
    {
        $basePrice = 0;

        foreach ($additional['bundle_options'] as $optionId => $optionProductIds) {
            foreach ($optionProductIds as $optionProductId) {
                $optionProduct = $this->productBundleOptionProductRepository->find($optionProductId);

                if ($optionProduct) {
                    $product = $this->productRepository->find($optionProduct->product_id);

                    $bundleOption = $this->productBundleOptionRepository->find($optionProduct->product_bundle_option_id);

                    if ($bundleOption) {
                        $qty = $additional['bundle_option_qty'][$optionId];

                        if (
                            $bundleOption->type == 'checkbox'
                            || $bundleOption->type == 'multiselect'
                        ) {
                            $qty = $optionProduct->qty;
                        }

                        $basePrice += $product->getTypeInstance()->getMinimalPrice() * $qty;
                    }
                }
            }
        }

        return $basePrice;
    }

    /**
     * Format the requested bundle options.
     * This is a cleaned and formatted version of the bundle options requested by the user.
     */
    public function formatRequestedBookingOptions(object $product, array &$data): array
    {
        if (! empty($data['booking'])) {
            $booking = $product->booking_products->first();

            if (! empty($booking->type)) {
                if (
                    in_array($booking->type, ['default', 'appointment', 'table'])
                    && ! empty($data['booking']['slot'])
                    && is_array($data['booking']['slot'])
                ) {
                    $data['booking']['slot'] = implode('-', $data['booking']['slot']);
                } elseif (
                    $booking->type === 'event'
                    && ! empty($data['booking']['qty'])
                    && is_array($data['booking']['qty'])
                ) {
                    $data['booking']['qty'] = collect($data['booking']['qty'])
                        ->filter(fn ($ticket) => isset($ticket['ticket_id'], $ticket['quantity']))
                        ->pluck('quantity', 'ticket_id')
                        ->toArray();
                }
            }
        }

        return $data;
    }

    /**
     * Get Booking Product Price
     *
     * @param  array  $additional
     * @return float
     */
    public function getBookingProductPrice($additional)
    {
        $product = $this->productRepository->find($additional['product_id']);

        $price = $product->getTypeInstance()->getMinimalPrice();

        $bookingProduct = $product->getTypeInstance()->getBookingProduct($product->id);

        if (empty($additional['booking'])) {
            return $price;
        }

        if ($bookingProduct->type == 'rental') {
            if ($bookingProduct->rental_slot->renting_type == 'daily') {
                $from = Carbon::createFromTimeString($additional['booking']['date_from'].' 00:00:00');
                $to = Carbon::createFromTimeString($additional['booking']['date_to'].' 24:00:00');

                $price += $bookingProduct->rental_slot->daily_price * $to->diffInDays($from);
            } else {
                $from = Carbon::createFromTimestamp($product['booking']['slot']['from'] / 1000);
                $to = Carbon::createFromTimestamp($product['booking']['slot']['to'] / 1000);

                $price += $bookingProduct->rental_slot->hourly_price * $to->diffInHours($from);
            }
        } elseif ($bookingProduct->type == 'event') {
            $ticket = $bookingProduct->event_tickets()->find($additional['booking']['ticket_id']);

            $price += $ticket->price;
        }

        return $price;
    }

    /**
     * Format the requested customizable options.
     * This is a cleaned and formatted version of the customizable options requested by the user.
     */
    public function formatRequestedCustomizableOptions(object $product, array &$additional): array
    {
        $requestedCustomizableOptions = [];

        foreach ($additional['customizable_options'] as $item) {
            $requestedCustomizableOptions[$item['id']] = $item['value'];
        }

        $additional['customizable_options'] = $requestedCustomizableOptions;

        $formattedCustomizableOptions = [];

        $customizableOptions = $this->productCustomizableOptionRepository
            ->with(['customizable_option_prices'])
            ->where('product_id', $product->id)
            ->whereIn('id', array_keys($requestedCustomizableOptions))
            ->get();

        foreach ($customizableOptions as $customizableOption) {
            switch ($customizableOption->type) {
                case 'text':
                case 'textarea':
                case 'date':
                case 'datetime':
                case 'time':
                    if (
                        ! $customizableOption->is_required
                        && empty($requestedCustomizableOptions[$customizableOption->id][0])
                    ) {
                        continue 2;
                    }

                    $optionPrice = $customizableOption->customizable_option_prices->first();

                    $formattedCustomizableOptions[] = [
                        'id'          => $customizableOption->id,
                        'type'        => $customizableOption->type,
                        'label'       => $customizableOption->translations->pluck('label', 'locale')->toArray(),
                        'prices'      => [[
                            'id'    => $optionPrice->id,
                            'label' => $requestedCustomizableOptions[$customizableOption->id][0],
                            'price' => $optionPrice->price,
                        ]],
                        'total_price' => $optionPrice->price,
                    ];

                    break;

                case 'checkbox':
                case 'radio':
                case 'select':
                case 'multiselect':
                    if (
                        ! $customizableOption->is_required
                        && empty($requestedCustomizableOptions[$customizableOption->id])
                    ) {
                        continue 2;
                    }

                    /**
                     * If the option is not required and the user has selected the `None` option, then we will skip this option.
                     */
                    if (in_array(0, $requestedCustomizableOptions[$customizableOption->id])) {
                        continue 2;
                    }

                    $optionPrices = $customizableOption->customizable_option_prices
                        ->whereIn('id', $requestedCustomizableOptions[$customizableOption->id]);

                    $formattedCustomizableOptions[] = [
                        'id'          => $customizableOption->id,
                        'type'        => $customizableOption->type,
                        'label'       => $customizableOption->translations->pluck('label', 'locale')->toArray(),
                        'prices'      => $optionPrices->map(fn ($price) => [
                            'id'    => $price->id,
                            'label' => $price->label,
                            'price' => $price->price,
                        ])->values()->toArray(),
                        'total_price' => $optionPrices->sum('price'),
                    ];

                    break;
            }
        }

        $additional['formatted_customizable_options'] = $formattedCustomizableOptions;

        return $additional;
    }
}

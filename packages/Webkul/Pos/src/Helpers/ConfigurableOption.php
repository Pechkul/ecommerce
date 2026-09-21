<?php

namespace Webkul\Pos\Helpers;

use Webkul\Product\Helpers\ConfigurableOption as BaseConfigurableOption;

class ConfigurableOption extends BaseConfigurableOption
{
    /**
     * Returns the allowed variants JSON.
     *
     * @param  \Webkul\Product\Models\Product  $product
     * @return array
     */
    public function getConfigurationConfig($product)
    {
        $options = $this->getOptions($product, $this->getAllowedVariants($product));

        $config = [
            'attributes'         => $this->getAttributesData($product, $options),
            'index'              => $options['index'] ?? [],
            'variant_prices'     => $this->getVariantPrices($product),
            'variant_images'     => $this->getVariantImages($product),
            'variant_videos'     => $this->getVariantVideos($product),
            'variant_quantities' => $this->getVariantStock($product),
        ];

        return array_merge($config, $product->getTypeInstance()->getProductPrices());
    }

    /**
     * Get product stock for configurable variations.
     *
     * @param  \Webkul\Product\Contracts\Product  $product
     * @return array
     */
    protected function getVariantStock($product)
    {
        $stock = [];

        foreach ($this->getAllowedVariants($product) as $variant) {
            $stock[$variant->id] = $variant->inventories->sum('qty');
        }

        return $stock;
    }
}

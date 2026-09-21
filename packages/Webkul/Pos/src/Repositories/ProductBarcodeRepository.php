<?php

namespace Webkul\Pos\Repositories;

use Illuminate\Container\Container;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Webkul\Core\Eloquent\Repository;
use Webkul\Pos\Contracts\ProductBarcode;
use Webkul\Product\Repositories\ProductRepository;

class ProductBarcodeRepository extends Repository
{
    /**
     * Create a new repository instance.
     *
     * @return void
     */
    public function __construct(
        Container $container,
        protected ProductRepository $productRepository,
    ) {
        parent::__construct($container);
    }

    /**
     * Specify Model class name
     *
     * @return string
     */
    public function model()
    {
        return ProductBarcode::class;
    }

    /**
     * Generate Barcode for the product
     */
    public function generateBarcode(int $id): string
    {
        require_once __DIR__.'/../barcode.php';

        $imageName = null;

        $width = core()->getConfigData('pos.settings.barcode.width') ?: 100;

        $height = core()->getConfigData('pos.settings.barcode.height') ?: 50;

        $generateWith = core()->getConfigData('pos.settings.barcode.generate_with') ?: 'id';

        $product = $this->productRepository->find($id);

        $productData = [
            'id'  => $product->id,
            'sku' => $product->sku,
        ];

        $barcodeDirPath = storage_path("app/public/product/$id/");

        if (! file_exists($barcodeDirPath)) {
            mkdir($barcodeDirPath, 0777, true);
        }

        $imageName = core()->getConfigData('pos.settings.barcode.prefix').$productData[$generateWith];

        $filepath = "$barcodeDirPath$imageName.png";

        $imageType = core()->getConfigData('pos.settings.barcode.image_type');

        barcode($filepath, $imageName, $width, $height, $imageType);

        (new ImageManager(new Driver))
            ->read($filepath)
            ->resize(300, 200)
            ->greyscale()
            ->save($filepath);

        $this->updateOrCreate(
            ['product_id' => $product->id],
            ['barcode'    => $imageName]
        );

        return $imageName;
    }

    /**
     * Get Barcode for the product
     */
    public function getBarcode(int $product_id): string
    {
        $barcode = $this->findOneWhere(['product_id' => $product_id]);

        if (! empty($barcode->barcode)) {
            $path = public_path("/storage/product/{$product_id}/{$barcode->barcode}.png");

            if (file_exists($path)) {
                return url("/storage/product/{$product_id}/{$barcode->barcode}.png");
            } else {
                $image_name = $this->generateBarcode($product_id);
                if (! empty($image_name)) {
                    $path = public_path("/storage/product/{$product_id}/{$image_name}.png");

                    if (file_exists($path)) {
                        return url("/storage/product/{$product_id}/{$image_name}.png");
                    }
                }
            }
        } else {
            $image_name = $this->generateBarcode($product_id);

            if (! empty($image_name)) {
                $path = public_path("/storage/product/{$product_id}/{$image_name}.png");

                if (file_exists($path)) {
                    return url("/storage/product/{$product_id}/{$image_name}.png");
                }
            }
        }
    }
}

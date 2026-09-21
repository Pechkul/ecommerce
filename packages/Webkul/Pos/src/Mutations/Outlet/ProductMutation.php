<?php

namespace Webkul\Pos\Mutations\Outlet;

use App\Http\Controllers\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Webkul\Attribute\Repositories\AttributeFamilyRepository;
use Webkul\Core\Rules\Slug;
use Webkul\GraphQLAPI\Validators\CustomException;
use Webkul\Pos\Repositories\OutletProductRepository;
use Webkul\Pos\Repositories\ProductRequestRepository;
use Webkul\Product\Repositories\ProductRepository;

class ProductMutation extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct(
        protected AttributeFamilyRepository $attributeFamilyRepository,
        protected OutletProductRepository $outletProductRepository,
        protected ProductRequestRepository $productRequestRepository,
        protected ProductRepository $productRepository,
    ) {}

    /**
     * Request product qty.
     */
    public function requestProductQty($root, array $args, GraphQLContext $context): array
    {
        $validator = Validator::make($args, [
            'products'                      => 'required|array',
            'products.*'                    => 'required|array',
            'products.*.product_id'         => 'required|integer',
            'products.*.requested_quantity' => 'required|integer',
        ]);

        if ($validator->fails()) {
            throw new CustomException($validator->errors()->first());
        }

        foreach ($args['products'] as $requestedProduct) {
            $product = $this->productRepository->find($requestedProduct['product_id']);

            if (! $product) {
                continue;
            }

            $this->productRequestRepository->updateOrCreate([
                'user_id'        => $context->user->id,
                'product_id'     => $product->id,
                'request_status' => 0,
            ], [
                'user_id'            => $context->user->id,
                'product_id'         => $product->id,
                'requested_quantity' => $requestedProduct['requested_quantity'],
                'comment'            => $requestedProduct['comment'] ?? null,
                'send_status'        => 1,
            ]);
        }

        return [
            'success'  => true,
            'message'  => trans('pos::app.outlet.products.request-success'),
        ];
    }

    /**
     * Create a new product.
     */
    public function createProduct($root, array $args, GraphQLContext $context): array
    {
        $validator = Validator::make($args, [
            'name'     => 'required',
            'sku'      => ['nullable', 'unique:products,sku', new Slug],
            'price'    => 'required',
            'quantity' => 'required',
            'weight'   => 'required',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors'  => json_encode($validator->errors()->get('*')),
            ];
        }

        if (empty($args['sku'])) {
            do {
                $sku = Str::upper(uniqid());

                $skuValidator = Validator::make(['sku' => $sku], [
                    'sku' => ['unique:products,sku', new Slug],
                ]);
            } while ($skuValidator->fails());

            $args['sku'] = $sku;
        }

        $args = array_merge($args, [
            'type'                => 'simple',
            'attribute_family_id' => $this->attributeFamilyRepository->first()->id,
        ]);

        Event::dispatch('catalog.product.create.before');

        $product = $this->productRepository->create(Arr::only($args, [
            'sku',
            'name',
            'type',
            'attribute_family_id',
        ]));

        Event::dispatch('catalog.product.create.after', $product);

        $outlet = $context->user()->outlet;

        $this->outletProductRepository->create([
            'outlet_id'  => $outlet->id,
            'product_id' => $product->id,
            'status'     => 1,
        ]);

        $defaultChannel = core()->getDefaultChannel();

        $data = array_merge($args, [
            'channel'           => $defaultChannel->code,
            'locale'            => core()->getRequestedLocaleCode(),
            'sku'               => $product->sku,
            'name'              => $args['name'],
            'url_key'           => Str::kebab($args['name']),
            'short_description' => "<p>{$args['name']}</p>",
            'description'       => "<p>{$args['name']}</p>",
            'price'             => $args['price'],
            'weight'            => $args['weight'],
            'status'            => 1,
            'manage_stock'      => 1,
            'inventories'       => [$outlet->inventory_source_id => $args['quantity']],
            'channels'          => [$defaultChannel->id],
        ]);

        Event::dispatch('catalog.product.update.before', $product->id);

        $product = $this->productRepository->update($data, $product->id);

        Event::dispatch('catalog.product.update.after', $product);

        $product->quantity = $args['quantity'];

        return [
            'success' => true,
            'message' => trans('pos::app.outlet.products.create-success'),
            'product' => $product,
        ];
    }
}

<?php

namespace Webkul\Pos\DataGrids\Admin;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Webkul\DataGrid\DataGrid;
use Webkul\Pos\Repositories\OutletProductRepository;
use Webkul\Pos\Repositories\OutletRepository;

class OutletProductDataGrid extends DataGrid
{
    /**
     * Current Outlet
     *
     * @var object
     */
    protected $outlet;

    /**
     * Primary column.
     *
     * @var string
     */
    protected $primaryColumn = 'product_id';

    /**
     * Create a new repository instance.
     *
     * @return void
     */
    public function __construct(
        protected OutletRepository $outletRepository,
        protected OutletProductRepository $outletProductRepository
    ) {}

    /**
     * Prepare query builder.
     */
    public function prepareQueryBuilder(): Builder
    {
        $tablePrefix = DB::getTablePrefix();

        $this->outlet = $this->outletRepository->find(request()->route()->id);

        $queryBuilder = DB::table('product_flat')
            ->leftJoin('products', 'product_flat.product_id', '=', 'products.id')
            ->leftJoin('product_images', 'products.id', '=', 'product_images.product_id')
            ->leftJoin('product_inventories', 'product_flat.product_id', '=', 'product_inventories.product_id')
            ->leftJoin('pos_outlet_product', function ($qb) {
                $qb->on('pos_outlet_product.product_id', '=', 'products.id')
                    ->leftJoin('pos_outlets', 'pos_outlet_product.outlet_id', '=', 'pos_outlets.id')
                    ->where('pos_outlet_product.outlet_id', $this->outlet->id);
            })
            ->addSelect(
                'products.type',
                'product_flat.name as product_name',
                'product_flat.sku as product_sku',
                'product_flat.price as product_price',
                'product_flat.status as product_status',
                DB::raw('COALESCE('.$tablePrefix.'pos_outlet_product.status, 0) as pos_status'),
                DB::raw($tablePrefix.'products.id as product_id'),
                DB::raw($tablePrefix.'product_images.path as product_image'),
                DB::raw('SUM('.$tablePrefix.'product_inventories.qty) as product_quantity'),
            )
            ->whereNull('products.parent_id')
            ->where('product_flat.locale', app()->getLocale())
            ->groupBy('product_id');

        $this->addFilter('product_id', 'products.id');
        $this->addFilter('type', 'products.type');
        $this->addFilter('product_name', 'product_flat.name');
        $this->addFilter('product_sku', 'product_flat.sku');
        $this->addFilter('product_price', 'product_flat.price');
        $this->addFilter('product_quantity', 'product_inventories.qty');
        $this->addFilter('product_status', 'product_flat.status');
        $this->addFilter('pos_status', DB::raw('COALESCE('.$tablePrefix.'pos_outlet_product.status, 0)'));

        return $queryBuilder;
    }

    /**
     * Prepare columns.
     */
    public function prepareColumns(): void
    {
        $this->addColumn([
            'index'      => 'product_id',
            'label'      => trans('pos::app.admin.users.outlets.assign.datagrid.id'),
            'type'       => 'integer',
            'sortable'   => true,
            'filterable' => true,
            'searchable' => true,
        ]);

        $this->addColumn([
            'index' => 'product_image',
            'label' => trans('pos::app.admin.users.outlets.assign.datagrid.image'),
            'type'  => 'string',
        ]);

        $this->addColumn([
            'index'      => 'product_name',
            'label'      => trans('pos::app.admin.users.outlets.assign.datagrid.name'),
            'type'       => 'string',
            'sortable'   => true,
            'filterable' => true,
            'searchable' => true,
        ]);

        $this->addColumn([
            'index'      => 'product_sku',
            'label'      => trans('pos::app.admin.users.outlets.assign.datagrid.sku'),
            'type'       => 'string',
            'sortable'   => true,
            'filterable' => true,
            'searchable' => true,
        ]);

        $this->addColumn([
            'index'              => 'type',
            'label'              => trans('pos::app.admin.users.outlets.assign.datagrid.type'),
            'type'               => 'string',
            'filterable'         => true,
            'sortable'           => true,
            'filterable_type'    => 'dropdown',
            'filterable_options' => collect(config('product_types'))
                ->map(fn ($type) => ['label' => trans($type['name']), 'value' => $type['key']])
                ->values()
                ->toArray(),
        ]);

        $this->addColumn([
            'index'      => 'product_price',
            'label'      => trans('pos::app.admin.users.outlets.assign.datagrid.price'),
            'type'       => 'integer',
            'sortable'   => true,
            'filterable' => true,
            'searchable' => true,
        ]);

        $this->addColumn([
            'index'      => 'product_quantity',
            'label'      => trans('pos::app.admin.users.outlets.assign.datagrid.qty'),
            'type'       => 'integer',
            'sortable'   => true,
            'filterable' => true,
            'closure'    => function ($row) {
                return $this->outletProductRepository->getProductTotalQty(
                    $row->product_id,
                    $this->outlet->inventory_source_id
                );
            },
        ]);

        $this->addColumn([
            'index'              => 'product_status',
            'label'              => trans('pos::app.admin.users.outlets.assign.datagrid.status'),
            'type'               => 'string',
            'filterable'         => true,
            'sortable'           => true,
            'filterable_type'    => 'dropdown',
            'filterable_options' => [
                [
                    'label'  => trans('pos::app.admin.users.outlets.assign.datagrid.active'),
                    'value'  => 1,
                ],
                [
                    'label'  => trans('pos::app.admin.users.outlets.assign.datagrid.disable'),
                    'value'  => 0,
                ],
            ],
        ]);

        $this->addColumn([
            'index'              => 'pos_status',
            'label'              => trans('pos::app.admin.users.outlets.assign.datagrid.pos-status'),
            'type'               => 'string',
            'filterable'         => true,
            'sortable'           => true,
            'filterable_type'    => 'dropdown',
            'filterable_options' => [
                [
                    'label'  => trans('pos::app.admin.users.outlets.assign.datagrid.active'),
                    'value'  => 1,
                ],
                [
                    'label'  => trans('pos::app.admin.users.outlets.assign.datagrid.disable'),
                    'value'  => 0,
                ],
            ],
        ]);
    }

    /**
     * Prepare Mass Actions
     */
    public function prepareActions(): void
    {
        if (bouncer()->hasPermission('pos.users.outlets.assign_products')) {
            $this->addMassAction([
                'type'    => 'update',
                'title'   => trans('pos::app.admin.users.outlets.assign.datagrid.update-assign'),
                'url'     => route('admin.pos.outlets.assign_products.mass_assign', request('id')),
                'method'  => 'POST',
                'options' => [
                    [
                        'label' => trans('pos::app.admin.users.outlets.assign.datagrid.assign'),
                        'value' => 1,
                    ], [
                        'label' => trans('pos::app.admin.users.outlets.assign.datagrid.unassign'),
                        'value' => 0,
                    ],
                ],
            ]);
        }
    }
}

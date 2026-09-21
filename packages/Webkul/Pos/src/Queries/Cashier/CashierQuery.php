<?php

namespace Webkul\Pos\Queries\Cashier;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Webkul\Pos\Repositories\OrderRepository;
use Webkul\Pos\Repositories\UserDrawerRepository;
use Webkul\Sales\Models\Order;

class CashierQuery extends Controller
{
    protected $tablePrefix;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct(
        protected UserDrawerRepository $userDrawerRepository,
        protected OrderRepository $orderRepository
    ) {
        $this->tablePrefix = DB::getTablePrefix();
    }

    /**
     * Get the payment details.
     */
    public function getDrawerDetails(mixed $rootValue, array $args, GraphQLContext $context): array
    {
        $drawer = $this->getTodaysDrawer($context->user());

        if (! $drawer) {
            return [];
        }

        $order = $this->getTodaysOrdersDetails($context->user());

        $openingAmount = $drawer->opening_amount;
        $cashPaymentSale = $order->cash_payment_sale ?? 0;
        $otherPaymentSale = $order->other_payment_sale ?? 0;

        $expectedDrawerAmount = $openingAmount + $cashPaymentSale;
        $differenceAmount = $cashPaymentSale + $otherPaymentSale;

        return [
            'opening_amount' => core()->convertPrice($openingAmount),
            'cash_payment_sale' => core()->convertPrice($cashPaymentSale),
            'other_payment_sale' => core()->convertPrice($otherPaymentSale),
            'expected_drawer_amount' => core()->convertPrice($expectedDrawerAmount),
            'difference_amount' => core()->convertPrice($differenceAmount),
            'remark' => $drawer->remark,
        ];
    }

    /**
     * Get the total sales of the cashier.
     */
    public function getTodaySales($rootValue, array $args, GraphQLContext $context): array
    {
        $drawer = $this->getTodaysDrawer($context->user());

        $order = $this->getTodaysOrdersDetails($context->user());
        $todayRange = $this->getTodayRangeInStorageTimezone();

        $query = $this->orderRepository->getModel()
            ->leftJoin('orders', 'orders.id', '=', 'pos_order.order_id')
            ->leftJoin('order_payment', 'order_payment.order_id', '=', 'pos_order.order_id')
            ->whereBetween('pos_order.created_at', [
                $todayRange['start']->toDateTimeString(),
                $todayRange['end']->toDateTimeString(),
            ])
            ->where('user_id', $context->user()->id)
            ->select(
                'pos_order.order_id',
                'order_payment.method_title as payment_mode',
                'orders.base_grand_total as order_total',
                'pos_order.created_at'
            );

        $this->applyFilters($query, $args, 'order_id', $this->tablePrefix.'pos_order.order_id');
        $this->applyFilters($query, $args, 'payment_mode', $this->tablePrefix.'order_payment.method');
        $this->applyFilters($query, $args, 'order_total', $this->tablePrefix.'orders.base_grand_total');
        $this->applyFilters($query, $args, 'time', $this->tablePrefix.'pos_order.created_at', 'time', $todayRange);

        $paginated = $query->orderByDesc('pos_order.created_at')
            ->paginate($args['first'], ['*'], 'page', $args['page']);

        $orders = $paginated->getCollection()->map(function ($order) {
            return [
                'order_id' => $order->order_id,
                'payment_mode' => $order->payment_mode,
                'order_total' => core()->convertPrice($order->order_total),
                'created_at' => core()->formatDate($order->created_at, 'd F, Y h:i A'),
            ];
        })->toArray();

        return [
            'today_sale' => [
                'opening_amount' => core()->convertPrice($drawer->opening_amount ?? 0),
                'cash_payment_sale' => core()->convertPrice($order->cash_payment_sale ?? 0),
                'other_payment_sale' => core()->convertPrice($order->other_payment_sale ?? 0),
            ],

            'data' => $orders,

            'paginatorInfo' => [
                'count' => $paginated->count(),
                'currentPage' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ];
    }

    /**
     * Get the sale history of the cashier.
     */
    public function getSaleHistory($rootValue, array $args, GraphQLContext $context): ?array
    {
        $baseQuery = $this->orderRepository->getModel()
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(COALESCE(cash_total, 0)) as total_cash'),
                DB::raw('SUM(COALESCE(card_total, 0)) as total_card'),
                DB::raw('(SUM(COALESCE(cash_total, 0)) + SUM(COALESCE(card_total, 0))) as total_sale')
            )
            ->where('user_id', $context->user()->id)
            ->when(! empty($args['date_from']), function ($query) use ($args) {
                return $query->whereDate('created_at', '>=', $args['date_from']);
            })
            ->when(! empty($args['date_to']), function ($query) use ($args) {
                return $query->whereDate('created_at', '<=', $args['date_to']);
            })
            ->groupByRaw('DATE(created_at)');

        $subQuery = DB::query()->fromSub($baseQuery, 'daily_sales');

        $this->applyFilters($subQuery, $args, 'cash_payment', 'total_cash');
        $this->applyFilters($subQuery, $args, 'other_payment', 'total_card');
        $this->applyFilters($subQuery, $args, 'total_sale', 'total_sale');

        $paginated = $subQuery->orderByDesc('date')
            ->paginate($args['first'], ['*'], 'page', $args['page']);

        $data = $paginated->getCollection()->map(function ($sale) {
            return [
                'date' => core()->formatDate($sale->date, 'd F, Y'),
                'cash_payment' => core()->convertPrice($sale->total_cash),
                'other_payment' => core()->convertPrice($sale->total_card),
                'total_sale' => core()->convertPrice($sale->total_sale),
                'drawer_note' => 'N/A',
            ];
        })->toArray();

        return [
            'data' => $data,
            'paginatorInfo' => [
                'count' => $paginated->count(),
                'currentPage' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
        ];
    }

    /**
     * Apply multiple numeric filters to a query
     */
    private function applyFilters(
        $query,
        array $args,
        string $filterKey,
        string $dbColumn,
        string $type = 'numeric',
        array $context = []
    ): void {
        if (
            ! empty($args[$filterKey])
            && is_array($args[$filterKey])
        ) {
            foreach ($args[$filterKey] as $filter) {
                if (
                    isset($filter['operator'])
                    && isset($filter['value'])
                ) {
                    $operator = $this->sanitizeOperator($filter['operator']);

                    if ($type === 'time') {
                        $this->applyTimeFilter($query, $dbColumn, $operator, $filter['value'], $context);
                    } else {
                        $query->whereRaw(
                            "{$dbColumn} {$operator} ?",
                            [$filter['value']]
                        );
                    }
                }
            }
        }
    }

    /**
     * Sanitize operator to prevent SQL injection
     */
    private function sanitizeOperator($operator): string
    {
        $allowedOperators = ['=', '>', '<', '>=', '<=', '!=', '<>'];

        return in_array($operator, $allowedOperators) ? $operator : '=';
    }

    /**
     * Apply time filters using the same channel-local day the cashier sees in the UI.
     */
    private function applyTimeFilter(
        $query,
        string $dbColumn,
        string $operator,
        string $value,
        array $context = []
    ): void {
        $normalizedTime = $this->normalizeTimeFilterValue($value);

        if (! $normalizedTime) {
            return;
        }

        $todayRange = $context ?: $this->getTodayRangeInStorageTimezone();
        $timeExpression = $this->getChannelTimeExpression($dbColumn, $todayRange['offset_minutes']);

        $query->whereRaw(
            "DATE_FORMAT({$timeExpression}, '%H:%i') {$operator} ?",
            [$normalizedTime]
        );
    }

    /**
     * Normalize UI time values before comparing them against created_at.
     */
    private function normalizeTimeFilterValue(string $value): ?string
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $timezone = $this->getChannelTimezone();

        foreach (['H:i', 'H:i:s'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value, $timezone)->format('H:i');
            } catch (\Exception $exception) {
                continue;
            }
        }

        try {
            return Carbon::parse($value, $timezone)->format('H:i');
        } catch (\Exception $exception) {
            return null;
        }
    }

    /**
     * Build today's start/end timestamps in the storage timezone from the active channel day.
     */
    private function getTodayRangeInStorageTimezone(): array
    {
        $channelTimezone = $this->getChannelTimezone();
        $storageTimezone = config('app.timezone', 'UTC');

        $channelStart = Carbon::now($channelTimezone)->startOfDay();
        $channelEnd = Carbon::now($channelTimezone)->endOfDay();

        return [
            'channel_start' => $channelStart->copy(),
            'channel_end' => $channelEnd->copy(),
            'storage_timezone' => $storageTimezone,
            'offset_minutes' => Carbon::now($channelTimezone)->utcOffset() - Carbon::now($storageTimezone)->utcOffset(),
            'start' => $channelStart->copy()->setTimezone($storageTimezone),
            'end' => $channelEnd->copy()->setTimezone($storageTimezone),
        ];
    }

    /**
     * Convert a stored datetime column into the active channel-local time expression.
     */
    private function getChannelTimeExpression(string $dbColumn, int $offsetMinutes): string
    {
        if ($offsetMinutes > 0) {
            return "DATE_ADD({$dbColumn}, INTERVAL {$offsetMinutes} MINUTE)";
        }

        if ($offsetMinutes < 0) {
            return "DATE_SUB({$dbColumn}, INTERVAL ".abs($offsetMinutes).' MINUTE)';
        }

        return $dbColumn;
    }

    /**
     * Resolve the timezone used to display cashier dates and times.
     */
    private function getChannelTimezone(): string
    {
        $channel = core()->getCurrentChannel();

        return $channel->timezone ?: config('app.timezone', 'UTC');
    }

    /**
     * Get today's drawer.
     */
    protected function getTodaysDrawer(object $user): ?object
    {
        $todayRange = $this->getTodayRangeInStorageTimezone();

        return $this->userDrawerRepository->getModel()
            ->whereBetween('created_at', [
                $todayRange['start']->toDateTimeString(),
                $todayRange['end']->toDateTimeString(),
            ])
            ->whereStatus(1)
            ->where('user_id', $user->id)
            ->first();
    }

    /**
     * Get today's orders.
     */
    protected function getTodaysOrdersDetails(object $user): ?object
    {
        $todayRange = $this->getTodayRangeInStorageTimezone();

        return $this->orderRepository->getModel()
            ->join('orders', 'orders.id', 'pos_order.order_id')
            ->where('user_id', $user->id)
            ->where('status', Order::STATUS_COMPLETED)
            ->whereBetween('orders.created_at', [
                $todayRange['start']->toDateTimeString(),
                $todayRange['end']->toDateTimeString(),
            ])
            ->select(
                DB::raw('SUM(cash_total) as cash_payment_sale'),
                DB::raw('SUM(card_total) as other_payment_sale')
            )
            ->first();
    }
}

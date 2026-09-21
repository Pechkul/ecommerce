<?php

namespace Webkul\Pos\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ValidateAgentOutlet
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        if (Auth::guard('pos_user')->check()) {
            $agent = Auth::guard('pos_user')->user();

            if (! $agent->status || ! $agent->outlet->status) {

                $message = ! $agent->status ? trans('pos::app.outlet.agents.login.not-activated'): trans('pos::app.outlet.agents.login.outlet-not-activated');

                return response()->json([
                    'message'      => $message,
                    'force_logout' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}

<?php

namespace Webkul\Pos\Mutations\Outlet\Agent;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Validator;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Webkul\GraphQLAPI\Validators\CustomException;

class SessionMutation extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        Auth::setDefaultDriver('pos_user');
    }

    /**
     * Login the agent.
     */
    public function login($rootValue, array $args, GraphQLContext $context): array
    {
        $validator = Validator::make($args, [
            'username' => 'required',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'errors'  => json_encode($validator->errors()->get('*')),
            ];
        }

        if (! $jwtToken = JWTAuth::attempt([
            'username' => $args['username'],
            'password' => $args['password'],
        ], $args['remember'] ?? 0)) {
            return [
                'success' => false,
                'message' => trans('pos::app.outlet.agents.login.invalid-credentials'),
            ];
        }

        try {
            $agent = Auth::user();

            if (! $agent->status) {
                return [
                    'success' => false,
                    'message' => trans('pos::app.outlet.agents.login.not-activated'),
                ];
            }

            if(!$agent->outlet->status){
                return [
                    'success' => false,
                    'message' => trans('pos::app.outlet.agents.login.outlet-not-activated'),
                ];
            }

            Event::dispatch('pos.outlet.agents.login.before', $agent);

            return [
                'success'      => true,
                'message'      => trans('pos::app.outlet.agents.login.success'),
                'access_token' => "$jwtToken",
                'agent'        => $agent,
            ];

            Event::dispatch('pos.outlet.agents.login.after', $agent);
        } catch (\Exception $e) {
            throw new CustomException($e->getMessage());
        }
    }

    /**
     * Logout the agent.
     */
    public function logout(): array
    {
        if (! Auth::check()) {
            throw new CustomException(trans('pos::app.outlet.agents.logout.no-login-agent'));
        }

        $agent = Auth::user();

        Auth::logout();

        Event::dispatch('pos.outlet.agents.logout.after', $agent->id);

        return [
            'success' => true,
            'message' => trans('pos::app.outlet.agents.logout.success'),
        ];
    }
}

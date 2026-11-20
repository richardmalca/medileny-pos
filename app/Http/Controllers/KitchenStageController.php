<?php

namespace App\Http\Controllers;

use App\Enums\KitchenStage;
use App\Http\Requests\Orders\KitchenStageRequest;
use App\Models\OrderRound;
use App\Services\KitchenService;
use Illuminate\Http\RedirectResponse;

class KitchenStageController extends Controller
{
    public function __invoke(KitchenStageRequest $request, OrderRound $round, KitchenService $kitchen): RedirectResponse
    {
        $kitchen->move($request->user(), $round, KitchenStage::from($request->integer('stage')));

        return back();
    }
}

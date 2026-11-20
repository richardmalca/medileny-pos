<?php

namespace App\Http\Requests\Orders;

use App\Models\OrderRound;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class KitchenStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $round = $this->route('round');

        return $round instanceof OrderRound
            ? $this->user()->can('updateKitchen', $round)
            : throw new NotFoundHttpException;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'stage' => ['required', 'integer', 'between:1,4'],
        ];
    }
}

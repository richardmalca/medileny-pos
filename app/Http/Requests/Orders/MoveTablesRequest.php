<?php

namespace App\Http\Requests\Orders;

use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MoveTablesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');

        return $order instanceof Order
            ? $this->user()->can('moveTables', $order)
            : throw new NotFoundHttpException;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'table_ids' => ['present', 'array', 'max:8'],
            'table_ids.*' => [
                'integer',
                Rule::exists('dining_tables', 'id')
                    ->where('branch_id', $this->user()->branch_id)
                    ->where('is_active', true),
            ],
        ];
    }
}

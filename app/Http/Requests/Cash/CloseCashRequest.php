<?php

namespace App\Http\Requests\Cash;

use App\Models\CashSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CloseCashRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('session');

        return $session instanceof CashSession
            ? $this->user()->can('close', $session)
            : throw new NotFoundHttpException;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'counted' => ['required', 'decimal:0,2', 'min:0', 'max:999999.99'],
        ];
    }
}

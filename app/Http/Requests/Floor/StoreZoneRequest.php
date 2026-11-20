<?php

namespace App\Http\Requests\Floor;

use App\Models\Zone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Zone::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'name' => [
                'required', 'string', 'max:60',
                Rule::unique('zones', 'name')->where('branch_id', $this->input('branch_id')),
            ],
        ];
    }
}

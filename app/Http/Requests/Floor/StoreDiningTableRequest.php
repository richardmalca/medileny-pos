<?php

namespace App\Http\Requests\Floor;

use App\Models\DiningTable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiningTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', DiningTable::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'zone_id' => [
                'required', 'integer',
                Rule::exists('zones', 'id')->where('branch_id', $this->input('branch_id')),
            ],
            'name' => [
                'required', 'string', 'max:40',
                Rule::unique('dining_tables', 'name')->where('branch_id', $this->input('branch_id')),
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
        ];
    }
}

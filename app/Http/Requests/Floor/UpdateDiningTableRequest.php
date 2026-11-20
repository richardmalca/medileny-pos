<?php

namespace App\Http\Requests\Floor;

use App\Models\DiningTable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UpdateDiningTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->target());
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $table = $this->target();

        return [
            'zone_id' => [
                'required', 'integer',
                Rule::exists('zones', 'id')->where('branch_id', $table->branch_id),
            ],
            'name' => [
                'required', 'string', 'max:40',
                Rule::unique('dining_tables', 'name')->where('branch_id', $table->branch_id)->ignore($table->id),
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
        ];
    }

    private function target(): DiningTable
    {
        $table = $this->route('table');

        return $table instanceof DiningTable ? $table : throw new NotFoundHttpException;
    }
}

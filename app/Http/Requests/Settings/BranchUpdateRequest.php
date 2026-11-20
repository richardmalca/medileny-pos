<?php

namespace App\Http\Requests\Settings;

use App\Enums\Permission;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BranchUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->branch_id !== null
            && $this->user()->can(Permission::ManageBranch->value);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'warn_after_minutes' => ['required', 'integer', 'min:1', 'max:120'],
            'alert_after_minutes' => ['required', 'integer', 'gt:warn_after_minutes', 'max:240'],
            'change_window_minutes' => ['required', 'integer', 'min:0', 'max:60'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'address' => 'dirección',
            'phone' => 'teléfono',
            'warn_after_minutes' => 'aviso por demora',
            'alert_after_minutes' => 'alerta por demora',
            'change_window_minutes' => 'ventana de cambios',
        ];
    }
}

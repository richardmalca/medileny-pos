<?php

namespace App\Http\Requests\Users;

use App\Concerns\ProfileValidationRules;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UpdateUserRequest extends FormRequest
{
    use ProfileValidationRules;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->target());
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower($this->input('email'))]);
        }
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->target()->id),
            'password' => ['nullable', 'string', Password::default()],
            'role' => ['required', Rule::enum(Role::class)],
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
        ];
    }

    private function target(): User
    {
        $user = $this->route('user');

        return $user instanceof User ? $user : throw new NotFoundHttpException;
    }
}

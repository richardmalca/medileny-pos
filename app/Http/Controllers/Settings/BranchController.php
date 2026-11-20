<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\BranchUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless(
            $request->user()->can(Permission::ManageBranch->value) && $request->user()->branch_id !== null,
            403,
        );

        $branch = $request->user()->branch()->firstOrFail();

        return Inertia::render('settings/branch', [
            'branch' => [
                'name' => $branch->name,
                'code' => $branch->code,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'warn_after_minutes' => $branch->warn_after_minutes,
                'alert_after_minutes' => $branch->alert_after_minutes,
                'change_window_minutes' => $branch->change_window_minutes,
            ],
        ]);
    }

    public function update(BranchUpdateRequest $request): RedirectResponse
    {
        $request->user()->branch()->firstOrFail()->update($request->validated());

        return to_route('branch.edit');
    }
}

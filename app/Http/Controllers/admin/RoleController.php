<?php


namespace App\Http\Controllers\admin;

use Inertia\Inertia;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Route;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::with(['permissions', 'users'])->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions,
                'users_count' => $role->users->count(),
                'created_at' => $role->created_at->format('Y-m-d H:i:s'),
            ];
        });

        $permissions = Permission::all();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions
        ]);
    }

    public function create()
    {
        // $permissions = Permission::all();

        $permissions = $this->getAvailableRoutes();

        return Inertia::render('Roles/Create', [
            'permissions' => $permissions
        ]);
    }

    private function getAvailableRoutes()
    {
        $existingPermissions = Permission::pluck('name')->toArray();

        $routes = collect(Route::getRoutes())->filter(function ($route) use ($existingPermissions) {
            $routeName = $route->getName();

            // Filter routes that match our naming pattern and don't exist as permissions
            return $routeName &&
                !str_contains($routeName, 'ignition') &&
                !in_array($routeName, $existingPermissions) &&
                (preg_match('/(admin|user|profile|dashboard)\./', $routeName) ||
                    preg_match('/(index|create|store|edit|update|destroy)$/', $routeName));
        })
            ->unique(function ($route) {
                return $route->getName();
            })
            ->map(function ($route) {
                return [
                    'name' => $route->getName(),
                    'label' => $this->generateLabelFromRouteName($route->getName()),
                    'uri' => $route->uri(),
                    'methods' => $route->methods(),
                ];
            })
            ->values();

        return $routes;
    }


    private function generateLabelFromRouteName($routeName)
    {
        // Convert route name to readable label
        $label = str_replace(['.', '-', '_'], ' ', $routeName);
        $label = ucwords($label);

        // Add action type for better readability
        if (str_contains($routeName, '.index')) {
            $label = str_replace('Index', 'List', $label);
        } elseif (str_contains($routeName, '.create')) {
            $label = str_replace('Create', 'Create', $label);
        } elseif (str_contains($routeName, '.edit')) {
            $label = str_replace('Edit', 'Edit', $label);
        } elseif (str_contains($routeName, '.store')) {
            $label = str_replace('Store', 'Create', $label);
        } elseif (str_contains($routeName, '.update')) {
            $label = str_replace('Update', 'Update', $label);
        } elseif (str_contains($routeName, '.destroy')) {
            $label = str_replace('Destroy', 'Delete', $label);
        }

        return $label;
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'permissions' => 'required|array'
        ]);

        DB::transaction(function () use ($request) {
            $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

            // Ensure all permissions exist before syncing
            foreach ($request->permissions as $permissionName) {
                Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web']
                );
            }

            $role->syncPermissions($request->permissions);
        });


        return redirect()->route('admin.roles.index')->with('success', 'Role created successfully.');
    }

    public function edit(Role $role)
    {
        $permissions = Permission::all();

        return Inertia::render('Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions,
                'users_count' => $role->users->count(),
            ],
            'permissions' => $permissions
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'required|array'
        ]);

        DB::transaction(function () use ($request, $role) {
            $role->update(['name' => $request->name]);
            $role->syncPermissions($request->permissions);
        });

        return redirect()->route('admin.roles.index')->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete role with assigned users.');
        }

        if ($role->name === 'admin') {
            return redirect()->back()->with('error', 'Cannot delete admin role.');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted successfully.');
    }

}
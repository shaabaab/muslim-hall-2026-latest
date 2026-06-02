<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Spatie\Permission\Models\Permission;

class PermissionServiceProvider extends ServiceProvider
{
    public function boot()
    {
        try {
            $this->registerPermissionsFromRoutes();
        } catch (\Exception $e) {
        }
    }

    protected function registerPermissionsFromRoutes()
    {
        $routes = Route::getRoutes()->getRoutes();
        
        foreach ($routes as $route) {
            $uri = $route->uri();
            $methods = $route->methods();
            $name = $route->getName();
            
            if ($name && in_array('GET', $methods) && strpos($uri, 'api') === false) {
                $permissionName = str_replace('.', ' ', $name);
                $permissionName = ucwords($permissionName);
                
                $existingPermission = Permission::where('name', $name)->first();
                
                if (!$existingPermission) {
                    Permission::create(['name' => $name, 'guard_name' => 'web']);
                }
            }
        }
    }
}
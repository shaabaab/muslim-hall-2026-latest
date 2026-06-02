<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\OptimizationSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OptimizationSettingController extends Controller
{
    public function index()
    {
        $setting = OptimizationSetting::first();

        if (!$setting) {
            $setting = OptimizationSetting::create([
                'image_optimization_enabled' => true,
                'image_quality' => 80,
                'video_optimization_enabled' => true,
                'video_quality' => 'medium',
                'pdf_optimization_enabled' => true,
                'pdf_quality' => 'medium',
            ]);
        }

        return Inertia::render('Settings/Optimization/Index', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'image_optimization_enabled' => 'required|boolean',
            'image_quality'              => 'required|integer|min:1|max:100',
            'video_optimization_enabled' => 'required|boolean',
            'video_quality'              => 'required|string|in:low,medium,high',
            'pdf_optimization_enabled'   => 'required|boolean',
            'pdf_quality'                => 'required|string|in:low,medium,high',
        ]);

        $setting = OptimizationSetting::first();
        
        if ($setting) {
            $setting->update($validated);
        } else {
            OptimizationSetting::create($validated);
        }

        return back()->with('success', 'Optimization settings updated successfully.');
    }
}

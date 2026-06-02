<?php

namespace App\Http\Controllers;

use App\Models\Seo;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Services\ServiceClass;

class SeoController extends Controller
{
    public function index(Request $request)
    {
        $query = Seo::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%")
                    ->orWhere('og_title', 'like', "%{$search}%")
                    ->orWhere('twitter_title', 'like', "%{$search}%")
                    ->orWhere('canonical_url', 'like', "%{$search}%")
                    ->orWhere('meta_description', 'like', "%{$search}%")
                    ->orWhere('og_description', 'like', "%{$search}%")
                    ->orWhere('twitter_description', 'like', "%{$search}%");
            });
        }

        // Filter by image presence
        if ($request->filled('has_images')) {
            switch ($request->has_images) {
                case 'any':
                    $query->where(function ($q) {
                        $q->whereNotNull('fav_icon')
                            ->orWhereNotNull('header_logo')
                            ->orWhereNotNull('footer_logo')
                            ->orWhereNotNull('og_image')
                            ->orWhereNotNull('twitter_image');
                    });
                    break;
                case 'favicon':
                    $query->whereNotNull('fav_icon');
                    break;
                case 'og':
                    $query->whereNotNull('og_image');
                    break;
                case 'none':
                    $query->where(function ($q) {
                        $q->whereNull('fav_icon')
                            ->whereNull('header_logo')
                            ->whereNull('footer_logo')
                            ->whereNull('og_image')
                            ->whereNull('twitter_image');
                    });
                    break;
            }
        }

        // Filter by SEO status (completion)
        if ($request->filled('seo_status')) {
            switch ($request->seo_status) {
                case 'excellent':
                    $query->whereNotNull('meta_title')
                        ->whereNotNull('meta_description')
                        ->whereNotNull('canonical_url')
                        ->whereNotNull('og_image');
                    break;

                case 'good':
                    $query->where(function ($q) {
                        $q->whereNotNull('meta_title')
                            ->whereNotNull('meta_description');
                    });
                    break;

                case 'fair':
                    $query->where(function ($q) {
                        $q->whereNotNull('meta_title')
                            ->orWhereNotNull('meta_description');
                    });
                    break;

                case 'poor':
                    $query->where(function ($q) {
                        $q->whereNull('meta_title')
                            ->whereNull('meta_description')
                            ->whereNull('canonical_url');
                    });
                    break;
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');

        $allowedSortFields = ['id', 'title', 'meta_title', 'canonical_url', 'created_at', 'updated_at'];
        if (!in_array($sortField, $allowedSortFields, true)) {
            $sortField = 'id';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = (int) $request->get('per_page', 10);
        $seos = $query->paginate($perPage)->withQueryString();

        // Add URLs (S3) for frontend
        $seos->getCollection()->transform(function ($seo) {
            $seo->fav_icon_url = ServiceClass::getFileUrl($seo->fav_icon);
            $seo->header_logo_url = ServiceClass::getFileUrl($seo->header_logo);
            $seo->footer_logo_url = ServiceClass::getFileUrl($seo->footer_logo);
            $seo->og_image_url = ServiceClass::getFileUrl($seo->og_image);
            $seo->twitter_image_url = ServiceClass::getFileUrl($seo->twitter_image);
            return $seo;
        });

        return Inertia::render('Seo/Index', [
            'seos' => $seos,
            'filters' => $request->only(['search', 'has_images', 'seo_status', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Seo/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',

            'fav_icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,ico|max:2048',
            'header_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'footer_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'og_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'twitter_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',

            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|array',
            'meta_keywords.*' => 'string|max:255',
            'meta_robots' => 'nullable|string|max:255',

            'og_title' => 'nullable|string|max:255',
            'og_description' => 'nullable|string',
            'og_type' => 'nullable|string|max:255',
            'og_url' => 'nullable|url|max:255',
            'og_site_name' => 'nullable|string|max:255',

            'twitter_card' => 'nullable|string|max:255',
            'twitter_title' => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string',
            'twitter_site' => 'nullable|string|max:255',
            'twitter_creator' => 'nullable|string|max:255',

            'canonical_url' => 'nullable|url|max:255',
            'structured_data' => 'nullable|json',
            'focus_keywords' => 'nullable|array',
            'focus_keywords.*' => 'string|max:255',
        ]);

        // keywords cleanup
        $metaKeywords = $request->meta_keywords ? array_values(array_filter($request->meta_keywords)) : null;
        $focusKeywords = $request->focus_keywords ? array_values(array_filter($request->focus_keywords)) : null;

        // Uploads via ServiceClass (S3)
        if ($request->hasFile('fav_icon')) {
            $path = ServiceClass::uploadFile($request->file('fav_icon'), 'seo/favicons');
            if (!$path) return back()->with('error', 'Favicon upload failed.')->withInput();
            $validated['fav_icon'] = $path;
        }

        if ($request->hasFile('header_logo')) {
            $path = ServiceClass::uploadFile($request->file('header_logo'), 'seo/logos');
            if (!$path) return back()->with('error', 'Header logo upload failed.')->withInput();
            $validated['header_logo'] = $path;
        }

        if ($request->hasFile('footer_logo')) {
            $path = ServiceClass::uploadFile($request->file('footer_logo'), 'seo/logos');
            if (!$path) return back()->with('error', 'Footer logo upload failed.')->withInput();
            $validated['footer_logo'] = $path;
        }

        if ($request->hasFile('og_image')) {
            $path = ServiceClass::uploadFile($request->file('og_image'), 'seo/og-images');
            if (!$path) return back()->with('error', 'OG image upload failed.')->withInput();
            $validated['og_image'] = $path;
        }

        if ($request->hasFile('twitter_image')) {
            $path = ServiceClass::uploadFile($request->file('twitter_image'), 'seo/twitter-images');
            if (!$path) return back()->with('error', 'Twitter image upload failed.')->withInput();
            $validated['twitter_image'] = $path;
        }

        $seo = new Seo();

        $seo->title = $validated['title'] ?? null;
        $seo->fav_icon = $validated['fav_icon'] ?? null;
        $seo->header_logo = $validated['header_logo'] ?? null;
        $seo->footer_logo = $validated['footer_logo'] ?? null;
        $seo->canonical_url = $validated['canonical_url'] ?? null;

        $seo->meta_title = $validated['meta_title'] ?? null;
        $seo->meta_description = $validated['meta_description'] ?? null;
        $seo->meta_keywords = $metaKeywords ? json_encode($metaKeywords) : null;
        $seo->meta_robots = $validated['meta_robots'] ?? 'index, follow';

        $seo->og_title = $validated['og_title'] ?? null;
        $seo->og_description = $validated['og_description'] ?? null;
        $seo->og_image = $validated['og_image'] ?? null;
        $seo->og_type = $validated['og_type'] ?? 'website';
        $seo->og_url = $validated['og_url'] ?? null;
        $seo->og_site_name = $validated['og_site_name'] ?? null;

        $seo->twitter_card = $validated['twitter_card'] ?? 'summary_large_image';
        $seo->twitter_title = $validated['twitter_title'] ?? null;
        $seo->twitter_description = $validated['twitter_description'] ?? null;
        $seo->twitter_image = $validated['twitter_image'] ?? null;
        $seo->twitter_site = $validated['twitter_site'] ?? null;
        $seo->twitter_creator = $validated['twitter_creator'] ?? null;

        $seo->structured_data = $validated['structured_data'] ?? null;
        $seo->focus_keywords = $focusKeywords ? json_encode($focusKeywords) : null;

        $seo->save();

        return to_route('admin.seos.index')->with('success', 'SEO created successfully.');
    }

    public function show(string $id)
    {
        $seo = Seo::findOrFail($id);

        $seo->fav_icon_url = ServiceClass::getFileUrl($seo->fav_icon);
        $seo->header_logo_url = ServiceClass::getFileUrl($seo->header_logo);
        $seo->footer_logo_url = ServiceClass::getFileUrl($seo->footer_logo);
        $seo->og_image_url = ServiceClass::getFileUrl($seo->og_image);
        $seo->twitter_image_url = ServiceClass::getFileUrl($seo->twitter_image);

        // decode for UI
        $seo->meta_keywords = $seo->meta_keywords ? json_decode($seo->meta_keywords, true) : [];
        $seo->focus_keywords = $seo->focus_keywords ? json_decode($seo->focus_keywords, true) : [];
        $seo->structured_data = $seo->structured_data ? json_decode($seo->structured_data, true) : null;

        return Inertia::render('Seo/Show', ['seo' => $seo]);
    }

    public function edit(string $id)
    {
        $seo = Seo::findOrFail($id);

        $seo->fav_icon_url = ServiceClass::getFileUrl($seo->fav_icon);
        $seo->header_logo_url = ServiceClass::getFileUrl($seo->header_logo);
        $seo->footer_logo_url = ServiceClass::getFileUrl($seo->footer_logo);
        $seo->og_image_url = ServiceClass::getFileUrl($seo->og_image);
        $seo->twitter_image_url = ServiceClass::getFileUrl($seo->twitter_image);

        $seo->meta_keywords = $seo->meta_keywords ? json_decode($seo->meta_keywords, true) : [];
        $seo->focus_keywords = $seo->focus_keywords ? json_decode($seo->focus_keywords, true) : [];
        $seo->structured_data = $seo->structured_data ? json_decode($seo->structured_data, true) : null;

        return Inertia::render('Seo/Edit', ['seo' => $seo]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',

            'fav_icon' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,ico|max:2048',
            'header_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'footer_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'og_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'twitter_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',

            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_keywords' => 'nullable|array',
            'meta_keywords.*' => 'string|max:255',
            'meta_robots' => 'nullable|string|max:255',

            'og_title' => 'nullable|string|max:255',
            'og_description' => 'nullable|string',
            'og_type' => 'nullable|string|max:255',
            'og_url' => 'nullable|url|max:255',
            'og_site_name' => 'nullable|string|max:255',

            'twitter_card' => 'nullable|string|max:255',
            'twitter_title' => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string',
            'twitter_site' => 'nullable|string|max:255',
            'twitter_creator' => 'nullable|string|max:255',

            'canonical_url' => 'nullable|url|max:255',
            'structured_data' => 'nullable|json',
            'focus_keywords' => 'nullable|array',
            'focus_keywords.*' => 'string|max:255',

            // optional remove flags (useful in UI)
            'remove_fav_icon' => 'nullable|boolean',
            'remove_header_logo' => 'nullable|boolean',
            'remove_footer_logo' => 'nullable|boolean',
            'remove_og_image' => 'nullable|boolean',
            'remove_twitter_image' => 'nullable|boolean',
        ]);

        $seo = Seo::findOrFail($id);

        // remove flags
        if ($request->boolean('remove_fav_icon')) {
            ServiceClass::deleteFile($seo->fav_icon);
            $seo->fav_icon = null;
        }
        if ($request->boolean('remove_header_logo')) {
            ServiceClass::deleteFile($seo->header_logo);
            $seo->header_logo = null;
        }
        if ($request->boolean('remove_footer_logo')) {
            ServiceClass::deleteFile($seo->footer_logo);
            $seo->footer_logo = null;
        }
        if ($request->boolean('remove_og_image')) {
            ServiceClass::deleteFile($seo->og_image);
            $seo->og_image = null;
        }
        if ($request->boolean('remove_twitter_image')) {
            ServiceClass::deleteFile($seo->twitter_image);
            $seo->twitter_image = null;
        }

        // Upload replacements via ServiceClass::updateFile (delete old + upload new)
        if ($request->hasFile('fav_icon')) {
            $path = ServiceClass::updateFile($request->file('fav_icon'), 'seo/favicons', $seo->fav_icon);
            if (!$path) return back()->with('error', 'Favicon upload failed.')->withInput();
            $seo->fav_icon = $path;
        }

        if ($request->hasFile('header_logo')) {
            $path = ServiceClass::updateFile($request->file('header_logo'), 'seo/logos', $seo->header_logo);
            if (!$path) return back()->with('error', 'Header logo upload failed.')->withInput();
            $seo->header_logo = $path;
        }

        if ($request->hasFile('footer_logo')) {
            $path = ServiceClass::updateFile($request->file('footer_logo'), 'seo/logos', $seo->footer_logo);
            if (!$path) return back()->with('error', 'Footer logo upload failed.')->withInput();
            $seo->footer_logo = $path;
        }

        if ($request->hasFile('og_image')) {
            $path = ServiceClass::updateFile($request->file('og_image'), 'seo/og-images', $seo->og_image);
            if (!$path) return back()->with('error', 'OG image upload failed.')->withInput();
            $seo->og_image = $path;
        }

        if ($request->hasFile('twitter_image')) {
            $path = ServiceClass::updateFile($request->file('twitter_image'), 'seo/twitter-images', $seo->twitter_image);
            if (!$path) return back()->with('error', 'Twitter image upload failed.')->withInput();
            $seo->twitter_image = $path;
        }

        // keywords cleanup
        $metaKeywords = $request->meta_keywords ? array_values(array_filter($request->meta_keywords)) : null;
        $focusKeywords = $request->focus_keywords ? array_values(array_filter($request->focus_keywords)) : null;

        // Update text fields
        $seo->title = $validated['title'] ?? $seo->title;
        $seo->canonical_url = $validated['canonical_url'] ?? $seo->canonical_url;

        $seo->meta_title = $validated['meta_title'] ?? null;
        $seo->meta_description = $validated['meta_description'] ?? null;
        $seo->meta_keywords = $metaKeywords ? json_encode($metaKeywords) : null;
        $seo->meta_robots = $validated['meta_robots'] ?? 'index, follow';

        $seo->og_title = $validated['og_title'] ?? null;
        $seo->og_description = $validated['og_description'] ?? null;
        $seo->og_type = $validated['og_type'] ?? 'website';
        $seo->og_url = $validated['og_url'] ?? null;
        $seo->og_site_name = $validated['og_site_name'] ?? null;

        $seo->twitter_card = $validated['twitter_card'] ?? 'summary_large_image';
        $seo->twitter_title = $validated['twitter_title'] ?? null;
        $seo->twitter_description = $validated['twitter_description'] ?? null;
        $seo->twitter_site = $validated['twitter_site'] ?? null;
        $seo->twitter_creator = $validated['twitter_creator'] ?? null;

        $seo->structured_data = $validated['structured_data'] ?? null;
        $seo->focus_keywords = $focusKeywords ? json_encode($focusKeywords) : null;

        $seo->save();

        return redirect()->route('admin.seos.index')->with('success', 'SEO updated successfully.');
    }

    public function destroy(string $id)
    {
        $seo = Seo::findOrFail($id);

        ServiceClass::deleteFile($seo->fav_icon);
        ServiceClass::deleteFile($seo->header_logo);
        ServiceClass::deleteFile($seo->footer_logo);
        ServiceClass::deleteFile($seo->og_image);
        ServiceClass::deleteFile($seo->twitter_image);

        $seo->delete();

        return redirect()->route('admin.seos.index')->with('success', 'SEO deleted successfully.');
    }
}

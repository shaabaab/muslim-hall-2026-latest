<?php
namespace App\Http\Controllers;

use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Services\ServiceClass;
use Illuminate\Support\Facades\Auth;

class AdvertisementController extends Controller
{
    public function index(Request $request)
    {
        $query = Advertisement::latest();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('advertiser_name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('position')) {
            $query->where('position', $request->position);
        }

        $advertisements = $query->paginate(15);

        // Statistics
        $stats = [
            'total' => Advertisement::count(),
            'active' => Advertisement::active()->count(),
            'pending' => Advertisement::where('status', 'pending')->count(),
            'total_spent' => Advertisement::sum('spent_amount'),
            'total_impressions' => Advertisement::sum('impressions_count'),
            'total_clicks' => Advertisement::sum('clicks_count'),
        ];

        return Inertia::render('Advertisement/Index', [
            'advertisements' => $advertisements,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'status', 'position'])
        ]);
    }

    public function create()
    {
        return Inertia::render('Advertisement/Create');
    }

    public function store(Request $request)
    {
        // Process date fields before validation
        $requestData = $request->all();

        // Convert Day.js date arrays to proper date strings
        if (isset($requestData['start_date']) && is_array($requestData['start_date'])) {
            if (isset($requestData['start_date']['$d'])) {
                $requestData['start_date'] = \Carbon\Carbon::parse($requestData['start_date']['$d'])->format('Y-m-d H:i:s');
            } else {
                // Fallback: try to extract from the array structure
                $requestData['start_date'] = $this->extractDateFromDayjs($requestData['start_date']);
            }
        }

        if (isset($requestData['end_date']) && is_array($requestData['end_date'])) {
            if (isset($requestData['end_date']['$d'])) {
                $requestData['end_date'] = \Carbon\Carbon::parse($requestData['end_date']['$d'])->format('Y-m-d H:i:s');
            } else {
                // Fallback: try to extract from the array structure
                $requestData['end_date'] = $this->extractDateFromDayjs($requestData['end_date']);
            }
        }

        // Merge the processed data back into the request
        $request->merge($requestData);

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:banner,video_ad',
            'position' => 'required|in:header,in_content',
            'video' => 'nullable|file',
            'video_url' => 'nullable|url',
            'target_url' => 'required|url|max:500',
            'button_text' => 'nullable|string|max:50',
            'background_color' => 'nullable|string|max:7',
            'text_color' => 'nullable|string|max:7',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'max_impressions' => 'nullable|integer|min:1',
            'max_clicks' => 'nullable|integer|min:1',
            'cost_per_impression' => 'nullable|numeric|min:0',
            'cost_per_click' => 'nullable|numeric|min:0',
            'total_budget' => 'nullable|numeric|min:0',
            'advertiser_name' => 'nullable|string|max:255',
            'advertiser_email' => 'nullable|email|max:255',
            'advertiser_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'status' => 'required|in:pending,approved,rejected,paused,completed',
            'targeting' => 'nullable|array'
        ];

        // Only validate image if it's a banner or if an image file is actually present
        if ($request->type === 'banner' || $request->hasFile('image')) {
            $rules['image'] = ($request->type === 'banner' ? 'required' : 'nullable') . '|image|mimes:jpeg,png,jpg,gif,svg';
        }

        $validated = $request->validate($rules);

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = ServiceClass::uploadFile($request->file('image'), 'advertisements');
        }

        // Handle video upload
        // if ($request->hasFile('video')) {
        //     $validated['video'] = $request->file('video')->store('advertisements/videos', 'public');
        // }
        if ($request->hasFile('video')) {
             $validated['video'] = ServiceClass::uploadFile($request->file('video'),'advertisements/videos');
        }

        // Handle targeting JSON
        // Targeting is handled by model casts
        if ($request->has('targeting')) {
            $validated['targeting'] = $request->targeting;
        }

        // Convert boolean fields
        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_featured'] = $request->boolean('is_featured');

        Advertisement::create($validated);

        return redirect()->route('admin.advertisements.index')->with('success', 'Advertisement created successfully.');
    }

    /**
     * Extract date from Day.js array structure
     */
    private function extractDateFromDayjs(array $dayjsArray): ?string
    {
        try {
            // Check if we have the ISO string directly
            if (isset($dayjsArray['$d'])) {
                return \Carbon\Carbon::parse($dayjsArray['$d'])->format('Y-m-d H:i:s');
            }

            // Build date from individual components
            if (isset($dayjsArray['$y'], $dayjsArray['$M'], $dayjsArray['$D'])) {
                $year = $dayjsArray['$y'];
                $month = $dayjsArray['$M'] + 1; // JavaScript months are 0-indexed
                $day = $dayjsArray['$D'];
                $hour = $dayjsArray['$H'] ?? 0;
                $minute = $dayjsArray['$m'] ?? 0;
                $second = $dayjsArray['$s'] ?? 0;

                return sprintf(
                    '%04d-%02d-%02d %02d:%02d:%02d',
                    $year,
                    $month,
                    $day,
                    $hour,
                    $minute,
                    $second
                );
            }
        } catch (\Exception $e) {
            \Log::error('Failed to parse Day.js date', ['data' => $dayjsArray, 'error' => $e->getMessage()]);
        }

        return null;
    }


    public function show(Advertisement $advertisement)
    {
        return Inertia::render('Advertisement/Show', [
            'advertisement' => $advertisement
        ]);
    }

    public function edit(Advertisement $advertisement)
    {
        return Inertia::render('Advertisement/Edit', [
            'advertisement' => $advertisement
        ]);
    }

    public function update(Request $request, Advertisement $advertisement)
    {
        // Process date fields before validation (same as store function)
        $requestData = $request->all();

        // Convert Day.js date arrays to proper date strings
        if (isset($requestData['start_date']) && is_array($requestData['start_date'])) {
            if (isset($requestData['start_date']['$d'])) {
                $requestData['start_date'] = \Carbon\Carbon::parse($requestData['start_date']['$d'])->format('Y-m-d H:i:s');
            } else {
                // Fallback: try to extract from the array structure
                $requestData['start_date'] = $this->extractDateFromDayjs($requestData['start_date']);
            }
        }

        if (isset($requestData['end_date']) && is_array($requestData['end_date'])) {
            if (isset($requestData['end_date']['$d'])) {
                $requestData['end_date'] = \Carbon\Carbon::parse($requestData['end_date']['$d'])->format('Y-m-d H:i:s');
            } else {
                // Fallback: try to extract from the array structure
                $requestData['end_date'] = $this->extractDateFromDayjs($requestData['end_date']);
            }
        }

        // Merge the processed data back into the request
        $request->merge($requestData);

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:banner,video_ad',
            'position' => 'required|in:header,in_content',
            'video' => 'nullable|file',
            'video_url' => 'nullable|url|max:500',
            'target_url' => 'required|url|max:500',
            'button_text' => 'nullable|string|max:50',
            'background_color' => 'nullable|string|max:7',
            'text_color' => 'nullable|string|max:7',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'max_impressions' => 'nullable|integer|min:1',
            'max_clicks' => 'nullable|integer|min:1',
            'cost_per_impression' => 'nullable|numeric|min:0',
            'cost_per_click' => 'nullable|numeric|min:0',
            'total_budget' => 'nullable|numeric|min:0',
            'advertiser_name' => 'nullable|string|max:255',
            'advertiser_email' => 'nullable|email|max:255',
            'advertiser_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'status' => 'required|in:pending,approved,rejected,paused,completed',
            'targeting' => 'nullable|array'
        ];

        // Only validate image if it's a banner or if an image file is actually present in the request
        if ($request->hasFile('image')) {
            $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,gif,svg';
        }

        $validated = $request->validate($rules);

        // Handle image upload
        if ($request->hasFile('image')) {
            if ($advertisement->image) {
                ServiceClass::deleteFile($advertisement->image);
            }
            $validated['image'] = ServiceClass::uploadFile($request->file('image'), 'advertisements');
        } else {
            unset($validated['image']);
        }

        // Handle video upload
        if ($request->hasFile('video')) {
            if ($advertisement->video) {
                ServiceClass::deleteFile($advertisement->video);
            }
            $validated['video'] = ServiceClass::uploadFile($request->file('video'), 'advertisements/videos');
        } else {
            unset($validated['video']);
        }

        // Handle targeting JSON
        // Targeting is handled by model casts
        if ($request->has('targeting')) {
            $validated['targeting'] = $request->targeting;
        }

        // Convert boolean fields
        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_featured'] = $request->boolean('is_featured');

        $advertisement->update($validated);

        return redirect()->route('admin.advertisements.index')
            ->with('success', 'Advertisement updated successfully.');
    }

    public function destroy(Advertisement $advertisement)
    {
        if ($advertisement->image) {
            ServiceClass::deleteFile($advertisement->image);
        }

        if ($advertisement->video) {
            ServiceClass::deleteFile($advertisement->video);
        }

        $advertisement->delete();

        return redirect()->route('admin.advertisements.index')
            ->with('success', 'Advertisement deleted successfully.');
    }

    public function recordImpression(Advertisement $advertisement)
    {
        if ($advertisement->isActive()) {
            $advertisement->recordImpression();
        }

        return response()->json(['success' => true]);
    }

    public function recordClick(Advertisement $advertisement)
    {
        if ($advertisement->isActive()) {
            $advertisement->recordClick();
        }

        return response()->json(['success' => true]);
    }

    public function approve($id)
    {
        $advertisement = Advertisement::findOrFail($id);
        $advertisement->approve();

        return back()->with('success', 'Advertisement approved successfully.');
    }

    public function reject(Advertisement $advertisement)
    {
        $advertisement->reject();

        return back()->with('success', 'Advertisement rejected.');
    }

    public function toggleActive(Advertisement $advertisement)
    {
        $advertisement->update([
            'is_active' => !$advertisement->is_active
        ]);

        $status = $advertisement->is_active ? 'activated' : 'paused';
        return back()->with('success', "Advertisement {$status} successfully.");
    }

    public function toggleFeatured(Advertisement $advertisement)
    {
        $advertisement->update([
            'is_featured' => !$advertisement->is_featured
        ]);

        $status = $advertisement->is_featured ? 'featured' : 'unfeatured';
        return back()->with('success', "Advertisement {$status} successfully.");
    }

    public function getActiveAds(Request $request)
    {
        $position = $request->get('position');
        $type = $request->get('type');

        $query = Advertisement::active();

        if ($position) {
            $query->where('position', $position);
        }

        if ($type) {
            $query->where('type', $type);
        }

        $ads = $query->inRandomOrder()->limit(5)->get();

        return response()->json($ads);
    }
}
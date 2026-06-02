<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\ContactInfo;
use App\Models\Feedback;
use App\Models\Language;
use App\Models\Setting;
use App\Models\SliderSection;
use App\Models\Social;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    // =========================
    // SETTINGS
    // =========================

    public function index()
    {
        $setting = Setting::with('language')->get();

        return $setting->isEmpty()
            ? to_route('admin.settings.create')
            : Inertia::render('Settings/Index', [
                'setting' => $setting,
            ]);
    }

    public function create()
    {
        if (Setting::count() >= 1) {
            return to_route('admin.settings.index')->with('error', 'Only one setting entry is allowed.');
        }

        $langs = Language::active()->get();

        return Inertia::render('Settings/Create', [
            'langs' => $langs,
        ]);
    }

    public function store(Request $request)
    {
        if (Setting::count() >= 1) {
            return to_route('admin.settings.index')->with('error', 'Only one setting entry is allowed.');
        }

        $validated = $request->validate([
            'header_title' => 'required|string|max:255',
            'footer_title' => 'required|string|max:255',
            'footer_content' => 'required|string',
            'favicon' => 'nullable|image',
            'header_logo' => 'nullable|image',
            'footer_logo' => 'nullable|image',
            'lang_id' => 'nullable|integer',
        ]);

        // Upload via ServiceClass (S3)
        if ($request->hasFile('favicon')) {
            $validated['favicon'] = ServiceClass::uploadFile($request->file('favicon'), 'setting/favicon');
        }
        if ($request->hasFile('header_logo')) {
            $validated['header_logo'] = ServiceClass::uploadFile($request->file('header_logo'), 'setting/header-logo');
        }
        if ($request->hasFile('footer_logo')) {
            $validated['footer_logo'] = ServiceClass::uploadFile($request->file('footer_logo'), 'setting/footer-logo');
        }

        Setting::create($validated);

        return to_route('admin.settings.index')->with('success', 'Setting created successfully.');
    }

    public function edit($id)
    {
        $langs = Language::active()->get();
        $setting = Setting::findOrFail($id);

        // Optional URLs for frontend preview
        $setting->favicon_url = ServiceClass::getFileUrl($setting->favicon);
        $setting->header_logo_url = ServiceClass::getFileUrl($setting->header_logo);
        $setting->footer_logo_url = ServiceClass::getFileUrl($setting->footer_logo);

        return Inertia::render('Settings/Edit', [
            'setting' => $setting,
            'langs' => $langs,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'header_title' => 'required|string|max:255',
            'footer_title' => 'required|string|max:255',
            'footer_content' => 'required|string',
            'favicon' => 'nullable|image',
            'header_logo' => 'nullable|image',
            'footer_logo' => 'nullable|image',
            'lang_id' => 'nullable|integer',
        ]);

        $setting = Setting::findOrFail($id);

        // Replace files via ServiceClass (delete old + upload new)
        if ($request->hasFile('favicon')) {
            $validated['favicon'] = ServiceClass::updateFile(
                $request->file('favicon'),
                'setting/favicon',
                $setting->favicon
            );
        } else {
            unset($validated['favicon']);
        }

        if ($request->hasFile('header_logo')) {
            $validated['header_logo'] = ServiceClass::updateFile(
                $request->file('header_logo'),
                'setting/header-logo',
                $setting->header_logo
            );
        } else {
            unset($validated['header_logo']);
        }

        if ($request->hasFile('footer_logo')) {
            $validated['footer_logo'] = ServiceClass::updateFile(
                $request->file('footer_logo'),
                'setting/footer-logo',
                $setting->footer_logo
            );
        } else {
            unset($validated['footer_logo']);
        }

        $setting->update($validated);

        return to_route('admin.settings.index')->with('success', 'Setting updated successfully.');
    }

    public function destroy($id)
    {
        $setting = Setting::findOrFail($id);

        // Delete files via ServiceClass
        ServiceClass::deleteFile($setting->favicon);
        ServiceClass::deleteFile($setting->header_logo);
        ServiceClass::deleteFile($setting->footer_logo);

        $setting->delete();

        return to_route('admin.settings.index')->with('success', 'Setting deleted successfully.');
    }

    // =========================
    // SLIDER SECTION
    // =========================

    public function sliderIndex(Request $request)
    {
        $query = SliderSection::with('language')->latest();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('subtitle', 'like', '%' . $search . '%');
            });
        }

        $sliders = $query->paginate($request->get('per_page', 10))->withQueryString();

        $sliders->getCollection()->transform(function ($s) {
            $s->image_url = ServiceClass::getFileUrl($s->image_path);
            $s->is_full_width_image = (bool) $s->is_full_width_image;

            return $s;
        });

        return Inertia::render('Settings/SliderSection/Index', [
            'sliders' => $sliders,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function sliderCreate()
    {
        $langs = Language::active()->get();

        return Inertia::render('Settings/SliderSection/Create', [
            'langs' => $langs,
        ]);
    }

    public function sliderStore(Request $request)
    {
        logger()->info('Slider Store Request Data:', $request->all());

        $validator = \Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image_path' => 'required|image',
            'background_color' => 'nullable|string|max:20',
            'is_full_width_image' => 'nullable|boolean',
            'link' => 'nullable|string|max:255',
            'lang_id' => 'nullable',
        ]);

        if ($validator->fails()) {
            logger()->error('Slider Validation Failed', [
                'errors' => $validator->errors()->toArray(),
                'data' => $request->all(),
            ]);

            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();

        $imagePath = ServiceClass::uploadFile($request->file('image_path'), 'slider');

        if (!$imagePath) {
            return back()->with('error', 'Failed to upload image. Please try again.');
        }

        SliderSection::create([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'image_path' => $imagePath,
            'background_color' => $validated['background_color'] ?? null,
            'is_full_width_image' => $request->boolean('is_full_width_image'),
            'link' => $validated['link'] ?? config('app.url'),
            'lang_id' => $validated['lang_id'] ?? null,
        ]);

        return to_route('admin.settings.slider.index')
            ->with('success', 'Slider section created successfully.');
    }

    public function sliderEdit($id)
    {
        $langs = Language::active()->get();
        $slider = SliderSection::findOrFail($id);

        $slider->image_url = ServiceClass::getFileUrl($slider->image_path);
        $slider->is_full_width_image = (bool) $slider->is_full_width_image;

        return Inertia::render('Settings/SliderSection/Edit', [
            'slider' => $slider,
            'langs' => $langs,
        ]);
    }

    public function sliderUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'image_path' => 'nullable|image',
            'background_color' => 'nullable|string|max:20',
            'is_full_width_image' => 'nullable|boolean',
            'link' => 'nullable|string|max:255',
            'lang_id' => 'nullable|integer',
        ]);

        $slider = SliderSection::findOrFail($id);

        if ($request->hasFile('image_path')) {
            $validated['image_path'] = ServiceClass::updateFile(
                $request->file('image_path'),
                'slider',
                $slider->image_path
            );
        } else {
            unset($validated['image_path']);
        }

        $slider->update([
            'title' => $validated['title'],
            'subtitle' => $validated['subtitle'] ?? null,
            'image_path' => $validated['image_path'] ?? $slider->image_path,
            'background_color' => $validated['background_color'] ?? $slider->background_color,
            'is_full_width_image' => $request->boolean('is_full_width_image'),
            'link' => $validated['link'] ?? $slider->link,
            'lang_id' => $validated['lang_id'] ?? $slider->lang_id,
        ]);

        return to_route('admin.settings.slider.index')
            ->with('success', 'Slider section updated successfully.');
    }

    public function sliderDestroy($id)
    {
        $slider = SliderSection::findOrFail($id);

        ServiceClass::deleteFile($slider->image_path);

        $slider->delete();

        return to_route('admin.settings.slider.index')
            ->with('success', 'Slider section deleted successfully.');
    }

    // =========================
    // CONTACT INFO
    // =========================

    public function contactInfoIndex()
    {
        $contactInfo = ContactInfo::latest()->get();

        return Inertia::render('Settings/ContactInfo/Index', [
            'contactInfo' => $contactInfo,
        ]);
    }

    public function contactInfoCreate()
    {
        if (ContactInfo::count() >= 1) {
            return to_route('admin.settings.contactinfo.index')->with('error', 'Only one contact info is allowed.');
        }

        return Inertia::render('Settings/ContactInfo/Create');
    }

    public function contactInfoStore(Request $request)
    {
        if (ContactInfo::count() >= 1) {
            return to_route('admin.settings.contactinfo.index')->with('error', 'Only one contact info is allowed.');
        }

        $validated = $request->validate([
            'email_one' => 'required|email|max:255',
            'phone_one' => 'required|string|max:20',
            'phone_two' => 'nullable|string|max:20',
            'email_two' => 'nullable|email|max:255',
            'city' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:50',
        ]);

        ContactInfo::create([
            'phone_one' => $validated['phone_one'],
            'phone_two' => $validated['phone_two'] ?? null,
            'email_one' => $validated['email_one'],
            'email_two' => $validated['email_two'] ?? null,
            'address' => [
                'street' => $validated['street'] ?? null,
                'state' => $validated['state'] ?? null,
                'city' => $validated['city'] ?? null,
                'zip' => $validated['zip'] ?? null,
            ],
        ]);

        return to_route('admin.settings.contactinfo.index')->with('success', 'Contact information updated successfully.');
    }

    public function contactInfoEdit($id)
    {
        $contactinfo = ContactInfo::findOrFail($id);

        return Inertia::render('Settings/ContactInfo/Edit', [
            'contactInfo' => [
                'id' => $contactinfo->id,
                'phone_one' => $contactinfo->phone_one,
                'phone_two' => $contactinfo->phone_two,
                'email_one' => $contactinfo->email_one,
                'email_two' => $contactinfo->email_two,
                'address' => [
                    'street' => $contactinfo->address['street'] ?? null,
                    'city' => $contactinfo->address['city'] ?? null,
                    'state' => $contactinfo->address['state'] ?? null,
                    'zip' => $contactinfo->address['zip'] ?? null,
                ],
            ],
        ]);
    }

    public function contactInfoUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'phone_one' => 'required|string|max:20',
            'phone_two' => 'nullable|string|max:20',
            'email_one' => 'required|email|max:255',
            'email_two' => 'nullable|email|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:50',
        ]);

        $contactInfo = ContactInfo::findOrFail($id);

        $contactInfo->update([
            'phone_one' => $validated['phone_one'],
            'phone_two' => $validated['phone_two'] ?? null,
            'email_one' => $validated['email_one'],
            'email_two' => $validated['email_two'] ?? null,
            'address' => [
                'street' => $validated['street'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'zip' => $validated['zip'] ?? null,
            ],
        ]);

        return to_route('admin.settings.contactinfo.index')->with('success', 'Contact information updated successfully.');
    }

    public function contactInfoDestroy($id)
    {
        $contactInfo = ContactInfo::findOrFail($id);
        $contactInfo->delete();

        return to_route('admin.settings.contactinfo.index')->with('success', 'Contact information deleted successfully.');
    }

    // =========================
    // FEEDBACK
    // =========================

    public function feedbackIndex()
    {
        $feedbacks = Feedback::latest()->paginate(20)->withQueryString();

        return Inertia::render('Settings/Feedback/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }

    public function feedbackCreate()
    {
        return Inertia::render('Settings/FeedbackCreate');
    }

    public function feedbackStore(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
        ]);

        Feedback::create($validated);

        return to_route('admin.settings.feedback.index')->with('success', 'Feedback created successfully.');
    }

    public function feedbackEdit($id)
    {
        $feedback = Feedback::findOrFail($id);

        return Inertia::render('Settings/FeedbackEdit', [
            'feedback' => $feedback,
        ]);
    }

    public function feedbackUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
        ]);

        $feedback = Feedback::findOrFail($id);
        $feedback->update($validated);

        return to_route('admin.settings.feedback.index')->with('success', 'Feedback updated successfully.');
    }

    public function feedbackDestroy($id)
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->delete();

        return to_route('admin.settings.feedback.index')->with('success', 'Feedback deleted successfully.');
    }

    // =========================
    // SOCIAL LINKS
    // =========================

    public function socialLinkIndex()
    {
        $socialLinks = Social::latest()->paginate(10)->withQueryString();

        return Inertia::render('Settings/SocialSection/Index', [
            'socialLinks' => $socialLinks,
        ]);
    }

    public function socialLinkCreate()
    {
        return Inertia::render('Settings/SocialSection/Create');
    }

    public function socialLinkStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'url' => 'required|url|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        Social::create($validated);

        return to_route('admin.settings.sociallinks.index')->with('success', 'Social link created successfully.');
    }

    public function socialLinkEdit($id)
    {
        $socialLink = Social::findOrFail($id);

        return Inertia::render('Settings/SocialSection/Edit', [
            'socialLink' => $socialLink,
        ]);
    }

    public function socialLinkUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'url' => 'required|url|max:255',
            'icon' => 'nullable|string|max:255',
        ]);

        $socialLink = Social::findOrFail($id);
        $socialLink->update($validated);

        return to_route('admin.settings.sociallinks.index')->with('success', 'Social link updated successfully.');
    }

    public function socialLinkDestroy($id)
    {
        $socialLink = Social::findOrFail($id);
        $socialLink->delete();

        return to_route('admin.settings.sociallinks.index')->with('success', 'Social link deleted successfully.');
    }
}

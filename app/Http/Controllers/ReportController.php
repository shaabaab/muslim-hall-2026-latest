<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Notifications\NewReportNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class ReportController extends Controller
{

    public function index(Request $request)
    {
        $highlightId = $request->query('highlight');
        $reports = Report::with(['user', 'handler', 'reportable', 'category'])
            ->when($request->filled('status'), function ($query) use ($request) {
                return $query->where('status', $request->status);
            })
            ->when($request->filled('type'), function ($query) use ($request) {
                return $query->where('report_type', $request->type);
            })
            ->latest()
            ->paginate(20);

        // Load post details for post reports
        $reports->transform(function ($report) {
            if ($report->reportable_type === 'App\Models\Post' && $report->reportable) {
                $report->reportable->load('category'); // load category on the post
                $report->post = $report->reportable;
            }
            return $report;
        });

        $entry_reports = $reports->filter(function ($report) {
            return $report->reportable_type === 'App\Models\Entry';
        })->transform(function ($report) {
            if ($report->reportable_type === 'App\Models\Entry' && $report->reportable) {
                $report->entry = $report->reportable; // Already loaded via with()
            }
            return $report;
        });
        // dd([
        //     'reportable' => $entry_reports->first()->reportable,
        //     'entry' => $entry_reports->first()->entry,
        //     'reportable_id' => $entry_reports->first()->reportable_id,
        // ]);

        //    dd($reports->first()->reportable->category);

        return Inertia::render('Report/Index', [
            'reports' => $reports,
            'entry_reports' => $entry_reports,
            'highlightId' => $highlightId,

            'filters' => $request->only(['status', 'type']),
        ]);
    }

    /**
     * Show the form for creating a new report.
     */
    public function create($type, $id)
    {
        $reportable = $this->getReportable($type, $id);

        if (!$reportable) {
            return redirect()->back()->with('error', 'Content not found.');
        }

        return Inertia::render('Report/Create', [
            'reportable' => $reportable,
            'reportType' => $type,
            'reportableId' => $id,
        ]);
    }

    /**
     * Store a newly created report in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:500',
            'report_type' => 'required|string|in:post,comment,entry',
            'reportable_id' => 'required|integer',
            'reportable_type' => 'required|string',
        ]);

        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please login to report content.');
        }

        // Check if user has already reported this item
        if (
            Report::hasUserReported(
                Auth::id(),
                $request->reportable_id,
                $this->getMorphClass($request->report_type)
            )
        ) {
            return back()->with('error', 'You have already reported this content.');
        }

        // Create report
        $report = Report::create([
            'reason' => $request->reason,
            'report_type' => $request->report_type,
            'reportable_id' => $request->reportable_id,
            'reportable_type' => $this->getMorphClass($request->report_type),
            'user_id' => Auth::id(),
            'status' => 'pending',
        ]);

        // Notify Admins
        $admins = User::whereHas('roles', function ($q) {
            $q->where('name', 'admin')->orWhere('name', 'Super Admin');
        })->get();

        Notification::send($admins, new NewReportNotification($report));

        return back()->with('success', 'Thank you for your report. Our team will review it shortly.');
    }

    /**
     * Display the user's reports.
     */
    public function myReports()
    {
        $reports = Report::with(['reportable'])
            ->where('user_id', Auth::id())
            ->latest()
            ->paginate(10);

        return Inertia::render('Report/MyReports', [
            'reports' => $reports,
        ]);
    }

    /**
     * Admin: List all reports
     */
    // public function index(Request $request)
    // {
    //     $this->authorize('viewAny', Report::class);

    //     $reports = Report::with(['user', 'handler', 'reportable'])
    //         ->when($request->filled('status'), function ($query) use ($request) {
    //             return $query->where('status', $request->status);
    //         })
    //         ->when($request->filled('type'), function ($query) use ($request) {
    //             return $query->where('report_type', $request->type);
    //         })
    //         ->latest()
    //         ->paginate(20);

    //     return Inertia::render('Report/Admin/Index', [
    //         'reports' => $reports,
    //         'filters' => $request->only(['status', 'type']),
    //     ]);
    // }

    /**
     * Admin: Update report status
     */
    public function updateStatus(Request $request, Report $report)
    {
        // $this->authorize('update', $report);

        $request->validate([
            'status' => 'required|in:pending,reviewed,resolved',
            'admin_note' => 'nullable|string|max:500',
        ]);

        $report->update([
            'status' => $request->status,
            'admin_note' => $request->admin_note,
            'handled_by' => Auth::id(),
        ]);

        return back()->with('success', 'Report status updated successfully.');
    }

    /**
     * Admin: Delete a report
     */
    public function destroy(Report $report)
    {
        DB::beginTransaction();

        try {
            DB::table('notifications')
                ->where('type', NewReportNotification::class)
                ->where('data->report_id', $report->id)
                ->delete();

            $report->forceDelete();

            DB::commit();

            return back()->with('success', 'Report permanently deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Report Delete Error: ' . $e->getMessage());

            return back()->with('error', 'Error deleting report.');
        }
    }

    /**
     * Helper: Get reportable item
     */
    private function getReportable($type, $id)
    {
        switch ($type) {
            case 'post':
                return Post::find($id);

            case 'entry':
                return Entry::find($id);

                // Add other types as needed (comment, user, etc.)
            default:
                return null;
        }
    }

    /**
     * Helper: Get morph class
     */
    private function getMorphClass($type)
    {
        switch ($type) {
            case 'post':
                return Post::class;
            case 'entry':
                return Entry::class;
            default:
                return null;
        }
    }
}

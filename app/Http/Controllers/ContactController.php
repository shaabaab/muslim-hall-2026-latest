<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ContactController extends Controller
{
    /**
     * Display the contact page.
     */
    public function index()
    {
        return Inertia::render('Front/Contact');
    }

    /**
     * Store a newly created contact message.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10|max:2000',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        Contact::create($request->only(['name', 'email', 'phone', 'subject', 'message']));

        return redirect()->back()->with('success', 'Thank you for your message! We will get back to you soon.');
    }

    /**
     * Admin: List all contact messages
     */
    public function adminIndex(Request $request)
    {
        $contacts = Contact::with('repliedBy')
            ->when($request->filled('search'), function ($query) use ($request) {
                return $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%')
                        ->orWhere('subject', 'like', '%' . $request->search . '%');
                });
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                return $query->where('status', $request->status);
            })
            ->latest()
            ->paginate(20);

        $stats = [
            'total' => Contact::count(),
            'unread' => Contact::unread()->count(),
            'read' => Contact::read()->count(),
            'replied' => Contact::replied()->count(),
            'archived' => Contact::archived()->count(),
        ];

        return Inertia::render('Contact/Index', [
            'contacts' => $contacts,
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats,
        ]);
    }

    /**
     * Admin: Show contact message details
     */
    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);

        // Mark as read if it's unread
        if ($contact->status === 'unread') {
            $contact->markAsRead();
            $contact->refresh();
        }

        $contact->load('repliedBy');

        return Inertia::render('Contact/Admin/Show', [
            'contact' => $contact,
        ]);
    }

    /**
     * Admin: Update contact status
     */
    public function updateStatus(Request $request, Contact $contact)
    {
        $this->authorize('update', $contact);

        $request->validate([
            'status' => 'required|in:unread,read,replied,archived',
            'admin_note' => 'nullable|string|max:1000',
        ]);

        switch ($request->status) {
            case 'replied':
                $contact->markAsReplied(Auth::id(), $request->admin_note);
                break;
            case 'archived':
                $contact->markAsArchived();
                break;
            case 'read':
                $contact->markAsRead();
                break;
            case 'unread':
                $contact->update([
                    'status' => 'unread',
                    'read_at' => null,
                    'replied_at' => null,
                    'replied_by' => null,
                ]);
                break;
        }

        return back()->with('success', 'Contact status updated successfully.');
    }

    /**
     * Admin: Send reply email
     */
    public function sendReply(Request $request, Contact $contact)
    {
        $this->authorize('update', $contact);

        $request->validate([
            'reply_subject' => 'required|string|max:255',
            'reply_message' => 'required|string|min:10|max:2000',
        ]);

        // Here you would typically send an email
        // For example:
        // Mail::to($contact->email)->send(new ContactReplyMail($request->all()));

        $contact->markAsReplied(Auth::id(), $request->reply_message);

        return back()->with('success', 'Reply sent successfully.');
    }

    /**
     * Admin: Delete contact message
     */
    public function destroy(Contact $contact)
    {
        $contact->delete();

        return redirect()->route('admin.contacts.index')->with('success', 'Contact message deleted successfully.');
    }

    /**
     * Admin: Bulk actions
     */
    public function bulkAction(Request $request)
    {
        $this->authorize('delete', Contact::class);

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:contacts,id',
            'action' => 'required|in:delete,mark_read,mark_replied,mark_archived',
        ]);

        $contacts = Contact::whereIn('id', $request->ids)->get();

        foreach ($contacts as $contact) {
            switch ($request->action) {
                case 'delete':
                    $contact->delete();
                    break;
                case 'mark_read':
                    $contact->markAsRead();
                    break;
                case 'mark_replied':
                    $contact->markAsReplied(Auth::id());
                    break;
                case 'mark_archived':
                    $contact->markAsArchived();
                    break;
            }
        }

        return back()->with('success', 'Bulk action completed successfully.');
    }
}
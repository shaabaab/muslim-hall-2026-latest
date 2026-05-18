<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewReportNotification extends Notification
{
    use Queueable;

    protected $report;

    /**
     * Create a new notification instance.
     */
    public function __construct($report)
    {
        $this->report = $report;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'report',
            'id' => $this->report->id,
            'reason' => $this->report->reason,
            'user_name' => $this->report->user?->name ?? 'Anonymous',
            'link' => route('admin.reports.index',[
                'highlight' => $this->report->id
            ]), // Link to reports list
            'message' => 'New report received: ' . $this->report->reason,
             'report_id' => $this->report->id,
        'reportable_id' => $this->report->reportable_id,
        'reportable_type' => $this->report->reportable_type,
        ];
    }
}

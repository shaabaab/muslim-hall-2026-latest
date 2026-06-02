<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PostApprovedNotification extends Notification
{
    use Queueable;

    protected $post;

    /**
     * Create a new notification instance.
     */
    public function __construct($post)
    {
        $this->post = $post;
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
            'type' => 'post_approved',
            'id' => $this->post->id,
            'title' => $this->post->title,
            'link' => route('post-detail', $this->post->slug),
            'message' => 'Your post "' . $this->post->title . '" has been approved!',
            'post_id' => $this->post->id,
        ];
    }
}

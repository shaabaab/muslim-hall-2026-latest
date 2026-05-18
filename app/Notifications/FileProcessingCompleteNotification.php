<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FileProcessingCompleteNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $postTitle,
        public readonly int    $postId,
        public readonly string $fileType  // 'video' | 'audio' | 'pdf'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'file_processing_complete',
            'post_id'    => $this->postId,
            'post_title' => $this->postTitle,
            'file_type'  => $this->fileType,
            'message'    => "Your {$this->fileType} for \"{$this->postTitle}\" has finished uploading.",
            'link'       => route('admin.posts.show', $this->postId),
        ];
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class PostCommentNotification extends Notification
{
    use Queueable;

    protected $comment;
    protected $post;
    protected $commentUser;

    public function __construct($comment, $post, $commentUser)
    {
        $this->comment = $comment;
        $this->post = $post;
        $this->commentUser = $commentUser;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'comment',
            'message' => $this->commentUser->name . ' commented on your post',
            'comment_id' => $this->comment->id,
            'post_id' => $this->post->id,
            'post_title' => $this->post->title,
            'user_name' => $this->commentUser->name,
            'comment_text' => Str::limit($this->comment->comment, 50),
            'link' => url('/post-detail/' . $this->post->slug),
        ];
    }
}
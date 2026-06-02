<?php

namespace App\Services;

use App\Models\Contest;
use App\Models\ContestFee;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class EntryService
{
    public function store(Contest $contest, array $data)
    {
        // ── Check if user already submitted ─────────────────────
        if ($contest->entries()->where('user_id', Auth::id())->exists()) {
            throw new \Exception('You have already submitted an entry for this contest.');
        }

        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->exists();

        $contestPayment = ContestFee::where('contest_id', $contest->id)
            ->where('user_id', Auth::id())
            ->where('status', 'completed')
            ->exists();

        // ── Payment/User type validations ───────────────────────
        if ($contest->payment_type == Contest::PAYMENT_PAID && $contest->user_type == Contest::USER_TYPE_ALL) {
            if (!$isMember && !$contestPayment) {
                throw new \Exception('You have to pay the contest fee to submit an entry for this contest.');
            }
        }

        if ($contest->user_type == Contest::USER_TYPE_MEMBER && !$isMember) {
            throw new \Exception('This contest is only for member users. You must be a member to submit.');
        }

        if ($contest->user_type == Contest::USER_TYPE_USER && $isMember) {
            throw new \Exception('This contest is only for general users.');
        }

        // ── Store single files (thumbnail, image, pdf, audio, video) ─────
        $thumbnail = ($data['thumbnail'] ?? null) instanceof UploadedFile
            ? $data['thumbnail']->store('Contest/thumbnails', 'public')
            : null;

        $image = ($data['image'] ?? null) instanceof UploadedFile
            ? $data['image']->store('Contest/images', 'public')
            : null;

        $video = ($data['video'] ?? null) instanceof UploadedFile
            ? $data['video']->store('Contest/videos', 'public')
            : null;

        $audio = ($data['audio'] ?? null) instanceof UploadedFile
            ? $data['audio']->store('Contest/audio', 'public')
            : null;

        $pdf = ($data['pdf'] ?? null) instanceof UploadedFile
            ? $data['pdf']->store('Contest/pdfs', 'public')
            : null;

        // ── Optional existing media_path ─────────────────────────
        $mediaPath = isset($data['media_path']) && $data['media_path'] instanceof UploadedFile
            ? $data['media_path']->store('Contest/entries', 'public')
            : null;

        // ── Create entry ─────────────────────────────────────────
        $entry = $contest->entries()->create([
            'contest_id' => $contest->id,
            'user_id'    => Auth::id(),
            'title'      => $data['title'] ?? 'Untitled',
            'content'    => $data['content'] ?? null,
            'media_path' => $mediaPath,
            'status'     => 'pending',
            'thumbnail'  => $thumbnail,
            'image'      => $image,
            'video'      => $video,
            'audio'      => $audio,
            'pdf'        => $pdf,
        ]);

        // ── Store gallery images ────────────────────────────────
        if (!empty($data['images']) && is_array($data['images'])) {
            foreach ($data['images'] as $galleryImage) {
                if ($galleryImage instanceof UploadedFile) {
                    $galleryPath = $galleryImage->store('Contest/gallery', 'public');
                    \App\Models\EntryImage::create([
                        'entries_id' => $entry->id,
                        'image'      => $galleryPath,
                    ]);
                }
            }
        }

        return $entry;
    }
}

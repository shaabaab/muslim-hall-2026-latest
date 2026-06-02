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
        $hasPaymentInfo = !empty($data['payment_info']['transactionId']);

        if ($contest->payment_type == Contest::PAYMENT_PAID && !$contestPayment && !$hasPaymentInfo) {
            throw new \Exception('You have to pay the contest fee to submit an entry for this contest.');
        }

        if ($contest->user_type == Contest::USER_TYPE_MEMBER && !$isMember) {
            throw new \Exception('This contest is only for member users. You must be a member to submit.');
        }

        // ── Create ContestFee record if fake payment was used ───────
        if ($hasPaymentInfo && !$contestPayment) {
            ContestFee::create([
                'contest_id'     => $contest->id,
                'user_id'        => Auth::id(),
                'amount'         => $contest->amount,
                'payment_method' => $data['payment_info']['method'] ?? 'unknown',
                'transaction_id' => $data['payment_info']['transactionId'],
                'status'         => 'completed',
            ]);
        }

        // ── Paid contest deposit logic ──────────────────────────
        if ($contest->payment_type == Contest::PAYMENT_PAID) {
            $creator = $contest->creator;
            if ($creator) {
                $creator->increment('deposit', $contest->amount);
            }
        }

        // ── Store single files (thumbnail only — small) ──────────────────
        $thumbnail = ($data['thumbnail'] ?? null) instanceof UploadedFile
            ? ServiceClass::uploadFile($data['thumbnail'], 'entries/thumbnails')
            : null;

        $image = ($data['image'] ?? null) instanceof UploadedFile
            ? ServiceClass::uploadFile($data['image'], 'entries/images')
            : null;

        // Large files — set 'processing' placeholder; uploaded in background after entry is created
        $video = (($data['video'] ?? null) instanceof UploadedFile || !empty($data['video_temp_path'])) ? 'processing' : null;
        $audio = (($data['audio'] ?? null) instanceof UploadedFile || !empty($data['audio_temp_path'])) ? 'processing' : null;
        $pdf   = (($data['pdf']   ?? null) instanceof UploadedFile || !empty($data['pdf_temp_path'])) ? 'processing' : null;


        // ── Optional existing media_path ─────────────────────────
        $mediaPath = isset($data['media_path']) && $data['media_path'] instanceof UploadedFile
            ? $data['media_path']->store('entries', 'public')
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
                    $galleryPath = ServiceClass::uploadFile($galleryImage, 'entries/gallery');
                    \App\Models\EntryImage::create([
                        'entries_id' => $entry->id,
                        'image'      => $galleryPath,
                    ]);
                }
            }
        }

        // ── Dispatch background jobs for large files ────────────────────
        if (($data['video'] ?? null) instanceof UploadedFile) {
            ServiceClass::uploadLargeFile($data['video'], 'entries/videos', 'entries', 'video', $entry->id);
        } elseif (!empty($data['video_temp_path'])) {
            ServiceClass::dispatchLargeFileJob($data['video_temp_path'], 'entries/videos', 'entries', 'video', $entry->id);
        }

        if (($data['audio'] ?? null) instanceof UploadedFile) {
            ServiceClass::uploadLargeFile($data['audio'], 'entries/audio', 'entries', 'audio', $entry->id);
        } elseif (!empty($data['audio_temp_path'])) {
            ServiceClass::dispatchLargeFileJob($data['audio_temp_path'], 'entries/audio', 'entries', 'audio', $entry->id);
        }

        if (($data['pdf'] ?? null) instanceof UploadedFile) {
            ServiceClass::uploadLargeFile($data['pdf'], 'entries/pdfs', 'entries', 'pdf', $entry->id);
        } elseif (!empty($data['pdf_temp_path'])) {
            ServiceClass::dispatchLargeFileJob($data['pdf_temp_path'], 'entries/pdfs', 'entries', 'pdf', $entry->id);
        }

        return $entry;
    }
}

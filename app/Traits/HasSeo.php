<?php

namespace App\Traits;

use App\Models\Seo;
use App\Services\ServiceClass;
use Illuminate\Support\Facades\Log;

/**
 * HasSeo Trait (ServiceClass based)
 *
 * Assumes ServiceClass has:
 * - uploadFile(UploadedFile $file, string $dir): ?string
 * - updateFile(UploadedFile $file, string $dir, ?string $oldPath): ?string
 * - deleteFile(?string $path): void|bool
 * - getFileUrl(?string $path): ?string
 */
trait HasSeo
{
    protected static function bootHasSeo()
    {
        static::created(function ($model) {
            self::handleSeoCreation($model);
        });

        static::updated(function ($model) {
            self::handleSeoUpdate($model);
        });

        static::deleting(function ($model) {
            if ($model->seo) {
                // delete SEO images from storage (S3/local) via ServiceClass
                ServiceClass::deleteFile($model->seo->og_image);
                ServiceClass::deleteFile($model->seo->twitter_image);

                $model->seo->delete();
            }
        });
    }

    /**
     * Handle SEO creation
     */
    private static function handleSeoCreation($model): void
    {
        $request = request();

        // Build slug fallback
        $slug = $model->slug ?? strtolower(str_replace(' ', '-', $model->name ?? $model->title ?? 'item'));

        // meta_keywords -> always JSON string
        $metaKeywords = self::normalizeKeywords($request->input('meta_keywords'), [
            'Muslim Hall',
            $model->title ?? $model->name ?? '',
        ]);

        // focus_keywords -> JSON string
        $focusKeywords = self::normalizeKeywords($request->input('focus_keywords'), []);

        // structured_data -> JSON string
        $structuredData = self::normalizeStructuredData($request->input('structured_data', []));

        // Images (uploaded first, else fallbacks)
        $ogImagePath = null;
        if ($request->hasFile('og_image')) {
            $ogImagePath = self::uploadSeoImage($request->file('og_image'), 'seo/og_images');
        } else {
            $ogImagePath = $model->img ?? $model->photo ?? $model->image ?? null;
        }

        $twitterImagePath = null;
        if ($request->hasFile('twitter_image')) {
            $twitterImagePath = self::uploadSeoImage($request->file('twitter_image'), 'seo/twitter_images');
        } else {
            $twitterImagePath = $ogImagePath ?? $model->img ?? $model->photo ?? $model->image ?? null;
        }

        $model->seo()->create([
            // Meta
            'meta_title'        => $request->input('meta_title', $model->name ?? $model->title),
            'meta_description'  => $request->input('meta_description', $request->input('description', $model->description ?? $model->content)),
            'meta_keywords'     => $metaKeywords,
            'meta_robots'       => $request->input('meta_robots', 'index, follow'),

            // OG
            'og_title'          => $request->input('og_title', $model->name ?? $model->title),
            'og_description'    => $request->input('og_description', $request->input('description', $model->description ?? $model->content)),
            'og_image'          => $ogImagePath,
            'og_type'           => $request->input('og_type', 'website'),
            'og_url'            => $request->input('og_url', url('/' . strtolower(class_basename($model)) . '/' . $slug)),
            'og_site_name'      => $request->input('og_site_name', config('app.name', 'Muslim Hall')),

            // Twitter
            'twitter_title'       => $request->input('twitter_title', $model->name ?? $model->title),
            'twitter_description' => $request->input('twitter_description', $request->input('description', $model->description ?? $model->content)),
            'twitter_card'        => $request->input('twitter_card', 'summary_large_image'),
            'twitter_site'        => $request->input('twitter_site', '@muslimHall'),
            'twitter_creator'     => $request->input('twitter_creator', '@muslimHall'),
            'twitter_image'       => $twitterImagePath,
            'twitter_url'         => $request->input('twitter_url', url('/' . strtolower(class_basename($model)) . '/' . $slug)),

            // Canonical & JSON fields
            'canonical_url'     => $request->input('canonical_url', url('/' . strtolower(class_basename($model)) . '/' . $slug)),
            'structured_data'   => $structuredData,
            'focus_keywords'    => $focusKeywords,
        ]);
    }

    /**
     * Handle SEO update
     */
    private static function handleSeoUpdate($model): void
    {
        $request = request();

        $hasSeoFiles = $request->hasFile('og_image') || $request->hasFile('twitter_image');

        $hasSeoData = $hasSeoFiles || $request->hasAny([
            'meta_title',
            'meta_description',
            'meta_keywords',
            'meta_robots',
            'og_title',
            'og_description',
            'og_type',
            'og_url',
            'og_site_name',
            'twitter_title',
            'twitter_description',
            'twitter_card',
            'twitter_site',
            'twitter_creator',
            'twitter_url',
            'canonical_url',
            'structured_data',
            'focus_keywords',
        ]);

        if (!$hasSeoData) {
            return;
        }

        $slug = $model->slug ?? strtolower(str_replace(' ', '-', $model->name ?? $model->title ?? 'item'));

        $seoData = [];

        // keywords
        if ($request->has('meta_keywords')) {
            $seoData['meta_keywords'] = self::normalizeKeywords($request->input('meta_keywords'), null);
        }
        if ($request->has('focus_keywords')) {
            $seoData['focus_keywords'] = self::normalizeKeywords($request->input('focus_keywords'), null);
        }

        // structured_data
        if ($request->has('structured_data')) {
            $seoData['structured_data'] = self::normalizeStructuredData($request->input('structured_data', []));
        }

        // files (delete old + upload new) via ServiceClass
        if ($request->hasFile('og_image')) {
            $old = $model->seo?->og_image;
            $new = self::updateSeoImage($request->file('og_image'), 'seo/og_images', $old);
            if ($new) $seoData['og_image'] = $new;
        }

        if ($request->hasFile('twitter_image')) {
            $old = $model->seo?->twitter_image;
            $new = self::updateSeoImage($request->file('twitter_image'), 'seo/twitter_images', $old);
            if ($new) $seoData['twitter_image'] = $new;
        }

        // normal fields
        $seoFields = [
            'meta_title',
            'meta_description',
            'meta_robots',
            'og_title',
            'og_description',
            'og_type',
            'og_url',
            'og_site_name',
            'twitter_title',
            'twitter_description',
            'twitter_card',
            'twitter_site',
            'twitter_creator',
            'twitter_url',
            'canonical_url',
        ];

        foreach ($seoFields as $field) {
            if ($request->has($field)) {
                $seoData[$field] = $request->input($field);
            }
        }

        // Update or create
        if ($model->seo) {
            $model->seo->update($seoData);
        } else {
            $defaultSeoData = [
                'meta_title'        => $model->name ?? $model->title,
                'meta_description'  => $model->description ?? $model->content,
                'meta_keywords'     => json_encode(['Muslim Hall', $model->title ?? $model->name]),
                'meta_robots'       => 'index, follow',
                'og_title'          => $model->name ?? $model->title,
                'og_description'    => $model->description ?? $model->content,
                'og_type'           => 'website',
                'og_url'            => url('/' . strtolower(class_basename($model)) . '/' . $slug),
                'og_site_name'      => config('app.name', 'Muslim Hall'),
                'twitter_title'       => $model->name ?? $model->title,
                'twitter_description' => $model->description ?? $model->content,
                'twitter_card'        => 'summary_large_image',
                'twitter_site'        => '@muslimHall',
                'twitter_creator'     => '@muslimHall',
                'twitter_url'         => url('/' . strtolower(class_basename($model)) . '/' . $slug),
                'canonical_url'     => url('/' . strtolower(class_basename($model)) . '/' . $slug),
                'structured_data'   => json_encode([]),
                'focus_keywords'    => json_encode([]),
            ];

            $model->seo()->create(array_merge($defaultSeoData, $seoData));
        }
    }

    /**
     * Upload SEO image using ServiceClass
     */
    private static function uploadSeoImage($file, string $dir): ?string
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }
            return ServiceClass::uploadFile($file, $dir);
        } catch (\Throwable $e) {
            Log::error('SEO upload image failed', [
                'dir' => $dir,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Update SEO image using ServiceClass (delete old + upload new)
     */
    private static function updateSeoImage($file, string $dir, ?string $oldPath): ?string
    {
        try {
            if (!$file || !$file->isValid()) {
                return null;
            }
            return ServiceClass::updateFile($file, $dir, $oldPath);
        } catch (\Throwable $e) {
            Log::error('SEO update image failed', [
                'dir' => $dir,
                'old' => $oldPath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Relationship
     */
    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    /**
     * Helpers
     */
    private static function normalizeKeywords($input, ?array $default): string
    {
        if (is_array($input)) {
            $arr = array_values(array_filter(array_map('trim', $input)));
            return json_encode($arr);
        }

        if (is_string($input)) {
            $input = trim($input);
            if ($input === '') {
                return json_encode($default ?? []);
            }

            if (self::isJson($input)) {
                return $input;
            }

            $arr = array_values(array_filter(array_map('trim', explode(',', $input))));
            return json_encode($arr);
        }

        return json_encode($default ?? []);
    }

    private static function normalizeStructuredData($input): string
    {
        if (is_string($input)) {
            // If user passes a JSON string, keep it if valid
            return self::isJson($input) ? $input : json_encode([]);
        }

        if (is_array($input) || is_object($input)) {
            return json_encode($input);
        }

        return json_encode([]);
    }

    private static function isJson($string): bool
    {
        if (!is_string($string)) return false;
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Accessors (URL via ServiceClass)
     */
    public function getOgImageUrlAttribute(): ?string
    {
        return $this->seo && $this->seo->og_image
            ? ServiceClass::getFileUrl($this->seo->og_image)
            : null;
    }

    public function getTwitterImageUrlAttribute(): ?string
    {
        return $this->seo && $this->seo->twitter_image
            ? ServiceClass::getFileUrl($this->seo->twitter_image)
            : null;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

/**
 * Key/value store for small site-wide flags.
 *
 * The existing `settings` table is one row per language keyed by a unique
 * header_title, so it has nowhere to hang a global boolean; this table does.
 */
class AppSetting extends Model
{
    use HasFactory;

    /** Whether members may submit exhibitions from the user area. */
    public const EXHIBITION_SUBMISSION_OPEN = 'exhibition_submission_open';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Per-request memo. HandleInertiaRequests reads the flag on every single
     * response, and without this each one costs a query.
     */
    protected static array $memo = [];

    public static function getBool(string $key, bool $default = true): bool
    {
        if (array_key_exists($key, static::$memo)) {
            return static::$memo[$key];
        }

        try {
            $row = static::query()->where('key', $key)->first();
            $value = $row ? filter_var($row->value, FILTER_VALIDATE_BOOLEAN) : $default;
        } catch (QueryException $e) {
            // Table not migrated yet. A half-failed `migrate --force` on the VPS
            // leaves exactly this state, and a hard failure here would take down
            // every page rather than just this feature.
            $value = $default;
        }

        return static::$memo[$key] = $value;
    }

    public static function setBool(string $key, bool $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value ? '1' : '0'],
        );

        static::$memo[$key] = $value;
    }
}

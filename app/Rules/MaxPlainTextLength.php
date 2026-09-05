<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Caps a rich-text field by the characters a reader can actually see, ignoring
 * the markup ReactQuill wraps around them.
 *
 * A plain `max:` counts the raw HTML, so an empty editor already costs 11
 * characters (`<p><br></p>`) and bolding a caption costs another 17 — small
 * change against the old 5000 limit, but a third of a 350 limit.
 *
 * The counter shown under the editor must count identically; keep this in sync
 * with `plainTextLength()` in resources/js/Utils/richText.js.
 */
class MaxPlainTextLength implements ValidationRule
{
    public function __construct(private int $max) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $length = static::length($value);

        if ($length > $this->max) {
            $fail("The :attribute may not be longer than {$this->max} characters. It is currently {$length}.");
        }
    }

    /**
     * Visible characters: tags removed, entities decoded, non-breaking spaces
     * normalised to ordinary ones, surrounding whitespace trimmed.
     */
    public static function length(string $html): int
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace("\u{00A0}", ' ', $text);

        return mb_strlen(trim($text));
    }
}

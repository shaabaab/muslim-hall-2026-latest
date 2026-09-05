/**
 * Helpers for measuring ReactQuill values by what the reader actually sees.
 *
 * Server-side validation uses App\Rules\MaxPlainTextLength, which strips tags,
 * decodes entities, normalises non-breaking spaces and trims. These functions
 * must produce the same number, or the counter under an editor will disagree
 * with the error the user gets back after submitting.
 */

/** Quill emits non-breaking spaces; the backend counts them as ordinary ones. */
const NBSP = String.fromCharCode(160);

/** Visible text inside a rich-text value, with markup and entities resolved. */
export function plainText(html) {
    if (!html) {
        return "";
    }

    const doc = new DOMParser().parseFromString(html, "text/html");

    return (doc.body.textContent || "").split(NBSP).join(" ").trim();
}

/**
 * Visible character count. Spread rather than `.length` so astral characters
 * (emoji) count as one, matching PHP's mb_strlen.
 */
export function plainTextLength(html) {
    return [...plainText(html)].length;
}

/** Shared cap for the exhibition caption, mirroring the backend rules. */
export const EXHIBITION_TITLE_MAX = 350;

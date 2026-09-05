import React from "react";

/**
 * Character budget shown under a rich-text editor. Counts the visible text, not
 * the markup, so it matches what App\Rules\MaxPlainTextLength enforces — it
 * turns red at exactly the point the server would reject the value.
 */
export default function CharacterCount({ length, max }) {
    const over = length > max;

    return (
        <div
            style={{
                textAlign: "right",
                fontSize: 12,
                lineHeight: "20px",
                marginTop: 4,
                color: over ? "#ff4d4f" : "rgba(0, 0, 0, 0.45)",
            }}
        >
            {length} / {max}
            {over ? ` (${length - max} over the limit)` : ""}
        </div>
    );
}

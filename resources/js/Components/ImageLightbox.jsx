import { useEffect } from "react";

// Fullscreen viewer for a single image. Rendered only while `src` is set; the
// parent owns that state so it can be opened from any image on the page.
export default function ImageLightbox({ src, alt = "", onClose }) {
    useEffect(() => {
        if (!src) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        // Freeze the page behind the overlay, restore whatever was there.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [src, onClose]);

    if (!src) return null;

    return (
        <div
            className="mh-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={alt || "Image preview"}
            onClick={onClose}
        >
            <button
                type="button"
                className="mh-lightbox-close"
                onClick={onClose}
                aria-label="Close image"
            >
                ×
            </button>

            {/* Clicking the photo itself must not close the overlay. */}
            <img
                src={src}
                alt={alt}
                className="mh-lightbox-img"
                onClick={(e) => e.stopPropagation()}
            />

            <style>{`
                .mh-lightbox {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    background: rgba(2, 6, 23, 0.92);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    cursor: zoom-out;
                    animation: mh-lightbox-in 200ms ease;
                }

                @keyframes mh-lightbox-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                .mh-lightbox-img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 10px;
                    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
                    cursor: default;
                }

                .mh-lightbox-close {
                    position: absolute;
                    top: 18px;
                    right: 22px;
                    width: 46px;
                    height: 46px;
                    border: none;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.14);
                    color: #fff;
                    font-size: 32px;
                    line-height: 1;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-bottom: 4px;
                }

                .mh-lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.28);
                }

                @media (max-width: 600px) {
                    .mh-lightbox { padding: 16px; }
                    .mh-lightbox-close { top: 10px; right: 12px; }
                }
            `}</style>
        </div>
    );
}

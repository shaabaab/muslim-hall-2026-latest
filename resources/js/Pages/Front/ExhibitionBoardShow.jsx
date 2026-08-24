import { Link, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import Header from "./Header";
import Footer from "./Footer";
import ImageLightbox from "@/Components/ImageLightbox";
import { useCallback, useEffect, useRef, useState } from "react";

// Roughly one short paragraph, then the slide links out to the detail page.
const DESCRIPTION_LIMIT = 320;

export default function ExhibitionBoardShow() {
    const { board } = usePage().props;
    const exhibitions = board?.approved_exhibitions || [];
    console.log(exhibitions);
    // withSum returns null for a board with no countable exhibitions.
    const boardViews = Number(board?.views_count || 0);
    const [currentIndex, setCurrentIndex] = useState(0);
    // { src, alt } while the fullscreen viewer is open, null otherwise.
    const [lightbox, setLightbox] = useState(null);
    const touchStartX = useRef(null);

    const fallbackImage = "/assets/images/logo3.png";

    // `image` / `sponsor_image` hold the raw S3 key; the full URL lives on the
    // appended `*_url` accessors. Prefer those, and let getS3PublicUrl resolve
    // bare keys through /local-s3-proxy when running locally.
    const getImageUrl = (...candidates) =>
        getS3PublicUrl(candidates.find(Boolean));

    const handleImageError = (e) => {
        if (e.currentTarget.src !== window.location.origin + fallbackImage) {
            e.currentTarget.src = fallbackImage;
        }
    };

    // Editor HTML -> plain text. The DOM decodes entities (&nbsp;, &amp;) that
    // a tag-stripping regex leaves behind, and counting characters on plain
    // text means a cut can never land inside a tag.
    const stripHtml = (html) => {
        if (!html) return "";
        const el = document.createElement("div");
        el.innerHTML = html;
        return (el.textContent || "").replace(/\s+/g, " ").trim();
    };

    // Cuts back to the last word boundary, unless that throws away too much.
    const truncate = (text, limit) => {
        if (text.length <= limit) return { text, isTruncated: false };

        const cut = text.slice(0, limit);
        const lastSpace = cut.lastIndexOf(" ");

        return {
            text: (lastSpace > limit * 0.6
                ? cut.slice(0, lastSpace)
                : cut
            ).trimEnd(),
            isTruncated: true,
        };
    };

    // An exhibition posted by the board's own creator is the owner's; anyone
    // else posting into the board is a contributor.
    const getCreator = (item) => {
        const boardOwnerId = board?.user_id ?? board?.owner?.id;
        const itemCreatorId = item?.user_id ?? item?.user?.id;

        const name = item?.user?.name || "Unknown";

        if (!boardOwnerId || !itemCreatorId) {
            return { role: null, name, id: null };
        }

        return {
            role: boardOwnerId === itemCreatorId ? "Owner" : "Contributor",
            name,
            id: itemCreatorId,
        };
    };

    const nextSlide = useCallback(() => {
        if (exhibitions.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % exhibitions.length);
    }, [exhibitions.length]);

    const prevSlide = useCallback(() => {
        if (exhibitions.length === 0) return;
        setCurrentIndex((prev) =>
            prev === 0 ? exhibitions.length - 1 : prev - 1,
        );
    }, [exhibitions.length]);

    // Arrow keys drive the slider too — but not behind the fullscreen viewer.
    useEffect(() => {
        if (exhibitions.length < 2) return;

        const onKeyDown = (e) => {
            if (lightbox) return;

            if (e.key === "ArrowRight") nextSlide();
            else if (e.key === "ArrowLeft") prevSlide();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [exhibitions.length, nextSlide, prevSlide, lightbox]);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;

        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(delta) < 50) return;
        delta < 0 ? nextSlide() : prevSlide();
    };

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />

                <section className="board-show-hero">
                    <div className="container">
                        <Link
                            href={route("exhibition-details")}
                            className="back-link"
                        >
                            ← Back to Boards
                        </Link>

                        <div className="hero-layout">
                            <div className="hero-text">
                                <h1>{board.title}</h1>

                                <p>{stripHtml(board.description)}</p>

                                <div className="board-meta">
                                    <span>
                                        Owner: {board.owner?.name || "Unknown"}
                                    </span>
                                    <span>
                                        {exhibitions.length} Approved
                                        Exhibitions
                                    </span>
                                    <span>
                                        {boardViews.toLocaleString()} Views
                                    </span>
                                </div>
                            </div>

                            {/* Boards often have no cover of their own — fall
                                back to the first exhibition's photo, the same
                                way the board card on the listing page does. */}
                            <div className="hero-image">
                                <img
                                    src={getImageUrl(
                                        board?.image_url,
                                        board?.image,
                                        exhibitions[0]?.image_url,
                                        exhibitions[0]?.image,
                                    )}
                                    alt={
                                        stripHtml(board.title) ||
                                        "Exhibition board"
                                    }
                                    onError={handleImageError}
                                />
                            </div>
                        </div>
                    </div>
                </section>
                {/*Slider Section*/}
                <section className="slider-section">
                    <div className="container-md">
                        {exhibitions.length > 0 ? (
                            <div className="slider-shell">
                                {exhibitions.length > 1 && (
                                    <button
                                        type="button"
                                        className="slider-btn prev"
                                        onClick={prevSlide}
                                        aria-label="Previous exhibition"
                                    >
                                        ‹
                                    </button>
                                )}

                                <div
                                    className="slider-viewport"
                                    onTouchStart={handleTouchStart}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div
                                        className="slider-track"
                                        style={{
                                            transform: `translateX(-${
                                                currentIndex * 100
                                            }%)`,
                                        }}
                                    >
                                        {exhibitions.map((item, index) => {
                                            const isActive =
                                                index === currentIndex;
                                            const creator = getCreator(item);
                                            const summary = truncate(
                                                stripHtml(item.description),
                                                DESCRIPTION_LIMIT,
                                            );

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`slider-card ${
                                                        isActive
                                                            ? "is-active"
                                                            : ""
                                                    }`}
                                                >
                                                    <div
                                                        className="slider-image"
                                                        style={{
                                                            cursor: isActive
                                                                ? "zoom-in"
                                                                : "default",
                                                        }}
                                                        onClick={() =>
                                                            isActive &&
                                                            setLightbox({
                                                                src: getImageUrl(
                                                                    item.image_url,
                                                                    item.image,
                                                                ),
                                                                alt: stripHtml(
                                                                    item.title,
                                                                ),
                                                            })
                                                        }
                                                    >
                                                        {/* Blurred copy fills
                                                            the box behind the
                                                            photo. */}
                                                        <img
                                                            className="slide-photo-bg"
                                                            src={getImageUrl(
                                                                item.image_url,
                                                                item.image,
                                                            )}
                                                            alt=""
                                                            aria-hidden="true"
                                                            onError={
                                                                handleImageError
                                                            }
                                                        />

                                                        <img
                                                            className="slide-photo"
                                                            src={getImageUrl(
                                                                item.image_url,
                                                                item.image,
                                                            )}
                                                            alt={stripHtml(
                                                                item.title,
                                                            )}
                                                            onError={
                                                                handleImageError
                                                            }
                                                        />
                                                    </div>

                                                    <div className="slider-content">
                                                        <div className="slide-meta">
                                                            <span className="slide-count">
                                                                {index + 1} /{" "}
                                                                {
                                                                    exhibitions.length
                                                                }
                                                            </span>

                                                            {/* role is only set when the creator
                                                                id resolved, so the author link is
                                                                always valid here. */}
                                                            <span className="slide-count">
                                                                Views:{" "}
                                                                {item.views}
                                                            </span>
                                                            {creator.role && (
                                                                <Link
                                                                    href={route(
                                                                        "author.profile",
                                                                        creator.id,
                                                                    )}
                                                                    className={`creator-chip ${creator.role.toLowerCase()}`}
                                                                    title={`View ${creator.name}'s profile`}
                                                                    tabIndex={
                                                                        isActive
                                                                            ? 0
                                                                            : -1
                                                                    }
                                                                >
                                                                    {
                                                                        creator.role
                                                                    }
                                                                    <b>
                                                                        {
                                                                            creator.name
                                                                        }
                                                                    </b>
                                                                </Link>
                                                            )}
                                                        </div>

                                                        <h2
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    item.title ||
                                                                    "Untitled",
                                                            }}
                                                        />

                                                        {/* Plain text, capped:
                                                            long descriptions
                                                            used to stretch the
                                                            card (and so the
                                                            image frame). */}
                                                        <div className="description">
                                                            {summary.text}
                                                            {summary.isTruncated && (
                                                                <>
                                                                    {"… "}
                                                                    <Link
                                                                        href={route(
                                                                            "exhibition-detail",
                                                                            item.id,
                                                                        )}
                                                                        className="see-more"
                                                                        tabIndex={
                                                                            isActive
                                                                                ? 0
                                                                                : -1
                                                                        }
                                                                    >
                                                                        see
                                                                        more...!
                                                                    </Link>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* <div className="info-grid">
                                                            <div>
                                                                <span>
                                                                    Type
                                                                </span>
                                                                <strong>
                                                                    {item.type}
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Price
                                                                </span>
                                                                <strong>
                                                                    {item.price
                                                                        ? `${item.currency || "USD"} ${parseFloat(
                                                                              item.price,
                                                                          ).toLocaleString()}`
                                                                        : "Free"}
                                                                </strong>
                                                            </div>

                                                            <div>
                                                                <span>
                                                                    Status
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        item.status
                                                                    }
                                                                </strong>
                                                            </div>
                                                        </div> */}

                                                        {(item.sponsor_image_url ||
                                                            item.sponsor_image) && (
                                                            <div className="sponsor-box">
                                                                <span>
                                                                    Sponsored By
                                                                </span>
                                                                <img
                                                                    src={getImageUrl(
                                                                        item.sponsor_image_url,
                                                                        item.sponsor_image,
                                                                    )}
                                                                    alt="Sponsor"
                                                                    onError={
                                                                        handleImageError
                                                                    }
                                                                />
                                                            </div>
                                                        )}

                                                        <Link
                                                            href={route(
                                                                "exhibition-detail",
                                                                item.id,
                                                            )}
                                                            className="details-btn"
                                                            tabIndex={
                                                                isActive
                                                                    ? 0
                                                                    : -1
                                                            }
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {exhibitions.length > 1 && (
                                    <button
                                        type="button"
                                        className="slider-btn next"
                                        onClick={nextSlide}
                                        aria-label="Next exhibition"
                                    >
                                        ›
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h3>
                                    No approved exhibitions found under this
                                    board.
                                </h3>
                                <p>
                                    After admin approval, exhibitions will
                                    appear here.
                                </p>
                            </div>
                        )}
                        {/* Exhibition Length */}
                        {exhibitions.length > 1 && (
                            <div className="thumbs">
                                {exhibitions.map((item, index) => (
                                    <button
                                        type="button"
                                        key={item.id}
                                        className={`thumb ${
                                            currentIndex === index
                                                ? "active"
                                                : ""
                                        }`}
                                        aria-current={currentIndex === index}
                                        title={stripHtml(item.title)}
                                        onClick={() => setCurrentIndex(index)}
                                    >
                                        <img
                                            src={getImageUrl(
                                                item.image_url,
                                                item.image,
                                            )}
                                            alt={stripHtml(item.title)}
                                            onError={handleImageError}
                                        />
                                        <span className="thumb-index">
                                            {index + 1}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>

            <ImageLightbox
                src={lightbox?.src}
                alt={lightbox?.alt}
                onClose={() => setLightbox(null)}
            />

            <style>{`
                .container-md {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 16px;
                }

                .board-show-hero {
                    background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                    color: white;
                    padding: 50px 0 35px;
                }

                .back-link {
                    display: inline-block;
                    color: #d1d5db;
                    text-decoration: none;
                    margin-bottom: 18px;
                }

                /* Copy on the left, the board's own image on the right. */
                .hero-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 380px;
                    gap: 34px;
                    align-items: center;
                }

                .hero-text {
                    min-width: 0;
                }

                .hero-image {
                    width: 100%;
                    height: 250px;
                    border-radius: 20px;
                    overflow: hidden;
                    background: rgba(255,255,255,0.12);
                    border: 1px solid rgba(255,255,255,0.22);
                    box-shadow: 0 18px 42px rgba(0,0,0,0.22);
                }

                .hero-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .board-show-hero h1 {
                    font-size: 42px;
                    font-weight: 900;
                    margin-bottom: 12px;
                }

                .board-show-hero p {
                    color: #d1d5db;
                    max-width: 760px;
                    line-height: 1.7;
                }

                .board-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 20px;
                }

                .board-meta span {
                    background: rgba(255,255,255,0.12);
                    border: 1px solid rgba(255,255,255,0.18);
                    padding: 8px 12px;
                    border-radius: 999px;
                    font-size: 13px;
                }

                .slider-section {
                    padding: 45px 0;
                    background: #f9fafb;
                    min-height: 65vh;
                }

                .slider-shell {
                    position: relative;
                    /* Gutter on each side so the arrows sit outside the card. */
                    padding: 0 64px;
                }

                .slider-viewport {
                    position: relative;
                    overflow: hidden;
                    border-radius: 24px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.13);
                    touch-action: pan-y;
                }

                .slider-track {
                    display: flex;
                    will-change: transform;
                    transition: transform 650ms cubic-bezier(0.22, 0.61, 0.36, 1);
                }

                .slider-card {
                    flex: 0 0 100%;
                    width: 100%;
                    min-width: 100%;
                    background: white;
                    display: grid;
                    grid-template-columns: 1.35fr 1fr;
                }

                .slider-image {
                    position: relative;
                    background: #111827;
                    min-height: 520px;
                    overflow: hidden;
                }

                .slider-image img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }

                /* Wide or tall photos would otherwise sit in a slab of flat
                   black: a blurred, cropped copy fills the box behind them. */
                .slide-photo-bg {
                    object-fit: cover;
                    object-position: center;
                    filter: blur(26px) brightness(0.55);
                    transform: scale(1.2);
                }

                /* contain, not cover: the whole photo stays visible. */
                .slide-photo {
                    object-fit: contain;
                    object-position: center;
                    transform: scale(1.04);
                    transition: transform 900ms cubic-bezier(0.22, 0.61, 0.36, 1);
                }

                .slider-card.is-active .slide-photo {
                    transform: scale(1);
                }

                /* Staggered fade-up of the active slide's content. */
                .slider-content > * {
                    opacity: 0;
                    transform: translateY(16px);
                    transition: opacity 500ms ease, transform 500ms ease;
                }

                .slider-card.is-active .slider-content > * {
                    opacity: 1;
                    transform: translateY(0);
                }

                .slider-card.is-active .slider-content > *:nth-child(1) { transition-delay: 120ms; }
                .slider-card.is-active .slider-content > *:nth-child(2) { transition-delay: 190ms; }
                .slider-card.is-active .slider-content > *:nth-child(3) { transition-delay: 260ms; }
                .slider-card.is-active .slider-content > *:nth-child(4) { transition-delay: 330ms; }
                .slider-card.is-active .slider-content > *:nth-child(5) { transition-delay: 400ms; }
                .slider-card.is-active .slider-content > *:nth-child(6) { transition-delay: 470ms; }

                .slider-content {
                    padding: 38px;
                    position: relative;
                }

                .slide-meta {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }

                .slide-count {
                    display: inline-flex;
                    padding: 7px 12px;
                    border-radius: 999px;
                    background: #eef2ff;
                    color: #3730a3;
                    font-weight: 700;
                    font-size: 13px;
                }

                /* Owner = posted by the board's creator, contributor = anyone
                   else who posted into the board. */
                .creator-chip {
                    display: inline-flex;
                    align-items: baseline;
                    gap: 6px;
                    padding: 7px 12px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: lowercase;
                    letter-spacing: .04em;
                    /* The chip links to the creator's author profile. */
                    text-decoration: none;
                    transition: filter 200ms ease;
                }

                .creator-chip:hover {
                    filter: brightness(0.94);
                }

                .creator-chip:hover b {
                    text-decoration: underline;
                }

                .creator-chip b {
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: none;
                    letter-spacing: 0;
                }

                .creator-chip.owner {
                    background: #e8f8ed;
                    color: #0f8022;
                }

                .creator-chip.contributor {
                    background: #fff4e5;
                    color: #b45309;
                }

                .slider-content h2 {
                    font-size: 30px;
                    font-weight: 900;
                    color: #111827;
                    margin-bottom: 16px;
                }

                .description {
                    color: #4b5563;
                    line-height: 1.8;
                    margin-bottom: 22px;
                }

                .description a {
                    color: #2563eb;
                    text-decoration: underline;
                    font-weight: 600;
                }

                /* Goes to the same place as the View Details button. */
                .see-more {
                    white-space: nowrap;
                    font-weight: 800;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .info-grid div {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 14px;
                }

                .info-grid span {
                    display: block;
                    color: #6b7280;
                    font-size: 12px;
                    margin-bottom: 5px;
                }

                .info-grid strong {
                    color: #111827;
                    text-transform: capitalize;
                }

                .sponsor-box {
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 14px;
                    margin-bottom: 22px;
                    background: #fff;
                }

                .sponsor-box span {
                    display: block;
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .sponsor-box img {
                    max-width: 220px;
                    max-height: 80px;
                    object-fit: contain;
                }

                .details-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 22px;
                    border-radius: 999px;
                    background: #111827;
                    color: white;
                    text-decoration: none;
                    font-weight: 800;
                }

                .slider-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 4;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(17,24,39,0.35);
                    color: white;
                    font-size: 34px;
                    cursor: pointer;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-bottom: 4px;
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
                    transition: background 250ms ease, transform 250ms ease;
                }

                .slider-btn:hover {
                    background: #1b7a3a;
                    transform: translateY(-50%) scale(1.08);
                }

                /* Anchored to the shell's padding box: outside the card edge. */
                .slider-btn.prev {
                    left: 0;
                }

                .slider-btn.next {
                    right: 0;
                }

                .thumbs {
                    margin-top: 14px;
                    /* Four per row; extra thumbs wrap onto further rows. */
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    /* Room for the active thumb's lift + border. */
                    padding: 12px 8px 14px;
                }

                .thumb {
                    position: relative;
                    /* Columns set the width; the ratio keeps the old 110x76
                       proportions as the grid resizes. */
                    width: 100%;
                    aspect-ratio: 110 / 76;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 3px solid transparent;
                    padding: 0;
                    cursor: pointer;
                    background: white;
                    opacity: 0.6;
                    transition: opacity 300ms ease, transform 300ms ease,
                        border-color 300ms ease, box-shadow 300ms ease;
                }

                .thumb:hover {
                    opacity: 1;
                }

                .thumb.active {
                    border-color: #1b7a3a;
                    opacity: 1;
                    transform: translateY(-4px) scale(1.06);
                    box-shadow: 0 12px 26px rgba(27, 122, 58, 0.32);
                }

                .thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .thumb-index {
                    position: absolute;
                    left: 6px;
                    bottom: 6px;
                    min-width: 22px;
                    padding: 2px 6px;
                    border-radius: 999px;
                    background: rgba(17, 24, 39, 0.75);
                    color: white;
                    font-size: 11px;
                    font-weight: 800;
                    line-height: 1.5;
                }

                .thumb.active .thumb-index {
                    background: #1b7a3a;
                }

                .empty-state {
                    background: white;
                    border-radius: 20px;
                    padding: 60px 20px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                }

                @media (max-width: 1100px) {
                    /* No room for a gutter — overlay the arrows on the card. */
                    .slider-shell {
                        padding: 0;
                    }

                    .slider-btn.prev {
                        left: 14px;
                    }

                    .slider-btn.next {
                        right: 14px;
                    }
                }

                @media (max-width: 900px) {
                    /* Stacked: the image drops below the copy rather than
                       squeezing the title into a narrow column. */
                    .hero-layout {
                        grid-template-columns: 1fr;
                        gap: 22px;
                    }

                    .hero-image {
                        height: 220px;
                    }

                    .slider-card {
                        grid-template-columns: 1fr;
                    }

                    .slider-image {
                        min-height: 320px;
                    }

                    /* Card is stacked now, so 50% of it sits over the text.
                       Centre the arrows on the image instead — half of the
                       .slider-image height above. */
                    .slider-btn {
                        top: 160px;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .board-show-hero h1 {
                        font-size: 30px;
                    }

                    .slider-content {
                        padding: 24px;
                    }

                    .slider-btn {
                        width: 42px;
                        height: 42px;
                        font-size: 26px;
                    }

                    .slider-btn.prev {
                        left: 8px;
                    }

                    .slider-btn.next {
                        right: 8px;
                    }

                    /* Still four across, just tighter. */
                    .thumbs {
                        gap: 8px;
                        padding: 10px 4px 12px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .slider-track,
                    .slide-photo,
                    .slider-content > *,
                    .thumb,
                    .slider-btn {
                        transition: none !important;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

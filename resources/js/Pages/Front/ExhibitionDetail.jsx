import { Link, usePage, router, Head } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { buildS3UrlAlways } from "@/Utils/s3Helpers";
import Header from "./Header";
import Footer from "./Footer";
import ImageLightbox from "@/Components/ImageLightbox";
import { message } from "antd";

const SvgIcon = {
    ArrowLeft: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
        </svg>
    ),
    Grid: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    Image: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
        </svg>
    ),
    Eye: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Calendar: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    User: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Tag: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <path d="M7 7h.01" />
        </svg>
    ),
    Dollar: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 1v22" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
    ),
    Document: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8M16 17H8M10 9H8" />
        </svg>
    ),
    External: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14L21 3" />
        </svg>
    ),
    Like: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M14 9V5a3 3 0 00-6 0v4" />
            <path d="M5 22h12.28a2 2 0 001.98-1.72l1.38-10A2 2 0 0018.66 8H5v14z" />
            <path d="M5 8H2v14h3" />
        </svg>
    ),
    Heart: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </svg>
    ),
    Dislike: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M10 15v4a3 3 0 006 0v-4" />
            <path d="M19 2H6.72a2 2 0 00-1.98 1.72l-1.38 10A2 2 0 005.34 16H19V2z" />
            <path d="M19 16h3V2h-3" />
        </svg>
    ),
    Message: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
        </svg>
    ),
    Reply: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M9 17l-5-5 5-5" />
            <path d="M20 18v-2a4 4 0 00-4-4H4" />
        </svg>
    ),
    Send: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    ),
    Award: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="8" r="7" />
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" />
        </svg>
    ),
    Share: () => (
        <svg
            viewBox="0 0 24 24"
            className="svg-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
    ),
};

export default function ExhibitionDetail() {
    const { exhibition, boardExhibitions, auth } = usePage().props;

    const user = auth?.user || null;

    // Sibling exhibitions of the same board, in the same order as the board
    // page slider. Sliding to one of them navigates to its detail page.
    const slides = useMemo(
        () => (Array.isArray(boardExhibitions) ? boardExhibitions : []),
        [boardExhibitions],
    );

    const activeIndex = useMemo(() => {
        const found = slides.findIndex((item) => item.id === exhibition?.id);
        return found === -1 ? 0 : found;
    }, [slides, exhibition?.id]);

    const [slideIndex, setSlideIndex] = useState(activeIndex);
    const [navigating, setNavigating] = useState(false);
    const boardSliderRef = useRef(null);
    const boardThumbsRef = useRef(null);
    const touchStartX = useRef(null);

    const [reactionCounts, setReactionCounts] = useState({
        like: 0,
        love: 0,
        dislike: 0,
    });

    const [userReaction, setUserReaction] = useState(null);
    const [reactionLoading, setReactionLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const [comments, setComments] = useState(exhibition?.comments || []);
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    const [replyText, setReplyText] = useState({});
    const [replyOpen, setReplyOpen] = useState({});
    const [replyLoading, setReplyLoading] = useState({});

    const stripHtml = (html) => {
        if (!html) return "";
        return String(html).replace(/<[^>]*>/g, "");
    };

    // Media lives on S3, not in storage/app/public — never build /storage/ paths
    // by hand. buildS3UrlAlways passes full URLs through and resolves bare keys
    // (and any legacy /storage/ value) via /local-s3-proxy or the bucket URL.
    const getImageUrl = (path) =>
        buildS3UrlAlways(path) || "/assets/images/logo3.png";

    const formatDate = (date) => {
        if (!date) return "N/A";

        try {
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            return "N/A";
        }
    };

    const galleryImages = useMemo(() => {
        // gallery_urls is the appended accessor holding resolved URLs; fall back
        // to the raw gallery keys, which getImageUrl resolves the same way.
        if (
            Array.isArray(exhibition?.gallery_urls) &&
            exhibition.gallery_urls.length
        ) {
            return exhibition.gallery_urls;
        }

        if (!exhibition?.gallery) return [];

        if (Array.isArray(exhibition.gallery)) {
            return exhibition.gallery;
        }

        try {
            const parsed = JSON.parse(exhibition.gallery);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }, [exhibition?.gallery_urls, exhibition?.gallery]);

    const mainImage =
        selectedImage || exhibition?.image_url || exhibition?.image;

    // An exhibition posted by the board's own creator is the owner's; anyone
    // else posting into the board is a contributor.
    const creator = useMemo(() => {
        const boardOwnerId =
            exhibition?.board?.user_id ?? exhibition?.board?.owner?.id;
        const creatorId = exhibition?.user_id ?? exhibition?.user?.id;

        const name = exhibition?.user?.name || "Unknown";

        if (!boardOwnerId || !creatorId) {
            return { role: null, name, id: null };
        }

        return {
            role: boardOwnerId === creatorId ? "Owner" : "Contributor",
            name,
            id: creatorId,
        };
    }, [
        exhibition?.board?.user_id,
        exhibition?.board?.owner?.id,
        exhibition?.user_id,
        exhibition?.user?.id,
        exhibition?.user?.name,
    ]);

    // Re-sync when Inertia swaps the page to another exhibition.
    useEffect(() => {
        setSlideIndex(activeIndex);
        setNavigating(false);
    }, [activeIndex]);

    // Anything tied to the exhibition being viewed has to be dropped by hand:
    // preserveState keeps this component mounted across the swap.
    useEffect(() => {
        setSelectedImage(null);
        setLightboxOpen(false);
        setCommentText("");
        setReplyOpen({});
        setReplyText({});
    }, [exhibition?.id]);

    const goToSlide = useCallback(
        (index) => {
            const target = slides[index];
            if (!target || index === slideIndex) return;

            // Start the slide first, then request while it is still moving.
            setSlideIndex(index);

            if (target.id === exhibition?.id) return;

            setNavigating(true);

            router.visit(route("exhibition-detail", target.id), {
                // Partial visit: only these two props come back, the component
                // stays mounted, and the card fills in behind the slide — no
                // page reload and no remount of the layout.
                only: ["exhibition", "boardExhibitions"],
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setNavigating(false),
            });
        },
        [slides, slideIndex, exhibition?.id],
    );

    const nextSlide = useCallback(() => {
        if (slides.length < 2) return;
        goToSlide((slideIndex + 1) % slides.length);
    }, [goToSlide, slideIndex, slides.length]);

    const prevSlide = useCallback(() => {
        if (slides.length < 2) return;
        goToSlide(slideIndex === 0 ? slides.length - 1 : slideIndex - 1);
    }, [goToSlide, slideIndex, slides.length]);

    // Arrow keys drive the slider, unless the user is typing a comment.
    useEffect(() => {
        if (slides.length < 2) return;

        const onKeyDown = (e) => {
            const tag = e.target?.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                e.target?.isContentEditable
            ) {
                return;
            }

            // The fullscreen viewer owns the keyboard while it is open.
            if (lightboxOpen) return;

            if (e.key === "ArrowRight") nextSlide();
            else if (e.key === "ArrowLeft") prevSlide();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [slides.length, nextSlide, prevSlide, lightboxOpen]);

    // Keep the active thumbnail centered in the strip.
    useEffect(() => {
        const strip = boardThumbsRef.current;
        const active = strip?.children[slideIndex];
        if (!strip || !active) return;

        strip.scrollTo({
            left:
                active.offsetLeft -
                strip.clientWidth / 2 +
                active.clientWidth / 2,
            behavior: "smooth",
        });
    }, [slideIndex]);

    // Keep the arrows centred on the image rather than on the card: once the
    // card stacks, the card's midpoint falls in the text, and the title above
    // the image shifts it down by an amount that depends on how the title wraps.
    useEffect(() => {
        const shell = boardSliderRef.current;
        if (!shell) return;

        const positionArrows = () => {
            const image = shell.querySelector(
                ".board-slide.is-active .main-image-box",
            );

            if (!image) return;

            const shellTop = shell.getBoundingClientRect().top;
            const box = image.getBoundingClientRect();

            shell.style.setProperty(
                "--arrow-top",
                `${box.top - shellTop + box.height / 2}px`,
            );
        };

        positionArrows();

        const observer = new ResizeObserver(positionArrows);
        observer.observe(shell);
        window.addEventListener("resize", positionArrows);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", positionArrows);
        };
    }, [exhibition?.id, slides.length]);

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

    useEffect(() => {
        setComments(exhibition?.comments || []);
    }, [exhibition?.comments]);

    useEffect(() => {
        if (exhibition?.id) {
            fetchReactions();
        }
    }, [exhibition?.id]);

    const fetchReactions = async () => {
        try {
            const response = await axios.get(
                route("exhibition.reactions.get", exhibition.id),
            );

            setReactionCounts({
                like: response.data?.reaction_counts?.like || 0,
                love: response.data?.reaction_counts?.love || 0,
                dislike: response.data?.reaction_counts?.dislike || 0,
            });

            setUserReaction(response.data?.user_reaction || null);
        } catch (error) {
            console.error("Reaction fetch error:", error);
        }
    };

    const handleReaction = async (type) => {
        if (!user) {
            message.warning("Please login first.");
            router.visit(route("login"));
            return;
        }

        if (reactionLoading) return;

        setReactionLoading(true);

        try {
            const response = await axios.post(
                route("exhibition.reactions.toggle"),
                {
                    exhibition_id: exhibition.id,
                    type,
                },
            );

            if (response.data?.success) {
                setReactionCounts({
                    like: response.data?.reaction_counts?.like || 0,
                    love: response.data?.reaction_counts?.love || 0,
                    dislike: response.data?.reaction_counts?.dislike || 0,
                });

                setUserReaction(response.data?.user_reaction || null);

                if (response.data?.action === "removed") {
                    message.success("Reaction removed");
                } else if (response.data?.action === "updated") {
                    message.success("Reaction updated");
                } else {
                    message.success("Reaction added");
                }
            } else {
                message.error(
                    response.data?.message || "Failed to update reaction",
                );
            }
        } catch (error) {
            console.error("Reaction error:", error);

            if (error.response?.status === 401) {
                message.warning("Please login first.");
                router.visit(route("login"));
            } else {
                message.error(
                    error.response?.data?.message ||
                        "Failed to update reaction",
                );
            }
        } finally {
            setReactionLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            message.warning("Please login first.");
            router.visit(route("login"));
            return;
        }

        if (!commentText.trim()) {
            message.warning("Please write a comment.");
            return;
        }

        setCommentLoading(true);

        try {
            const response = await axios.post(
                route("exhibition.comments.store"),
                {
                    exhibition_id: exhibition.id,
                    comment: commentText,
                },
            );

            if (response.data?.success) {
                setCommentText("");

                if (response.data?.comment) {
                    setComments((prev) => [response.data.comment, ...prev]);
                } else {
                    router.reload({ only: ["exhibition"] });
                }

                message.success("Comment added successfully.");
            } else {
                message.error(
                    response.data?.message || "Failed to add comment.",
                );
            }
        } catch (error) {
            console.error("Comment error:", error);
            message.error(
                error.response?.data?.message || "Failed to add comment.",
            );
        } finally {
            setCommentLoading(false);
        }
    };

    const handleReplySubmit = async (e, commentId) => {
        e.preventDefault();

        if (!user) {
            message.warning("Please login first.");
            router.visit(route("login"));
            return;
        }

        const text = replyText[commentId] || "";

        if (!text.trim()) {
            message.warning("Please write a reply.");
            return;
        }

        setReplyLoading((prev) => ({
            ...prev,
            [commentId]: true,
        }));

        try {
            const response = await axios.post(
                route("exhibition.comments.reply"),
                {
                    exhibition_id: exhibition.id,
                    parent_id: commentId,
                    comment: text,
                },
            );

            if (response.data?.success) {
                setReplyText((prev) => ({
                    ...prev,
                    [commentId]: "",
                }));

                setReplyOpen((prev) => ({
                    ...prev,
                    [commentId]: false,
                }));

                if (response.data?.reply) {
                    setComments((prevComments) =>
                        prevComments.map((comment) => {
                            if (comment.id !== commentId) {
                                return comment;
                            }

                            return {
                                ...comment,
                                replies: [
                                    ...(comment.replies || []),
                                    response.data.reply,
                                ],
                            };
                        }),
                    );
                } else {
                    router.reload({ only: ["exhibition"] });
                }

                message.success("Reply added successfully.");
            } else {
                message.error(response.data?.message || "Failed to add reply.");
            }
        } catch (error) {
            console.error("Reply error:", error);
            message.error(
                error.response?.data?.message || "Failed to add reply.",
            );
        } finally {
            setReplyLoading((prev) => ({
                ...prev,
                [commentId]: false,
            }));
        }
    };

    // `comments.user` / `comments.replies.user` are eager loaded, so the id is
    // normally on the relation; fall back to the foreign key.
    const authorId = (entry) => entry?.user?.id ?? entry?.user_id ?? null;

    // Not a <Link>: the identity blocks are divs styled by tag selectors
    // (`.comment-top div`), and swapping the element would drop that styling.
    const authorLinkProps = (entry) => {
        const id = authorId(entry);
        if (!id) return {};

        const go = () => router.visit(route("author.profile", id));

        return {
            role: "link",
            tabIndex: 0,
            title: `View ${entry?.user?.name || "this user"}'s profile`,
            onClick: go,
            onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go();
                }
            },
        };
    };

    const formatPrice = () => {
        if (!exhibition?.price) return "Free";

        return `${exhibition?.currency || "USD"} ${parseFloat(
            exhibition.price,
        ).toLocaleString()}`;
    };

    // Native share sheet where the browser offers one (mostly mobile), copy the
    // link everywhere else. No login needed either way.
    const handleShare = async () => {
        const url = window.location.href;
        const title = stripHtml(exhibition?.title) || "Exhibition";

        if (navigator.share) {
            try {
                await navigator.share({ title, url });
                return;
            } catch (error) {
                // Dismissing the sheet is not a failure worth reporting.
                if (error?.name === "AbortError") return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            message.success("Link copied to clipboard.");
        } catch (error) {
            console.error("Share error:", error);
            message.error("Could not copy the link.");
        }
    };

    const reactionButtonClass = (type) => {
        return userReaction?.type === type
            ? `reaction-button active ${type}`
            : `reaction-button ${type}`;
    };

    const formatSlidePrice = (item) => {
        if (!item?.price) return "Free";

        return `${item.currency || "USD"} ${parseFloat(
            item.price,
        ).toLocaleString()}`;
    };

    // Neighbouring exhibitions are rendered as light previews — the full detail
    // arrives with the page once the slide lands on them.
    const renderPreviewSlide = (item) => (
        <div key={item.id} className="board-slide">
            <div className="main-card preview-card">
                {/* Stacked layout only — the info-column copy is hidden there. */}
                <h1
                    className="detail-title mobile-title"
                    dangerouslySetInnerHTML={{
                        __html: item.title || "Untitled",
                    }}
                />

                <div className="media-column">
                    <div className="main-image-box">
                        <img
                            src={getImageUrl(item.image)}
                            alt={stripHtml(item.title)}
                        />

                        <div className="floating-badges">
                            <span className="badge type">
                                {item.type || "Exhibition"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="info-column">
                    <div className="status-row">
                        <span className="status-chip blue">
                            {item.status || "Exhibition"}
                        </span>
                    </div>

                    <h1
                        className="detail-title"
                        dangerouslySetInnerHTML={{
                            __html: item.title || "Untitled",
                        }}
                    />

                    <div className="stats-grid">
                        <div className="stat-card">
                            <SvgIcon.Dollar />
                            <span>Price</span>
                            <strong>{formatSlidePrice(item)}</strong>
                        </div>

                        <div className="stat-card">
                            <SvgIcon.Tag />
                            <span>Type</span>
                            <strong>{item.type || "N/A"}</strong>
                        </div>
                    </div>

                    <span className="preview-hint">
                        {navigating ? "Opening…" : "Slide to open"}
                    </span>
                </div>
            </div>
        </div>
    );

    if (!exhibition) {
        return (
            <FrontAuthenticatedLayout>
                <Head title="Exhibition Not Found" />
                <Header />

                <div className="empty-wrapper">
                    <h1>Exhibition not found</h1>
                    <Link
                        href={route("exhibition-details")}
                        className="primary-link"
                    >
                        Back to Exhibitions
                    </Link>
                </div>

                <Footer />
            </FrontAuthenticatedLayout>
        );
    }

    return (
        <FrontAuthenticatedLayout>
            <Head title={stripHtml(exhibition.title) || "Exhibition Detail"} />

            <div className="page-wrapper">
                <Header />

                <main className="exhibition-page">
                    <section className="top-section">
                        <div className="container mt-4">
                            <div className="top-actions">
                                <Link
                                    href={route("exhibition-details")}
                                    className="back-link"
                                >
                                    <SvgIcon.ArrowLeft />
                                    Back to Boards
                                </Link>

                                {exhibition?.board && (
                                    <Link
                                        href={route(
                                            "exhibition-board.show",
                                            exhibition.board.id,
                                        )}
                                        className="board-link"
                                    >
                                        <SvgIcon.Grid />
                                        {exhibition.board.title}
                                    </Link>
                                )}
                            </div>

                            <div
                                ref={boardSliderRef}
                                className={`board-slider ${
                                    navigating ? "is-navigating" : ""
                                }`}
                            >
                                {slides.length > 1 && (
                                    <button
                                        type="button"
                                        className="board-nav-btn prev"
                                        onClick={prevSlide}
                                        aria-label="Previous exhibition"
                                    >
                                        ‹
                                    </button>
                                )}

                                <div
                                    className="board-slider-viewport"
                                    onTouchStart={handleTouchStart}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div
                                        className="board-slider-track"
                                        style={{
                                            transform: `translateX(-${
                                                slideIndex * 100
                                            }%)`,
                                        }}
                                    >
                                        {slides
                                            .slice(0, activeIndex)
                                            .map(renderPreviewSlide)}

                                        <div className="board-slide is-active">
                                            <div className="main-card">
                                                {/* Stacked layout only — the
                                                    info-column copy is hidden
                                                    there. */}
                                                <h1
                                                    className="detail-title mobile-title"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            exhibition.title ||
                                                            "Untitled",
                                                    }}
                                                />

                                                <div className="media-column">
                                                    <div
                                                        className="main-image-box"
                                                        style={{
                                                            cursor: "zoom-in",
                                                        }}
                                                        onClick={() =>
                                                            setLightboxOpen(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <img
                                                            src={getImageUrl(
                                                                mainImage,
                                                            )}
                                                            alt={stripHtml(
                                                                exhibition.title,
                                                            )}
                                                        />

                                                        <div className="floating-badges">
                                                            <span className="badge type">
                                                                {exhibition.type ||
                                                                    "Exhibition"}
                                                            </span>

                                                            {exhibition.is_featured && (
                                                                <span className="badge featured">
                                                                    Featured
                                                                </span>
                                                            )}

                                                            {exhibition.status ===
                                                                "sold" && (
                                                                <span className="badge sold">
                                                                    Sold
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {galleryImages.length >
                                                        0 && (
                                                        <div className="gallery-strip">
                                                            <button
                                                                type="button"
                                                                className={`gallery-item ${
                                                                    selectedImage ===
                                                                    null
                                                                        ? "active"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    setSelectedImage(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={getImageUrl(
                                                                        exhibition.image_url ||
                                                                            exhibition.image,
                                                                    )}
                                                                    alt="Main"
                                                                />
                                                            </button>

                                                            {galleryImages.map(
                                                                (
                                                                    image,
                                                                    index,
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            index
                                                                        }
                                                                        type="button"
                                                                        className={`gallery-item ${
                                                                            selectedImage ===
                                                                            image
                                                                                ? "active"
                                                                                : ""
                                                                        }`}
                                                                        onClick={() =>
                                                                            setSelectedImage(
                                                                                image,
                                                                            )
                                                                        }
                                                                    >
                                                                        <img
                                                                            src={getImageUrl(
                                                                                image,
                                                                            )}
                                                                            alt={`Gallery ${index + 1}`}
                                                                        />
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="info-column">
                                                    <h1
                                                        className="detail-title"
                                                        dangerouslySetInnerHTML={{
                                                            __html:
                                                                exhibition.title ||
                                                                "Untitled",
                                                        }}
                                                    />

                                                    {/* role is only set when the creator id
                                                        resolved, so the author link is always
                                                        valid here. */}
                                                    {creator.role && (
                                                        <div className="creator-row">
                                                            <Link
                                                                href={route(
                                                                    "author.profile",
                                                                    creator.id,
                                                                )}
                                                                className={`creator-chip ${creator.role.toLowerCase()}`}
                                                                title={`View ${creator.name}'s profile`}
                                                            >
                                                                <SvgIcon.User />
                                                                {creator.role}
                                                                <b>
                                                                    {
                                                                        creator.name
                                                                    }
                                                                </b>
                                                            </Link>
                                                        </div>
                                                    )}
                                                    {/* <div className="status-row">
                                                        <span className="status-chip green">
                                                            {exhibition.is_available
                                                                ? "Available"
                                                                : "Not Available"}
                                                        </span>

                                                        <span className="status-chip blue">
                                                            {exhibition.approval_status ||
                                                                "Approved"}
                                                        </span>
                                                    </div> */}

                                                    <div className="stats-grid">
                                                        <div className="stat-card">
                                                            <SvgIcon.Dollar />
                                                            <span>Price</span>
                                                            <strong>
                                                                {formatPrice()}
                                                            </strong>
                                                        </div>

                                                        <div className="stat-card">
                                                            <SvgIcon.Eye />
                                                            <span>Views</span>
                                                            <strong>
                                                                {exhibition.views ||
                                                                    0}
                                                            </strong>
                                                        </div>

                                                        <div className="text-xs">
                                                            {/* <SvgIcon.Calendar /> */}
                                                            <span className="mr-2">
                                                                Published:
                                                            </span>
                                                            <strong>
                                                                {formatDate(
                                                                    exhibition.published_at ||
                                                                        exhibition.created_at,
                                                                )}
                                                            </strong>
                                                        </div>

                                                        {/* <div className="stat-card">
                                            <SvgIcon.User />
                                            <span>Creator</span>
                                            <strong>
                                                {exhibition.user?.name || "Unknown"}
                                            </strong>
                                        </div> */}
                                                    </div>

                                                    {(exhibition.dimensions ||
                                                        exhibition.material) && (
                                                        <div className="mini-info-grid">
                                                            {exhibition.dimensions && (
                                                                <div>
                                                                    <span>
                                                                        Dimensions
                                                                    </span>
                                                                    <strong>
                                                                        {
                                                                            exhibition.dimensions
                                                                        }
                                                                    </strong>
                                                                </div>
                                                            )}

                                                            {exhibition.material && (
                                                                <div>
                                                                    <span>
                                                                        Material
                                                                    </span>
                                                                    <strong>
                                                                        {
                                                                            exhibition.material
                                                                        }
                                                                    </strong>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="reaction-box">
                                                        <div className="box-heading">
                                                            <SvgIcon.Award />
                                                            <h3>Reaction</h3>
                                                        </div>

                                                        <div className="reaction-list">
                                                            <button
                                                                type="button"
                                                                className={reactionButtonClass(
                                                                    "like",
                                                                )}
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        "like",
                                                                    )
                                                                }
                                                                disabled={
                                                                    reactionLoading
                                                                }
                                                            >
                                                                <SvgIcon.Like />
                                                                <span>
                                                                    Like
                                                                </span>
                                                                <strong>
                                                                    {reactionCounts.like ||
                                                                        0}
                                                                </strong>
                                                            </button>

                                                            {/* <button
                                                                type="button"
                                                                className={reactionButtonClass(
                                                                    "love",
                                                                )}
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        "love",
                                                                    )
                                                                }
                                                                disabled={
                                                                    reactionLoading
                                                                }
                                                            >
                                                                <SvgIcon.Heart />
                                                                <span>
                                                                    Love
                                                                </span>
                                                                <strong>
                                                                    {reactionCounts.love ||
                                                                        0}
                                                                </strong>
                                                            </button> */}

                                                            <button
                                                                type="button"
                                                                className={reactionButtonClass(
                                                                    "dislike",
                                                                )}
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        "dislike",
                                                                    )
                                                                }
                                                                disabled={
                                                                    reactionLoading
                                                                }
                                                            >
                                                                <SvgIcon.Dislike />
                                                                <span>
                                                                    Dislike
                                                                </span>
                                                                <strong>
                                                                    {reactionCounts.dislike ||
                                                                        0}
                                                                </strong>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="reaction-button share"
                                                                onClick={
                                                                    handleShare
                                                                }
                                                                aria-label="Share this exhibition"
                                                            >
                                                                <SvgIcon.Share />
                                                                <span>
                                                                    Share
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="detail-actions">
                                                        {exhibition.link && (
                                                            <a
                                                                href={
                                                                    exhibition.link
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="action-btn primary"
                                                            >
                                                                <SvgIcon.External />
                                                                Visit Link
                                                            </a>
                                                        )}

                                                        {exhibition.document_file && (
                                                            <a
                                                                href={getImageUrl(
                                                                    exhibition.document_url ||
                                                                        exhibition.document_file,
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="action-btn secondary"
                                                            >
                                                                <SvgIcon.Document />
                                                                View Document
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {slides
                                            .slice(activeIndex + 1)
                                            .map(renderPreviewSlide)}
                                    </div>
                                </div>

                                {slides.length > 1 && (
                                    <button
                                        type="button"
                                        className="board-nav-btn next"
                                        onClick={nextSlide}
                                        aria-label="Next exhibition"
                                    >
                                        ›
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="content-section">
                        <div className="container-md">
                            <div className="content-grid">
                                <div className="left-content">
                                    <div className="white-card">
                                        <div className="section-title">
                                            <SvgIcon.Document />
                                            <h2>Description</h2>
                                        </div>

                                        <div
                                            className="rich-content"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    exhibition.description ||
                                                    "<p>No description available.</p>",
                                            }}
                                        />
                                    </div>

                                    <div className="white-card comments-card">
                                        <div className="section-title">
                                            <SvgIcon.Message />
                                            <h2>Comments</h2>
                                        </div>

                                        <form
                                            onSubmit={handleCommentSubmit}
                                            className="comment-form"
                                        >
                                            <textarea
                                                value={commentText}
                                                onChange={(e) =>
                                                    setCommentText(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    user
                                                        ? "Write your comment..."
                                                        : "Please login to comment..."
                                                }
                                                disabled={
                                                    !user || commentLoading
                                                }
                                                rows={4}
                                            />

                                            <div className="form-footer">
                                                {!user && (
                                                    <span>
                                                        Login required for
                                                        comment.
                                                    </span>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        !user ||
                                                        commentLoading ||
                                                        !commentText.trim()
                                                    }
                                                >
                                                    <SvgIcon.Send />
                                                    {commentLoading
                                                        ? "Posting..."
                                                        : "Post Comment"}
                                                </button>
                                            </div>
                                        </form>

                                        <div className="comments-list">
                                            {comments.length > 0 ? (
                                                comments.map((comment) => (
                                                    <div
                                                        key={comment.id}
                                                        className="comment-item"
                                                    >
                                                        <div
                                                            className={`comment-avatar ${
                                                                authorId(
                                                                    comment,
                                                                )
                                                                    ? "author-jump"
                                                                    : ""
                                                            }`}
                                                            {...authorLinkProps(
                                                                comment,
                                                            )}
                                                        >
                                                            {comment.user?.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "U"}
                                                        </div>

                                                        <div className="comment-content">
                                                            <div className="comment-top">
                                                                <div
                                                                    className={
                                                                        authorId(
                                                                            comment,
                                                                        )
                                                                            ? "author-jump"
                                                                            : ""
                                                                    }
                                                                    {...authorLinkProps(
                                                                        comment,
                                                                    )}
                                                                >
                                                                    <strong>
                                                                        {comment
                                                                            .user
                                                                            ?.name ||
                                                                            "Unknown"}
                                                                    </strong>
                                                                    <span>
                                                                        {formatDate(
                                                                            comment.created_at,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="reply-toggle"
                                                                    onClick={() =>
                                                                        setReplyOpen(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [comment.id]:
                                                                                    !prev[
                                                                                        comment
                                                                                            .id
                                                                                    ],
                                                                            }),
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !user
                                                                    }
                                                                >
                                                                    <SvgIcon.Reply />
                                                                    Reply
                                                                </button>
                                                            </div>

                                                            <p>
                                                                {
                                                                    comment.comment
                                                                }
                                                            </p>

                                                            {replyOpen[
                                                                comment.id
                                                            ] && (
                                                                <form
                                                                    onSubmit={(
                                                                        e,
                                                                    ) =>
                                                                        handleReplySubmit(
                                                                            e,
                                                                            comment.id,
                                                                        )
                                                                    }
                                                                    className="reply-form"
                                                                >
                                                                    <textarea
                                                                        value={
                                                                            replyText[
                                                                                comment
                                                                                    .id
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setReplyText(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [comment.id]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        placeholder="Write your reply..."
                                                                        rows={3}
                                                                        disabled={
                                                                            replyLoading[
                                                                                comment
                                                                                    .id
                                                                            ]
                                                                        }
                                                                    />

                                                                    <div className="reply-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="cancel-reply"
                                                                            onClick={() =>
                                                                                setReplyOpen(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [comment.id]: false,
                                                                                    }),
                                                                                )
                                                                            }
                                                                        >
                                                                            Cancel
                                                                        </button>

                                                                        <button
                                                                            type="submit"
                                                                            disabled={
                                                                                replyLoading[
                                                                                    comment
                                                                                        .id
                                                                                ] ||
                                                                                !(
                                                                                    replyText[
                                                                                        comment
                                                                                            .id
                                                                                    ] ||
                                                                                    ""
                                                                                ).trim()
                                                                            }
                                                                        >
                                                                            <SvgIcon.Send />
                                                                            {replyLoading[
                                                                                comment
                                                                                    .id
                                                                            ]
                                                                                ? "Posting..."
                                                                                : "Reply"}
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            )}

                                                            {comment.replies &&
                                                                comment.replies
                                                                    .length >
                                                                    0 && (
                                                                    <div className="reply-list">
                                                                        {comment.replies.map(
                                                                            (
                                                                                reply,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        reply.id
                                                                                    }
                                                                                    className="reply-item"
                                                                                >
                                                                                    <div className="reply-avatar">
                                                                                        {reply.user?.name
                                                                                            ?.charAt(
                                                                                                0,
                                                                                            )
                                                                                            ?.toUpperCase() ||
                                                                                            "U"}
                                                                                    </div>

                                                                                    <div>
                                                                                        <div className="reply-top">
                                                                                            <strong>
                                                                                                {reply
                                                                                                    .user
                                                                                                    ?.name ||
                                                                                                    "Unknown"}
                                                                                            </strong>
                                                                                            <span>
                                                                                                {formatDate(
                                                                                                    reply.created_at,
                                                                                                )}
                                                                                            </span>
                                                                                        </div>

                                                                                        <p>
                                                                                            {
                                                                                                reply.comment
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="empty-comments">
                                                    <SvgIcon.Message />
                                                    <h4>No comments yet</h4>
                                                    <p>
                                                        Be the first to comment.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <aside className="right-sidebar">
                                    <div className="white-card side-info">
                                        <div className="section-title small">
                                            <SvgIcon.Tag />
                                            <h3>Exhibition Info</h3>
                                        </div>

                                        <div className="info-list">
                                            <div>
                                                <span>Type</span>
                                                <strong>
                                                    {exhibition.type || "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Status</span>
                                                <strong>
                                                    {exhibition.status || "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Approval</span>
                                                <strong>
                                                    {exhibition.approval_status ||
                                                        "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Available</span>
                                                <strong>
                                                    {exhibition.is_available
                                                        ? "Yes"
                                                        : "No"}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {(exhibition.sponsor_image_url ||
                                        exhibition.sponsor_image) && (
                                        <div className="white-card sponsor-card">
                                            <div className="section-title small">
                                                <SvgIcon.Award />
                                                <h3>Sponsored By</h3>
                                            </div>

                                            <img
                                                src={getImageUrl(
                                                    exhibition.sponsor_image_url ||
                                                        exhibition.sponsor_image,
                                                )}
                                                alt="Sponsor"
                                                className="sponsor-image"
                                            />
                                        </div>
                                    )}
                                </aside>
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>

            {/* Derived from mainImage, so picking another gallery thumbnail
                while it is open swaps the fullscreen image too. */}
            <ImageLightbox
                src={lightboxOpen ? getImageUrl(mainImage) : null}
                alt={stripHtml(exhibition.title)}
                onClose={() => setLightboxOpen(false)}
            />

            <style>{`
                .container-md {
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 0 16px;
                }

                .svg-icon {
                    width: 18px;
                    height: 18px;
                    flex: 0 0 auto;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .exhibition-page {
                    background: #f5f7fb;
                    min-height: 100vh;
                }

                .top-section {
                    padding: 32px 0 42px;
                    background:
                        radial-gradient(circle at top left, rgba(59,130,246,.12), transparent 34%),
                        linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
                }

                .top-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    flex-wrap: wrap;
                    margin-bottom: 18px;
                }

                .back-link,
                .board-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    font-weight: 800;
                    border-radius: 999px;
                    padding: 10px 14px;
                }

                .back-link {
                    color: #1d4ed8;
                    background: #eff6ff;
                    border: 1px solid #dbeafe;
                }

                .board-link {
                    color: #334155;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 22px rgba(15,23,42,.06);
                }

                .main-card {
                    background: #ffffff;
                    border: 1px solid #e6eaf0;
                    border-radius: 28px;
                    padding: 18px;
                    display: grid;
                    grid-template-columns: minmax(0, 1.05fr) minmax(380px, .95fr);
                    gap: 24px;
                    box-shadow: 0 24px 70px rgba(15,23,42,.09);
                }

                .board-slider {
                    position: relative;
                    /* Gutter so the arrows sit outside the card on desktop. */
                    padding: 0 64px;
                }

                .board-slider-viewport {
                    overflow: hidden;
                    border-radius: 28px;
                    touch-action: pan-y;
                }

                .board-slider-track {
                    display: flex;
                    align-items: stretch;
                    will-change: transform;
                    transition: transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1);
                }

                .board-slide {
                    flex: 0 0 100%;
                    min-width: 100%;
                }

                .board-slide .main-card {
                    height: 100%;
                }

                /* Neighbour previews sit back a little until they land. */
                .board-slide:not(.is-active) .main-card {
                    opacity: .75;
                    transform: scale(.985);
                    transition: opacity .5s ease, transform .5s ease;
                }

                .preview-hint {
                    display: inline-flex;
                    align-items: center;
                    padding: 9px 14px;
                    border-radius: 999px;
                    background: #eff6ff;
                    color: #1d4ed8;
                    font-weight: 900;
                    font-size: 13px;
                }

                .board-nav-btn {
                    position: absolute;
                    /* Measured from the active slide's image; 50% until then. */
                    top: var(--arrow-top, 50%);
                    transform: translateY(-50%);
                    z-index: 4;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(15,23,42,.35);
                    color: white;
                    font-size: 34px;
                    line-height: 1;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding-bottom: 4px;
                    box-shadow: 0 10px 24px rgba(15,23,42,.28);
                    transition: background .25s ease, transform .25s ease;
                }

                .board-nav-btn:hover:not(:disabled) {
                    background: #2563eb;
                    transform: translateY(-50%) scale(1.08);
                }

                .board-nav-btn:disabled {
                    opacity: .5;
                    cursor: progress;
                }

                .board-nav-btn.prev {
                    left: 0;
                }

                .board-nav-btn.next {
                    right: 0;
                }

                .board-slider.is-navigating .board-slider-viewport {
                    cursor: progress;
                }

                .board-thumbs-wrap {
                    margin-top: 6px;
                }

                .board-thumbs-head {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 800;
                    padding: 0 4px;
                }

                .board-thumbs-head .svg-icon {
                    width: 16px;
                    height: 16px;
                    color: #2563eb;
                }

                .board-thumbs {
                    /* offsetLeft of the thumbs is read against this box when
                       centering the active one. */
                    position: relative;
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    /* overflow-x:auto also clips vertically — this padding
                       keeps the active thumb's lift + ring visible. */
                    padding: 12px 6px 14px;
                    scroll-behavior: smooth;
                }

                .board-thumb {
                    position: relative;
                    width: 104px;
                    height: 72px;
                    border-radius: 14px;
                    overflow: hidden;
                    padding: 0;
                    border: 3px solid transparent;
                    background: white;
                    cursor: pointer;
                    flex: 0 0 auto;
                    opacity: .6;
                    transition: opacity .3s ease, transform .3s ease,
                        border-color .3s ease, box-shadow .3s ease;
                }

                .board-thumb:hover:not(:disabled) {
                    opacity: 1;
                }

                .board-thumb.active {
                    border-color: #2563eb;
                    opacity: 1;
                    transform: translateY(-4px) scale(1.06);
                    box-shadow: 0 12px 26px rgba(37,99,235,.3);
                }

                .board-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .board-thumb-index {
                    position: absolute;
                    left: 6px;
                    bottom: 6px;
                    min-width: 20px;
                    padding: 1px 6px;
                    border-radius: 999px;
                    background: rgba(15,23,42,.75);
                    color: white;
                    font-size: 11px;
                    font-weight: 900;
                    line-height: 1.6;
                }

                .board-thumb.active .board-thumb-index {
                    background: #2563eb;
                }

                .media-column {
                    min-width: 0;
                }

                .main-image-box {
                    position: relative;
                    overflow: hidden;
                    border-radius: 22px;
                    height: 520px;
                    background: #eef2f7;
                    border: 1px solid #e2e8f0;
                }

                .main-image-box img {
                    width: 100%;
                    height: 100%;
                    /* contain, not cover: show the whole image instead of
                       cropping whatever overflows the box. */
                    object-fit: contain;
                    object-position: center;
                    display: block;
                }

                .floating-badges {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    right: 16px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 13px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    backdrop-filter: blur(10px);
                }

                .badge.type {
                    background: rgba(255,255,255,.92);
                    color: #1e293b;
                }

                .badge.featured {
                    background: #f59e0b;
                    color: white;
                }

                .badge.sold {
                    background: #ef4444;
                    color: white;
                }

                .gallery-strip {
                    display: flex;
                    gap: 10px;
                    margin-top: 14px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }

                .gallery-item {
                    width: 88px;
                    height: 68px;
                    border-radius: 14px;
                    padding: 0;
                    overflow: hidden;
                    border: 2px solid transparent;
                    cursor: pointer;
                    background: transparent;
                    flex: 0 0 auto;
                }

                .gallery-item.active {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37,99,235,.12);
                }

                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .info-column {
                    padding: 12px 10px 10px;
                    min-width: 0;
                }

                .status-row {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 14px;
                }

                .status-chip {
                    padding: 8px 12px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: capitalize;
                }

                .status-chip.green {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-chip.blue {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .creator-row {
                    margin-bottom: 18px;
                }

                /* Owner = posted by the board's creator, contributor = anyone
                   else who posted into the board. */
                .creator-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 14px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: lowercase;
                    letter-spacing: .05em;
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

                .creator-chip .svg-icon {
                    width: 16px;
                    height: 16px;
                }

                .creator-chip b {
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: none;
                    letter-spacing: -0.01em;
                }

                .creator-chip.owner {
                    background: #dcfce7;
                    color: #166534;
                }

                .creator-chip.contributor {
                    background: #fef3c7;
                    color: #92400e;
                }

                .detail-title {
                    margin: 0 0 22px;
                    color: #0f172a;
                    font-size: 42px;
                    line-height: 1.12;
                    font-weight: 950;
                    letter-spacing: -0.04em;
                }

                .detail-title * {
                    color: inherit;
                }

                /* Only in play once .main-card stacks — see the 992px block. */
                .mobile-title {
                    display: none;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .stat-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 15px;
                    display: grid;
                    gap: 5px;
                }

                .stat-card .svg-icon {
                    color: #2563eb;
                    width: 20px;
                    height: 20px;
                    margin-bottom: 3px;
                }

                .stat-card span {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                }

                .stat-card strong {
                    color: #0f172a;
                    font-size: 15px;
                    font-weight: 900;
                }

                .mini-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0,1fr));
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .mini-info-grid div {
                    padding: 13px;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    background: #ffffff;
                }

                .mini-info-grid span {
                    display: block;
                    color: #64748b;
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .mini-info-grid strong {
                    color: #0f172a;
                }

                .reaction-box {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 16px;
                    margin-bottom: 18px;
                }

                .box-heading,
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .box-heading .svg-icon,
                .section-title .svg-icon {
                    color: #2563eb;
                    width: 22px;
                    height: 22px;
                }

                .box-heading h3,
                .section-title h2,
                .section-title h3 {
                    margin: 0;
                    color: #0f172a;
                    font-weight: 950;
                }

                .section-title h2 {
                    font-size: 26px;
                }

                .section-title.small h3 {
                    font-size: 18px;
                }

                .reaction-list {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .reaction-button {
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #334155;
                    padding: 10px 13px;
                    border-radius: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-weight: 850;
                    transition: all .2s ease;
                }

                .reaction-button .svg-icon {
                    width: 18px;
                    height: 18px;
                }

                .reaction-button strong {
                    min-width: 24px;
                    height: 24px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border-radius: 999px;
                    font-size: 12px;
                    color: #0f172a;
                }

                .reaction-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(15,23,42,.08);
                }

                .reaction-button.active.like {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .reaction-button.active.love {
                    background: #e11d48;
                    color: white;
                    border-color: #e11d48;
                }

                .reaction-button.active.dislike {
                    background: #475569;
                    color: white;
                    border-color: #475569;
                }

                /* No count to show, so it carries the icon + label only. */
                .reaction-button.share {
                    color: #1d4ed8;
                    background: #eff6ff;
                    border-color: #dbeafe;
                }

                .reaction-button.share:hover {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .detail-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    border-radius: 14px;
                    padding: 12px 16px;
                    text-decoration: none;
                    font-weight: 900;
                    transition: all .2s ease;
                }

                .action-btn.primary {
                    background: #2563eb;
                    color: white;
                }

                .action-btn.secondary {
                    background: #f8fafc;
                    color: #0f172a;
                    border: 1px solid #e2e8f0;
                }

                .content-section {
                    padding: 34px 0 52px;
                    background: #f5f7fb;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 330px;
                    gap: 22px;
                    align-items: start;
                }

                .left-content {
                    display: grid;
                    gap: 22px;
                    min-width: 0;
                }

                .white-card {
                    background: white;
                    border: 1px solid #e6eaf0;
                    border-radius: 24px;
                    padding: 26px;
                    box-shadow: 0 14px 34px rgba(15,23,42,.06);
                }

                .rich-content {
                    color: #334155;
                    font-size: 16px;
                    line-height: 1.9;
                }

                .rich-content a {
                    color: #2563eb;
                    font-weight: 800;
                    text-decoration: underline;
                }

                .rich-content img {
                    max-width: 100%;
                    border-radius: 16px;
                }

                .rich-content h1,
                .rich-content h2,
                .rich-content h3,
                .rich-content h4 {
                    color: #0f172a;
                    font-weight: 950;
                    margin-top: 22px;
                }

                .right-sidebar {
                    position: sticky;
                    top: 86px;
                    display: grid;
                    gap: 18px;
                }

                .info-list {
                    display: grid;
                    gap: 12px;
                }

                .info-list div {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #edf2f7;
                }

                .info-list span {
                    color: #64748b;
                    font-size: 14px;
                }

                .info-list strong {
                    color: #0f172a;
                    text-transform: capitalize;
                    text-align: right;
                }

                .sponsor-image {
                    width: 100%;
                    max-height: 130px;
                    object-fit: contain;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 14px;
                }

                .comment-form {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 16px;
                    margin-bottom: 22px;
                }

                .comment-form textarea,
                .reply-form textarea {
                    width: 100%;
                    border: 1px solid #dbe3ef;
                    border-radius: 14px;
                    padding: 13px 14px;
                    outline: none;
                    resize: vertical;
                    font-size: 14px;
                    color: #0f172a;
                    background: white;
                    transition: all .2s ease;
                }

                .comment-form textarea:focus,
                .reply-form textarea:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37,99,235,.1);
                }

                .form-footer,
                .reply-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-top: 12px;
                }

                .form-footer span {
                    color: #64748b;
                    font-size: 13px;
                }

                .form-footer button,
                .reply-actions button[type="submit"] {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 10px 15px;
                    font-weight: 900;
                    cursor: pointer;
                }

                .form-footer button:disabled,
                .reply-actions button:disabled,
                .reply-toggle:disabled {
                    opacity: .55;
                    cursor: not-allowed;
                }

                .comments-list {
                    display: grid;
                    gap: 16px;
                }

                .comment-item {
                    display: flex;
                    gap: 14px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 16px;
                }

                .comment-avatar,
                .reply-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #2563eb, #7c3aed);
                    color: white;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 950;
                    flex: 0 0 auto;
                }

                .reply-avatar {
                    width: 34px;
                    height: 34px;
                    font-size: 13px;
                }

                .comment-content {
                    flex: 1;
                    min-width: 0;
                }

                /* Avatar + name of a commenter open their author profile. Only
                   applied when the commenter id resolved, so a styled element
                   is always clickable. */
                .author-jump {
                    cursor: pointer;
                    transition: opacity .2s ease, filter .2s ease;
                }

                .author-jump:hover {
                    opacity: .85;
                }

                .author-jump:hover strong {
                    text-decoration: underline;
                }

                .author-jump:focus-visible {
                    outline: 2px solid #2563eb;
                    outline-offset: 2px;
                    border-radius: 8px;
                }

                .comment-top,
                .reply-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .comment-top div,
                .reply-top {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .comment-top strong,
                .reply-top strong {
                    color: #0f172a;
                    font-weight: 900;
                }

                .comment-top span,
                .reply-top span {
                    color: #64748b;
                    font-size: 12px;
                }

                .comment-content p,
                .reply-item p {
                    margin: 0;
                    color: #334155;
                    line-height: 1.7;
                }

                .reply-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #2563eb;
                    padding: 8px 11px;
                    border-radius: 999px;
                    cursor: pointer;
                    font-weight: 850;
                    font-size: 13px;
                }

                .reply-form {
                    margin-top: 14px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 12px;
                }

                .cancel-reply {
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 800;
                    cursor: pointer;
                }

                .reply-list {
                    margin-top: 14px;
                    display: grid;
                    gap: 10px;
                    padding-left: 14px;
                    border-left: 3px solid #dbeafe;
                }

                .reply-item {
                    display: flex;
                    gap: 10px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 12px;
                }

                .empty-comments {
                    text-align: center;
                    padding: 36px 16px;
                    color: #64748b;
                    background: #f8fafc;
                    border: 1px dashed #cbd5e1;
                    border-radius: 18px;
                }

                .empty-comments .svg-icon {
                    width: 38px;
                    height: 38px;
                    color: #94a3b8;
                    margin-bottom: 10px;
                }

                .empty-comments h4 {
                    color: #0f172a;
                    margin: 0 0 6px;
                    font-weight: 950;
                }

                .empty-wrapper {
                    min-height: 60vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    background: #f5f7fb;
                }

                .primary-link {
                    background: #2563eb;
                    color: white;
                    padding: 11px 16px;
                    border-radius: 999px;
                    text-decoration: none;
                    font-weight: 900;
                }

                @media (max-width: 1200px) {
                    /* No room for a gutter — overlay the arrows on the card. */
                    .board-slider {
                        padding: 0;
                    }

                    .board-nav-btn.prev {
                        left: 14px;
                    }

                    .board-nav-btn.next {
                        right: 14px;
                    }
                }

                @media (max-width: 992px) {
                    .main-card,
                    .content-grid {
                        grid-template-columns: 1fr;
                    }

                    .right-sidebar {
                        position: static;
                    }

                    .main-image-box {
                        height: 390px;
                    }

                    /* Stacked: title moves above the image, so the copy inside
                       the info column steps aside. */
                    .mobile-title {
                        display: block;
                        font-size: 32px;
                        margin-bottom: 8px;
                        padding: 0 4px;
                    }

                    .info-column .detail-title {
                        display: none;
                    }
                }

                @media (max-width: 640px) {
                    .top-section {
                        padding: 22px 0 30px;
                    }

                    .main-card {
                        padding: 12px;
                        border-radius: 20px;
                    }

                    .main-image-box {
                        height: 300px;
                    }

                    .detail-title {
                        font-size: 30px;
                    }

                    .stats-grid,
                    .mini-info-grid {
                        grid-template-columns: 1fr;
                    }

                    .white-card {
                        padding: 18px;
                        border-radius: 18px;
                    }

                    .comment-item {
                        flex-direction: column;
                    }

                    .comment-top {
                        flex-direction: column;
                    }

                    .form-footer,
                    .reply-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .form-footer button,
                    .reply-actions button[type="submit"] {
                        justify-content: center;
                    }

                    .board-nav-btn {
                        width: 42px;
                        height: 42px;
                        font-size: 26px;
                    }

                    .board-nav-btn.prev {
                        left: 8px;
                    }

                    .board-nav-btn.next {
                        right: 8px;
                    }

                    .gallery-strip {
                        gap: 8px;
                        margin-top: 10px;
                    }

                    .gallery-item {
                        width: 62px;
                        height: 48px;
                        border-radius: 10px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .board-slider-track,
                    .board-slide:not(.is-active) .main-card,
                    .board-thumb,
                    .board-nav-btn {
                        transition: none !important;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

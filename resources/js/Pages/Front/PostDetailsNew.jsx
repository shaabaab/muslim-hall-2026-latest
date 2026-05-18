import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function Home() {
    const { post, auth, flash, reaction_counts, userReactionType } =
        usePage().props;
    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);

    const [reactionCounts, setReactionCounts] = useState({
        like: 0,
        love: 0,
        dislike: 0,
    });
    const [userReaction, setUserReaction] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState({
        reactions: false,
        comment: false,
        reply: false,
        update: false,
        delete: false,
        initial: true,
    });
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [expandedComments, setExpandedComments] = useState(new Set());

    // নতুন স্টেট ডিফাইন
    const [activeMediaTab, setActiveMediaTab] = useState("content");

    // --- UTILS ---
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "" }),
            4000,
        );
    }, []);

    // --- CONFIG ---
    const reactionTypes = useMemo(
        () => ({
            like: { icon: "fas fa-thumbs-up", label: "Like" },
            love: { icon: "fas fa-heart", label: "Love" },
            dislike: { icon: "fas fa-thumbs-down", label: "Dislike" },
        }),
        [],
    );

    // Determine available media types
    const availableMediaTypes = useMemo(() => {
        const types = [];
        if (post?.content) types.push("content");
        if (post?.pdf) types.push("pdf");
        if (post?.video || post?.video_url) types.push("video");
        if (post?.audio || (post?.audios && post.audios.length > 0) || (post?.post_audios && post.post_audios.length > 0)) types.push("audio");

        // Set initial active tab to first available media
        if (types.length > 0 && !types.includes(activeMediaTab)) {
            setActiveMediaTab(types[0]);
        }

        return types;
    }, [post, activeMediaTab]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading((prev) => ({ ...prev, initial: true }));
                if (post.comments) setComments(post.comments);
                await fetchReactions();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading((prev) => ({ ...prev, initial: false }));
            }
        };
        if (post?.id) initializeData();
    }, [post?.id]);

    const fetchReactions = async () => {
        if (!post?.id) return;
        setLoading((prev) => ({ ...prev, reactions: true }));
        try {
            setReactionCounts({
                like: reaction_counts?.like || 0,
                love: reaction_counts?.love || 0,
                dislike: reaction_counts?.dislike || 0,
            });
            setUserReaction(
                userReactionType && userReactionType !== "none"
                    ? { type: userReactionType }
                    : null,
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoading((prev) => ({ ...prev, reactions: false }));
        }
    };

    // --- HANDLERS ---
    const handleReaction = useCallback(
        async (type) => {
            if (!auth?.user) return showToast("Please login to react", "error");
            if (loading.reactions) return;

            setLoading((prev) => ({ ...prev, reactions: true }));
            try {
                const response = await axios.post("/post/reactions/toggle", {
                    post_id: post.id,
                    type,
                });
                if (response.data.success) {
                    setReactionCounts((prev) => ({
                        ...prev,
                        ...response.data.reaction_counts,
                    }));
                    setUserReaction(response.data.user_reaction);
                    showToast(response.data.message, "success");
                }
            } catch (error) {
                showToast("Failed to update reaction", "error");
            } finally {
                setLoading((prev) => ({ ...prev, reactions: false }));
            }
        },
        [auth?.user, post?.id, loading.reactions, showToast],
    );

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !auth?.user) return;

        setLoading((prev) => ({ ...prev, comment: true }));
        const tempId = `temp-${Date.now()}`;
        const tempComment = {
            id: tempId,
            comment: commentText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            replies: [],
            is_temp: true,
        };

        setComments((prev) => [tempComment, ...prev]);
        setCommentText("");

        try {
            const response = await axios.post("/post/comments", {
                post_id: post.id,
                comment: commentText.trim(),
            });
            if (response.data.success) {
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === tempId ? response.data.comment : c,
                    ),
                );
                showToast("Comment posted", "success");
            }
        } catch (error) {
            setComments((prev) => prev.filter((c) => c.id !== tempId));
            showToast("Failed to post comment", "error");
        } finally {
            setLoading((prev) => ({ ...prev, comment: false }));
        }
    };

    // Social share handlers
    const handleSocialShare = useCallback(
        (platform) => {
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(post?.title || "");
            const text = encodeURIComponent(
                post?.content?.substring(0, 100) || "",
            );

            let shareUrl = "";

            switch (platform) {
                case "facebook":
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case "twitter":
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case "whatsapp":
                    shareUrl = `https://wa.me/?text=${title}%20${url}`;
                    break;
                case "linkedin":
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case "telegram":
                    shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                    break;
                default:
                    return;
            }

            window.open(shareUrl, "_blank", "width=600,height=400");
        },
        [post],
    );

    // --- SUB-COMPONENTS ---
    const SidebarWidget = ({ title, children, className = "" }) => (
        <div className={`sidebar-widget ${className}`}>
            <h4 className="widget-title">{title}</h4>
            <div className="widget-content">{children}</div>
        </div>
    );

    const CommentItem = ({ comment, level = 0 }) => {
        const isExpanded = expandedComments.has(comment.id);
        const [replyText, setReplyText] = useState("");
        const hasReplies = comment.replies && comment.replies.length > 0;

        const submitReply = async (e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            try {
                await axios.post("/post/comments", {
                    post_id: post.id,
                    comment: replyText,
                    parent_id: comment.id,
                });
                window.location.reload();
            } catch (e) {
                showToast("Failed to reply", "error");
            }
        };

        return (
            <div className={`comment-block ${level > 0 ? "is-child" : ""}`}>
                <div className="comment-flex">
                    <div className="comment-avatar">
                        <img
                            src={`https://ui-avatars.com/api/?name=${comment.user?.name}&background=1b7a3a&color=fff`}
                            alt={comment.user?.name}
                        />
                    </div>
                    <div className="comment-details">
                        <div className="comment-meta">
                            <span className="comment-author">
                                {comment.user?.name}
                            </span>
                            <span className="comment-time">
                                {formatDate(comment.created_at)}
                            </span>
                        </div>
                        <div className="comment-msg">{comment.comment}</div>

                        <div className="comment-tools">
                            {level === 0 && auth?.user && (
                                <button
                                    className="tool-btn"
                                    onClick={() =>
                                        setReplyingTo(
                                            replyingTo === comment.id
                                                ? null
                                                : comment.id,
                                        )
                                    }
                                >
                                    <i className="fas fa-reply"></i> Reply
                                </button>
                            )}
                            {hasReplies && (
                                <button
                                    className="tool-btn"
                                    onClick={() => {
                                        setExpandedComments((prev) => {
                                            const newSet = new Set(prev);
                                            newSet.has(comment.id)
                                                ? newSet.delete(comment.id)
                                                : newSet.add(comment.id);
                                            return newSet;
                                        });
                                    }}
                                >
                                    {isExpanded ? "Hide" : "View"} Replies (
                                    {comment.replies.length})
                                </button>
                            )}
                        </div>

                        {replyingTo === comment.id && (
                            <form
                                onSubmit={submitReply}
                                className="inline-reply-box"
                            >
                                <textarea
                                    className="reply-input"
                                    placeholder="Write your reply..."
                                    value={replyText}
                                    onChange={(e) =>
                                        setReplyText(e.target.value)
                                    }
                                />
                                <button
                                    type="submit"
                                    className="mini-submit-btn"
                                >
                                    Post Reply
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                {hasReplies && (isExpanded || level > 0) && (
                    <div className="nested-comments">
                        {comment.replies.map((r) => (
                            <CommentItem
                                key={r.id}
                                comment={r}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Media Content Components
    const ContentTab = () => (
        <article className="article-body">
            <div className="drop-cap-wrapper">
                <div
                    className="rich-text"
                    dangerouslySetInnerHTML={{
                        __html: post.content,
                    }}
                />
            </div>
        </article>
    );

    const PdfTab = () => (
        <div className="pdf-viewer-container">
            <div className="pdf-header">
                <h3>
                    <i
                        className="fas fa-file-pdf mr-2"
                        style={{ color: "#e74c3c" }}
                    ></i>
                    PDF Document
                </h3>
                <a
                    href={`/storage/${post.pdf}`}
                    className="download-pdf-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                >
                    <i className="fas fa-download"></i> Download PDF
                </a>
            </div>
            <div className="pdf-preview">
                <iframe
                    src={`/storage/${post.pdf}#view=FitH`}
                    title={post.title}
                    className="pdf-iframe"
                    style={{ width: "100%", height: "600px", border: "none" }}
                />
            </div>
        </div>
    );

    const VideoTab = () => {
        const getEmbedUrl = (url) => {
            if (!url) return null;

            // 1. If it's an iframe tag, extract the src
            if (url.includes("<iframe")) {
                const match = url.match(/src=["']([^"']+)["']/);
                if (match && match[1]) {
                    url = match[1];
                }
            }

            url = url.trim();

            // 2. YouTube handling
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                if (url.includes("watch?v=")) {
                    videoId = url.split("watch?v=")[1]?.split("&")[0];
                } else if (url.includes("youtu.be/")) {
                    videoId = url.split("youtu.be/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/embed/")) {
                    videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/shorts/")) {
                    videoId = url
                        .split("youtube.com/shorts/")[1]
                        ?.split("?")[0];
                }
                return videoId
                    ? `https://www.youtube.com/embed/${videoId}`
                    : url;
            }

            // 3. Facebook handling
            if (url.includes("facebook.com") || url.includes("fb.watch")) {
                if (url.includes("facebook.com/plugins/video.php")) return url;
                return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
            }

            return url;
        };

        return (
            <div className="video-player-container">
                {post.video ? (
                    <>
                        <div className="video-header">
                            <h3>
                                <i
                                    className="fas fa-video mr-2"
                                    style={{ color: "#3498db" }}
                                ></i>
                                Video Content
                            </h3>
                            <a
                                href={`/storage/${post.video}`}
                                className="download-video-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                            >
                                <i className="fas fa-download"></i> Download
                                Video
                            </a>
                        </div>
                        <div className="video-wrapper">
                            <video
                                controls
                                className="video-player"
                                poster={
                                    post.images?.[0]?.image
                                        ? `/storage/${post.images[0].image}`
                                        : ""
                                }
                            >
                                <source
                                    src={`/storage/${post.video}`}
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </>
                ) : post.video_url ? (
                    <div className="video-embed-container">
                        <h3>
                            <i
                                className="fab fa-youtube mr-2"
                                style={{ color: "#ff0000" }}
                            ></i>
                            Embedded Video
                        </h3>
                        <div className="video-embed-wrapper">
                            <iframe
                                src={getEmbedUrl(post.video_url)}
                                title={post.title}
                                className="video-iframe"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    const AudioTab = () => {
        const hasAudios = (post?.audios && post.audios.length > 0) || (post?.post_audios && post.post_audios.length > 0) || post?.audio;
        if (!hasAudios) return null;

        return (
            <div className="audio-player-container">
                <div className="audio-header">
                    <h3>
                        <i
                            className="fas fa-music mr-2"
                            style={{ color: "#9b59b6" }}
                        ></i>
                        Audio Content
                    </h3>
                </div>
                
                {/* Legacy single Audio */}
                {post?.audio && (
                    <div className="audio-item-wrapper mb-4">
                        <div className="audio-player-header d-flex justify-content-between align-items-center mb-2">
                            <span>Audio File</span>
                            <a
                                href={`/storage/${post.audio}`}
                                className="download-audio-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                            >
                                <i className="fas fa-download"></i> Download
                            </a>
                        </div>
                        <div className="audio-player-wrapper">
                            <audio
                                controls
                                className="audio-player"
                                style={{ width: "100%" }}
                            >
                                <source src={`/storage/${post.audio}`} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                )}

                {/* Multiple Audios */}
                {(post?.audios || post?.post_audios)?.map((audioItem, idx) => (
                    <div key={audioItem.id || idx} className="audio-item-wrapper mb-4">
                        <div className="audio-player-header d-flex justify-content-between align-items-center mb-2">
                            <span>Audio {idx + 1}</span>
                            <a
                                href={`/storage/${audioItem.audio}`}
                                className="download-audio-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                            >
                                <i className="fas fa-download"></i> Download
                            </a>
                        </div>
                        <div className="audio-player-wrapper">
                            <audio
                                controls
                                className="audio-player"
                                style={{ width: "100%" }}
                            >
                                <source src={`/storage/${audioItem.audio}`} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                ))}
                
                <div className="audio-info">
                    <p>Listen to the audio content of this post.</p>
                </div>
            </div>
        );
    };

    // Media Tabs Component
    const MediaTabs = () => {
        if (availableMediaTypes.length <= 1) {
            // If only one media type available, show it directly
            const mediaType = availableMediaTypes[0];
            return (
                <div className="single-media-container">
                    {mediaType === "content" && <ContentTab />}
                    {mediaType === "pdf" && <PdfTab />}
                    {mediaType === "video" && <VideoTab />}
                    {mediaType === "audio" && <AudioTab />}
                </div>
            );
        }

        return (
            <div className="media-tabs-container">
                <div className="media-tabs-header">
                    <div className="tabs-navigation">
                        {availableMediaTypes.map((type) => (
                            <button
                                key={type}
                                className={`tab-button ${activeMediaTab === type ? "active" : ""}`}
                                onClick={() => setActiveMediaTab(type)}
                            >
                                <i
                                    className={`fas fa-${type === "content"
                                            ? "file-alt"
                                            : type === "pdf"
                                                ? "file-pdf"
                                                : type === "video"
                                                    ? "video"
                                                    : "music"
                                        }`}
                                ></i>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="media-tabs-content">
                    {activeMediaTab === "content" && <ContentTab />}
                    {activeMediaTab === "pdf" && <PdfTab />}
                    {activeMediaTab === "video" && <VideoTab />}
                    {activeMediaTab === "audio" && <AudioTab />}
                </div>
            </div>
        );
    };

    return (
        <FrontAuthenticatedLayout>
            <Head title={post?.title} />
            <div className="blog-wrapper">
                <Header />

                {toast.show && (
                    <div
                        className={`
                            fixed top-20 right-6 z-10 
                            px-4 py-3 
                            rounded-lg shadow-lg 
                            text-white font-medium 
                            animate-slide-in-right
                            ${toast.type === "success"
                                ? "bg-green-600"
                                : toast.type === "error"
                                    ? "bg-red-600"
                                    : "bg-gray-800"
                            }
                        `}
                    >
                        {toast.message}
                    </div>
                )}

                <div className="container mt-10">
                    {/* Header Section */}
                    {/* Header Section */}
                    <header className="post-header-section">
                        <h1 className="main-heading">{post.title}</h1>
                        <div className="post-meta-row">
                            {/* Author - author relation ব্যবহার করুন */}

                            <Link
                                href={route("author.profile", post.created_by)}
                            >
                                <span className="meta-pill author decoration-none text-muted">
                                    <i className="fas fa-user-circle"></i>{" "}
                                    {post.author?.name ||
                                        post.created_by?.name ||
                                        "Author"}
                                </span>
                            </Link>
                            <span className="meta-pill date">
                                <i className="far fa-clock"></i>{" "}
                                {formatDate(post.created_at)}
                            </span>
                            <span className="meta-pill category">
                                <i className="fas fa-tag"></i>{" "}
                                {post.category?.name || "General"}
                            </span>
                        </div>
                    </header>

                    {/* Author Box - author relation ব্যবহার করুন */}
                    <Link href={route("author.profile", post.created_by)}>
                        <div className="author-bio-box  text-muted">
                            <div className="bio-avatar">
                                <span>
                                    {post.author?.name?.charAt(0) ||
                                        post.created_by?.name?.charAt(0) ||
                                        "A"}
                                </span>
                            </div>

                            <div className="bio-info">
                                <h5>
                                    {post.author?.name ||
                                        post.created_by?.name ||
                                        "Author"}
                                </h5>
                                <p>
                                    Contributor at Muslim Hall. Passionate about
                                    sharing knowledge and insights.
                                </p>
                                {/* যদি author এর সম্পর্কে অতিরিক্ত তথ্য থাকে */}
                                {post.author?.bio && (
                                    <p className="author-bio">
                                        {post.author.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                    <div className="content-grid">
                        {/* LEFT COLUMN - Main Content */}
                        <main className="content-column">
                            {/* Hero Image */}
                            {post.image && (
                                <div className="hero-frame">
                                    <img
                                        src={`/storage/${post.image}`}
                                        alt={post.title}
                                        className="hero-img"
                                    />
                                </div>
                            )}

                            {/* Media Content (Conditional) */}
                            {availableMediaTypes.length > 0 ? (
                                <MediaTabs />
                            ) : (
                                <div className="no-media-message">
                                    <p>No content available for this post.</p>
                                </div>
                            )}

                            {/* Share & Reactions Row */}
                            <div className="engagement-row">
                                <div className="reaction-cluster">
                                    {Object.entries(reactionTypes).map(
                                        ([type, config]) => (
                                            <button
                                                key={type}
                                                onClick={() =>
                                                    handleReaction(type)
                                                }
                                                className={`react-bubble ${userReaction?.type === type
                                                        ? "active"
                                                        : ""
                                                    }`}
                                            >
                                                <i className={config.icon}></i>{" "}
                                                <span>
                                                    {reactionCounts[type]}
                                                </span>
                                            </button>
                                        ),
                                    )}
                                </div>
                                <div className="share-cluster">
                                    <span className="share-label">Share:</span>
                                    <button
                                        className="social-btn fb"
                                        onClick={() =>
                                            handleSocialShare("facebook")
                                        }
                                    >
                                        <i className="fab fa-facebook-f"></i>
                                    </button>
                                    <button
                                        className="social-btn tw"
                                        onClick={() =>
                                            handleSocialShare("twitter")
                                        }
                                    >
                                        <i className="fab fa-twitter"></i>
                                    </button>
                                    <button
                                        className="social-btn wa"
                                        onClick={() =>
                                            handleSocialShare("whatsapp")
                                        }
                                    >
                                        <i className="fab fa-whatsapp"></i>
                                    </button>
                                    <button
                                        className="social-btn li"
                                        onClick={() =>
                                            handleSocialShare("linkedin")
                                        }
                                    >
                                        <i className="fab fa-linkedin-in"></i>
                                    </button>
                                    <button
                                        className="social-btn tg"
                                        onClick={() =>
                                            handleSocialShare("telegram")
                                        }
                                    >
                                        <i className="fab fa-telegram-plane"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div
                                className="discussion-area"
                                id="comments-section"
                            >
                                <h3 className="section-heading">
                                    Comments ({comments.length})
                                </h3>

                                <div className="comments-stream">
                                    {comments.map((c) => (
                                        <CommentItem key={c.id} comment={c} />
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="empty-msg">
                                            No comments yet. Be the first to
                                            share your thoughts!
                                        </p>
                                    )}
                                </div>

                                {/* Comment Form */}
                                <div className="comment-compose-box mb-3">
                                    <h4>Leave a Reply</h4>
                                    {auth?.user ? (
                                        <form onSubmit={handleCommentSubmit}>
                                            <div className="input-wrapper">
                                                <textarea
                                                    className="main-input"
                                                    rows="4"
                                                    placeholder="Write your comment here..."
                                                    value={commentText}
                                                    onChange={(e) =>
                                                        setCommentText(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="submit-btn"
                                                disabled={loading.comment}
                                            >
                                                {loading.comment
                                                    ? "Publishing..."
                                                    : "Post Comment"}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="login-gate">
                                            <p>
                                                Please{" "}
                                                <Link href="/login">login</Link>{" "}
                                                to participate in the
                                                discussion.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>

                        {/* RIGHT COLUMN - Sidebar */}
                        <aside className="sidebar-column">
                            {/* Information Widget */}
                            <SidebarWidget title="Information">
                                <ul className="info-list">
                                    <li className="info-item">
                                        <div className="icon-box">
                                            <i className="fas fa-folder-open"></i>
                                        </div>
                                        <div className="info-text">
                                            <span className="label">
                                                Category
                                            </span>
                                            <span className="value">
                                                {post.category?.name ||
                                                    "General"}
                                            </span>
                                        </div>
                                    </li>
                                    <li className="info-item">
                                        <div className="icon-box">
                                            <i className="fas fa-calendar-alt"></i>
                                        </div>
                                        <div className="info-text">
                                            <span className="label">
                                                Published
                                            </span>
                                            <span className="value">
                                                {formatDate(post.created_at)}
                                            </span>
                                        </div>
                                    </li>
                                    <li className="info-item">
                                        <div className="icon-box">
                                            <i className="fas fa-eye"></i>
                                        </div>
                                        <div className="info-text">
                                            <span className="label">Views</span>
                                            <span className="value">
                                                {post.viewer_count || 0}
                                            </span>
                                        </div>
                                    </li>
                                    <li className="info-item">
                                        <div className="icon-box">
                                            <i className="fas fa-file-alt"></i>
                                        </div>
                                        <div className="info-text">
                                            <span className="label">
                                                Content Type
                                            </span>
                                            <span className="value">
                                                {availableMediaTypes.length > 0
                                                    ? availableMediaTypes
                                                        .map(
                                                            (t) =>
                                                                t
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                t.slice(1),
                                                        )
                                                        .join(", ")
                                                    : "None"}
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            </SidebarWidget>

                            <SidebarWidget title="Last Updated">
                                <div className="simple-text-widget">
                                    <p className="updated-date">
                                        <i className="far fa-clock"></i>{" "}
                                        {formatDate(post.updated_at)}
                                    </p>
                                </div>
                            </SidebarWidget>
                        </aside>
                    </div>
                </div>
                <Footer />

                <style jsx>{`
                    .blog-wrapper {
                        background-color: #fdfdfd;
                        font-family: "Inter", sans-serif;
                        color: #333;
                    }

                    .main-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 40px 20px;
                    }

                    /* Header Section */
                    .post-header-section {
                        text-align: center;
                        margin-bottom: 50px;
                        max-width: 900px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .main-heading {
                        font-family: "Merriweather", serif;
                        font-size: 38px;
                        line-height: 1.3;
                        color: #1a1a1a;
                        margin-bottom: 20px;
                    }

                    .post-meta-row {
                        display: flex;
                        justify-content: center;
                        flex-wrap: wrap;
                        gap: 20px;
                        font-size: 14px;
                        color: #666;
                    }

                    .meta-pill {
                        padding: 6px 15px;
                        background: #f5f5f5;
                        border-radius: 20px;
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .meta-pill i {
                        color: #1b7a3a;
                    }

                    /* Grid Layout */
                    .content-grid {
                        display: grid;
                        grid-template-columns: 1fr 340px;
                        gap: 50px;
                    }

                    /* --- MAIN CONTENT --- */
                    .hero-frame {
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 30px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    .hero-img {
                        width: 100%;
                        height: auto;
                        display: block;
                        max-height: 500px;
                        object-fit: cover;
                    }

                    /* Media Tabs */
                    .media-tabs-container {
                        margin-bottom: 40px;
                    }

                    .tabs-navigation {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                    }

                    .tab-button {
                        padding: 10px 20px;
                        background: #f5f5f5;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s;
                        color: #666;
                        font-weight: 500;
                    }

                    .tab-button:hover {
                        background: #e8f5e8;
                        color: #1b7a3a;
                    }

                    .tab-button.active {
                        background: #1b7a3a;
                        color: white;
                    }

                    /* Media Content Styles */
                    .pdf-viewer-container,
                    .video-player-container,
                    .audio-player-container {
                        background: white;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .pdf-header,
                    .video-header,
                    .audio-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                        gap: 10px;
                    }

                    .download-pdf-btn,
                    .download-video-btn,
                    .download-audio-btn {
                        background: #1b7a3a;
                        color: white;
                        padding: 8px 15px;
                        border-radius: 5px;
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        font-size: 14px;
                        transition: background 0.3s;
                    }

                    .download-pdf-btn:hover,
                    .download-video-btn:hover,
                    .download-audio-btn:hover {
                        background: #155d28;
                    }

                    .pdf-iframe {
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }

                    .video-wrapper {
                        position: relative;
                        padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
                        height: 0;
                        overflow: hidden;
                        border-radius: 8px;
                    }

                    .video-player,
                    .video-iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                    }

                    .video-embed-wrapper {
                        position: relative;
                        padding-bottom: 56.25%;
                        height: 0;
                        overflow: hidden;
                        border-radius: 8px;
                    }

                    .audio-player-wrapper {
                        margin-bottom: 20px;
                    }

                    .audio-player {
                        border-radius: 5px;
                    }

                    .audio-info {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 15px;
                    }

                    /* Article Body */
                    .article-body {
                        font-family: "Merriweather", serif;
                        font-size: 18px;
                        line-height: 1.8;
                        color: #2c2c2c;
                        margin-bottom: 40px;
                    }

                    .rich-text :global(p) {
                        margin-bottom: 24px;
                    }
                    .rich-text :global(h2),
                    .rich-text :global(h3) {
                        font-family: "Inter", sans-serif;
                        font-weight: 700;
                        margin-top: 40px;
                        margin-bottom: 15px;
                        color: #111;
                    }
                    .rich-text :global(blockquote) {
                        background: #fff9c4;
                        border-left: 4px solid #fbc02d;
                        padding: 20px;
                        margin: 30px 0;
                        font-style: italic;
                        border-radius: 4px;
                    }

                    /* No Media Message */
                    .no-media-message {
                        text-align: center;
                        padding: 40px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        color: #666;
                        margin-bottom: 40px;
                    }

                    /* Engagement */
                    .engagement-row {
                        border-top: 1px solid #eee;
                        border-bottom: 1px solid #eee;
                        padding: 20px 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 40px;
                        flex-wrap: wrap;
                        gap: 20px;
                    }

                    .reaction-cluster {
                        display: flex;
                        gap: 10px;
                    }
                    .react-bubble {
                        background: white;
                        border: 1px solid #ddd;
                        padding: 8px 15px;
                        border-radius: 20px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.2s;
                        color: #555;
                    }
                    .react-bubble:hover {
                        border-color: #1b7a3a;
                        color: #1b7a3a;
                    }
                    .react-bubble.active {
                        background: #1b7a3a;
                        color: white;
                        border-color: #1b7a3a;
                    }

                    .share-cluster {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .share-label {
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .social-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: none;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.2s;
                    }
                    .social-btn:hover {
                        transform: translateY(-2px);
                    }
                    .social-btn.fb {
                        background: #3b5998;
                    }
                    .social-btn.tw {
                        background: #1da1f2;
                    }
                    .social-btn.wa {
                        background: #25d366;
                    }
                    .social-btn.li {
                        background: #0077b5;
                    }
                    .social-btn.tg {
                        background: #0088cc;
                    }

                    /* Author Box */
                    .author-bio-box {
                        background: #f8f9fa;
                        padding: 25px;
                        border-radius: 8px;
                        display: flex;
                        gap: 20px;
                        align-items: center;
                        margin-bottom: 50px;
                    }
                    .bio-avatar {
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, #1b7a3a, #34a853);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        color: white;
                    }
                    .bio-info h5 {
                        margin: 0 0 5px 0;
                        font-size: 16px;
                        font-weight: 700;
                    }
                    .bio-info p {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                    }

                    /* --- COMMENTS --- */
                    .discussion-area {
                        margin-top: 40px;
                    }
                    .section-heading {
                        font-size: 22px;
                        border-left: 4px solid #fbc02d;
                        padding-left: 15px;
                        margin-bottom: 30px;
                    }

                    .comment-block {
                        margin-bottom: 25px;
                    }
                    .comment-block.is-child {
                        margin-left: 50px;
                        margin-top: 15px;
                        border-left: 2px solid #f0f0f0;
                        padding-left: 15px;
                    }

                    .comment-flex {
                        display: flex;
                        gap: 15px;
                    }
                    .comment-avatar img {
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                    }

                    .comment-details {
                        flex: 1;
                    }
                    .comment-meta {
                        font-size: 13px;
                        margin-bottom: 5px;
                    }
                    .comment-author {
                        font-weight: 700;
                        color: #111;
                        margin-right: 10px;
                    }
                    .comment-time {
                        color: #888;
                    }
                    .comment-msg {
                        font-size: 15px;
                        line-height: 1.5;
                        color: #444;
                        margin-bottom: 8px;
                    }

                    .comment-tools {
                        margin-bottom: 10px;
                    }
                    .tool-btn {
                        background: none;
                        border: none;
                        color: #1b7a3a;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        padding: 0;
                        margin-right: 15px;
                    }

                    .inline-reply-box {
                        display: flex;
                        gap: 10px;
                        margin-top: 10px;
                    }
                    .reply-input {
                        flex: 1;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 13px;
                    }
                    .mini-submit-btn {
                        background: none;
                        color: #1b7a3a;
                        border: none;
                        padding: 0 15px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                    }

                    /* Compose */
                    .comment-compose-box {
                        background: #fff;
                        border: 1px solid #eee;
                        padding: 30px;
                        border-radius: 8px;
                        margin-top: 40px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
                    }
                    .comment-compose-box h4 {
                        margin-top: 0;
                        margin-bottom: 20px;
                    }
                    .main-input {
                        width: 100%;
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 4px;
                        font-family: inherit;
                        margin-bottom: 15px;
                    }
                    .submit-btn {
                        background: #1b263b;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 4px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .submit-btn:disabled {
                        opacity: 0.7;
                    }

                    /* --- SIDEBAR --- */
                    .sidebar-widget {
                        background: white;
                        padding: 25px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
                    }

                    .widget-title {
                        font-size: 16px;
                        font-weight: 700;
                        margin-top: 0;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #f0f0f0;
                        color: #111;
                    }

                    /* Info List Style */
                    .info-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .info-item {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        padding: 15px 0;
                        border-bottom: 1px solid #f5f5f5;
                    }
                    .info-item:last-child {
                        border-bottom: none;
                    }

                    .icon-box {
                        width: 40px;
                        height: 40px;
                        background: #eafaf1; /* Light green background */
                        color: #1b7a3a;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        border-color: #eafaf1;
                    }

                    .info-text {
                        display: flex;
                        flex-direction: column;
                    }

                    .info-text .label {
                        font-size: 12px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                    }

                    .info-text .value {
                        font-size: 15px;
                        font-weight: 600;
                        color: #333;
                    }

                    .simple-text-widget {
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                    .updated-date i {
                        margin-right: 5px;
                    }

                    /* Quick Links */
                    .quick-links {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .quick-links li {
                        margin-bottom: 12px;
                    }

                    .quick-links a {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: #333;
                        text-decoration: none;
                        padding: 10px;
                        border-radius: 5px;
                        transition: background 0.3s;
                    }

                    .quick-links a:hover {
                        background: #f5f5f5;
                        color: #1b7a3a;
                    }

                    .quick-links i {
                        width: 20px;
                        color: #1b7a3a;
                    }

                    /* Responsive */
                    @media (max-width: 900px) {
                        .content-grid {
                            grid-template-columns: 1fr;
                        }
                        .sidebar-column {
                            order: 2;
                        }
                    }
                    @media (max-width: 600px) {
                        .main-heading {
                            font-size: 28px;
                        }
                        .comment-block.is-child {
                            margin-left: 20px;
                        }
                        .engagement-row {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        .share-cluster {
                            flex-wrap: wrap;
                        }
                        .post-meta-row {
                            justify-content: flex-start;
                        }
                        .tabs-navigation {
                            overflow-x: auto;
                            flex-wrap: nowrap;
                        }
                    }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}

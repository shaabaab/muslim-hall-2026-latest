import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { message } from "antd";
import {
    CalendarOutlined,
    EyeOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
} from "@ant-design/icons";
import { Head, Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PDFViewer from "../../Components/PDFViewer";
// import PostInfoDropdown from "../../Components/PostInfoDropdown"; // ❌ removed
import Footer from "./Footer";
import Header from "./Header";
import ImageContent from "./ImageContent";

/** ✅ Custom small info dropdown (no Ant Design) */
const PostInfoMini = ({ title = "Info", items = [] }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="pi-wrap">
            <button
                type="button"
                className="pi-head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="pi-title">{title}</span>

                <span className={`pi-chevron ${open ? "open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </button>

            <div className={`pi-body ${open ? "open" : ""}`}>
                {items.map((it, idx) => (
                    <div key={idx} className="pi-row">
                        <div className="pi-ico">{it.icon}</div>
                        <div className="pi-text">
                            <div className="pi-label">{it.label}</div>
                            <div className="pi-val">{it.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const removeNullNodesFromTree = (list) => {
    return list
        .filter(Boolean)
        .map((c) => ({
            ...c,
            replies: c.replies?.length
                ? removeNullNodesFromTree(c.replies)
                : [],
        }));
};

const CommentItem = ({
    comment,
    level = 0,
    expandedComments,
    setExpandedComments,
    auth,
    replyingTo,
    setReplyingTo,
    setComments,
    post,
    showToast,
    formatDate,
    editingCommentId,
    setEditingCommentId,
    editText,
    setEditText,
    editTextareaRef,
    handleUpdateComment,
    handleDeleteComment,
    loading,
}) => {
    const isExpanded = expandedComments.has(comment.id);
    const [replyText, setReplyText] = useState("");
    const hasReplies = comment.replies && comment.replies.length > 0;

    const addReplyToTree = (list, parentId, reply) => {
        return list.map((c) => {
            if (c.id === parentId) {
                return {
                    ...c,
                    replies: [reply, ...(c.replies || [])],
                };
            }

            if (c.replies?.length) {
                return {
                    ...c,
                    replies: addReplyToTree(c.replies, parentId, reply),
                };
            }

            return c;
        });
    };

    const replaceNodeById = (list, tempId, newNode) => {
        return list.map((c) => {
            if (c.id === tempId) return newNode;

            if (c.replies?.length) {
                return {
                    ...c,
                    replies: replaceNodeById(c.replies, tempId, newNode),
                };
            }

            return c;
        });
    };

    const submitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !auth?.user) return;

        const tempId = `temp-reply-${Date.now()}`;
        const tempReply = {
            id: tempId,
            comment: replyText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            replies: [],
            is_temp: true,
        };

        setComments((prev) => addReplyToTree(prev, comment.id, tempReply));
        setExpandedComments((prev) => new Set(prev).add(comment.id));
        setReplyText("");
        setReplyingTo(null);

        try {
            const res = await axios.post("/post/comments", {
                post_id: post.id,
                comment: tempReply.comment,
                parent_id: comment.id,
            });

            if (res.data?.success && res.data?.comment) {
                setComments((prev) =>
                    replaceNodeById(prev, tempId, res.data.comment),
                );
            }

            showToast("Reply posted", "success");
        } catch (err) {
            setComments((prev) =>
                removeNullNodesFromTree(replaceNodeById(prev, tempId, null)),
            );
            showToast("Failed to reply", "error");
        }
    };

    const startEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditText(comment.comment || "");
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

                    {editingCommentId === comment.id ? (
                        <div className="edit-box">
                            <textarea
                                ref={editTextareaRef}
                                value={editText}
                                dir="auto"
                                onChange={(e) => setEditText(e.target.value)}
                                className="reply-input"
                            />

                            <div className="edit-box-actions">
                                <button
                                    type="button"
                                    className="mini-submit-btn"
                                    onClick={() =>
                                        handleUpdateComment(comment.id)
                                    }
                                >
                                    Save
                                </button>

                                <button
                                    type="button"
                                    className="tool-btn"
                                    onClick={() => {
                                        setEditingCommentId(null);
                                        setEditText("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="comment-msg">{comment.comment}</div>
                    )}

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

                        {auth?.user &&
                            (auth.user.id === comment.user_id ||
                                auth.user.roles?.some((role) =>
                                    ["admin", "Super Admin"].includes(role.name),
                                )) && (
                                <>
                                    <button
                                        className="tool-btn edit-btn"
                                        onClick={() => startEditComment(comment)}
                                    >
                                        <i className="fas fa-edit"></i> Edit
                                    </button>

                                    <button
                                        className="tool-btn delete-btn"
                                        onClick={() =>
                                            handleDeleteComment(comment.id)
                                        }
                                    >
                                        <i className="fas fa-trash"></i> Delete
                                    </button>
                                </>
                            )}
                    </div>

                    {replyingTo === comment.id && (
                        <form onSubmit={submitReply} className="inline-reply-box">
                            <textarea
                                className="reply-input"
                                dir="auto"
                                placeholder="Write your reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button type="submit" className="mini-submit-btn">
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
                            expandedComments={expandedComments}
                            setExpandedComments={setExpandedComments}
                            auth={auth}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            setComments={setComments}
                            post={post}
                            showToast={showToast}
                            formatDate={formatDate}
                            editingCommentId={editingCommentId}
                            setEditingCommentId={setEditingCommentId}
                            editText={editText}
                            setEditText={setEditText}
                            editTextareaRef={editTextareaRef}
                            handleUpdateComment={handleUpdateComment}
                            handleDeleteComment={handleDeleteComment}
                            loading={loading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Home() {
    const {
        post,
        auth,
        flash,
        reaction_counts,
        userReactionType,
        relatedPosts,
        settings,
    } = usePage().props;

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState("");
    const editTextareaRef = useRef(null);

    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });

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
    const [expandedComments, setExpandedComments] = useState(new Set());

    useEffect(() => {
        if (editingCommentId && editTextareaRef.current) {
            const textarea = editTextareaRef.current;
            const length = textarea.value.length;
            textarea.focus();
            textarea.setSelectionRange(length, length);
        }
    }, [editingCommentId]);

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
        if (post?.image) types.push("image");
        if (post?.pdf_content || post?.pdf) types.push("pdf");
        if (post?.content) types.push("content");
        if (post?.video || post?.video_url) types.push("video");
        if (post?.audio || (post?.audios && post.audios.length > 0) || (post?.post_audios && post.post_audios.length > 0)) types.push("audio");
        return types;
    }, [post]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading((prev) => ({ ...prev, initial: true }));
                if (post?.comments) setComments(post.comments);
                await fetchReactions();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading((prev) => ({ ...prev, initial: false }));
            }
        };
        if (post?.id) initializeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            if (!auth?.user) {
                showToast("Please login", "error");
                return;
            }

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
                comment: tempComment.comment,
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

    const removeCommentFromTree = (list, commentId) => {
        return list
            .filter((c) => c.id !== commentId)
            .map((c) => ({
                ...c,
                replies: c.replies?.length
                    ? removeCommentFromTree(c.replies, commentId)
                    : [],
            }));
    };

    const handleDeleteComment = async (commentId) => {
        if (!auth?.user) {
            showToast("Please login", "error");
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this comment?",
        );

        if (!confirmDelete) return;

        setLoading((prev) => ({ ...prev, delete: true }));

        try {
            const response = await axios.delete(`/post/comments/${commentId}`);

            if (response.data.success) {
                setComments((prev) => removeCommentFromTree(prev, commentId));
                showToast("Comment deleted successfully", "success");
            }
        } catch (error) {
            showToast(
                error?.response?.data?.message || "Failed to delete comment",
                "error",
            );
        } finally {
            setLoading((prev) => ({ ...prev, delete: false }));
        }
    };

    const updateCommentInTree = (list, commentId, newText) => {
        return list.map((c) => {
            if (c.id === commentId) {
                return { ...c, comment: newText };
            }

            if (c.replies?.length) {
                return {
                    ...c,
                    replies: updateCommentInTree(c.replies, commentId, newText),
                };
            }

            return c;
        });
    };

    const handleUpdateComment = async (commentId) => {
        if (!editText.trim()) return;

        setLoading((prev) => ({ ...prev, update: true }));

        try {
            const response = await axios.put(`/post/comments/${commentId}`, {
                comment: editText,
            });

            if (response.data.success) {
                setComments((prev) =>
                    updateCommentInTree(prev, commentId, editText),
                );

                showToast("Comment updated", "success");
                setEditingCommentId(null);
                setEditText("");
            }
        } catch (error) {
            showToast("Failed to update comment", "error");
        } finally {
            setLoading((prev) => ({ ...prev, update: false }));
        }
    };
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        message.success("Link copied");
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

    const SponsorContent = () => {
        if (!post?.sponsor) return null;

        return (
            <div className="main-image-section">
                <div className="hero-frame">
                    <img
                        src={getS3PublicUrl(post.sponsor)}
                        alt={post?.title || "Sponsored Content"}
                        className="hero-img"
                        loading="lazy"
                    />
                    <div className="sponsor-badge">
                        <i className="fas fa-star"></i> Sponsored Content
                    </div>
                </div>
            </div>
        );
    };

    const PdfContent = () => {
        // Filter out any PDF still being processed
        const readyPdfs = post?.pdfs?.filter(p => p.pdf && p.pdf !== 'processing') ?? [];
        const legacyPdf = post?.pdf && post.pdf !== 'processing' ? post.pdf : null;

        if (!legacyPdf && !readyPdfs.length && !post?.pdf_content) return null;

        return (
            <div className="pdf-section">
                {/* Legacy single PDF */}
                {legacyPdf && (
                    <div className="pdf-item mb-4">
                        <PDFViewer pdfPath={getS3PublicUrl(legacyPdf)} />
                    </div>
                )}

                {/* Multiple PDFs — only ready ones */}
                {readyPdfs.map((pdfItem, idx) => (
                    <div key={pdfItem.id || idx} className="pdf-item mb-4">
                        <PDFViewer pdfPath={getS3PublicUrl(pdfItem.pdf)} />
                    </div>
                ))}
            </div>
        );
    };

    const ArticleContent = () => {
        if (!post?.content) return null;

        return (
            <div className="article-section">
                <article className="article-body">
                    <div
                        className="rich-text"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </div>
        );
    };

    const VideoContent = () => {
        // Filter out processing entries
        const readyVideos = post?.videos?.filter(v => v.video && v.video !== 'processing') ?? [];
        const legacyVideo = post?.video && post.video !== 'processing' ? post.video : null;
        const hasVideos = readyVideos.length > 0 || legacyVideo || post?.video_url;
        if (!hasVideos) return null;

        const getEmbedUrl = (url) => {
            if (!url) return null;

            if (url.includes("<iframe")) {
                const match = url.match(/src=["']([^"']+)["']/);
                if (match && match[1]) {
                    url = match[1];
                }
            }

            url = url.trim();

            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = "";
                if (url.includes("watch?v=")) {
                    videoId = url.split("watch?v=")[1]?.split("&")[0];
                } else if (url.includes("youtu.be/")) {
                    videoId = url.split("youtu.be/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/embed/")) {
                    videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
                } else if (url.includes("youtube.com/shorts/")) {
                    videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0];
                }
                return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
            }

            if (url.includes("facebook.com") || url.includes("fb.watch")) {
                if (url.includes("facebook.com/plugins/video.php")) return url;
                return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560`;
            }

            return url;
        };

        const embedUrl = getEmbedUrl(post.video_url);
        const poster = post.image ? getS3PublicUrl(post.image)
            : post.thumbnail ? getS3PublicUrl(post.thumbnail) : "";

        return (
            <div className="video-section">
                {/* Legacy single Video — only if ready */}
                {legacyVideo && (
                    <div className="video-player-container mb-4">
                        <div className="video-wrapper">
                            <video controls className="video-player" poster={poster}>
                                <source src={getS3PublicUrl(legacyVideo)} />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                )}

                {/* Multiple Videos — only ready ones */}
                {readyVideos.map((videoItem, idx) => (
                    <div key={videoItem.id || idx} className="video-player-container mb-4">
                        <div className="video-wrapper">
                            <video controls className="video-player" poster={poster}>
                                <source src={getS3PublicUrl(videoItem.video)} />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                ))}

                {/* Legacy Embed URL */}
                {embedUrl && (
                    <div className="video-embed-container">
                        <div className="video-embed-wrapper">
                            <iframe
                                src={embedUrl}
                                title={post.title}
                                className="video-iframe"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };



    const AudioContent = () => {
        // Filter out processing entries
        const readyAudios = (post?.audios || post?.post_audios)
            ?.filter(a => a.audio && a.audio !== 'processing') ?? [];
        const legacyAudio = post?.audio && post.audio !== 'processing' ? post.audio : null;

        if (!legacyAudio && !readyAudios.length) return null;

        return (
            <div className="audio-section">
                {/* Legacy single Audio — only if ready */}
                {legacyAudio && (
                    <div className="audio-player-container mb-4">
                        <div className="audio-player-wrapper">
                            <audio controls className="audio-player">
                                <source
                                    src={getS3PublicUrl(legacyAudio)}
                                    type="audio/mpeg"
                                />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                )}

                {/* Multiple Audios — only ready ones */}
                {readyAudios.map((audioItem, idx) => (
                    <div key={audioItem.id || idx} className="audio-player-container mb-4">
                        <div className="audio-player-wrapper">
                            <audio controls className="audio-player">
                                <source
                                    src={getS3PublicUrl(audioItem.audio)}
                                    type="audio/mpeg"
                                />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const RelatedPosts = () => {
        if (!relatedPosts || relatedPosts.length === 0) return null;

        return (
            <section className="card related-posts-section">
                <div className="section-header">
                    <h3>
                        <i className="fas fa-layer-group"></i> Related Posts
                    </h3>
                    <p className="section-subtitle">
                        You might also be interested in these posts
                    </p>
                </div>

                <div className="related-posts-grid">
                    {relatedPosts.map((rp) => (
                        <div key={rp.id} className="related-post-card">
                            <Link
                                href={`/post-detail/${rp.slug}`}
                                className="related-card-link"
                            >
                                <div className="related-card-img-wrapper">
                                    <img
                                        src={
                                            rp.image
                                                ? getS3PublicUrl(rp.image)
                                                : rp.thumbnail
                                                    ? getS3PublicUrl(rp.thumbnail)
                                                    : getS3PublicUrl(settings?.header_logo)
                                        }
                                        alt={rp.title}
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = getS3PublicUrl(settings?.header_logo);
                                        }}
                                    />
                                    <span className="related-category-tag">
                                        {rp.category?.name || "General"}
                                    </span>
                                </div>

                                <div className="related-card-body">
                                    <h4 className="related-card-title">
                                        {rp.title?.length > 60
                                            ? `${rp.title.substring(0, 60)}...`
                                            : rp.title}
                                    </h4>

                                    <div className="related-card-meta">
                                        <span className="related-card-date">
                                            <i className="far fa-clock"></i>{" "}
                                            {rp.created_at ? new Date(rp.created_at).toLocaleDateString() : "N/A"}
                                            {" "}
                                            <span className="related-card-author">
                                                By {rp.author?.name || "Admin"}
                                            </span>
                                        </span>

                                        <span className="related-card-views">
                                            <i className="far fa-eye"></i>{" "}
                                            {rp.viewer_count || 0}
                                        </span>
                                    </div>
                                    {/* <div className="related-card-meta">
                                        <span className="related-card-date">
                                            <i className="far fa-clock"></i>{" "}
                                            {rp.created_at
                                                ? new Date(
                                                    rp.created_at,
                                                ).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                        <span className="related-card-views">
                                            <i className="far fa-eye"></i>{" "}
                                            {rp.viewer_count || 0}
                                        </span>
                                    </div> */}
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const postItems = [
        {
            label: "Category",
            value: post.category?.name || "General",
            icon: <FolderOpenOutlined />,
        },
        {
            label: "Published",
            value: formatDate(post.created_at),
            icon: <CalendarOutlined />,
        },
        {
            label: "Views",
            value: post.viewer_count || 0,
            icon: <EyeOutlined />,
        },
        {
            label: "Content Type",
            value: availableMediaTypes
                .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                .join(", "),
            icon: <FileTextOutlined />,
        },
    ];

    return (
        <FrontAuthenticatedLayout>
            <Head title={post?.title} />
            <div className="blog-wrapper">
                <Header />

                {toast.show && (
                    <div className={`toast-message ${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                <div className="container mt-0 mt-md-5">
                    <header className="post-header-section">
                        <div className="title-wrap">
                            <h1 className="main-heading">{post.title}</h1>
                        </div>

                        <div className="info-wrap">
                            <PostInfoMini title="Info" items={postItems} />
                        </div>
                    </header>

                    <div className="max-w-5xl mx-auto ">
                        <main className="content-column">
                            <ImageContent post={post} />
                            <PdfContent />
                            <ArticleContent />
                            <VideoContent />
                            <AudioContent />
                            <SponsorContent />

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
                                    <button
                                        className="social-btn bg-gray-500"
                                        onClick={handleCopyLink}>
                                        <i className="fas fa-link"></i>
                                    </button>

                                </div>
                            </div>

                            <div
                                className="discussion-area"
                                id="comments-section"
                            >
                                <h3 className="section-heading">
                                    Comments ({comments.length})
                                </h3>

                                <div className="comments-stream">
                                    {comments.map((c) => (
                                        <CommentItem
                                            key={c.id}
                                            comment={c}
                                            level={0}
                                            expandedComments={expandedComments}
                                            setExpandedComments={
                                                setExpandedComments
                                            }
                                            auth={auth}
                                            replyingTo={replyingTo}
                                            setReplyingTo={setReplyingTo}
                                            setComments={setComments}
                                            post={post}
                                            showToast={showToast}
                                            formatDate={formatDate}
                                            editingCommentId={editingCommentId}
                                            setEditingCommentId={
                                                setEditingCommentId
                                            }
                                            editText={editText}
                                            setEditText={setEditText}
                                            editTextareaRef={editTextareaRef}
                                            handleUpdateComment={
                                                handleUpdateComment
                                            }
                                            handleDeleteComment={
                                                handleDeleteComment
                                            }
                                            loading={loading}
                                        />
                                    ))}
                                    {comments.length === 0 && (
                                        <p className="empty-msg">
                                            No comments yet. Be the first to
                                            share your thoughts!
                                        </p>
                                    )}
                                </div>

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

                            <Link
                                href={route("author.profile", post.created_by)}
                            >
                                <div className="author-bio-box text-muted">
                                    <div className="bio-avatar">
                                        <span>
                                            {post.author?.name?.charAt(0) ||
                                                post.created_by?.name?.charAt(
                                                    0,
                                                ) ||
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
                                            Contributor at Muslim Hall.
                                            Passionate about sharing knowledge
                                            and insights.
                                        </p>
                                        {post.author?.bio && (
                                            <p className="author-bio">
                                                {post.author.bio}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            <RelatedPosts />
                        </main>
                    </div>
                </div>

                <Footer />


                <style jsx>{`
                    .swiper {
                        width: 100%;
                    }

                    .swiper-slide {
                        width: 100% !important;
                    }

                    .blog-wrapper {
                        background-color: #fdfdfd;
                        font-family: "Inter", sans-serif;
                        color: #333;
                    }

                    .main-container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px 20px;
                    }

                    /* Toast Message Styles */
                    .toast-message {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        z-index: 9999;
                        animation: slideIn 0.3s ease;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }

                    .toast-message.success {
                        background-color: #10b981;
                        color: white;
                    }

                    .toast-message.error {
                        background-color: #ef4444;
                        color: white;
                    }

                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }

                    /* ---------- Custom Post Info (no Ant) ---------- */
                    .info-wrap {
                        max-width: 520px;
                        margin: 0 auto;
                    }

                    .post-header-section {
                        text-align: center;
                        margin-bottom: 26px;
                        max-width: 780px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .title-wrap {
                        padding: 0 10px;
                    }

                    .main-heading {
                        line-height: 1.25;
                        color: #0f172a;
                        margin: 0 0 12px 0;
                        letter-spacing: -0.2px;
                    }

                    @media (max-width: 600px) {
                        .post-header-section {
                            text-align: left;
                            margin-bottom: 18px;
                        }
                        .main-heading {
                            font-size: 22px;
                        }
                        .info-wrap {
                            max-width: 100%;
                            padding: 10px;
                            border-radius: 12px;
                        }
                    }
                    .pi-wrap {
                        border-radius: 14px;
                        background: rgba(248, 250, 252, 0.92);
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                        overflow: hidden;
                    }

                    .pi-head {
                        width: 100%;
                        background: transparent;
                        border: none;
                        padding: 10px 12px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        cursor: pointer;
                    }

                    .pi-title {
                        font-size: 13px;
                        font-weight: 800;
                        color: #0f172a;
                        letter-spacing: 0.2px;
                    }

                    .pi-chevron {
                        width: 30px;
                        height: 30px;
                        border-radius: 10px;
                        display: grid;
                        place-items: center;
                        color: #334155;
                        background: rgba(226, 232, 240, 0.65);
                        transition:
                            transform 0.2s ease,
                            background 0.2s ease;
                    }
                    .pi-chevron.open {
                        transform: rotate(180deg);
                        background: rgba(226, 232, 240, 0.9);
                    }

                    .pi-body {
                        max-height: 0;
                        opacity: 0;
                        overflow: hidden;
                        transition:
                            max-height 0.28s ease,
                            opacity 0.2s ease;
                    }
                    .pi-body.open {
                        max-height: 500px;
                        opacity: 1;
                    }

                    .pi-row {
                        display: flex;
                        gap: 10px;
                        padding: 10px 12px;
                        border-top: 1px solid rgba(226, 232, 240, 0.85);
                    }

                    .pi-ico {
                        width: 34px;
                        height: 34px;
                        border-radius: 10px;
                        display: grid;
                        place-items: center;
                        background: rgba(226, 232, 240, 0.6);
                        color: #0f172a;
                        flex: 0 0 auto;
                    }

                    .pi-text {
                        min-width: 0;
                        flex: 1;
                    }

                    .pi-label {
                        font-size: 11px;
                        font-weight: 800;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                    }

                    .pi-val {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        line-height: 1.25;
                        margin-top: 2px;
                        word-break: break-word;
                    }

                    @media (max-width: 600px) {
                        .info-wrap {
                            max-width: 100%;
                        }
                        .pi-head {
                            padding: 10px;
                        }
                        .pi-row {
                            padding: 10px;
                        }
                    }

                    /* ------------ your existing css below (kept) ------------ */
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
                        borderradius: 20px;
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .meta-pill i {
                        color: #1b7a3a;
                    }

                    .content-grid {
                        display: grid;
                        grid-template-columns: 1fr 340px;
                        gap: 50px;
                    }

                    .main-image-section {
                        margin-bottom: 30px;
                    }

                    .hero-frame {
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        margin: 10px !important;
                    }

                    .hero-img {
                        width: 100%;
                        height: auto;
                        display: block;
                        max-height: 800px;
                        object-fit: contain;
                        margin: 0 auto;
                    }

                    .sponsor-badge {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(255, 193, 7, 0.95);
                        color: #856404;
                        padding: 8px 15px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .content-header {
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .content-header h3 {
                        font-size: 22px;
                        color: #1a1a1a;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin: 0;
                    }

                    .content-header i {
                        color: #1b7a3a;
                    }

                    .pdf-section {
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .pdf-content-box {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }

                    .pdf-content-text {
                        font-size: 16px;
                        line-height: 1.6;
                        color: #333;
                    }

                    .pdf-download-section {
                        margin-top: 20px;
                    }

                    .pdf-preview {
                        margin-top: 20px;
                    }

                    .pdf-iframe {
                        width: 100%;
                        height: 500px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                    }

                    .article-section {
                        margin-bottom: 30px;
                    }

                    .article-body {
                        font-family: "Merriweather", serif;
                        font-size: 18px;
                        line-height: 1.8;
                        color: #2c2c2c;
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

                    .video-section {
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .video-player-container {
                        margin-bottom: 20px;
                    }

                    .video-wrapper {
                        position: relative;
                        padding-bottom: 56.25%;
                        height: 0;
                        overflow: hidden;
                        border-radius: 8px;
                        margin-bottom: 15px;
                    }

                    .video-player {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                    }

                    .video-embed-container {
                        margin-top: 20px;
                    }

                    .video-embed-wrapper {
                        position: relative;
                        padding-bottom: 56.25%;
                        height: 0;
                        overflow: hidden;
                        border-radius: 8px;
                    }

                    .video-iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                    }

                    .audio-section {
                        background: white;
                        border-radius: 8px;
                        padding: 25px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .audio-player-container {
                        margin-bottom: 20px;
                    }

                    .audio-player-wrapper {
                        margin-bottom: 15px;
                    }

                    .audio-player {
                        width: 100%;
                        border-radius: 5px;
                    }

                    .download-pdf-btn,
                    .download-video-btn,
                    .download-audio-btn {
                        background: #1b7a3a;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 5px;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        transition: background 0.3s;
                        border: none;
                        cursor: pointer;
                    }

                    .download-pdf-btn:hover,
                    .download-video-btn:hover,
                    .download-audio-btn:hover {
                        background: #155d28;
                    }

                    .related-posts-section {
                        margin: 40px 0;
                        padding: 30px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .section-header {
                        margin-bottom: 30px;
                    }

                    .section-header h3 {
                        font-size: 22px;
                        margin: 0 0 10px 0;
                        color: #111;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .section-subtitle {
                        color: #666;
                        font-size: 14px;
                        margin: 0;
                    }

                    .related-posts-grid {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fill,
                            minmax(250px, 1fr)
                        );
                        gap: 20px;
                    }

                    .related-post-card {
                        background: #f9fafb;
                        border-radius: 8px;
                        overflow: hidden;
                        border: 1px solid #e5e7eb;
                        transition:
                            transform 0.2s,
                            box-shadow 0.2s;
                    }

                    .related-post-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    }

                    .related-card-link {
                        display: block;
                        text-decoration: none;
                        color: inherit;
                    }

                    .related-card-img-wrapper {
                        height: 150px;
                        position: relative;
                        overflow: hidden;
                    }

                    .related-card-img-wrapper img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        transition: transform 0.3s;
                    }

                    .related-post-card:hover .related-card-img-wrapper img {
                        transform: scale(1.05);
                    }

                    .related-category-tag {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: rgba(255, 255, 255, 0.95);
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 700;
                        color: #166534;
                        text-transform: uppercase;
                    }

                    .related-card-body {
                        padding: 15px;
                    }

                    .related-card-title {
                        font-size: 14px;
                        font-weight: 600;
                        margin: 0 0 10px 0;
                        line-height: 1.4;
                        color: #111;
                    }

                    .related-card-meta {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #9ca3af;
                    }

                    .related-card-date,
                    .related-card-views {
                        display: inline-flex;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 4px;
                    }
                        .related-card-author {
                        margin-left: 4px;
                        color: #64748b;
                        font-size: 12px;
                        font-weight: 500;
                    }

                    .related-card-author::before {
                        content: "|";
                        margin-right: 5px;
                        color: #94a3b8;
                    }

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
                        border: none;
                        color: #1b7a3a;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        padding: 0;
                        margin-right: 15px;
                    }

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
                        background: #eafaf1;
                        color: #1b7a3a;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
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

                    .related-posts-section {
                        padding: 18px;
                    }
                    .section-header {
                        margin-bottom: 14px;
                    }
                    .section-header h3 {
                        font-size: 18px;
                        margin: 0 0 6px;
                        color: #0f172a;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .section-subtitle {
                        color: #64748b;
                        font-size: 13px;
                        margin: 0;
                        font-weight: 600;
                    }
                    .related-posts-grid {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 14px;
                    }
                    .related-post-card {
                        background: rgba(248, 250, 252, 0.9);
                        border-radius: 14px;
                        overflow: hidden;
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        transition:
                            transform 0.18s ease,
                            box-shadow 0.18s ease;
                    }
                    .related-post-card:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
                    }
                    .related-card-link {
                        display: block;
                        text-decoration: none;
                        color: inherit;
                    }
                    .related-card-img-wrapper {
                        height: 150px;
                        position: relative;
                        overflow: hidden;
                    }
                    .related-card-img-wrapper img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        transition: transform 0.25s ease;
                    }
                    .related-post-card:hover .related-card-img-wrapper img {
                        transform: scale(1.03);
                    }
                    .related-category-tag {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: rgba(255, 255, 255, 0.95);
                        padding: 5px 9px;
                        border-radius: 999px;
                        font-size: 10px;
                        font-weight: 900;
                        color: #166534;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        border: 1px solid rgba(226, 232, 240, 0.9);
                    }
                    .related-card-body {
                        padding: 12px;
                    }
                    .related-card-title {
                        font-size: 13px;
                        font-weight: 900;
                        margin: 0 0 10px;
                        line-height: 1.35;
                        color: #0f172a;
                    }
                    .related-card-meta {
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #94a3b8;
                        font-weight: 700;
                    }
                    // .related-card-date,
                    // .related-card-views {
                    //     display: inline-flex;
                    //     align-items: center;
                    //     gap: 5px;
                    // }

                    @media (max-width: 1024px) {
                        .content-grid {
                            grid-template-columns: minmax(0, 1fr) 320px;
                        }
                        .related-posts-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                        }
                    }

                    @media (max-width: 900px) {
                        .content-grid {
                            grid-template-columns: 1fr;
                        }
                        .sidebar-sticky {
                            position: static;
                            top: auto;
                        }
                        .post-meta-row {
                            justify-content: flex-start;
                        }
                    }

                    @media (max-width: 600px) {
                        .container {
                            padding: 18px 12px 50px;
                        }
                        .comment-block.is-child {
                            margin-left: 14px;
                        }
                        .related-posts-grid {
                            grid-template-columns: 1fr;
                        }
                        .bio-avatar {
                            height: auto !important;
                        }
                    }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}

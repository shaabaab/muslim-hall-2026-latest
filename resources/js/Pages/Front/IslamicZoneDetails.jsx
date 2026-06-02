import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Button, Typography } from "antd";
const { Text } = Typography;
import axios from "axios";
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import Footer from "./Footer";
import Header from "./Header";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;





const CommentItem = memo(function CommentItem({
    comment,
    level = 0,
    auth,
    expandedComments,
    replyingTo,
    replyText,
    setReplyText,
    setReplyingTo,
    editingComment,
    setEditingComment,
    editText,
    setEditText,
    loading,
    formatDate,
    handleReplySubmit,
    handleCommentDelete,
    handleCommentUpdate,
    toggleCommentExpansion,
}) {
    const isExpanded = expandedComments.has(comment.id);
    const canModify =
        auth.user &&
        (auth.user.id === comment.user_id || auth.user.role == 2);

    const hasReplies = comment.replies && comment.replies.length > 0;
    const isTemp = comment.is_temp;

    return (
        <div
            className={`comment-item ${level > 0 ? "nested" : ""} ${isTemp ? "temp" : ""}`}
        >
            <div className="comment-content">
                <div className="comment-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="user-details">
                            <div className="user-name">
                                {comment.user?.name || "Anonymous"}
                                {isTemp && (
                                    <span className="posting-badge">
                                        Posting...
                                    </span>
                                )}
                            </div>
                            <div className="comment-date">
                                {formatDate(comment.created_at)}
                            </div>
                        </div>
                    </div>

                    {canModify && !isTemp && (
                        <div className="comment-actions">
                            <button
                                onClick={() => {
                                    setEditingComment(comment.id);
                                    setEditText(comment.comment);
                                }}
                                disabled={loading.update}
                                className="edit-btn"
                                type="button"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleCommentDelete(comment.id)}
                                disabled={loading.delete}
                                className="delete-btn"
                                type="button"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {editingComment === comment.id ? (
                    <div className="edit-form">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="edit-textarea"
                            rows="3"
                        />
                        <div className="edit-actions">
                            <button
                                onClick={() => handleCommentUpdate(comment.id)}
                                disabled={loading.update || !editText.trim()}
                                className="save-btn"
                                type="button"
                            >
                                {loading.update ? "Updating..." : "Update"}
                            </button>
                            <button
                                onClick={() => {
                                    setEditingComment(null);
                                    setEditText("");
                                }}
                                className="cancel-btn"
                                type="button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="comment-text">{comment.comment}</div>
                )}

                {level === 0 && auth.user && !isTemp && (
                    <div className="comment-footer">
                        <button
                            onClick={() =>
                                setReplyingTo(
                                    replyingTo === comment.id ? null : comment.id
                                )
                            }
                            className="reply-btn"
                            type="button"
                        >
                            {replyingTo === comment.id ? "Cancel" : "Reply"}
                        </button>

                        {hasReplies && (
                            <button
                                onClick={() => toggleCommentExpansion(comment.id)}
                                className="toggle-replies-btn"
                                type="button"
                            >
                                {isExpanded ? "Hide" : "Show"} Replies (
                                {comment.replies.length})
                            </button>
                        )}
                    </div>
                )}

                {replyingTo === comment.id && (
                    <form
                        onSubmit={(e) => handleReplySubmit(e, comment.id)}
                        className="reply-form"
                    >
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="reply-textarea"
                            rows="3"
                            required
                        />
                        <div className="reply-actions">
                            <button
                                type="submit"
                                disabled={loading.reply || !replyText.trim()}
                                className="submit-reply-btn"
                            >
                                {loading.reply ? "Posting..." : "Post Reply"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText("");
                                }}
                                className="cancel-reply-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {hasReplies && (isExpanded || level > 0) && (
                <div className="replies-container">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            level={level + 1}
                            auth={auth}
                            expandedComments={expandedComments}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            setReplyingTo={setReplyingTo}
                            editingComment={editingComment}
                            setEditingComment={setEditingComment}
                            editText={editText}
                            setEditText={setEditText}
                            loading={loading}
                            formatDate={formatDate}
                            handleReplySubmit={handleReplySubmit}
                            handleCommentDelete={handleCommentDelete}
                            handleCommentUpdate={handleCommentUpdate}
                            toggleCommentExpansion={toggleCommentExpansion}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

export default function IslamicZoneDetails() {
    const { islam, auth, flash } = usePage().props;
    
    // Mobile sidebar state
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const isAdmin = auth?.user?.role == 2;
    const isMember = auth?.user?.subscriptions?.length > 0;
    const canDwonload = isAdmin || isMember; // Reverted back to canDwonload since it's used elsewhere

    const [commentText, setCommentText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState("");
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

    // Get root URL from environment or use current origin
    const rootUrl = useMemo(() => {
        return window.location.origin;
    }, []);
    // Parse gallery images safely
    const galleryImages = useMemo(() => {
        try {
            if (islam.gallery && islam.gallery !== '""') {
                const parsed = JSON.parse(islam.gallery);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch (error) {
            console.error("Error parsing gallery:", error);
        }
        return [];
    }, [islam.gallery]);

    // Parse viewer IPs safely
    const viewerIps = useMemo(() => {
        try {
            if (islam.viewer_ips && islam.viewer_ips !== '""') {
                const parsed = JSON.parse(islam.viewer_ips);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch (error) {
            console.error("Error parsing viewer IPs:", error);
        }
        return [];
    }, [islam.viewer_ips]);

    // Enhanced SEO data with fallbacks
    const seoData = useMemo(() => {
        const baseSeo = islam.seo || {};

        // Parse meta keywords safely
        let metaKeywords = [];
        try {
            if (baseSeo.meta_keywords && baseSeo.meta_keywords !== '""') {
                const parsed = JSON.parse(baseSeo.meta_keywords);
                metaKeywords = Array.isArray(parsed) ? parsed : [];
            }
        } catch (error) {
            console.error("Error parsing meta keywords:", error);
        }

        // Parse structured data safely
        let structuredData = {};
        try {
            if (baseSeo.structured_data && baseSeo.structured_data !== '""') {
                structuredData = JSON.parse(baseSeo.structured_data);
            }
        } catch (error) {
            console.error("Error parsing structured data:", error);
        }

        // Get full image URLs for SEO
        const ogImage =
            galleryImages.length > 0
                ? getS3PublicUrl(galleryImages[0])
                : baseSeo.og_image || null;

        const twitterImage =
            galleryImages.length > 0
                ? getS3PublicUrl(galleryImages[0])
                : baseSeo.twitter_image || null;

        return {
            meta_title:
                baseSeo.meta_title ||
                islam.title ||
                "Islamic Content - Muslim Hall",
            meta_description:
                baseSeo.meta_description ||
                (islam.description
                    ? islam.description
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 160)
                    : "Explore Islamic content on Muslim Hall"),
            meta_keywords:
                metaKeywords.length > 0
                    ? metaKeywords
                    : ["Islamic", "Muslim", "Quran", "Education"],
            meta_robots: baseSeo.meta_robots || "index, follow",
            og_title: baseSeo.og_title || islam.title || "Islamic Content",
            og_description:
                baseSeo.og_description ||
                (islam.description
                    ? islam.description
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 160)
                    : "Explore Islamic content"),
            og_image: ogImage,
            og_type: baseSeo.og_type || "website",
            og_url: baseSeo.og_url || window.location.href,
            og_site_name: baseSeo.og_site_name || "Muslim Hall",
            twitter_card: baseSeo.twitter_card || "summary_large_image",
            twitter_title:
                baseSeo.twitter_title || islam.title || "Islamic Content",
            twitter_description:
                baseSeo.twitter_description ||
                (islam.description
                    ? islam.description
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 160)
                    : "Explore Islamic content"),
            twitter_image: twitterImage,
            twitter_site: baseSeo.twitter_site || "@muslimHall",
            twitter_creator: baseSeo.twitter_creator || "@muslimHall",
            canonical_url: baseSeo.canonical_url || window.location.href,
            structured_data: structuredData,
        };
    }, [islam, galleryImages, rootUrl]);

    // Generate structured data for rich snippets
    const generateStructuredData = useCallback(() => {
        const baseData = seoData.structured_data || {};

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: seoData.meta_title,
            description: seoData.meta_description,
            datePublished: islam.created_at,
            dateModified: islam.updated_at,
            author: {
                "@type": "Organization",
                name: "Muslim Hall",
            },
            publisher: {
                "@type": "Organization",
                name: "Muslim Hall",
                logo: {
                    "@type": "ImageObject",
                    url: `${rootUrl}/logo.png`,
                },
            },
            ...baseData,
        };

        if (galleryImages.length > 0) {
            structuredData.image = galleryImages.map(
                (img) => getS3PublicUrl(img),
            );
        }

        return structuredData;
    }, [seoData, islam, galleryImages, rootUrl]);

    // URL generators with root URL
    const getThumbnailUrl = useCallback(
        (thumbnailPath) => {
            if (!thumbnailPath)
                return `${rootUrl}/default-islamic-thumbnail.jpg`;

            const cleanPath = thumbnailPath.replace(/^storage\//, "");
            return getS3PublicUrl(cleanPath);
        },
        [rootUrl],
    );

    const getFileUrl = useCallback(
        (filePath) => {
            if (!filePath) return null;

            const cleanPath = filePath.replace(/^storage\//, "");
            return getS3PublicUrl(cleanPath);
        },
        [rootUrl],
    );

    const getImageUrl = useCallback(
        (imagePath) => {
            if (!imagePath) return `${rootUrl}/default-islamic-thumbnail.jpg`;

            const cleanPath = imagePath.replace(/^storage\//, "");
            return getS3PublicUrl(cleanPath);
        },
        [rootUrl],
    );

    // Check if content has PDF
    const hasPdfDocument = useMemo(() => {
        return (
            islam.document_file &&
            islam.document_file.toLowerCase().endsWith(".pdf")
        );
    }, [islam.document_file]);

    // Format file size
    const formatFileSize = useCallback((bytes) => {
        if (!bytes) return "N/A";
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (
            Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
        );
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    // Memoized configuration
    const fileTypeConfig = useMemo(
        () => ({
            quran: {
                icon: "fas fa-quran",
                label: "Quran",
                badgeColor: "bg-primary",
            },
            audio: {
                icon: "fas fa-music",
                label: "Audio",
                badgeColor: "bg-primary",
            },
            video: {
                icon: "fas fa-video",
                label: "Video",
                badgeColor: "bg-danger",
            },
            ebook: {
                icon: "fas fa-book",
                label: "E-book",
                badgeColor: "bg-info",
            },
            article: {
                icon: "fas fa-file-alt",
                label: "Article",
                badgeColor: "bg-success",
            },
            pdf: {
                icon: "fas fa-file-pdf",
                label: "PDF Document",
                badgeColor: "bg-warning",
            },
        }),
        [],
    );

    const reactionTypes = useMemo(
        () => ({
            like: {
                icon: "fas fa-thumbs-up",
                label: "Like",
                color: "text-blue-400",
            },
            love: {
                icon: "fas fa-heart",
                label: "Love",
                color: "text-red-400",
            },
            dislike: {
                icon: "fas fa-thumbs-down",
                label: "Dislike",
                color: "text-yellow-400",
            },
        }),
        [],
    );

    // Enhanced toast system
    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "" }),
            4000,
        );
    }, []);

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading((prev) => ({ ...prev, initial: true }));

                // Set initial comments
                if (islam.comments) {
                    setComments(islam.comments);
                }

                // Fetch reactions
                await fetchReactions();
            } catch (error) {
                console.error("Error initializing data:", error);
                showToast("Failed to load content data", "error");
            } finally {
                setLoading((prev) => ({ ...prev, initial: false }));
            }
        };

        initializeData();
    }, [islam.id]);

    // Show flash messages
    useEffect(() => {
        if (flash.success) {
            showToast(flash.success, "success");
        }
        if (flash.error) {
            showToast(flash.error, "error");
        }
    }, [flash, showToast]);

    // Fetch reactions
    const fetchReactions = async () => {
        setLoading((prev) => ({ ...prev, reactions: true }));
        try {
            // Set default reaction counts
            setReactionCounts({
                like: islam.likes_count || 0,
                love: islam.loves_count || 0,
                dislike: islam.dislikes_count || 0,
            });
        } catch (error) {
            console.error("Error fetching reactions:", error);
            setReactionCounts({ like: 0, love: 0, dislike: 0 });
        } finally {
            setLoading((prev) => ({ ...prev, reactions: false }));
        }
    };

    // Handle reaction
    const handleReaction = useCallback(
        async (type) => {
            if (!auth.user) {
                showToast("Please login to react", "error");
                return;
            }

            if (loading.reactions) return;

            setLoading((prev) => ({ ...prev, reactions: true }));

            try {
                const response = await axios.post(
                    "/islamic-zone/reactions/toggle",
                    {
                        islamic_zone_id: islam.id,
                        type: type,
                    },
                );

                if (response.data.success) {
                    setReactionCounts((prev) => ({
                        ...prev,
                        ...response.data.reaction_counts,
                    }));
                    setUserReaction(response.data.user_reaction);
                    showToast(response.data.message, "success");
                } else {
                    throw new Error(
                        response.data.message || "Failed to update reaction",
                    );
                }
            } catch (error) {
                console.error("Error toggling reaction:", error);
                const message =
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to update reaction";
                showToast(message, "error");
            } finally {
                setLoading((prev) => ({ ...prev, reactions: false }));
            }
        },
        [auth.user, islam.id, loading.reactions, showToast],
    );

    // Handle comment submission
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !auth.user) return;

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

        // Optimistic update
        setComments((prev) => [tempComment, ...prev]);
        setCommentText("");

        try {
            const response = await axios.post("/islamic-zone/comments", {
                islamic_zone_id: islam.id,
                comment: commentText.trim(),
            });

            if (response.data.success) {
                // Replace temp comment with actual comment
                setComments((prev) =>
                    prev.map((comment) =>
                        comment.id === tempId ? response.data.comment : comment,
                    ),
                );
                showToast(response.data.message, "success");
            } else {
                throw new Error(
                    response.data.message || "Failed to add comment",
                );
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            // Remove temp comment on error
            setComments((prev) =>
                prev.filter((comment) => comment.id !== tempId),
            );
            showToast("Failed to add comment", "error");
        } finally {
            setLoading((prev) => ({ ...prev, comment: false }));
        }
    };

    // Handle reply submission
    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim() || !auth.user) return;

        setLoading((prev) => ({ ...prev, reply: true }));
        const tempId = `temp-reply-${Date.now()}`;
        const tempReply = {
            id: tempId,
            comment: replyText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            is_temp: true,
        };

        // Optimistic update
        setComments((prev) =>
            prev.map((comment) => {
                if (comment.id === parentId) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), tempReply],
                    };
                }
                return comment;
            }),
        );

        setReplyText("");
        setReplyingTo(null);

        try {
            const response = await axios.post("/islamic-zone/comments", {
                islamic_zone_id: islam.id,
                comment: replyText.trim(),
                parent_id: parentId,
            });

            if (response.data.success) {
                // Replace temp reply with actual reply
                setComments((prev) =>
                    prev.map((comment) => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: (comment.replies || []).map((reply) =>
                                    reply.id === tempId
                                        ? response.data.comment
                                        : reply,
                                ),
                            };
                        }
                        return comment;
                    }),
                );
                showToast(response.data.message, "success");
            } else {
                throw new Error(response.data.message || "Failed to add reply");
            }
        } catch (error) {
            console.error("Error adding reply:", error);
            // Remove temp reply on error
            setComments((prev) =>
                prev.map((comment) => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: (comment.replies || []).filter(
                                (reply) => reply.id !== tempId,
                            ),
                        };
                    }
                    return comment;
                }),
            );
            showToast("Failed to add reply", "error");
        } finally {
            setLoading((prev) => ({ ...prev, reply: false }));
        }
    };

    // Handle comment update
    const handleCommentUpdate = async (commentId) => {
        if (!editText.trim()) return;

        setLoading((prev) => ({ ...prev, update: true }));

        // Optimistic update
        const updatedComments = updateCommentInTree(
            comments,
            commentId,
            editText.trim(),
        );
        setComments(updatedComments);

        try {
            const response = await axios.put(
                `/islamic-zone/comments/${commentId}`,
                {
                    comment: editText.trim(),
                },
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message || "Failed to update comment",
                );
            }

            showToast("Comment updated successfully", "success");
            setEditingComment(null);
            setEditText("");
        } catch (error) {
            console.error("Error updating comment:", error);
            // Revert by re-fetching comments
            if (islam.comments) {
                setComments(islam.comments);
            }
            showToast("Failed to update comment", "error");
        } finally {
            setLoading((prev) => ({ ...prev, update: false }));
        }
    };

    // Helper function to update comment in tree
    const updateCommentInTree = (comments, commentId, newText) => {
        return comments.map((comment) => {
            if (comment.id === commentId) {
                return { ...comment, comment: newText };
            }
            if (comment.replies) {
                return {
                    ...comment,
                    replies: updateCommentInTree(
                        comment.replies,
                        commentId,
                        newText,
                    ),
                };
            }
            return comment;
        });
    };

    // Handle comment deletion
    const handleCommentDelete = async (commentId) => {
        if (
            !confirm(
                "Are you sure you want to delete this comment? This action cannot be undone.",
            )
        )
            return;

        setLoading((prev) => ({ ...prev, delete: true }));

        // Optimistic update
        const filteredComments = filterCommentFromTree(comments, commentId);
        setComments(filteredComments);

        try {
            const response = await axios.delete(
                `/islamic-zone/comments/${commentId}`,
            );

            if (!response.data.success) {
                throw new Error(
                    response.data.message || "Failed to delete comment",
                );
            }

            showToast("Comment deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting comment:", error);
            // Revert by re-fetching comments
            if (islam.comments) {
                setComments(islam.comments);
            }
            showToast("Failed to delete comment", "error");
        } finally {
            setLoading((prev) => ({ ...prev, delete: false }));
        }
    };

    // Helper function to filter comment from tree
    const filterCommentFromTree = (comments, commentId) => {
        return comments.filter((comment) => {
            if (comment.id === commentId) return false;
            if (comment.replies) {
                comment.replies = filterCommentFromTree(
                    comment.replies,
                    commentId,
                );
            }
            return true;
        });
    };

    // Toggle comment expansion
    const toggleCommentExpansion = (commentId) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // Enhanced Image Component with better error handling
    const ImageWithFallback = ({
        src,
        alt,
        className,
        fallbackSrc = "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png",
    }) => {
        const [imgSrc, setImgSrc] = useState(src);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(false);

        const handleError = () => {
            console.warn(`Image failed to load: ${src}`);
            setError(true);
            setImgSrc(fallbackSrc);
            setLoading(false);
        };

        const handleLoad = () => {
            setLoading(false);
            setError(false);
        };

        return (
            <div
                className={`image-container ${loading ? "loading" : ""} ${error ? "error" : ""}`}
            >
                {loading && (
                    <div className="image-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                    </div>
                )}
                <img
                    src={imgSrc}
                    alt={alt}
                    className={className}
                    onError={handleError}
                    onLoad={handleLoad}
                    style={{ display: loading ? "none" : "block" }}
                />
            </div>
        );
    };

    // PDF Preview Component
    const PDFPreview = ({ pdfUrl, canDownloadItem }) => {
        const [pdfLoadError, setPdfLoadError] = useState(false);
        const [isPdfLoading, setIsPdfLoading] = useState(true);
        const [numPages, setNumPages] = useState(null);
        const [pageNumber, setPageNumber] = useState(1);

        if (!pdfUrl) return null;

        function onDocumentLoadSuccess({ numPages }) {
            setNumPages(numPages);
            setPageNumber(1);
            setIsPdfLoading(false);
            setPdfLoadError(false);
        }

        function nextPage() {
            setPageNumber((prev) => (prev < numPages ? prev + 1 : prev));
        }

        function prevPage() {
            setPageNumber((prev) => (prev > 1 ? prev - 1 : prev));
        }

        return (
            <div className="pdf-preview-section">
                <div className="preview-header">
                    <h3 className="preview-title">
                        <i className="fas fa-file-pdf"></i>
                        PDF Preview
                    </h3>
                    <div className="preview-actions">
                        <a
                            href={canDownloadItem ? pdfUrl : "#"}
                            target="_blank"
                            rel={canDownloadItem ? "noopener noreferrer" : ""}
                            onClick={(e) => !canDownloadItem && e.preventDefault()}
                            className={`preview-action-btn ${!canDownloadItem ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                        >
                            <i className="fas fa-external-link-alt"></i>
                            Open in New Tab
                        </a>
                    </div>
                </div>

                <div className="pdf-preview-container">
                    {pdfLoadError && (
                        <div className="pdf-error">
                            <i className="fas fa-exclamation-triangle error-icon"></i>
                            <h4>Unable to Load PDF</h4>
                            <p>
                                The PDF document could not be loaded. Please try
                                downloading it instead.
                            </p>
                            <div className="error-actions">
                                <a
                                    href={canDownloadItem ? pdfUrl : "#"}
                                    download={canDownloadItem}
                                    onClick={(e) =>
                                        !canDownloadItem && e.preventDefault()
                                    }
                                    className={`error-btn primary ${!canDownloadItem ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                                >
                                    <i className="fas fa-download"></i>
                                    Download PDF
                                </a>
                            </div>
                        </div>
                    )}

                    {!pdfLoadError && (
                        <div className="pdf-viewer-wrapper">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={(error) => {
                                    console.error("PDF loading error:", error);
                                    setPdfLoadError(true);
                                    setIsPdfLoading(false);
                                }}
                                loading={
                                    <div className="pdf-loading">
                                        <div className="loading-spinner">
                                            <i className="fas fa-spinner fa-spin"></i>
                                        </div>
                                        <p>Loading PDF document...</p>
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                    loading={
                                        <div className="pdf-loading">
                                            <p>Loading page {pageNumber}...</p>
                                        </div>
                                    }
                                />
                            </Document>
                        </div>
                    )}
                </div>

                {!pdfLoadError && numPages && (
                    <div className="pdf-navigation">
                        <div className="pdf-info-footer">
                            <div className="info-grid">
                                <div className="info-item">
                                    <Button
                                        onClick={prevPage}
                                        type="primary"
                                        disabled={pageNumber <= 1}
                                    >
                                        &laquo; Prev
                                    </Button>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Counter</span>
                                    <span className="info-value">
                                        Page {pageNumber} of {numPages}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <Button
                                        onClick={nextPage}
                                        type="primary"
                                        disabled={pageNumber >= numPages}
                                    >
                                        Next &raquo;
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        const config = fileTypeConfig[islam.type] || fileTypeConfig.article;

        // If it's a content type that mainly uses the text/description (like quran/hadith)
        const isTextType = ["quran", "hadith"].includes(islam.type);

        return (
            <div className="islamic-content-container">
                {/* 1. Main Text Content (for Quran/Hadith) */}
                {isTextType && (
                    <div className="quran-content mb-8">
                        <div className="quran-header">
                            <i className={config.icon}></i>
                            <h4>{config.label} Content</h4>
                        </div>
                        {islam.content_text && (
                            <div className="quran-text">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: islam.content_text,
                                    }}
                                    className="prose arabic-text"
                                    style={{
                                        textAlign: "left",
                                        direction: "rtl",
                                    }}
                                />
                            </div>
                        )}
                        {islam.description && islam.description !== "loram" && (
                            <div className="quran-description">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: islam.description,
                                    }}
                                    className="prose"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PDF Documents Section */}
                {(islam.pdfs && islam.pdfs.length > 0) || hasPdfDocument ? (
                    <div className="pdf-section mb-8">
                        <div className="player-header mb-4">
                            <i className="fas fa-file-pdf"></i>
                            <span>PDF Documents</span>
                        </div>
                        {hasPdfDocument && (
                            <div className="mb-6">
                                <PDFPreview pdfUrl={getFileUrl(islam.document_file)} canDownloadItem={canDwonload} />
                            </div>
                        )}
                        {islam.pdfs && islam.pdfs.map((pdf, index) => (
                            <div key={pdf.id} className="mb-6">
                                <div className="text-sm font-medium mb-2">Document {index + 1}</div>
                                <PDFPreview pdfUrl={getFileUrl(pdf.pdf)} canDownloadItem={canDwonload} />
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* 3. Audio Files Section */}
                {(islam.audios && islam.audios.length > 0) || islam.audio_file ? (
                    <div className="audio-section mb-8">
                        <div className="player-header mb-4">
                            <i className="fas fa-music"></i>
                            <span>Audio Content</span>
                        </div>
                        {islam.audio_file && (
                            <div className="content-player mb-4">
                                <audio controls className="audio-player w-full" preload="metadata">
                                    <source src={getFileUrl(islam.audio_file)} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                        {islam.audios && islam.audios.map((audio, index) => (
                            <div key={audio.id} className="content-player mb-4">
                                <div className="text-sm font-medium mb-2">Audio {index + 1}</div>
                                <audio controls className="audio-player w-full" preload="metadata">
                                    <source src={getFileUrl(audio.audio)} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* 4. Video Files Section */}
                {(islam.videos && islam.videos.length > 0) || islam.video_file ? (
                    <div className="video-section mb-8">
                        <div className="player-header mb-4">
                            <i className="fas fa-video"></i>
                            <span>Video Content</span>
                        </div>
                        {islam.video_file && (
                            <div className="content-player mb-4">
                                <video controls className="video-player w-full" preload="metadata" poster={getImageUrl(islam.image)}>
                                    <source src={getFileUrl(islam.video_file)} type="video/mp4" />
                                    Your browser does not support the video element.
                                </video>
                            </div>
                        )}
                        {islam.videos && islam.videos.map((video, index) => (
                            <div key={video.id} className="content-player mb-4">
                                <div className="text-sm font-medium mb-2">Video {index + 1}</div>
                                <video controls className="video-player w-full" preload="metadata" poster={getImageUrl(islam.image)}>
                                    <source src={getFileUrl(video.video)} type="video/mp4" />
                                    Your browser does not support the video element.
                                </video>
                            </div>
                        ))}
                    </div>
                ) : null}

                {/* 5. YouTube Section */}
                {islam.youtube_url && (
                    <div className="youtube-section mt-6">
                         <div className="player-header mb-4">
                            <i className="fab fa-youtube text-red-600"></i>
                            <span>YouTube Content</span>
                        </div>
                        <div className="external-link">
                            <a href={islam.youtube_url} target="_blank" rel="noopener noreferrer" className="youtube-link">
                                <i className="fab fa-youtube"></i>
                                Watch on YouTube
                            </a>
                        </div>
                    </div>
                )}

                {/* 6. General/Fallback Description */}
                {!isTextType && islam.description && islam.description !== "loram" && (
                    <div className="article-content mt-8 border-t pt-6">
                        <div dangerouslySetInnerHTML={{ __html: islam.description }} className="prose" />
                    </div>
                )}
            </div>
        );
    };

    // Reaction button component
    const ReactionButton = ({ type, label, count }) => {
        const config = reactionTypes[type];
        const isActive = userReaction?.type === type;

        return (
            <button
                onClick={() => handleReaction(type)}
                disabled={loading.reactions}
                className={`reaction-btn ${isActive ? "active" : ""} ${loading.reactions ? "loading" : ""}`}
            >
                <i className={config.icon}></i>
                <span className="count">{count}</span>
                <span className="label">{label}</span>
            </button>
        );
    };

    // Comment component



    return (
        <>
            <Head>
                {/* Basic Meta Tags */}
                <title>{seoData.meta_title}</title>
                <meta name="description" content={seoData.meta_description} />
                <meta
                    name="keywords"
                    content={seoData.meta_keywords.join(", ")}
                />
                <meta name="robots" content={seoData.meta_robots} />

                {/* Open Graph Meta Tags */}
                <meta property="og:title" content={seoData.og_title} />
                <meta
                    property="og:description"
                    content={seoData.og_description}
                />
                <meta property="og:type" content={seoData.og_type} />
                <meta property="og:url" content={seoData.og_url} />
                <meta property="og:site_name" content={seoData.og_site_name} />
                {seoData.og_image && (
                    <meta property="og:image" content={seoData.og_image} />
                )}

                {/* Twitter Card Meta Tags */}
                <meta name="twitter:card" content={seoData.twitter_card} />
                <meta name="twitter:title" content={seoData.twitter_title} />
                <meta
                    name="twitter:description"
                    content={seoData.twitter_description}
                />
                {seoData.twitter_image && (
                    <meta
                        name="twitter:image"
                        content={seoData.twitter_image}
                    />
                )}
                <meta name="twitter:site" content={seoData.twitter_site} />
                <meta
                    name="twitter:creator"
                    content={seoData.twitter_creator}
                />

                {/* Canonical URL */}
                <link rel="canonical" href={seoData.canonical_url} />

                {/* Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(generateStructuredData()),
                    }}
                />

                {/* Additional Meta Tags */}
                <meta name="author" content="Muslim Hall" />
                <meta name="language" content={islam.language?.code || "en"} />
                <meta name="revisit-after" content="7 days" />
                <meta name="rating" content="general" />
            </Head>

            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <Header />

                    {/* Toast Notification */}
                    {toast.show && (
                        <div className={`toast-notification ${toast.type}`}>
                            <i
                                className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`}
                            ></i>
                            <span>{toast.message}</span>
                        </div>
                    )}

                    {/* Main Content Section */}
                    <div className="content-section" id="content">
                        <div className="container-md">
                            <div className="content-layout">
                                {/* Mobile Sidebar Toggle */}
                                <div className="block md:hidden mb-4">
                                    <div className="pi-wrap" style={{ marginTop: 0 }}>
                                        <button
                                            type="button"
                                            className="pi-head w-full bg-white"
                                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                                        >
                                            <span className="pi-title">CONTENT INFO</span>
                                            <span className={`pi-chevron ${mobileSidebarOpen ? "open" : ""}`}>
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Content Info Sidebar */}
                                <div className={`filter-sidebar ${mobileSidebarOpen ? "block" : "hidden"} md:block transition-all duration-300`}>
                                    <div className="filter-header hidden md:flex">
                                        <h3 className="filter-title">
                                            <i className="fas fa-info-circle"></i>
                                            Content Info
                                        </h3>
                                    </div>

                                    {/* Content Thumbnail */}
                                    <div className="content-thumbnail-container">
                                        {galleryImages.length > 0 ? (
                                            <ImageWithFallback
                                                src={getImageUrl(
                                                    galleryImages[0],
                                                )}
                                                alt={islam.title}
                                                className="content-thumbnail"
                                            />
                                        ) : islam.image ? (
                                            <ImageWithFallback
                                                src={getImageUrl(islam.image)}
                                                alt={islam.title}
                                                className="content-thumbnail"
                                            />
                                        ) : (
                                            <div className="no-thumbnail">
                                                <i className="fas fa-image"></i>
                                                <span>
                                                    No Thumbnail Available
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Stats */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-chart-bar"></i>
                                            Content Details
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Type:
                                                </span>
                                                <span className="stat-value capitalize">
                                                    {hasPdfDocument
                                                        ? "PDF Document"
                                                        : islam.type || "N/A"}
                                                </span>
                                            </div>
                                            {islam.file_size && (
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        File Size:
                                                    </span>
                                                    <span className="stat-value">
                                                        {formatFileSize(
                                                            islam.file_size,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Views:
                                                </span>
                                                <span className="stat-value">
                                                    {islam.views || 0}
                                                </span>
                                            </div>
                                            {viewerIps.length > 0 && (
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        Unique Visitors:
                                                    </span>
                                                    <span className="stat-value">
                                                        {viewerIps.length}
                                                    </span>
                                                </div>
                                            )}
                                            {islam.is_featured && (
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        Status:
                                                    </span>
                                                    <span className="stat-value featured">
                                                        Featured
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reactions Section */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-heart"></i>
                                            Reactions
                                        </h4>
                                        <div className="reactions-list">
                                            <ReactionButton
                                                type="like"
                                                label="Like"
                                                count={reactionCounts.like}
                                            />
                                            <ReactionButton
                                                type="love"
                                                label="Love"
                                                count={reactionCounts.love}
                                            />
                                            <ReactionButton
                                                type="dislike"
                                                label="Dislike"
                                                count={reactionCounts.dislike}
                                            />
                                        </div>
                                    </div>

                                    {/* Publication Info */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-calendar"></i>
                                            Publication
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Published:
                                                </span>
                                                <span className="stat-value">
                                                    {formatDate(
                                                        islam.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">
                                                    Updated:
                                                </span>
                                                <span className="stat-value">
                                                    {formatDate(
                                                        islam.updated_at,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gallery Images */}
                                    {galleryImages.length > 1 && (
                                        <div className="stats-group">
                                            <h4 className="stats-title">
                                                <i className="fas fa-images"></i>
                                                Gallery ({galleryImages.length})
                                            </h4>
                                            <div className="gallery-preview">
                                                {galleryImages
                                                    .slice(0, 3)
                                                    .map((image, index) => (
                                                        <ImageWithFallback
                                                            key={index}
                                                            src={getImageUrl(
                                                                image,
                                                            )}
                                                            alt={`${islam.title} - Image ${index + 1}`}
                                                            className="gallery-thumb"
                                                        />
                                                    ))}
                                                {galleryImages.length > 3 && (
                                                    <div className="gallery-more">
                                                        +
                                                        {galleryImages.length -
                                                            3}{" "}
                                                        more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Options */}
                                    <div className="download-options">
                                        <h4 className="stats-title"><i className="fas fa-download"></i> Downloads</h4>
                                        <div className="flex flex-col gap-2">
                                            {/* Single files if any */}
                                            {/* {islam.audio_file && (
                                                <a href={canDwonload ? getFileUrl(islam.audio_file) : "#"} download={canDwonload} className="download-btn secondary">
                                                    <i className="fas fa-music"></i> Audio File
                                                </a>
                                            )}
                                            {islam.video_file && (
                                                <a href={canDwonload ? getFileUrl(islam.video_file) : "#"} download={canDwonload} className="download-btn secondary">
                                                    <i className="fas fa-video"></i> Video File
                                                </a>
                                            )} */}
                                            {islam.document_file && (
                                                <a href={canDwonload ? getFileUrl(islam.document_file) : "#"} 
                                                   download={canDwonload} 
                                                   onClick={(e) => !canDwonload && e.preventDefault()}
                                                   className={`download-btn primary ${!canDwonload ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                                                    <i className="fas fa-file-pdf"></i> PDF Document
                                                </a>
                                            )}

                                            {/* Multiple files */}
                                            {/* {islam.audios && islam.audios.map((audio, idx) => (
                                                <a key={audio.id} href={canDwonload ? getFileUrl(audio.audio) : "#"} download={canDwonload} className="download-btn secondary">
                                                    <i className="fas fa-music"></i> Audio {idx + 1}
                                                </a>
                                            ))}
                                            {islam.videos && islam.videos.map((video, idx) => (
                                                <a key={video.id} href={canDwonload ? getFileUrl(video.video) : "#"} download={canDwonload} className="download-btn secondary">
                                                    <i className="fas fa-video"></i> Video {idx + 1}
                                                </a>
                                            ))} */}
                                            {islam.pdfs && islam.pdfs.map((pdf, idx) => (
                                                <a key={pdf.id} href={canDwonload ? getFileUrl(pdf.pdf) : "#"} 
                                                   download={canDwonload} 
                                                   onClick={(e) => !canDwonload && e.preventDefault()}
                                                   className={`download-btn primary ${!canDwonload ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                                                    <i className="fas fa-file-pdf"></i> PDF {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details Main Content */}
                                <div className="posts-grid-section">
                                    <div className="section-header">
                                        <h1 className="section-title">
                                            {islam.title}
                                        </h1>
                                        <div className="posts-count">
                                            {hasPdfDocument
                                                ? "PDF Document"
                                                : fileTypeConfig[islam.type]
                                                    ?.label || "Content"}{" "}
                                            •{" "}
                                            {islam.language?.name || "English"}
                                        </div>
                                    </div>

                                    {/* Content Meta */}
                                    <div className="content-meta-card">
                                        <div className="meta-grid">
                                            {islam.language && (
                                                <div className="meta-item">
                                                    <span className="meta-label">
                                                        Language
                                                    </span>
                                                    <span className="meta-value">
                                                        {islam.language.name} (
                                                        {islam.language.code})
                                                    </span>
                                                </div>
                                            )}
                                            <div className="meta-item">
                                                <span className="meta-label">
                                                    Type
                                                </span>
                                                <span className="meta-value capitalize">
                                                    {hasPdfDocument
                                                        ? "PDF Document"
                                                        : islam.type ||
                                                        "General"}
                                                </span>
                                            </div>
                                            {islam.calendar_type && (
                                                <div className="meta-item">
                                                    <span className="meta-label">
                                                        Calendar
                                                    </span>
                                                    <span className="meta-value">
                                                        {islam.calendar_type}
                                                    </span>
                                                </div>
                                            )}
                                            {islam.file_size && (
                                                <div className="meta-item">
                                                    <span className="meta-label">
                                                        File Size
                                                    </span>
                                                    <span className="meta-value">
                                                        {formatFileSize(
                                                            islam.file_size,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Player/Display */}
                                    <div className="content-display-card">
                                        {renderContent()}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="action-buttons-grid">
                                        {(islam.audio_file || islam.videos?.length > 0 || islam.audios?.length > 0 || islam.pdfs?.length > 0) && (
                                             <div className="flex flex-wrap gap-2 w-full">
                                                  <Text strong className="w-full mb-1">Download</Text>
                                                  {/* {islam.audio_file && (
                                                      <a href={canDwonload ? getFileUrl(islam.audio_file) : "#"} download={canDwonload} className="action-btn secondary text-xs py-1">
                                                          Audio
                                                      </a>
                                                  )}
                                                  {islam.video_file && (
                                                      <a href={canDwonload ? getFileUrl(islam.video_file) : "#"} download={canDwonload} className="action-btn secondary text-xs py-1">
                                                          Video
                                                      </a>
                                                  )} */}
                                                  {islam.document_file && (
                                                      <a href={canDwonload ? getFileUrl(islam.document_file) : "#"} 
                                                         download={canDwonload} 
                                                         onClick={(e) => !canDwonload && e.preventDefault()}
                                                         className={`action-btn secondary text-xs py-1 ${!canDwonload ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                                                          PDF
                                                      </a>
                                                  )}
                                                  {/* {islam.audios?.map((a, i) => (
                                                      <a key={a.id} href={canDwonload ? getFileUrl(a.audio) : "#"} download={canDwonload} className="action-btn secondary text-xs py-1">
                                                          Audio {i+1}
                                                      </a>
                                                  ))}
                                                  {islam.videos?.map((v, i) => (
                                                      <a key={v.id} href={canDwonload ? getFileUrl(v.video) : "#"} download={canDwonload} className="action-btn secondary text-xs py-1">
                                                          Video {i+1}
                                                      </a>
                                                  ))} */}
                                                  {islam.pdfs?.map((p, i) => (
                                                      <a key={p.id} href={canDwonload ? getFileUrl(p.pdf) : "#"} 
                                                         download={canDwonload} 
                                                         onClick={(e) => !canDwonload && e.preventDefault()}
                                                         className={`action-btn secondary text-xs py-1 ${!canDwonload ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
                                                          PDF {i+1}
                                                      </a>
                                                  ))}
                                             </div>
                                        )}
                                        {islam.youtube_url && (
                                            <a
                                                href={islam.youtube_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="action-btn danger"
                                            >
                                                <i className="fab fa-youtube"></i>
                                                Watch on YouTube
                                            </a>
                                        )}
                                        <button
                                            onClick={() =>
                                                document
                                                    .getElementById(
                                                        "comments-section",
                                                    )
                                                    .scrollIntoView({
                                                        behavior: "smooth",
                                                    })
                                            }
                                            className="action-btn secondary"
                                        >
                                            <i className="fas fa-comments"></i>
                                            View Comments ({comments.length})
                                        </button>
                                        <button
                                            className="action-btn outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    window.location.href,
                                                );
                                                showToast(
                                                    "Page URL copied to clipboard!",
                                                    "success",
                                                );
                                            }}
                                        >
                                            <i className="fas fa-share"></i>
                                            Share Content
                                        </button>
                                    </div>

                                    {/* Additional Information */}
                                    {/* <div className="additional-info-card">
                                        <h3 className="info-title">
                                            <i className="fas fa-info-circle"></i>
                                            Additional Information
                                        </h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">
                                                    Publication Date
                                                </span>
                                                <span className="info-value">
                                                    {formatDate(
                                                        islam.created_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">
                                                    Last Updated
                                                </span>
                                                <span className="info-value">
                                                    {formatDate(
                                                        islam.updated_at,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">
                                                    Total Views
                                                </span>
                                                <span className="info-value">
                                                    {islam.views || 0}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">
                                                    Content Type
                                                </span>
                                                <span className="info-value capitalize">
                                                    {hasPdfDocument
                                                        ? "PDF Document"
                                                        : islam.type}
                                                </span>
                                            </div>
                                            {islam.is_featured && (
                                                <div className="info-item">
                                                    <span className="info-label">
                                                        Featured
                                                    </span>
                                                    <span className="info-value featured">
                                                        Yes
                                                    </span>
                                                </div>
                                            )}
                                            {islam.status && (
                                                <div className="info-item">
                                                    <span className="info-label">
                                                        Status
                                                    </span>
                                                    <span className="info-value capitalize">
                                                        {islam.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div> */}

                                    {/* Comments Section */}
                                    <div
                                        className="comments-section-card"
                                        id="comments-section"
                                    >
                                        <div className="comments-header">
                                            <h3 className="comments-title">
                                                <i className="fas fa-comments"></i>
                                                Comments ({comments.length})
                                            </h3>
                                        </div>

                                        {/* Comment Form */}
                                        {auth.user ? (
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
                                                    placeholder="Share your thoughts about this content..."
                                                    className="comment-textarea"
                                                    rows="4"
                                                    required
                                                    maxLength={1000}
                                                />
                                                <div className="comment-form-footer">
                                                    <small className="char-count">
                                                        {commentText.length}
                                                        /1000 characters
                                                    </small>
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            loading.comment ||
                                                            !commentText.trim()
                                                        }
                                                        className="submit-comment-btn"
                                                    >
                                                        {loading.comment
                                                            ? "Posting..."
                                                            : "Post Comment"}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="login-prompt">
                                                <p>
                                                    Please{" "}
                                                    <Link
                                                        href="/login"
                                                        className="login-link"
                                                    >
                                                        login
                                                    </Link>{" "}
                                                    to leave a comment.
                                                </p>
                                            </div>
                                        )}

                                        {/* Comments List */}
                                        <div className="comments-list">
                                            {comments.map((comment) => (
                                                <CommentItem
                                                    key={comment.id}
                                                    comment={comment}
                                                    auth={auth}
                                                    expandedComments={expandedComments}
                                                    replyingTo={replyingTo}
                                                    replyText={replyText}
                                                    setReplyText={setReplyText}
                                                    setReplyingTo={setReplyingTo}
                                                    editingComment={editingComment}
                                                    setEditingComment={setEditingComment}
                                                    editText={editText}
                                                    setEditText={setEditText}
                                                    loading={loading}
                                                    formatDate={formatDate}
                                                    handleReplySubmit={handleReplySubmit}
                                                    handleCommentDelete={handleCommentDelete}
                                                    handleCommentUpdate={handleCommentUpdate}
                                                    toggleCommentExpansion={toggleCommentExpansion}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>

                <style jsx>{`
                    /* PDF Preview Styles */
                    .pdf-preview-section {
                        width: 100%;
                    }

                    .preview-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }

                    .preview-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #333;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .preview-actions {
                        display: flex;
                        gap: 10px;
                    }

                    .preview-action-btn {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                        border: 2px solid #1b7a3a;
                        border-radius: 6px;
                        color: #1b7a3a;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.3s ease;
                    }

                    .preview-action-btn:hover {
                        background: #1b7a3a;
                        color: white;
                    }

                    .pdf-preview-container {
                        border: 2px solid #e0e0e0;
                        border-radius: 12px;
                        overflow: hidden;
                        background: #f8f9fa;
                        position: relative;
                        min-height: 500px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .pdf-loading {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: #666;
                        padding: 40px;
                    }

                    .loading-spinner {
                        font-size: 2rem;
                        margin-bottom: 15px;
                        color: #1b7a3a;
                    }

                    .pdf-error {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 40px;
                        max-width: 400px;
                    }

                    .error-icon {
                        font-size: 3rem;
                        color: #dc3545;
                        margin-bottom: 20px;
                    }

                    .pdf-error h4 {
                        color: #333;
                        margin-bottom: 10px;
                    }

                    .pdf-error p {
                        color: #666;
                        margin-bottom: 25px;
                    }

                    .error-actions {
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                        justify-content: center;
                    }

                    .error-btn {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 20px;
                        border-radius: 6px;
                        text-decoration: none;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    }

                    .error-btn.primary {
                        background: #1b7a3a;
                        color: white;
                    }

                    .error-btn.primary:hover {
                        background: #15652e;
                    }

                    .error-btn.secondary {
                        background: transparent;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                    }

                    .error-btn.secondary:hover {
                        background: #1b7a3a;
                        color: white;
                    }

                    .pdf-viewer-wrapper {
                        width: 100%;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        background: white;
                    }

                    .pdf-page {
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }

                    .pdf-navigation {
                        margin-top: 20px;
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }

                    .nav-controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 20px;
                    }

                    .nav-btn {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                    }

                    .page-counter {
                        font-weight: 600;
                        color: #333;
                        font-size: 14px;
                    }

                    /* Existing styles remain the same */
                    /* Root URL debug info - remove in production */
                    .root-url-debug {
                        position: fixed;
                        bottom: 10px;
                        left: 10px;
                        background: rgba(0, 0, 0, 0.8);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        z-index: 9999;
                    }

                    /* Custom Content Info Mobile */
                    .pi-wrap {
                        border-radius: 14px;
                        background: rgba(248, 250, 252, 0.92);
                        border: 1px solid rgba(226, 232, 240, 0.9);
                        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                        overflow: hidden;
                        margin-top: 20px;
                    }
                    .pi-head { width: 100%; background: transparent; border: none; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
                    .pi-title { font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: 0.2px; text-transform: uppercase; }
                    .pi-chevron { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; color: #334155; background: rgba(226, 232, 240, 0.65); transition: transform 0.2s ease, background 0.2s ease; }
                    .pi-chevron.open { transform: rotate(180deg); background: rgba(226, 232, 240, 0.9); }
                    .pi-body { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.28s ease, opacity 0.2s ease; }
                    .pi-body.open { max-height: 1000px; opacity: 1; }
                    .pi-row { display: flex; gap: 10px; padding: 10px 12px; border-top: 1px solid rgba(226, 232, 240, 0.85); }
                    .pi-ico { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: rgba(226, 232, 240, 0.6); color: #0f172a; flex: 0 0 auto; }
                    .pi-text { min-width: 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
                    .pi-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
                    .pi-val { font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.25; word-break: break-word; }

                    /* Hero Section Styles */
                    .hero-section {
                        border-radius: 20px;
                        padding: 4rem 2rem;
                        margin: 2rem auto;
                        max-width: 100%;
                        color: white;
                        min-height: 400px;
                        display: flex;
                        align-items: center;
                        background:
                            linear-gradient(
                                135deg,
                                rgba(20, 108, 32, 0.9) 0%,
                                rgba(46, 139, 87, 0.9) 100%
                            ),
                            url("https://i.postimg.cc/wx0LVLsG/footer-decor-full.png");
                        background-size: cover;
                        background-position: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }

                    .hero-content {
                        flex: 1;
                        padding-right: 2rem;
                    }

                    .hero-title {
                        font-size: 42px;
                        font-weight: 700;
                        margin-bottom: 1.5rem;
                        line-height: 1.2;
                    }

                    .hero-text {
                        font-size: 1.1rem;
                        line-height: 1.8;
                        margin-bottom: 2rem;
                        opacity: 0.95;
                        max-width: 600px;
                    }

                    .hero-actions {
                        display: flex;
                        gap: 1rem;
                        flex-wrap: wrap;
                    }

                    .btn-more-info {
                        background-color: white;
                        color: #1b7a3a;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 50px;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        display: inline-block;
                        text-decoration: none;
                    }

                    .btn-more-info:hover {
                        background-color: #f0f0f0;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        text-decoration: none;
                        color: #1b7a3a;
                    }

                    .btn-more-info.varient-2 {
                        background-color: transparent;
                        color: white;
                        border: 2px solid white;
                    }

                    .btn-more-info.varient-2:hover {
                        background-color: white;
                        color: #1b7a3a;
                    }

                    .hero-image {
                        flex: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .hero-image img {
                        max-width: 100%;
                        object-fit: cover;
                        border-radius: 10px;
                        border: 1px solid gold;
                        box-shadow: 0px 0px 8px black;
                    }

                    /* Main Content Section */
                    .content-section {
                        padding: 80px 0;
                        background-color: #f9f9f9;
                    }

                    .content-layout {
                        display: grid;
                        grid-template-columns: 300px 1fr;
                        gap: 40px;
                        margin: 0 auto;
                    }

                    /* Content Info Sidebar */
                    .filter-sidebar {
                        background: #338447 !important;
                        border-radius: 15px;
                        padding: 30px;
                        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                        height: fit-content;
                        position: sticky;
                        top: 100px;
                    }

                    .filter-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .filter-title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #ffffffff;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .filter-title i {
                        color: #1b7a3a;
                    }

                    /* Content Thumbnail */
                    .content-thumbnail-container {
                        text-align: center;
                        margin-bottom: 25px;
                    }

                    .content-thumbnail {
                        width: 100%;
                        max-width: 200px;
                        border-radius: 12px;
                        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                        border: 3px solid white;
                    }

                    /* Image Container Styles */
                    .image-container {
                        position: relative;
                        display: inline-block;
                    }

                    .image-container.loading {
                        min-height: 100px;
                        background: #f0f0f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 8px;
                    }

                    .image-loading {
                        color: #1b7a3a;
                        font-size: 1.5rem;
                    }

                    .image-container.error img {
                        opacity: 0.7;
                    }

                    /* Stats Group */
                    .stats-group {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #f0f0f0;
                    }

                    .stats-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #ffffffff;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .stats-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                        margin-bottom: 15px;
                    }

                    .stat-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 13px;
                    }

                    .stat-label {
                        color: #ffffffff;
                    }

                    .stat-value {
                        color: #ffffffff;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }

                    /* Reactions */
                    .reactions-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .reaction-btn {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 10px 15px;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        transition: all 0.3s ease;
                        width: 100%;
                    }

                    .reaction-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }

                    .reaction-btn.active {
                        background: #1b7a3a;
                        border-color: #1b7a3a;
                    }

                    .reaction-btn.loading {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .reaction-btn .count {
                        font-weight: 600;
                    }

                    .reaction-btn .label {
                        flex: 1;
                        text-align: left;
                    }

                    /* Download Options */
                    .download-options {
                        margin: 25px 0;
                    }

                    .download-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 12px 15px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100%;
                    }

                    .download-btn.primary {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                    }

                    .download-btn.primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    /* Posts Grid Section */
                    .posts-grid-section {
                        border-radius: 15px;
                    }

                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .section-title {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin: 0;
                    }

                    .posts-count {
                        color: #666;
                        font-size: 14px;
                        font-weight: 500;
                    }

                    /* Content Meta Card */
                    .content-meta-card {
                        background: white;
                        border-radius: 15px;
                        padding: 25px;
                        margin-bottom: 25px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                        border: 1px solid #f0f0f0;
                    }

                    .meta-grid {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fit,
                            minmax(200px, 1fr)
                        );
                        gap: 20px;
                    }

                    .meta-item {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }

                    .meta-label {
                        font-size: 12px;
                        color: #666;
                        font-weight: 500;
                    }

                    .meta-value {
                        font-size: 14px;
                        color: #333;
                        font-weight: 600;
                    }

                    /* Content Display Card */
                    .content-display-card {
                        background: white;
                        border-radius: 15px;
                        padding: 30px;
                        margin-bottom: 25px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                        border: 1px solid #f0f0f0;
                    }

                    .content-player {
                        width: 100%;
                    }

                    .player-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 15px;
                        color: #333;
                        font-weight: 600;
                    }

                    .audio-player,
                    .video-player {
                        width: 100%;
                        border-radius: 8px;
                    }

                    .download-section {
                        text-align: center;
                        padding: 40px 20px;
                    }

                    .download-content i {
                        font-size: 3rem;
                        color: #1b7a3a;
                        margin-bottom: 15px;
                    }

                    .download-content h5 {
                        color: #333;
                        margin-bottom: 10px;
                    }

                    .download-content p {
                        color: #666;
                        margin-bottom: 20px;
                    }

                    .article-content {
                        color: #666;
                        line-height: 1.6;
                    }

                    .prose {
                        max-width: none;
                    }

                    /* Action Buttons */
                    .action-buttons-grid {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fit,
                            minmax(200px, 1fr)
                        );
                        gap: 15px;
                        margin-bottom: 25px;
                    }

                    .action-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 15px 20px;
                        border-radius: 10px;
                        font-weight: 600;
                        text-decoration: none;
                        transition: all 0.3s ease;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                    }

                    .action-btn.primary {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                    }

                    .action-btn.primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    .action-btn.secondary {
                        background: white;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                    }

                    .action-btn.secondary:hover {
                        background: #1b7a3a;
                        color: white;
                        transform: translateY(-2px);
                    }

                    .action-btn.danger {
                        background: #dc3545;
                        color: white;
                        border: 2px solid #dc3545;
                    }

                    .action-btn.danger:hover {
                        background: #c82333;
                        border-color: #bd2130;
                        transform: translateY(-2px);
                    }

                    .action-btn.outline {
                        background: transparent;
                        color: #666;
                        border: 2px solid #e0e0e0;
                    }

                    .action-btn.outline:hover {
                        background: #f8f9fa;
                        border-color: #666;
                        color: #333;
                    }

                    /* Additional Info Card */
                    .additional-info-card {
                        background: white;
                        border-radius: 15px;
                        padding: 30px;
                        margin-bottom: 25px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                        border: 1px solid #f0f0f0;
                    }

                    .info-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(
                            auto-fit,
                            minmax(200px, 1fr)
                        );
                        gap: 20px;
                    }

                    .info-item {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }

                    .info-label {
                        font-size: 12px;
                        color: #666;
                        font-weight: 500;
                    }

                    .info-value {
                        font-size: 14px;
                        color: #333;
                        font-weight: 600;
                    }

                    /* Comments Section */
                    .comments-section-card {
                        background: white;
                        border-radius: 15px;
                        padding: 30px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                        border: 1px solid #f0f0f0;
                    }

                    .comments-header {
                        margin-bottom: 25px;
                    }

                    .comments-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #333;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .comment-form {
                        margin-bottom: 30px;
                    }

                    .comment-textarea {
                        width: 100%;
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 14px;
                        resize: vertical;
                        transition: border-color 0.3s ease;
                    }

                    .comment-textarea:focus {
                        outline: none;
                        border-color: #1b7a3a;
                    }

                    .comment-form-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 10px;
                    }

                    .char-count {
                        color: #666;
                        font-size: 12px;
                    }

                    .submit-comment-btn {
                        background: #1b7a3a;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }

                    .submit-comment-btn:hover:not(:disabled) {
                        background: #15652e;
                    }

                    .submit-comment-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .login-prompt {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .login-prompt p {
                        margin: 0;
                        color: #666;
                    }

                    .login-link {
                        color: #1b7a3a;
                        text-decoration: none;
                        font-weight: 600;
                    }

                    .login-link:hover {
                        text-decoration: underline;
                    }

                    .no-comments {
                        text-align: center;
                        padding: 40px 20px;
                        color: #666;
                    }

                    .no-comments i {
                        font-size: 3rem;
                        margin-bottom: 15px;
                        color: #ddd;
                    }

                    /* Comment Items */
                    .comment-item {
                        margin-bottom: 20px;
                    }

                    .comment-item.nested {
                        margin-left: 40px;
                        border-left: 2px solid #e9ecef;
                        padding-left: 20px;
                    }

                    .comment-item.temp {
                        opacity: 0.6;
                    }

                    .comment-content {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        border: 1px solid #e9ecef;
                        transition: all 0.3s ease;
                        position: relative;
                        border-left: 4px solid #1b7a3a;
                        margin-left: 0;
                        margin-right: 0;
                        width: 100%;
                        box-sizing: border-box;
                        display: block;
                        overflow: hidden;
                        word-wrap: break-word;
                        max-width: 100%;
                        min-width: 0;
                    }

                    .comment-item.temp .comment-content {
                        border-style: dashed;
                    }

                    .comment-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 10px;
                    }

                    .user-info {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .user-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: #1b7a3a;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: 14px;
                    }

                    .user-details {
                        display: flex;
                        flex-direction: column;
                    }

                    .user-name {
                        font-weight: 600;
                        color: #333;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .posting-badge {
                        background: #ffc107;
                        color: #000;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 600;
                    }

                    .comment-date {
                        font-size: 12px;
                        color: #666;
                    }

                    .comment-actions {
                        display: flex;
                        gap: 10px;
                    }

                    .edit-btn,
                    .delete-btn {
                        background: none;
                        border: none;
                        color: #666;
                        font-size: 12px;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 4px;
                        transition: all 0.3s ease;
                    }

                    .edit-btn:hover {
                        color: #1b7a3a;
                        background: rgba(27, 122, 58, 0.1);
                    }

                    .delete-btn:hover {
                        color: #dc3545;
                        background: rgba(220, 53, 69, 0.1);
                    }

                    .comment-text {
                        color: #333;
                        line-height: 1.5;
                        margin-bottom: 10px;
                        word-wrap: break-word;
                    }

                    .comment-footer {
                        display: flex;
                        gap: 15px;
                        padding-top: 10px;
                        border-top: 1px solid #e9ecef;
                    }

                    .reply-btn,
                    .toggle-replies-btn {
                        background: none;
                        border: none;
                        color: #1b7a3a;
                        font-size: 12px;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 4px;
                        transition: all 0.3s ease;
                    }

                    .reply-btn:hover,
                    .toggle-replies-btn:hover {
                        background: rgba(27, 122, 58, 0.1);
                    }

                    /* Edit and Reply Forms */
                    .edit-form,
                    .reply-form {
                        margin-top: 10px;
                    }

                    .edit-textarea,
                    .reply-textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 14px;
                        resize: vertical;
                        transition: border-color 0.3s ease;
                    }

                    .edit-textarea:focus,
                    .reply-textarea:focus {
                        outline: none;
                        border-color: #1b7a3a;
                    }

                    .edit-actions,
                    .reply-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 10px;
                    }

                    .save-btn,
                    .submit-reply-btn {
                        background: #1b7a3a;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }

                    .save-btn:hover:not(:disabled),
                    .submit-reply-btn:hover:not(:disabled) {
                        background: #15652e;
                    }

                    .save-btn:disabled,
                    .submit-reply-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .cancel-btn,
                    .cancel-reply-btn {
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }

                    .cancel-btn:hover,
                    .cancel-reply-btn:hover {
                        background: #5a6268;
                    }

                    .replies-container {
                        margin-top: 15px;
                    }

                    /* Toast Notification */
                    .toast-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 15px 20px;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        animation: slideIn 0.3s ease;
                    }

                    .toast-notification.success {
                        background: #28a745;
                    }

                    .toast-notification.error {
                        background: #dc3545;
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

                    /* Gallery Preview */
                    .gallery-preview {
                        display: flex;
                        gap: 8px;
                        margin-top: 10px;
                    }

                    .gallery-thumb {
                        width: 60px;
                        height: 60px;
                        object-fit: cover;
                        border-radius: 6px;
                        border: 2px solid white;
                    }

                    .gallery-more {
                        width: 60px;
                        height: 60px;
                        background: #f8f9fa;
                        border: 2px dashed #dee2e6;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6c757d;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    /* Content Unavailable */
                    .content-unavailable {
                        text-align: center;
                        padding: 40px 20px;
                        color: #666;
                    }

                    .content-unavailable i {
                        font-size: 3rem;
                        color: #ddd;
                        margin-bottom: 15px;
                    }

                    .content-unavailable h4 {
                        color: #333;
                        margin-bottom: 10px;
                    }

                    /* Responsive PDF Viewer Full Width Fix */
                    .pdf-viewer-wrapper {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        overflow: hidden;
                    }
                    .pdf-viewer-wrapper .react-pdf__Document {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                    }
                    .pdf-viewer-wrapper .react-pdf__Page {
                        width: 100% !important;
                        display: flex;
                        justify-content: center;
                    }
                    .pdf-viewer-wrapper .react-pdf__Page canvas {
                        width: 100% !important;
                        height: auto !important;
                        max-width: 100%;
                    }

                    /* Responsive Design */
                    @media (max-width: 1024px) {
                        .content-layout {
                            grid-template-columns: 1fr;
                            gap: 30px;
                        }

                        .filter-sidebar {
                            position: static;
                        }

                        .hero-section {
                            flex-direction: column;
                            text-align: center;
                            padding: 3rem 1.5rem;
                        }

                        .hero-content {
                            padding-right: 0;
                            margin-bottom: 2rem;
                        }

                        .hero-title {
                            font-size: 2.5rem;
                        }

                        .meta-grid,
                        .info-grid {
                            grid-template-columns: 1fr;
                        }

                        .nav-controls {
                            flex-direction: column;
                            gap: 10px;
                        }
                    }

                    @media (max-width: 768px) {
                        .section-header {
                            flex-direction: column;
                            gap: 15px;
                            text-align: center;
                        }

                        .preview-header {
                            flex-direction: column;
                            gap: 15px;
                            text-align: center;
                        }

                        .action-buttons-grid {
                            grid-template-columns: 1fr;
                        }

                        .comment-header {
                            flex-direction: column;
                            gap: 10px;
                            align-items: flex-start;
                        }

                        .comment-actions {
                            align-self: flex-end;
                        }

                        .hero-title {
                            font-size: 2rem;
                        }

                        .hero-text {
                            font-size: 1rem;
                        }

                        .content-section {
                            padding: 40px 0;
                        }

                        .filter-sidebar,
                        .posts-grid-section {
                            padding: 20px;
                        }

                        .content-meta-card,
                        .content-display-card,
                        .additional-info-card,
                        .comments-section-card {
                            padding: 20px;
                        }

                        .comment-item.nested {
                            margin-left: 20px;
                            padding-left: 15px;
                        }

                        .pdf-preview-container {
                            min-height: 400px;
                        }
                    }

                    @media (max-width: 480px) {
                        .hero-actions {
                            flex-direction: column;
                            align-items: center;
                        }

                        .btn-more-info {
                            width: 100%;
                            text-align: center;
                        }

                        .edit-actions,
                        .reply-actions {
                            flex-direction: column;
                        }

                        .comment-footer {
                            flex-direction: column;
                            gap: 8px;
                        }

                        .toast-notification {
                            left: 20px;
                            right: 20px;
                        }

                        .gallery-preview {
                            flex-wrap: wrap;
                        }

                        .error-actions {
                            flex-direction: column;
                            width: 100%;
                        }

                        .error-btn {
                            width: 100%;
                            justify-content: center;
                        }

                        .preview-actions {
                            flex-direction: column;
                            width: 100%;
                        }

                        .preview-action-btn {
                            width: 100%;
                            justify-content: center;
                        }

                        .nav-controls {
                            flex-direction: column;
                        }

                        .nav-btn {
                            width: 100%;
                            justify-content: center;
                        }
                    }
                `}</style>

                {/* Debug element - remove in production */}
                <div className="root-url-debug" style={{ display: "none" }}>
                    Root URL: {rootUrl}
                </div>
            </FrontAuthenticatedLayout>
        </>
    );
}

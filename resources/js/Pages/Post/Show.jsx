import FrontAuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    CalendarOutlined,
    EyeOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
     ArrowLeftOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { Head, Link, router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import PDFViewer from "../../Components/PDFViewer";
import PostInfoDropdown from "../../Components/PostInfoDropdown";
import ImageContent from "../Front/ImageContent";
import { Button, Popconfirm, Space, Tag, message } from "antd";


export default function Show() {
    const {
        post,
        auth,
        flash,
        reaction_counts,
        userReactionType,
        relatedPosts,
    } = usePage().props;

    const handleDelete = () => {
    router.delete(route("admin.posts.destroy", post.id), {
        preserveScroll: true,
        onSuccess: () => {
            message.success("Post deleted successfully");
            router.visit(route("admin.posts.index"));
        },
        onError: () => {
            message.error("Failed to delete post");
        },
    });
};

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

    // ----------------------------
    // S3 URL Helpers (ALL MEDIA)
    // ----------------------------
    const s3 = useCallback((pathOrUrl) => {
        if (!pathOrUrl) return null;
        return getS3PublicUrl(pathOrUrl);
    }, []);

    const media = useMemo(() => {
        const images = [];

        if (Array.isArray(post?.images) && post.images.length) {
            post.images.forEach((img) => {
                const p = typeof img === "string" ? img : img?.image;
                if (p) images.push(s3(p));
            });
        }

        const thumbnail = s3(post?.thumbnail);
        const image = s3(post?.image);
        const sponsor = s3(post?.sponsor);

        // Only include single-field media if NOT 'processing'
        const pdf   = post?.pdf   && post.pdf   !== 'processing' ? s3(post.pdf)   : null;
        const audio = post?.audio && post.audio !== 'processing' ? s3(post.audio) : null;
        const video = post?.video && post.video !== 'processing' ? s3(post.video) : null;

        // Filter out 'processing' entries from relationship arrays
        const postVideos = Array.isArray(post?.videos)
            ? post.videos
                .filter(v => v.video && v.video !== 'processing')
                .map(v => ({ id: v.id, url: s3(v.video) }))
            : [];
        const postAudios = Array.isArray(post?.audios)
            ? post.audios
                .filter(a => a.audio && a.audio !== 'processing')
                .map(a => ({ id: a.id, url: s3(a.audio) }))
            : [];
        const postPdfs = Array.isArray(post?.pdfs)
            ? post.pdfs
                .filter(p => p.pdf && p.pdf !== 'processing')
                .map(p => ({ id: p.id, url: s3(p.pdf) }))
            : [];

        const video_url = post?.video_url || null;

        return {
            images, thumbnail, image, sponsor,
            pdf, audio, video,
            postVideos, postAudios, postPdfs,
            video_url,
        };
    }, [post, s3]);

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

    const availableMediaTypes = useMemo(() => {
        const types = [];
        if (media?.images?.length || media?.image || media?.thumbnail)
            types.push("image");
        // Only count pdf if it's truly ready (not processing)
        if (post?.pdf_content || media?.pdf || media?.postPdfs?.length) types.push("pdf");
        if (post?.content) types.push("content");
        if (media?.video || media?.video_url || media?.postVideos?.length) types.push("video");
        if (media?.audio || media?.postAudios?.length) types.push("audio");
        if (media?.sponsor) types.push("sponsor");
        // Deduplicate
        return [...new Set(types)];
    }, [post, media]);

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
        const sending = commentText.trim();
        setCommentText("");

        try {
            const response = await axios.post("/post/comments", {
                post_id: post.id,
                comment: sending,
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
    const CommentItem = ({ comment, level = 0 }) => {
        const isExpanded = expandedComments.has(comment.id);
        const [replyText, setReplyText] = useState("");
        const hasReplies = comment.replies && comment.replies.length > 0;

        const submitReply = async (e) => {
            e.preventDefault();
            if (!replyText.trim()) return;
            setLoading((prev) => ({ ...prev, comment: true }));
            try {
                await axios.post("/post/comments", {
                    post_id: post.id,
                    comment: replyText,
                    parent_id: comment.id,
                });
                setReplyText("");
                showToast("Reply posted", "success");
                // you can reload comments via API if you want
            } catch (e2) {
                showToast("Failed to reply", "error");
            } finally {
                setLoading((prev) => ({ ...prev, comment: false }));
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

    // ----------------------------
    // MEDIA CONTENT (S3 URLs)
    // ----------------------------
    const SponsorContent = () => {
        if (!media?.sponsor) return null;

        return (
            <div className="main-image-section">
                <div className="hero-frame">
                    <img
                        src={media.sponsor}
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
        if (!post?.pdf_content && !media?.pdf && !media?.postPdfs?.length) return null;

        return (
            <div className="pdf-section">
                {media?.pdf && <PDFViewer pdfPath={media.pdf} />}
                {media?.postPdfs?.map((p) => (
                    <div key={p.id} className="mb-4">
                        <PDFViewer pdfPath={p.url} />
                    </div>
                ))}
            </div>
        );
    };

    const ArticleContent = () => {
        if (!post?.content) return null;

        // Fix old /storage/... or http://localhost/storage/... editor image URLs
        // so they display correctly from S3
        const fixedContent = post.content.replace(
            /src="((?:https?:\/\/[^"]*)?(?:\/storage\/|storage\/)([^"]+))"/g,
            (match, fullPath, relativePath) => {
                // e.g. relativePath = "editor/filename.jpg"
                const s3Url = `https://muslimhall.s3.ap-south-1.amazonaws.com/${relativePath}`;
                return `src="${s3Url}"`;
            }
        );

        return (
            <div className="article-section">
                <article className="article-body">
                    <div
                        className="rich-text"
                        dangerouslySetInnerHTML={{
                            __html: fixedContent,
                        }}
                    />
                </article>
            </div>
        );
    };

    const ProcessingBadge = () => (
        <div className="video-player-container">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "24px 20px",
                    background: "#f0f9f4",
                    border: "2px dashed #1b7a3a",
                    borderRadius: "10px",
                    color: "#1b7a3a",
                    fontWeight: 600,
                    fontSize: "15px",
                }}
            >
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "22px" }}></i>
                <span>Video is being processed... Please check back in a few minutes.</span>
            </div>
        </div>
    );

    const AudioProcessingBadge = () => (
        <div className="audio-player-container mb-4">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 20px",
                    background: "#f0f9f4",
                    border: "2px dashed #1b7a3a",
                    borderRadius: "10px",
                    color: "#1b7a3a",
                    fontWeight: 600,
                    fontSize: "14px",
                }}
            >
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "18px" }}></i>
                <span>Audio is being processed... Please check back soon.</span>
            </div>
        </div>
    );

    const VideoContent = () => {
        // media.postVideos already excludes 'processing' entries (filtered in useMemo)
        const hasReadyVideo = media?.video || media?.video_url || media?.postVideos?.length;
        if (!hasReadyVideo) return null;

        return (
            <div className="video-section">
                {media?.video && (
                    <div className="video-player-container">
                        <div className="video-wrapper">
                            <video
                                controls
                                className="video-player"
                                poster={media.image || media.thumbnail || undefined}
                            >
                                <source src={media.video} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                )}

                {media?.postVideos?.map((v) => (
                    <div key={v.id} className="video-player-container">
                        <div className="video-wrapper">
                            <video
                                controls
                                className="video-player"
                                poster={media.image || media.thumbnail || undefined}
                            >
                                <source src={v.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                ))}

                {media?.video_url && (
                    <div className="video-embed-container">
                        <div className="video-embed-wrapper">
                            <iframe
                                src={media.video_url}
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

    // AudioContent — media.postAudios already excludes 'processing' entries
    const AudioContent = () => {
        if (!media?.audio && !media?.postAudios?.length) return null;

        return (
            <div className="audio-section">
                {media?.audio && (
                    <div className="audio-player-container mb-4">
                        <div className="audio-player-wrapper">
                            <audio controls className="audio-player">
                                <source src={media.audio} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                )}

                {media?.postAudios?.map((a) => (
                    <div key={a.id} className="audio-player-container mb-4">
                        <div className="audio-player-wrapper">
                            <audio controls className="audio-player">
                                <source src={a.url} type="audio/mpeg" />
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
                    {relatedPosts.map((rp) => {
                        const rpImg = rp?.image
                            ? s3(rp.image)
                            : rp?.thumbnail
                              ? s3(rp.thumbnail)
                              : "https://i.postimg.cc/ZYPgbTMN/download-4.png";

                        return (
                            <div key={rp.id} className="related-post-card">
                                <Link
                                    href={`/post-detail/${rp.slug}`}
                                    className="related-card-link"
                                >
                                    <div className="related-card-img-wrapper">
                                        <img
                                            src={rpImg}
                                            alt={rp.title}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src =
                                                    "https://i.postimg.cc/ZYPgbTMN/download-4.png";
                                            }}
                                        />
                                        <span className="related-category-tag">
                                            {rp.category?.name || "General"}
                                        </span>
                                    </div>

                                    <div className="related-card-body">
                                        <h4 className="related-card-title">
                                            {rp.title?.length > 60
                                                ? `${rp.title.substring(
                                                      0,
                                                      60,
                                                  )}...`
                                                : rp.title}
                                        </h4>

                                        <div className="related-card-meta">
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
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    };

    const postItems = [
        {
            label: "Category",
            value: post?.category?.name || "General",
            icon: <FolderOpenOutlined />,
        },
        {
            label: "Published",
            value: formatDate(post?.created_at),
            icon: <CalendarOutlined />,
        },
        {
            label: "Views",
            value: post?.viewer_count || 0,
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
                {toast.show && (
                    <div
                        className={`
                            fixed top-20 right-6 z-10
                            px-4 py-3
                            rounded-lg shadow-lg
                            text-white font-medium
                            animate-slide-in-right
                            ${
                                toast.type === "success"
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
                    <div className="admin-actions-bar mb-4">
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <Link href={route("admin.posts.index")}>
            <Button icon={<ArrowLeftOutlined />} type="text">
                Back to Post List
            </Button>
        </Link>

        <Space wrap>
            <Tag color={post.status == 1 ? "green" : "orange"}>
                {post.status == 1 ? "PUBLISHED" : "DRAFT"}
            </Tag>

            <Link href={route("admin.posts.edit", post.id)}>
                <Button type="primary" icon={<EditOutlined />}>
                    Edit Post
                </Button>
            </Link>

            <Popconfirm
                title="Delete post?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
                okType="danger"
            >
                <Button danger icon={<DeleteOutlined />}>
                    Delete
                </Button>
            </Popconfirm>
        </Space>
    </div>
</div>
                    {/* Header Section */}
                    <header className="post-header-section">
                        <h1 className="main-heading text-center">
                            {post?.title}
                        </h1>
                        <div className="max-w-lg mx-auto">
                            <PostInfoDropdown
                                title="Information"
                                items={postItems}
                            />
                        </div>
                    </header>

                    <div className="max-w-5xl mx-auto ">
                        <main className="content-column">
                            {/* Keep your ImageContent component, but pass S3 URLs if it supports it */}
                            <ImageContent post={post} />

                            <PdfContent />
                            <ArticleContent />
                            <VideoContent />
                            <AudioContent />
                            <SponsorContent />

                            {/* Related */}
                            <RelatedPosts />
                        </main>
                    </div>
                </div>

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
                        borderradius: 20px;
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    }

                    .meta-pill i {
                        color: #1b7a3a;
                    }

                    /* --- CONTENT SECTIONS --- */
                    .main-image-section {
                        margin-bottom: 30px;
                    }

                    .hero-frame {
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        margin: 10px !important ;
                    }

                    .hero-img {
                        width: 100%;
                        height: auto;
                        display: block;
                        max-height: 500px;
                        object-fit: cover;
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

                    /* PDF Section */
                    .pdf-section {
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    /* Article Section */
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

                    /* Video Section */
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

                    /* Audio Section */
                    .audio-section {
                        background: white;
                        border-radius: 8px;
                        padding: 25px;
                        margin-bottom: 30px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    }

                    .audio-player {
                        width: 100%;
                        border-radius: 5px;
                    }

                    /* Related posts */
                    .related-posts-section {
                        margin: 40px 0;
                        padding: 18px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
                        object-fit: cover;
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
                    .related-card-date,
                    .related-card-views {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                    }

                    /* Responsive */
                    @media (max-width: 1024px) {
                        .related-posts-grid {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                        }
                    }
                    @media (max-width: 600px) {
                        .container {
                            padding: 18px 12px 50px;
                        }
                        .main-heading {
                            font-size: 26px;
                        }
                        .comment-block.is-child {
                            margin-left: 14px;
                        }
                        .related-posts-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        </FrontAuthenticatedLayout>
    );
}

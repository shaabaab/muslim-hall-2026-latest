import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import Header from "./Header";
import Footer from "./Footer";
import { Head } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";


export default function Community() {
    const { community, auth, categories, popular_tags } = usePage().props;

    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        sort: "newest",
        category: "all",
        tag: "all",
    });

    const [expandedPost, setExpandedPost] = useState(null);
    const [commentText, setCommentText] = useState({});
    const [replyText, setReplyText] = useState({});
    const [showReplyForm, setShowReplyForm] = useState({});
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState({});
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);

    const [postFormData, setPostFormData] = useState({
        title: "",
        content: "",
        category: "",
        mood: "",
        location: "",
        tags: "",
        image: null,
        is_featured: false,
        status: "published",
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const moods = [
        { value: "alhamdulillah", emoji: "🤲", label: "Alhamdulillah" },
        { value: "blessed", emoji: "✨", label: "Blessed" },
        { value: "grateful", emoji: "💚", label: "Grateful" },
        { value: "motivated", emoji: "💪", label: "Motivated" },
        { value: "peaceful", emoji: "🕊️", label: "Peaceful" },
        { value: "reflective", emoji: "🌙", label: "Reflective" },
        { value: "happy", emoji: "😊", label: "Happy" },
        { value: "sad", emoji: "😢", label: "Sad" },
        { value: "seeking_dua", emoji: "🤍", label: "Need Dua" },
    ];

    // City list — searchable

    // --- Navigation & Routing ---
    const handlePostClick = (postId, e) => {
        if (
            e &&
            e.target.closest(
                ".comments-section, .comment-thread, .comment, .comment-actions, .comment-action-btn, .reaction-picker, .footer-btn",
            )
        ) {
            return;
        }
        router.visit(`/community-details/${postId}`);
    };

    // Debounced filter updates
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route("community"), filters, {
                preserveState: true,
                replace: true,
                only: ["community", "filters"],
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        const clearedFilters = {
            search: "",
            sort: "newest",
            category: "all",
            tag: "all",
        };
        setFilters(clearedFilters);
    };

    // --- Helpers ---
    const formatNumber = (num) => {
        if (!num) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const reactionTypes = {
        like: { emoji: "👍", label: "Like" },
        love: { emoji: "❤️", label: "Love" },
        laugh: { emoji: "😂", label: "Haha" },
        wow: { emoji: "😮", label: "Wow" },
        sad: { emoji: "😢", label: "Sad" },
        angry: { emoji: "😠", label: "Angry" },
    };

    // Client-side Sort
    const sortedPosts = [...(community || [])].sort((a, b) => {
        if (filters.sort === "newest")
            return new Date(b.created_at) - new Date(a.created_at);
        if (filters.sort === "oldest")
            return new Date(a.created_at) - new Date(b.created_at);
        if (filters.sort === "popular") return (b.views || 0) - (a.views || 0);
        if (filters.sort === "most_commented")
            return (b.comments_count || 0) - (a.comments_count || 0);
        if (filters.sort === "most_liked")
            return (b.likes_count || 0) - (a.likes_count || 0);
        return 0;
    });

    const stats = {
        total_posts: community?.length || 0,
        total_comments:
            community?.reduce(
                (sum, post) => sum + (post.comments_count || 0),
                0,
            ) || 0,
        total_reactions:
            community?.reduce(
                (sum, post) => sum + (post.likes_count || 0),
                0,
            ) || 0,
    };

    const allTags = [
        "all",
        ...new Set(
            community?.flatMap((post) => post.tags || []).filter(Boolean),
        ),
    ].slice(0, 10);

    // --- Action Handlers ---
    const handlePostReaction = async (postId, reactionType, e) => {
        if (e) e.stopPropagation();
        if (!auth?.user) return router.visit("/login");

        setShowReactionPicker((prev) => ({ ...prev, [postId]: false }));
        router.post(
            route("community.reactions.toggle"),
            { community_id: postId, type: reactionType },
            { preserveScroll: true },
        );
    };

    const handleAddComment = async (postId, e) => {
        if (e) e.stopPropagation();
        if (!auth?.user) return router.visit("/login");
        const text = commentText[postId]?.trim();
        if (!text) return;

        router.post(
            route("community.comments.store"),
            { community_id: postId, comment: text },
            {
                onSuccess: () => {
                    setCommentText((prev) => ({ ...prev, [postId]: "" }));
                    router.reload();
                },
            },
        );
    };

    const handleAddReply = (commentId, postId, e) => {
        if (e) e.stopPropagation();
        if (!auth?.user) return router.visit("/login");
        const text = replyText[commentId]?.trim();
        if (!text) return;

        router.post(
            route("community.comments.store"),
            { community_id: postId, parent_id: commentId, comment: text },
            {
                onSuccess: () => {
                    setReplyText((prev) => ({ ...prev, [commentId]: "" }));
                    setShowReplyForm((prev) => ({
                        ...prev,
                        [commentId]: false,
                    }));
                    router.reload();
                },
            },
        );
    };

    const handleEditComment = (commentId) => {
        if (!editCommentText.trim()) return;
        router.put(
            route("community.comments.update", { comment: commentId }),
            { comment: editCommentText },
            {
                onSuccess: () => {
                    setEditingComment(null);
                    setEditCommentText("");
                    router.reload();
                },
            },
        );
    };

    const handleDeleteComment = (commentId) => {
        router.delete(
            route("community.comments.destroy", { comment: commentId }),
            {
                onSuccess: () => router.reload(),
            },
        );
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postFormData.title.trim() || !postFormData.content.trim())
            return alert("Please fill required fields");

        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(postFormData).forEach((key) => {
            if (postFormData[key] !== null)
                formData.append(key, postFormData[key]);
        });
        formData.set("is_featured", postFormData.is_featured ? "1" : "0");

        router.post(route("community.store"), formData, {
            onSuccess: () => {
                setShowCreatePostModal(false);
                setPostFormData({
                    title: "",
                    content: "",
                    category: "",
                    mood: "",
                    location: "",
                    tags: "",
                    image: null,
                    is_featured: false,
                    status: "published",
                });
                setImagePreview(null);
                router.reload();
            },
            onFinish: () => setIsSubmitting(false),
        });
        // console.log("Creating post with data:", postFormData);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostFormData((prev) => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const getUserReaction = (post) => {
        console.log(post);
        if (post.reactions && Array.isArray(post.reactions))
            return post.reactions.find(
                (reaction) => reaction.user_id === auth?.user?.id,
            );
        return post.user_reaction || null;
    };

    const canModifyComment = (comment) =>
        auth?.user &&
        (auth.user.id === comment.user_id || auth.user.role === "admin");

    return (
        <>
            <Head>
                <title>Community - Muslim Hall</title>
                <meta
                    name="description"
                    content="Join our community discussions."
                />
            </Head>

            <FrontAuthenticatedLayout>
                <div className="page-wrapper">
                    <Header />

                    {/* Main Content */}
                    <div className="content-section" id="community">
                        <div className="container-md">
                            {/* Mobile Filter Toggle */}
                            <div className="mobile-actions">
                                <button
                                    className="btn-mobile-filter"
                                    onClick={() => setShowMobileFilter(true)}
                                >
                                    <i className="fas fa-sliders-h"></i> Filters
                                </button>
                            </div>

                            {/* Mobile Sidebar Overlay */}
                            {showMobileFilter && (
                                <div
                                    className="sidebar-backdrop"
                                    onClick={() => setShowMobileFilter(false)}
                                ></div>
                            )}

                            <div className="content-grid">
                                {/* Filter Sidebar */}
                                <aside
                                    className={`sidebar ${showMobileFilter ? "open" : ""}`}
                                >
                                    <div className="sidebar-inner fixed">
                                        <div className="sidebar-header">
                                            <h3>Filters</h3>
                                            <div className="sidebar-header-actions">
                                                <button
                                                    onClick={clearFilters}
                                                    className="btn-text"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    className="btn-icon mobile-only"
                                                    onClick={() =>
                                                        setShowMobileFilter(
                                                            false,
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search */}
                                        <div className="filter-block">
                                            <div className="search-box">
                                                <i className="fas fa-search"></i>
                                                <input
                                                    type="text"
                                                    placeholder="Search discussions..."
                                                    value={filters.search}
                                                    onChange={(e) =>
                                                        handleFilterChange(
                                                            "search",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Sort */}
                                        <div className="filter-block">
                                            <h4 className="filter-title">
                                                Sort By
                                            </h4>
                                            <select
                                                className="form-select"
                                                value={filters.sort}
                                                onChange={(e) =>
                                                    handleFilterChange(
                                                        "sort",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="newest">
                                                    Newest First
                                                </option>
                                                <option value="oldest">
                                                    Oldest First
                                                </option>
                                                <option value="popular">
                                                    Most Views
                                                </option>
                                                <option value="most_commented">
                                                    Most Commented
                                                </option>
                                                <option value="most_liked">
                                                    Most Liked
                                                </option>
                                            </select>
                                        </div>

                                        {/* Tags */}
                                        <div className="filter-block">
                                            <h4 className="filter-title">
                                                Popular Tags
                                            </h4>
                                            <div className="tags-cloud">
                                                {allTags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        className={`nav-items ${filters.tag === tag ? "active" : ""}`}
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "tag",
                                                                tag,
                                                            )
                                                        }
                                                    >
                                                        <span>
                                                            {tag === "all"
                                                                ? "All Tags"
                                                                : tag}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="filter-block">
                                            <h4 className="filter-title">
                                                Community Stats
                                            </h4>
                                            <div className="stats-list">
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        Discussions:
                                                    </span>
                                                    <span className="stat-value">
                                                        {formatNumber(
                                                            stats.total_posts,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        Comments:
                                                    </span>
                                                    <span className="stat-value">
                                                        {formatNumber(
                                                            stats.total_comments,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-label">
                                                        Reactions:
                                                    </span>
                                                    <span className="stat-value">
                                                        {formatNumber(
                                                            stats.total_reactions,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Create Button (Desktop) */}
                                        {auth?.user && (
                                            <div className="filter-block">
                                                <button
                                                    className="sidebar-action-btn"
                                                    onClick={() =>
                                                        setShowCreatePostModal(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-plus-circle"></i>{" "}
                                                    Start New Topic
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </aside>

                                {/* Main Feed */}
                                <main className="feed">
                                    <div className="feed-header">
                                        <h2>Community Discussions</h2>
                                        <span className="result-count">
                                            {sortedPosts.length} discussions
                                            found
                                        </span>
                                    </div>

                                    {/* Create Post Input Trigger (Feed Top) */}
                                    {auth?.user && (
                                        <div
                                            className="create-post-card mb-4"
                                            onClick={() =>
                                                setShowCreatePostModal(true)
                                            }
                                        >
                                            <div className="create-input-wrapper">
                                                <img
                                                    src={
                                                        auth.user.avatar ||
                                                        "https://img.icons8.com/color/48/test-account.png"
                                                    }
                                                    className="user-avatar-small"
                                                    alt="User"
                                                />
                                                <div className="fake-input">
                                                    Start a discussion,{" "}
                                                    {
                                                        auth.user.name.split(
                                                            " ",
                                                        )[0]
                                                    }
                                                    ?
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Filters */}
                                    {(filters.search ||
                                        filters.category !== "all" ||
                                        filters.tag !== "all") && (
                                        <div className="active-filters">
                                            {filters.search && (
                                                <span className="filter-chip">
                                                    Search: "{filters.search}"
                                                    <button
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "search",
                                                                "",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </span>
                                            )}
                                            {filters.category !== "all" && (
                                                <span className="filter-chip">
                                                    {filters.category}
                                                    <button
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "category",
                                                                "all",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </span>
                                            )}
                                            {filters.tag !== "all" && (
                                                <span className="filter-chip">
                                                    Tag: {filters.tag}
                                                    <button
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "tag",
                                                                "all",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Posts Grid */}
                                    <div className="grid-container">
                                        {sortedPosts.length > 0 ? (
                                            sortedPosts.map((post) => (
                                                <div
                                                    key={post.id}
                                                    className="post-card"
                                                    onClick={(e) =>
                                                        handlePostClick(
                                                            post.id,
                                                            e,
                                                        )
                                                    }
                                                >
                                                    {/* Post Header */}
                                                    <div className="post-header">
                                                        <div className="post-author-info">
                                                            <img
                                                                src={
                                                                    post.user
                                                                        ?.avatar ||
                                                                    "https://img.icons8.com/color/48/test-account.png"
                                                                }
                                                                alt={
                                                                    post.user
                                                                        ?.name
                                                                }
                                                                className="author-avatar"
                                                            />
                                                            <div className="author-meta">
                                                                <div className="flex items-center flex-wrap gap-1.5">
                                                                    <span className="author-name">
                                                                        {post
                                                                            .user
                                                                            ?.name ||
                                                                            "Anonymous"}
                                                                    </span>
                                                                    {post.mood && (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                                                            {
                                                                                moods.find(
                                                                                    (
                                                                                        m,
                                                                                    ) =>
                                                                                        m.value ===
                                                                                        post.mood,
                                                                                )
                                                                                    ?.emoji
                                                                            }
                                                                            {
                                                                                moods.find(
                                                                                    (
                                                                                        m,
                                                                                    ) =>
                                                                                        m.value ===
                                                                                        post.mood,
                                                                                )
                                                                                    ?.label
                                                                            }
                                                                        </span>
                                                                    )}
                                                                    {post.location && (
                                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                                            <i className="fas fa-map-marker-alt text-[9px] text-blue-400" />
                                                                            {
                                                                                post.location
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="post-time">
                                                                    <i className="far fa-clock"></i>{" "}
                                                                    {formatDate(
                                                                        post.created_at,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="post-badges">
                                                            {post.is_featured && (
                                                                <span className="badge featured">
                                                                    <i className="fas fa-star"></i>{" "}
                                                                    Featured
                                                                </span>
                                                            )}
                                                            {post.category && (
                                                                <span className="category-tag">
                                                                    {
                                                                        post.category
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Post Content */}
                                                    <div className="post-content">
                                                        <h3 className="post-title">
                                                            <Link
                                                                href={`/community-details/${post.id}`}
                                                            >
                                                                {post.title}
                                                            </Link>
                                                        </h3>
                                                        <div className="post-excerpt">
                                                            {post.content
                                                                ?.replace(
                                                                    /<[^>]+>/g,
                                                                    "",
                                                                )
                                                                .substring(
                                                                    0,
                                                                    150,
                                                                )}
                                                            ...
                                                        </div>
                                                        {post.image && (
                                                            <div className="post-image-container">
                                                                <img
                                                                    src={getS3PublicUrl(post.image)}
                                                                    alt={
                                                                        post.title
                                                                    }
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        e.target.src =
                                                                            "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                        {post.tags &&
                                                            post.tags.length >
                                                                0 && (
                                                                <div className="post-tags-list">
                                                                    {post.tags.map(
                                                                        (
                                                                            tag,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    tag
                                                                                }
                                                                                className="post-tag"
                                                                            >
                                                                                {" "}
                                                                                #{" "}
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>

                                                    {/* Post Footer */}
                                                    <div className="post-footer">
                                                        <div className="reaction-wrapper">
                                                            <button
                                                                className={`footer-btn ${getUserReaction(post) ? "active" : ""}`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setShowReactionPicker(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [post.id]:
                                                                                !prev[
                                                                                    post
                                                                                        .id
                                                                                ],
                                                                        }),
                                                                    );
                                                                }}
                                                            >
                                                                {getUserReaction(
                                                                    post,
                                                                ) ? (
                                                                    <span className="emoji">
                                                                        {
                                                                            reactionTypes[
                                                                                getUserReaction(
                                                                                    post,
                                                                                )
                                                                                    .type
                                                                            ]
                                                                                ?.emoji
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <i className="far fa-thumbs-up"></i>
                                                                )}
                                                                <span>
                                                                    {formatNumber(
                                                                        post.reactions_count,
                                                                    )}
                                                                </span>
                                                            </button>

                                                            {/* Reaction Popover */}
                                                            {showReactionPicker[
                                                                post.id
                                                            ] && (
                                                                <div
                                                                    className="reaction-popover"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    {Object.entries(
                                                                        reactionTypes,
                                                                    ).map(
                                                                        ([
                                                                            type,
                                                                            data,
                                                                        ]) => (
                                                                            <button
                                                                                key={
                                                                                    type
                                                                                }
                                                                                onClick={(
                                                                                    e,
                                                                                ) =>
                                                                                    handlePostReaction(
                                                                                        post.id,
                                                                                        type,
                                                                                        e,
                                                                                    )
                                                                                }
                                                                                title={
                                                                                    data.label
                                                                                }
                                                                            >
                                                                                {
                                                                                    data.emoji
                                                                                }
                                                                            </button>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            className="footer-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedPost(
                                                                    expandedPost ===
                                                                        post.id
                                                                        ? null
                                                                        : post.id,
                                                                );
                                                            }}
                                                        >
                                                            <i className="far fa-comment-alt"></i>
                                                            <span>
                                                                {formatNumber(
                                                                    post.comments_count,
                                                                )}{" "}
                                                                Comments
                                                            </span>
                                                        </button>
                                                    </div>

                                                    {/* Expanded Comments */}
                                                    {expandedPost ===
                                                        post.id && (
                                                        <div
                                                            className="comments-section"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {auth?.user ? (
                                                                <div className="comment-input-area">
                                                                    <textarea
                                                                        value={
                                                                            commentText[
                                                                                post
                                                                                    .id
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setCommentText(
                                                                                {
                                                                                    ...commentText,
                                                                                    [post.id]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                            )
                                                                        }
                                                                        placeholder="Write a comment..."
                                                                        rows="2"
                                                                    />
                                                                    <button
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            handleAddComment(
                                                                                post.id,
                                                                                e,
                                                                            )
                                                                        }
                                                                        className="send-btn"
                                                                    >
                                                                        Post
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="login-prompt">
                                                                    <Link href="/login">
                                                                        Login to
                                                                        comment
                                                                    </Link>
                                                                </div>
                                                            )}

                                                            <div className="comments-list">
                                                                {post.comments
                                                                    ?.length >
                                                                0 ? (
                                                                    post.comments
                                                                        .filter(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                !c.parent_id,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                comment,
                                                                            ) => (
                                                                                <CommentThread
                                                                                    key={
                                                                                        comment.id
                                                                                    }
                                                                                    comment={
                                                                                        comment
                                                                                    }
                                                                                    auth={
                                                                                        auth
                                                                                    }
                                                                                    formatDate={
                                                                                        formatDate
                                                                                    }
                                                                                    onReply={
                                                                                        handleAddReply
                                                                                    }
                                                                                    onEdit={
                                                                                        handleEditComment
                                                                                    }
                                                                                    onDelete={
                                                                                        handleDeleteComment
                                                                                    }
                                                                                    editingComment={
                                                                                        editingComment
                                                                                    }
                                                                                    setEditingComment={
                                                                                        setEditingComment
                                                                                    }
                                                                                    editCommentText={
                                                                                        editCommentText
                                                                                    }
                                                                                    setEditCommentText={
                                                                                        setEditCommentText
                                                                                    }
                                                                                    showReplyForm={
                                                                                        showReplyForm
                                                                                    }
                                                                                    setShowReplyForm={
                                                                                        setShowReplyForm
                                                                                    }
                                                                                    replyText={
                                                                                        replyText
                                                                                    }
                                                                                    setReplyText={
                                                                                        setReplyText
                                                                                    }
                                                                                    canModifyComment={
                                                                                        canModifyComment
                                                                                    }
                                                                                    postId={
                                                                                        post.id
                                                                                    }
                                                                                />
                                                                            ),
                                                                        )
                                                                ) : (
                                                                    <p className="no-comments">
                                                                        No
                                                                        comments
                                                                        yet. Be
                                                                        the
                                                                        first!
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-results">
                                                <div className="icon">
                                                    <i className="fas fa-comments"></i>
                                                </div>
                                                <h3>No discussions found</h3>
                                                <p>
                                                    Try adjusting your filters
                                                    or searching for something
                                                    else.
                                                </p>
                                                {auth?.user ? (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() =>
                                                            setShowCreatePostModal(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Start New Discussion
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={clearFilters}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </main>
                            </div>
                        </div>
                    </div>

                    <Footer />

                    {/* Create Post Modal */}
                    {showCreatePostModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-32px)] overflow-hidden">
                                {/* ── HEADER ── */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm">
                                            <i className="fas fa-pen text-white text-xs" />
                                        </div>
                                        <span className="font-bold text-[15px] text-slate-900 tracking-tight">
                                            Create Post
                                        </span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setShowCreatePostModal(false)
                                        }
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm transition-colors"
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                </div>

                                {/* ── SCROLLABLE BODY ── */}
                                <div className="overflow-y-auto flex-1 px-5 py-4">
                                    {/* User identity */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <img
                                            src={
                                                auth.user.avatar ||
                                                "https://img.icons8.com/color/48/test-account.png"
                                            }
                                            className="w-11 h-11 rounded-full object-cover border-2 border-green-100"
                                            alt="User"
                                        />
                                        <div>
                                            <p className="font-semibold text-[13px] text-slate-900">
                                                {auth.user.name}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {postFormData.mood && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                                        {
                                                            moods.find(
                                                                (m) =>
                                                                    m.value ===
                                                                    postFormData.mood,
                                                            )?.emoji
                                                        }
                                                        {
                                                            moods.find(
                                                                (m) =>
                                                                    m.value ===
                                                                    postFormData.mood,
                                                            )?.label
                                                        }
                                                    </span>
                                                )}
                                                {postFormData.location && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                                        <i className="fas fa-map-marker-alt text-[9px]" />
                                                        {postFormData.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <form
                                        onSubmit={handleCreatePost}
                                        id="create-post-form"
                                    >
                                        {/* Title */}
                                        <input
                                            type="text"
                                            value={postFormData.title}
                                            onChange={(e) =>
                                                setPostFormData({
                                                    ...postFormData,
                                                    title: e.target.value,
                                                })
                                            }
                                            placeholder="What's on your mind?"
                                            required
                                            className="w-full border-[1.5px] border-slate-200 focus:border-green-400 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none mb-3 transition-colors"
                                        />

                                        {/* Content */}
                                        <textarea
                                            rows="4"
                                            value={postFormData.content}
                                            onChange={(e) =>
                                                setPostFormData({
                                                    ...postFormData,
                                                    content: e.target.value,
                                                })
                                            }
                                            placeholder="Share your thoughts, a hadith, a reminder..."
                                            required
                                            className="w-full border-[1.5px] border-slate-200 focus:border-green-400 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 placeholder:text-slate-400 outline-none resize-none leading-relaxed mb-3 transition-colors"
                                        />

                                        {/* Image Upload */}
                                        <div className="mb-4">
                                            {imagePreview ? (
                                                <div className="relative rounded-xl overflow-hidden">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full max-h-48 object-cover block"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImagePreview(
                                                                null,
                                                            );
                                                            setPostFormData({
                                                                ...postFormData,
                                                                image: null,
                                                            });
                                                        }}
                                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white text-xs transition-colors border-0"
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 border-[1.5px] border-dashed border-slate-300 hover:border-green-400 hover:bg-green-50 rounded-xl px-3.5 py-2.5 cursor-pointer text-sm text-slate-500 transition-all">
                                                    <i className="fas fa-image text-green-500 text-base" />
                                                    <span>Add a photo</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleImageUpload
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>

                                        {/* ── MOOD + LOCATION tray ── */}
                                        <div className="flex gap-2 flex-wrap p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                            {/* Mood */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowMoodPicker(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all
                  ${
                      postFormData.mood
                          ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 ring-[1.5px] ring-green-400 shadow-sm"
                          : "bg-white text-slate-500 ring-[1.5px] ring-slate-200 hover:ring-green-300 hover:text-green-600 hover:bg-green-50"
                  }`}
                                                >
                                                    <span className="text-base leading-none">
                                                        {postFormData.mood
                                                            ? moods.find(
                                                                  (m) =>
                                                                      m.value ===
                                                                      postFormData.mood,
                                                              )?.emoji
                                                            : "😊"}
                                                    </span>
                                                    {postFormData.mood
                                                        ? moods.find(
                                                              (m) =>
                                                                  m.value ===
                                                                  postFormData.mood,
                                                          )?.label
                                                        : "Feeling…"}
                                                </button>

                                                {showMoodPicker && (
                                                    <div className="absolute bottom-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 w-60">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                            How are you feeling?
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {moods.map(
                                                                (mood) => (
                                                                    <button
                                                                        key={
                                                                            mood.value
                                                                        }
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPostFormData(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    mood:
                                                                                        prev.mood ===
                                                                                        mood.value
                                                                                            ? ""
                                                                                            : mood.value,
                                                                                }),
                                                                            );
                                                                            setShowMoodPicker(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[11px] font-semibold border-0 cursor-pointer transition-all ${postFormData.mood === mood.value ? "bg-green-100 text-green-800" : "bg-transparent text-slate-500 hover:bg-slate-50"}`}
                                                                    >
                                                                        <span className="text-xl leading-none">
                                                                            {
                                                                                mood.emoji
                                                                            }
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                mood.label
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Location */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowLocationInput(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border-0 cursor-pointer transition-all
                  ${
                      postFormData.location
                          ? "bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 ring-[1.5px] ring-blue-400 shadow-sm"
                          : "bg-white text-slate-500 ring-[1.5px] ring-slate-200 hover:ring-blue-300 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                                                >
                                                    <i
                                                        className={`fas fa-map-marker-alt text-sm ${postFormData.location ? "text-blue-500" : "text-slate-400"}`}
                                                    />
                                                    {postFormData.location ||
                                                        "Add location"}
                                                </button>

                                                {showLocationInput && (
                                                    <div className="absolute bottom-[calc(100%+8px)] left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 w-56">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                                            Your location
                                                        </p>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Dhaka, Bangladesh"
                                                            value={
                                                                postFormData.location
                                                            }
                                                            onChange={(e) =>
                                                                setPostFormData(
                                                                    {
                                                                        ...postFormData,
                                                                        location:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                )
                                                            }
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    "Enter"
                                                                ) {
                                                                    e.preventDefault();
                                                                    setShowLocationInput(
                                                                        false,
                                                                    );
                                                                }
                                                            }}
                                                            className="w-full border-[1.5px] border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                                                        />
                                                        <div className="flex justify-between mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPostFormData(
                                                                        {
                                                                            ...postFormData,
                                                                            location:
                                                                                "",
                                                                        },
                                                                    );
                                                                    setShowLocationInput(
                                                                        false,
                                                                    );
                                                                }}
                                                                className="text-[11px] text-slate-400 hover:text-red-500 border-0 bg-transparent cursor-pointer transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setShowLocationInput(
                                                                        false,
                                                                    )
                                                                }
                                                                className="text-[11px] font-bold text-blue-600 border-0 bg-transparent cursor-pointer"
                                                            >
                                                                Done
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                </div>

                                {/* ── FOOTER — always pinned, never pushed off screen ── */}
                                <div className="flex-shrink-0 flex justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-white">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCreatePostModal(false)
                                        }
                                        className="px-5 py-2 rounded-full border-[1.5px] border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600 cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="create-post-form"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-bold shadow-md shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin" />{" "}
                                                Posting…
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane" />{" "}
                                                Post
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    /* --- Global Styles --- */
                    .page-wrapper {
                        background-color: #f4f6f8;
                        min-height: 100vh;
                        font-family:
                            -apple-system, BlinkMacSystemFont, "Segoe UI",
                            Roboto, "Helvetica Neue", Arial, sans-serif;
                    }

                    /* --- Layout CSS --- */
                    .content-section {
                        padding: 40px 0;
                    }
                    .container-md {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 20px;
                    }
                    .content-grid {
                        display: grid;
                        grid-template-columns: 280px 1fr;
                        gap: 30px;
                        align-items: start;
                    }

                    /* --- Sidebar Design --- */
                    .sidebar {
                        position: sticky;
                        top: 90px;
                    }
                    .sidebar-inner {
                        background: #fff;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                        padding: 24px;
                    }
                    .sidebar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .sidebar-header h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 700;
                        color: #111;
                    }

                    .btn-text {
                        background: none;
                        border: none;
                        color: #666;
                        font-size: 13px;
                        cursor: pointer;
                        text-decoration: underline;
                    }

                    .btn-icon {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 5px;
                    }

                    .filter-block {
                        margin-bottom: 24px;
                    }
                    .filter-block:last-child {
                        margin-bottom: 0;
                    }

                    .search-box {
                        position: relative;
                    }
                    .search-box i {
                        position: absolute;
                        left: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #9ca3af;
                    }
                    .search-box input {
                        width: 100%;
                        padding: 10px 10px 10px 36px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 14px;
                        background: #f9fafb;
                    }
                    .search-box input:focus {
                        background: #fff;
                        outline: none;
                        border-color: #1b7a3a;
                    }

                    .filter-title {
                        font-size: 12px;
                        text-transform: uppercase;
                        color: #6b7280;
                        font-weight: 600;
                        margin-bottom: 12px;
                        letter-spacing: 0.5px;
                    }

                    .tags-cloud {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .nav-items {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: transparent;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        color: #4b5563;
                        font-size: 14px;
                        text-align: left;
                        width: 100%;
                        transition: all 0.2s;
                    }
                    .nav-items:hover {
                        background: #f3f4f6;
                        color: #111;
                    }
                    .nav-items.active {
                        background: #f0fdf4;
                        color: #166534;
                        font-weight: 600;
                    }

                    .stats-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .stat-item {
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                        color: #4b5563;
                    }
                    .stat-label {
                        color: #6b7280;
                    }
                    .stat-value {
                        font-weight: 600;
                        color: #166534;
                    }

                    .sidebar-action-btn {
                        width: 100%;
                        padding: 10px;
                        background: #166534;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: background 0.2s;
                        font-size: 14px;
                    }
                    .sidebar-action-btn:hover {
                        background: #14532d;
                    }

                    .form-select {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        color: #374151;
                        font-size: 14px;
                        background: #fff;
                        cursor: pointer;
                    }

                    /* --- Feed & Cards --- */
                    .feed-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        margin-bottom: 20px;
                    }
                    .feed-header h2 {
                        margin: 0;
                        font-size: 24px;
                        color: #111;
                    }
                    .result-count {
                        color: #6b7280;
                        font-size: 14px;
                    }

                    .create-post-card {
                        background: #fff;
                        border-radius: 12px;
                        padding: 16px;
                        border: 1px solid #e5e7eb;
                        cursor: pointer;
                        transition: all 0.2s;
                        margin-bottom: 24px;
                    }
                    .create-post-card:hover {
                        border-color: #1b7a3a;
                        box-shadow: 0 4px 12px rgba(27, 122, 58, 0.1);
                    }
                    .create-input-wrapper {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .user-avatar-small {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    .fake-input {
                        flex: 1;
                        padding: 10px 16px;
                        background: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 25px;
                        color: #6b7280;
                        font-size: 14px;
                    }

                    .active-filters {
                        margin-bottom: 20px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                    }
                    .filter-chip {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #e0f2f1;
                        color: #00695c;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .filter-chip button {
                        background: none;
                        border: none;
                        color: inherit;
                        cursor: pointer;
                        padding: 0;
                        display: flex;
                        align-items: center;
                    }

                    .grid-container {
                        display: flex;
                        flex-direction: column;
                        gap: 24px;
                    }

                    .post-card {
                        background: #fff;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                        padding: 24px;
                        transition:
                            transform 0.2s,
                            box-shadow 0.2s;
                        cursor: pointer;
                    }
                    .post-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    }

                    .post-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 16px;
                    }
                    .post-author-info {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                    }
                    .author-avatar {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    .author-meta {
                        display: flex;
                        flex-direction: column;
                    }
                    .author-name {
                        font-weight: 600;
                        color: #111827;
                        font-size: 14px;
                    }
                    .post-time {
                        font-size: 12px;
                        color: #6b7280;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .post-badges {
                        display: flex;
                        gap: 8px;
                    }
                    .badge.featured {
                        background: #fef3c7;
                        color: #92400e;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .category-tag {
                        background: #166534;
                        color: white;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }

                    .post-content {
                        margin-bottom: 20px;
                    }
                    .post-title {
                        font-size: 18px;
                        font-weight: 700;
                        color: #111827;
                        margin: 0 0 12px 0;
                        line-height: 1.4;
                    }
                    .post-title a {
                        color: inherit;
                        text-decoration: none;
                    }
                    .post-title a:hover {
                        color: #166534;
                    }
                    .post-excerpt {
                        color: #4b5563;
                        line-height: 1.6;
                        font-size: 14px;
                        margin-bottom: 16px;
                    }
                    .post-image-container {
                        margin-top: 16px;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .post-image-container img {
                        width: 100%;
                        max-height: 300px;
                        object-fit: contain;
                    }
                    .post-tags-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-top: 12px;
                    }
                    .post-tag {
                        color: #1b7a3a;
                        font-size: 12px;
                        font-weight: 500;
                        background: #f0fdf4;
                        padding: 2px 8px;
                        border-radius: 4px;
                    }

                    .post-footer {
                        padding-top: 16px;
                        border-top: 1px solid #f3f4f6;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .reaction-wrapper {
                        position: relative;
                    }
                    .footer-btn {
                        background: none;
                        border: none;
                        color: #6b7280;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        border-radius: 6px;
                        transition: all 0.2s;
                        font-size: 14px;
                    }
                    .footer-btn:hover {
                        background: #f3f4f6;
                        color: #374151;
                    }
                    .footer-btn.active {
                        color: #166534;
                        background: #f0fdf4;
                    }
                    .reaction-popover {
                        position: absolute;
                        bottom: 100%;
                        left: 0;
                        background: white;
                        border-radius: 25px;
                        padding: 6px 10px;
                        display: flex;
                        gap: 4px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        border: 1px solid #e5e7eb;
                        z-index: 10;
                        margin-bottom: 8px;
                    }
                    .reaction-popover button {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        transition: 0.2s;
                        padding: 2px;
                    }
                    .reaction-popover button:hover {
                        transform: scale(1.2);
                    }

                    /* --- Comments --- */
                    .comments-section {
                        margin-top: 20px;
                        background: #f9fafb;
                        padding: 16px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }
                    .comment-input-area {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 16px;
                    }
                    .comment-input-area textarea {
                        flex: 1;
                        padding: 10px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 14px;
                        resize: vertical;
                        font-family: inherit;
                    }
                    .send-btn {
                        background: #166534;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        height: fit-content;
                    }
                    .login-prompt {
                        text-align: center;
                        padding: 12px;
                        background: white;
                        border-radius: 8px;
                        margin-bottom: 16px;
                        border: 1px solid #e5e7eb;
                    }
                    .login-prompt a {
                        color: #166534;
                        font-weight: 600;
                        text-decoration: none;
                    }
                    .no-comments {
                        text-align: center;
                        color: #9ca3af;
                        font-size: 14px;
                        padding: 12px;
                    }

                    .comment-thread {
                        margin-bottom: 16px;
                    }
                    .comment {
                        display: flex;
                        gap: 12px;
                    }
                    .comment-user-avatar {
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        object-fit: cover;
                        margin-top: 4px;
                    }
                    .comment-bubble {
                        background: white;
                        padding: 12px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        flex: 1;
                    }
                    .comment-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 6px;
                    }
                    .comment-user-name {
                        font-weight: 600;
                        font-size: 13px;
                        color: #374151;
                    }
                    .comment-date {
                        font-size: 11px;
                        color: #9ca3af;
                    }
                    .comment-content {
                        font-size: 14px;
                        color: #4b5563;
                        line-height: 1.4;
                        word-break: break-word;
                        margin-bottom: 8px;
                    }
                    .comment-actions-bar {
                        display: flex;
                        gap: 12px;
                        font-size: 12px;
                        color: #6b7280;
                    }
                    .comment-action-link {
                        background: none;
                        border: none;
                        padding: 0;
                        color: #6b7280;
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 12px;
                    }
                    .comment-action-link:hover {
                        color: #166534;
                        text-decoration: underline;
                    }

                    .replies-list {
                        margin-left: 44px;
                        margin-top: 12px;
                        padding-left: 16px;
                        border-left: 2px solid #e5e7eb;
                    }
                    .edit-area {
                        margin-top: 8px;
                    }
                    .edit-textarea {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        margin-bottom: 8px;
                        font-family: inherit;
                    }
                    .edit-actions {
                        display: flex;
                        gap: 8px;
                    }
                    .btn-xs {
                        padding: 6px 12px;
                        font-size: 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        border: none;
                        font-weight: 500;
                    }
                    .btn-save {
                        background: #166534;
                        color: white;
                    }
                    .btn-cancel {
                        background: #e5e7eb;
                        color: #374151;
                    }

                    /* --- No Results --- */
                    .no-results {
                        text-align: center;
                        padding: 60px 20px;
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                    }
                    .no-results .icon {
                        font-size: 48px;
                        color: #d1d5db;
                        margin-bottom: 20px;
                    }
                    .no-results h3 {
                        font-size: 24px;
                        margin-bottom: 10px;
                        color: #111827;
                    }
                    .no-results p {
                        color: #6b7280;
                        margin-bottom: 30px;
                    }

                    /* --- Buttons --- */
                    .btn {
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 14px;
                        cursor: pointer;
                        border: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    .btn-primary {
                        background: #166534;
                        color: white;
                        border: none;
                    }
                    .btn-primary:hover {
                        background: #14532d;
                    }
                    .btn-secondary {
                        background: white;
                        border-color: #d1d5db;
                        color: #374151;
                    }
                    .btn-secondary:hover {
                        background: #f9fafb;
                        border-color: #9ca3af;
                    }

                    /* --- Modal --- */
                    .modal-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        z-index: 99999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }

                    .modal-container {
                        background: #ffffff;
                        width: 100%;
                        max-width: 600px;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        animation: fadeIn 0.2s ease-out;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    .modal-header {
                        background: #ffffff;
                        padding: 16px 24px;
                        border-bottom: 1px solid #eaeaea;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .modal-header h3 {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin: 0;
                    }

                    .modal-close-btn {
                        background: transparent;
                        border: none;
                        color: #666;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 5px;
                        border-radius: 50%;
                        transition: background 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                    }
                    .modal-close-btn:hover {
                        background: #f5f5f5;
                        color: #333;
                    }

                    .modal-body {
                        padding: 24px;
                        background: #fff;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }
                    .form-label {
                        display: block;
                        font-weight: 500;
                        margin-bottom: 8px;
                        color: #333;
                        font-size: 14px;
                    }

                    .form-input,
                    .form-textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ced4da;
                        border-radius: 8px;
                        font-family: inherit;
                        font-size: 14px;
                        color: #333;
                        transition: border-color 0.2s;
                    }
                    .form-textarea {
                        resize: vertical;
                    }
                    .form-input:focus,
                    .form-textarea:focus {
                        outline: none;
                        border-color: #80bdff;
                        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                    }

                    .image-preview {
                        position: relative;
                        display: inline-block;
                        margin-top: 10px;
                    }
                    .image-preview img {
                        width: 100%;
                        max-height: 200px;
                        object-fit: cover;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }
                    .remove-image-btn {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                    }

                    .modal-footer {
                        padding: 16px 24px;
                        background: #f8f9fa;
                        border-top: 1px solid #eaeaea;
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }

                    /* --- Mobile Responsive --- */
                    .mobile-actions {
                        display: none;
                        margin-bottom: 20px;
                    }
                    .sidebar-backdrop {
                        display: none;
                    }

                    @media (max-width: 992px) {
                        .content-grid {
                            grid-template-columns: 1fr;
                        }

                        .mobile-actions {
                            display: block;
                        }
                        .btn-mobile-filter {
                            width: 100%;
                            padding: 12px;
                            background: #fff;
                            border: 1px solid #d1d5db;
                            border-radius: 8px;
                            font-weight: 600;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            gap: 8px;
                        }

                        .sidebar {
                            position: fixed;
                            top: 0;
                            left: -100%;
                            width: 300px;
                            height: 100vh;
                            z-index: 1050;
                            transition: left 0.3s;
                            border-right: 1px solid #e5e7eb;
                        }
                        .sidebar.open {
                            left: 0;
                        }
                        .sidebar-inner {
                            height: 100%;
                            border-radius: 0;
                            border: none;
                            overflow-y: auto;
                        }

                        .sidebar-backdrop {
                            display: block;
                            position: fixed;
                            inset: 0;
                            background: rgba(0, 0, 0, 0.5);
                            z-index: 1040;
                        }
                        .mobile-only {
                            display: block !important;
                        }
                    }
                    .mobile-only {
                        display: none;
                    }

                    @media (max-width: 768px) {
                        .post-header {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 12px;
                        }
                        .post-badges {
                            align-self: flex-start;
                        }
                        .content-section {
                            padding: 20px 0;
                        }
                        .container-md {
                            padding: 0 16px;
                        }
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}

// Separate Component for individual comments
const CommentThread = ({
    comment,
    auth,
    formatDate,
    onReply,
    onEdit,
    onDelete,
    editingComment,
    setEditingComment,
    editCommentText,
    setEditCommentText,
    showReplyForm,
    setShowReplyForm,
    replyText,
    setReplyText,
    canModifyComment,
    postId,
}) => {
    return (
        <div className="comment-thread">
            <div className="comment">
                <img
                    src={
                        comment.user?.avatar ||
                        "https://img.icons8.com/color/48/test-account.png"
                    }
                    className="comment-user-avatar"
                    alt="User"
                />
                <div className="comment-bubble">
                    <div className="comment-header">
                        <span className="comment-user-name">
                            {comment.user?.name}
                        </span>
                        <span className="comment-date">
                            {formatDate(comment.created_at)}
                        </span>
                    </div>

                    {editingComment === comment.id ? (
                        <div className="edit-area">
                            <textarea
                                className="edit-textarea"
                                rows="2"
                                value={editCommentText}
                                onChange={(e) =>
                                    setEditCommentText(e.target.value)
                                }
                            />
                            <div className="edit-actions">
                                <button
                                    className="btn-xs btn-save"
                                    onClick={() => onEdit(comment.id)}
                                >
                                    Save
                                </button>
                                <button
                                    className="btn-xs btn-cancel"
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditCommentText("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="comment-content">
                            {comment.content || comment.comment}
                        </div>
                    )}

                    <div className="comment-actions-bar">
                        {auth?.user && (
                            <button
                                className="comment-action-link"
                                onClick={() =>
                                    setShowReplyForm((prev) => ({
                                        ...prev,
                                        [comment.id]: !prev[comment.id],
                                    }))
                                }
                            >
                                Reply
                            </button>
                        )}
                        {canModifyComment(comment) && (
                            <>
                                <button
                                    className="comment-action-link"
                                    onClick={() => {
                                        setEditingComment(comment.id);
                                        setEditCommentText(
                                            comment.content || comment.comment,
                                        );
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="comment-action-link"
                                    onClick={() => {
                                        if (confirm("Delete this comment?"))
                                            onDelete(comment.id);
                                    }}
                                    style={{ color: "#dc3545" }}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {showReplyForm[comment.id] && (
                <div className="replies-list" style={{ marginBottom: "10px" }}>
                    <div
                        className="comment-input-area"
                        style={{ marginBottom: 0 }}
                    >
                        <textarea
                            value={replyText[comment.id] || ""}
                            onChange={(e) =>
                                setReplyText((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                }))
                            }
                            placeholder="Write a reply..."
                            rows="1"
                        />
                        <button
                            onClick={(e) => onReply(comment.id, postId, e)}
                            className="send-btn"
                            style={{ padding: "8px 15px", fontSize: "12px" }}
                        >
                            Reply
                        </button>
                    </div>
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies?.length > 0 && (
                <div className="replies-list">
                    {comment.replies.map((reply) => (
                        <div
                            key={reply.id}
                            className="comment"
                            style={{ marginBottom: "10px" }}
                        >
                            <img
                                src={
                                    reply.user?.avatar ||
                                    "https://img.icons8.com/color/48/test-account.png"
                                }
                                className="comment-user-avatar"
                                style={{ width: "24px", height: "24px" }}
                                alt="User"
                            />
                            <div
                                className="comment-bubble"
                                style={{ background: "#fff" }}
                            >
                                <div className="comment-header">
                                    <span className="comment-user-name">
                                        {reply.user?.name}
                                    </span>
                                    <span className="comment-date">
                                        {formatDate(reply.created_at)}
                                    </span>
                                </div>
                                {editingComment === reply.id ? (
                                    <div className="edit-area">
                                        <textarea
                                            className="edit-textarea"
                                            rows="2"
                                            value={editCommentText}
                                            onChange={(e) =>
                                                setEditCommentText(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <div className="edit-actions">
                                            <button
                                                className="btn-xs btn-save"
                                                onClick={() => onEdit(reply.id)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="btn-xs btn-cancel"
                                                onClick={() => {
                                                    setEditingComment(null);
                                                    setEditCommentText("");
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="comment-content">
                                        {reply.content || reply.comment}
                                    </div>
                                )}
                                {canModifyComment(reply) && (
                                    <div className="comment-actions-bar">
                                        <button
                                            className="comment-action-link"
                                            onClick={() => {
                                                setEditingComment(reply.id);
                                                setEditCommentText(
                                                    reply.content ||
                                                        reply.comment,
                                                );
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="comment-action-link"
                                            onClick={() => {
                                                if (confirm("Delete?"))
                                                    onDelete(reply.id);
                                            }}
                                            style={{ color: "#dc3545" }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

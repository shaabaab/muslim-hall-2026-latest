import { Link, usePage, router } from "@inertiajs/react";
import { useState, useMemo } from 'react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import Header from "./Header";
import Footer from "./Footer";
import { Head } from '@inertiajs/react';

export default function Community() {
    const { community, auth, categories, popular_tags, trending_posts, featured_posts } = usePage().props;

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('latest');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeTag, setActiveTag] = useState('all');
    const [expandedPost, setExpandedPost] = useState(null);
    const [commentText, setCommentText] = useState({});
    const [replyText, setReplyText] = useState({});
    const [showReplyForm, setShowReplyForm] = useState({});
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [selectedReaction, setSelectedReaction] = useState({});
    const [showReactionPicker, setShowReactionPicker] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [minComments, setMinComments] = useState('');
    const [minLikes, setMinLikes] = useState('');
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [postFormData, setPostFormData] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
        image: null,
        is_featured: false,
        status: 'published'
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reaction types with emojis
    const reactionTypes = {
        like: { emoji: '👍', label: 'Like', color: 'text-blue-400' },
        love: { emoji: '❤️', label: 'Love', color: 'text-red-400' },
        laugh: { emoji: '😂', label: 'Haha', color: 'text-yellow-400' },
        wow: { emoji: '😮', label: 'Wow', color: 'text-orange-400' },
        sad: { emoji: '😢', label: 'Sad', color: 'text-purple-400' },
        angry: { emoji: '😠', label: 'Angry', color: 'text-red-500' }
    };

    // Format number for display
    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate stats
    const stats = useMemo(() => {
        const totalPosts = community?.length || 0;
        const totalComments = community?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
        const totalViews = community?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
        const totalReactions = community?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;

        return {
            total_posts: totalPosts,
            total_comments: totalComments,
            total_views: totalViews,
            total_reactions: totalReactions
        };
    }, [community]);

    // Get unique tags from posts
    const allTags = useMemo(() => {
        if (!community) return [];
        const tags = community.flatMap(post => post.tags || []);
        const tagCounts = tags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});

        return ['all', ...Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([tag]) => tag)
            .slice(0, 15)
        ];
    }, [community]);

    // Advanced filtering
    const filteredPosts = useMemo(() => {
        if (!community) return [];

        let filtered = [...community];

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(post =>
                post.title?.toLowerCase().includes(searchLower) ||
                post.content?.toLowerCase().includes(searchLower) ||
                post.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
                post.user?.name?.toLowerCase().includes(searchLower)
            );
        }

        // Category filter
        if (activeCategory !== 'all') {
            filtered = filtered.filter(post => post.category === activeCategory);
        }

        // Tag filter
        if (activeTag !== 'all') {
            filtered = filtered.filter(post => post.tags?.includes(activeTag));
        }

        // Date range filter
        if (dateRange.start) {
            filtered = filtered.filter(post => new Date(post.created_at) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            filtered = filtered.filter(post => new Date(post.created_at) <= new Date(dateRange.end));
        }

        // Minimum comments filter
        if (minComments) {
            filtered = filtered.filter(post => (post.comments_count || 0) >= parseInt(minComments));
        }

        // Minimum likes filter
        if (minLikes) {
            filtered = filtered.filter(post => (post.likes_count || 0) >= parseInt(minLikes));
        }

        // Sort posts
        switch (sort) {
            case 'popular':
                filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'most_commented':
                filtered.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
                break;
            case 'most_liked':
                filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
                break;
            case 'trending':
                filtered.sort((a, b) => {
                    const scoreA = calculateTrendingScore(a);
                    const scoreB = calculateTrendingScore(b);
                    return scoreB - scoreA;
                });
                break;
            case 'featured':
                filtered = filtered.filter(post => post.is_featured);
                break;
            case 'latest':
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        return filtered;
    }, [community, search, sort, activeCategory, activeTag, dateRange, minComments, minLikes]);

    // Calculate trending score
    const calculateTrendingScore = (post) => {
        const postDate = new Date(post.created_at);
        const now = new Date();
        const hoursSincePost = (now - postDate) / (1000 * 60 * 60);

        const timeWeight = Math.max(0, 1 - (hoursSincePost / 168));
        const engagementScore =
            (post.views || 0) * 0.1 +
            (post.comments_count || 0) * 2 +
            (post.likes_count || 0) * 3;

        return engagementScore * timeWeight;
    };

    // Get top contributors
    const topContributors = useMemo(() => {
        if (!community) return [];
        const userStats = {};

        community.forEach(post => {
            const userId = post.user_id;
            if (!userStats[userId]) {
                userStats[userId] = {
                    user: post.user,
                    postCount: 0,
                    commentCount: 0,
                    reactionCount: 0
                };
            }
            userStats[userId].postCount++;
            userStats[userId].reactionCount += post.likes_count || 0;
        });

        return Object.values(userStats)
            .sort((a, b) => (b.postCount + b.commentCount) - (a.postCount + a.commentCount))
            .slice(0, 5);
    }, [community]);

    // Handle post reaction
    const handlePostReaction = async (postId, reactionType) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        try {
            await router.post(route('community.reactions.toggle'), {
                community_id: postId,
                type: reactionType
            });
            setSelectedReaction(prev => ({ ...prev, [postId]: reactionType }));
            router.reload();
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    };

    // Handle comment reaction
    const handleCommentReaction = async (commentId, reactionType) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        try {
            await router.post(route('community.comments.reactions.toggle'), {
                comment_id: commentId,
                type: reactionType
            });
            router.reload();
        } catch (error) {
            console.error('Error toggling comment reaction:', error);
        }
    };

    // Handle add comment
    const handleAddComment = async (postId) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        const text = commentText[postId]?.trim();
        if (!text) return;

        try {
            await router.post(route('community.comments.store'), {
                community_id: postId,
                comment: text
            }, {
                onSuccess: () => {
                    setCommentText(prev => ({ ...prev, [postId]: '' }));
                },
                onError: (errors) => {
                    console.error('Comment errors:', errors);
                    alert('Failed to add comment: ' + (errors.comment || 'Unknown error'));
                }
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Error adding comment: ' + error.message);
        }
    };

    // Handle add reply
    const handleAddReply = async (commentId, postId) => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        const text = replyText[commentId]?.trim();
        if (!text) return;

        try {
            await router.post(route('community.comments.store'), {
                community_id: postId,
                parent_id: commentId,
                comment: text
            }, {
                onSuccess: () => {
                    setReplyText(prev => ({ ...prev, [commentId]: '' }));
                    setShowReplyForm(prev => ({ ...prev, [commentId]: false }));
                },
                onError: (errors) => {
                    console.error('Reply errors:', errors);
                    alert('Failed to add reply: ' + (errors.comment || 'Unknown error'));
                }
            });
        } catch (error) {
            console.error('Error adding reply:', error);
            alert('Error adding reply: ' + error.message);
        }
    };

    // Handle edit comment
    const handleEditComment = async (commentId) => {
        if (!editCommentText.trim()) return;

        try {
            await router.put(route('community.comments.update', { comment: commentId }), {
                content: editCommentText
            }, {
                onSuccess: () => {
                    setEditingComment(null);
                    setEditCommentText('');
                },
                onError: (errors) => {
                    console.error('Edit errors:', errors);
                    alert('Failed to edit comment: ' + (errors.content || 'Unknown error'));
                }
            });
        } catch (error) {
            console.error('Error editing comment:', error);
            alert('Error editing comment: ' + error.message);
        }
    };

    // Handle delete comment
    const handleDeleteComment = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await router.delete(route('community.comments.destroy', { comment: commentId }));
            router.reload();
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    // Handle create post form changes
    const handlePostFormChange = (field, value) => {
        setPostFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle image upload for post
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            handlePostFormChange('image', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove image from post
    const handleRemoveImage = () => {
        handlePostFormChange('image', null);
        setImagePreview(null);
    };

    // Submit new post
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!postFormData.title.trim() || !postFormData.content.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', postFormData.title);
        formData.append('content', postFormData.content);
        formData.append('category', postFormData.category);
        formData.append('tags', postFormData.tags);
        formData.append('status', postFormData.status);
        formData.append('is_featured', postFormData.is_featured ? '1' : '0');
        if (postFormData.image) {
            formData.append('image', postFormData.image);
        }

        try {
            await router.post(route('community.store'), formData, {
                onSuccess: () => {
                    setShowCreatePostModal(false);
                    resetPostForm();
                    router.reload();
                },
                onError: (errors) => {
                    console.error('Post creation errors:', errors);
                    alert('Failed to create post: ' + (Object.values(errors).join(', ') || 'Unknown error'));
                }
            });
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset post form
    const resetPostForm = () => {
        setPostFormData({
            title: '',
            content: '',
            category: '',
            tags: '',
            image: null,
            is_featured: false,
            status: 'published'
        });
        setImagePreview(null);
    };

    // Get user's reaction to post
    const getUserReaction = (post) => {
        return post.reactions?.find(reaction => reaction.user_id === auth?.user?.id);
    };

    // Get user's reaction to comment
    const hasUserReactedToComment = (comment, reactionType) => {
        return comment.reactions?.some(reaction =>
            reaction.user_id === auth?.user?.id && reaction.type === reactionType
        );
    };

    const canCreatePost = auth?.user;

    return (
        <>
            <Head>
                <title>Community - Muslim Hall</title>
                <meta name="description" content="Join our community discussions, share your thoughts, and connect with others." />
                <meta name="keywords" content="community, discussion, forum, muslim, islamic" />
            </Head>

            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <div className="live_auction_style__one bg-body pt-40 pb-5">
                        <Header />
                        <div className="container-md">
                            <div className="row">
                                {/* Advanced Sidebar */}
                                <div className="col-lg-3 mb-4">
                                    <div className="sticky-top" style={{ top: '100px' }}>
                                        {/* User Quick Actions */}
                                        {auth?.user && (
                                            <div className="bg-body-3 rounded-lg p-4 mb-4">
                                                <div className="d-flex align-items-center mb-3">
                                                    <img
                                                        src={auth.user.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                                                        alt={auth.user.name}
                                                        className="rounded-circle me-3"
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <h6 className="text-white mb-0">{auth.user.name}</h6>
                                                        <small className="text-gray-400">Member</small>
                                                    </div>
                                                </div>
                                                <div className="d-grid gap-2">
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => setShowCreatePostModal(true)}
                                                    >
                                                        <i className="bi bi-plus-circle me-2"></i>
                                                        Create Post
                                                    </button>
                                                    <Link href="/community/my-posts" className="btn btn-outline-primary btn-sm">
                                                        <i className="bi bi-person me-2"></i>
                                                        My Posts
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        {/* Top Contributors */}
                                        <div className="bg-body-3 rounded-lg p-4 mb-4">
                                            <h5 className="text-white mb-3">Top Contributors</h5>
                                            <div className="space-y-3">
                                                {topContributors.map((contributor, index) => (
                                                    <div key={contributor.user.id} className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <div className="position-relative">
                                                                <img
                                                                    src={contributor.user.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                                                                    alt={contributor.user.name}
                                                                    className="rounded-circle me-2"
                                                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                                />
                                                                {index < 3 && (
                                                                    <span className="position-absolute top-0 start-100 translate-middle badge bg-warning">
                                                                        {index + 1}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-white small fw-medium">{contributor.user.name}</div>
                                                                <div className="text-gray-400 small">{contributor.postCount} posts</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Community Stats */}
                                        <div className="bg-body-3 rounded-lg p-4">
                                            <h5 className="text-white mb-3">Community Stats</h5>
                                            <div className="space-y-2">
                                                {Object.entries(stats).map(([key, value]) => (
                                                    <div key={key} className="d-flex justify-content-between text-gray-300">
                                                        <span>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                                        <span className="text-white">{formatNumber(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="col-lg-9">
                                    {/* Enhanced Search and Filters Section */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="bg-body-3 rounded-lg p-4">
                                                <div className="row g-3">
                                                    {/* Search Input */}
                                                    <div className="col-md-4">
                                                        <div className="position-relative">
                                                            <i className="bi bi-search position-absolute top-50 start-3 translate-middle-y text-gray-400"></i>
                                                            <input
                                                                type="text"
                                                                className="form-control bg-body-2 border-body-4 text-white ps-5"
                                                                placeholder="Search posts, content, users..."
                                                                value={search}
                                                                onChange={(e) => setSearch(e.target.value)}
                                                            />
                                                            {search && (
                                                                <button
                                                                    className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-gray-400"
                                                                    onClick={() => setSearch('')}
                                                                >
                                                                    <i className="bi bi-x"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sort Options */}
                                                    <div className="col-md-3">
                                                        <select
                                                            className="form-select bg-body-2 border-body-4 text-white"
                                                            value={sort}
                                                            onChange={(e) => setSort(e.target.value)}
                                                        >
                                                            <option value="latest">Latest Posts</option>
                                                            <option value="popular">Most Popular</option>
                                                            <option value="most_commented">Most Commented</option>
                                                            <option value="most_liked">Most Liked</option>
                                                            <option value="trending">Trending</option>
                                                            <option value="featured">Featured Only</option>
                                                        </select>
                                                    </div>

                                                    {/* Category Filter */}
                                                    <div className="col-md-3">
                                                        <select
                                                            className="form-select bg-body-2 border-body-4 text-white"
                                                            value={activeCategory}
                                                            onChange={(e) => setActiveCategory(e.target.value)}
                                                        >
                                                            <option value="all">All Categories</option>
                                                            {categories?.map(category => (
                                                                <option key={category.id} value={category.slug || category.name}>
                                                                    {category.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* View Mode & Filters Toggle */}
                                                    <div className="col-md-2">
                                                        <div className="d-flex gap-2">
                                                            {/* View Mode Toggle */}
                                                            <div className="btn-group" role="group">
                                                                <button
                                                                    type="button"
                                                                    className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setViewMode('grid')}
                                                                    title="Grid View"
                                                                >
                                                                    <i className="bi bi-grid-3x3-gap"></i>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                    onClick={() => setViewMode('list')}
                                                                    title="List View"
                                                                >
                                                                    <i className="bi bi-list-ul"></i>
                                                                </button>
                                                            </div>

                                                            {/* Advanced Filters Toggle */}
                                                            <button
                                                                className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                                                title="Advanced Filters"
                                                            >
                                                                <i className="bi bi-funnel"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Advanced Filters */}
                                                {showAdvancedFilters && (
                                                    <div className="row g-3 mt-3 pt-3 border-top border-body-4">
                                                        {/* Date Range Filters */}
                                                        <div className="col-md-3">
                                                            <label className="form-label text-white small mb-1">From Date</label>
                                                            <input
                                                                type="date"
                                                                className="form-control form-control-sm bg-body-2 border-body-4 text-white"
                                                                value={dateRange.start}
                                                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <label className="form-label text-white small mb-1">To Date</label>
                                                            <input
                                                                type="date"
                                                                className="form-control form-control-sm bg-body-2 border-body-4 text-white"
                                                                value={dateRange.end}
                                                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                                            />
                                                        </div>

                                                        {/* Engagement Filters */}
                                                        <div className="col-md-2">
                                                            <label className="form-label text-white small mb-1">Min Comments</label>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm bg-body-2 border-body-4 text-white"
                                                                placeholder="0"
                                                                value={minComments}
                                                                onChange={(e) => setMinComments(e.target.value)}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <label className="form-label text-white small mb-1">Min Likes</label>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm bg-body-2 border-body-4 text-white"
                                                                placeholder="0"
                                                                value={minLikes}
                                                                onChange={(e) => setMinLikes(e.target.value)}
                                                                min="0"
                                                            />
                                                        </div>

                                                        {/* Clear Filters */}
                                                        <div className="col-md-2 d-flex align-items-end">
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm w-100"
                                                                onClick={() => {
                                                                    setDateRange({ start: '', end: '' });
                                                                    setMinComments('');
                                                                    setMinLikes('');
                                                                }}
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Active Filters Display */}
                                                {(search || activeCategory !== 'all' || dateRange.start || dateRange.end || minComments || minLikes) && (
                                                    <div className="mt-3">
                                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                                            <span className="text-gray-400 small">Active filters:</span>
                                                            
                                                            {search && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    Search: "{search}"
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setSearch('')}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}
                                                            
                                                            {activeCategory !== 'all' && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    Category: {activeCategory}
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setActiveCategory('all')}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}
                                                            
                                                            {dateRange.start && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    From: {dateRange.start}
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setDateRange(prev => ({ ...prev, start: '' }))}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}
                                                            
                                                            {dateRange.end && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    To: {dateRange.end}
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setDateRange(prev => ({ ...prev, end: '' }))}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}
                                                            
                                                            {minComments && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    Min Comments: {minComments}
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setMinComments('')}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}
                                                            
                                                            {minLikes && (
                                                                <span className="badge bg-primary d-flex align-items-center gap-1">
                                                                    Min Likes: {minLikes}
                                                                    <button 
                                                                        className="btn btn-sm p-0 text-white"
                                                                        onClick={() => setMinLikes('')}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </span>
                                                            )}

                                                            <button 
                                                                className="btn btn-link text-primary p-0 small"
                                                                onClick={() => {
                                                                    setSearch('');
                                                                    setActiveCategory('all');
                                                                    setDateRange({ start: '', end: '' });
                                                                    setMinComments('');
                                                                    setMinLikes('');
                                                                }}
                                                            >
                                                                Clear all
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Results Count */}
                                    <div className="row mb-3">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="text-gray-300">
                                                    {filteredPosts.length > 0 ? (
                                                        <>
                                                            Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                                                            {(search || activeCategory !== 'all' || dateRange.start || minComments || minLikes) && (
                                                                <span className="text-gray-400"> (filtered from {community?.length || 0} total)</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        'No posts found matching your criteria'
                                                    )}
                                                </div>
                                                
                                                {/* Quick Status Filter */}
                                                <div className="d-flex gap-2 align-items-center">
                                                    <span className="text-gray-400 small">Status:</span>
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <button
                                                            type="button"
                                                            className={`btn ${sort !== 'featured' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => setSort('latest')}
                                                        >
                                                            All Posts
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn ${sort === 'featured' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                            onClick={() => setSort('featured')}
                                                        >
                                                            Featured Only
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Featured Posts Carousel */}
                                    {featured_posts && featured_posts.length > 0 && (
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="bg-body-3 rounded-lg p-4">
                                                    <h5 className="text-white mb-3">
                                                        <i className="bi bi-star-fill text-warning me-2"></i>
                                                        Featured Posts
                                                    </h5>
                                                    <div className="row g-3">
                                                        {featured_posts.slice(0, 3).map(post => (
                                                            <div key={post.id} className="col-md-4">
                                                                <div className="bg-body-2 rounded p-3 h-100">
                                                                    <div className="d-flex align-items-center mb-2">
                                                                        <img
                                                                            src={post.user?.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                                                                            alt={post.user?.name}
                                                                            className="rounded-circle me-2"
                                                                            style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                                                                        />
                                                                        <span className="text-white small">{post.user?.name}</span>
                                                                    </div>
                                                                    <h6 className="text-white mb-2">{post.title}</h6>
                                                                    <p className="text-gray-300 small line-clamp-2">{post.content?.substring(0, 100)}...</p>
                                                                    <Link href={`/community/${post.id}`} className="btn btn-primary btn-sm">
                                                                        Read More
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Posts Grid/List */}
                                    <div className="row g-4">
                                        {filteredPosts.length > 0 ? (
                                            filteredPosts.map((post) => (
                                                <div key={post.id} className={viewMode === 'grid' ? 'col-lg-6 col-xl-4' : 'col-12'}>
                                                    <div className={`bg-body-3 rounded-lg p-4 h-100 ${viewMode === 'list' ? 'd-flex flex-column' : ''}`}>
                                                        {/* Post Header */}
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="d-flex align-items-center">
                                                                    <img
                                                                        src={post.user?.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                                                                        alt={post.user?.name}
                                                                        className="rounded-circle me-2"
                                                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                    />
                                                                    <div>
                                                                        <div className="text-white fw-medium">{post.user?.name || 'Anonymous'}</div>
                                                                        <div className="text-gray-400 small">
                                                                            {formatDate(post.created_at)}
                                                                            {post.updated_at !== post.created_at && (
                                                                                <span className="ms-2">(edited)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {post.category && (
                                                                    <span className="badge bg-primary">{post.category}</span>
                                                                )}
                                                                {post.is_featured && (
                                                                    <span className="badge bg-warning">
                                                                        <i className="bi bi-star-fill me-1"></i>
                                                                        Featured
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="dropdown">
                                                                <button className="btn btn-link text-gray-400 p-0 border-0" data-bs-toggle="dropdown">
                                                                    <i className="bi bi-three-dots"></i>
                                                                </button>
                                                                <ul className="dropdown-menu dropdown-menu-end bg-body-2 border-body-4">
                                                                    <li>
                                                                        <button className="dropdown-item text-white">
                                                                            <i className="bi bi-bookmark me-2"></i>
                                                                            Bookmark
                                                                        </button>
                                                                    </li>
                                                                    <li>
                                                                        <button className="dropdown-item text-white">
                                                                            <i className="bi bi-share me-2"></i>
                                                                            Share
                                                                        </button>
                                                                    </li>
                                                                    {auth?.user && (
                                                                        <li>
                                                                            <button className="dropdown-item text-white">
                                                                                <i className="bi bi-flag me-2"></i>
                                                                                Report
                                                                            </button>
                                                                        </li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* Post Content */}
                                                        <h5 className="text-white mb-3">
                                                            <Link
                                                                href={`/community/${post.id}`}
                                                                className="text-white text-decoration-none hover-text-primary"
                                                            >
                                                                {post.title}
                                                            </Link>
                                                        </h5>

                                                        <div className="text-gray-300 mb-3">
                                                            {expandedPost === post.id || viewMode === 'list' ? (
                                                                <div dangerouslySetInnerHTML={{ __html: post.content }} />
                                                            ) : (
                                                                <div>
                                                                    {post.content && post.content.length > 150
                                                                        ? <div dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) + '...' }} />
                                                                        : <div dangerouslySetInnerHTML={{ __html: post.content }} />
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>

                                                        {post.content && post.content.length > 150 && viewMode === 'grid' && (
                                                            <button
                                                                className="btn btn-link text-primary p-0 mb-3"
                                                                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                                            >
                                                                {expandedPost === post.id ? 'Show less' : 'Read more'}
                                                            </button>
                                                        )}

                                                        {/* Tags */}
                                                        {post.tags && post.tags.length > 0 && (
                                                            <div className="mb-3">
                                                                {post.tags.map(tag => (
                                                                    <span key={tag} className="badge bg-body-2 text-gray-300 me-2 mb-1">
                                                                        #{tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Post Image */}
                                                        {post.image && (
                                                            <div className="mb-3">
                                                                <img
                                                                    src={`/storage/${post.image}`}
                                                                    alt={post.title}
                                                                    className="img-fluid rounded"
                                                                    style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Enhanced Post Actions */}
                                                        <div className="d-flex justify-content-between align-items-center mt-auto">
                                                            <div className="d-flex gap-3">
                                                                {/* Reaction Picker */}
                                                                <div className="position-relative">
                                                                    <button
                                                                        className={`btn btn-sm d-flex align-items-center gap-2 ${getUserReaction(post)
                                                                            ? 'btn-primary'
                                                                            : 'btn-outline-secondary'
                                                                            }`}
                                                                        onClick={() => setShowReactionPicker(prev => ({
                                                                            ...prev,
                                                                            [post.id]: !prev[post.id]
                                                                        }))}
                                                                    >
                                                                        {getUserReaction(post) ? (
                                                                            <>
                                                                                <span>{reactionTypes[getUserReaction(post).type]?.emoji}</span>
                                                                                <span>{formatNumber(post.likes_count)}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="bi bi-emoji-smile"></i>
                                                                                <span>{formatNumber(post.likes_count)}</span>
                                                                            </>
                                                                        )}
                                                                    </button>

                                                                    {/* Reaction Picker Popover */}
                                                                    {showReactionPicker[post.id] && (
                                                                        <div className="position-absolute bottom-100 start-0 bg-body-2 rounded p-2 shadow-lg d-flex gap-1 mb-2">
                                                                            {Object.entries(reactionTypes).map(([type, data]) => (
                                                                                <button
                                                                                    key={type}
                                                                                    className="btn btn-sm p-1 reaction-btn"
                                                                                    onClick={() => {
                                                                                        handlePostReaction(post.id, type);
                                                                                        setShowReactionPicker(prev => ({ ...prev, [post.id]: false }));
                                                                                    }}
                                                                                    title={data.label}
                                                                                >
                                                                                    <span style={{ fontSize: '1.2rem' }}>{data.emoji}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Comment Button */}
                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                                                                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                                                >
                                                                    <i className="bi bi-chat"></i>
                                                                    <span>{formatNumber(post.comments_count)}</span>
                                                                </button>

                                                                {/* View Counter */}
                                                                <div className="d-flex align-items-center gap-1 text-gray-400">
                                                                    <i className="bi bi-eye"></i>
                                                                    <span>{formatNumber(post.views)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Comments Section */}
                                                        {expandedPost === post.id && (
                                                            <div className="mt-4 border-top border-body-4 pt-4">
                                                                <h6 className="text-white mb-3">
                                                                    Comments ({post.comments_count})
                                                                </h6>

                                                                {/* Add Comment Form */}
                                                                {auth?.user && (
                                                                    <div className="mb-4">
                                                                        <textarea
                                                                            className="form-control bg-body border-body-4 text-white mb-2"
                                                                            placeholder="Add a comment..."
                                                                            value={commentText[post.id] || ''}
                                                                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                                            rows="3"
                                                                        />
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <button
                                                                                className="btn btn-primary me-2"
                                                                                onClick={() => handleAddComment(post.id)}
                                                                            >
                                                                                Comment
                                                                            </button>
                                                                            <small className="text-gray-400">
                                                                                {2000 - (commentText[post.id]?.length || 0)} characters remaining
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Comments List */}
                                                                {post.comments?.filter(comment => !comment.parent_id).map(comment => (
                                                                    <CommentThread
                                                                        key={comment.id}
                                                                        comment={comment}
                                                                        auth={auth}
                                                                        onEdit={handleEditComment}
                                                                        onDelete={handleDeleteComment}
                                                                        onReply={handleAddReply}
                                                                        onReaction={handleCommentReaction}
                                                                        formatDate={formatDate}
                                                                        formatNumber={formatNumber}
                                                                        postId={post.id}
                                                                        editingComment={editingComment}
                                                                        setEditingComment={setEditingComment}
                                                                        editCommentText={editCommentText}
                                                                        setEditCommentText={setEditCommentText}
                                                                        showReplyForm={showReplyForm}
                                                                        setShowReplyForm={setShowReplyForm}
                                                                        replyText={replyText}
                                                                        setReplyText={setReplyText}
                                                                        hasUserReactedToComment={hasUserReactedToComment}
                                                                        reactionTypes={reactionTypes}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-12">
                                                <div className="text-center py-5">
                                                    <i className="bi bi-search display-1 text-gray-400 mb-3"></i>
                                                    <h4 className="text-white mb-2">No posts found</h4>
                                                    <p className="text-gray-300 mb-4">
                                                        {search || activeCategory !== 'all' || dateRange.start || minComments || minLikes
                                                            ? "Try adjusting your search filters or create a new post!"
                                                            : "Be the first to create a post in our community!"
                                                        }
                                                    </p>
                                                    {canCreatePost ? (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => setShowCreatePostModal(true)}
                                                        >
                                                            <i className="bi bi-plus-circle me-2"></i>
                                                            Create First Post
                                                        </button>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-300 mb-3">Please login to create a post</p>
                                                            <Link href="/login" className="btn btn-primary">
                                                                Login to Post
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Load More with Pagination */}
                                    {filteredPosts.length > 0 && (
                                        <div className="row mt-5">
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="text-gray-300">
                                                        Showing {Math.min(filteredPosts.length, 12)} of {filteredPosts.length} posts
                                                    </div>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn btn-outline-primary">
                                                            <i className="bi bi-arrow-left me-2"></i>
                                                            Previous
                                                        </button>
                                                        <button className="btn btn-outline-primary">
                                                            Next
                                                            <i className="bi bi-arrow-right ms-2"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </div>
                </div>

                {/* Create Post Modal */}
                {showCreatePostModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content bg-body-2 border-body-4">
                                <div className="modal-header border-body-4">
                                    <h5 className="modal-title text-white">
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Create New Post
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => {
                                            setShowCreatePostModal(false);
                                            resetPostForm();
                                        }}
                                    ></button>
                                </div>
                                <form onSubmit={handleCreatePost}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label text-white">Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-body border-body-4 text-white"
                                                    placeholder="Enter post title..."
                                                    value={postFormData.title}
                                                    onChange={(e) => handlePostFormChange('title', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label text-white">Content *</label>
                                                <textarea
                                                    className="form-control bg-body border-body-4 text-white"
                                                    placeholder="Write your post content..."
                                                    rows="6"
                                                    value={postFormData.content}
                                                    onChange={(e) => handlePostFormChange('content', e.target.value)}
                                                    required
                                                ></textarea>
                                                <div className="form-text text-gray-400">
                                                    You can use basic HTML formatting in your post.
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-white">Category</label>
                                                <select
                                                    className="form-select bg-body border-body-4 text-white"
                                                    value={postFormData.category}
                                                    onChange={(e) => handlePostFormChange('category', e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories?.map(category => (
                                                        <option key={category.id} value={category.name}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label text-white">Tags</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-body border-body-4 text-white"
                                                    placeholder="e.g., islam, prayer, quran"
                                                    value={postFormData.tags}
                                                    onChange={(e) => handlePostFormChange('tags', e.target.value)}
                                                />
                                                <div className="form-text text-gray-400">
                                                    Separate tags with commas
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label text-white">Featured Image</label>
                                                <input
                                                    type="file"
                                                    className="form-control bg-body border-body-4 text-white"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                />
                                                {imagePreview && (
                                                    <div className="mt-3">
                                                        <div className="position-relative d-inline-block">
                                                            <img
                                                                src={imagePreview}
                                                                alt="Preview"
                                                                className="img-thumbnail"
                                                                style={{ maxHeight: '200px' }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                                                onClick={handleRemoveImage}
                                                            >
                                                                <i className="bi bi-x"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-12">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="is_featured"
                                                        checked={postFormData.is_featured}
                                                        onChange={(e) => handlePostFormChange('is_featured', e.target.checked)}
                                                    />
                                                    <label className="form-check-label text-white" htmlFor="is_featured">
                                                        Feature this post
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer border-body-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setShowCreatePostModal(false);
                                                resetPostForm();
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Create Post
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </FrontAuthenticatedLayout>

            <style jsx>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .hover-text-primary:hover {
                    color: var(--bs-primary) !important;
                    transition: color 0.3s ease;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .reaction-btn:hover {
                    transform: scale(1.2);
                    transition: transform 0.2s ease;
                }
                .sticky-top {
                    position: sticky;
                    z-index: 100;
                }
            `}</style>
        </>
    );
}

// Separate Comment Thread Component
const CommentThread = ({
    comment,
    auth,
    onEdit,
    onDelete,
    onReply,
    onReaction,
    formatDate,
    formatNumber,
    postId,
    editingComment,
    setEditingComment,
    editCommentText,
    setEditCommentText,
    showReplyForm,
    setShowReplyForm,
    replyText,
    setReplyText,
    hasUserReactedToComment,
    reactionTypes
}) => {
    return (
        <div className="comment-thread mb-3">
            {/* Main Comment */}
            <div className="bg-body-2 rounded p-3 mb-2">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                        <img
                            src={comment.user?.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                            alt={comment.user?.name}
                            className="rounded-circle me-2"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                        <div>
                            <div className="text-white small fw-medium">{comment.user?.name}</div>
                            <div className="text-gray-400 small">{formatDate(comment.created_at)}</div>
                        </div>
                    </div>

                    {auth?.user && (auth.user.id === comment.user_id || auth.user.role === 'admin') && (
                        <div className="dropdown">
                            <button className="btn btn-sm btn-link text-gray-400 p-0 border-0" data-bs-toggle="dropdown">
                                <i className="bi bi-three-dots"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end bg-body-2 border-body-4">
                                <li>
                                    <button
                                        className="dropdown-item text-white"
                                        onClick={() => {
                                            setEditingComment(comment.id);
                                            setEditCommentText(comment.content);
                                        }}
                                    >
                                        <i className="bi bi-pencil me-2"></i>Edit
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item text-danger"
                                        onClick={() => onDelete(comment.id)}
                                    >
                                        <i className="bi bi-trash me-2"></i>Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                {editingComment === comment.id ? (
                    <div className="mb-2">
                        <textarea
                            className="form-control bg-body border-body-4 text-white mb-2"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows="3"
                        />
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => onEdit(comment.id)}
                            >
                                Save
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setEditingComment(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-300 mb-2">
                        {comment.content}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-3">
                        {/* Comment Reaction Picker */}
                        <div className="position-relative">
                            <button
                                className={`btn btn-sm ${hasUserReactedToComment(comment, 'like')
                                    ? 'text-primary'
                                    : 'text-gray-400'
                                    } p-0 border-0 d-flex align-items-center gap-1`}
                                onClick={() => onReaction(comment.id, 'like')}
                            >
                                <i className="bi bi-hand-thumbs-up"></i>
                                <span>{formatNumber(comment.reactions?.length || 0)}</span>
                            </button>
                        </div>

                        {auth?.user && (
                            <button
                                className="btn btn-sm text-gray-400 p-0 border-0 d-flex align-items-center gap-1"
                                onClick={() => setShowReplyForm(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                            >
                                <i className="bi bi-reply"></i>
                                Reply
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="ms-4">
                    {comment.replies.map(reply => (
                        <div key={reply.id} className="bg-body-2 rounded p-3 mb-2">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="d-flex align-items-center">
                                    <img
                                        src={reply.user?.avatar || 'https://img.icons8.com/color/48/test-account.png'}
                                        alt={reply.user?.name}
                                        className="rounded-circle me-2"
                                        style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                    />
                                    <div>
                                        <div className="text-white small fw-medium">{reply.user?.name}</div>
                                        <div className="text-gray-400 small">{formatDate(reply.created_at)}</div>
                                    </div>
                                </div>

                                {auth?.user && (auth.user.id === reply.user_id || auth.user.role === 'admin') && (
                                    <div className="dropdown">
                                        <button className="btn btn-sm btn-link text-gray-400 p-0 border-0" data-bs-toggle="dropdown">
                                            <i className="bi bi-three-dots"></i>
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end bg-body-2 border-body-4">
                                            <li>
                                                <button
                                                    className="dropdown-item text-white"
                                                    onClick={() => {
                                                        setEditingComment(reply.id);
                                                        setEditCommentText(reply.content);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil me-2"></i>Edit
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    className="dropdown-item text-danger"
                                                    onClick={() => onDelete(reply.id)}
                                                >
                                                    <i className="bi bi-trash me-2"></i>Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {editingComment === reply.id ? (
                                <div className="mb-2">
                                    <textarea
                                        className="form-control bg-body border-body-4 text-white mb-2"
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        rows="2"
                                    />
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => onEdit(reply.id)}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => setEditingComment(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-300 mb-2">
                                    {reply.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Form */}
            {showReplyForm[comment.id] && auth?.user && (
                <div className="ms-4 mt-2">
                    <textarea
                        className="form-control bg-body border-body-4 text-white mb-2"
                        placeholder="Write your reply..."
                        value={replyText[comment.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        rows="2"
                    />
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onReply(comment.id, postId)}
                        >
                            Reply
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setShowReplyForm(prev => ({ ...prev, [comment.id]: false }))}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
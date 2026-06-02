import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback, useMemo } from 'react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { Head } from '@inertiajs/react';
import Header from "./Header";
import Footer from "./Footer";
import axios from 'axios';
import { getS3PublicUrl } from "@/Utils/s3Helpers";


export default function CommunityDetails() {
    const { community, auth, flash, reaction_counts, user_reaction } = usePage().props;
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [reactionCounts, setReactionCounts] = useState(reaction_counts || { like: 0, love: 0, dislike: 0 });
    const [userReaction, setUserReaction] = useState(user_reaction || null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState({
        reactions: false,
        comment: false,
        reply: false,
        update: false,
        delete: false,
        initial: true
    });
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [expandedComments, setExpandedComments] = useState(new Set());

    // URL generators
    const getImageUrl = useCallback((imagePath) => {
        return imagePath ? getS3PublicUrl(imagePath) : '/default-community-image.jpg';
    }, []);

    const getFileUrl = useCallback((filePath) => {
        return filePath ? getS3PublicUrl(filePath) : null;
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    // SEO data from the community object
    const seoData = community.seo || {};

    // Memoized configuration
    const communityTypeConfig = useMemo(() => ({
        discussion: {
            icon: 'fas fa-comments',
            label: 'Discussion',
            badgeColor: 'bg-primary'
        },
        event: {
            icon: 'fas fa-calendar-alt',
            label: 'Event',
            badgeColor: 'bg-success'
        },
        announcement: {
            icon: 'fas fa-bullhorn',
            label: 'Announcement',
            badgeColor: 'bg-warning'
        },
        question: {
            icon: 'fas fa-question-circle',
            label: 'Question',
            badgeColor: 'bg-info'
        }
    }), []);

    const reactionTypes = useMemo(() => ({
        like: {
            icon: 'fas fa-thumbs-up',
            label: 'Like',
            color: 'text-blue-400'
        },
        love: {
            icon: 'fas fa-heart',
            label: 'Love',
            color: 'text-red-400'
        },
        dislike: {
            icon: 'fas fa-thumbs-down',
            label: 'Dislike',
            color: 'text-yellow-400'
        }
    }), []);

    // Enhanced toast system
    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    }, []);

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(prev => ({ ...prev, initial: true }));

                // Set initial comments - filter out replies (comments with parent_id)
                if (community.comments) {
                    const mainComments = community.comments.filter(comment => !comment.parent_id);
                    setComments(mainComments);
                }

            } catch (error) {
                showToast('Failed to load community data', 'error');
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };

        if (community && community.id) {
            initializeData();
        }
    }, [community?.id]);

    // Handle reaction - COMPLETELY FIXED
    const handleReaction = useCallback(async (type, e) => {
        if (e) e.stopPropagation();

        if (!auth?.user) {
            showToast('Please login to react', 'error');
            return;
        }

        if (loading.reactions) return;

        setLoading(prev => ({ ...prev, reactions: true }));

        try {
            const response = await axios.post('/community/reactions/toggle', {
                community_id: community.id,
                type: type
            });

            if (response.data.success) {
                setReactionCounts(prev => ({
                    ...prev,
                    ...response.data.reaction_counts
                }));
                setUserReaction(response.data.user_reaction);
                showToast(response.data.message, 'success');
            } else {
                throw new Error(response.data.message || 'Failed to update reaction');
            }
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update reaction';
            showToast(message, 'error');
        } finally {
            setLoading(prev => ({ ...prev, reactions: false }));
        }
    }, [auth?.user, community?.id, loading.reactions, showToast]);

    // Handle comment submission
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !auth?.user) return;

        setLoading(prev => ({ ...prev, comment: true }));
        const tempId = `temp-${Date.now()}`;
        const tempComment = {
            id: tempId,
            content: commentText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            replies: [],
            is_temp: true
        };

        // Optimistic update
        setComments(prev => [tempComment, ...prev]);
        setCommentText('');

        try {
            const response = await axios.post('/community/comments', {
                community_id: community.id,
                content: commentText.trim()
            });

            if (response.data.success) {
                // Replace temp comment with actual comment
                setComments(prev => prev.map(comment =>
                    comment.id === tempId ? response.data.comment : comment
                ));
                showToast(response.data.message, 'success');
            } else {
                throw new Error(response.data.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            // Remove temp comment on error
            setComments(prev => prev.filter(comment => comment.id !== tempId));
            showToast('Failed to add comment', 'error');
        } finally {
            setLoading(prev => ({ ...prev, comment: false }));
        }
    };

    // Handle reply submission
    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim() || !auth?.user) return;

        setLoading(prev => ({ ...prev, reply: true }));
        const tempId = `temp-reply-${Date.now()}`;
        const tempReply = {
            id: tempId,
            content: replyText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            is_temp: true
        };

        // Optimistic update
        setComments(prev => prev.map(comment => {
            if (comment.id === parentId) {
                return {
                    ...comment,
                    replies: [...(comment.replies || []), tempReply]
                };
            }
            return comment;
        }));

        setReplyText('');
        setReplyingTo(null);

        try {
            const response = await axios.post('/community/comments', {
                community_id: community.id,
                content: replyText.trim(),
                parent_id: parentId
            });

            if (response.data.success) {
                // Replace temp reply with actual reply
                setComments(prev => prev.map(comment => {
                    if (comment.id === parentId) {
                        return {
                            ...comment,
                            replies: (comment.replies || []).map(reply =>
                                reply.id === tempId ? response.data.comment : reply
                            )
                        };
                    }
                    return comment;
                }));
                showToast(response.data.message, 'success');
            } else {
                throw new Error(response.data.message || 'Failed to add reply');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            // Remove temp reply on error
            setComments(prev => prev.map(comment => {
                if (comment.id === parentId) {
                    return {
                        ...comment,
                        replies: (comment.replies || []).filter(reply => reply.id !== tempId)
                    };
                }
                return comment;
            }));
            showToast('Failed to add reply', 'error');
        } finally {
            setLoading(prev => ({ ...prev, reply: false }));
        }
    };

    // Handle comment update
    const handleCommentUpdate = async (commentId, e) => {
        if (e) e.stopPropagation();

        if (!editText.trim()) return;

        setLoading(prev => ({ ...prev, update: true }));

        // Optimistic update
        const updatedComments = updateCommentInTree(comments, commentId, editText.trim());
        setComments(updatedComments);

        try {
            const response = await axios.put(`/community/comments/${commentId}`, {
                content: editText.trim()
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update comment');
            }

            showToast('Comment updated successfully', 'success');
            setEditingComment(null);
            setEditText('');
        } catch (error) {
            console.error('Error updating comment:', error);
            // Revert by re-fetching comments
            if (community.comments) {
                const mainComments = community.comments.filter(comment => !comment.parent_id);
                setComments(mainComments);
            }
            showToast('Failed to update comment', 'error');
        } finally {
            setLoading(prev => ({ ...prev, update: false }));
        }
    };

    // Helper function to update comment in tree
    const updateCommentInTree = (comments, commentId, newText) => {
        return comments.map(comment => {
            if (comment.id === commentId) {
                return { ...comment, content: newText };
            }
            if (comment.replies) {
                return {
                    ...comment,
                    replies: updateCommentInTree(comment.replies, commentId, newText)
                };
            }
            return comment;
        });
    };

    // Handle comment deletion
    const handleCommentDelete = async (commentId, e) => {
        if (e) e.stopPropagation();

        if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

        setLoading(prev => ({ ...prev, delete: true }));

        // Optimistic update
        const filteredComments = filterCommentFromTree(comments, commentId);
        setComments(filteredComments);

        try {
            const response = await axios.delete(`/community/comments/${commentId}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete comment');
            }

            showToast('Comment deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting comment:', error);
            // Revert by re-fetching comments
            if (community.comments) {
                const mainComments = community.comments.filter(comment => !comment.parent_id);
                setComments(mainComments);
            }
            showToast('Failed to delete comment', 'error');
        } finally {
            setLoading(prev => ({ ...prev, delete: false }));
        }
    };

    // Helper function to filter comment from tree
    const filterCommentFromTree = (comments, commentId) => {
        return comments.filter(comment => {
            if (comment.id === commentId) return false;
            if (comment.replies) {
                comment.replies = filterCommentFromTree(comment.replies, commentId);
            }
            return true;
        });
    };

    // Toggle comment expansion
    const toggleCommentExpansion = (commentId, e) => {
        if (e) e.stopPropagation();

        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    // Handle reply button click
    const handleReplyButtonClick = (commentId, e) => {
        if (e) e.stopPropagation();
        setReplyingTo(replyingTo === commentId ? null : commentId);
    };

    // Handle edit button click
    const handleEditButtonClick = (comment, e) => {
        if (e) e.stopPropagation();
        setEditingComment(comment.id);
        setEditText(comment.content || comment.comment);
    };

    // Handle cancel edit
    const handleCancelEdit = (e) => {
        if (e) e.stopPropagation();
        setEditingComment(null);
        setEditText('');
    };

    // Render attachments if any
    const renderAttachments = () => {
        if (!community.attachments || community.attachments.length === 0) return null;

        return (
            <div className="attachments-section">
                <h4 className="attachments-title">
                    <i className="fas fa-paperclip"></i>
                    Attachments ({community.attachments.length})
                </h4>
                <div className="attachments-grid">
                    {community.attachments.map((attachment, index) => (
                        <a
                            key={index}
                            href={getFileUrl(attachment.path)}
                            download
                            className="attachment-item"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fas fa-file-download"></i>
                            <span>{attachment.name || `Attachment ${index + 1}`}</span>
                        </a>
                    ))}
                </div>
            </div>
        );
    };

    // Reaction button component
    const ReactionButton = ({ type, label, count }) => {
        const config = reactionTypes[type];
        const isActive = userReaction?.type === type;

        return (
            <button
                onClick={(e) => handleReaction(type, e)}
                disabled={loading.reactions}
                className={`reaction-btn ${isActive ? 'active' : ''} ${loading.reactions ? 'loading' : ''}`}
            >
                <i className={config.icon}></i>
                <span className="count">{count}</span>
                <span className="label">{label}</span>
            </button>
        );
    };

    // Comment component
    const CommentItem = ({ comment, level = 0 }) => {
        const isExpanded = expandedComments.has(comment.id);
        const canModify = auth?.user && (auth.user.id === comment.user_id || auth.user.role === 'admin');
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isTemp = comment.is_temp;

        return (
            <div className={`comment-item ${level > 0 ? 'nested' : ''} ${isTemp ? 'temp' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="comment-content">
                    {/* Comment Header */}
                    <div className="comment-header">
                        <div className="user-info">
                            <div className="user-avatar">
                                {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="user-details">
                                <div className="user-name">
                                    {comment.user?.name || 'Anonymous'}
                                    {isTemp && <span className="posting-badge">Posting...</span>}
                                </div>
                                <div className="comment-date">{formatDate(comment.created_at)}</div>
                            </div>
                        </div>

                        {canModify && !isTemp && (
                            <div className="comment-actions">
                                <button
                                    onClick={(e) => handleEditButtonClick(comment, e)}
                                    disabled={loading.update}
                                    className="edit-btn"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => handleCommentDelete(comment.id, e)}
                                    disabled={loading.delete}
                                    className="delete-btn"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Comment Content */}
                    {editingComment === comment.id ? (
                        <div className="edit-form" onClick={(e) => e.stopPropagation()}>
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="edit-textarea"
                                rows="3"
                            />
                            <div className="edit-actions">
                                <button
                                    onClick={(e) => handleCommentUpdate(comment.id, e)}
                                    disabled={loading.update || !editText.trim()}
                                    className="save-btn"
                                >
                                    {loading.update ? 'Updating...' : 'Update'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="comment-text">{comment.content || comment.comment}</div>
                    )}

                    {/* Comment Actions */}
                    {level === 0 && auth?.user && !isTemp && (
                        <div className="comment-footer">
                            <button
                                onClick={(e) => handleReplyButtonClick(comment.id, e)}
                                className="reply-btn"
                            >
                                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                            </button>

                            {hasReplies && (
                                <button
                                    onClick={(e) => toggleCommentExpansion(comment.id, e)}
                                    className="toggle-replies-btn"
                                >
                                    {isExpanded ? 'Hide' : 'Show'} Replies ({comment.replies.length})
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="reply-form" onClick={(e) => e.stopPropagation()}>
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
                                    {loading.reply ? 'Posting...' : 'Post Reply'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReplyingTo(null);
                                        setReplyText('');
                                    }}
                                    className="cancel-reply-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Nested Replies */}
                {hasReplies && (isExpanded || level > 0) && (
                    <div className="replies-container">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Handle action button clicks
    const handleScrollToComments = (e) => {
        if (e) e.stopPropagation();
        document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSharePost = (e) => {
        if (e) e.stopPropagation();
        showToast('Share functionality coming soon!', 'info');
    };

    const handleSavePost = (e) => {
        if (e) e.stopPropagation();
        showToast('Save functionality coming soon!', 'info');
    };

    const handleReportPost = (e) => {
        if (e) e.stopPropagation();
        showToast('Report functionality coming soon!', 'info');
    };

    // If community is not loaded yet
    if (!community) {
        return (
            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <Header />
                    <div className="content-section">
                        <div className="container-md">
                            <div className="loading-state">
                                <i className="fas fa-spinner fa-spin"></i>
                                <h3>Loading Community Post...</h3>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </FrontAuthenticatedLayout>
        );
    }

    return (
        <>
            <Head>
                <title>{seoData.meta_title || community.title || 'Community Post'}</title>
                <meta name="description" content={seoData.meta_description || community.content?.substring(0, 160) || 'Community discussion'} />
                <meta name="keywords" content={seoData.meta_keywords || 'community, discussion, muslim, islamic'} />
            </Head>

            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <Header />

                    {/* Toast Notification */}
                    {toast.show && (
                        <div className={`toast-notification ${toast.type}`}>
                            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                            <span>{toast.message}</span>
                        </div>
                    )}

                    {/* Main Content Section */}
                    <div className="content-section" id="content">
                        <div className="container-md">
                            <div className="content-layout">
                                {/* Community Info Sidebar */}
                                <div className="filter-sidebar">
                                    <div className="filter-header">
                                        <h3 className="filter-title">
                                            <i className="fas fa-users"></i>
                                            Community Info
                                        </h3>
                                    </div>

                                    {/* Author Info */}
                                    <div className="author-info-container">
                                        <div className="author-avatar">
                                            {community.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                        </div>
                                        <div className="author-details">
                                            <h4 className="author-name">{community.user?.name || 'Anonymous'}</h4>
                                            <p className="author-role">Community Member</p>
                                        </div>
                                    </div>

                                    {/* Community Stats */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-chart-bar"></i>
                                            Post Details
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">Type:</span>
                                                <span className="stat-value">
                                                    <i className={communityTypeConfig[community.type]?.icon}></i>
                                                    {communityTypeConfig[community.type]?.label}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Views:</span>
                                                <span className="stat-value">{community.views || 0}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Comments:</span>
                                                <span className="stat-value">{community.comments_count || 0}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Reactions:</span>
                                                <span className="stat-value">{community.reactions_count || 0}</span>
                                            </div>
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
                                            Timeline
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">Created : </span>
                                                <span style={{ fontSize: '0.775rem' }} className="stat-value">{formatDate(community.created_at)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Updated : </span>
                                                <span style={{ fontSize: '0.775rem' }} className="stat-value">{formatDate(community.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="quick-actions">
                                        <button 
                                            className="action-btn primary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert("Page URL copied!");
                                            }}
                                        >
                                            <i className="fas fa-share"></i>
                                            Share Post
                                        </button>
                                        <button
                                            className="action-btn outline"
                                            onClick={handleSavePost}
                                        >
                                            <i className="fas fa-bookmark"></i>
                                            Save Post
                                        </button>
                                    </div>
                                </div>

                                {/* Community Details Main Content */}
                                <div className="posts-grid-section">
                                    {/* Post Header */}
                                    <div className="section-header">
                                        <div className="post-header-content">
                                            {/* <div className="post-type-badge">
                                                <i className={communityTypeConfig[community.type]?.icon}></i>
                                                {communityTypeConfig[community.type]?.label}
                                            </div> */}
                                            <h1 className="section-title">{community.title}</h1>
                                            <div className="post-meta">
                                                <span className="post-author">
                                                    By {community.user?.name || 'Anonymous'}
                                                </span>
                                                <span className="post-date">
                                                    {formatDate(community.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Content */}
                                    <div className="content-display-card">
                                        <div className="post-content">
                                            {community.image && (
                                                <div className="post-image-container">
                                                    <img
                                                        src={getImageUrl(community.image)}
                                                        alt={community.title}
                                                        className="post-image"
                                                    />
                                                </div>
                                            )}
                                            <div className="post-text-content">
                                                <div className="post-description">
                                                    {community.content}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attachments */}
                                        {renderAttachments()}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="action-buttons-grid">
                                        <button
                                            onClick={handleScrollToComments}
                                            className="action-btn primary"
                                        >
                                            <i className="fas fa-comments"></i>
                                            Join Discussion ({comments.length})
                                        </button>
                                        <button
                                            className="action-btn secondary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert("Page URL copied!");
                                            }}
                                        >
                                            <i className="fas fa-share-alt"></i>
                                            Share with Community
                                        </button>
                                        <button
                                            className="action-btn outline"
                                            onClick={handleReportPost}
                                        >
                                            <i className="fas fa-flag"></i>
                                            Report Post
                                        </button>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="additional-info-card">
                                        <h3 className="info-title">
                                            <i className="fas fa-info-circle"></i>
                                            Post Information
                                        </h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Post Type</span>
                                                <span className="info-value">
                                                    {communityTypeConfig[community.type]?.label}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Visibility</span>
                                                <span className="info-value">
                                                    {community.is_public ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Total Views</span>
                                                <span className="info-value">{community.views || 0}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Last Updated</span>
                                                <span className="info-value">{formatDate(community.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="comments-section-card" id="comments-section">
                                        <div className="comments-header">
                                            <h3 className="comments-title">
                                                <i className="fas fa-comments"></i>
                                                Community Discussion ({comments.length})
                                            </h3>
                                            <p className="comments-subtitle">
                                                Join the conversation and share your thoughts with the community
                                            </p>
                                        </div>

                                        {/* Comment Form */}
                                        {auth?.user ? (
                                            <form onSubmit={handleCommentSubmit} className="comment-form">
                                                <textarea
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Share your thoughts with the community..."
                                                    className="comment-textarea"
                                                    rows="4"
                                                    required
                                                />
                                                <div className="comment-form-footer">
                                                    <small className="char-count">
                                                        {commentText.length}/1000 characters
                                                    </small>
                                                    <button
                                                        type="submit"
                                                        disabled={loading.comment || !commentText.trim()}
                                                        className="submit-comment-btn"
                                                    >
                                                        {loading.comment ? 'Posting...' : 'Post Comment'}
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="login-prompt">
                                                <p>
                                                    Please <Link href="/login" className="login-link">login</Link> to join the discussion.
                                                </p>
                                            </div>
                                        )}

                                        {/* Comments List */}
                                        <div className="comments-list">
                                            {comments.length > 0 ? (
                                                comments.map(comment => (
                                                    <CommentItem key={comment.id} comment={comment} />
                                                ))
                                            ) : (
                                                <div className="no-comments">
                                                    <i className="fas fa-comments"></i>
                                                    <p>No comments yet. Be the first to start the discussion!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
                
                <style jsx>{`
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

                    /* Community Info Sidebar */
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
                        border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    }

                    .filter-title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #ffffff;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    /* Author Info */
                    .author-info-container {
                        text-align: center;
                        margin-bottom: 25px;
                        padding: 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                    }

                    .author-avatar {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: #1b7a3a;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 24px;
                        margin: 0 auto 15px;
                        border: 3px solid white;
                    }

                    .author-name {
                        color: white;
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 5px;
                    }

                    .author-role {
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 14px;
                        margin: 0;
                    }

                    /* Stats Group */
                    .stats-group {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid rgba(255, 255, 255, 0.2);
                    }

                    .stats-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #ffffff;
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
                        color: rgba(255, 255, 255, 0.9);
                    }

                    .stat-value {
                        color: #ffffff;
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

                    /* Quick Actions */
                    .quick-actions {
                        margin: 25px 0;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .action-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 12px 15px;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        text-align: center;
                        width: 100%;
                        border: none;
                        cursor: pointer;
                    }

                    .action-btn.primary {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                    }

                    .action-btn.primary:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                    }

                    .action-btn.outline {
                        background: transparent;
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                    }

                    .action-btn.outline:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }

                    /* Posts Grid Section */
                    .posts-grid-section {
                        border-radius: 15px;
                    }

                    .section-header {
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                    }

                    .post-header-content {
                        text-align: center;
                    }

                    .post-type-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #1b7a3a;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 14px;
                        font-weight: 600;
                        margin-bottom: 15px;
                    }

                    .section-title {
                        font-size: 32px;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin: 0 0 15px 0;
                        line-height: 1.3;
                    }

                    .post-meta {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        color: #666;
                        font-size: 14px;
                    }

                    .post-author {
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

                    .post-content {
                        color: #666;
                        line-height: 1.6;
                    }

                    .post-image-container {
                        margin-bottom: 25px;
                        text-align: center;
                    }

                    .post-image {
                        max-width: 100%;
                        border-radius: 12px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    .post-text-content {
                        font-size: 16px;
                    }

                    .post-description {
                        white-space: pre-line;
                        line-height: 1.8;
                    }

                    /* Attachments */
                    .attachments-section {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #f0f0f0;
                    }

                    .attachments-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .attachments-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 10px;
                    }

                    .attachment-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 12px 15px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        text-decoration: none;
                        color: #333;
                        border: 1px solid #e9ecef;
                        transition: all 0.3s ease;
                    }

                    .attachment-item:hover {
                        background: #e9ecef;
                        transform: translateY(-2px);
                    }

                    /* Action Buttons */
                    .action-buttons-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-bottom: 25px;
                    }

                    .action-buttons-grid .action-btn.primary {
                        background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                        color: white;
                        border: none;
                    }

                    .action-buttons-grid .action-btn.primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    .action-buttons-grid .action-btn.secondary {
                        background: white;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                    }

                    .action-buttons-grid .action-btn.secondary:hover {
                        background: #1b7a3a;
                        color: white;
                        transform: translateY(-2px);
                    }

                    .action-buttons-grid .action-btn.outline {
                        background: transparent;
                        color: #666;
                        border: 2px solid #e0e0e0;
                    }

                    .action-buttons-grid .action-btn.outline:hover {
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
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                        text-align: center;
                    }

                    .comments-title {
                        font-size: 24px;
                        font-weight: 600;
                        color: #333;
                        margin: 0 0 10px 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    }

                    .comments-subtitle {
                        color: #666;
                        margin: 0;
                        font-size: 14px;
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

                    /* Responsive Design */
                    @media (max-width: 1024px) {
                        .content-layout {
                            grid-template-columns: 1fr;
                            gap: 30px;
                        }

                        .filter-sidebar {
                            position: static;
                        }

                        .meta-grid,
                        .info-grid {
                            grid-template-columns: 1fr;
                        }
                    }

                    @media (max-width: 768px) {
                        .section-header {
                            text-align: center;
                        }

                        .post-meta {
                            flex-direction: column;
                            gap: 10px;
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

                        .content-section {
                            padding: 40px 0;
                        }

                        .filter-sidebar,
                        .posts-grid-section {
                            padding: 20px;
                        }

                        .content-display-card,
                        .additional-info-card,
                        .comments-section-card {
                            padding: 20px;
                        }

                        .comment-item.nested {
                            margin-left: 20px;
                            padding-left: 15px;
                        }

                        .section-title {
                            font-size: 24px;
                        }
                    }

                    @media (max-width: 480px) {
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

                        .attachments-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}
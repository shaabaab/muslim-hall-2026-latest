import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback, useMemo } from 'react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { Head } from '@inertiajs/react';
import Header from "./Header";
import Footer from "./Footer";
import axios from 'axios';

export default function ExhibitionDetail() {
    const { exhibition, auth, flash } = usePage().props;
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [reactionCounts, setReactionCounts] = useState({ like: 0, love: 0, dislike: 0 });
    const [userReaction, setUserReaction] = useState(null);
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

    // Debug exhibition data
    useEffect(() => {
        console.log('Exhibition data:', exhibition);
        console.log('Auth data:', auth);
    }, [exhibition, auth]);

    // URL generators
    const getImageUrl = useCallback((imagePath) => {
        if (!imagePath) return '/default-exhibition-image.jpg';
        return imagePath.startsWith('http') ? imagePath : `/storage/${imagePath}`;
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    // Format price with currency
    const formatPrice = useCallback((price, currency = 'USD') => {
        if (!price || price === 0) return 'Not for sale';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    }, []);

    // Get status badge
    const getStatusBadge = useCallback((status) => {
        const statusConfig = {
            published: { class: 'bg-success', text: 'Published' },
            draft: { class: 'bg-warning', text: 'Draft' },
            sold: { class: 'bg-danger', text: 'Sold' },
            archived: { class: 'bg-secondary', text: 'Archived' }
        };
        return statusConfig[status] || statusConfig.draft;
    }, []);

    // Get type badge
    const getTypeBadge = useCallback((type) => {
        const typeConfig = {
            product: { class: 'bg-primary', text: 'Product' },
            document: { class: 'bg-info', text: 'Document' },
            art: { class: 'bg-purple', text: 'Art' },
            photography: { class: 'bg-pink', text: 'Photography' },
            craft: { class: 'bg-orange', text: 'Craft' }
        };
        return typeConfig[type] || { class: 'bg-secondary', text: type || 'Unknown' };
    }, []);

    // SEO data
    const seoData = exhibition?.seo || {};

    // Memoized configuration
    const exhibitionTypeConfig = useMemo(() => ({
        product: {
            icon: 'fas fa-shopping-bag',
            label: 'Product',
            badgeColor: 'bg-primary'
        },
        document: {
            icon: 'fas fa-file-alt',
            label: 'Document',
            badgeColor: 'bg-info'
        },
        art: {
            icon: 'fas fa-palette',
            label: 'Art',
            badgeColor: 'bg-purple'
        },
        photography: {
            icon: 'fas fa-camera',
            label: 'Photography',
            badgeColor: 'bg-pink'
        },
        craft: {
            icon: 'fas fa-hands',
            label: 'Craft',
            badgeColor: 'bg-orange'
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

    // Safe function to handle gallery data
    const getGalleryImages = () => {
        if (!exhibition?.gallery) return [];
        
        try {
            if (Array.isArray(exhibition.gallery)) {
                return exhibition.gallery.filter(item => item && typeof item === 'string');
            }
            
            if (typeof exhibition.gallery === 'string') {
                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(exhibition.gallery);
                    if (Array.isArray(parsed)) {
                        return parsed.filter(item => item && typeof item === 'string');
                    }
                } catch (e) {
                    // If it's a string with comma separation
                    if (exhibition.gallery.includes(',')) {
                        return exhibition.gallery.split(',').map(item => item.trim()).filter(item => item);
                    }
                    // Single image string
                    return [exhibition.gallery];
                }
            }
        } catch (error) {
            console.warn('Failed to parse gallery data:', error);
        }
        
        return [];
    };

    const galleryImages = getGalleryImages();

    // Handle external link visit
    const handleVisitLink = () => {
        if (exhibition?.link) {
            const url = exhibition.link.startsWith('http') ? exhibition.link : `https://${exhibition.link}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Handle document download
    const handleDownloadDocument = () => {
        if (exhibition?.document_file) {
            const link = document.createElement('a');
            link.href = getImageUrl(exhibition.document_file);
            link.download = `${exhibition.title || 'exhibition'}-document.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(prev => ({ ...prev, initial: true }));

                if (exhibition?.comments) {
                    setComments(exhibition.comments);
                }

                await fetchReactions();
            } catch (error) {
                console.error('Error initializing data:', error);
                showToast('Failed to load exhibition data', 'error');
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };

        if (exhibition && exhibition.id) {
            initializeData();
        }
    }, [exhibition?.id]);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        }
        if (flash?.error) {
            showToast(flash.error, 'error');
        }
    }, [flash, showToast]);

    // Fetch reactions with better error handling
    const fetchReactions = async (retryCount = 0) => {
        const maxRetries = 2;

        if (!exhibition?.id) {
            console.warn('No exhibition ID available for fetching reactions');
            return;
        }

        setLoading(prev => ({ ...prev, reactions: true }));
        try {
            const response = await axios.get(`/exhibition/reactions/${exhibition.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            console.log('Reactions response:', response.data);

            if (response.data) {
                const data = response.data;
                const normalizedCounts = {
                    like: data.reaction_counts?.like || data.likes_count || data.like || 0,
                    love: data.reaction_counts?.love || data.loves_count || data.love || 0,
                    dislike: data.reaction_counts?.dislike || data.dislikes_count || data.dislike || 0
                };

                setReactionCounts(normalizedCounts);
                setUserReaction(data.user_reaction || null);
            }
        } catch (error) {
            console.error('Error fetching reactions:', error);
            
            // Fallback to exhibition data if available
            if (exhibition.likes_count !== undefined) {
                setReactionCounts({
                    like: exhibition.likes_count || 0,
                    love: exhibition.loves_count || 0,
                    dislike: exhibition.dislikes_count || 0
                });
            }

            if (retryCount < maxRetries) {
                setTimeout(() => fetchReactions(retryCount + 1), 1000 * (retryCount + 1));
            }
        } finally {
            setLoading(prev => ({ ...prev, reactions: false }));
        }
    };

    // Handle reaction with better validation
    const handleReaction = useCallback(async (type) => {
        if (!auth?.user) {
            showToast('Please login to react', 'error');
            return;
        }

        if (!exhibition?.id) {
            showToast('Exhibition not found', 'error');
            return;
        }

        if (loading.reactions) return;

        setLoading(prev => ({ ...prev, reactions: true }));

        try {
            const response = await axios.post('/exhibition/reactions/toggle', {
                exhibition_id: exhibition.id,
                type: type
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Reaction toggle response:', response.data);

            if (response.data && response.data.success) {
                setReactionCounts(prev => ({
                    ...prev,
                    ...response.data.reaction_counts
                }));
                setUserReaction(response.data.user_reaction);
                showToast(response.data.message || 'Reaction updated', 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to update reaction');
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            
            // Handle 422 validation errors
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const errorMessage = Object.values(validationErrors).flat().join(', ');
                showToast(`Validation error: ${errorMessage}`, 'error');
            } else {
                const message = error.response?.data?.message || error.message || 'Failed to update reaction';
                showToast(message, 'error');
            }
            
            // Refresh reactions to ensure consistency
            await fetchReactions();
        } finally {
            setLoading(prev => ({ ...prev, reactions: false }));
        }
    }, [auth?.user, exhibition?.id, loading.reactions, showToast]);

    // Handle comment submission with validation
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!commentText.trim()) {
            showToast('Please enter a comment', 'error');
            return;
        }

        if (!auth?.user) {
            showToast('Please login to comment', 'error');
            return;
        }

        if (!exhibition?.id) {
            showToast('Exhibition not found', 'error');
            return;
        }

        setLoading(prev => ({ ...prev, comment: true }));
        const tempId = `temp-${Date.now()}`;
        const tempComment = {
            id: tempId,
            comment: commentText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            replies: [],
            is_temp: true
        };

        setComments(prev => [tempComment, ...prev]);
        setCommentText('');

        try {
            const response = await axios.post('/exhibition/comments', {
                exhibition_id: exhibition.id,
                comment: commentText.trim()
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Comment response:', response.data);

            if (response.data && response.data.success) {
                setComments(prev => prev.map(comment =>
                    comment.id === tempId ? response.data.comment : comment
                ));
                showToast(response.data.message || 'Comment added successfully', 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            
            // Remove temp comment on error
            setComments(prev => prev.filter(comment => comment.id !== tempId));
            
            // Handle 422 validation errors
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const errorMessage = Object.values(validationErrors).flat().join(', ');
                showToast(`Validation error: ${errorMessage}`, 'error');
            } else {
                const message = error.response?.data?.message || error.message || 'Failed to add comment';
                showToast(message, 'error');
            }
        } finally {
            setLoading(prev => ({ ...prev, comment: false }));
        }
    };

    // Handle reply submission with validation
    const handleReplySubmit = async (e, parentId) => {
        e.preventDefault();
        
        if (!replyText.trim()) {
            showToast('Please enter a reply', 'error');
            return;
        }

        if (!auth?.user) {
            showToast('Please login to reply', 'error');
            return;
        }

        if (!exhibition?.id) {
            showToast('Exhibition not found', 'error');
            return;
        }

        setLoading(prev => ({ ...prev, reply: true }));
        const tempId = `temp-reply-${Date.now()}`;
        const tempReply = {
            id: tempId,
            comment: replyText.trim(),
            user: auth.user,
            user_id: auth.user.id,
            created_at: new Date().toISOString(),
            is_temp: true
        };

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
            const response = await axios.post('/exhibition/comments', {
                exhibition_id: exhibition.id,
                comment: replyText.trim(),
                parent_id: parentId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Reply response:', response.data);

            if (response.data && response.data.success) {
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
                showToast(response.data.message || 'Reply added successfully', 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to add reply');
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
            
            // Handle 422 validation errors
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const errorMessage = Object.values(validationErrors).flat().join(', ');
                showToast(`Validation error: ${errorMessage}`, 'error');
            } else {
                const message = error.response?.data?.message || error.message || 'Failed to add reply';
                showToast(message, 'error');
            }
        } finally {
            setLoading(prev => ({ ...prev, reply: false }));
        }
    };

    // Handle comment update
    const handleCommentUpdate = async (commentId) => {
        if (!editText.trim()) {
            showToast('Please enter comment text', 'error');
            return;
        }

        setLoading(prev => ({ ...prev, update: true }));
        const updatedComments = updateCommentInTree(comments, commentId, editText.trim());
        setComments(updatedComments);

        try {
            const response = await axios.put(`/exhibition/comments/${commentId}`, {
                comment: editText.trim()
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                showToast(response.data.message || 'Comment updated successfully', 'success');
                setEditingComment(null);
                setEditText('');
            } else {
                throw new Error(response.data?.message || 'Failed to update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            
            // Revert optimistic update
            if (exhibition.comments) {
                setComments(exhibition.comments);
            }
            
            // Handle 422 validation errors
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const errorMessage = Object.values(validationErrors).flat().join(', ');
                showToast(`Validation error: ${errorMessage}`, 'error');
            } else {
                const message = error.response?.data?.message || error.message || 'Failed to update comment';
                showToast(message, 'error');
            }
        } finally {
            setLoading(prev => ({ ...prev, update: false }));
        }
    };

    // Helper function to update comment in tree
    const updateCommentInTree = (comments, commentId, newText) => {
        return comments.map(comment => {
            if (comment.id === commentId) {
                return { ...comment, comment: newText };
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
    const handleCommentDelete = async (commentId) => {
        if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) return;

        setLoading(prev => ({ ...prev, delete: true }));
        const filteredComments = filterCommentFromTree(comments, commentId);
        setComments(filteredComments);

        try {
            const response = await axios.delete(`/exhibition/comments/${commentId}`);

            if (response.data && response.data.success) {
                showToast(response.data.message || 'Comment deleted successfully', 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            
            // Revert optimistic update
            if (exhibition.comments) {
                setComments(exhibition.comments);
            }
            
            const message = error.response?.data?.message || error.message || 'Failed to delete comment';
            showToast(message, 'error');
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
    const toggleCommentExpansion = (commentId) => {
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

    // Reaction button component
    const ReactionButton = ({ type, label, count }) => {
        const config = reactionTypes[type];
        const isActive = userReaction?.type === type;

        return (
            <button
                onClick={() => handleReaction(type)}
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
        const canModify = auth?.user && (auth.user.id === comment.user_id || auth.user.is_admin);
        const hasReplies = comment.replies && comment.replies.length > 0;
        const isTemp = comment.is_temp;

        return (
            <div className={`comment-item ${level > 0 ? 'nested' : ''} ${isTemp ? 'temp' : ''}`}>
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
                                    onClick={() => {
                                        setEditingComment(comment.id);
                                        setEditText(comment.comment);
                                    }}
                                    disabled={loading.update}
                                    className="edit-btn"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleCommentDelete(comment.id)}
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
                                >
                                    {loading.update ? 'Updating...' : 'Update'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditText('');
                                    }}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="comment-text">{comment.comment}</div>
                    )}

                    {/* Comment Actions */}
                    {level === 0 && auth?.user && !isTemp && (
                        <div className="comment-footer">
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="reply-btn"
                            >
                                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                            </button>

                            {hasReplies && (
                                <button
                                    onClick={() => toggleCommentExpansion(comment.id)}
                                    className="toggle-replies-btn"
                                >
                                    {isExpanded ? 'Hide' : 'Show'} Replies ({comment.replies.length})
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                        <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="reply-form">
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
                                    onClick={() => {
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

    if (!exhibition) {
        return (
            <FrontAuthenticatedLayout>
                <div className="theme-dark-active">
                    <Header />
                    <div className="text-white text-center p-5">Exhibition not found</div>
                    <Footer />
                </div>
            </FrontAuthenticatedLayout>
        );
    }

    const statusBadge = getStatusBadge(exhibition.status);
    const typeBadge = getTypeBadge(exhibition.type);
    const typeConfig = exhibitionTypeConfig[exhibition.type] || exhibitionTypeConfig.product;

    return (
        <>
            <Head>
                <title>{exhibition.title || 'Exhibition'}</title>
                <meta name="description" content={exhibition.description?.substring(0, 160) || 'Explore this exhibition'} />
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
                                {/* Content Info Sidebar */}
                                <div className="filter-sidebar">
                                    <div className="filter-header">
                                        <h3 className="filter-title">
                                            <i className="fas fa-info-circle"></i>
                                            Exhibition Info
                                        </h3>
                                    </div>

                                    {/* Exhibition Image */}
                                    <div className="content-thumbnail-container">
                                        <img
                                            src={getImageUrl(exhibition.image)}
                                            alt={exhibition.title}
                                            className="content-thumbnail"
                                            onError={(e) => {
                                                e.target.src = '/default-exhibition-image.jpg';
                                            }}
                                        />
                                    </div>

                                    {/* Exhibition Stats */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-chart-bar"></i>
                                            Exhibition Details
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">Type:</span>
                                                <span className="stat-value">
                                                    <i className={typeConfig.icon}></i>
                                                    {typeConfig.label}
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Status:</span>
                                                <span className="stat-value">
                                                    <span className={`badge ${statusBadge.class}`}>
                                                        {statusBadge.text}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Price:</span>
                                                <span className="stat-value">{formatPrice(exhibition.price, exhibition.currency)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Views:</span>
                                                <span className="stat-value">{exhibition.views || 0}</span>
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

                                    {/* Exhibition Info */}
                                    <div className="stats-group">
                                        <h4 className="stats-title">
                                            <i className="fas fa-calendar"></i>
                                            Exhibition Info
                                        </h4>
                                        <div className="stats-list">
                                            <div className="stat-item">
                                                <span className="stat-label">Created:</span>
                                                <span className="stat-value">{formatDate(exhibition.created_at)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Updated:</span>
                                                <span className="stat-value">{formatDate(exhibition.updated_at)}</span>
                                            </div>
                                            {exhibition.dimensions && (
                                                <div className="stat-item">
                                                    <span className="stat-label">Dimensions:</span>
                                                    <span className="stat-value">{exhibition.dimensions}</span>
                                                </div>
                                            )}
                                            {exhibition.material && (
                                                <div className="stat-item">
                                                    <span className="stat-label">Material:</span>
                                                    <span className="stat-value">{exhibition.material}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Options */}
                                    <div className="download-options">
                                        {exhibition.link && (
                                            <button
                                                onClick={handleVisitLink}
                                                className="download-btn primary"
                                            >
                                                <i className="fas fa-external-link-alt"></i>
                                                Visit Website
                                            </button>
                                        )}
                                        {exhibition.document_file && (
                                            <button
                                                onClick={handleDownloadDocument}
                                                className="download-btn secondary"
                                            >
                                                <i className="fas fa-download"></i>
                                                Download Document
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Exhibition Details Main Content */}
                                <div className="posts-grid-section">
                                    <div className="section-header">
                                        <h2 className="section-title">{exhibition.title || 'Untitled Exhibition'}</h2>
                                        <div className="posts-count">
                                            {typeConfig.label} • {exhibition.is_available ? 'Available' : 'Not Available'}
                                        </div>
                                    </div>

                                    {/* Exhibition Meta */}
                                    <div className="content-meta-card">
                                        <div className="meta-grid">
                                            <div className="meta-item">
                                                <span className="meta-label">Type</span>
                                                <span className="meta-value">
                                                    <i className={typeConfig.icon}></i> {typeConfig.label}
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Status</span>
                                                <span className="meta-value">
                                                    <span className={`badge ${statusBadge.class}`}>
                                                        {statusBadge.text}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Price</span>
                                                <span className="meta-value">{formatPrice(exhibition.price, exhibition.currency)}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Availability</span>
                                                <span className="meta-value">
                                                    {exhibition.is_available ? (
                                                        <span className="badge bg-success">Available</span>
                                                    ) : (
                                                        <span className="badge bg-danger">Not Available</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exhibition Description */}
                                    <div className="content-display-card">
                                        <div className="article-content">
                                            <h4 className="content-title">
                                                <i className="fas fa-align-left"></i>
                                                Description
                                            </h4>
                                            <p className="content-text">{exhibition.description || 'No description available.'}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="action-buttons-grid">
                                        {exhibition.link && (
                                            <button
                                                onClick={handleVisitLink}
                                                className="action-btn primary"
                                            >
                                                <i className="fas fa-external-link-alt"></i>
                                                Visit Website
                                            </button>
                                        )}
                                        {exhibition.document_file && (
                                            <button
                                                onClick={handleDownloadDocument}
                                                className="action-btn secondary"
                                            >
                                                <i className="fas fa-download"></i>
                                                Download Document
                                            </button>
                                        )}
                                        <button
                                            onClick={() => document.getElementById('comments-section').scrollIntoView({ behavior: 'smooth' })}
                                            className="action-btn outline"
                                        >
                                            <i className="fas fa-comments"></i>
                                            View Comments ({comments.length})
                                        </button>
                                    </div>

                                    {/* Gallery Section */}
                                    {galleryImages.length > 0 && (
                                        <div className="additional-info-card">
                                            <h3 className="info-title">
                                                <i className="fas fa-images"></i>
                                                Gallery Images
                                            </h3>
                                            <div className="gallery-grid">
                                                {galleryImages.map((galleryImage, index) => (
                                                    <div key={index} className="gallery-item">
                                                        <img
                                                            src={getImageUrl(galleryImage)}
                                                            alt={`Gallery ${index + 1}`}
                                                            className="gallery-image"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        <div className="gallery-overlay">
                                                            <span className="gallery-count">{index + 1}/{galleryImages.length}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Additional Information */}
                                    <div className="additional-info-card">
                                        <h3 className="info-title">
                                            <i className="fas fa-info-circle"></i>
                                            Additional Information
                                        </h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Creation Date</span>
                                                <span className="info-value">{formatDate(exhibition.created_at)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Last Updated</span>
                                                <span className="info-value">{formatDate(exhibition.updated_at)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Total Views</span>
                                                <span className="info-value">{exhibition.views || 0}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Exhibition Type</span>
                                                <span className="info-value">{typeConfig.label}</span>
                                            </div>
                                            {exhibition.dimensions && (
                                                <div className="info-item">
                                                    <span className="info-label">Dimensions</span>
                                                    <span className="info-value">{exhibition.dimensions}</span>
                                                </div>
                                            )}
                                            {exhibition.material && (
                                                <div className="info-item">
                                                    <span className="info-label">Material</span>
                                                    <span className="info-value">{exhibition.material}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="comments-section-card" id="comments-section">
                                        <div className="comments-header">
                                            <h3 className="comments-title">
                                                <i className="fas fa-comments"></i>
                                                Comments ({comments.length})
                                            </h3>
                                        </div>

                                        {/* Comment Form */}
                                        {auth?.user ? (
                                            <form onSubmit={handleCommentSubmit} className="comment-form">
                                                <textarea
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Share your thoughts about this exhibition..."
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
                                                    Please <Link href="/login" className="login-link">login</Link> to leave a comment.
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
                                                    <p>No comments yet. Be the first to share your thoughts!</p>
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

                {/* ... (keep the same CSS styles as before) ... */}
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
                        // max-width: 1200px;
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
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
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
                        border: none;
                        cursor: pointer;
                    }

                    .download-btn.primary {
                        background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                        color: white;
                    }

                    .download-btn.primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    .download-btn.secondary {
                        background: white;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                    }

                    .download-btn.secondary:hover {
                        background: #1b7a3a;
                        color: white;
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
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                        display: flex;
                        align-items: center;
                        gap: 5px;
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

                    .content-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .content-text {
                        color: #666;
                        line-height: 1.6;
                        margin: 0;
                    }

                    /* Action Buttons */
                    .action-buttons-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
                        background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
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

                    /* Gallery Section */
                    .gallery-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }

                    .gallery-item {
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                        aspect-ratio: 1;
                    }

                    .gallery-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.3s ease;
                    }

                    .gallery-item:hover .gallery-image {
                        transform: scale(1.05);
                    }

                    .gallery-overlay {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px 0 0 0;
                        font-size: 12px;
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

                    /* Badge Styles */
                    .badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                    }

                    .bg-success { background-color: #28a745 !important; }
                    .bg-warning { background-color: #ffc107 !important; color: #000; }
                    .bg-danger { background-color: #dc3545 !important; }
                    .bg-secondary { background-color: #6c757d !important; }
                    .bg-primary { background-color: #007bff !important; }
                    .bg-info { background-color: #17a2b8 !important; }
                    .bg-purple { background-color: #6f42c1 !important; }
                    .bg-pink { background-color: #e83e8c !important; }
                    .bg-orange { background-color: #fd7e14 !important; }

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

                        .gallery-grid {
                            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}
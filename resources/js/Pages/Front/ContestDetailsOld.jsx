import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback, useMemo } from 'react';
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { 
    Row,
    Col,
} from 'antd';

export default function ContestDetails() {
    const { contests, auth, flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedContest, setSelectedContest] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState({
        review: false,
        entry: false,
        initial: true
    });
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Select first contest by default
    useEffect(() => {
        if (contests && contests.length > 0) {
            setSelectedContest(contests[0]);
        }
        setLoading(prev => ({ ...prev, initial: false }));
    }, [contests]);

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        }
        if (flash?.error) {
            showToast(flash.error, 'error');
        }
    }, [flash]);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    // Format time remaining
    const getTimeRemaining = useCallback((endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    }, []);

    // Calculate progress percentage
    const getProgressPercentage = useCallback((contest) => {
        const start = new Date(contest.start_date);
        const end = new Date(contest.end_date);
        const now = new Date();

        const total = end - start;
        const elapsed = now - start;

        return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    }, []);

    // Handle review submission
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim() || !rating || !auth?.user) return;

        setLoading(prev => ({ ...prev, review: true }));

        try {
            const response = await axios.post('/user/contest/reviews', {
                contest_id: selectedContest.id,
                review: reviewText.trim(),
                rating: rating
            });

            if (response.data && response.data.success) {
                setReviewText('');
                setRating(0);
                showToast('Review submitted successfully!', 'success');
                if (response.data.contest) {
                    setSelectedContest(response.data.contest);
                }
                    window.location.reload();


            } else {
                throw new Error(response.data?.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            const message = error.response?.data?.error || error.message || 'Failed to submit review';
            showToast(message, 'error');
        } finally {
            setLoading(prev => ({ ...prev, review: false }));
        }
    };

    // Handle entry submission
    const handleEntrySubmit = async (contestId) => {
        if (!auth?.user) {
            showToast('Please login to enter contest', 'error');
            return;
        }

        setLoading(prev => ({ ...prev, entry: true }));

        try {
            const response = await axios.post('/user/contest/entries', {
                contest_id: contestId
            });

            if (response.data && response.data.success) {
                showToast('Entry successful! Go to the dashboard to complete your contest details.', 'success');
                if (response.data.contest) {
                    setSelectedContest(response.data.contest);
                    window.location.reload();
                }
            } else {
                throw new Error(response.data?.message || 'Failed to enter contest');
            }
        } catch (error) {
            console.error('Error entering contest:', error);
            const message = error.response?.data?.error || error.message || 'Failed to enter contest';
            showToast(message, 'error');
        } finally {
            setLoading(prev => ({ ...prev, entry: false }));
        }
    };

    // Star rating component
    const StarRating = ({ rating, onRatingChange, readonly = false }) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => !readonly && onRatingChange(star)}
                        disabled={readonly}
                        className={`star-btn ${readonly ? 'readonly' : ''}`}
                    >
                        <i className={`fas ${star <= rating ? 'fa-star text-warning' : 'fa-star text-gray-400'}`}></i>
                    </button>
                ))}
            </div>
        );
    };

    // Contest card component
    const ContestCard = ({ contest, isActive, onClick }) => {
        const progress = getProgressPercentage(contest);
        const timeRemaining = getTimeRemaining(contest.end_date);
        const totalEntries = contest.entries?.length || 0;
        const totalReviews = contest.reviews?.length || 0;
        const averageRating = contest.reviews?.length > 0
            ? (contest.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / contest.reviews.length).toFixed(1)
            : 0;

        return (
            <div
                className={`contest-card ${isActive ? 'active' : ''}`}
                onClick={onClick}
            >
                <div className="contest-card-inner">
                    <div className="contest-card-header">
                        <div className="contest-category">
                            {contest.category || 'General'}
                        </div>
                        <div className="contest-rating">
                            <i className="fas fa-star"></i>
                            {averageRating}
                        </div>
                    </div>

                    <h4 className="contest-title">{contest.title}</h4>

                    <div className="contest-meta">
                        <div className="contest-entries">
                            <i className="fas fa-users"></i>
                            {totalEntries} entries
                        </div>
                        <div className={`contest-time ${timeRemaining === 'Ended' ? 'ended' : ''}`}>
                            {timeRemaining}
                        </div>
                    </div>

                    <div className="progress-container">
                        <div className="progress-info">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="contest-prize">
                        <div className="prize-amount">
                            {contest.prizes?.[0]?.amount || 'Cash Prize'}
                        </div>
                        <div className="prize-label">Top Prize</div>
                    </div>
                </div>
            </div>
        );
    };

    if (!contests || contests.length === 0) {
        return (
            <>
                <Head>
                    <title>Active Contests - Muslim Hall</title>
                    <meta name="description" content="Participate in exciting contests and win amazing prizes" />
                </Head>

                <FrontAuthenticatedLayout>
                    <Header />
                    <div className="no-contests-section" style={{  marginTop : "20px", textAlign: 'center', padding: '60px 0' }}>
                        <div className="container-md">
                            <div className="no-contests-content">
                                <i style={{ fontSize: '100px', color: '#2E7B48' }} className="fas fa-trophy"></i>
                                <h1 style={{ color: '#2E7B48', fontFamily: 'Arial, sans-serif', paddingTop: '20px' }}>No Active Contests</h1>
                                <p style={{ color: '#555', fontFamily: 'Arial, sans-serif' }}>There are currently no running contests. Check back later!</p>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </FrontAuthenticatedLayout>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Active Contests - Muslim Hall</title>
                <meta name="description" content="Participate in exciting contests and win amazing prizes" />
            </Head>

            <FrontAuthenticatedLayout>
                <Header />

                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* Hero Section */}
                {/* <section className="container-md">
                    <div className="hero-section">
                        <div className="hero-content">
                            <h1 className="hero-title">Active Contests</h1>
                            <p className="hero-text">
                                Participate in exciting competitions and showcase your skills.
                                Win amazing prizes and get recognized in our community.
                            </p>
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <div className="stat-number">{contests.length}</div>
                                    <div className="stat-label">Active Contests</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {contests.reduce((sum, contest) => sum + (contest.entries?.length || 0), 0)}
                                    </div>
                                    <div className="stat-label">Total Entries</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">
                                        {contests.reduce((sum, contest) => sum + (contest.prizes?.length || 0), 0)}
                                    </div>
                                    <div className="stat-label">Prizes Available</div>
                                </div>
                            </div>
                        </div>
                        <div className="hero-image">
                            <img
                                src="https://i.postimg.cc/FzWrL91K/download-3.png"
                                alt="Contest Celebration"
                            />
                        </div>
                    </div>
                </section> */}

                {/* Main Content */}
                <div className="content-section">
                    <div className="container-md">

                            <Row>
                                <div className="sidebar-header">
                                    <h3>Active Contests</h3>
                                    <p>Select a contest to view details and participate</p>

                                    <div className="hero-stats">
                                        <div className="stat-item">
                                            <div className="stat-number">{contests.length}</div>
                                            <div className="stat-label">Active Contests</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">
                                                {contests.reduce((sum, contest) => sum + (contest.entries?.length || 0), 0)}
                                            </div>
                                            <div className="stat-label">Total Entries</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-number">
                                                {contests.reduce((sum, contest) => sum + (contest.prizes?.length || 0), 0)}
                                            </div>
                                            <div className="stat-label">Prizes Available</div>
                                        </div>
                                    </div>
                                </div>
                            </Row>


                            <div className="contests-sidebar">
                                <Row gutter={[24, 24]}>
                                    {contests.map((contest) => (
                                        <Col key={contest.id} md={8} sm={24} xs={24}>
                                            <ContestCard
                                                contest={contest}
                                                isActive={selectedContest?.id === contest.id}
                                                onClick={() => setSelectedContest(contest)}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </div>


                        <div className="contests-layout">
                            {/* Main Content - Contest Details */}
                            <div className="contest-details-main">
                                {selectedContest && (
                                    <div className="contest-details">
                                        {/* Contest Header */}
                                        <div className="contest-header">
                                            <div className="contest-header-content">
                                                <div className="contest-badges">
                                                    <span className="contest-category-badge">
                                                        {selectedContest.category || 'General'}
                                                    </span>
                                                    <span className="contest-rating-badge">
                                                        <i className="fas fa-star"></i>
                                                        {selectedContest.reviews?.length > 0
                                                            ? (selectedContest.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / selectedContest.reviews.length).toFixed(1)
                                                            : 'New'
                                                        }
                                                    </span>
                                                </div>
                                                <h1>{selectedContest.title}</h1>
                                                <p className="contest-creator">
                                                    by {selectedContest.creator?.name || 'Unknown Creator'}
                                                </p>
                                            </div>
                                            <div className="contest-prize-display">
                                                <div className="grand-prize">
                                                    {selectedContest.prizes?.[0]?.amount || 'Cash Prize'}
                                                </div>
                                                <div className="prize-label">Grand Prize</div>
                                            </div>
                                        </div>

                                        {/* Contest Stats */}
                                        <div className="contest-stats">
                                            <div className="stat-card">
                                                <div className="stat-number">{selectedContest.entries?.length || 0}</div>
                                                <div className="stat-label">
                                                    <i className="fas fa-users"></i>
                                                    Entries
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-number">{selectedContest.reviews?.length || 0}</div>
                                                <div className="stat-label">
                                                    <i className="fas fa-comment"></i>
                                                    Reviews
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-number time-remaining">
                                                    {getTimeRemaining(selectedContest.end_date)}
                                                </div>
                                                <div className="stat-label">
                                                    <i className="fas fa-clock"></i>
                                                    Time Left
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-number">{selectedContest.prizes?.length || 0}</div>
                                                <div className="stat-label">
                                                    <i className="fas fa-trophy"></i>
                                                    Prizes
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="contest-progress">
                                            <div className="progress-info">
                                                <span>Contest Progress</span>
                                                <span>{formatDate(selectedContest.start_date)} - {formatDate(selectedContest.end_date)}</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${getProgressPercentage(selectedContest)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleEntrySubmit(selectedContest.id)}
                                                disabled={loading.entry}
                                                className="btn-primary"
                                            >
                                                {loading.entry ? (
                                                    <>
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                        Entering...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-plus-circle"></i>
                                                        Enter Contest
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('prizes')}
                                                className="btn-outline"
                                            >
                                                <i className="fas fa-trophy"></i>
                                                View Prizes
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('entries')}
                                                className="btn-outline"
                                            >
                                                <i className="fas fa-users"></i>
                                                View Entries ({selectedContest.entries?.length || 0})
                                            </button>
                                        </div>

                                        {/* Tabs Navigation */}
                                        <div className="tabs-navigation">
                                            <button
                                                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('overview')}
                                            >
                                                <i className="fas fa-info-circle"></i>
                                                Overview
                                            </button>
                                            <button
                                                className={`tab-btn ${activeTab === 'prizes' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('prizes')}
                                            >
                                                <i className="fas fa-trophy"></i>
                                                Prizes
                                            </button>
                                            <button
                                                className={`tab-btn ${activeTab === 'entries' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('entries')}
                                            >
                                                <i className="fas fa-users"></i>
                                                Entries
                                            </button>
                                            <button
                                                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('reviews')}
                                            >
                                                <i className="fas fa-comment"></i>
                                                Reviews
                                            </button>
                                        </div>

                                        {/* Tab Content */}
                                        <div className="tab-content">
                                            {/* Overview Tab */}
                                            {activeTab === 'overview' && (
                                                <div className="tab-pane active">
                                                    <div className="content-card">
                                                        <h3>Contest Description</h3>
                                                        <div className="contest-description"
                                                            dangerouslySetInnerHTML={{ __html: selectedContest.description }}
                                                        ></div>

                                                        {/* <p className="contest-description">
                                                            {selectedContest.description || 'No description available.'}
                                                        </p> */}

                                                        <div className="details-grid">
                                                            <div className="details-column">
                                                                <h4>Contest Details</h4>
                                                                <div className="details-list">
                                                                    <div className="detail-item">
                                                                        <span className="label">Start Date:</span>
                                                                        <span className="value">{formatDate(selectedContest.start_date)}</span>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span className="label">End Date:</span>
                                                                        <span className="value">{formatDate(selectedContest.end_date)}</span>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span className="label">Category:</span>
                                                                        <span className="value">{selectedContest.category || 'General'}</span>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <span className="label">Total Entries:</span>
                                                                        <span className="value">{selectedContest.entries?.length || 0}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="details-column">
                                                                <h4>Rules & Guidelines</h4>
                                                                <div className="rules-list">
                                                                    <div className="rule-item">
                                                                        <i className="fas fa-check-circle"></i>
                                                                        <span>Follow all contest guidelines</span>
                                                                    </div>
                                                                    <div className="rule-item">
                                                                        <i className="fas fa-check-circle"></i>
                                                                        <span>Submit before the deadline</span>
                                                                    </div>
                                                                    <div className="rule-item">
                                                                        <i className="fas fa-check-circle"></i>
                                                                        <span>Original work only</span>
                                                                    </div>
                                                                    <div className="rule-item">
                                                                        <i className="fas fa-check-circle"></i>
                                                                        <span>Respect community guidelines</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Prizes Tab */}
                                            {activeTab === 'prizes' && (
                                                <div className="tab-pane active">
                                                    <div className="content-card">
                                                        <h3>Contest Prizes</h3>
                                                        <div className="prizes-list">
                                                            {selectedContest.prizes?.map((prize, index) => (
                                                                <div key={index} className="prize-item">
                                                                    <div className="prize-content">
                                                                        <div className="prize-position">{prize.position}</div>
                                                                        <div className="prize-amount">
                                                                            Registered User: {prize.amount_normal_user} || Premium User: {prize.amount_premium_user}
                                                                        </div>
                                                                    </div>
                                                                    <div className="prize-icon">
                                                                        <i className="fas fa-trophy"></i>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Entries Tab */}
                                            {activeTab === 'entries' && (
                                                <div className="tab-pane active">
                                                    <div className="content-card">
                                                        <h3>Contest Entries ({selectedContest.entries?.length || 0})</h3>
                                                        {auth?.user ? (
                                                            <div className="entries-list">
                                                                {selectedContest.entries && selectedContest.entries.length > 0 ? (
                                                                    selectedContest.entries.slice(-5).map((entry, index) => (
                                                                        <div key={entry.id} className="entry-item">
                                                                            <div className="entry-rank">#{index + 1}</div>
                                                                            <div className="entry-info">
                                                                                <h5>{entry.user?.name || 'Anonymous'}</h5>
                                                                                <p>Submitted on {formatDate(entry.created_at)}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="no-entries">
                                                                        <i className="fas fa-users"></i>
                                                                        <p>No entries yet. Be the first to participate!</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="login-prompt">
                                                                <p>Please <Link href="/login">login</Link> to view entries.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reviews Tab */}
                                            {activeTab === 'reviews' && (
                                                <div className="tab-pane active">
                                                    <div className="content-card">
                                                        <h3>Contest Reviews ({selectedContest.reviews?.length || 0})</h3>

                                                        {/* Review Form */}
                                                        {auth?.user ? (
                                                            <div className="review-form">
                                                                <h4>Write a Review</h4>
                                                                <form onSubmit={handleReviewSubmit}>
                                                                    <div className="rating-section">
                                                                        <label>Your Rating</label>
                                                                        <StarRating
                                                                            rating={rating}
                                                                            onRatingChange={setRating}
                                                                        />
                                                                    </div>
                                                                    <div className="review-textarea">
                                                                        <textarea
                                                                            value={reviewText}
                                                                            onChange={(e) => setReviewText(e.target.value)}
                                                                            placeholder="Share your experience with this contest..."
                                                                            rows="4"
                                                                            required
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="submit"
                                                                        disabled={loading.review || !reviewText.trim() || !rating}
                                                                        className="btn-primary"
                                                                    >
                                                                        {loading.review ? (
                                                                            <>
                                                                                <i className="fas fa-spinner fa-spin"></i>
                                                                                Submitting...
                                                                            </>
                                                                        ) : (
                                                                            'Submit Review'
                                                                        )}
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        ) : (
                                                            <div className="login-prompt">
                                                                <p>Please <Link href="/login">login</Link> to write a review.</p>
                                                            </div>
                                                        )}

                                                        {/* Reviews List */}
                                                        <div className="reviews-list">
                                                            {selectedContest.reviews && selectedContest.reviews.length > 0 ? (
                                                                selectedContest.reviews.slice(-5).map((review) => (
                                                                    <div key={review.id} className="review-item">
                                                                        <div className="review-header">
                                                                            <div className="reviewer-info">
                                                                                <h5>{review.reviewer?.name || 'Anonymous'}</h5>
                                                                                <p>{formatDate(review.created_at)}</p>
                                                                            </div>
                                                                            <StarRating rating={review.rating} readonly={true} />
                                                                        </div>
                                                                        <p className="review-content">{review.comments}</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="no-reviews">
                                                                    <i className="fas fa-comment"></i>
                                                                    <p>No reviews yet. Be the first to share your thoughts!</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />

                <style jsx>{`
                    /* Hero Section */
                    .hero-section {
                        border-radius: 20px;
                        padding: 4rem 2rem;
                        // margin: 2rem auto;
                        max-width: 100%;
                        color: white;
                        min-height: 400px;
                        display: flex;
                        align-items: center;
                        background: linear-gradient(135deg, rgba(20, 108, 32, 0.9) 0%, rgba(46, 139, 87, 0.9) 100%),
                            url('https://i.postimg.cc/wx0LVLsG/footer-decor-full.png');
                        background-size: cover;
                        background-position: center;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }

                    .hero-content {
                        flex: 1;
                        padding-right: 2rem;
                    }

                    .hero-title {
                        font-size: 45px;
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

                    .hero-stats {
                        display: flex;
                        justify-content: center;
                        gap: 2rem;
                        text-align: center;
                        width:100%;
                    }

                    .stat-item {
                        text-align: center;
                    }

                    .stat-number {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #509765ff;
                        margin-bottom: 0.5rem;
                    }

                    .stat-label {
                        color: #2b7541ff;
                        font-size: 0.9rem;
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
                        // border: 1px solid gold;
                        // box-shadow: 0px 0px 8px black;
                    }

                    /* Main Content */
                    .content-section {
                        padding: 40px 0;
                        background-color: #f9f9f9;
                    }

                    .contests-layout {
                        display: grid;
                        grid-template-columns: 100% 1fr;
                        gap: 2rem;
                        margin-top: 2rem;
                    }

                    /* Sidebar */
                    .contests-sidebar {
                        background: white;
                        border-radius: 15px;
                        padding: 1.5rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                        display : flex;
                        flex-direction: column;
                    }

                    .sidebar-header {
                        margin-bottom: 1.5rem;
                        text-align: center;
                        width: 100%;
                    }

                    .sidebar-header h3 {
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                        font-size: 2.5rem;
                        font-weight : 700;
                    }

                    .sidebar-header p {
                        color: #666;
                        font-size: 1.1rem;
                    }

                    /* Contest Card */
                    .contest-card {
                        background: white;
                        border: 2px solid #e0e0e0;
                        border-radius: 12px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .contest-card:hover {
                        border-color: #1b7a3a;
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.1);
                    }

                    .contest-card.active {
                        border-color: #1b7a3a;
                        background: rgba(27, 122, 58, 0.05);
                    }

                    .contest-card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 0.75rem;
                    }

                    .contest-category {
                        background: #1b7a3a;
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    }

                    .contest-rating {
                        color: #ffc107;
                        font-weight: 600;
                    }

                    .contest-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 0.75rem;
                        line-height: 1.4;
                    }

                    .contest-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                        font-size: 0.85rem;
                        color: #666;
                    }

                    .progress-container {
                        margin-bottom: 1rem;
                    }

                    .progress-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 0.5rem;
                        font-size: 0.8rem;
                        color: #666;
                    }

                    .progress-bar {
                        background: #e0e0e0;
                        border-radius: 10px;
                        height: 6px;
                        overflow: hidden;
                    }

                    .progress-fill {
                        background: #1b7a3a;
                        height: 100%;
                        border-radius: 10px;
                        transition: width 0.3s ease;
                    }

                    .contest-prize {
                        text-align: center;
                    }

                    .prize-amount {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin-bottom: 0.25rem;
                    }

                    .prize-label {
                        font-size: 0.8rem;
                        color: #666;
                    }

                    /* Contest Details */
                    .contest-details-main {
                        background: white;
                        border-radius: 15px;
                        padding: 2rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    .contest-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 2rem;
                        padding-bottom: 1.5rem;
                        border-bottom: 1px solid #e0e0e0;
                    }

                    .contest-badges {
                        display: flex;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;
                    }

                    .contest-category-badge {
                        background: #1b7a3a;
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    }

                    .contest-rating-badge {
                        background: #ffc107;
                        color: white;
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    }

                    .contest-header h1 {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #333;
                        margin-bottom: 0.5rem;
                    }

                    .contest-creator {
                        color: #666;
                        font-size: 1rem;
                    }

                    .contest-prize-display {
                        text-align: right;
                    }

                    .grand-prize {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin-bottom: 0.25rem;
                    }

                    .contest-stats {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }

                    .stat-card {
                        background: #f8f9fa;
                        border-radius: 10px;
                        padding: 1rem;
                        text-align: center;
                    }

                    .stat-card .stat-number {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #333;
                        margin-bottom: 0.5rem;
                    }

                    .stat-card .stat-label {
                        color: #666;
                        font-size: 0.85rem;
                    }

                    .stat-card .stat-label i {
                        margin-right: 0.25rem;
                    }

                    .time-remaining {
                        color: #28a745 !important;
                    }

                    .time-remaining.ended {
                        color: #dc3545 !important;
                    }

                    .contest-progress {
                        margin-bottom: 2rem;
                    }

                    .contest-progress .progress-info {
                        font-size: 0.9rem;
                    }

                    .contest-progress .progress-bar {
                        height: 8px;
                    }

                    /* Action Buttons */
                    .action-buttons {
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 2rem;
                        flex-wrap: wrap;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    .btn-primary:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .btn-outline {
                        background: transparent;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .btn-outline:hover {
                        background: #1b7a3a;
                        color: white;
                    }

                    /* Tabs */
                    .tabs-navigation {
                        display: flex;
                        gap: 0.5rem;
                        margin-bottom: 2rem;
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 1rem;
                    }

                    .tab-btn {
                        background: transparent;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        color: #666;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .tab-btn.active {
                        background: #1b7a3a;
                        color: white;
                    }

                    .tab-btn:hover:not(.active) {
                        background: #f8f9fa;
                        color: #333;
                    }

                    /* Content Cards */
                    .content-card {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 2rem;
                    }

                    .content-card h3 {
                        color: #1b7a3a;
                        margin-bottom: 1.5rem;
                    }

                    .contest-description {
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 2rem;
                    }

                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                    }

                    .details-column h4 {
                        color: #333;
                        margin-bottom: 1rem;
                    }

                    .details-list {
                        background: white;
                        border-radius: 8px;
                        padding: 1rem;
                    }

                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid #e0e0e0;
                    }

                    .detail-item:last-child {
                        border-bottom: none;
                    }

                    .detail-item .label {
                        color: #666;
                    }

                    .detail-item .value {
                        color: #333;
                        font-weight: 600;
                    }

                    .rules-list {
                        background: white;
                        border-radius: 8px;
                        padding: 1rem;
                    }

                    .rule-item {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 0;
                        color: #666;
                    }

                    .rule-item i {
                        color: #28a745;
                    }

                    /* Prizes */
                    .prizes-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .prize-item {
                        background: white;
                        border-radius: 10px;
                        padding: 1.5rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }

                    .prize-position {
                        font-size: 1.1rem;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                    }

                    .prize-amount {
                        color: #666;
                    }

                    .prize-icon i {
                        font-size: 2rem;
                        color: #ffc107;
                    }

                    /* Entries */
                    .entries-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .entry-item {
                        background: white;
                        border-radius: 10px;
                        padding: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }

                    .entry-rank {
                        background: #1b7a3a;
                        color: white;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                    }

                    .entry-info h5 {
                        margin-bottom: 0.25rem;
                        color: #333;
                    }

                    .entry-info p {
                        color: #666;
                        font-size: 0.85rem;
                        margin: 0;
                    }

                    /* Reviews */
                    .review-form {
                        background: white;
                        border-radius: 10px;
                        padding: 1.5rem;
                        margin-bottom: 2rem;
                    }

                    .review-form h4 {
                        color: #333;
                        margin-bottom: 1rem;
                    }

                    .rating-section {
                        margin-bottom: 1rem;
                    }

                    .rating-section label {
                        display: block;
                        color: #666;
                        margin-bottom: 0.5rem;
                    }

                    .star-rating {
                        display: flex;
                        gap: 0.25rem;
                    }

                    .star-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 1.2rem;
                    }

                    .star-btn.readonly {
                        cursor: default;
                    }

                    .review-textarea textarea {
                        width: 100%;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 1rem;
                        font-family: inherit;
                        resize: vertical;
                        margin-bottom: 1rem;
                    }

                    .review-textarea textarea:focus {
                        outline: none;
                        border-color: #1b7a3a;
                    }

                    .reviews-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .review-item {
                        background: white;
                        border-radius: 10px;
                        padding: 1.5rem;
                    }

                    .review-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1rem;
                    }

                    .reviewer-info h5 {
                        margin-bottom: 0.25rem;
                        color: #333;
                    }

                    .reviewer-info p {
                        color: #666;
                        font-size: 0.85rem;
                        margin: 0;
                    }

                    .review-content {
                        color: #666;
                        line-height: 1.6;
                        margin: 0;
                    }

                    /* Empty States */
                    .no-contests-section {
                        padding: 80px 0;
                        background-color: #f9f9f9;
                    }

                    .no-contests-content {
                        text-align: center;
                        padding: 4rem 2rem;
                    background: white;
                        border-radius: 15px;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    .no-contests-content i {
                        font-size: 4rem;
                        color: #ccc;
                        margin-bottom: 1rem;
                    }

                    .no-contests-content h2 {
                        color: #333;
                        margin-bottom: 1rem;
                    }

                    .no-contests-content p {
                        color: #666;
                    }

                    .no-entries, .no-reviews {
                        text-align: center;
                        padding: 3rem 2rem;
                        color: #666;
                    }

                    .no-entries i, .no-reviews i {
                        font-size: 3rem;
                        color: #ccc;
                        margin-bottom: 1rem;
                    }

                    .login-prompt {
                        text-align: center;
                        padding: 2rem;
                        background: #f8f9fa;
                        border-radius: 8px;
                        color: #666;
                    }

                    .login-prompt a {
                        color: #1b7a3a;
                        text-decoration: none;
                        font-weight: 600;
                    }

                    .login-prompt a:hover {
                        text-decoration: underline;
                    }

                    /* Toast Notification */
                    .toast-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 1rem 1.5rem;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }

                    .toast-notification.success {
                        background: #28a745;
                    }

                    .toast-notification.error {
                        background: #dc3545;
                    }

                    /* Responsive Design */
                    @media (max-width: 1200px) {
                        .contests-layout {
                            grid-template-columns: 300px 1fr;
                        }
                    }

                    @media (max-width: 992px) {
                        .contests-layout {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
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

                        .hero-stats {
                            justify-content: center;
                        }

                        .contest-stats {
                            grid-template-columns: repeat(2, 1fr);
                        }

                        .details-grid {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
                        }
                    }

                    @media (max-width: 768px) {
                        .content-section {
                            padding: 60px 0;
                        }

                        .contest-header {
                            flex-direction: column;
                            gap: 1rem;
                            text-align: center;
                        }

                        .contest-prize-display {
                            text-align: center;
                        }

                        .action-buttons {
                            flex-direction: column;
                        }

                        .tabs-navigation {
                            flex-wrap: wrap;
                        }

                        .tab-btn {
                            flex: 1;
                            min-width: 120px;
                            justify-content: center;
                        }
                    }

                    @media (max-width: 576px) {
                        .hero-section {
                            padding: 2rem 1rem;
                        margin: 1rem auto;
                        min-height: 300px;
                        }

                        .hero-title {
                            font-size: 2rem;
                        }

                        .hero-text {
                            font-size: 1rem;
                        }

                        .hero-stats {
                            flex-direction: column;
                            gap: 1rem;
                        }

                        .content-section {
                            padding: 40px 0;
                        }

                        .contest-details-main {
                            padding: 1.5rem;
                        }

                        .contest-stats {
                            grid-template-columns: 1fr;
                        }

                        .contest-header h1 {
                            font-size: 1.5rem;
                        }
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}
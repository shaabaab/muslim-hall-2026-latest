import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';

export default function endedcontestsection() {
    const { endedcontests, auth, flash } = usePage().props;
    const [latestContest, setLatestContest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [error, setError] = useState(null);

    // Safely get the latest contest with error handling
    useEffect(() => {
        try {
            if (endedcontests && Array.isArray(endedcontests) && endedcontests.length > 0) {
                const sortedendedcontests = [...endedcontests].sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setLatestContest(sortedendedcontests[0]);
                setError(null);
            } else {
                setLatestContest(null);
                setError('No endedcontests available');
            }
        } catch (err) {
            console.error('Error processing endedcontests:', err);
            setError('Failed to load endedcontests');
            setLatestContest(null);
        }
    }, [endedcontests]);

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

    // Format date with error handling
    const formatDate = useCallback((dateString) => {
        try {
            if (!dateString) return 'Date not set';
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (err) {
            return 'Invalid date';
        }
    }, []);

    // Format time remaining with error handling
    const getTimeRemaining = useCallback((endDate) => {
        try {
            if (!endDate) return 'Date not set';

            const now = new Date();
            const end = new Date(endDate);
            const diff = end - now;

            if (diff <= 0) return 'Ended';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
            if (hours > 0) return `${hours}h ${minutes}m left`;
            return `${minutes}m left`;
        } catch (err) {
            return 'Date error';
        }
    }, []);

    // Calculate progress percentage with error handling
    const getProgressPercentage = useCallback((contest) => {
        try {
            if (!contest?.start_date || !contest?.end_date) return 0;

            const start = new Date(contest.start_date);
            const end = new Date(contest.end_date);
            const now = new Date();

            const total = end - start;
            const elapsed = now - start;

            return Math.min(Math.max((elapsed / total) * 100, 0), 100);
        } catch (err) {
            return 0;
        }
    }, []);

    // Handle entry submission
    const handleEntrySubmit = async (contestId) => {
        if (!auth?.user) {
            showToast('Please login to enter contest', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/user/contest/entries', {
                contest_id: contestId
            });

            if (response.data && response.data.success) {
                showToast('Entry successful! Go to the dashboard to complete your contest details.', 'success');
                if (response.data.contest) {
                    setLatestContest(response.data.contest);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to enter contest');
            }
        } catch (error) {
            console.error('Error entering contest:', error);
            const message = error.response?.data?.error || error.message || 'Failed to enter contest';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Safe data access helpers
    const getContestPrizes = (contest) => {
        return contest?.prizes || [];
    };

    const getContestEntries = (contest) => {
        return contest?.entries || [];
    };

    const getContestReviews = (contest) => {
        return contest?.reviews || [];
    };

     const getAverageRating = (contest) => {
        const reviews = getContestReviews(contest) || [];

        if (!Array.isArray(reviews) || reviews.length === 0) return 0;

        const total = reviews.reduce((sum, review) => {
            return sum + (Number(review.rating) || 0);
        }, 0);

        return (total / reviews.length).toFixed(1);
    };

    // Loading state
    if (!endedcontests && !error) {
        return (
            <div className="loading-section">
                <div className="container-md">
                    <div className="loading-content">
                        <div className="loading-spinner">
                            <i className="fas fa-trophy fa-beat"></i>
                        </div>
                        <h2>Loading Contest...</h2>
                        <p>Preparing something amazing for you</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !latestContest) {
        return (
            <div className="error-section">
                <div className="container-md">
                    <div className="error-content">
                        <div className="error-icon">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2>Unable to Load Contest</h2>
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="retry-button"
                        >
                            <i className="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No endedcontests state
    if (!latestContest) {
        return (
            <div className="no-contest-section">
                <div className="container-md">
                    <div className="no-contest-content">
                        <div className="no-contest-icon">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <h1>No Active Contest</h1>
                        <p>There is currently no running contest. Check back later for new opportunities!</p>
                        <div className="coming-soon-badge">
                            <i className="fas fa-clock"></i>
                            Coming Soon
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main render with safe data access
    const progress = getProgressPercentage(latestContest);
    const timeRemaining = getTimeRemaining(latestContest.end_date);
    const totalEntries = getContestEntries(latestContest).length;
    const averageRating = getAverageRating(latestContest);
    const prizes = getContestPrizes(latestContest);
    const grandPrize = prizes[0]?.amount || 'Cash Prize';

    return (
        <>
            <Head title="Latest Contest - Muslim Hall" />

            {toast.show && (
                <div className={`toast-notification ${toast.type} show`}>
                    <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast({ show: false, message: '', type: '' })} className="toast-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            {/* Latest Contest Hero Section */}
            <section className="latest-contest-hero">
                <div className="container-md">
                    <div className="hero-content-wrapper">
                        <div className="contest-badge">
                            <span className="featured-badge">
                                <i className="fas fa-crown"></i>
                                Featured Contest
                            </span>
                            <span className="category-badge">
                                {latestContest?.category?.name ?? 'General'}
                            </span>

                            {latestContest.category?.parent && (
                                <span className="category-badge">
                                    {latestContest.category?.parent?.name || 'General'}
                                </span>
                            )}


                            <span className="time-badge">
                                <i className="fas fa-clock"></i>
                                {timeRemaining}
                            </span>
                        </div>

                        <div className="hero-main-content">
                            <div className="contest-info">
                                <h1 className="contest-title">{latestContest.title || 'Contest Title'}</h1>
                                <p
                                    className="contest-description"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            latestContest.description?.substring(0, 200) ||
                                            'Join our exciting contest and showcase your skills to win amazing prizes!',
                                    }}
                                ></p>


                                <div className="contest-meta-grid">
                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <i className="fas fa-trophy"></i>
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">
                                                {grandPrize}
                                            </div>
                                            <div className="meta-label">Grand Prize</div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">{totalEntries}+</div>
                                            <div className="meta-label">Participants</div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <i className="fas fa-star"></i>
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">{averageRating}</div>
                                            <div className="meta-label">Rating</div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <i className="fas fa-award"></i>
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">{prizes.length}</div>
                                            <div className="meta-label">Prizes</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="action-section">
                                    <button
                                        className="cta-button primary"
                                    >
                                        <Link href={`/contests-details/${latestContest.id}`} >
                                            View Details
                                        </Link>
                                    </button>
                                </div>

                            </div>

                            <div className="contest-visual">
                                <div className="progress-container">
                                    <div className="progress-header">
                                        <span>Contest Progress</span>
                                        <span className="progress-percent">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-dates">
                                        <span className="start-date">{formatDate(latestContest.start_date)}</span>
                                        <span className="end-date">{formatDate(latestContest.end_date)}</span>
                                    </div>
                                </div>

                                <div className="prize-highlight">
                                    <div className="prize-card">
                                        <div className="prize-icon">
                                            <i className="fas fa-gem"></i>
                                        </div>
                                        <div className="prize-content">
                                            <h4>Grand Prize</h4>
                                            <div className="prize-amount">
                                                {grandPrize}
                                            </div>
                                            <p>Plus amazing recognition in our community</p>
                                        </div>
                                        <div className="prize-glow"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contest Details Section */}
            {/* <section className="contest-details-section">
                <div className="container-md">
                    <div className="details-grid">
                        <div className="details-card">
                            <div className="card-header">
                                <h3>📝 Contest Overview</h3>
                                <div className="card-badge">Detailed Information</div>
                            </div>
                            <div
                                className="contest-full-description"
                                dangerouslySetInnerHTML={{
                                    __html: latestContest.description ||
                                        '<p>No description available for this contest.</p>'
                                }}
                            ></div>

                            <div className="rules-section">
                                <h4>🏆 Contest Rules & Guidelines</h4>
                                <ul className="rules-list">
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Follow all contest guidelines and requirements
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Submit your entry before the deadline
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Original work only - no plagiarism
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Respect community guidelines and values
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Multiple entries allowed unless specified
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        Judging based on creativity and quality
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="sidebar-card">
                            <div className="quick-info">
                                <h4>📋 Quick Info</h4>
                                <div className="info-list">
                                    <div className="info-item">
                                        <i className="fas fa-calendar"></i>
                                        <div className="info-content">
                                            <span className="info-label">Start Date</span>
                                            <span className="info-value">{formatDate(latestContest.start_date)}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-flag-checkered"></i>
                                        <div className="info-content">
                                            <span className="info-label">End Date</span>
                                            <span className="info-value">{formatDate(latestContest.end_date)}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-tags"></i>
                                        <div className="info-content">
                                            <span className="info-label">Category</span>
                                            <span className="info-value">{latestContest.category || 'General'}</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <i className="fas fa-user"></i>
                                        <div className="info-content">
                                            <span className="info-label">Organizer</span>
                                            <span className="info-value">{latestContest.creator?.name || 'Muslim Hall'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prizes-summary">
                                <h4>🏅 Prize Distribution</h4>
                                <div className="prizes-list">
                                    {prizes.slice(0, 3).map((prize, index) => (
                                        <div key={index} className="prize-summary-item">
                                            <div className={`prize-rank rank-${index + 1}`}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                            <div className="prize-details">
                                                <div className="prize-type regular">
                                                    <span>Regular: {prize.amount_normal_user || 'Prize'}</span>
                                                </div>
                                                <div className="prize-type premium">
                                                    <span>Premium: {prize.amount_premium_user || 'Prize'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {prizes.length === 0 && (
                                        <div className="no-prizes">
                                            <i className="fas fa-gift"></i>
                                            <span>Prizes to be announced</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="cta-card">
                                <div className="cta-content">
                                    <h4>🚀 Ready to Participate?</h4>
                                    <p>Join now and showcase your talent to the community!</p>
                                    <button
                                        onClick={() => handleEntrySubmit(latestContest.id)}
                                        disabled={loading}
                                        className="cta-button secondary"
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Entering...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-rocket"></i>
                                                Enter Contest Now
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            <style jsx>{`
                /* Loading States */
                .loading-section, .error-section, .no-contest-section {
                    padding: 120px 0;
                    text-align: center;
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                }

                .loading-content, .error-content, .no-contest-content {
                    background: white;
                    padding: 4rem 2rem;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    margin: 0 auto;
                    border: 1px solid #e8f5e8;
                }

                .loading-spinner {
                    font-size: 4rem;
                    color: #2E7B48;
                    margin-bottom: 1.5rem;
                }

                .error-icon, .no-contest-icon {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                }

                .error-icon {
                    color: #dc3545;
                }

                .no-contest-icon {
                    color: #ffc107;
                }

                .retry-button {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 1rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .retry-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(46, 139, 87, 0.3);
                }

                .coming-soon-badge {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                /* Toast Notifications */
                .toast-notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 10px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 1000;
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    max-width: 400px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                }

                .toast-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .toast-notification.success {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                }

                .toast-notification.error {
                    background: linear-gradient(135deg, #dc3545, #c82333);
                }

                .toast-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.25rem;
                    margin-left: auto;
                }

                /* Hero Section */
                .latest-contest-hero {
                    background: linear-gradient(135deg, 
                        rgba(27, 122, 58, 0.95) 0%, 
                        rgba(46, 139, 87, 0.9) 50%, 
                        rgba(20, 108, 32, 0.85) 100%),
                        url('https://i.postimg.cc/wx0LVLsG/footer-decor-full.png');
                    background-size: cover;
                    background-position: center;
                    color: white;
                    padding: 80px 0;
                    margin-top: 20px;
                    position: relative;
                    overflow: hidden;
                }

                .latest-contest-hero::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
                    animation: float 20s infinite linear;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-50px, -50px) rotate(360deg); }
                }

                .hero-content-wrapper {
                    position: relative;
                    z-index: 2;
                }

                .contest-badge {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .featured-badge, .category-badge, .time-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 25px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .featured-badge {
                    background: rgba(255, 215, 0, 0.2);
                    border: 1px solid rgba(255, 215, 0, 0.5);
                    backdrop-filter: blur(10px);
                }

                

                .time-badge {
                    background: rgba(220, 53, 69, 0.2);
                    border: 1px solid rgba(220, 53, 69, 0.5);
                    backdrop-filter: blur(10px);
                }

                .hero-main-content {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 4rem;
                    align-items: start;
                }

                .contest-title {
                    font-size: 3rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    line-height: 1.1;
                    background: linear-gradient(135deg, #ffffff, #e8f5e8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .contest-description {
                    font-size: 1.2rem;
                    line-height: 1.6;
                    margin-bottom: 2.5rem;
                    opacity: 0.9;
                    color : white !important;
                }

                .contest-meta-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }

                .meta-item-contest {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }

                .meta-item-contest:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.15);
                }

                .meta-icon {
                    font-size: 1.5rem;
                    opacity: 0.8;
                }

                .meta-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }

                .meta-label {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }

                .action-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .cta-button {
                    padding: 1rem 2rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    text-decoration: none;
                }

                .cta-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none !important;
                }

                .cta-button.primary {
                    background: linear-gradient(135deg, #ffd700, #ff6b00);
                    color: #1b7a3a;
                    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
                }

                .cta-button.primary:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
                }

                .cta-button.secondary {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                    box-shadow: 0 10px 30px rgba(27, 122, 58, 0.3);
                }

                .cta-button.secondary:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(27, 122, 58, 0.4);
                }

                .secondary-actions {
                    display: flex;
                    gap: 1rem;
                }

                .info-button, .share-button {
                    padding: 0.75rem 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    backdrop-filter: blur(10px);
                }

                .info-button:hover, .share-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                /* Contest Visual Section */
                .contest-visual {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .progress-container {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2rem;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }

                .progress-percent {
                    background: linear-gradient(135deg, #ffd700, #ff6b00);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: 800;
                }

                .progress-bar {
                    height: 12px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 1rem;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ffd700, #ff6b00);
                    border-radius: 10px;
                    transition: width 0.5s ease;
                    position: relative;
                    overflow: hidden;
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .progress-dates {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    opacity: 0.8;
                }

                .prize-highlight {
                    position: relative;
                }

                .prize-card {
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 107, 0, 0.1));
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    padding: 2rem;
                    border-radius: 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .prize-glow {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
                    animation: rotate 10s linear infinite;
                }

                @keyframes rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .prize-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(135deg, #ffd700, #ff6b00);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .prize-content h4 {
                    margin-bottom: 0.5rem;
                    font-size: 1.2rem;
                }

                .prize-amount {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #ffd700, #ff6b00);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Details Section */
                .contest-details-section {
                    padding: 80px 0;
                    background: #f8f9fa;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 3rem;
                }

                .details-card, .sidebar-card {
                    background: white;
                    border-radius: 20px;
                    padding: 2.5rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8f5e8;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .card-badge {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .contest-full-description {
                    line-height: 1.8;
                    color: #555;
                    margin-bottom: 2.5rem;
                }

                .contest-full-description :global(p) {
                    margin-bottom: 1.5rem;
                }

                .rules-section h4 {
                    margin-bottom: 1.5rem;
                    color: #1b7a3a;
                }

                .rules-list {
                    list-style: none;
                    padding: 0;
                }

                .rules-list li {
                    padding: 0.75rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid #f0f0f0;
                }

                .rules-list li:last-child {
                    border-bottom: none;
                }

                .rules-list li i {
                    color: #1b7a3a;
                    font-size: 0.9rem;
                }

                /* Sidebar Styles */
                .sidebar-card > * {
                    margin-bottom: 2.5rem;
                }

                .sidebar-card > *:last-child {
                    margin-bottom: 0;
                }

                .quick-info h4, .prizes-summary h4 {
                    margin-bottom: 1.5rem;
                    color: #1b7a3a;
                }

                .info-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .info-item:hover {
                    background: #e8f5e8;
                    transform: translateX(5px);
                }

                .info-item i {
                    color: #1b7a3a;
                    width: 20px;
                }

                .info-content {
                    display: flex;
                    flex-direction: column;
                }

                .info-label {
                    font-size: 0.8rem;
                    color: #666;
                }

                .info-value {
                    font-weight: 600;
                    color: #333;
                }

                .prizes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .prize-summary-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem;
                    background: #f8f9fa;
                    border-radius: 15px;
                    transition: all 0.3s ease;
                }

                .prize-summary-item:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                .prize-rank {
                    font-size: 1.5rem;
                    font-weight: 800;
                    min-width: 50px;
                    text-align: center;
                }

                .rank-1 { color: #ffd700; }
                .rank-2 { color: #c0c0c0; }
                .rank-3 { color: #cd7f32; }

                .prize-details {
                    flex: 1;
                }

                .prize-type {
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 0.25rem;
                }

                .prize-type.regular {
                    background: #e8f5e8;
                    color: #1b7a3a;
                }

                .prize-type.premium {
                    background: #fff3cd;
                    color: #856404;
                }

                .no-prizes {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 2rem;
                    background: #f8f9fa;
                    border-radius: 15px;
                    color: #666;
                    text-align: center;
                }

                .cta-card {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                    padding: 2.5rem;
                    border-radius: 20px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .cta-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                    animation: rotate 15s linear infinite;
                }

                .cta-content {
                    position: relative;
                    z-index: 2;
                }

                .cta-card h4 {
                    margin-bottom: 1rem;
                    font-size: 1.3rem;
                }

                .cta-card p {
                    margin-bottom: 1.5rem;
                    opacity: 0.9;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .hero-main-content {
                        grid-template-columns: 1fr;
                        gap: 3rem;
                    }

                    .details-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }

                    .contest-title {
                        font-size: 2.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .contest-meta-grid {
                        grid-template-columns: 1fr;
                    }

                    .hero-main-content {
                        gap: 2rem;
                    }

                    .contest-title {
                        font-size: 2rem;
                    }

                    .contest-description {
                        font-size: 1.1rem;
                    }

                    .secondary-actions {
                        flex-direction: column;
                    }

                    .details-card, .sidebar-card {
                        padding: 2rem;
                    }

                    .contest-badge {
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    .latest-contest-hero {
                        padding: 60px 0;
                    }

                    .contest-title {
                        font-size: 1.8rem;
                    }

                    .meta-item-contest {
                        padding: 1rem;
                    }

                    .meta-value {
                        font-size: 1.3rem;
                    }

                    .cta-button {
                        padding: 0.875rem 1.5rem;
                        font-size: 1rem;
                    }

                    .progress-container {
                        padding: 1.5rem;
                    }

                    .details-card, .sidebar-card {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </>
    );
}
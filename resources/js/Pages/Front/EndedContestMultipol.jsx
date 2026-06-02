import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

export default function EndedContestsSlider() {
    const { endedcontests, auth, flash } = usePage().props;
    const [endedContests, setEndedContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [activeIndex, setActiveIndex] = useState(0);

    // Initialize contests
    useEffect(() => {
        try {
            if (endedcontests && Array.isArray(endedcontests) && endedcontests.length > 0) {
                setEndedContests(endedcontests);
                setLoading(false);
            } else {
                setEndedContests([]);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error processing contests:', err);
            setEndedContests([]);
            setLoading(false);
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
                month: 'short',
                day: 'numeric'
            });
        } catch (err) {
            return 'Invalid date';
        }
    }, []);

    // Calculate days since ended
    const getDaysSinceEnded = useCallback((endDate) => {
        try {
            if (!endDate) return 'N/A';
            
            const ended = new Date(endDate);
            const now = new Date();
            const diffTime = Math.abs(now - ended);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
        } catch (err) {
            return 'N/A';
        }
    }, []);

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

    const getWinnerInfo = (contest) => {
        const winner = contest?.winners || [];
        console.log('Winner Data of Ended:', winner);
        if (!winner || winner.length == 0) return null;

        const first = winner[0]?.entry?.user;

        return {
            name: first?.name || 'Winner',
            entryTitle: winner[0]?.entry?.title || null,
            position : winner[0]?.position || null,
            avatar:
                first?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(first?.name || 'Winner')}&background=1b7a3a&color=fff`
        };
    };

    // Loading state
    if (loading) {
        return (
            <div className="ended-contests-section loading">
                <div className="container-lg">
                    <div className="section-header">
                        <h2>Past Contests</h2>
                        <p>Loading amazing contests...</p>
                    </div>
                    <div className="loading-slider">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="contest-card-skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-text"></div>
                                    <div className="skeleton-meta"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // No contests state
    if (!endedContests || endedContests.length === 0) {
        return (
            <div className="ended-contests-section empty">
                <div className="container-lg">
                    <div className="section-header">
                        <h2>Past Contests</h2>
                        <p>No ended contests to display</p>
                    </div>
                    <div className="empty-state">
                        <div className="empty-icon">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <h3>No Past Contests Yet</h3>
                        <p>Check back later to see completed contests and their winners.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="Past Contests - Muslim Hall" />

            {toast.show && (
                <div className={`toast-notification ${toast.type} show`}>
                    <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
                    <span>{toast.message}</span>
                    <button onClick={() => setToast({ show: false, message: '', type: '' })} className="toast-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <section className="ended-contests-section">
                <div className="container-lg">
                    <div className="section-header">
                        <div className="header-content">
                            <h2>Past Contests | </h2>
                            <p> Click the card for more details on past contests and their participants</p>
                        </div>
                        <div className="header-stats">
                            <div className="stat-item">
                                <i className="fas fa-trophy"></i>
                                <span>{endedContests.length} Contests</span>
                            </div>
                            <div className="stat-item">
                                <i className="fas fa-users"></i>
                                <span>
                                    {endedContests.reduce((total, contest) => 
                                        total + (contest.entries?.length || 0), 0
                                    )} Total Entries
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="slider-container">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                            effect="coverflow"
                            grabCursor={true}
                            centeredSlides={true}
                            slidesPerView="auto"
                            coverflowEffect={{
                                rotate: 0,
                                stretch: 0,
                                depth: 100,
                                modifier: 2.5,
                                slideShadows: true,
                            }}
                            navigation={{
                                nextEl: '.swiper-button-next',
                                prevEl: '.swiper-button-prev',
                            }}
                            pagination={{
                                clickable: true,
                                el: '.swiper-pagination',
                                type: 'bullets',
                            }}
                            autoplay={{
                                delay: 5000,
                                disableOnInteraction: false,
                            }}
                            breakpoints={{
                                320: {
                                    slidesPerView: 1,
                                    spaceBetween: 20,
                                },
                                768: {
                                    slidesPerView: 2,
                                    spaceBetween: 30,
                                },
                                1024: {
                                    slidesPerView: 3,
                                    spaceBetween: 40,
                                },
                            }}
                            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
                            className="ended-contests-swiper"
                        >
                            {endedContests.map((contest, index) => {
                                const prizes = getContestPrizes(contest);
                                const grandPrize = prizes[0]?.amount || 'Cash Prize';
                                const totalEntries = getContestEntries(contest).length;
                                const averageRating = getAverageRating(contest);
                                const winner = getWinnerInfo(contest);
                                const isActive = index === activeIndex;

                                return (
                                    <SwiperSlide key={contest.id}>
                                        <Link href={`/contests-details/${contest.id}`} className="stretched-link" >
                                        <div className={`contest-slide-card ${isActive ? 'active' : ''}`}>
                                            <div className="card-header">
                                                <div className="contest-badges">
                                                    <span className="status-badge ended">
                                                        <i className="fas fa-flag-checkered"></i>
                                                        {contest.status == 2 ? 'Running' : 'Ended'}
                                                    </span>
                                                    <span className="category-badge">
                                                        {contest.category?.name || 'General'}
                                                    </span>

                                                    {contest.category?.parent && (
                                                        <span className="category-badge">
                                                            {contest.category?.parent?.name || 'General'}
                                                        </span>
                                                    )}


                                                </div>
                                                <div className="days-ago">
                                                    {getDaysSinceEnded(contest.end_date)}
                                                </div>
                                            </div>

                                            {/* <div className="card-image">
                                                {contest.image ? (
                                                    <img 
                                                        src={contest.image} 
                                                        alt={contest.title}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="image-placeholder">
                                                        <i className="fas fa-trophy"></i>
                                                        <span>Past Contest</span>
                                                    </div>
                                                )}
                                                <div className="image-overlay">
                                                    <div className="prize-tag">
                                                        <i className="fas fa-award"></i>
                                                        {grandPrize}
                                                    </div>
                                                </div>
                                            </div> */}

                                            <div className="card-content">
                                                <div className="contest-title" title={contest.title}>
                                                    {contest.title}
                                                </div>
                                                
                                                <div className="contest-description-multi">
                                                    {contest.description?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                                </div>

                                                <div className="contest-meta">
                                                    <div className="meta-item">
                                                        <i className="fas fa-users"></i>
                                                        <span>{totalEntries} Entries</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <i className="fas fa-star"></i>
                                                        <span>{averageRating} Rating</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <i className="fas fa-award"></i>
                                                        <span>{prizes.length} Prizes</span>
                                                    </div>
                                                </div>

                                                <div className="contest-dates">
                                                    <div className="date-item">
                                                        <i className="fas fa-play-circle"></i>
                                                        <span>Started: {formatDate(contest.start_date)}</span>
                                                    </div>
                                                    <div className="date-item">
                                                        <i className="fas fa-flag-checkered"></i>
                                                        <span>Ended: {formatDate(contest.end_date)}</span>
                                                    </div>
                                                </div>

                                                  {winner && (
                                                        <div className="winner-section">
                                                            <div className="winner-label">
                                                                <i className="fas fa-crown"></i>
                                                                Winner
                                                            </div>
                                                            <div className="winner-info">
                                                                <img 
                                                                    src={winner.avatar} 
                                                                    alt={winner.name}
                                                                    className="winner-avatar"
                                                                />
                                                                <span className="winner-name">({winner.name})</span>
                                                                <span className="winner-position">{winner.position} Position</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                <div className="card-actions">
                                                    <Link 
                                                        href={`/contests-details/${contest.id}`}
                                                        className="view-details-btn"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        View Details
                                                    </Link>
                                                    {/* <Link 
                                                        href={`/contests/${contest.id}/results`}
                                                        className="results-btn"
                                                    >
                                                        <i className="fas fa-chart-bar"></i>
                                                        See Results
                                                    </Link> */}
                                                </div>
                                            </div>

                                            <div className="card-footer">
                                                <div className="organizer-info">
                                                    <i className="fas fa-user"></i>
                                                    <span>By {contest.creator?.name || 'Muslim Hall'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        </Link>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>

                        {/* Navigation Buttons */}
                        <div className="swiper-button-prev">
                            <i className="fas fa-chevron-left"></i>
                        </div>
                        <div className="swiper-button-next">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                        
                        {/* Pagination */}
                        <div className="swiper-pagination"></div>
                    </div>

                    {/* View All Button */}
                    {/* <div className="view-all-container">
                        <Link href="/contests/ended" className="view-all-btn">
                            <i className="fas fa-history"></i>
                            View All Past Contests
                        </Link>
                    </div> */}
                </div>
            </section>

            <style jsx>{`
                .ended-contests-section {
                    padding: 60px 0;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    position: relative;
                    overflow: hidden;
                }

                .ended-contests-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%231b7a3a' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
                    animation: float 20s infinite linear;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-50px, -50px) rotate(360deg); }
                }

                .container-lg {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 20px;
                    position: relative;
                    z-index: 2;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 3rem;
                    flex-wrap: wrap;
                    gap: 2rem;
                }

                .header-content h2 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1b7a3a;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .header-content p {
                    font-size: 1.1rem;
                    color: #666;
                    margin: 0;
                }

                .header-stats {
                    display: flex;
                    gap: 2rem;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    font-weight: 600;
                    color: #1b7a3a;
                }

                .stat-item i {
                    color: #2e8b57;
                }

                /* Slider Container */
                .slider-container {
                    position: relative;
                    margin-bottom: 3rem;
                    padding: 0 60px;
                }

                .ended-contests-swiper {
                    padding: 20px 0;
                    width: 100%;
                }

                .contest-slide-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    border: 1px solid #e8f5e8;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .contest-slide-card.active {
                    transform: scale(1.05);
                    box-shadow: 0 20px 50px rgba(27, 122, 58, 0.2);
                    z-index: 10;
                }

                .card-header {
                    padding: 1.5rem 1.5rem 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .contest-badges {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .status-badge, .category-badge {
                    padding: 0.4rem 0.8rem;
                    border-radius: 15px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }

                .status-badge.ended {
                    background: rgba(108, 117, 125, 0.1);
                    color: #6c757d;
                    border: 1px solid rgba(108, 117, 125, 0.3);
                }

                .category-badge {
                    background: #2F884F;
                    color: #ffffff;
                    border: 1px solid #fff;
                }

                .days-ago {
                    font-size: 0.8rem;
                    color: #666;
                    font-weight: 500;
                }

                .card-image {
                    position: relative;
                    height: 180px;
                    overflow: hidden;
                    margin: 1rem 1.5rem 0;
                    border-radius: 12px;
                }

                .card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .contest-slide-card.active .card-image img {
                    transform: scale(1.1);
                }

                .image-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                }

                .image-placeholder i {
                    margin-bottom: 0.5rem;
                    font-size: 2rem;
                }

                .image-placeholder span {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    text-align: center;
                    padding: 0 1rem;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    padding: 1rem;
                }

                .prize-tag {
                    background: linear-gradient(135deg, #ffd700, #ff6b00);
                    color: #1b7a3a;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }

                .card-content {
                    padding: 1.5rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .contest-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin: 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .contest-description-multi {
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .contest-meta {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-size: 0.8rem;
                    color: #666;
                }

                .meta-item i {
                    color: #1b7a3a;
                    font-size: 0.7rem;
                }

                .contest-dates {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 10px;
                }

                .date-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: #555;
                }

                .date-item i {
                    color: #1b7a3a;
                    width: 16px;
                }

                .winner-section {
                    padding: 1rem;
                    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
                    border-radius: 10px;
                    border: 1px solid #ffeaa7;
                }

                .winner-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 700;
                    color: #856404;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }

                .winner-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .winner-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 2px solid #ffd700;
                    object-fit: cover;
                }

                .winner-name {
                    font-weight: 600;
                    color: #333;
                    font-size: 0.9rem;
                }

                .card-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: auto;
                }

                .view-details-btn, .results-btn {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    position: relative;
                    z-index: 5;
                }

                .view-details-btn {
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                }

                .view-details-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                .results-btn {
                    background: rgba(27, 122, 58, 0.1);
                    color: #1b7a3a;
                    border: 1px solid rgba(27, 122, 58, 0.3);
                }

                .results-btn:hover {
                    background: rgba(27, 122, 58, 0.2);
                    transform: translateY(-2px);
                }

                .card-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #e8f5e8;
                    background: #f8f9fa;
                }

                .organizer-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    color: #666;
                }

                .organizer-info i {
                    color: #1b7a3a;
                }

                /* Navigation Buttons */
                .swiper-button-prev, .swiper-button-next {
                    width: 50px;
                    height: 50px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    color: #1b7a3a;
                    transition: all 0.3s ease;
                    margin-top: -25px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
                    top: 50%;
                    z-index: 10;
                }

                .swiper-button-prev::after, .swiper-button-next::after {
                    display: none;
                }

                .swiper-button-prev:hover, .swiper-button-next:hover {
                    background: #1b7a3a;
                    color: white;
                    transform: scale(1.1);
                }

                .swiper-button-prev {
                    left: 0;
                }

                .swiper-button-next {
                    right: 0;
                }

                /* Pagination */
                .swiper-pagination {
                    position: relative;
                    margin-top: 2rem;
                    bottom: 0 !important;
                }

                .swiper-pagination-bullet {
                    width: 12px;
                    height: 12px;
                    background: #ddd;
                    opacity: 1;
                    transition: all 0.3s ease;
                }

                .swiper-pagination-bullet-active {
                    background: #1b7a3a;
                    transform: scale(1.2);
                }

                /* View All Button */
                .view-all-container {
                    text-align: center;
                    margin-top: 2rem;
                }

                .view-all-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 2rem;
                    background: linear-gradient(135deg, #1b7a3a, #2e8b57);
                    color: white;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(27, 122, 58, 0.3);
                }

                .view-all-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(27, 122, 58, 0.4);
                }

                /* Toast Notification */
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    z-index: 1000;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }

                .toast-notification.show {
                    transform: translateX(0);
                }

                .toast-notification.success {
                    background: #1b7a3a;
                }

                .toast-notification.error {
                    background: #dc3545;
                }

                .toast-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    margin-left: auto;
                }

                /* Loading States */
                .ended-contests-section.loading {
                    padding: 80px 0;
                }

                .loading-slider {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .contest-card-skeleton {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    animation: pulse 2s infinite;
                }

                .skeleton-image {
                    height: 180px;
                    background: #e9ecef;
                }

                .skeleton-content {
                    padding: 1.5rem;
                }

                .skeleton-title {
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }

                .skeleton-text {
                    height: 16px;
                    background: #e9ecef;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                }

                .skeleton-meta {
                    height: 14px;
                    background: #e9ecef;
                    border-radius: 4px;
                    width: 60%;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                /* Empty State */
                .ended-contests-section.empty {
                    padding: 80px 0;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .empty-icon {
                    font-size: 4rem;
                    color: #ffc107;
                    margin-bottom: 1.5rem;
                }

                .empty-state h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }

                .empty-state p {
                    color: #666;
                    margin: 0;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .slider-container {
                        padding: 0 50px;
                    }
                    
                    .header-stats {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .contest-slide-card.active {
                        transform: scale(1.03);
                    }
                }

                @media (max-width: 768px) {
                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    
                    .slider-container {
                        padding: 0 40px;
                    }
                    
                    .header-content h2 {
                        font-size: 2rem;
                    }
                    
                    .card-actions {
                        flex-direction: column;
                    }
                    
                    .swiper-button-prev, .swiper-button-next {
                        width: 40px;
                        height: 40px;
                    }
                }

                @media (max-width: 480px) {
                    .slider-container {
                        padding: 0 20px;
                    }
                    
                    .header-content h2 {
                        font-size: 1.8rem;
                    }
                    
                    .contest-title {
                        font-size: 1.1rem;
                    }
                    
                    .card-image {
                        height: 150px;
                        margin: 1rem 1rem 0;
                    }
                }
            `}</style>
        </>
    );
}
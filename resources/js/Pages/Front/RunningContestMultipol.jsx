import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function RunningContestMultipol() {
    const { contests } = usePage().props;
    const [displayContests, setDisplayContests] = useState([]);

    useEffect(() => {
        if (contests && Array.isArray(contests)) {
            setDisplayContests(contests);
        }
    }, [contests]);

    if (!displayContests.length) return null;

    // Helpers
    const getDaysAgo = (date) => {
        if (!date) return "";
        const diff = new Date() - new Date(date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} days ago` : "Today";
    };

    return (
        <section className="multipol-section">
            <div className="container">
                <div className="section-header">
                    <div>
                        <Link href="/contests-details">
                            <h2 className="section-title">Running Contests</h2>
                        </Link>

                        <p className="section-subtitle">
                            Join now and win exciting prizes
                        </p>
                    </div>
                    <Link href="/contests-details" className="view-all-link">
                        View All <i className="fas fa-arrow-right"></i>
                    </Link>
                </div>

                <div className="swiper-container-wrapper">
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={25}
                        slidesPerView={1}
                        navigation={{
                            nextEl: ".custom-next",
                            prevEl: ".custom-prev",
                        }}
                        pagination={{
                            clickable: true,
                            el: ".custom-pagination",
                        }}
                        autoplay={{ delay: 6000, disableOnInteraction: false }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                            1280: { slidesPerView: 4 },
                        }}
                        className="contest-swiper"
                    >
                        {displayContests.map((contest) => {
                            const isRunning = contest.status == 2; // Assuming 2 is running
                            const entriesCount = contest.entries?.length || 0;
                            const prizeCount = contest.prizes?.length || 0;

                            return (
                                <SwiperSlide key={contest.id}>
                                    <div className="contest-card border-1 border-[#0f8022] shadow-md shadow-blue bg-[#ffffff]">
                                        <div className="card-top">
                                            <span
                                                className={`status-pill ${isRunning ? "running" : "ended"}`}
                                            >
                                                {isRunning
                                                    ? "Running"
                                                    : "Ended"}
                                            </span>
                                            <span className="date-pill">
                                                {isRunning
                                                    ? "Ends: "
                                                    : "Ended: "}
                                                {new Date(
                                                    contest.end_date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="card-body">
                                            <div className="category-label">
                                                {contest.category?.name ||
                                                    "General"}
                                            </div>
                                            <h3 className="card-title">
                                                <Link
                                                    href={`/contests-details/${contest.id}`}
                                                >
                                                    {contest.title}
                                                </Link>
                                            </h3>
                                            <p className="card-desc">
                                                {contest.description
                                                    ?.replace(/<[^>]*>/g, "")
                                                    .substring(0, 80)}
                                                ...
                                            </p>
                                        </div>

                                        <div className="card-meta">
                                            <div className="meta-stat">
                                                <i className="fas fa-users"></i>
                                                <span>
                                                    {entriesCount} Entries
                                                </span>
                                            </div>
                                            <div className="meta-stat">
                                                <i className="fas fa-gift"></i>
                                                <span>{prizeCount} Prizes</span>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <Link
                                                href={`/contests-details/${contest.id}`}
                                                className="card-btn"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {/* Custom Controls */}
                    <div className="swiper-controls">
                        <button className="custom-prev">
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        {/* <div className="custom-pagination"></div> */}
                        <button className="custom-next">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .multipol-section {
                    padding: 60px 0;
                    background: #f8f9fa;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                    padding: 0 15px;
                }

                .section-title {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin-bottom: 5px;
                }

                .section-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                }

                .view-all-link {
                    color: #1b7a3a;
                    font-weight: 600;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: transform 0.2s;
                }

                .view-all-link:hover {
                    transform: translateX(5px);
                }

                .swiper-container-wrapper {
                    position: relative;
                    padding: 0 10px;
                }

                .contest-card {
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

                    transition: all 0.3s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .contest-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px rgba(27, 122, 58, 0.1);
                    border-color: #1b7a3a;
                }

                .card-top {
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fbfcfd;
                    border-bottom: 1px solid #f0f0f0;
                }

                .status-pill {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .status-pill.running {
                    background: #e6fffa;
                    color: #1b7a3a;
                }
                .status-pill.ended {
                    background: #f3f4f6;
                    color: #6b7280;
                }

                .date-pill {
                    font-size: 0.8rem;
                    color: #888;
                }

                .card-body {
                    padding: 20px;
                    flex-grow: 1;
                }

                .category-label {
                    color: #1b7a3a;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .card-title {
                    font-size: 1.25rem;
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .card-title a {
                    color: #1a202c;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .card-title a:hover {
                    color: #1b7a3a;
                }

                .card-desc {
                    color: #666;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 0;
                }

                .card-meta {
                    display: flex;
                    gap: 15px;
                    padding: 0 20px 15px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .meta-stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #555;
                }

                .meta-stat i {
                    color: #1b7a3a;
                    opacity: 0.7;
                }

                .card-footer {
                    padding: 15px 20px;
                    background: #fff;
                }

                .card-btn {
                    display: block;
                    width: 100%;
                    text-align: center;
                    padding: 10px;
                    border: 1px solid #1b7a3a;
                    border-radius: 8px;
                    color: #1b7a3a;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .card-btn:hover {
                    background: #1b7a3a;
                    color: #fff;
                }

                /* Custom Swiper Controls */
                .swiper-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 30px;
                    gap: 20px;
                }

                .custom-prev,
                .custom-next {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid #ddd;
                    background: #fff;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .custom-prev:hover,
                .custom-next:hover {
                    border-color: #1b7a3a;
                    color: #1b7a3a;
                }

                :global(.custom-pagination .swiper-pagination-bullet) {
                    width: 10px;
                    height: 10px;
                    background: #ccc;
                    opacity: 0.5;
                    margin: 0 5px;
                }

                :global(.custom-pagination .swiper-pagination-bullet-active) {
                    background: #1b7a3a;
                    opacity: 1;
                    transform: scale(1.2);
                }

                @media (max-width: 768px) {
                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    .section-title {
                        font-size: 1.8rem;
                    }
                }
            `}</style>
        </section>
    );
}

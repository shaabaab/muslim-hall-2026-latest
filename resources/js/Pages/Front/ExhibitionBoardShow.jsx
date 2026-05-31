import { Link, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import Header from "./Header";
import Footer from "./Footer";
import { useState } from "react";

export default function ExhibitionBoardShow() {
    const { board } = usePage().props;
    const exhibitions = board?.approved_exhibitions || [];
    const [currentIndex, setCurrentIndex] = useState(0);

    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return "https://via.placeholder.com/900x600?text=Exhibition";
        }

        return imagePath.startsWith("http")
            ? imagePath
            : `${window.location.origin}/storage/${imagePath}`;
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]+>/g, "");
    };

    const nextSlide = () => {
        if (exhibitions.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % exhibitions.length);
    };

    const prevSlide = () => {
        if (exhibitions.length === 0) return;
        setCurrentIndex((prev) =>
            prev === 0 ? exhibitions.length - 1 : prev - 1
        );
    };

    const currentItem = exhibitions[currentIndex];

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />

                <section className="board-show-hero">
                    <div className="container">
                        <Link href={route("exhibition-details")} className="back-link">
                            ← Back to Boards
                        </Link>

                        <h1>{board.title}</h1>

                        <p>{stripHtml(board.description)}</p>

                        <div className="board-meta">
                            <span>Owner: {board.owner?.name || "Unknown"}</span>
                            <span>{exhibitions.length} Approved Exhibitions</span>
                        </div>
                    </div>
                </section>

                <section className="slider-section">
                    <div className="container-md">
                        {currentItem ? (
                            <div className="slider-card">
                                <button className="slider-btn prev" onClick={prevSlide}>
                                    ‹
                                </button>

                                <div className="slider-image">
                                    <img
                                        src={getImageUrl(currentItem.image)}
                                        alt={stripHtml(currentItem.title)}
                                    />
                                </div>

                                <div className="slider-content">
                                    <div className="slide-count">
                                        {currentIndex + 1} / {exhibitions.length}
                                    </div>

                                    <h2
                                        dangerouslySetInnerHTML={{
                                            __html: currentItem.title || "Untitled",
                                        }}
                                    />

                                    <div
                                        className="description"
                                        dangerouslySetInnerHTML={{
                                            __html: currentItem.description || "",
                                        }}
                                    />

                                    <div className="info-grid">
                                        <div>
                                            <span>Type</span>
                                            <strong>{currentItem.type}</strong>
                                        </div>

                                        <div>
                                            <span>Price</span>
                                            <strong>
                                                {currentItem.price
                                                    ? `${currentItem.currency || "USD"} ${parseFloat(
                                                          currentItem.price
                                                      ).toLocaleString()}`
                                                    : "Free"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>Status</span>
                                            <strong>{currentItem.status}</strong>
                                        </div>
                                    </div>

                                    {currentItem.sponsor_image && (
                                        <div className="sponsor-box">
                                            <span>Sponsored By</span>
                                            <img
                                                src={getImageUrl(currentItem.sponsor_image)}
                                                alt="Sponsor"
                                            />
                                        </div>
                                    )}

                                    <Link
                                        href={route("exhibition-detail", currentItem.id)}
                                        className="details-btn"
                                    >
                                        View Details
                                    </Link>
                                </div>

                                <button className="slider-btn next" onClick={nextSlide}>
                                    ›
                                </button>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h3>No approved exhibitions found under this board.</h3>
                                <p>After admin approval, exhibitions will appear here.</p>
                            </div>
                        )}

                        {exhibitions.length > 1 && (
                            <div className="thumbs">
                                {exhibitions.map((item, index) => (
                                    <button
                                        key={item.id}
                                        className={`thumb ${
                                            currentIndex === index ? "active" : ""
                                        }`}
                                        onClick={() => setCurrentIndex(index)}
                                    >
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={stripHtml(item.title)}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>

            <style>{`
                .container-md {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 16px;
                }

                .board-show-hero {
                    background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                    color: white;
                    padding: 50px 0 35px;
                }

                .back-link {
                    display: inline-block;
                    color: #d1d5db;
                    text-decoration: none;
                    margin-bottom: 18px;
                }

                .board-show-hero h1 {
                    font-size: 42px;
                    font-weight: 900;
                    margin-bottom: 12px;
                }

                .board-show-hero p {
                    color: #d1d5db;
                    max-width: 760px;
                    line-height: 1.7;
                }

                .board-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 20px;
                }

                .board-meta span {
                    background: rgba(255,255,255,0.12);
                    border: 1px solid rgba(255,255,255,0.18);
                    padding: 8px 12px;
                    border-radius: 999px;
                    font-size: 13px;
                }

                .slider-section {
                    padding: 45px 0;
                    background: #f9fafb;
                    min-height: 65vh;
                }

                .slider-card {
                    position: relative;
                    background: white;
                    border-radius: 24px;
                    overflow: hidden;
                    display: grid;
                    grid-template-columns: 1.1fr 0.9fr;
                    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.13);
                    border: 1px solid #e5e7eb;
                }

                .slider-image {
                    background: #111827;
                    min-height: 520px;
                }

                .slider-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .slider-content {
                    padding: 38px;
                    position: relative;
                }

                .slide-count {
                    display: inline-flex;
                    padding: 7px 12px;
                    border-radius: 999px;
                    background: #eef2ff;
                    color: #3730a3;
                    font-weight: 700;
                    font-size: 13px;
                    margin-bottom: 20px;
                }

                .slider-content h2 {
                    font-size: 30px;
                    font-weight: 900;
                    color: #111827;
                    margin-bottom: 16px;
                }

                .description {
                    color: #4b5563;
                    line-height: 1.8;
                    margin-bottom: 22px;
                }

                .description a {
                    color: #2563eb;
                    text-decoration: underline;
                    font-weight: 600;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .info-grid div {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 14px;
                }

                .info-grid span {
                    display: block;
                    color: #6b7280;
                    font-size: 12px;
                    margin-bottom: 5px;
                }

                .info-grid strong {
                    color: #111827;
                    text-transform: capitalize;
                }

                .sponsor-box {
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 14px;
                    margin-bottom: 22px;
                    background: #fff;
                }

                .sponsor-box span {
                    display: block;
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 8px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .sponsor-box img {
                    max-width: 220px;
                    max-height: 80px;
                    object-fit: contain;
                }

                .details-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 22px;
                    border-radius: 999px;
                    background: #111827;
                    color: white;
                    text-decoration: none;
                    font-weight: 800;
                }

                .slider-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 4;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: none;
                    background: rgba(17,24,39,0.78);
                    color: white;
                    font-size: 34px;
                    cursor: pointer;
                    line-height: 1;
                }

                .slider-btn.prev {
                    left: 16px;
                }

                .slider-btn.next {
                    right: 16px;
                }

                .thumbs {
                    margin-top: 22px;
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding-bottom: 6px;
                }

                .thumb {
                    width: 110px;
                    height: 76px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 3px solid transparent;
                    padding: 0;
                    cursor: pointer;
                    background: white;
                    flex: 0 0 auto;
                }

                .thumb.active {
                    border-color: #111827;
                }

                .thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .empty-state {
                    background: white;
                    border-radius: 20px;
                    padding: 60px 20px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                }

                @media (max-width: 900px) {
                    .slider-card {
                        grid-template-columns: 1fr;
                    }

                    .slider-image {
                        min-height: 320px;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .board-show-hero h1 {
                        font-size: 30px;
                    }

                    .slider-content {
                        padding: 24px;
                    }
                }
                .slider-btn.next,.slider-btn.prev{
                    display:none;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
import { Link, router, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import Header from "./Header";
import Footer from "./Footer";
import { useState, useEffect } from "react";

export default function ExhibitionBoards() {
    const { boards, filters: initialFilters, auth } = usePage().props;

    const [filters, setFilters] = useState({
        search: initialFilters?.search || "",
    });

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get(route("exhibition-details"), filters, {
                preserveState: true,
                replace: true,
                only: ["boards", "filters"],
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return "https://via.placeholder.com/600x400?text=Exhibition+Board";
        }

        return imagePath.startsWith("http")
            ? imagePath
            : `${window.location.origin}/storage/${imagePath}`;
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]+>/g, "");
    };

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />

                <section className="board-hero">
                    <div className="container">
                        <h1>Exhibition Boards</h1>
                        <p>Select a board to view exhibitions under it.</p>

                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search boards..."
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </section>

                <section className="boards-section">
                    <div className="container-md">
                        {boards.data.length > 0 ? (
                            <div className="boards-grid">
                                {boards.data.map((board) => (
                                    <Link
                                        key={board.id}
                                        href={route("exhibition-board.show", board.id)}
                                        className="board-card"
                                    >
                                        <div className="board-image-wrap">
                                            <img
                                                src={getImageUrl(board.image)}
                                                alt={board.title}
                                            />
                                            <span className="board-count">
                                                {board.exhibitions_count || 0} Exhibitions
                                            </span>
                                        </div>

                                        <div className="board-body">
                                            <h3>{board.title}</h3>
                                            <p>{stripHtml(board.description).slice(0, 120)}</p>

                                            <div className="board-owner">
                                                <span>Owner:</span> {board.owner?.name || "Unknown"}
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <span>{Number(board.views_count || 0).toLocaleString()} total views</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h3>No approved board found</h3>
                                <p>Please try another search.</p>
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

                .board-hero {
                    padding: 60px 0 35px;
                    background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                    color: white;
                    text-align: center;
                }

                .board-hero h1 {
                    font-size: 42px;
                    font-weight: 800;
                    margin-bottom: 10px;
                }

                .board-hero p {
                    color: #d1d5db;
                    font-size: 16px;
                    margin-bottom: 25px;
                }

                .search-box {
                    max-width: 520px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 999px;
                    padding: 0 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    height: 52px;
                    color: #111827;
                    box-shadow: 0 18px 40px rgba(0,0,0,0.18);
                }

                .search-box input {
                    border: none;
                    outline: none;
                    width: 100%;
                    font-size: 15px;
                }

                .boards-section {
                    padding: 45px 0;
                    background: #f9fafb;
                    min-height: 60vh;
                }

                .boards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }

                .board-card {
                    background: white;
                    border-radius: 18px;
                    overflow: hidden;
                    text-decoration: none;
                    color: #111827;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
                    border: 1px solid #e5e7eb;
                    transition: all 0.25s ease;
                }

                .board-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
                }

                .board-image-wrap {
                    position: relative;
                    height: 210px;
                    background: #e5e7eb;
                }

                .board-image-wrap img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .board-count {
                    position: absolute;
                    left: 14px;
                    bottom: 14px;
                    background: rgba(17, 24, 39, 0.85);
                    color: white;
                    padding: 7px 12px;
                    border-radius: 999px;
                    font-size: 13px;
                    font-weight: 700;
                }

                .board-body {
                    padding: 20px;
                }

                .board-body h3 {
                    font-size: 20px;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .board-body p {
                    color: #6b7280;
                    font-size: 14px;
                    min-height: 42px;
                }

                .board-owner {
                    margin-top: 16px;
                    font-size: 14px;
                    color: #374151;
                }

                .board-owner span {
                    font-weight: 700;
                }

                .empty-state {
                    background: white;
                    border-radius: 18px;
                    padding: 60px 20px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                }

                @media (max-width: 768px) {
                    .board-hero h1 {
                        font-size: 30px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
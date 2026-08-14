import { Link, router, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import Header from "./Header";
import Footer from "./Footer";
import { useEffect, useState } from "react";

export default function ExhibitionBoards() {
    const { boards, filters: initialFilters } = usePage().props;

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

    const fallbackImage =
        "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";

    const stripHtml = (html = "") =>
        String(html || "")
            .replace(/<[^>]*>/g, "")
            .trim();

    const getBoardPosts = (board) => {
        const posts =
            board?.approved_exhibitions ||
            board?.approvedExhibitions ||
            board?.exhibitions ||
            [];

        return Array.isArray(posts) ? posts.slice(0, 4) : [];
    };

    const getBoardImageUrl = (board) => {
        const firstPost = getBoardPosts(board)?.[0];

        return getS3PublicUrl(
            board?.image_url ||
                board?.image ||
                board?.thumbnail ||
                board?.cover_image ||
                firstPost?.image_url ||
                firstPost?.image ||
                firstPost?.gallery_urls?.[0] ||
                firstPost?.gallery?.[0],
        );
    };

    // An exhibition posted by the board's own creator is the owner's; anyone
    // else posting into the board is a contributor.
    const getCreator = (board, post) => {
        const boardOwnerId = board?.user_id ?? board?.owner?.id;
        const postCreatorId = post?.user_id ?? post?.user?.id;

        const name = post?.user?.name || "Unknown";

        if (!boardOwnerId || !postCreatorId) {
            return { role: null, name, id: null };
        }

        return {
            role: boardOwnerId === postCreatorId ? "Owner" : "Contributor",
            name,
            id: postCreatorId,
        };
    };

    const getPostImageUrl = (post) => {
        return getS3PublicUrl(
            post?.image_url ||
                post?.image ||
                post?.thumbnail ||
                post?.gallery_urls?.[0] ||
                post?.gallery?.[0],
        );
    };

    return (
        <FrontAuthenticatedLayout>
            <div className="page-wrapper">
                <Header />

                <section className="board-hero">
                    <div className="container">
                        <h1>Exhibition Boards</h1>
                        <p>
                            Browse public boards and their latest exhibition
                            posts.
                        </p>
                        {/* Search Box */}
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
                {/* Board Section */}
                <section className="boards-section">
                    <div className="container-md">
                        {boards?.data?.length > 0 ? (
                            <div className="boards-list">
                                {boards.data.map((board) => {
                                    const posts = getBoardPosts(board);

                                    return (
                                        <article
                                            className="board-row-card"
                                            key={board.id}
                                        >
                                            <div className="board-main-row">
                                                <Link
                                                    href={route(
                                                        "exhibition-board.show",
                                                        board.id,
                                                    )}
                                                    className="board-image-wrap"
                                                >
                                                    <img
                                                        src={getBoardImageUrl(
                                                            board,
                                                        )}
                                                        alt={
                                                            stripHtml(
                                                                board.title,
                                                            ) ||
                                                            "Exhibition Board"
                                                        }
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                fallbackImage;
                                                        }}
                                                    />
                                                    <span className="board-count">
                                                        {board.exhibitions_count ||
                                                            posts.length ||
                                                            0}{" "}
                                                        Exhibitions
                                                    </span>
                                                </Link>

                                                <div className="board-body">
                                                    <div className="board-topline">
                                                        <span className="board-label">
                                                            Board
                                                        </span>
                                                        <span className="board-views">
                                                            {Number(
                                                                board.views_count ||
                                                                    0,
                                                            ).toLocaleString()}{" "}
                                                            views
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={route(
                                                            "exhibition-board.show",
                                                            board.id,
                                                        )}
                                                        className="board-title-link"
                                                    >
                                                        {stripHtml(
                                                            board.title,
                                                        ) || "Untitled Board"}
                                                    </Link>

                                                    <p className="board-description">
                                                        {stripHtml(
                                                            board.description,
                                                        ).slice(0, 180) ||
                                                            "Explore exhibitions shared under this board."}
                                                    </p>

                                                    <div className="board-owner">
                                                        <span>Owner:</span>{" "}
                                                        {board.owner?.name ||
                                                            "Unknown"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="board-posts-wrap">
                                                <div className="board-posts-header">
                                                    <h4>
                                                        Latest Exhibition Posts
                                                    </h4>
                                                    <Link
                                                        href={route(
                                                            "exhibition-board.show",
                                                            board.id,
                                                        )}
                                                    >
                                                        View board{" "}
                                                        <i className="fas fa-arrow-right"></i>
                                                    </Link>
                                                </div>

                                                {posts.length > 0 ? (
                                                    <div className="board-posts-list">
                                                        {posts.map((post) => {
                                                            const creator =
                                                                getCreator(
                                                                    board,
                                                                    post,
                                                                );

                                                            return (
                                                                // <Link
                                                                //     href={`/exhibition-detail/${post.id}`}
                                                                //     className="board-post-item"
                                                                //     key={post.id}
                                                                // >
                                                                <div className="board-post-item">
                                                                    <img
                                                                        src={getPostImageUrl(
                                                                            post,
                                                                        )}
                                                                        alt={
                                                                            stripHtml(
                                                                                post.title,
                                                                            ) ||
                                                                            "Exhibition"
                                                                        }
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            e.currentTarget.src =
                                                                                fallbackImage;
                                                                        }}
                                                                    />
                                                                    <div className="board-post-content">
                                                                        <h5>
                                                                            {stripHtml(
                                                                                post.title,
                                                                            ) ||
                                                                                "Untitled Exhibition"}
                                                                        </h5>
                                                                        <p>
                                                                            {stripHtml(
                                                                                post.description ||
                                                                                    post.content,
                                                                            ).slice(
                                                                                0,
                                                                                95,
                                                                            )}
                                                                        </p>
                                                                        <span>
                                                                            {post.type ||
                                                                                "Exhibition"}
                                                                        </span>

                                                                        {/* role is only set when the
                                                                            creator id resolved, so the
                                                                            author link is always valid
                                                                            here. */}
                                                                        {creator.role && (
                                                                            <Link
                                                                                href={route(
                                                                                    "author.profile",
                                                                                    creator.id,
                                                                                )}
                                                                                className={`creator-chip ${creator.role.toLowerCase()}`}
                                                                                title={`View ${creator.name}'s profile`}
                                                                            >
                                                                                {
                                                                                    creator.role
                                                                                }
                                                                                <b>
                                                                                    {
                                                                                        creator.name
                                                                                    }
                                                                                </b>
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                // </Link>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="empty-posts">
                                                        No approved exhibition
                                                        post found in this
                                                        board.
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h3>No approved board found</h3>
                                <p>Please try another search.</p>
                            </div>
                        )}

                        {boards?.links && boards.links.length > 3 && (
                            <div className="pagination-wrap">
                                {boards.links.map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        disabled={!link.url}
                                        className={`pagination-btn ${link.active ? "active" : ""}`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        onClick={() => {
                                            if (link.url) {
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
                                            }
                                        }}
                                    />
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

                .board-hero {
                    padding: 60px 0 35px;
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
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

                .boards-list {
                    display: flex;
                    flex-direction: column;
                    gap: 26px;
                }

                .board-row-card {
                    width: 100%;
                    background: #ffffff;
                    border-radius: 22px;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
                }

                .board-main-row {
                    display: grid;
                    grid-template-columns: 360px minmax(0, 1fr);
                    gap: 0;
                    min-height: 245px;
                }

                .board-image-wrap {
                    position: relative;
                    display: block;
                    background: #e5e7eb;
                    overflow: hidden;
                    min-height: 245px;
                }

                .board-image-wrap img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .board-row-card:hover .board-image-wrap img {
                    transform: scale(1.04);
                }

                .board-count {
                    position: absolute;
                    left: 16px;
                    bottom: 16px;
                    background: rgba(17, 24, 39, 0.88);
                    color: white;
                    padding: 8px 13px;
                    border-radius: 999px;
                    font-size: 13px;
                    font-weight: 800;
                }

                .board-body {
                    padding: 28px;
                }

                .board-topline {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .board-label {
                    display: inline-flex;
                    align-items: center;
                    background: #e8f8ed;
                    color: #0f8022;
                    border-radius: 999px;
                    padding: 6px 12px;
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .board-views {
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 700;
                }

                .board-title-link {
                    display: block;
                    color: #0f172a;
                    text-decoration: none;
                    font-size: 28px;
                    line-height: 1.2;
                    font-weight: 900;
                    margin-bottom: 10px;
                }

                .board-title-link:hover {
                    color: #0f8022;
                }

                .board-description {
                    color: #64748b;
                    font-size: 15px;
                    line-height: 1.65;
                    margin-bottom: 18px;
                }

                .board-owner {
                    color: #334155;
                    font-size: 14px;
                }

                .board-owner span {
                    font-weight: 900;
                }

                .board-posts-wrap {
                    border-top: 1px solid #eef2f7;
                    padding: 20px 24px 24px;
                    background: #ffffff;
                }

                .board-posts-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 14px;
                    margin-bottom: 15px;
                }

                .board-posts-header h4 {
                    color: #0f172a;
                    font-size: 18px;
                    font-weight: 900;
                    margin: 0;
                }

                .board-posts-header a {
                    color: #0f8022;
                    font-size: 14px;
                    font-weight: 800;
                    text-decoration: none;
                }

                .board-posts-list {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 14px;
                }

                .board-post-item {
                    display: block;
                    color: inherit;
                    text-decoration: none;
                    background: #f8fafc;
                    border: 1px solid #eef2f7;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.22s ease;
                }

                .board-post-item:hover {
                    transform: translateY(-3px);
                    border-color: #bfe9ca;
                    background: #f2fff5;
                }

                .board-post-item img {
                    width: 100%;
                    height: 110px;
                    object-fit: cover;
                    background: #e2e8f0;
                }

                .board-post-content {
                    padding: 12px;
                }

                .board-post-content h5 {
                    color: #0f172a;
                    font-size: 15px;
                    line-height: 1.3;
                    font-weight: 900;
                    margin: 0 0 6px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .board-post-content p {
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.45;
                    margin: 0 0 8px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .board-post-content span {
                    color: #0f8022;
                    font-size: 12px;
                    font-weight: 900;
                }

                /* Owner = posted by the board's creator, contributor = anyone
                   else who posted into the board. */
                .creator-chip {
                    display: flex;
                    align-items: baseline;
                    gap: 5px;
                    margin-top: 8px;
                    padding: 5px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: lowercase;
                    letter-spacing: .04em;
                    /* The chip links to the creator's author profile. */
                    text-decoration: none;
                    transition: filter 200ms ease;
                }

                .creator-chip:hover {
                    filter: brightness(0.94);
                }

                .creator-chip:hover b {
                    text-decoration: underline;
                }

                .creator-chip b {
                    font-size: 12px;
                    font-weight: 800;
                    text-transform: none;
                    letter-spacing: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .board-post-content .creator-chip.owner {
                    background: #e8f8ed;
                    color: #0f8022;
                }

                .board-post-content .creator-chip.contributor {
                    background: #fff4e5;
                    color: #b45309;
                }

                .empty-posts,
                .empty-state {
                    background: white;
                    border-radius: 18px;
                    padding: 45px 20px;
                    text-align: center;
                    border: 1px dashed #cbd5e1;
                    color: #64748b;
                }

                .pagination-wrap {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 28px;
                }

                .pagination-btn {
                    border: 1px solid #d1d5db;
                    background: white;
                    color: #111827;
                    min-width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    font-weight: 800;
                }

                .pagination-btn.active {
                    background: #0f8022;
                    color: white;
                    border-color: #0f8022;
                }

                .pagination-btn:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }

                @media (max-width: 991px) {
                    .board-main-row {
                        grid-template-columns: 1fr;
                    }

                    .board-image-wrap {
                        height: 260px;
                    }

                    .board-posts-list {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 575px) {
                    .board-hero h1 {
                        font-size: 30px;
                    }

                    .board-body,
                    .board-posts-wrap {
                        padding: 18px;
                    }

                    .board-title-link {
                        font-size: 22px;
                    }

                    .board-posts-header {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .board-posts-list {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

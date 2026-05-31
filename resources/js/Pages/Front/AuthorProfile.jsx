// resources/js/Pages/Front/AuthorProfile.jsx

import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

export default function AuthorProfile({
    auth,
    author,
    posts,
    stats,
    isMember,
    author_profile_type,
    isFollowing: initialIsFollowing,
}) {
    const authorProfileType = author_profile_type === "member" ? "member" : "normal";
    const [sortBy, setSortBy] = useState("latest");
    const [filteredPosts, setFilteredPosts] = useState(posts?.data || []);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(
        stats?.total_followers || 0
    );
    const [followBtnLoading, setFollowBtnLoading] = useState(false);
    const [nextPageUrl, setNextPageUrl] = useState(posts?.next_page_url || null);

    const currentUser = auth?.user || null;

    const getAuthorPhoto = () => {
        if (!author?.photo) {
            return null;
        }

        if (String(author.photo).startsWith("http")) {
            return author.photo;
        }

        if (String(author.photo).startsWith("/storage")) {
            return author.photo;
        }

        if (String(author.photo).startsWith("/")) {
            return author.photo;
        }

        return getS3PublicUrl(author.photo);
    };

    const authorPhoto = getAuthorPhoto();

    const stripHtml = (html) => {
        if (!html) return "";
        return String(html).replace(/<[^>]*>/g, "");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const sortPosts = (items, sortType) => {
        const sorted = [...(items || [])];

        switch (sortType) {
            case "latest":
                return sorted.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );

            case "oldest":
                return sorted.sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );

            case "popular":
                return sorted.sort(
                    (a, b) => (b.viewer_count || 0) - (a.viewer_count || 0)
                );

            case "title_asc":
                return sorted.sort((a, b) =>
                    (a.title || "").localeCompare(b.title || "")
                );

            case "title_desc":
                return sorted.sort((a, b) =>
                    (b.title || "").localeCompare(a.title || "")
                );

            default:
                return sorted;
        }
    };

    useEffect(() => {
        setFilteredPosts(sortPosts(posts?.data || [], sortBy));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, posts?.data]);

    useEffect(() => {
        setNextPageUrl(posts?.next_page_url || null);
    }, [posts?.next_page_url]);

    const handleFollow = async () => {
        if (!currentUser) {
            window.location.href = route("login");
            return;
        }

        try {
            setFollowBtnLoading(true);

            const endpoint = isFollowing
                ? route("user.unfollow", author.id)
                : route("user.follow", author.id);

            const response = await axios.post(endpoint);

            if (response.data) {
                setIsFollowing(!isFollowing);
                setFollowersCount(response.data.followers_count);
            }
        } catch (error) {
            console.error("Error following/unfollowing user:", error);
        } finally {
            setFollowBtnLoading(false);
        }
    };

    const getMediaType = (post) => {
        if (post?.content) return "content";
        if (post?.pdf) return "pdf";
        if (post?.video || post?.video_url) return "video";
        if (post?.audio) return "audio";
        return "none";
    };

    const renderMediaIcon = (post) => {
        const type = getMediaType(post);

        switch (type) {
            case "content":
                return <i className="fas fa-file-alt text-blue-500" />;

            case "pdf":
                return <i className="fas fa-file-pdf text-red-500" />;

            case "video":
                return <i className="fas fa-video text-purple-500" />;

            case "audio":
                return <i className="fas fa-music text-green-500" />;

            default:
                return <i className="fas fa-file text-gray-500" />;
        }
    };

    const loadMorePosts = async () => {
        if (!nextPageUrl || loading) return;

        try {
            setLoading(true);

            const res = await axios.get(nextPageUrl);

            const payload = res?.data?.posts || res?.data;
            const more = payload?.data || [];
            const next = payload?.next_page_url || null;

            const merged = [...filteredPosts, ...more];

            setFilteredPosts(sortPosts(merged, sortBy));
            setNextPageUrl(next);
        } catch (error) {
            console.error("Load more posts error:", error);
        } finally {
            setLoading(false);
        }
    };

    const MemberAuthorHero = () => {
        return (
            <div className="member-author-hero">
                <div className="member-hero-shape shape-one"></div>
                <div className="member-hero-shape shape-two"></div>
                <div className="member-hero-pattern"></div>

                <div className="member-gold-line top"></div>

                <div className="container member-hero-container">
                    <div className="member-verified-strip">
                        <span className="verified-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="#f0c040"
                                />
                                <path
                                    d="M8 12.5l2.5 2.5 5.5-5.5"
                                    stroke="#7c5500"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </span>

                        <span className="verified-text">
                            Established Author
                        </span>

                        <span className="verified-dot">·</span>

                        <span className="verified-year">
                            Since{" "}
                            {author?.created_at
                                ? new Date(author.created_at).getFullYear()
                                : stats?.join_date?.split(" ").pop() || "—"}
                        </span>
                    </div>

                    <div className="member-author-content">
                        <div className="member-avatar-wrap">
                            <div className="member-avatar-glow"></div>

                            <div className="member-avatar-ring">
                                <div className="member-avatar">
                                    {authorPhoto ? (
                                        <img
                                            src={authorPhoto}
                                            alt={author?.name || "Author"}
                                        />
                                    ) : (
                                        <span>
                                            {(author?.name || "A").charAt(0)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="member-crown">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path
                                        d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 3h14v2H5v-2z"
                                        fill="#7c5500"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="member-info">
                            <div className="member-name-row">
                                <h1>{author?.name}</h1>

                                {currentUser?.id !== author?.id && (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followBtnLoading}
                                        className={`member-follow-btn ${
                                            isFollowing ? "following" : ""
                                        }`}
                                    >
                                        {followBtnLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : isFollowing ? (
                                            <>
                                                <i className="fas fa-check"></i>
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-plus"></i>
                                                Follow
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {author?.bio && (
                                <p className="member-bio">{author.bio}</p>
                            )}

                            {author?.website && (
                                <a
                                    href={author.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="member-website"
                                >
                                    <i className="fas fa-globe"></i>
                                    {author.website}
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="member-stats-grid">
                        {[
                            {
                                icon: "fas fa-newspaper",
                                value: stats?.total_posts ?? 0,
                                label: "Total Posts",
                            },
                            {
                                icon: "fas fa-eye",
                                value: Number(
                                    stats?.total_views || 0
                                ).toLocaleString(),
                                label: "Total Views",
                            },
                            {
                                icon: "fas fa-users",
                                value: Number(
                                    followersCount || 0
                                ).toLocaleString(),
                                label: "Followers",
                            },
                            {
                                icon: "fas fa-calendar-alt",
                                value: stats?.join_date || "—",
                                label: "Joined",
                            },
                        ].map((item, index) => (
                            <div key={index} className="member-stat-card">
                                <div className="member-stat-line"></div>

                                <div className="member-stat-icon">
                                    <i className={item.icon}></i>
                                </div>

                                <div className="member-stat-content">
                                    <h3>{item.value}</h3>
                                    <p>{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="member-gold-line bottom"></div>
            </div>
        );
    };

    const NormalAuthorHero = () => {
        return (
            <div className="author-hero-section">
                <div className="container">
                    <div className="author-hero-content">
                        <div className="author-avatar-large">
                            <div className="avatar-circle">
                                {authorPhoto ? (
                                    <img
                                        src={authorPhoto}
                                        alt={author?.name || "Author"}
                                    />
                                ) : (
                                    <span>
                                        {(author?.name || "A").charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="author-info">
                            <div className="normal-name-row">
                                <h1 className="author-name">
                                    {author?.name}
                                </h1>

                                {currentUser?.id !== author?.id && (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followBtnLoading}
                                        className={`normal-follow-btn ${
                                            isFollowing ? "following" : ""
                                        }`}
                                    >
                                        {followBtnLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : isFollowing ? (
                                            <>
                                                <i className="fas fa-check"></i>
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-plus"></i>
                                                Follow
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {author?.bio && (
                                <p className="author-bio">{author.bio}</p>
                            )}

                            {author?.website && (
                                <a
                                    href={author.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="author-website"
                                >
                                    <i className="fas fa-globe"></i>
                                    {author.website}
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="author-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-newspaper"></i>
                            </div>

                            <div className="stat-content">
                                <h3>{stats?.total_posts ?? 0}</h3>
                                <p>Total Posts</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-eye"></i>
                            </div>

                            <div className="stat-content">
                                <h3>
                                    {Number(
                                        stats?.total_views || 0
                                    ).toLocaleString()}
                                </h3>
                                <p>Total Views</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-users"></i>
                            </div>

                            <div className="stat-content">
                                <h3>
                                    {Number(
                                        followersCount || 0
                                    ).toLocaleString()}
                                </h3>
                                <p>Followers</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-calendar-alt"></i>
                            </div>

                            <div className="stat-content">
                                <h3>{stats?.join_date || "—"}</h3>
                                <p>Joined</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <FrontAuthenticatedLayout>
            <Head title={(author?.name || "Author") + " - Author Profile"} />

            <Header />

            <div className="author-profile-page">
                {authorProfileType === "member" ? <MemberAuthorHero /> : <NormalAuthorHero />}

                <div className="container posts-section">
                    <div className="posts-header">
                        <h2 className="section-title">
                            Posts by {author?.name}
                        </h2>

                        <div className="sort-controls">
                            <span className="sort-label">Sort by:</span>

                            <select
                                className="sort-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="latest">Latest</option>
                                <option value="oldest">Oldest</option>
                                <option value="popular">Popular</option>
                                <option value="title_asc">Title A-Z</option>
                                <option value="title_desc">Title Z-A</option>
                            </select>
                        </div>
                    </div>

                    {filteredPosts.length > 0 ? (
                        <>
                            <div className="posts-grid">
                                {filteredPosts.map((post) => (
                                    <div key={post.id} className="post-card">
                                        <Link
                                            href={route(
                                                "post-detail",
                                                post.slug
                                            )}
                                            className="post-image-link"
                                        >
                                            <div className="post-image-container">
                                                {post.thumbnail ? (
                                                    <img
                                                        src={getS3PublicUrl(
                                                            post.thumbnail
                                                        )}
                                                        alt={post.title}
                                                        loading="lazy"
                                                        className="post-image"
                                                    />
                                                ) : (
                                                    <div className="post-image-placeholder">
                                                        {renderMediaIcon(post)}
                                                    </div>
                                                )}

                                                {post?.category?.name && (
                                                    <div className="post-category-tag">
                                                        {post.category.name}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="post-content">
                                            <div className="post-meta">
                                                <span className="post-date">
                                                    <i className="far fa-clock"></i>
                                                    {formatDate(
                                                        post.created_at
                                                    )}
                                                </span>

                                                <span className="post-views">
                                                    <i className="fas fa-eye"></i>
                                                    {post.viewer_count || 0}
                                                </span>

                                                <span className="post-media-type">
                                                    {renderMediaIcon(post)}
                                                </span>
                                            </div>

                                            <h3 className="post-title">
                                                <Link
                                                    href={route(
                                                        "post-detail",
                                                        post.slug
                                                    )}
                                                >
                                                    {post.title}
                                                </Link>
                                            </h3>

                                            <p className="post-excerpt">
                                                {post.content
                                                    ? stripHtml(
                                                          post.content
                                                      ).substring(0, 120) +
                                                      "..."
                                                    : "No content available"}
                                            </p>

                                            <div className="post-footer">
                                                <Link
                                                    href={route(
                                                        "post-detail",
                                                        post.slug
                                                    )}
                                                    className="read-more-btn"
                                                >
                                                    Read More
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {nextPageUrl && (
                                <div className="load-more-container">
                                    <button
                                        onClick={loadMorePosts}
                                        disabled={loading}
                                        className="load-more-btn"
                                    >
                                        {loading
                                            ? "Loading..."
                                            : "Load More Posts"}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-posts-message">
                            <i className="fas fa-newspaper"></i>

                            <h3>No posts yet</h3>

                            <p>
                                {author?.name} hasn&apos;t published any posts
                                yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />

            <style jsx>{`
                .author-profile-page {
                    background-color: #f8f9fa;
                    min-height: 100vh;
                    overflow-x: hidden;
                }

                .container {
                    margin: 0 auto;
                    padding: 0 20px;
                    overflow-x: hidden;
                }

                .member-author-hero {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(
                        135deg,
                        #0f4c20 0%,
                        #1b7a3a 52%,
                        #34a853 100%
                    );
                    color: white;
                }

                .member-hero-shape {
                    position: absolute;
                    border-radius: 999px;
                    pointer-events: none;
                    opacity: 0.1;
                    background: radial-gradient(
                        circle,
                        #d4f8e4 0%,
                        transparent 70%
                    );
                }

                .shape-one {
                    top: -110px;
                    left: -110px;
                    width: 390px;
                    height: 390px;
                }

                .shape-two {
                    bottom: -100px;
                    right: -100px;
                    width: 340px;
                    height: 340px;
                }

                .member-hero-pattern {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.05;
                    background: repeating-linear-gradient(
                        45deg,
                        #fff 0,
                        #fff 1px,
                        transparent 1px,
                        transparent 24px
                    );
                }

                .member-gold-line {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        #f0c040,
                        #fde68a,
                        #f0c040,
                        transparent
                    );
                }

                .member-gold-line.top {
                    margin-bottom: 34px;
                }

                .member-gold-line.bottom {
                    margin-top: 40px;
                }

                .member-hero-container {
                    position: relative;
                    z-index: 2;
                    padding-top: 18px;
                    padding-bottom: 8px;
                }

                .member-verified-strip {
                    width: fit-content;
                    margin: 0 auto 52px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 20px;
                    border-radius: 999px;
                    background: rgba(240, 192, 64, 0.1);
                    border: 1px solid rgba(240, 192, 64, 0.3);
                    backdrop-filter: blur(8px);
                }

                .verified-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .verified-text {
                    color: #fde68a;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                }

                .verified-dot {
                    color: rgba(240, 192, 64, 0.45);
                    font-size: 20px;
                    line-height: 1;
                }

                .verified-year {
                    color: rgba(253, 230, 138, 0.75);
                    font-size: 12px;
                    font-weight: 600;
                }

                .member-author-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 34px;
                    margin-bottom: 38px;
                }

                .member-avatar-wrap {
                    position: relative;
                    flex: 0 0 auto;
                }

                .member-avatar-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 999px;
                    transform: scale(1.3);
                    background: radial-gradient(
                        circle,
                        rgba(240, 192, 64, 0.38) 0%,
                        transparent 70%
                    );
                    animation: memberPulse 2.4s infinite;
                }

                @keyframes memberPulse {
                    0%,
                    100% {
                        opacity: 0.7;
                        transform: scale(1.18);
                    }

                    50% {
                        opacity: 1;
                        transform: scale(1.34);
                    }
                }

                .member-avatar-ring {
                    position: relative;
                    border-radius: 999px;
                    padding: 3px;
                    background: linear-gradient(
                        135deg,
                        #f0c040,
                        #fde68a,
                        #b8860b,
                        #fde68a,
                        #f0c040
                    );
                }

                .member-avatar {
                    width: 120px;
                    height: 120px;
                    border-radius: 999px;
                    overflow: hidden;
                    background: #0f4c20;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .member-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .member-avatar span {
                    font-size: 50px;
                    font-weight: 900;
                    color: white;
                }

                .member-crown {
                    position: absolute;
                    top: -14px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 34px;
                    height: 34px;
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f0c040, #fde68a);
                    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
                }

                .member-info {
                    flex: 1;
                    min-width: 0;
                    color: white;
                }

                .member-name-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    margin-bottom: 12px;
                }

                .member-name-row h1 {
                    margin: 0;
                    font-size: clamp(28px, 4vw, 44px);
                    line-height: 1.08;
                    font-weight: 950;
                    text-transform: uppercase;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    background: linear-gradient(
                        90deg,
                        #ffffff 0%,
                        #fde68a 50%,
                        #ffffff 100%
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .member-bio {
                    max-width: 620px;
                    margin: 0 0 14px;
                    color: rgba(255, 255, 255, 0.86);
                    font-size: 16px;
                    line-height: 1.7;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }

                .member-website {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #fde68a;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }

                .member-website:hover {
                    color: #ffffff;
                    text-decoration: underline;
                }

                .member-follow-btn {
                    border: 0;
                    padding: 10px 24px;
                    border-radius: 999px;
                    font-weight: 900;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #f0c040, #fde68a);
                    color: #7c5500;
                    box-shadow: 0 10px 26px rgba(240, 192, 64, 0.3);
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .member-follow-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 32px rgba(240, 192, 64, 0.42);
                }

                .member-follow-btn.following {
                    background: rgba(255, 255, 255, 0.14);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.32);
                    box-shadow: none;
                }

                .member-follow-btn:disabled,
                .normal-follow-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .member-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 18px;
                }

                .member-stat-card {
                    position: relative;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    padding: 18px;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(240, 192, 64, 0.25);
                    backdrop-filter: blur(10px);
                    transition: transform 0.2s ease;
                }

                .member-stat-card:hover {
                    transform: translateY(-4px);
                }

                .member-stat-line {
                    position: absolute;
                    top: 0;
                    left: 18px;
                    right: 18px;
                    height: 1px;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(240, 192, 64, 0.65),
                        transparent
                    );
                }

                .member-stat-icon {
                    flex: 0 0 auto;
                    width: 50px;
                    height: 50px;
                    border-radius: 999px;
                    background: rgba(240, 192, 64, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fde68a;
                    font-size: 19px;
                }

                .member-stat-content {
                    min-width: 0;
                }

                .member-stat-content h3 {
                    margin: 0;
                    color: white;
                    font-size: 22px;
                    font-weight: 900;
                    line-height: 1.1;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .member-stat-content p {
                    margin: 4px 0 0;
                    color: rgba(255, 255, 255, 0.66);
                    font-size: 12px;
                    font-weight: 800;
                }

                .author-hero-section {
                    background: linear-gradient(
                        135deg,
                        #1b7a3a 0%,
                        #34a853 100%
                    );
                    color: white;
                    padding: 60px 0 40px;
                }

                .author-hero-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 40px;
                    gap: 18px;
                    width: 100%;
                    min-width: 0;
                }

                .author-avatar-large {
                    flex: 0 0 auto;
                }

                .avatar-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    flex: 0 0 auto;
                    overflow: hidden;
                }

                .avatar-circle img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .avatar-circle span {
                    font-size: 48px;
                    font-weight: bold;
                    color: #1b7a3a;
                }

                .author-info {
                    min-width: 0;
                    width: 100%;
                }

                .normal-name-row {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 10px;
                }

                .author-name {
                    font-size: 36px;
                    font-weight: 800;
                    margin: 0;
                    text-transform: uppercase;
                    max-width: 100%;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .author-bio {
                    font-size: 18px;
                    opacity: 0.9;
                    max-width: 600px;
                    margin: 0 auto 15px;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .author-website {
                    color: white;
                    text-decoration: none;
                    opacity: 0.85;
                    transition: opacity 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    max-width: 100%;
                    white-space: normal;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .author-website:hover {
                    opacity: 1;
                    text-decoration: underline;
                    color: white;
                }

                .normal-follow-btn {
                    border: none;
                    padding: 10px 24px;
                    border-radius: 999px;
                    font-weight: 900;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: #ffffff;
                    color: #1b7a3a;
                    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .normal-follow-btn:hover {
                    transform: translateY(-2px);
                    background: #f5f7fb;
                }

                .normal-follow-btn.following {
                    background: rgba(255, 255, 255, 0.14);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    box-shadow: none;
                }

                .author-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                    margin: 0 auto;
                    width: 100%;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 10px;
                    padding: 18px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: transform 0.3s;
                    min-width: 0;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                }

                .stat-icon {
                    width: 50px;
                    height: 50px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex: 0 0 auto;
                }

                .stat-content {
                    min-width: 0;
                }

                .stat-content h3 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.1;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .stat-content p {
                    margin: 5px 0 0;
                    opacity: 0.8;
                    font-size: 14px;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .posts-section {
                    padding: 60px 20px;
                }

                .posts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                    min-width: 0;
                }

                .section-title {
                    font-size: 28px;
                    color: #333;
                    margin: 0;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                    max-width: 100%;
                }

                .sort-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .sort-label {
                    color: #666;
                    font-weight: 500;
                }

                .sort-select {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background: white;
                    cursor: pointer;
                    outline: none;
                    transition: border-color 0.3s;
                }

                .sort-select:focus {
                    border-color: #1b7a3a;
                }

                .posts-grid {
                    display: grid;
                    gap: 30px;
                    margin-bottom: 40px;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                }

                .post-card {
                    background: white;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    transition:
                        transform 0.3s,
                        box-shadow 0.3s;
                    min-width: 0;
                }

                .post-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
                }

                .post-image-container {
                    position: relative;
                    height: 200px;
                    overflow: hidden;
                }

                .post-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s;
                    display: block;
                }

                .post-card:hover .post-image {
                    transform: scale(1.05);
                }

                .post-image-placeholder {
                    width: 100%;
                    height: 100%;
                    background: #f5f5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                }

                .post-category-tag {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    background: #1b7a3a;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    font-weight: 600;
                    max-width: calc(100% - 30px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .post-content {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    padding: 20px;
                    min-width: 0;
                }

                .post-meta {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                    font-size: 13px;
                    color: #666;
                    flex-wrap: wrap;
                    row-gap: 8px;
                    min-width: 0;
                }

                .post-meta i {
                    margin-right: 5px;
                }

                .post-title {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    line-height: 1.4;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }

                .post-title a {
                    color: #333;
                    text-decoration: none;
                    transition: color 0.3s;
                }

                .post-title a:hover {
                    color: #1b7a3a;
                }

                .post-excerpt {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    word-break: break-word;
                    overflow-wrap: anywhere;
                }

                .post-footer {
                    margin-top: auto;
                }

                .read-more-btn {
                    display: inline-block;
                    background: #1b7a3a;
                    color: white;
                    padding: 8px 20px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background 0.3s;
                }

                .read-more-btn:hover {
                    background: #155d28;
                    color: white;
                }

                .load-more-container {
                    text-align: center;
                    margin-top: 40px;
                    margin-bottom: 40px;
                }

                .load-more-btn {
                    background: white;
                    color: #1b7a3a;
                    border: 2px solid #1b7a3a;
                    padding: 12px 30px;
                    border-radius: 5px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    max-width: 100%;
                }

                .load-more-btn:hover:not(:disabled) {
                    background: #1b7a3a;
                    color: white;
                }

                .load-more-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .no-posts-message {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                }

                .no-posts-message i {
                    font-size: 52px;
                    color: #d1d5db;
                    margin-bottom: 16px;
                }

                .no-posts-message h3 {
                    font-size: 24px;
                    margin-bottom: 10px;
                    color: #333;
                }

                @media (min-width: 768px) {
                    .author-hero-content {
                        flex-direction: row;
                        text-align: left;
                        align-items: center;
                        justify-content: flex-start;
                        gap: 0;
                    }

                    .avatar-circle {
                        margin-bottom: 0;
                        margin-right: 30px;
                    }

                    .author-info {
                        width: auto;
                    }

                    .normal-name-row {
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        gap: 18px;
                    }

                    .author-bio {
                        margin-left: 0;
                        margin-right: 0;
                    }

                    .author-stats-grid {
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }
                }

                @media (min-width: 1024px) {
                    .posts-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 991px) {
                    .member-author-content {
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                    }

                    .member-name-row {
                        flex-direction: column;
                        justify-content: center;
                    }

                    .member-bio {
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .member-stats-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }

                    .member-stat-card {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                @media (max-width: 640px) {
                    .posts-section {
                        padding: 40px 12px;
                    }

                    .posts-header {
                        align-items: flex-start;
                    }

                    .sort-controls {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .sort-select {
                        flex: 1;
                    }
                }

                @media (max-width: 420px) {
                    .container {
                        padding: 0 12px;
                    }

                    .member-gold-line.top {
                        margin-bottom: 24px;
                    }

                    .member-verified-strip {
                        flex-wrap: wrap;
                        justify-content: center;
                        text-align: center;
                        margin-bottom: 34px;
                    }

                    .member-avatar,
                    .avatar-circle {
                        width: 96px;
                        height: 96px;
                    }

                    .member-avatar span,
                    .avatar-circle span {
                        font-size: 38px;
                    }

                    .member-stats-grid,
                    .author-stats-grid {
                        gap: 12px;
                    }

                    .member-stat-card,
                    .stat-card {
                        padding: 14px;
                        gap: 12px;
                    }

                    .member-stat-icon,
                    .stat-icon {
                        width: 44px;
                        height: 44px;
                    }

                    .member-stat-content h3,
                    .stat-content h3 {
                        font-size: 18px;
                    }

                    .author-hero-section {
                        padding: 44px 0 28px;
                    }

                    .author-name {
                        font-size: 28px;
                    }

                    .author-bio {
                        font-size: 15px;
                    }

                    .section-title {
                        font-size: 22px;
                    }

                    .posts-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                    }

                    .post-image-container {
                        height: 180px;
                    }

                    .post-content {
                        padding: 16px;
                    }

                    .load-more-btn {
                        width: 100%;
                        padding: 12px 16px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
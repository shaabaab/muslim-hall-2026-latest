// resources/js/Pages/Front/AuthorProfile.jsx
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, Link, usePage } from "@inertiajs/react";
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
    isFollowing: initialIsFollowing,
}) {
    const { props } = usePage();

    const [sortBy, setSortBy] = useState("latest");
    const [filteredPosts, setFilteredPosts] = useState(posts?.data || []);
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(
        stats?.total_followers || 0,
    );
    const [followBtnLoading, setFollowBtnLoading] = useState(false);
    console.log("authors profile", author);
    // Handle Follow/Unfollow
    const handleFollow = async () => {
        if (!auth?.user) {
            // Redirect to login or show modal
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
    // const isMember = auth?.user?.subscriptions?.length > 0;
    console.log(author.id);
    console.log(props);
    console.log("checking if member", isMember);
    // Check if the AUTHOR is a member/premium user
    // const isAuthorMember =
    //     author?.subscriptions?.length > 0 ||
    //     author?.is_member === true ||
    //     author?.membership_status === "active";

    // Format date utility
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Sort posts
    const sortPosts = (items, sortType) => {
        const sorted = [...(items || [])];
        switch (sortType) {
            case "latest":
                return sorted.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at),
                );
            case "oldest":
                return sorted.sort(
                    (a, b) => new Date(a.created_at) - new Date(b.created_at),
                );
            case "popular":
                return sorted.sort(
                    (a, b) => (b.viewer_count || 0) - (a.viewer_count || 0),
                );
            case "title_asc":
                return sorted.sort((a, b) =>
                    (a.title || "").localeCompare(b.title || ""),
                );
            case "title_desc":
                return sorted.sort((a, b) =>
                    (b.title || "").localeCompare(a.title || ""),
                );
            default:
                return sorted;
        }
    };

    // Handle sort change
    useEffect(() => {
        setFilteredPosts(sortPosts(posts?.data || [], sortBy));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, posts?.data]);

    // Get media type for a post
    const getMediaType = (post) => {
        if (post?.content) return "content";
        if (post?.pdf) return "pdf";
        if (post?.video || post?.video_url) return "video";
        if (post?.audio) return "audio";
        return "none";
    };
    console.log("author image", author?.photo);
    // Render media icon
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

    // Load more posts (responsive-safe, no mutation of props)
    const loadMorePosts = async () => {
        const nextUrl = posts?.next_page_url;
        if (!nextUrl || loading) return;

        try {
            setLoading(true);
            const res = await axios.get(nextUrl);

            const payload = res?.data?.posts || res?.data;
            const more = payload?.data || [];
            const next = payload?.next_page_url || null;

            const merged = [...filteredPosts, ...more];
            setFilteredPosts(sortPosts(merged, sortBy));

            setNextPageUrl(next);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const [nextPageUrl, setNextPageUrl] = useState(
        posts?.next_page_url || null,
    );
    useEffect(() => {
        setNextPageUrl(posts?.next_page_url || null);
    }, [posts?.next_page_url]);

    return (
        <FrontAuthenticatedLayout>
            <Head title={(author?.name || "Author") + " - Author Profile"} />

            <Header />

            <div className="author-profile-page">
                {isMember ? (
                    <>
                        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f4c20] via-[#1b7a3a] to-[#34a853]">
                            {/* Decorative shimmer rings */}
                            <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 bg-[radial-gradient(circle,#a8f0c6_0%,transparent_70%)]" />
                            <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-[radial-gradient(circle,#d4f8e4_0%,transparent_70%)]" />
                            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 bg-[repeating-linear-gradient(45deg,#fff_0px,#fff_1px,transparent_1px,transparent_24px)]" />

                            {/* Gold accent bar at very top */}
                            <div className="w-full mb-5 h-1 bg-[linear-gradient(90deg,transparent,#f0c040,#fde68a,#f0c040,transparent)]" />

                            <div className="container px-5 py-[60px] pb-12">
                                {/* Verified identity strip */}
                                <div className="flex  mb-20 items-center justify-center ">
                                    <div className="flex items-center gap-3 px-5 py-1 rounded-full bg-[rgba(240,192,64,0.10)] backdrop-blur-sm border border-[rgba(240,192,64,0.30)]">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                fill="#f0c040"
                                                opacity="0.9"
                                            />
                                            <path
                                                d="M8 12.5l2.5 2.5 5.5-5.5"
                                                stroke="#7c5500"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#fde68a]">
                                            Established Author
                                        </span>
                                        <span className="text-[20px] leading-none -mt-0.5 text-[rgba(240,192,64,0.45)]">
                                            ·
                                        </span>
                                        <span className="text-xs font-medium text-[rgba(253,230,138,0.70)]">
                                            Since{" "}
                                            {author?.created_at
                                                ? new Date(
                                                      author.created_at,
                                                  ).getFullYear()
                                                : stats?.join_date
                                                      ?.split(" ")
                                                      .pop() || "—"}
                                        </span>
                                    </div>
                                </div>

                                {/* Hero content row */}
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-0 text-center md:text-left mb-10">
                                    {/* Avatar with gold ring */}
                                    <div className="flex-shrink-0 relative">
                                        {/* Outer glow ring */}
                                        <div className="absolute inset-0 rounded-full animate-pulse scale-[1.3] bg-[radial-gradient(circle,rgba(240,192,64,0.4)_0%,transparent_70%)]" />
                                        {/* Gold border ring */}
                                        <div className="relative rounded-full md:mr-8 p-[3px] bg-[linear-gradient(135deg,#f0c040,#fde68a,#b8860b,#fde68a,#f0c040)]">
                                            <div className="rounded-full overflow-hidden w-[120px] h-[120px] bg-[#0f4c20]">
                                                {author?.photo ? (
                                                    <img
                                                        src={
                                                            author?.photo
                                                                ? getS3PublicUrl(
                                                                      author?.photo,
                                                                  )
                                                                : null
                                                        }
                                                        alt={
                                                            author?.name ||
                                                            "Author"
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-5xl font-bold text-white">
                                                            {(
                                                                author?.name ||
                                                                "A"
                                                            ).charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Crown icon */}
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full shadow-lg bg-[linear-gradient(135deg,#f0c040,#fde68a)]">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="#7c5500"
                                            >
                                                <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5zm0 3h14v2H5v-2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Author info */}
                                    <div className="min-w-0 w-full md:w-auto text-white flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                            <h1 className="font-bold leading-tight break-words [overflow-wrap:anywhere] uppercase bg-[linear-gradient(90deg,#ffffff_0%,#fde68a_50%,#ffffff_100%)] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] text-[clamp(28px,4vw,40px)]">
                                                {author?.name}
                                            </h1>

                                            {auth?.user?.id !== author.id && (
                                                <button
                                                    onClick={handleFollow}
                                                    disabled={followBtnLoading}
                                                    className={`px-6 py-2 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                                                        isFollowing
                                                            ? "bg-[rgba(255,255,255,0.15)] text-white border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.25)]"
                                                            : "bg-[linear-gradient(135deg,#f0c040,#fde68a)] text-[#7c5500] shadow-[0_4px_15px_rgba(240,192,64,0.3)] hover:shadow-[0_6px_20px_rgba(240,192,64,0.4)]"
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
                                            <p className="text-base mb-4 max-w-xl leading-relaxed text-[rgba(255,255,255,0.85)] break-words [overflow-wrap:anywhere]">
                                                {author.bio}
                                            </p>
                                        )}

                                        {author?.website && (
                                            <a
                                                href={author.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100 transition-opacity text-[#fde68a] break-words [overflow-wrap:anywhere]"
                                            >
                                                <i className="fas fa-globe" />
                                                {author.website}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                                    {[
                                        {
                                            icon: "fas fa-newspaper",
                                            value: stats?.total_posts ?? 0,
                                            label: "Total Posts",
                                        },
                                        {
                                            icon: "fas fa-eye",
                                            value: Number(
                                                stats?.total_views || 0,
                                            ).toLocaleString(),
                                            label: "Total Views",
                                        },
                                        {
                                            icon: "fas fa-users",
                                            value: Number(
                                                followersCount || 0,
                                            ).toLocaleString(),
                                            label: "Followers",
                                        },
                                        {
                                            icon: "fas fa-calendar-alt",
                                            value: stats?.join_date || "—",
                                            label: "Joined",
                                        },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="relative rounded-xl flex md:flex-row flex-col justify-center items-center gap-3 transition-transform hover:-translate-y-1 bg-[rgba(255,255,255,0.08)] backdrop-blur-md border border-[rgba(240,192,64,0.25)] md:p-[18px] p-2 min-w-0"
                                        >
                                            {/* Gold shimmer top border */}
                                            <div className="absolute top-0 left-4 right-4 h-px rounded-full bg-[linear-gradient(90deg,transparent,rgba(240,192,64,0.6),transparent)]" />
                                            <div className="flex-shrink-0 flex  items-center justify-center rounded-full w-12 h-12 bg-[rgba(240,192,64,0.15)]">
                                                <i
                                                    className={`${item.icon}  text-lg text-[#fde68a]`}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="m-0 font-bold md:text-left text-center leading-tight text-white break-words [overflow-wrap:anywhere] text-[clamp(16px,2.5vw,22px)]">
                                                    {item.value}
                                                </h3>
                                                <p className="mt-1 font-bold md:text-left text-center text-xs text-[rgba(255,255,255,0.65)]">
                                                    {item.label}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Gold accent bar at bottom */}
                            <div className="w-full mt-10 h-1 bg-[linear-gradient(90deg,transparent,#f0c040,#fde68a,#f0c040,transparent)]" />
                        </div>
                    </>
                ) : (
                    // normal hero for non-members
                    <div className="author-hero-section">
                        <div className="container">
                            <div className="author-hero-content">
                                <div className="author-avatar-large">
                                    <div className="avatar-circle">
                                        {author?.avatar ? (
                                            <img
                                                src={
                                                    author?.photo
                                                        ? getS3PublicUrl(
                                                              author?.photo,
                                                          )
                                                        : null
                                                }
                                                alt={author?.name || "Author"}
                                            />
                                        ) : (
                                            <span>
                                                {(author?.name || "A").charAt(
                                                    0,
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="author-info flex-1">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                                        <h1 className="author-name uppercase mb-0">
                                            {author?.name}
                                        </h1>

                                        {auth?.user?.id !== author.id && (
                                            <button
                                                onClick={handleFollow}
                                                disabled={followBtnLoading}
                                                className={`px-6 py-2 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                                                    isFollowing
                                                        ? "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                                                        : "bg-[#1b7a3a] text-white shadow-lg hover:bg-[#155d2c]"
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
                                        <p className="author-bio">
                                            {author.bio}
                                        </p>
                                    )}

                                    {author?.website && (
                                        <a
                                            href={author.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="author-website"
                                        >
                                            <i className="fas fa-globe mr-2" />
                                            {author.website}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Author Stats */}
                            <div className="author-stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <i className="fas fa-newspaper" />
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stats?.total_posts ?? 0}</h3>
                                        <p>Total Posts</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <i className="fas fa-eye" />
                                    </div>
                                    <div className="stat-content">
                                        <h3>
                                            {Number(
                                                stats?.total_views || 0,
                                            ).toLocaleString()}
                                        </h3>
                                        <p>Total Views</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <i className="fas fa-users" />
                                    </div>
                                    <div className="stat-content">
                                        <h3>
                                            {Number(
                                                followersCount || 0,
                                            ).toLocaleString()}
                                        </h3>
                                        <p>Followers</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <i className="fas fa-calendar-alt" />
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stats?.join_date || "—"}</h3>
                                        <p>Joined</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Posts Section — unchanged */}
                <div className="container posts-section">
                    <div className="posts-header mt-10">
                        <h2 className="section-title">
                            Posts by {author?.name}
                        </h2>
                    </div>

                    {/* Posts Grid */}
                    {filteredPosts.length > 0 ? (
                        <>
                            <div className="posts-grid">
                                {filteredPosts.map((post) => (
                                    <div key={post.id} className="post-card">
                                        {/* Post Image */}
                                        <Link
                                            href={route(
                                                "post-detail",
                                                post.slug,
                                            )}
                                            className="post-image-link"
                                        >
                                            <div className="post-image-container">
                                                {post.thumbnail ? (
                                                    <img
                                                        src={getS3PublicUrl(
                                                            post?.thumbnail,
                                                        )}
                                                        alt={post.title}
                                                        loading="lazy"
                                                        className="w-full aspect-[16/9] object-cover rounded-xl"
                                                    />
                                                ) : (
                                                    <div className="post-image-placeholder">
                                                        {renderMediaIcon(post)}
                                                    </div>
                                                )}

                                                <div className="post-category-tag">
                                                    {post?.category?.name}
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Post Content */}
                                        <div className="post-content">
                                            <div className="post-meta">
                                                <span className="post-date">
                                                    <i className="far fa-clock" />{" "}
                                                    {formatDate(
                                                        post.created_at,
                                                    )}
                                                </span>

                                                <span className="post-views">
                                                    <i className="fas fa-eye" />{" "}
                                                    {post.viewer_count}
                                                </span>

                                                <span className="post-media-type">
                                                    {renderMediaIcon(post)}
                                                </span>
                                            </div>

                                            <h3 className="post-title">
                                                <Link
                                                    href={route(
                                                        "post-detail",
                                                        post.slug,
                                                    )}
                                                >
                                                    {post.title}
                                                </Link>
                                            </h3>

                                            <p className="post-excerpt">
                                                {post.content
                                                    ? post.content
                                                          .replace(
                                                              /<[^>]*>/g,
                                                              "",
                                                          )
                                                          .substring(0, 120) +
                                                      "..."
                                                    : "No content available"}
                                            </p>

                                            <div className="post-footer">
                                                <Link
                                                    href={route(
                                                        "post-detail",
                                                        post.slug,
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

                            {/* Load More Button */}
                            {nextPageUrl && (
                                <div className="load-more-container mb-10">
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
                            <i className="fas fa-newspaper text-5xl text-gray-300 mb-4" />
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
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    overflow-x: hidden;
                }

                @media (max-width: 420px) {
                    .container {
                        padding: 0 12px;
                    }
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

                @media (max-width: 420px) {
                    .author-hero-section {
                        padding: 44px 0 28px;
                    }
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

                @media (min-width: 768px) {
                    .author-hero-content {
                        flex-direction: row;
                        text-align: left;
                        align-items: center;
                        justify-content: flex-start;
                        gap: 0;
                    }
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

                @media (min-width: 768px) {
                    .avatar-circle {
                        margin-bottom: 0;
                        margin-right: 30px;
                    }
                }

                @media (max-width: 420px) {
                    .avatar-circle {
                        width: 96px;
                        height: 96px;
                    }
                    .avatar-circle span {
                        font-size: 38px;
                    }
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

                @media (min-width: 768px) {
                    .author-info {
                        width: auto;
                    }
                }

                .author-name {
                    font-size: 36px;
                    font-weight: 700;
                    margin-bottom: 10px;
                    max-width: 100%;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .author-bio {
                    font-size: 18px;
                    opacity: 0.9;
                    max-width: 600px;
                    margin-bottom: 15px;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                @media (max-width: 420px) {
                    .author-name {
                        font-size: 28px;
                    }
                    .author-bio {
                        font-size: 15px;
                    }
                }

                .author-website {
                    color: white;
                    text-decoration: none;
                    opacity: 0.85;
                    transition: opacity 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    max-width: 100%;
                    white-space: normal;
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                .author-website:hover {
                    opacity: 1;
                    text-decoration: underline;
                }

                .author-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                    margin: 0 auto;
                    width: 100%;
                }

                @media (min-width: 768px) {
                    .author-stats-grid {
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }
                }

                @media (max-width: 420px) {
                    .author-stats-grid {
                        gap: 12px;
                    }
                    .stat-card {
                        padding: 14px;
                        gap: 12px;
                    }
                    .stat-icon {
                        width: 44px;
                        height: 44px;
                    }
                    .stat-content h3 {
                        font-size: 18px;
                    }
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

                @media (max-width: 640px) {
                    .posts-section {
                        padding: 40px 12px;
                    }
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

                @media (max-width: 420px) {
                    .section-title {
                        font-size: 22px;
                    }
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

                @media (min-width: 1024px) {
                    .posts-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (max-width: 380px) {
                    .posts-grid {
                        grid-template-columns: 1fr;
                        gap: 18px;
                    }
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

                @media (max-width: 420px) {
                    .post-image-container {
                        height: 180px;
                    }
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
                .post-footer {
                    margin-top: auto;
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

                @media (max-width: 420px) {
                    .post-content {
                        padding: 16px;
                    }
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
                }

                .load-more-container {
                    text-align: center;
                    margin-top: 40px;
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

                @media (max-width: 420px) {
                    .load-more-btn {
                        width: 100%;
                        padding: 12px 16px;
                    }
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

                .no-posts-message h3 {
                    font-size: 24px;
                    margin-bottom: 10px;
                    color: #333;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

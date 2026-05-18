import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, router, usePage } from "@inertiajs/react";
import { Col, message, Row } from "antd";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function ContestDetails() {
    const { contests, auth, flash, contestCategory } = usePage().props;
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedContest, setSelectedContest] = useState(null);
    const [reviewText, setReviewText] = useState("");
    const [decision, setDecision] = useState("");
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState({
        review: false,
        entry: false,
        initial: true,
    });
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [filteredContests, setFilteredContests] = useState([]);
    const [expandedContest, setExpandedContest] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileActiveTab, setMobileActiveTab] = useState("overview");

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Filter contests by category
    useEffect(() => {
        if (contests && contests.length > 0) {
            if (selectedCategory === "all") {
                setFilteredContests(contests);
            } else {
                const filtered = contests.filter(
                    (contest) =>
                        contest.category_id?.toString() === selectedCategory ||
                        contest.category?.id?.toString() === selectedCategory,
                );
                setFilteredContests(filtered);
            }
        }
    }, [contests, selectedCategory]);

    // Select first contest by default from filtered contests
    useEffect(() => {
        if (filteredContests && filteredContests.length > 0) {
            setSelectedContest(filteredContests[0]);
        } else if (contests && contests.length > 0) {
            setSelectedContest(contests[0]);
        }
        setLoading((prev) => ({ ...prev, initial: false }));
    }, [filteredContests, contests]);

    // Vote handler
    const handleVote = (entryId) => {
        router.post(
            route("user.entries.vote", entryId),
            {},
            {
                preserveState: true,
                onSuccess: () => {
                    message.success("Vote submitted successfully!");
                },
                onError: (errors) => {
                    message.error(errors.error || "Failed to submit vote.");
                },
            },
        );
    };

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, "success");
        }
        if (flash?.error) {
            showToast(flash.error, "error");
        }
    }, [flash]);

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "" }),
            4000,
        );
    }, []);

    // Format date
    const formatDate = useCallback((dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    // Format time remaining
    const getTimeRemaining = useCallback((endDate) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return "Ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );

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

    // Handle category change
    const handleCategoryChange = useCallback((categoryId) => {
        setSelectedCategory(categoryId);
        setExpandedContest(null);
        setMobileActiveTab("overview");
    }, []);

    // Get category name by ID
    const getCategoryName = useCallback(
        (categoryId) => {
            if (categoryId === "all") return "All Contests";
            const category = contestCategory?.find(
                (cat) => cat.id.toString() === categoryId,
            );
            return category?.name || "General";
        },
        [contestCategory],
    );

    // Handle review submission
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim() || !rating || !auth?.user) return;

        setLoading((prev) => ({ ...prev, review: true }));

        try {
            const response = await axios.post("/user/contest/reviews", {
                contest_id: selectedContest.id,
                review: reviewText.trim(),
                rating: rating,
                decision: decision,
            });

            if (response.data && response.data.success) {
                setReviewText("");
                setDecision("");
                setRating(0);
                showToast("Review submitted successfully!", "success");
                if (response.data.contest) {
                    setSelectedContest(response.data.contest);
                }
                window.location.reload();
            } else {
                throw new Error(
                    response.data?.message || "Failed to submit review",
                );
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            const message =
                error.response?.data?.error ||
                error.message ||
                "Failed to submit review";
            showToast(message, "error");
        } finally {
            setLoading((prev) => ({ ...prev, review: false }));
        }
    };

    // Handle entry submission
    const handleEntrySubmit = async (contestId) => {
        if (!auth?.user) {
            showToast("Please login to enter contest", "error");
            return;
        }

        setLoading((prev) => ({ ...prev, entry: true }));

        try {
            const response = await axios.post("/user/contest/entries", {
                contest_id: contestId,
            });

            if (response.data && response.data.success) {
                showToast(
                    "Entry successful! Go to the dashboard to complete your contest details.",
                    "success",
                );
                if (response.data.contest) {
                    setSelectedContest(response.data.contest);
                    window.location.reload();
                }
            } else {
                throw new Error(
                    response.data?.message || "Failed to enter contest",
                );
            }
        } catch (error) {
            console.error("Error entering contest:", error);
            const message =
                error.response?.data?.error ||
                error.message ||
                "Failed to enter contest";
            showToast(message, "error");
        } finally {
            setLoading((prev) => ({ ...prev, entry: false }));
        }
    };

    // Toggle contest expansion on mobile
    const toggleContestExpansion = (contest) => {
        if (expandedContest === contest.id) {
            setExpandedContest(null);
            setMobileActiveTab("overview");
        } else {
            setExpandedContest(contest.id);
            setSelectedContest(contest);
            setMobileActiveTab("overview");
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
                        className={`star-btn ${readonly ? "readonly" : ""}`}
                    >
                        <i
                            className={`fas ${star <= rating ? "fa-star text-warning" : "fa-star text-gray-400"}`}
                        ></i>
                    </button>
                ))}
            </div>
        );
    };

    // Sponsor card component
    const SponsorCard = ({ sponsor }) => {
        return (
            <div className="sponsor-card">
                <div className="sponsor-image">
                    {sponsor.banner ? (
                        <img
                            src={`/storage/${sponsor.banner}`}
                            alt={sponsor.name}
                        />
                    ) : (
                        <i className="fas fa-building"></i>
                    )}
                </div>
                <div className="sponsor-info">
                    <h4>{sponsor?.sponsor.name}</h4>
                    <p className="sponsor-type">
                        {sponsor?.sponsor.email || "Official Sponsor"}
                    </p>
                    <p className="sponsor-type">
                        {sponsor?.sponsor.phone}{" "}
                        {sponsor?.sponsor.phone_alternative &&
                            `| ${sponsor?.sponsor.phone_alternative}`}
                    </p>
                    <p>
                        {sponsor?.sponsor.website && (
                            <a
                                href={sponsor?.sponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sponsor-website"
                            >
                                <i className="fas fa-globe"></i> Visit Website
                            </a>
                        )}
                    </p>
                    {sponsor?.sponsor.email_verified_at && (
                        <div className="verification-badge">
                            <i className="fas fa-check-circle"></i>
                            <span>Verified Sponsor</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Mobile Contest Card
    const MobileContestCard = ({ contest }) => {
        const isExpanded = expandedContest === contest.id;
        const progress = getProgressPercentage(contest);
        const timeRemaining = getTimeRemaining(contest.end_date);
        const totalEntries = contest.entries?.length || 0;
        const totalReviews = contest.reviews?.length || 0;
        const category = contest.category?.name || "General";

        const averageRating =
            Array.isArray(contest.reviews) && contest.reviews.length > 0
                ? (
                      contest.reviews.reduce((sum, review) => {
                          return sum + (Number(review.rating) || 0);
                      }, 0) / contest.reviews.length
                  ).toFixed(1)
                : 0;

        return (
            <a
                href={`/contests-details/${contest.id}`}
                className="block no-underline"
            >
                <div
                    className={`relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 ${isExpanded ? "ring-2 ring-green-500" : ""}`}
                >
                    {/* Top accent bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-600" />

                    <div className="p-4">
                        {/* Category + Rating */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                {category}
                            </span>
                            <div className="flex items-center gap-1">
                                <i className="fas fa-star text-xs text-amber-400" />
                                <span className="text-xs font-semibold text-gray-700">
                                    {averageRating}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-[15px] font-bold text-gray-900 leading-snug mb-3 line-clamp-2">
                            {contest.title}
                        </h4>

                        {/* Entries + Time */}
<div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-500">
            <i className="fas fa-users text-xs text-green-500" />
            <span className="text-xs">
                {totalEntries} entries
            </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500">
            <i className="far fa-eye"></i>
            <span className="text-xs">{contest.viewer_count ?? 0}</span>
        </div>
    </div>

    <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
            timeRemaining === "Ended" ? "text-red-500" : "text-gray-500"
        }`}
    >
        <i
            className={`fas fa-clock text-xs ${
                timeRemaining === "Ended" ? "text-red-400" : "text-green-500"
            }`}
        />
        {timeRemaining}
    </div>
</div>
                        {/* Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400">
                                    Progress
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Footer: Prize + CTA */}
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                            <div>
                                <div className="text-base font-bold text-gray-900">
                                    {contest.prizes?.[0]?.amount ||
                                        "Cash Prize"}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Top Prize
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                <span>View Details</span>
                                <i className="fas fa-arrow-right text-[10px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        );
    };

    // Desktop Contest Card - Same as before
    const DesktopContestCard = ({ contest, isActive, onClick }) => {
        const progress = getProgressPercentage(contest);
        const timeRemaining = getTimeRemaining(contest.end_date);
        const totalEntries = contest.entries?.length || 0;
        const totalReviews = contest.reviews?.length || 0;
        const category = contest.category?.name || "General";
        const subCategory = contest.category?.parent?.name || "General";

        const averageRating =
            Array.isArray(contest.reviews) && contest.reviews.length > 0
                ? (
                      contest.reviews.reduce((sum, review) => {
                          return sum + (Number(review.rating) || 0);
                      }, 0) / contest.reviews.length
                  ).toFixed(1)
                : 0;

        return (
            <div
                className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${isActive ? "ring-2 ring-green-500" : ""}`}
                onClick={onClick}
            >
                <a
                    href={`/contests-details/${contest.id}`}
                    className="block no-underline"
                >
                    {/* Top accent bar */}
                    <div className="h-[2px] mx-auto w-11/12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-t-2xl" />

                    <div className="p-4">
                        {/* Category + Rating */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                    {category}
                                </span>
                                {contest.category?.parent && (
                                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                        {contest.category?.parent?.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                <i className="fas fa-star text-xs text-amber-400" />
                                <span className="text-xs font-semibold text-gray-700">
                                    {averageRating}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-[15px] font-bold text-gray-900 leading-snug mb-3 line-clamp-2">
                            {contest.title}
                        </h4>

                        {/* Entries + Time */}
                     <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-500">
            <i className="fas fa-users text-xs text-green-500" />
            <span className="text-xs">{totalEntries} entries</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500">
            <i className="far fa-eye"></i>
            <span className="text-xs">{contest.viewer_count ?? 0}</span>
        </div>
    </div>

    <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
            timeRemaining === "Ended" ? "text-red-500" : "text-gray-500"
        }`}
    >
        <i
            className={`fas fa-clock text-xs ${
                timeRemaining === "Ended" ? "text-red-400" : "text-green-500"
            }`}
        />
        {timeRemaining}
    </div>
</div>
                        {/* Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-400">
                                    Progress
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Prize */}
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                            <div>
                                <div className="text-base font-bold text-gray-900">
                                    {contest.prizes?.[0]?.amount ||
                                        "Cash Prize"}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Top Prize
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                <span>View Details</span>
                                <i className="fas fa-arrow-right text-[10px]" />
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        );
    };

    // Category tabs component
    const CategoryTabs = () => {
        return (
            <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
                {/* Header */}
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-green-500 rounded-full" />
                    <span className="text-sm font-bold tracking-wide text-green-800 uppercase">
                        Filter by Category
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2.5">
                    {/* All Contests */}
                    <button
                        className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            selectedCategory === "all"
                                ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                                : "bg-white text-green-700 border border-green-200 hover:border-green-400 hover:bg-green-50 hover:shadow-sm"
                        }`}
                        onClick={() => handleCategoryChange("all")}
                    >
                        <i
                            className={`fas fa-th-large text-xs ${
                                selectedCategory === "all"
                                    ? "text-green-100"
                                    : "text-green-400 group-hover:text-green-500"
                            }`}
                        />
                        All Contests
                        <span
                            className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg text-xs font-bold ${
                                selectedCategory === "all"
                                    ? "bg-green-400/50 text-white"
                                    : "bg-green-100 text-green-600 group-hover:bg-green-200"
                            }`}
                        >
                            {contests?.length || 0}
                        </span>
                    </button>

                    {/* Category Buttons */}
                    {contestCategory?.map((category) => {
                        const count =
                            contests?.filter(
                                (contest) =>
                                    contest.category_id?.toString() ===
                                        category.id.toString() ||
                                    contest.category?.id?.toString() ===
                                        category.id.toString(),
                            ).length || 0;

                        const isActive =
                            selectedCategory === category.id.toString();

                        return (
                            <button
                                key={category.id}
                                className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    isActive
                                        ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                                        : "bg-white text-green-700 border border-green-200 hover:border-green-400 hover:bg-green-50 hover:shadow-sm"
                                }`}
                                onClick={() =>
                                    handleCategoryChange(category.id.toString())
                                }
                            >
                                <i
                                    className={`fas fa-tag text-xs ${
                                        isActive
                                            ? "text-green-100"
                                            : "text-green-400 group-hover:text-green-500"
                                    }`}
                                />
                                {category.name}
                                <span
                                    className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-lg text-xs font-bold ${
                                        isActive
                                            ? "bg-green-400/50 text-white"
                                            : "bg-green-100 text-green-600 group-hover:bg-green-200"
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (!contests || contests.length === 0) {
        return (
            <>
                <Head>
                    <title>Active Contests - Muslim Hall</title>
                    <meta
                        name="description"
                        content="Participate in exciting contests and win amazing prizes"
                    />
                </Head>

                <FrontAuthenticatedLayout>
                    <Header />
                    <div
                        className="no-contests-section"
                        style={{
                            marginTop: "20px",
                            textAlign: "center",
                            padding: "60px 0",
                        }}
                    >
                        <div className="container">
                            <div className="no-contests-content">
                                <i
                                    style={{
                                        fontSize: "100px",
                                        color: "#2E7B48",
                                    }}
                                    className="fas fa-trophy"
                                ></i>
                                <h1
                                    style={{
                                        color: "#2E7B48",
                                        fontFamily: "Arial, sans-serif",
                                        paddingTop: "20px",
                                    }}
                                >
                                    No Active Contests
                                </h1>
                                <p
                                    style={{
                                        color: "#555",
                                        fontFamily: "Arial, sans-serif",
                                    }}
                                >
                                    There are currently no running contests.
                                    Check back later!
                                </p>
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
                <meta
                    name="description"
                    content="Participate in exciting contests and win amazing prizes"
                />
            </Head>

            <FrontAuthenticatedLayout>
                <Header />

                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <i
                            className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`}
                        ></i>
                        <span>{toast.message}</span>
                    </div>
                )}

                <div className="content-section">
                    <div className="container">
                        {/* Header Section */}
                        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                            <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                                Active Contests
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 mb-5">
                                Select a contest to view details and participate
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1 border-l-4 border-green-500 pl-3 py-1">
                                    <div className="text-2xl font-extrabold text-gray-900 leading-none">
                                        {filteredContests.length}
                                    </div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                        Active
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 border-l-4 border-green-500 pl-3 py-1">
                                    <div className="text-2xl font-extrabold text-gray-900 leading-none">
                                        {filteredContests.reduce(
                                            (sum, contest) =>
                                                sum +
                                                (contest.entries?.length || 0),
                                            0,
                                        )}
                                    </div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                        Entries
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 border-l-4 border-green-500 pl-3 py-1">
                                    <div className="text-2xl font-extrabold text-gray-900 leading-none">
                                        {filteredContests.reduce(
                                            (sum, contest) =>
                                                sum +
                                                (contest.prizes?.length || 0),
                                            0,
                                        )}
                                    </div>
                                    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                                        Prizes
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="category-section">
                            <CategoryTabs />
                        </div>

                        {isMobile ? (
                            /* MOBILE VIEW - Stacked expandable cards */
                            <div className="mobile-contests-view">
                                <div className="mobile-category-info">
                                    <h4>{getCategoryName(selectedCategory)}</h4>
                                    <p>
                                        Showing {filteredContests.length}{" "}
                                        contest(s)
                                    </p>
                                </div>

                                <div className="mobile-contests-list">
                                    {filteredContests.map((contest) => (
                                        <MobileContestCard
                                            key={contest.id}
                                            contest={contest}
                                        />
                                    ))}
                                </div>

                                {filteredContests.length === 0 && (
                                    <div className="no-contests-in-category">
                                        <i className="fas fa-search"></i>
                                        <h4>No contests found</h4>
                                        <p>
                                            There are no contests in this
                                            category at the moment.
                                        </p>
                                        <button
                                            className="btn-outline"
                                            onClick={() =>
                                                setSelectedCategory("all")
                                            }
                                        >
                                            View All Contests
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* DESKTOP VIEW - Original sidebar + details layout */
                            <>
                                {/* Sidebar with filtered contests */}
                                <div className="contests-sidebar">
                                    <div className="px-4 py-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-base font-bold text-gray-900 leading-tight">
                                                    {getCategoryName(
                                                        selectedCategory,
                                                    )}
                                                </h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {filteredContests.length > 0
                                                        ? "Select a contest to view details"
                                                        : "No contests available"}
                                                </p>
                                            </div>
                                            <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg leading-none mt-0.5">
                                                {filteredContests.length}
                                            </span>
                                        </div>
                                    </div>
                                    <Row gutter={[24, 24]}>
                                        {filteredContests.map((contest) => (
                                            <Col
                                                key={contest.id}
                                                md={8}
                                                sm={24}
                                                xs={24}
                                            >
                                                <DesktopContestCard
                                                    contest={contest}
                                                    isActive={
                                                        selectedContest?.id ===
                                                        contest.id
                                                    }
                                                    onClick={() =>
                                                        setSelectedContest(
                                                            contest,
                                                        )
                                                    }
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                    {filteredContests.length === 0 && (
                                        <div className="no-contests-in-category">
                                            <i className="fas fa-search"></i>
                                            <h4>No contests found</h4>
                                            <p>
                                                There are no contests in this
                                                category at the moment.
                                            </p>
                                            <button
                                                className="btn-outline"
                                                onClick={() =>
                                                    setSelectedCategory("all")
                                                }
                                            >
                                                View All Contests
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* ------------------------- */}

                                {/* <div className="contests-layout">
                                    
                                    <div className="contest-details-main">
                                        {selectedContest && (
                                            <div className="contest-details">
                                            
                                                <div className="contest-header">
                                                    <div className="contest-header-content">
                                                        <div className="contest-badges">
                                                            <span className="contest-category-badge">
                                                                {selectedContest
                                                                    .category
                                                                    ?.name ||
                                                                    "General"}
                                                            </span>
                                                            {selectedContest
                                                                .category
                                                                ?.parent && (
                                                                <div className="contest-category">
                                                                    {
                                                                        selectedContest
                                                                            .category
                                                                            ?.parent
                                                                            ?.name
                                                                    }
                                                                </div>
                                                            )}
                                                            <span className="contest-rating-badge">
                                                                <i className="fas fa-star"></i>
                                                                {Array.isArray(
                                                                    selectedContest.reviews,
                                                                ) &&
                                                                selectedContest
                                                                    .reviews
                                                                    .length > 0
                                                                    ? (
                                                                          selectedContest.reviews.reduce(
                                                                              (
                                                                                  sum,
                                                                                  review,
                                                                              ) => {
                                                                                  return (
                                                                                      sum +
                                                                                      (Number(
                                                                                          review.rating,
                                                                                      ) ||
                                                                                          0)
                                                                                  );
                                                                              },
                                                                              0,
                                                                          ) /
                                                                          selectedContest
                                                                              .reviews
                                                                              .length
                                                                      ).toFixed(
                                                                          1,
                                                                      )
                                                                    : "New"}
                                                            </span>
                                                        </div>
                                                        <h1>
                                                            {
                                                                selectedContest.title
                                                            }
                                                        </h1>
                                                        <p className="contest-creator">
                                                            by{" "}
                                                            {selectedContest
                                                                .creator
                                                                ?.name ||
                                                                "Unknown Creator"}
                                                        </p>
                                                    </div>
                                                    <div className="contest-prize-display">
                                                        <div className="grand-prize">
                                                            {selectedContest
                                                                .prizes?.[0]
                                                                ?.amount ||
                                                                "Cash Prize"}
                                                        </div>
                                                        <div className="prize-label">
                                                            Grand Prize
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="contest-stats">
                                                    <div className="stat-card">
                                                        <div className="stat-number">
                                                            {selectedContest
                                                                .entries
                                                                ?.length || 0}
                                                        </div>
                                                        <div className="stat-label">
                                                            <i className="fas fa-users "></i>{" "}
                                                            Entries
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-number">
                                                            {selectedContest
                                                                .reviews
                                                                ?.length || 0}
                                                        </div>
                                                        <div className="stat-label">
                                                            <i className="fas fa-comment"></i>
                                                            Reviews
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-number time-remaining">
                                                            {getTimeRemaining(
                                                                selectedContest.end_date,
                                                            )}
                                                        </div>
                                                        <div className="stat-label">
                                                            <i className="fas fa-clock"></i>
                                                            Time Left
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-number">
                                                            {selectedContest
                                                                .prizes
                                                                ?.length || 0}
                                                        </div>
                                                        <div className="stat-label">
                                                            <i className="fas fa-trophy"></i>
                                                            Prizes
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="contest-progress">
                                                    <div className="progress-info">
                                                        <span>
                                                            Contest Progress
                                                        </span>
                                                        <span>
                                                            {formatDate(
                                                                selectedContest.start_date,
                                                            )}{" "}
                                                            -{" "}
                                                            {formatDate(
                                                                selectedContest.end_date,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${getProgressPercentage(selectedContest)}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>

              
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() =>
                                                            handleEntrySubmit(
                                                                selectedContest.id,
                                                            )
                                                        }
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
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "prizes",
                                                            )
                                                        }
                                                        className="btn-outline"
                                                    >
                                                        <i className="fas fa-trophy"></i>
                                                        View Prizes
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "entries",
                                                            )
                                                        }
                                                        className="btn-outline"
                                                    >
                                                        <i className="fas fa-users"></i>
                                                        View Entries (
                                                        {selectedContest.entries
                                                            ?.length || 0}
                                                        )
                                                    </button>
                                                </div>

                                                <div className="tabs-navigation">
                                                    <button
                                                        className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "overview",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-info-circle"></i>
                                                        Overview
                                                    </button>
                                                    <button
                                                        className={`tab-btn ${activeTab === "prizes" ? "active" : ""}`}
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "prizes",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-trophy"></i>
                                                        Prizes
                                                    </button>
                                                    <button
                                                        className={`tab-btn ${activeTab === "entries" ? "active" : ""}`}
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "entries",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-users"></i>
                                                        Entries
                                                    </button>
                                                    <button
                                                        className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "reviews",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-comment"></i>
                                                        Reviews
                                                    </button>
                                                    <button
                                                        className={`tab-btn ${activeTab === "sponsors" ? "active" : ""}`}
                                                        onClick={() =>
                                                            setActiveTab(
                                                                "sponsors",
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-handshake"></i>
                                                        Sponsors
                                                    </button>
                                                </div>

                                                <div className="tab-content">
                                                  
                                                    {activeTab ===
                                                        "overview" && (
                                                        <div className="tab-pane active">
                                                            <div className="content-card">
                                                                <h3>
                                                                    Contest
                                                                    Description
                                                                </h3>
                                                                <div
                                                                    className="contest-description"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: selectedContest.description,
                                                                    }}
                                                                ></div>

                                                                <div className="details-grid">
                                                                    <div className="details-column">
                                                                        <h4>
                                                                            Contest
                                                                            Details
                                                                        </h4>
                                                                        <div className="details-list">
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    Start
                                                                                    Date
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {formatDate(
                                                                                        selectedContest.start_date,
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    End
                                                                                    Date
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {formatDate(
                                                                                        selectedContest.end_date,
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    Category
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {selectedContest
                                                                                        .category
                                                                                        ?.name ||
                                                                                        "General"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    Total
                                                                                    Entries
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {selectedContest
                                                                                        .entries
                                                                                        ?.length ||
                                                                                        0}
                                                                                </span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    Participations
                                                                                    Fee
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {selectedContest.payment_type ==
                                                                                    "paid"
                                                                                        ? "Paid (" +
                                                                                          selectedContest.amount +
                                                                                          ") tk only"
                                                                                        : "Free (0.00)"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="detail-item">
                                                                                <span className="label">
                                                                                    Participations
                                                                                    Access
                                                                                    :
                                                                                </span>
                                                                                <span className="value">
                                                                                    {selectedContest.user_type ==
                                                                                    "all"
                                                                                        ? "All Users"
                                                                                        : selectedContest.user_type}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="details-column">
                                                                        <h4>
                                                                            Rules
                                                                            &
                                                                            Guidelines
                                                                        </h4>
                                                                        <div className="rules-list">
                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    If
                                                                                    you
                                                                                    participate
                                                                                    in
                                                                                    the
                                                                                    contest,
                                                                                    you
                                                                                    agree
                                                                                    to
                                                                                    the
                                                                                    rules
                                                                                </span>
                                                                            </div>

                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    If
                                                                                    you
                                                                                    only
                                                                                    vote
                                                                                    for
                                                                                    the
                                                                                    contest
                                                                                    you
                                                                                    have
                                                                                    to
                                                                                    log
                                                                                    in
                                                                                    first,
                                                                                    If
                                                                                    you
                                                                                    want
                                                                                    to
                                                                                    Vote
                                                                                    ?
                                                                                    Click
                                                                                    the
                                                                                    Button!{" "}
                                                                                    <Link
                                                                                        href={`/user/${selectedContest.id}/entries/contests`}
                                                                                        className="vote-link"
                                                                                    >
                                                                                        Vote
                                                                                    </Link>
                                                                                </span>
                                                                            </div>
                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    Follow
                                                                                    all
                                                                                    contest
                                                                                    guidelines
                                                                                </span>
                                                                            </div>
                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    Submit
                                                                                    before
                                                                                    the
                                                                                    deadline
                                                                                </span>
                                                                            </div>
                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    Original
                                                                                    work
                                                                                    only
                                                                                </span>
                                                                            </div>
                                                                            <div className="rule-item">
                                                                                <i className="fas fa-check-circle"></i>
                                                                                <span>
                                                                                    Respect
                                                                                    community
                                                                                    guidelines
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                
                                                    {activeTab === "prizes" && (
                                                        <div className="tab-pane active">
                                                            <div className="content-card">
                                                                <h3>
                                                                    Contest
                                                                    Prizes
                                                                </h3>
                                                                <div className="prizes-list">
                                                                    {selectedContest.prizes?.map(
                                                                        (
                                                                            prize,
                                                                            index,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="prize-item"
                                                                            >
                                                                                <div className="prize-content">
                                                                                    <div className="prize-position">
                                                                                        {
                                                                                            prize.position
                                                                                        }
                                                                                    </div>
                                                                                    <div className="prize-amount">
                                                                                        Registered
                                                                                        User:{" "}
                                                                                        {
                                                                                            prize.amount_normal_user
                                                                                        }{" "}
                                                                                        ||
                                                                                        Premium
                                                                                        User:{" "}
                                                                                        {
                                                                                            prize.amount_premium_user
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div className="prize-icon">
                                                                                    <i className="fas fa-trophy"></i>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    
                                                    {activeTab ===
                                                        "entries" && (
                                                        <div className="tab-pane active">
                                                            <div className="content-card">
                                                                <h3>
                                                                    Contest
                                                                    Entries (
                                                                    {selectedContest
                                                                        .entries
                                                                        ?.length ||
                                                                        0}
                                                                    )
                                                                </h3>
                                                                <p className="-mt-5">
                                                                    <Link
                                                                        href={`/user/${selectedContest?.id}/entries/contests`}
                                                                    >
                                                                        View All
                                                                        Entries
                                                                    </Link>
                                                                </p>

                                                                {auth?.user ? (
                                                                    <div className="entries-list">
                                                                        {selectedContest.entries &&
                                                                        selectedContest
                                                                            .entries
                                                                            .length >
                                                                            0 ? (
                                                                            selectedContest.entries
                                                                                .slice(
                                                                                    -5,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        entry,
                                                                                        index,
                                                                                    ) => {
                                                                                        const userVoted =
                                                                                            auth?.user &&
                                                                                            entry?.votes?.some(
                                                                                                (
                                                                                                    vote,
                                                                                                ) =>
                                                                                                    Number(
                                                                                                        vote.user_id,
                                                                                                    ) ===
                                                                                                    Number(
                                                                                                        auth
                                                                                                            ?.user
                                                                                                            ?.id,
                                                                                                    ),
                                                                                            );

                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    entry.id
                                                                                                }
                                                                                                className="entry-item"
                                                                                            >
                                                                                                <div className="entry-rank">
                                                                                                    #
                                                                                                    {index +
                                                                                                        1}
                                                                                                </div>
                                                                                                <div className="entry-info">
                                                                                                    <h5>
                                                                                                        <a
                                                                                                            style={{
                                                                                                                color: "#1b7a3a",
                                                                                                            }}
                                                                                                            href={`/user/entries/${entry.id}`}
                                                                                                        >
                                                                                                            {entry.title ||
                                                                                                                "Anonymous"}
                                                                                                        </a>
                                                                                                    </h5>
                                                                                                    <p className="entry-title">
                                                                                                        {entry
                                                                                                            .user
                                                                                                            ?.name ||
                                                                                                            "Anonymous"}{" "}
                                                                                                        ({" "}
                                                                                                        <strong>
                                                                                                            Total
                                                                                                            Votes:
                                                                                                        </strong>{" "}
                                                                                                        {entry.total_votes ||
                                                                                                            0}

                                                                                                        )
                                                                                                    </p>
                                                                                                    <p>
                                                                                                        Submitted
                                                                                                        on{" "}
                                                                                                        {formatDate(
                                                                                                            entry.created_at,
                                                                                                        )}
                                                                                                    </p>
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            handleVote(
                                                                                                                entry.id,
                                                                                                            )
                                                                                                        }
                                                                                                        className="vote-button rounded-full px-2 py-1 text-white font-semibold text-sm mt-2"
                                                                                                        style={{
                                                                                                            backgroundColor:
                                                                                                                userVoted
                                                                                                                    ? "#4caf50"
                                                                                                                    : "#1b7a3a",
                                                                                                        }}
                                                                                                        disabled={
                                                                                                            userVoted
                                                                                                        }
                                                                                                    >
                                                                                                        <i className="fas fa-thumbs-up"></i>
                                                                                                        Vote{" "}
                                                                                                        {userVoted ? (
                                                                                                            <Tag>
                                                                                                                {" "}
                                                                                                                You
                                                                                                                voted
                                                                                                            </Tag>
                                                                                                        ) : (
                                                                                                            ""
                                                                                                        )}
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )
                                                                        ) : (
                                                                            <div className="no-entries">
                                                                                <i className="fas fa-users"></i>
                                                                                <p>
                                                                                    No
                                                                                    entries
                                                                                    yet.
                                                                                    Be
                                                                                    the
                                                                                    first
                                                                                    to
                                                                                    participate!
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="login-prompt">
                                                                        <p>
                                                                            Please{" "}
                                                                            <Link href="/login">
                                                                                login
                                                                            </Link>{" "}
                                                                            to
                                                                            view
                                                                            entries.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {activeTab ===
                                                        "reviews" && (
                                                        <div className="tab-pane active">
                                                            <div className="content-card">
                                                                <h3>
                                                                    Contest
                                                                    Reviews (
                                                                    {selectedContest
                                                                        .reviews
                                                                        ?.length ||
                                                                        0}
                                                                    )
                                                                </h3>

                                                               
                                                                {auth?.user ? (
                                                                    <div className="review-form">
                                                                        <h4>
                                                                            Write
                                                                            a
                                                                            Review
                                                                        </h4>
                                                                        <form
                                                                            onSubmit={
                                                                                handleReviewSubmit
                                                                            }
                                                                        >
                                                                            <div className="rating-section">
                                                                                <label>
                                                                                    Your
                                                                                    Rating
                                                                                </label>
                                                                                <StarRating
                                                                                    rating={
                                                                                        rating
                                                                                    }
                                                                                    onRatingChange={
                                                                                        setRating
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div className=" mb-3 rounded">
                                                                                <label className="text-gray-700">
                                                                                    Your
                                                                                    Decision
                                                                                </label>
                                                                                <select
                                                                                    value={
                                                                                        decision
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setDecision(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    className="rounded mt-2 text-[#333]"
                                                                                >
                                                                                    <option value="">
                                                                                        Select
                                                                                        Your
                                                                                        Decision
                                                                                    </option>
                                                                                    <option value="1">
                                                                                        Like
                                                                                    </option>
                                                                                    <option value="2">
                                                                                        Dislike
                                                                                    </option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="review-textarea">
                                                                                <textarea
                                                                                    value={
                                                                                        reviewText
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        setReviewText(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    placeholder="Share your experience with this contest..."
                                                                                    rows="4"
                                                                                    required
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                type="submit"
                                                                                disabled={
                                                                                    loading.review ||
                                                                                    !reviewText.trim() ||
                                                                                    !rating
                                                                                }
                                                                                className="btn-primary"
                                                                            >
                                                                                {loading.review ? (
                                                                                    <>
                                                                                        <i className="fas fa-spinner fa-spin"></i>
                                                                                        Submitting...
                                                                                    </>
                                                                                ) : (
                                                                                    "Submit Review"
                                                                                )}
                                                                            </button>
                                                                        </form>
                                                                    </div>
                                                                ) : (
                                                                    <div className="login-prompt">
                                                                        <p>
                                                                            Please{" "}
                                                                            <Link href="/login">
                                                                                login
                                                                            </Link>{" "}
                                                                            to
                                                                            write
                                                                            a
                                                                            review.
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="reviews-list">
                                                                    {selectedContest.reviews &&
                                                                    selectedContest
                                                                        .reviews
                                                                        .length >
                                                                        0 ? (
                                                                        selectedContest.reviews
                                                                            .slice(
                                                                                -5,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    review,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            review.id
                                                                                        }
                                                                                        className="review-item"
                                                                                    >
                                                                                        <div className="review-header">
                                                                                            <div className="reviewer-info">
                                                                                                <h5>
                                                                                                    {review
                                                                                                        .reviewer
                                                                                                        ?.name ||
                                                                                                        "Anonymous"}{" "}
                                                                                                    (
                                                                                                    {review.decision ==
                                                                                                    1
                                                                                                        ? "Like"
                                                                                                        : "Dislike"}

                                                                                                    )
                                                                                                </h5>
                                                                                                <p>
                                                                                                    {formatDate(
                                                                                                        review.created_at,
                                                                                                    )}
                                                                                                </p>
                                                                                            </div>
                                                                                            <StarRating
                                                                                                rating={
                                                                                                    review.rating
                                                                                                }
                                                                                                readonly={
                                                                                                    true
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                        <p className="review-content">
                                                                                            {
                                                                                                review.comments
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                    ) : (
                                                                        <div className="no-reviews">
                                                                            <i className="fas fa-comment"></i>
                                                                            <p>
                                                                                No
                                                                                reviews
                                                                                yet.
                                                                                Be
                                                                                the
                                                                                first
                                                                                to
                                                                                share
                                                                                your
                                                                                thoughts!
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                   
                                                    {activeTab ===
                                                        "sponsors" && (
                                                        <div className="tab-pane active">
                                                            <div className="content-card">
                                                                <h3>
                                                                    Contest
                                                                    Sponsors
                                                                </h3>

                                                                {selectedContest?.contest_sponsor &&
                                                                selectedContest
                                                                    .contest_sponsor
                                                                    .length >
                                                                    0 ? (
                                                                    <div className="sponsors-section">
                                                                        <div className="sponsors-grid">
                                                                            {selectedContest.contest_sponsor.map(
                                                                                (
                                                                                    sponsor,
                                                                                    index,
                                                                                ) => (
                                                                                    <SponsorCard
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        sponsor={
                                                                                            sponsor
                                                                                        }
                                                                                    />
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="no-sponsors">
                                                                        <i className="fas fa-handshake"></i>
                                                                        <h4>
                                                                            No
                                                                            Sponsors
                                                                            Yet
                                                                        </h4>
                                                                        <p>
                                                                            This
                                                                            contest
                                                                            currently
                                                                            doesn't
                                                                            have
                                                                            any
                                                                            sponsors.
                                                                            Check
                                                                            back
                                                                            later
                                                                            for
                                                                            updates!
                                                                        </p>

                                                                        <div className="sponsorship-opportunity">
                                                                            <h5>
                                                                                Interested
                                                                                in
                                                                                Sponsoring?
                                                                            </h5>
                                                                            <p>
                                                                                Contact
                                                                                us
                                                                                to
                                                                                become
                                                                                a
                                                                                sponsor
                                                                                and
                                                                                support
                                                                                our
                                                                                community
                                                                                events.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div> */}
                            </>
                        )}
                    </div>
                </div>

                <Footer />

                <style jsx>{`
                    /* =========================================== */
                    /* COMMON STYLES */
                    /* =========================================== */

                    .content-section {
                        padding: 40px 0;
                        background-color: #f9f9f9;
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
                        font-weight: 700;
                    }

                    .sidebar-header p {
                        color: #666;
                        font-size: 1.1rem;
                    }

                    .hero-stats {
                        display: flex;
                        justify-content: center;
                        gap: 2rem;
                        text-align: center;
                        width: 100%;
                        margin-top: 1.5rem;
                    }

                    .stat-item {
                        text-align: center;
                        background: white;
                        padding: 1.5rem 1rem;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        min-width: 120px;
                    }

                    .stat-number {
                        font-size: 2rem;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                    }

                    .stat-label {
                        color: #666;
                        font-size: 0.9rem;
                        font-weight: 600;
                    }

                    /* Category Tabs */
                    .category-section {
                        margin-bottom: 2rem;
                    }

                    .category-tabs {
                        background: white;
                        border-radius: 15px;
                        padding: 1.5rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    .category-tabs-header {
                        margin-bottom: 1rem;
                    }

                    .category-tabs-header h4 {
                        color: #1b7a3a;
                        margin: 0;
                        font-size: 1.2rem;
                    }

                    .category-tabs-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }

                    .category-tab {
                        background: #f8f9fa;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 0.75rem 1rem;
                        color: #666;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        flex: 1;
                        min-width: 150px;
                        justify-content: flex-start;
                    }

                    .category-tab:hover {
                        border-color: #1b7a3a;
                        color: #1b7a3a;
                    }

                    .category-tab.active {
                        background: #1b7a3a;
                        border-color: #1b7a3a;
                        color: white;
                    }

                    .category-count {
                        background: rgba(255, 255, 255, 0.2);
                        padding: 0.2rem 0.5rem;
                        border-radius: 12px;
                        font-size: 0.8rem;
                        margin-left: auto;
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
                        animation: slideIn 0.3s ease;
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

                    .toast-notification.success {
                        background: #28a745;
                    }

                    .toast-notification.error {
                        background: #dc3545;
                    }

                    /* =========================================== */
                    /* MOBILE VIEW STYLES */
                    /* =========================================== */

                    @media (max-width: 767px) {
                        .mobile-contests-view {
                            display: block;
                        }

                        .contests-sidebar,
                        .contests-layout {
                            display: none !important;
                        }

                        .hero-stats {
                            flex-direction: column;
                            align-items: center;
                            gap: 1rem;
                        }

                        .stat-item {
                            width: 100%;
                            max-width: 200px;
                        }

                        .category-tabs-list {
                            flex-direction: column;
                        }

                        .category-tab {
                            min-width: 100%;
                            justify-content: center;
                        }
                    }

                    .mobile-category-info {
                        background: white;
                        border-radius: 12px;
                        padding: 1.5rem;
                        margin-bottom: 1.5rem;
                        text-align: center;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    .mobile-category-info h4 {
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                        font-size: 1.3rem;
                    }

                    .mobile-category-info p {
                        color: #666;
                        margin: 0;
                        font-size: 0.9rem;
                    }

                    .mobile-contests-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }

                    /* Mobile Contest Card */
                    .mobile-contest-card {
                        background: white;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                        transition: all 0.3s ease;
                    }

                    .mobile-contest-card.expanded {
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
                    }

                    .mobile-contest-header {
                        padding: 1.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        background: white;
                        border-bottom: 1px solid #f0f0f0;
                    }

                    .mobile-contest-basic {
                        flex: 1;
                    }

                    .mobile-contest-category {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        margin-bottom: 0.75rem;
                    }

                    .category-badge {
                        background: #1b7a3a;
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    }

                    .mobile-contest-rating {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        color: #ffc107;
                        font-weight: 600;
                        font-size: 0.9rem;
                    }

                    .mobile-contest-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 0.75rem;
                        line-height: 1.4;
                    }

                    .mobile-contest-meta {
                        display: flex;
                        gap: 1rem;
                        font-size: 0.85rem;
                        color: #666;
                    }

                    .mobile-contest-entries,
                    .mobile-contest-time {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                    }

                    .mobile-contest-time.ended {
                        color: #dc3545;
                    }

                    .mobile-expand-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        margin-left: 0.5rem;
                        color: #666;
                        transition: transform 0.3s ease;
                        flex-shrink: 0;
                    }

                    .mobile-contest-card.expanded .mobile-expand-icon {
                        transform: rotate(180deg);
                    }

                    /* Mobile Contest Details (Expanded) */
                    .mobile-contest-details {
                        padding: 1.5rem;
                        background: #f8f9fa;
                    }

                    .mobile-progress-section {
                        margin-bottom: 1.5rem;
                    }

                    .mobile-progress-info {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                        color: #666;
                    }

                    .mobile-progress-bar {
                        background: #e0e0e0;
                        border-radius: 10px;
                        height: 6px;
                        overflow: hidden;
                    }

                    .mobile-progress-fill {
                        background: #1b7a3a;
                        height: 100%;
                        border-radius: 10px;
                        transition: width 0.3s ease;
                    }

                    /* Mobile Action Buttons */
                    .mobile-action-buttons {
                        display: flex;
                        gap: 0.75rem;
                        margin-bottom: 1.5rem;
                    }

                    .mobile-btn-primary,
                    .mobile-btn-outline {
                        flex: 1;
                        padding: 1rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        font-size: 0.95rem;
                        border: none;
                    }

                    .mobile-btn-primary {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                    }

                    .mobile-btn-primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    }

                    .mobile-btn-primary:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .mobile-btn-outline {
                        background: transparent;
                        color: #1b7a3a;
                        border: 2px solid #1b7a3a;
                    }

                    .mobile-btn-outline:hover {
                        background: #1b7a3a;
                        color: white;
                    }

                    /* Mobile Tabs Navigation */
                    .mobile-tabs-navigation {
                        display: flex;
                        overflow-x: auto;
                        gap: 0.25rem;
                        margin-bottom: 1.5rem;
                        padding-bottom: 0.5rem;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }

                    .mobile-tabs-navigation::-webkit-scrollbar {
                        display: none;
                    }

                    .mobile-tab-btn {
                        flex-shrink: 0;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        background: transparent;
                        border: none;
                        color: #666;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.25rem;
                        font-size: 0.8rem;
                        min-width: 70px;
                    }

                    .mobile-tab-btn:hover {
                        background: #f0f0f0;
                    }

                    .mobile-tab-btn.active {
                        background: #1b7a3a;
                        color: white;
                    }

                    .mobile-tab-btn i {
                        font-size: 1.1rem;
                        margin-bottom: 0.25rem;
                    }

                    /* Mobile Tab Content */
                    .mobile-tab-content {
                        animation: fadeIn 0.3s ease;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }

                    .mobile-content-card {
                        background: white;
                        border-radius: 12px;
                        padding: 1.5rem;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }

                    .mobile-content-card h5 {
                        color: #1b7a3a;
                        margin-bottom: 1rem;
                        font-size: 1.1rem;
                        font-weight: 600;
                    }

                    .mobile-content-card h6 {
                        color: #333;
                        margin-bottom: 0.75rem;
                        font-size: 1rem;
                        font-weight: 600;
                    }

                    /* Mobile Overview Content */
                    .mobile-contest-description {
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 1.5rem;
                        font-size: 0.9rem;
                    }

                    .mobile-details-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }

                    .mobile-details-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .mobile-detail-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid #e0e0e0;
                        font-size: 0.9rem;
                    }

                    .mobile-detail-item:last-child {
                        border-bottom: none;
                    }

                    .mobile-label {
                        color: #666;
                        font-weight: 500;
                    }

                    .mobile-value {
                        color: #333;
                        font-weight: 600;
                        text-align: right;
                    }

                    .mobile-rules-list {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 1rem;
                    }

                    .mobile-rules-list h6 {
                        color: #333;
                        margin-bottom: 0.75rem;
                        font-size: 0.95rem;
                    }

                    .mobile-rule-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.5rem;
                        padding: 0.5rem 0;
                        color: #666;
                        font-size: 0.85rem;
                        line-height: 1.4;
                    }

                    .mobile-rule-item i {
                        color: #28a745;
                        margin-top: 0.15rem;
                    }

                    /* Mobile Prizes */
                    .mobile-prizes-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .mobile-prize-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }

                    .mobile-prize-content {
                        flex: 1;
                    }

                    .mobile-prize-position {
                        font-size: 1rem;
                        font-weight: 700;
                        color: #1b7a3a;
                        margin-bottom: 0.25rem;
                    }

                    .mobile-prize-amount {
                        color: #666;
                        font-size: 0.85rem;
                    }

                    .mobile-prize-icon i {
                        font-size: 1.5rem;
                        color: #ffc107;
                    }

                    /* Mobile Entries */
                    .mobile-view-all {
                        margin-bottom: 1rem;
                    }

                    .mobile-view-all-link {
                        color: #1b7a3a;
                        font-weight: 600;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                        font-size: 0.9rem;
                    }

                    .mobile-view-all-link:hover {
                        text-decoration: underline;
                    }

                    .mobile-entries-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .mobile-entry-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 1rem;
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }

                    .mobile-entry-rank {
                        background: #1b7a3a;
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 0.9rem;
                        flex-shrink: 0;
                    }

                    .mobile-entry-info {
                        flex: 1;
                    }

                    .mobile-entry-link {
                        color: #1b7a3a;
                        font-size: 0.95rem;
                        font-weight: 600;
                        text-decoration: none;
                    }

                    .mobile-entry-link:hover {
                        text-decoration: underline;
                    }

                    .mobile-entry-subtitle {
                        color: #666;
                        font-size: 0.85rem;
                        margin: 0.25rem 0;
                    }

                    .mobile-entry-date {
                        color: #999;
                        font-size: 0.8rem;
                        margin-bottom: 0.5rem;
                    }

                    .mobile-vote-button {
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        color: white;
                        font-weight: 600;
                        border: none;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.85rem;
                    }

                    .mobile-vote-button:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .mobile-no-entries {
                        text-align: center;
                        padding: 2rem 1rem;
                        color: #666;
                    }

                    .mobile-no-entries i {
                        font-size: 2rem;
                        color: #ccc;
                        margin-bottom: 0.5rem;
                    }

                    /* Mobile Reviews */
                    .mobile-review-form {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 1rem;
                        margin-bottom: 1.5rem;
                    }

                    .mobile-review-form h6 {
                        margin-bottom: 1rem;
                    }

                    .mobile-rating-section {
                        margin-bottom: 1rem;
                    }

                    .mobile-rating-section label {
                        display: block;
                        color: #666;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }

                    .mobile-decision-section {
                        margin-bottom: 1rem;
                    }

                    .mobile-decision-section label {
                        display: block;
                        color: #666;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }

                    .mobile-decision-select {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        background: white;
                    }

                    .mobile-review-textarea textarea {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #e0e0e0;
                        border-radius: 6px;
                        font-size: 0.9rem;
                        resize: vertical;
                        min-height: 100px;
                        font-family: inherit;
                        margin-bottom: 1rem;
                    }

                    .mobile-submit-review-btn {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        font-weight: 600;
                        border: none;
                        cursor: pointer;
                        width: 100%;
                    }

                    .mobile-submit-review-btn:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    .mobile-reviews-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .mobile-review-item {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 1rem;
                        border: 1px solid #e0e0e0;
                    }

                    .mobile-review-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.75rem;
                    }

                    .mobile-reviewer-info h6 {
                        margin-bottom: 0.25rem;
                        font-size: 0.95rem;
                    }

                    .mobile-review-date {
                        color: #999;
                        font-size: 0.8rem;
                    }

                    .mobile-review-content {
                        color: #666;
                        line-height: 1.5;
                        font-size: 0.9rem;
                        margin: 0;
                    }

                    .mobile-no-reviews {
                        text-align: center;
                        padding: 2rem 1rem;
                        color: #666;
                    }

                    .mobile-no-reviews i {
                        font-size: 2rem;
                        color: #ccc;
                        margin-bottom: 0.5rem;
                    }

                    /* Mobile Sponsors */
                    .mobile-sponsors-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .mobile-sponsor-card {
                        display: flex;
                        gap: 1rem;
                        background: #f8f9fa;
                        padding: 1rem;
                        border-radius: 8px;
                        border: 1px solid #e0e0e0;
                    }

                    .mobile-sponsor-image {
                        width: 80px;
                        height: 80px;
                        border-radius: 8px;
                        overflow: hidden;
                        background: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .mobile-sponsor-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .mobile-sponsor-image i {
                        font-size: 2rem;
                        color: #ccc;
                    }

                    .mobile-sponsor-info {
                        flex: 1;
                    }

                    .mobile-sponsor-info h6 {
                        margin-bottom: 0.25rem;
                    }

                    .mobile-sponsor-type {
                        color: #666;
                        font-size: 0.85rem;
                        margin-bottom: 0.25rem;
                    }

                    .mobile-sponsor-website {
                        color: #1b7a3a;
                        text-decoration: none;
                        font-size: 0.85rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                    }

                    .mobile-sponsor-website:hover {
                        text-decoration: underline;
                    }

                    .mobile-verification-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                        background: #10b981;
                        color: white;
                        padding: 0.25rem 0.5rem;
                        border-radius: 12px;
                        font-size: 0.75rem;
                        margin-top: 0.5rem;
                    }

                    .mobile-no-sponsors {
                        text-align: center;
                        padding: 2rem 1rem;
                        color: #666;
                    }

                    .mobile-no-sponsors i {
                        font-size: 2rem;
                        color: #ccc;
                        margin-bottom: 0.5rem;
                    }

                    .mobile-sponsorship-info {
                        background: #f0f0f0;
                        border-radius: 8px;
                        padding: 1rem;
                        margin-top: 1rem;
                    }

                    .mobile-sponsorship-info h6 {
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                    }

                    /* Mobile Login Prompt */
                    .mobile-login-prompt {
                        text-align: center;
                        padding: 1.5rem;
                        background: #f8f9fa;
                        border-radius: 8px;
                        color: #666;
                    }

                    .mobile-login-prompt a {
                        color: #1b7a3a;
                        font-weight: 600;
                        text-decoration: none;
                    }

                    /* No Contests in Category - Mobile */
                    .no-contests-in-category {
                        text-align: center;
                        padding: 3rem 1.5rem;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        margin: 1rem 0;
                    }

                    .no-contests-in-category i {
                        font-size: 3rem;
                        color: #ccc;
                        margin-bottom: 1rem;
                    }

                    .no-contests-in-category h4 {
                        color: #333;
                        margin-bottom: 0.5rem;
                    }

                    .no-contests-in-category p {
                        margin-bottom: 1.5rem;
                        color: #666;
                    }

                    /* =========================================== */
                    /* DESKTOP VIEW STYLES (Your original styles) */
                    /* =========================================== */

                    @media (min-width: 768px) {
                        .mobile-contests-view {
                            display: none !important;
                        }

                        .contests-sidebar,
                        .contests-layout {
                            display: block;
                        }
                    }

                    /* Desktop Sidebar */
                    .contests-sidebar {
                        background: white;
                        border-radius: 15px;
                        padding: 1.5rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 2rem;
                    }

                    .sidebar-category-info {
                        background: #f8f9fa;
                        border-radius: 10px;
                        padding: 1rem;
                        margin-bottom: 1.5rem;
                        text-align: center;
                    }

                    .sidebar-category-info h4 {
                        color: #1b7a3a;
                        margin: 0 0 0.5rem 0;
                    }

                    .sidebar-category-info p {
                        color: #666;
                        margin: 0;
                        font-size: 0.9rem;
                    }

                    /* Desktop Contest Card */
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

                    /* Desktop Contest Details */
                    .contests-layout {
                        display: grid;
                        grid-template-columns: 100% 1fr;
                        gap: 2rem;
                        margin-top: 2rem;
                    }

                    .contest-details-main {
                        background: white;
                        border-radius: 15px;
                        padding: 2rem;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    /* Your original desktop styles continue... */
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
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
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

                    /* Sponsors Section */
                    .sponsors-section {
                        display: flex;
                        flex-direction: column;
                        gap: 2rem;
                    }

                    .sponsors-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(1fr));
                        gap: 1.5rem;
                    }

                    .sponsor-card {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        border-radius: 16px;
                        padding: 20px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        transition: all 0.3s ease;
                    }

                    .sponsor-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    }

                    .sponsor-image {
                        width: 65%;
                        height: 300px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #f8fafc;
                    }

                    .sponsor-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        border-radius: 12px;
                        border: 4px solid #f1f5f9;
                    }

                    .sponsor-info {
                        width: 30%;
                        text-align: right;
                        padding-right: 10px;
                    }

                    .sponsor-info h4 {
                        color: #333;
                        margin-bottom: 0.5rem;
                        font-size: 1.2rem;
                    }

                    .sponsor-type {
                        color: #1b7a3a;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }

                    .sponsor-info .sponsor-website {
                        color: #666;
                        text-decoration: none;
                        font-size: 0.9rem;
                        gap: 0.25rem;
                    }

                    .sponsor-website:hover {
                        color: #1b7a3a;
                        text-decoration: underline;
                    }

                    .verification-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        background: #10b981;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        margin-top: 12px;
                    }

                    .vote-link {
                        color: #1b7a3a;
                        text-decoration: underline;
                        background: #f8f9fa;
                        font-weight: 600;
                        padding: 2px 10px;
                        border-radius: 5px;
                        border: 1px solid #1b7a3a;
                    }

                    /* No Contests Section */
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

                    .no-entries,
                    .no-reviews {
                        text-align: center;
                        padding: 3rem 2rem;
                        color: #666;
                    }

                    .no-entries i,
                    .no-reviews i {
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

                    /* Sponsorship Opportunity */
                    .sponsorship-opportunity {
                        background: #f8f9fa;
                        border-radius: 10px;
                        padding: 1.5rem;
                        margin-top: 2rem;
                    }

                    .sponsorship-opportunity h5 {
                        color: #1b7a3a;
                        margin-bottom: 0.5rem;
                    }

                    .sponsorship-opportunity p {
                        color: #666;
                        margin-bottom: 1rem;
                    }

                    /* Responsive adjustments for desktop */
                    @media (max-width: 992px) {
                        .contest-stats {
                            grid-template-columns: repeat(2, 1fr);
                        }

                        .details-grid {
                            grid-template-columns: 1fr;
                            gap: 1.5rem;
                        }

                        .contest-header {
                            flex-direction: column;
                            gap: 1rem;
                            text-align: center;
                        }

                        .contest-prize-display {
                            text-align: center;
                        }
                    }

                    @media (max-width: 768px) {
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
                        .contest-stats {
                            grid-template-columns: 1fr;
                        }

                        .contest-header h1 {
                            font-size: 1.5rem;
                        }

                        .sidebar-header h3 {
                            font-size: 1.8rem;
                        }
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}

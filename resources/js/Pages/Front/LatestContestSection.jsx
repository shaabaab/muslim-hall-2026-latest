import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";

export default function LatestContestSection() {
    const { contests, auth, flash } = usePage().props;
    const [latestContest, setLatestContest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [error, setError] = useState(null);
    const [mobileExpanded, setMobileExpanded] = useState(false);

    // Safely get the latest contest with error handling
    useEffect(() => {
        try {
            if (contests && Array.isArray(contests) && contests.length > 0) {
                const sortedContests = [...contests].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at),
                );
                setLatestContest(sortedContests[0]);
                setError(null);
            } else {
                setLatestContest(null);
                setError("No contests available");
            }
        } catch (err) {
            console.error("Error processing contests:", err);
            setError("Failed to load contests");
            setLatestContest(null);
        }
    }, [contests]);

    // Toast Logic
    useEffect(() => {
        if (flash?.success) showToast(flash.success, "success");
        if (flash?.error) showToast(flash.error, "error");
    }, [flash]);

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(
            () => setToast({ show: false, message: "", type: "" }),
            4000,
        );
    }, []);

    // Helpers
    const formatDate = (dateString) => {
        if (!dateString) return "TBA";
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getTimeRemaining = (endDate) => {
        if (!endDate) return "Date not set";
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;
        if (diff <= 0) return "Ended";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} Days Left` : "Ending Soon";
    };

    const getProgress = (contest) => {
        if (!contest?.start_date || !contest?.end_date) return 0;
        const start = new Date(contest.start_date).getTime();
        const end = new Date(contest.end_date).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const elapsed = now - start;
        return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
    };

    const handleEntrySubmit = async (contestId) => {
        if (!auth?.user) {
            showToast("Please login to enter contest", "error");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post("/user/contest/entries", {
                contest_id: contestId,
            });
            if (response.data?.success) {
                showToast("Entry successful! Check your dashboard.", "success");
            } else {
                throw new Error(response.data?.message);
            }
        } catch (error) {
            showToast(
                error.response?.data?.message || "Failed to enter contest",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    // Render Helpers
    if (!latestContest) return null;

    const progress = getProgress(latestContest);
    const timeLeft = getTimeRemaining(latestContest.end_date);
    const prizes = latestContest.prizes || [];
    const grandPrize = prizes[0]?.amount || "TBA";

    const wrapperBg = {
        backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)",
    };

    const titleGradient = {
        background: "linear-gradient(to right, #fff, #e2e8f0)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    };

    /* ── Shared JSX blocks ── */

    const Badges = () => (
        <div className="flex gap-2.5 flex-wrap mb-3">
            <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 bg-[rgba(255,215,0,0.2)] text-[#ffd700] border border-[rgba(255,215,0,0.3)]">
                <i className="fas fa-bolt"></i> Featured Contest
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 bg-[rgba(255,255,255,0.15)] text-white">
                {latestContest?.category?.name || "General"}
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 bg-[rgba(255,255,255,0.1)] text-[#e2e8f0]">
                <i className="far fa-clock"></i> {timeLeft}
            </span>
        </div>
    );

    const MetaGrid = ({ className = "" }) => (
        <div className={`flex gap-8 ${className}`}>
            <div className="flex flex-col">
                <span className="text-[0.85rem] uppercase tracking-wide opacity-70 mb-1">
                    Grand Prize
                </span>
                <span className="text-xl font-bold text-[#ffd700]">
                    {grandPrize}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[0.85rem] uppercase tracking-wide opacity-70 mb-1">
                    Participants
                </span>
                <span className="text-xl font-bold">
                    {latestContest.entries?.length || 0}
                </span>
            </div>
            <div className="flex flex-col">
                <span className="text-[0.85rem] uppercase tracking-wide opacity-70 mb-1">
                    End Date
                </span>
                <span className="text-xl font-bold">
                    {formatDate(latestContest.end_date)}
                </span>
            </div>
        </div>
    );

    const ActionButtons = ({ column = false }) => (
        <div className={`flex gap-4 ${column ? "flex-col" : ""}`}>
            <button
                onClick={() => handleEntrySubmit(latestContest.id)}
                disabled={loading}
                className={`px-7 py-3.5 rounded-xl font-semibold cursor-pointer transition-all duration-300 bg-white text-[#1b7a3a] border-none hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] disabled:opacity-60 ${column ? "w-full text-center" : ""}`}
            >
                {loading ? "Processing..." : "Participate Now"}
            </button>
            <Link
                href={`/contests-details/${latestContest.id}`}
                className={`px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 bg-white text-[#1b7a3a] hover:text-[#1b7a3a] no-underline inline-block hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] ${column ? "w-full text-center" : ""}`}
            >
                View Details
            </Link>
        </div>
    );

    /* The visual card — JSX completely untouched, only Tailwind classNames added */
    const VisualCard = () => (
        <div className="contest-visual flex justify-center">
            <div className="visual-card bg-[rgba(255,255,255,0.1)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.2)] rounded-[20px] p-8 w-full max-w-[350px] flex flex-col items-center shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
                <div className="card-pattern"></div>
                <div className="progress-circle">
                    <svg
                        viewBox="0 0 36 36"
                        className="circular-chart block mx-auto w-full max-w-[100px]"
                    >
                        <path
                            className="circle-bg"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2.5"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className="circle"
                            fill="none"
                            stroke="#ffd700"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${progress}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text
                            x="18"
                            y="20.35"
                            className="percentage"
                            fill="#fff"
                            fontFamily="sans-serif"
                            fontWeight="bold"
                            fontSize="0.5em"
                            textAnchor="middle"
                        >
                            {progress}%
                        </text>
                    </svg>
                    <span className="progress-label text-center block text-[0.9rem] opacity-80 mb-8">
                        Completed
                    </span>
                </div>

                <div className="prize-list w-full border-t border-[rgba(255,255,255,0.15)] pt-6">
                    <h4 className="mt-0 mb-4 text-base opacity-90">Rewards</h4>
                    {prizes.slice(0, 3).map((p, i) => (
                        <div
                            key={i}
                            className="prize-row flex justify-between items-center py-2 border-b border-[rgba(255,255,255,0.05)]"
                        >
                            <span
                                className={`rank w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[#ffd700] text-[#1b7a3a]" : "bg-[rgba(255,255,255,0.2)]"}`}
                            >
                                {i + 1}
                            </span>
                            <span className="amount font-semibold text-[0.95rem]">
                                {p.amount || "Prize"}
                            </span>
                        </div>
                    ))}
                    {prizes.length === 0 && (
                        <div className="no-prize text-sm opacity-60">
                            Prizes TBA
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-[60px] bg-white font-['Inter',sans-serif]">
            <Head title="Latest Contest" />

            {/* Toast */}
            {toast.show && (
                <div
                    className={`fixed top-5 right-5 px-6 py-3 rounded-lg text-white flex items-center gap-2.5 z-[1000] shadow-[0_5px_15px_rgba(0,0,0,0.2)] ${
                        toast.type === "success"
                            ? "bg-[#1b7a3a]"
                            : "bg-[#dc3545]"
                    }`}
                    style={{ animation: "slideIn 0.3s ease" }}
                >
                    <i
                        className={`fas ${toast.type === "success" ? "fa-check" : "fa-exclamation"}`}
                    ></i>
                    {toast.message}
                </div>
            )}

            <div className="container mx-auto px-4">
                {/* ── DESKTOP (≥993px) ── */}
                <div
                    className="hidden lg:grid grid-cols-[1.2fr_0.8fr] gap-16 items-center rounded-3xl p-12 text-white relative overflow-hidden shadow-[0_20px_40px_rgba(27,122,58,0.2)]"
                    style={{
                        background:
                            "linear-gradient(145deg, #1b7a3a 0%, #145c2b 100%)",
                    }}
                >
                    {/* bg overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={wrapperBg}
                    />

                    {/* Left */}
                    <div className="relative z-10">
                        <Badges />

                        <h1
                            className="text-5xl font-extrabold leading-tight mb-6"
                            style={titleGradient}
                        >
                            {latestContest.title}
                        </h1>

                        <div
                            className="text-[rgba(255,255,255,0.85)] leading-7 mb-10 text-lg"
                            dangerouslySetInnerHTML={{
                                __html: latestContest.description?.substring(
                                    0,
                                    150,
                                ),
                            }}
                        />

                        <MetaGrid className="mb-10 pb-10 border-b border-[rgba(255,255,255,0.15)]" />

                        <div className="mt-10">
                            <ActionButtons />
                        </div>
                    </div>

                    {/* Right: Visual Card */}
                    <div className="relative z-10">
                        <VisualCard />
                    </div>
                </div>

                {/* ── MOBILE (<993px) ── */}
                <div
                    className="lg:hidden rounded-3xl text-white relative overflow-hidden shadow-[0_20px_40px_rgba(27,122,58,0.2)]"
                    style={{
                        background:
                            "linear-gradient(145deg, #1b7a3a 0%, #145c2b 100%)",
                    }}
                >
                    {/* bg overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={wrapperBg}
                    />

                    {/* Always visible */}
                    <div className="relative z-10 p-6">
                        {/* Badges + arrow */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <Badges />
                            <button
                                onClick={() =>
                                    setMobileExpanded(!mobileExpanded)
                                }
                                className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center cursor-pointer transition-transform duration-300"
                                style={{
                                    transform: mobileExpanded
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                }}
                                aria-label="Toggle details"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path
                                        d="M2 5L7 10L12 5"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Title */}
                        <h1
                            className="text-2xl font-extrabold leading-tight mb-4"
                            style={titleGradient}
                        >
                            {latestContest.title}
                        </h1>

                        {/* Meta */}
                        <MetaGrid className="flex-wrap gap-5" />
                    </div>

                    {/* Collapsible: description + buttons + visual card */}
                    <div
                        className="relative z-10 overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                            maxHeight: mobileExpanded ? "1200px" : "0",
                            opacity: mobileExpanded ? 1 : 0,
                        }}
                    >
                        <div className="px-6 pb-6 pt-1 border-t border-[rgba(255,255,255,0.1)]">
                            <div
                                className="text-[rgba(255,255,255,0.85)] leading-7 text-[1.1rem] mt-4 mb-10"
                                dangerouslySetInnerHTML={{
                                    __html: latestContest.description?.substring(
                                        0,
                                        150,
                                    ),
                                }}
                            />

                            <ActionButtons column />

                            <div className="mt-6">
                                <VisualCard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to   { transform: translateX(0); }
                }
                /* circle animation kept from original */
                .circle {
                    animation: circleProgress 1s ease-out forwards;
                }
                @keyframes circleProgress {
                    from { stroke-dasharray: 0, 100; }
                }
            `}</style>
        </section>
    );
}

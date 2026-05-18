import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect, useCallback } from "react";
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head } from "@inertiajs/react";
import axios from "axios";
import Header from "./Header";
import Footer from "./Footer";

import { Row, Col, message } from "antd";
import Swal from "sweetalert2";

// Constants
const TOAST_DURATION = 4000;
const INITIAL_RATING = 5;
const ENTRIES_PER_PAGE = 6;
// --- ADD THESE (report state) ---

const TAB_OPTIONS = {
    OVERVIEW: "overview",
    ENTRIES: "entries",
    REVIEWS: "reviews",
    WINNERS: "winners",
    SPONSOR: "sponsor",
};

// SVG Icons Component
const SvgIcons = {
    // Basic Icons
    Check: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    Close: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    Clock: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
    ),
    Calendar: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    Users: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
    ),
    Star: ({ filled = false, className = "" }) => (
        <svg
            className={`svg-icon ${className}`}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    Trophy: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M19 5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2M8.5 9v6.5M15.5 9v6.5M12 15.5V9M19 5v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5" />
            <path d="M17 15v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2" />
        </svg>
    ),
    Award: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="8" r="7" />
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </svg>
    ),
    Gem: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M6 3h12l4 6-10 12L2 9l4-6zM6 3l4 6M6 3l-4 6 10 12M18 3l4 6-10 12M18 3l-4 6" />
            <path d="M2 9h20M10 3l2 6 2-6" />
        </svg>
    ),
    Crown: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v1.5a2 2 0 01-1.5 1.936M2 4v14a2 2 0 002 2h16a2 2 0 002-2V4M2 4l5 4M22 4l-5 4" />
            <path d="M6.5 9L9 17l3-5 3 5 2.5-8" />
        </svg>
    ),
    Rocket: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Spinner: () => (
        <svg
            className="svg-icon svg-spinner"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    ),
    Exclamation: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
        </svg>
    ),
    Redo: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
    ),
    Home: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path d="M9 22V12h6v10" />
        </svg>
    ),
    Info: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
    ),
    List: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
    ),
    Handshake: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M11 11h4a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2h2z" />
            <path d="M7 11V9a2 2 0 012-2h2M15 11V9a2 2 0 00-2-2h-2" />
            <path d="M17 7V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
        </svg>
    ),
    PaperPlane: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    ),
    Heart: ({ filled = false, className = "" }) => (
        <svg
            className={`svg-icon ${className}`}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
    ),
    Inbox: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
        </svg>
    ),
    Gift: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </svg>
    ),
    Tags: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />
        </svg>
    ),
    User: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Dollar: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
        </svg>
    ),
    Globe: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
    ),
    Phone: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        </svg>
    ),
    Mail: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M22 6l-10 7L2 6" />
        </svg>
    ),
    Flag: () => (
        <svg
            className="svg-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
        </svg>
    ),
    // Emoji-style icons
    MedalGold: () => (
        <svg
            className="svg-icon emoji-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <circle cx="12" cy="12" r="10" fill="#FFD700" />
            <path
                d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5L2 9.5h7.5L12 2z"
                fill="#FF6B00"
            />
            <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="white"
            >
                1
            </text>
        </svg>
    ),
    MedalSilver: () => (
        <svg
            className="svg-icon emoji-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <circle cx="12" cy="12" r="10" fill="#C0C0C0" />
            <path
                d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5L2 9.5h7.5L12 2z"
                fill="#808080"
            />
            <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="white"
            >
                2
            </text>
        </svg>
    ),
    MedalBronze: () => (
        <svg
            className="svg-icon emoji-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <circle cx="12" cy="12" r="10" fill="#CD7F32" />
            <path
                d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5-6.5-5-6.5 5 2.5-7.5L2 9.5h7.5L12 2z"
                fill="#8B4513"
            />
            <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="white"
            >
                3
            </text>
        </svg>
    ),
};

// Utility Functions
const formatDate = (dateString) => {
    try {
        if (!dateString) return "Date not set";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch (err) {
        return "Invalid date";
    }
};

const getTimeRemaining = (endDate) => {
    try {
        if (!endDate) return "Date not set";

        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;

        if (diff <= 0) return "Contest ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    } catch (err) {
        return "Date error";
    }
};

const getProgressPercentage = (contest) => {
    try {
        if (!contest?.start_date || !contest?.end_date) return 0;

        const start = new Date(contest.start_date);
        const end = new Date(contest.end_date);
        const now = new Date();

        if (now >= end) return 100;
        if (now <= start) return 0;

        const total = end - start;
        const elapsed = now - start;

        return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    } catch (err) {
        return 0;
    }
};

// Helper Components
const Toast = ({ toast, onClose }) => {
    if (!toast.show) return null;

    return (
        <div className={`toast-notification ${toast.type} show`}>
            {toast.type === "success" ? (
                <SvgIcons.Check />
            ) : (
                <SvgIcons.Exclamation />
            )}
            <span>{toast.message}</span>
            <button
                onClick={onClose}
                className="toast-close"
                aria-label="Close notification"
            >
                <SvgIcons.Close />
            </button>
        </div>
    );
};

const LoadingState = () => (
    <div className="loading-section">
        <div className="container-md">
            <div className="loading-content">
                <div className="loading-spinner">
                    <SvgIcons.Trophy />
                </div>
                <h2>Loading Contest...</h2>
                <p>Preparing something amazing for you</p>
            </div>
        </div>
    </div>
);

const ErrorState = ({ error, onRetry }) => (
    <div className="error-section">
        <div className="container-md">
            <div className="error-content">
                <div className="error-icon">
                    <SvgIcons.Exclamation />
                </div>
                <h2>Unable to Load Contest</h2>
                <p>{error}</p>
                <button onClick={onRetry} className="retry-button">
                    <SvgIcons.Redo />
                    Try Again
                </button>
            </div>
        </div>
    </div>
);

const NoContestState = () => (
    <div className="no-contest-section">
        <div className="container-md">
            <div className="no-contest-content">
                <div className="no-contest-icon">
                    <SvgIcons.Trophy />
                </div>
                <h1>No Active Contest</h1>
                <p>
                    There is currently no running contest. Check back later for
                    new opportunities!
                </p>
                <div className="coming-soon-badge">
                    <SvgIcons.Clock />
                    Coming Soon
                </div>
            </div>
        </div>
    </div>
);

// Main Component Sections
const ContestHero = ({
    contest,
    progress,
    timeRemaining,
    totalEntries,
    averageRating,
    prizes,
    grandPrize,
    userEntry,
    contestEnded,
    loading,
    onEntrySubmit,
    formatDate,

    // ✅ ADD THESE (must)
    activeTab,
    onTabChange,
    hasSponsors,
    sponsorsCount,
    reviewsCount,
}) => {
    const { auth } = usePage().props;
    // Vote handler

    // ✅ MUST HAVE
    const safeContest = contest || {};
    const safeTab = activeTab || TAB_OPTIONS.OVERVIEW;
    return (
        <>
            <Header />
            <section className="latest-contest-hero">
                <div className="container-md">
                    <div className="hero-content-wrapper">
                        <div className="contest-badge">
                            <span className="featured-badge">
                                <SvgIcons.Crown />
                                {contestEnded
                                    ? "Contest Ended"
                                    : "Featured Contest"}
                            </span>

                            <span className="category-badge">
                                {safeContest?.category?.name ?? "General"}
                            </span>

                            {safeContest?.category?.parent && (
                                <span className="category-badge">
                                    {safeContest?.category?.parent?.name ||
                                        "General"}
                                </span>
                            )}

                            <span className="time-badge">
                                <SvgIcons.Clock />
                                {timeRemaining}
                            </span>
                        </div>

                        <div className="hero-main-content">
                            <div className="contest-info">
                                <h1 className="contest-title">
                                    {safeContest?.title || "Contest Title"}
                                </h1>

                                <p
                                    className="contest-description"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            safeContest?.description?.substring(
                                                0,
                                                200,
                                            ) ||
                                            "Join our exciting contest and showcase your skills to win amazing prizes!",
                                    }}
                                ></p>

                                <div className="contest-meta-grid">
                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <SvgIcons.Trophy />
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value ">
                                                {grandPrize}
                                            </div>
                                            <div className="meta-label">
                                                Grand Prize
                                            </div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <SvgIcons.Users />
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">
                                                {totalEntries}+
                                            </div>
                                            <div className="meta-label">
                                                Participants
                                            </div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <SvgIcons.Star filled />
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">
                                                {averageRating}
                                            </div>
                                            <div className="meta-label">
                                                Rating
                                            </div>
                                        </div>
                                    </div>

                                    <div className="meta-item-contest text-white">
                                        <div className="meta-icon">
                                            <SvgIcons.Award />
                                        </div>
                                        <div className="meta-content">
                                            <div className="meta-value">
                                                {prizes?.length || 0}
                                            </div>
                                            <div className="meta-label">
                                                Prizes
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="action-section z-100">
                                    {!userEntry && !contestEnded && (
                                        <button
                                            onClick={() =>
                                                onEntrySubmit(contest.id)
                                            }
                                            disabled={loading || !!userEntry}
                                            className="cta-button secondary cursor-pointer"
                                            type="button"
                                        >
                                            {loading ? (
                                                <>
                                                    <SvgIcons.Spinner />
                                                    Entering...
                                                </>
                                            ) : (
                                                <>
                                                    <SvgIcons.Rocket />
                                                    Join Contest Now
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {userEntry && (
                                        <div className="entry-status">
                                            <SvgIcons.Check />
                                            <span>
                                                You have entered this contest
                                            </span>

                                            <Link
                                                href={`/user/entries/${userEntry.id}`}
                                                className="view-entry-btn"
                                            >
                                                View Your Entry
                                            </Link>

                                            <Link
                                                className="view-entry-btn"
                                                href="/"
                                            >
                                                <SvgIcons.Home /> Back To Home
                                            </Link>
                                        </div>
                                    )}

                                    {contestEnded && !userEntry && (
                                        <div className="contest--notice">
                                            <SvgIcons.Flag />
                                            <span>This contest has ended</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="contest-visual">
                                <div className="progress-container">
                                    <div className="progress-header">
                                        <span>Contest Progress</span>
                                        <span className="progress-percent">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>

                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progress}%` }}
                                            role="progressbar"
                                            aria-valuenow={Math.round(progress)}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>

                                    <div className="progress-dates">
                                        <span className="start-date">
                                            {formatDate?.(
                                                safeContest?.start_date,
                                            )}
                                        </span>
                                        <span className="end-date">
                                            {formatDate?.(
                                                safeContest?.end_date,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="prize-highlight">
                                    <div className="prize-card">
                                        <div className="prize-icon">
                                            <SvgIcons.Gem />
                                        </div>
                                        <div className="prize-content">
                                            <h4>Grand Prize</h4>
                                            <div className="prize-amount">
                                                {grandPrize}
                                            </div>
                                            <p>
                                                Plus amazing recognition in our
                                                community
                                            </p>
                                        </div>
                                        <div className="prize-glow"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✅ HERO TABS INSIDE BANNER */}
                        <div className="hero-tabs-wrapper">
                            <div className="hero-tabs">
                                <button
                                    className={`hero-tab-btn ${safeTab === TAB_OPTIONS.OVERVIEW ? "active" : ""}`}
                                    onClick={() =>
                                        onTabChange?.(TAB_OPTIONS.OVERVIEW)
                                    }
                                    type="button"
                                >
                                    <SvgIcons.Info />
                                    <span>Overview</span>
                                </button>

                                <button
                                    className={`hero-tab-btn ${safeTab === TAB_OPTIONS.ENTRIES ? "active" : ""}`}
                                    onClick={() =>
                                        onTabChange?.(TAB_OPTIONS.ENTRIES)
                                    }
                                    type="button"
                                >
                                    <SvgIcons.List />
                                    <span>Entries ({totalEntries})</span>
                                </button>

                                <button
                                    className={`hero-tab-btn ${safeTab === TAB_OPTIONS.REVIEWS ? "active" : ""}`}
                                    onClick={() =>
                                        onTabChange?.(TAB_OPTIONS.REVIEWS)
                                    }
                                    type="button"
                                >
                                    <SvgIcons.Star filled />
                                    <span>Reviews ({reviewsCount})</span>
                                </button>

                                {hasSponsors && (
                                    <button
                                        className={`hero-tab-btn ${safeTab === TAB_OPTIONS.SPONSOR ? "active" : ""}`}
                                        onClick={() =>
                                            onTabChange?.(TAB_OPTIONS.SPONSOR)
                                        }
                                        type="button"
                                    >
                                        <SvgIcons.Handshake />
                                        <span>Sponsors ({sponsorsCount})</span>
                                    </button>
                                )}

                                {contestEnded && (
                                    <button
                                        className={`hero-tab-btn ${safeTab === TAB_OPTIONS.WINNERS ? "active" : ""}`}
                                        onClick={() =>
                                            onTabChange?.(TAB_OPTIONS.WINNERS)
                                        }
                                        type="button"
                                    >
                                        <SvgIcons.Trophy />
                                        <span>Winners</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* ✅ HERO TABS END */}
                    </div>
                </div>
            </section>
        </>
    );
};

const ContestTabs = ({
    onReportClick,
    activeTab,
    contest,
    entries,
    reviews,
    winners,
    totalEntries,
    averageRating,
    showAllEntries,
    userReview,
    submittingReview,
    userHasReviewed,
    contestEnded,
    onTabChange,
    onShowAllEntriesChange,
    onUserReviewChange,
    onReviewSubmit,
    onEntrySubmit,
    loading,
    userEntry,
    formatDate,
}) => {
    const { auth } = usePage().props;

    const getContestPrizes = (contest) => contest?.prizes || [];
    const prizes = getContestPrizes(contest);

    const handleVote = (entryId) => {
        if (!auth.user) {
            message.warning("You need to login to vote!");
            router.visit(route("login"));
        } else
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

    const getSponsors = () => {
        if (!contest?.contest_sponsor) return [];

        if (Array.isArray(contest.contest_sponsor)) {
            return contest.contest_sponsor.filter(
                (sponsor) => sponsor && typeof sponsor === "object",
            );
        }

        if (
            contest.contest_sponsor &&
            typeof contest.contest_sponsor === "object"
        ) {
            return [contest.contest_sponsor];
        }

        return [];
    };

    const sponsors = getSponsors();
    const hasSponsors = sponsors.length > 0;

    const OverviewTab = () => (
        <div className="details-grid">
            <div className="details-card">
                <div className="card-header">
                    <h3>
                        <SvgIcons.Info /> Contest Overview
                    </h3>
                    <div className="card-badge">Detailed Information</div>
                </div>
                <div
                    className="contest-full-description"
                    dangerouslySetInnerHTML={{
                        __html:
                            contest?.description ||
                            "<p>No description available for this contest.</p>",
                    }}
                ></div>

                <div className="rules-section">
                    <h4>
                        <SvgIcons.Trophy /> Contest Rules & Guidelines
                    </h4>
                    <ul className="rules-list">
                        <li>
                            <SvgIcons.Check />
                            If you participate in the contest, you agree to the
                            rules
                        </li>
                        <li>
                            <SvgIcons.Check />
                            If you want to vote for the contest you need to log
                            in, If you want to Vote ? Click the Button!{" "}
                            <Link
                                href={`/user/${contest.id}/entries/contests`}
                                className="vote-link"
                            >
                                Vote
                            </Link>
                        </li>
                        <li>
                            <SvgIcons.Check />
                            Follow all contest guidelines
                        </li>
                        <li>
                            <SvgIcons.Check />
                            Submit your entry before the deadline
                        </li>
                        <li>
                            <SvgIcons.Check />
                            Respect community guidelines and values
                        </li>
                        <li>
                            <SvgIcons.Check />
                            Judging based on creativity and quality
                        </li>
                    </ul>
                </div>

                <hr />

                {!contestEnded && (
                    <div className="cta-card">
                        <div className="cta-content">
                            <h4>
                                <SvgIcons.Rocket /> Ready to Participate?
                            </h4>
                            <p>
                                Join now and showcase your talent to the
                                contest!
                            </p>
                            <button
                                onClick={() => onEntrySubmit(contest.id)}
                                disabled={loading || userEntry}
                                className="cta-button secondary"
                                aria-label={
                                    userEntry
                                        ? "Already entered"
                                        : "Join contest"
                                }
                            >
                                {loading ? (
                                    <>
                                        <SvgIcons.Spinner />
                                        Entering...
                                    </>
                                ) : userEntry ? (
                                    <>
                                        <SvgIcons.Check />
                                        Already Entered
                                    </>
                                ) : (
                                    <>
                                        <SvgIcons.Rocket />
                                        Join Contest Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="sidebar-card">
                <div className="quick-info">
                    <h4>
                        <SvgIcons.Info /> Quick Info
                    </h4>
                    <div className="info-list">
                        <div className="info-item">
                            <SvgIcons.Calendar />
                            <div className="info-content">
                                <span className="info-label">Start Date </span>
                                <span className="info-value">
                                    {formatDate(contest?.start_date)}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <SvgIcons.Flag />
                            <div className="info-content">
                                <span className="info-label">End Date </span>
                                <span className="info-value">
                                    {formatDate(contest?.end_date)}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <SvgIcons.Tags />
                            <div className="info-content">
                                <span className="info-label">Category </span>
                                <span className="info-value">
                                    {contest?.category?.name || " General"}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <SvgIcons.User />
                            <div className="info-content">
                                <span className="info-label">Organizer </span>
                                <span className="info-value">
                                    {contest?.creator?.name || "Muslim Hall"}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <SvgIcons.Dollar />
                            <div className="info-content">
                                <span className="info-label">
                                    Participation Fee{" "}
                                </span>
                                <span className="info-value">
                                    {contest?.payment_type == "paid"
                                        ? "Paid (" +
                                          contest?.amount +
                                          ") tk only"
                                        : "Free"}
                                </span>
                            </div>
                        </div>
                        <div className="info-item">
                            <SvgIcons.User />
                            <div className="info-content">
                                <span className="info-label">
                                    Participant Type{" "}
                                </span>
                                <span className="info-value">
                                    {contest?.user_type == "all"
                                        ? "All User"
                                        : contest?.user_type + " only"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="prizes-summary mt-2">
                    <h4>
                        <SvgIcons.Award /> Prize Distribution
                    </h4>
                    <div className="prizes-list">
                        {prizes.slice(0, 3).map((prize, index) => (
                            <div key={index} className="prize-summary-item">
                                <div className={`prize-rank rank-${index + 1}`}>
                                    {index === 0 ? (
                                        <SvgIcons.MedalGold />
                                    ) : index === 1 ? (
                                        <SvgIcons.MedalSilver />
                                    ) : (
                                        <SvgIcons.MedalBronze />
                                    )}
                                </div>
                                <div className="prize-details">
                                    <div className="prize-type regular">
                                        <span>
                                            Regular:{" "}
                                            {prize.amount_normal_user ||
                                                prize.amount ||
                                                "Prize"}
                                        </span>
                                    </div>
                                    <div className="prize-type premium">
                                        <span>
                                            Premium:{" "}
                                            {prize.amount_premium_user ||
                                                prize.amount ||
                                                "Prize"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {prizes.length === 0 && (
                            <div className="no-prizes">
                                <SvgIcons.Gift />
                                <span>Prizes to be announced</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const EntriesTab = () => (
        <div className="entries-tab">
            <div className="entries-header">
                <h3>All Entries ({totalEntries})</h3>
                <div className="entries-actions">
                    <button
                        className="view-toggle-btn"
                        onClick={() => onShowAllEntriesChange(!showAllEntries)}
                        aria-label={
                            showAllEntries
                                ? "Show fewer entries"
                                : "Show all entries"
                        }
                    >
                        {showAllEntries ? "Show Less" : "Show All"}
                    </button>
                </div>
            </div>

            <div className="entries-grid">
                <>
                    {(showAllEntries
                        ? entries
                        : entries.slice(0, ENTRIES_PER_PAGE)
                    ).map((entry) => {
                        const userVoted = entry?.votes?.some(
                            (vote) =>
                                Number(vote.user_id) === Number(auth?.user?.id),
                        );

                        return (
                            <div key={entry.id} className="entry-card">
                                <div className="entry-header">
                                    <div className="entry-user">
                                        <img
                                            src={
                                                entry.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    entry.user?.name || "User",
                                                )}&background=1b7a3a&color=fff`
                                            }
                                            alt={entry.user?.name}
                                            className="user-avatar"
                                            loading="lazy"
                                        />
                                        <div className="user-info">
                                            <span className="user-name">
                                                {entry.user?.name ||
                                                    "Anonymous"}{" "}
                                            </span>
                                            <span className="entry-date">
                                                {formatDate(entry.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {entry.is_winner && (
                                        <div className="winner-badge">
                                            <SvgIcons.Crown />
                                            Winner
                                        </div>
                                    )}
                                </div>

                                <div className="entry-content">
                                    <h4 className="entry-title">
                                        <Link
                                            style={{ color: "#1b7a3a" }}
                                            href={`/user/entries/${entry?.id}`}
                                        >
                                            {entry.title || "Untitled Entry"}
                                        </Link>
                                    </h4>
                                    <p className="entry-description">
                                        {entry.description?.substring(0, 150) ||
                                            "No description provided..."}
                                    </p>
                                </div>

                                <div className="entry-footer">
                                    <div className="entry-stats">
                                        <span className="stat">
                                            <button
                                                onClick={() =>
                                                    handleVote(entry.id)
                                                }
                                                className="vote-button"
                                                disabled={userVoted}
                                                aria-label={
                                                    userVoted
                                                        ? "Already voted"
                                                        : "Vote for this entry"
                                                }
                                            >
                                                <SvgIcons.Heart
                                                    filled={userVoted}
                                                />
                                                Vote ({entry.total_votes || 0})
                                            </button>
                                        </span>

                                        <span className="stat">
                                            <SvgIcons.Star filled />
                                            {entry.reviews?.length || 0}
                                        </span>
                                    </div>
                                    <button
                                        className="btn-report"
                                        onClick={(e) =>
                                            onReportClick(e, entry.id)
                                        }
                                        title="Report this entry"
                                    >
                                        <SvgIcons.Flag /> Report
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </>
            </div>

            {entries.length === 0 && (
                <div className="no-entries">
                    <SvgIcons.Inbox />
                    <h4>No Entries Yet</h4>
                    <p>Be the first to enter this contest!</p>
                </div>
            )}
        </div>
    );

    const ReviewsTab = () => (
        <div className="reviews-tab">
            <div className="reviews-header">
                <div className="rating-overview">
                    <div className="average-rating">
                        <div className="rating-score">{averageRating}</div>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <SvgIcons.Star
                                    key={star}
                                    filled={star <= Math.round(averageRating)}
                                    className={
                                        star <= Math.round(averageRating)
                                            ? "active"
                                            : ""
                                    }
                                />
                            ))}
                        </div>
                        <div className="rating-count">
                            {reviews.length} reviews
                        </div>
                    </div>
                </div>

                {!userHasReviewed && auth?.user && !contestEnded && (
                    <div className="add-review-section">
                        <h4>Add Your Review</h4>
                        <form onSubmit={onReviewSubmit} className="review-form">
                            <div className="rating-input">
                                <label htmlFor="decision-select">
                                    Your Decision:
                                </label>
                                <select
                                    id="decision-select"
                                    value={userReview.decision}
                                    onChange={(e) =>
                                        onUserReviewChange((prev) => ({
                                            ...prev,
                                            decision: e.target.value,
                                        }))
                                    }
                                    className="decision-select mb-4 border p-2 rounded"
                                    required
                                    disabled={submittingReview}
                                >
                                    <option value="">Select Decision</option>
                                    <option value="1">Like</option>
                                    <option value="2">Dislike</option>
                                </select>

                                <label>Your Rating:</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={`star-btn ${star <= userReview.rating ? "active" : ""}`}
                                            onClick={() =>
                                                onUserReviewChange((prev) => ({
                                                    ...prev,
                                                    rating: star,
                                                }))
                                            }
                                            disabled={submittingReview}
                                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                                        >
                                            <SvgIcons.Star
                                                filled={
                                                    star <= userReview.rating
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="comment-input">
                                <label htmlFor="review-textarea">
                                    Your Review:
                                </label>
                                <textarea
                                    id="review-textarea"
                                    placeholder="Share your experience with this contest..."
                                    value={userReview.review}
                                    onChange={(e) =>
                                        onUserReviewChange((prev) => ({
                                            ...prev,
                                            review: e.target.value,
                                        }))
                                    }
                                    rows="4"
                                    required
                                    disabled={submittingReview}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={
                                    submittingReview || !userReview.decision
                                }
                                className="submit-review-btn"
                            >
                                {submittingReview ? (
                                    <>
                                        <SvgIcons.Spinner />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <SvgIcons.PaperPlane />
                                        Submit Review
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {contestEnded && (
                    <div className="contest-ended-notice">
                        <SvgIcons.Flag />
                        <p>
                            Review submission is closed as this contest has
                            ended.
                        </p>
                    </div>
                )}
            </div>

            <div className="reviews-list">
                {reviews.map((review) => (
                    <div key={review.id} className="review-card">
                        <div className="review-header">
                            <div className="reviewer-info">
                                <img
                                    src={
                                        review.reviewer?.avatar ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer?.name || "User")}&background=1b7a3a&color=fff`
                                    }
                                    alt={review.reviewer?.name}
                                    className="reviewer-avatar"
                                    loading="lazy"
                                />
                                <div className="reviewer-details">
                                    <span className="reviewer-name">
                                        {" "}
                                        {review.decision == 1
                                            ? "Like"
                                            : "Dislike"}{" "}
                                        by {review.reviewer?.name}
                                    </span>
                                    <div className="review-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <SvgIcons.Star
                                                key={star}
                                                filled={star <= review.rating}
                                                className={
                                                    star <= review.rating
                                                        ? "active"
                                                        : ""
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="review-date">
                                {formatDate(review.created_at)}
                            </span>
                        </div>
                        <div className="review-content">
                            <p>{review.comments}</p>
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="no-reviews">
                        <SvgIcons.Star filled />
                        <h4>No Reviews Yet</h4>
                        <p>Be the first to review this contest!</p>
                    </div>
                )}
            </div>
        </div>
    );

    const WinnersTab = () => (
        <div className="winners-tab">
            <div className="winners-header">
                <h3>
                    <SvgIcons.Trophy /> Contest Winners
                </h3>
                <p>Congratulations to our amazing winners!</p>
            </div>

            <div className="winners-podium">
                {winners.map((winner) => (
                    <div
                        key={winner.id}
                        className={`winner-card position-${winner.position}`}
                    >
                        <div className="winner-medal">
                            {winner.position === 1 && <SvgIcons.MedalGold />}
                            {winner.position === 2 && <SvgIcons.MedalSilver />}
                            {winner.position === 3 && <SvgIcons.MedalBronze />}
                        </div>
                        <div className="winner-avatar">
                            <img
                                style={{
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "50%",
                                }}
                                src={
                                    winner.user?.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.user?.name || "Winner")}&background=1b7a3a&color=fff`
                                }
                                alt={winner.user?.name}
                                loading="lazy"
                            />
                        </div>
                        <div className="winner-info">
                            <h4 className="winner-name">
                                {winner?.entry?.user?.name}
                            </h4>
                            <p className="winner-prize">
                                {winner.entry?.total_votes} votes{" "}
                            </p>
                            <p className="winner-entry">
                                {winner?.entry?.title}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {(!winners || winners.length === 0) && (
                <div className="no-winners">
                    <SvgIcons.Trophy />
                    <h4>Winners Not Announced Yet</h4>
                    <p>Check back later to see the winners of this contest.</p>
                </div>
            )}
        </div>
    );

    const SponsorTab = () => {
        return (
            <div className="sponsor-tab">
                <div className="sponsor-header">
                    <h3>
                        <SvgIcons.Handshake /> Our Sponsors
                    </h3>
                    <p>
                        Special thanks to our amazing sponsors who make this
                        contest possible
                    </p>
                </div>

                {hasSponsors ? (
                    <div className="sponsor-grid">
                        {sponsors.map((sponsor, index) => (
                            <div
                                key={sponsor.id || index}
                                className="sponsor-card"
                            >
                                <div className="sponsor-avatar">
                                    <img
                                        src={
                                            sponsor.banner
                                                ? `/storage/${sponsor.banner}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(sponsor.name || "Sponsor")}&background=1b7a3a&color=fff`
                                        }
                                        alt={sponsor.name}
                                        className="sponsor-image"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="sponsor-info">
                                    <h4 className="sponsor-name">
                                        {sponsor?.sponsor.name || "Sponsor"}
                                    </h4>

                                    {sponsor?.sponsor.email && (
                                        <div className="sponsor-contact">
                                            <SvgIcons.Mail />
                                            <span>
                                                {sponsor?.sponsor.email}
                                            </span>
                                        </div>
                                    )}

                                    {sponsor?.sponsor.phone && (
                                        <div className="sponsor-contact">
                                            <SvgIcons.Phone />
                                            <span>
                                                {sponsor?.sponsor.phone}
                                            </span>
                                        </div>
                                    )}

                                    {sponsor?.sponsor.website && (
                                        <div className="sponsor-contact">
                                            <SvgIcons.Globe />
                                            <span>
                                                <a
                                                    href={
                                                        sponsor?.sponsor.website
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {sponsor?.sponsor.website}
                                                </a>
                                            </span>
                                        </div>
                                    )}

                                    {sponsor?.sponsor.phone_alternative && (
                                        <div className="sponsor-contact">
                                            <SvgIcons.Phone />
                                            <span>
                                                {
                                                    sponsor?.sponsor
                                                        .phone_alternative
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {sponsor?.sponsor.email_verified_at && (
                                        <div className="verification-badge">
                                            <SvgIcons.Check />
                                            <span>Verified Sponsor</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-sponsor">
                        <SvgIcons.Handshake />
                        <h3>No Sponsors Yet</h3>
                        <p>This contest currently has no sponsors.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="contest-details-section">
            <div className="container-md">
                <div className="tab-content">
                    {activeTab === TAB_OPTIONS.OVERVIEW && <OverviewTab />}
                    {activeTab === TAB_OPTIONS.ENTRIES && <EntriesTab />}
                    {activeTab === TAB_OPTIONS.REVIEWS && <ReviewsTab />}
                    {activeTab === TAB_OPTIONS.SPONSOR && <SponsorTab />}
                    {activeTab === TAB_OPTIONS.WINNERS && contestEnded && (
                        <WinnersTab />
                    )}
                </div>
            </div>
        </section>
    );
};

// Payment Modal Component
const PaymentModal = ({ show, onClose, onConfirm, amount, loading }) => {
    const [paymentInfo, setPaymentInfo] = useState({
        method: "bkash",
        number: "",
        transactionId: "",
    });

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(paymentInfo);
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content">
                <div className="payment-modal-header">
                    <h3>
                        <SvgIcons.Dollar /> Paid Contest Entry
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <SvgIcons.Close />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="payment-summary">
                        <p>You are joining a paid contest.</p>
                        <div className="amount-badge">
                            Entry Fee: <strong>{amount} TK</strong>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Payment Method</label>
                        <div className="payment-methods">
                            {["bkash", "nagad", "rocket"].map((method) => (
                                <label
                                    key={method}
                                    className={`method-option ${paymentInfo.method === method ? "active" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method}
                                        checked={paymentInfo.method === method}
                                        onChange={(e) =>
                                            setPaymentInfo({
                                                ...paymentInfo,
                                                method: e.target.value,
                                            })
                                        }
                                    />
                                    <span className="capitalize">{method}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Your {paymentInfo.method} Number</label>
                        <input
                            type="text"
                            placeholder="01XXXXXXXXX"
                            value={paymentInfo.number}
                            onChange={(e) =>
                                setPaymentInfo({
                                    ...paymentInfo,
                                    number: e.target.value,
                                })
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Transaction ID</label>
                        <input
                            type="text"
                            placeholder="TRX123456789"
                            value={paymentInfo.transactionId}
                            onChange={(e) =>
                                setPaymentInfo({
                                    ...paymentInfo,
                                    transactionId: e.target.value,
                                })
                            }
                            required
                        />
                    </div>

                    <div className="payment-footer">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="confirm-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <SvgIcons.Spinner /> Processing...
                                </>
                            ) : (
                                "Confirm & Join"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .payment-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .payment-modal-content {
                    background: white;
                    width: 90%;
                    max-width: 450px;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
                .payment-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .payment-modal-header h3 {
                    margin: 0;
                    color: #1b7a3a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                }
                .payment-summary {
                    background: #f0fdf4;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .amount-badge {
                    font-size: 1.2rem;
                    color: #1b7a3a;
                    margin-top: 8px;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                .payment-methods {
                    display: flex;
                    gap: 10px;
                }
                .method-option {
                    flex: 1;
                    border: 1px solid #ddd;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .method-option.active {
                    background: #1b7a3a;
                    color: white;
                    border-color: #1b7a3a;
                }
                .method-option input {
                    display: none;
                }
                .form-group input[type="text"] {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    outline: none;
                }
                .form-group input[type="text"]:focus {
                    border-color: #1b7a3a;
                }
                .payment-footer {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                }
                .cancel-btn,
                .confirm-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .cancel-btn {
                    background: #f3f4f6;
                    border: none;
                    color: #4b5563;
                }
                .confirm-btn {
                    background: #1b7a3a;
                    border: none;
                    color: white;
                }
                .confirm-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .capitalize {
                    text-transform: capitalize;
                }
            `}</style>
        </div>
    );
};

// Main Component
export default function ContestSection({ contest }) {
    const { auth, flash } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(TAB_OPTIONS.OVERVIEW);
    const [showAllEntries, setShowAllEntries] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState("");
    const [currentEntryId, setCurrentEntryId] = useState(null);
    const [userReview, setUserReview] = useState({
        rating: INITIAL_RATING,
        review: "",
        decision: "",
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [userEntry, setUserEntry] = useState(null);
    const [userHasReviewed, setUserHasReviewed] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Process contest data
    useEffect(() => {
        try {
            if (contest) {
                setError(null);

                if (auth?.user && contest.entries) {
                    const userEntry = contest.entries.find(
                        (entry) => entry.user_id === auth.user.id,
                    );
                    setUserEntry(userEntry || null);
                }

                if (auth?.user && contest.reviews) {
                    const hasReviewed = contest.reviews.some(
                        (review) => review.user_id === auth.user.id,
                    );
                    setUserHasReviewed(hasReviewed);
                }
            } else {
                setError("Contest not found");
            }
        } catch (err) {
            console.error("Error processing contest:", err);
            setError("Failed to load contest");
        }
    }, [contest, auth?.user]);

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
            TOAST_DURATION,
        );
    }, []);

    // Entry submission
    const handleEntrySubmit = async (contestId, paymentData = null) => {
        if (!auth?.user) {
            Swal.fire({
                position: "center",
                icon: "error",
                title: "Please login to enter contest",
                showConfirmButton: false,
                timer: 1500,
            });
            setTimeout(() => router.visit("/login"), 1500);
            return;
        }

        if (userEntry) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "You have already entered this contest",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        // Check user type restrictions
        const isMember = auth.user.subscriptions?.length > 0;
        if (contest.user_type === "member" && !isMember) {
            Swal.fire({
                position: "center",
                icon: "error",
                title: "This contest is only for member users. You must be a member to participate.",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        router.visit(`/user/${contest.id}/entries/create/contests`);
    };

    // this is the old version of handleEntrySubmit without payment handling, kept here for reference in case we need to revert back or compare logic
    const handleEntrySubmitold = async (contestId, paymentData = null) => {
        if (!auth?.user) {
            showToast("Please login to enter contest", "error");
            setTimeout(() => router.visit("/login"), 1500);
            return;
        }

        if (userEntry) {
            showToast("You have already entered this contest", "info");
            return;
        }

        // Check user type restrictions
        const isMember = auth.user.subscriptions?.length > 0;
        if (contest.user_type === "member" && !isMember) {
            showToast(
                "This contest is only for member users. You must be a member to participate.",
                "error",
            );
            return;
        }

        // Handle paid contest
        if (contest.payment_type === "paid" && !paymentData) {
            setShowPaymentModal(true);
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("/user/contest/entries", {
                contest_id: contestId,
                payment_info: paymentData, // Pass fake payment info
            });

            if (response.data?.success) {
                showToast(
                    "Entry successful! Go to the dashboard to complete your contest details.",
                    "success",
                );
                setShowPaymentModal(false);
                if (response.data.entry) {
                    setUserEntry(response.data.entry);
                    router.reload({ only: ["contest"] });
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
                error.response?.data?.message ||
                error.message ||
                "Failed to enter contest";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Review submission
    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!auth?.user) {
            showToast("Please login to submit a review", "error");
            return;
        }

        if (isContestEnded(contest)) {
            showToast("Cannot submit review after contest has ended", "error");
            return;
        }

        if (!userReview.review.trim()) {
            showToast("Please enter a review comment", "error");
            return;
        }

        setSubmittingReview(true);

        try {
            const response = await axios.post("/user/contest/reviews", {
                contest_id: contest.id,
                rating: userReview.rating,
                review: userReview.review,
                decision: userReview.decision,
            });

            if (response.data?.success) {
                showToast("Review submitted successfully!", "success");
                setUserReview({
                    rating: INITIAL_RATING,
                    review: "",
                    decision: "",
                });
                setUserHasReviewed(true);
                router.reload({ only: ["contest"] });
            } else {
                throw new Error(
                    response.data?.message || "Failed to submit review",
                );
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            const message =
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message ||
                "Failed to submit review";
            showToast(message, "error");
        } finally {
            setSubmittingReview(false);
        }
    };
    const handleReportClick = (e, entryId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.user) {
            router.visit(route("login"));
            return;
        }
        setCurrentEntryId(entryId);
        setShowReportModal(true);
        setReportError("");
        setReportSuccess("");
    };

    const submitReport = () => {
        if (!reportReason.trim() || reportReason.length < 10) {
            setReportError(
                "Please provide a detailed reason (at least 10 characters).",
            );
            return;
        }

        if (!currentEntryId) {
            setReportError("No entry selected for reporting.");
            return;
        }

        setReportSubmitting(true);
        setReportError("");

        router.post(
            route("reports.store"),
            {
                reason: reportReason,
                report_type: "entry",
                reportable_id: currentEntryId,
                reportable_type: "App\\Models\\Entry",
            },
            {
                onSuccess: () => {
                    setReportSuccess(
                        "Report submitted successfully! Our team will review it.",
                    );
                    setTimeout(() => {
                        setShowReportModal(false);
                        setReportReason("");
                        setReportSuccess("");
                        setCurrentEntryId(null);
                    }, 2000);
                },
                onError: (errors) => {
                    console.log("Report errors:", errors); // ADD THIS
                    console.log("Report errors JSON:", JSON.stringify(errors)); // ADD THIS
                    setReportError(
                        errors.reason ||
                            errors.message ||
                            "Failed to submit report. Please try again.",
                    );
                },
                onFinish: () => {
                    setReportSubmitting(false);
                },
                preserveScroll: true,
            },
        );
    };

    const closeReportModal = () => {
        if (!reportSubmitting) {
            setShowReportModal(false);
            setReportReason("");
            setReportError("");
            setReportSuccess("");
            setCurrentEntryId(null);
        }
    };

    // Data calculation functions
    const getContestPrizes = (contest) => contest?.prizes || [];
    const getContestEntries = (contest) => contest?.entries || [];
    const getContestReviews = (contest) => contest?.reviews || [];

    const getAverageRating = (contest) => {
        const reviews = getContestReviews(contest) || [];

        if (!Array.isArray(reviews) || reviews.length === 0) {
            return "0.0";
        }

        const total = reviews.reduce((sum, review) => {
            const rating = Number(review.rating) || 0;
            return sum + rating;
        }, 0);

        return (total / reviews.length).toFixed(1);
    };

    const getWinners = (contest) => {
        const entries = getContestEntries(contest);
        const winningEntries = entries.filter((entry) => entry.is_winner);
        return winningEntries.slice(0, 3).map((entry, index) => ({
            ...entry,
            position: index + 1,
            prize: getContestPrizes(contest)[index]?.amount || "Prize",
        }));
    };

    const isContestEnded = (contest) =>
        contest ? new Date(contest.end_date) < new Date() : false;

    // Loading state
    if (!contest && !error) {
        return <LoadingState />;
    }

    // Error state
    if (error && !contest) {
        return (
            <ErrorState
                error={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    // No contest state
    if (!contest) {
        return <NoContestState />;
    }

    // Calculate derived data
    const progress = getProgressPercentage(contest);
    const timeRemaining = getTimeRemaining(contest.end_date);
    const totalEntries = getContestEntries(contest).length;
    const averageRating = getAverageRating(contest);
    const prizes = getContestPrizes(contest);
    const reviews = getContestReviews(contest);
    const entries = getContestEntries(contest);
    const winners = getWinners(contest);
    const grandPrize = prizes[0]?.amount || "Cash Prize";
    const contestEnded = isContestEnded(contest);

    return (
        <>
            <Head title={`${contest.title} - Muslim Hall`} />

            <FrontAuthenticatedLayout>
                {/* Report Modal — identical pattern to PostDetail */}
                {showReportModal && (
                    <div className="modal-backdrop">
                        <div className="modal-container">
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    <i className="fas fa-flag-checkered"></i>{" "}
                                    Report Content
                                </h3>
                                <button
                                    onClick={closeReportModal}
                                    className="modal-close-btn"
                                    disabled={reportSubmitting}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="info-box">
                                    <i className="fas fa-info-circle"></i>
                                    <p>
                                        Please report content only if it
                                        violates our community guidelines. False
                                        reporting may lead to account
                                        restrictions.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Reason for reporting{" "}
                                        <span className="required">*</span>
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        value={reportReason}
                                        onChange={(e) => {
                                            setReportReason(e.target.value);
                                            setReportError("");
                                        }}
                                        placeholder="Describe why this content is inappropriate (min 10 chars)..."
                                        rows={5}
                                        disabled={reportSubmitting}
                                        maxLength={500}
                                    />
                                    <div className="char-count">
                                        {reportReason.length}/500
                                    </div>
                                </div>

                                {reportError && (
                                    <div className="alert alert-error">
                                        <i className="fas fa-exclamation-circle"></i>{" "}
                                        {reportError}
                                    </div>
                                )}

                                {reportSuccess && (
                                    <div className="alert alert-success">
                                        <i className="fas fa-check-circle"></i>{" "}
                                        {reportSuccess}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    onClick={closeReportModal}
                                    className="btn btn-secondary"
                                    disabled={reportSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReport}
                                    className="btn btn-danger"
                                    disabled={
                                        reportSubmitting ||
                                        reportReason.length < 10
                                    }
                                >
                                    {reportSubmitting
                                        ? "Submitting..."
                                        : "Submit Report"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <Toast
                    toast={toast}
                    onClose={() =>
                        setToast({ show: false, message: "", type: "" })
                    }
                />
                <ContestHero
                    contest={contest}
                    progress={progress}
                    timeRemaining={timeRemaining}
                    totalEntries={totalEntries}
                    averageRating={averageRating}
                    prizes={prizes}
                    grandPrize={grandPrize}
                    userEntry={userEntry}
                    contestEnded={contestEnded}
                    loading={loading}
                    onEntrySubmit={handleEntrySubmit}
                    formatDate={formatDate}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    hasSponsors={
                        Array.isArray(contest?.contest_sponsor)
                            ? contest.contest_sponsor.length > 0
                            : !!contest?.contest_sponsor
                    }
                    sponsorsCount={
                        Array.isArray(contest?.contest_sponsor)
                            ? contest.contest_sponsor.length
                            : contest?.contest_sponsor
                              ? 1
                              : 0
                    }
                    reviewsCount={reviews.length}
                />

                <ContestTabs
                    onReportClick={handleReportClick}
                    activeTab={activeTab}
                    contest={contest}
                    entries={entries}
                    reviews={reviews}
                    winners={winners}
                    totalEntries={totalEntries}
                    averageRating={averageRating}
                    showAllEntries={showAllEntries}
                    userReview={userReview}
                    submittingReview={submittingReview}
                    userHasReviewed={userHasReviewed}
                    contestEnded={contestEnded}
                    onTabChange={setActiveTab}
                    onShowAllEntriesChange={setShowAllEntries}
                    onUserReviewChange={setUserReview}
                    onReviewSubmit={handleReviewSubmit}
                    onEntrySubmit={handleEntrySubmit}
                    loading={loading}
                    userEntry={userEntry}
                    formatDate={formatDate}
                />

                <PaymentModal
                    show={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={(paymentData) =>
                        handleEntrySubmit(contest.id, paymentData)
                    }
                    amount={contest.amount}
                    loading={loading}
                />

                <Footer />

                <style jsx>{`
                    /* Global Styles */
                    .container-md {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 0 20px;
                    }

                    .text-white {
                        color: white;
                    }

                    .mt-2 {
                        margin-top: 1rem;
                    }

                    .mb-4 {
                        margin-bottom: 1rem;
                    }

                    .border {
                        border: 1px solid #e2e8f0;
                    }

                    .p-2 {
                        padding: 0.5rem;
                    }

                    .rounded {
                        border-radius: 0.375rem;
                    }

                    /* SVG Icon Styles */
                    .svg-icon {
                        width: 1em;
                        height: 1em;
                        display: inline-block;
                        vertical-align: -0.125em;
                        flex-shrink: 0;
                    }

                    .svg-icon.emoji-icon {
                        width: 1.5em;
                        height: 1.5em;
                    }

                    .svg-spinner {
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }

                    /* Responsive Font Sizes */
                    :global(html) {
                        font-size: 16px;
                    }

                    /* Toast Notifications */
                    .toast-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 16px 20px;
                        border-radius: 12px;
                        color: white;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        z-index: 1000;
                        max-width: min(400px, calc(100vw - 40px));
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                        transform: translateX(400px);
                        opacity: 0;
                        transition: all 0.3s ease;
                    }

                    .toast-notification.show {
                        transform: translateX(0);
                        opacity: 1;
                    }

                    .toast-notification.success {
                        background: linear-gradient(135deg, #10b981, #059669);
                    }

                    .toast-notification.error {
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                    }

                    .toast-notification.info {
                        background: linear-gradient(135deg, #3b82f6, #2563eb);
                    }

                    .toast-close {
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        padding: 4px;
                        margin-left: auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
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

                    /* Loading State */
                    .loading-section {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(
                            135deg,
                            #667eea 0%,
                            #764ba2 100%
                        );
                    }

                    .loading-content {
                        text-align: center;
                        color: white;
                    }

                    .loading-spinner {
                        font-size: clamp(3rem, 8vw, 4rem);
                        margin-bottom: 2rem;
                    }

                    .loading-spinner .svg-icon {
                        width: 1em;
                        height: 1em;
                        animation: pulse 2s ease-in-out infinite;
                    }

                    @keyframes pulse {
                        0%,
                        100% {
                            transform: scale(1);
                        }
                        50% {
                            transform: scale(1.1);
                        }
                    }

                    .loading-content h2 {
                        font-size: clamp(1.5rem, 5vw, 2rem);
                        margin-bottom: 1rem;
                    }

                    /* Error State */
                    .error-section {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(
                            135deg,
                            #f093fb 0%,
                            #f5576c 100%
                        );
                    }

                    .error-content {
                        text-align: center;
                        color: white;
                    }

                    .error-icon {
                        font-size: clamp(3rem, 8vw, 4rem);
                        margin-bottom: 2rem;
                    }

                    .error-icon .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .error-content h2 {
                        font-size: clamp(1.5rem, 5vw, 2rem);
                        margin-bottom: 1rem;
                    }

                    .retry-button {
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid white;
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 2rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        font-size: 1rem;
                    }

                    .retry-button:hover {
                        background: white;
                        color: #f5576c;
                    }

                    .retry-button .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    /* No Contest State */
                    .no-contest-section {
                        min-height: 60vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(
                            135deg,
                            #4facfe 0%,
                            #00f2fe 100%
                        );
                    }

                    .no-contest-content {
                        text-align: center;
                        color: white;
                    }

                    .no-contest-icon {
                        font-size: clamp(3rem, 8vw, 4rem);
                        margin-bottom: 2rem;
                    }

                    .no-contest-icon .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .no-contest-content h1 {
                        font-size: clamp(1.75rem, 6vw, 2.5rem);
                        margin-bottom: 1rem;
                    }

                    .coming-soon-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: rgba(255, 255, 255, 0.2);
                        padding: 8px 16px;
                        border-radius: 20px;
                        margin-top: 1rem;
                        font-size: 0.875rem;
                    }

                    .coming-soon-badge .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    /* Contest Hero Section */

                    .hero-tabs-wrapper {
                        margin-top: 22px;
                        position: relative;
                        z-index: 5;
                    }

                    .hero-tabs {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        justify-content: flex-start;
                        align-items: center;

                        padding: 12px;
                        border-radius: 18px;

                        background: rgba(255, 255, 255, 0.12);
                        border: 1px solid rgba(255, 255, 255, 0.18);
                        backdrop-filter: blur(12px);
                        overflow-x: hidden;
                    }

                    .hero-tab-btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;

                        padding: 10px 14px;
                        border: 0;
                        border-radius: 14px;

                        background: rgba(255, 255, 255, 0.14);
                        color: rgba(255, 255, 255, 0.92);

                        font-weight: 700;
                        font-size: 0.92rem;
                        line-height: 1;

                        cursor: pointer;
                        user-select: none;

                        transition:
                            transform 0.15s ease,
                            background 0.15s ease,
                            box-shadow 0.15s ease;
                        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);

                        flex: 0 1 auto;
                        max-width: 100%;
                    }

                    .hero-tab-btn .svg-icon {
                        width: 1.05em;
                        height: 1.05em;
                        flex-shrink: 0;
                    }

                    .hero-tab-btn span {
                        white-space: nowrap;
                    }

                    /* Hover/Active */
                    .hero-tab-btn:hover {
                        background: rgba(255, 255, 255, 0.22);
                        transform: translateY(-1px);
                    }

                    .hero-tab-btn.active {
                        background: white;
                        color: #1b7a3a;
                        box-shadow: 0 10px 22px rgba(255, 255, 255, 0.2);
                    }

                    @media (max-width: 640px) {
                        .hero-tabs {
                            justify-content: center;
                        }

                        .hero-tab-btn {
                            flex: 1 1 140px;
                            min-width: 140px;
                            max-width: 220px;
                            padding: 12px 14px;
                            border-radius: 14px;
                        }
                    }

                    @media (min-width: 641px) and (max-width: 900px) {
                        .hero-tabs {
                            justify-content: flex-start;
                        }

                        .hero-tab-btn {
                            flex: 0 1 auto;
                            padding: 10px 14px;
                        }
                    }

                    @media (min-width: 900px) {
                        .hero-tabs {
                            justify-content: flex-start;
                            gap: 12px;
                            padding: 14px 16px;
                        }

                        .hero-tab-btn {
                            border-radius: 999px;
                            padding: 10px 16px;
                            flex: 0 0 auto;
                        }
                    }

                    .latest-contest-hero {
                        background: linear-gradient(
                            135deg,
                            #248248 0%,
                            #266a40ff 100%
                        );
                        color: white;
                        padding: 40px 0 60px;
                        position: relative;
                        overflow: hidden;
                    }

                    .latest-contest-hero::before {
                        content: "";
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 41.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
                    }
                    .latest-contest-hero::before {
                        pointer-events: none;
                    }

                    .contest-badge {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                    }

                    .featured-badge,
                    .category-badge,
                    .time-badge {
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    }

                    .featured-badge {
                        background: rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                    }

                    .category-badge {
                        background: rgba(255, 255, 255, 0.15);
                    }

                    .time-badge {
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .contest-badge .svg-icon {
                        width: 0.875em;
                        height: 0.875em;
                    }

                    .hero-main-content {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }

                    @media (min-width: 768px) {
                        .hero-main-content {
                            grid-template-columns: 1fr 1fr;
                            gap: 60px;
                        }
                    }

                    @media (min-width: 1024px) {
                        .hero-main-content {
                            grid-template-columns: 2fr 1fr;
                            gap: 60px;
                        }
                    }

                    .contest-title {
                        font-size: clamp(1.75rem, 6vw, 3rem);
                        font-weight: 700;
                        margin-bottom: 16px;
                        line-height: 1.2;
                        word-break: break-word;
                    }

                    .contest-description {
                        font-size: clamp(0.875rem, 3vw, 1.125rem);
                        line-height: 1.6;
                        margin-bottom: 24px;
                        opacity: 0.9;
                    }

                    .contest-meta-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 24px;
                    }

                    @media (min-width: 640px) {
                        .contest-meta-grid {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 16px;
                        }
                    }

                    .meta-item-contest {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 16px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                        min-height: 80px;
                    }

                    .meta-icon {
                        font-size: 1.5rem;
                        opacity: 0.8;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .meta-icon .svg-icon {
                        width: 1.5em;
                        height: 1.5em;
                    }

                    .meta-value {
                        font-size: 1.25rem;
                        font-weight: 700;
                        margin-bottom: 4px;
                        line-height: 1;
                    }

                    .meta-label {
                        font-size: 0.75rem;
                        opacity: 0.8;
                    }

                    .action-section {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        align-items: flex-start;
                    }

                    @media (min-width: 480px) {
                        .action-section {
                            flex-direction: row;
                            align-items: center;
                            flex-wrap: wrap;
                        }
                    }

                    .cta-button {
                        padding: 14px 24px;
                        border: none;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s ease;
                        white-space: nowrap;
                    }

                    @media (min-width: 640px) {
                        .cta-button {
                            padding: 16px 32px;
                            font-size: 1.125rem;
                        }
                    }

                    .cta-button.primary {
                        background: linear-gradient(135deg, #ffd700, #ff6b00);
                        color: white;
                    }

                    .cta-button.primary:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3);
                    }

                    .cta-button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none !important;
                    }

                    .cta-button .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .entry-status,
                    .contest--notice {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        padding: 16px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                        width: 100%;
                    }

                    @media (min-width: 480px) {
                        .entry-status,
                        .contest--notice {
                            flex-direction: row;
                            align-items: center;
                            padding: 16px 24px;
                        }
                    }

                    .entry-status .svg-icon,
                    .contest--notice .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .view-entry-btn {
                        padding: 8px 16px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 6px;
                        color: white;
                        text-decoration: none;
                        font-size: 0.875rem;
                        transition: all 0.3s ease;
                        text-align: center;
                        white-space: nowrap;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .view-entry-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }

                    .view-entry-btn .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .contest-visual {
                        display: flex;
                        flex-direction: column;
                        gap: 30px;
                    }

                    .progress-container {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 16px;
                        backdrop-filter: blur(10px);
                    }

                    @media (min-width: 640px) {
                        .progress-container {
                            padding: 24px;
                        }
                    }

                    .progress-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                        font-weight: 600;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 640px) {
                        .progress-header {
                            font-size: 1rem;
                            margin-bottom: 15px;
                        }
                    }

                    .progress-percent {
                        color: #ffd700;
                    }

                    .progress-bar {
                        height: 8px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 12px;
                    }

                    .progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #ffd700, #ff6b00);
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    }

                    .progress-dates {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.75rem;
                        opacity: 0.8;
                        flex-wrap: wrap;
                        gap: 8px;
                    }

                    @media (min-width: 640px) {
                        .progress-dates {
                            font-size: 0.875rem;
                        }
                    }

                    .prize-card {
                        position: relative;
                        background: linear-gradient(135deg, #ffd700, #ff6b00);
                        padding: 24px;
                        border-radius: 16px;
                        color: white;
                        overflow: hidden;
                    }

                    @media (min-width: 640px) {
                        .prize-card {
                            padding: 30px;
                        }
                    }

                    .prize-glow {
                        position: absolute;
                        top: -50%;
                        right: -50%;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(
                            circle,
                            rgba(255, 255, 255, 0.3) 0%,
                            transparent 70%
                        );
                        animation: glow 3s ease-in-out infinite alternate;
                    }

                    @keyframes glow {
                        from {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                        to {
                            transform: scale(1.1);
                            opacity: 0.8;
                        }
                    }

                    .prize-icon {
                        font-size: 2rem;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    @media (min-width: 640px) {
                        .prize-icon {
                            font-size: 3rem;
                            margin-bottom: 15px;
                        }
                    }

                    .prize-icon .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .prize-amount {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin: 8px 0;
                    }

                    @media (min-width: 640px) {
                        .prize-amount {
                            font-size: 2rem;
                            margin: 10px 0;
                        }
                    }

                    /* Tabs Section */
                    .contest-details-section {
                        padding: 40px 0 60px;
                        background: #f8fafc;
                    }

                    .tabs-navigation {
                        display: flex;
                        gap: 4px;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 8px;
                        overflow-x: auto;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }

                    .tabs-navigation::-webkit-scrollbar {
                        display: none;
                    }

                    @media (min-width: 768px) {
                        .tabs-navigation {
                            gap: 8px;
                            margin-bottom: 40px;
                        }
                    }

                    .tab-button {
                        padding: 10px 16px;
                        border: none;
                        background: none;
                        border-radius: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-weight: 600;
                        color: #64748b;
                        transition: all 0.3s ease;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }

                    @media (min-width: 768px) {
                        .tab-button {
                            padding: 12px 24px;
                            gap: 8px;
                        }
                    }

                    .tab-button:hover {
                        background: #f1f5f9;
                        color: #334155;
                    }

                    .tab-button.active {
                        background: #248248;
                        color: white;
                    }

                    .tab-button .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .tab-button-text {
                        display: none;
                    }

                    @media (min-width: 480px) {
                        .tab-button-text {
                            display: inline;
                        }
                    }

                    .tab-content {
                        animation: fadeIn 0.5s ease;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    /* Overview Tab */
                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 30px;
                    }

                    @media (min-width: 768px) {
                        .details-grid {
                            grid-template-columns: 2fr 1fr;
                            gap: 40px;
                        }
                    }

                    .details-card,
                    .sidebar-card {
                        background: white;
                        border-radius: 16px;
                        padding: 24px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    }

                    @media (min-width: 640px) {
                        .details-card,
                        .sidebar-card {
                            padding: 30px;
                        }
                    }

                    .card-header {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 20px;
                    }

                    @media (min-width: 480px) {
                        .card-header {
                            flex-direction: row;
                            justify-content: space-between;
                            align-items: center;
                            gap: 16px;
                        }
                    }

                    .card-header h3 {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    @media (min-width: 768px) {
                        .card-header h3 {
                            font-size: 1.5rem;
                        }
                    }

                    .card-header h3 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .card-badge {
                        background: #f1f5f9;
                        color: #64748b;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        align-self: flex-start;
                    }

                    .contest-full-description {
                        line-height: 1.7;
                        color: #475569;
                        margin-bottom: 24px;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .contest-full-description {
                            font-size: 1rem;
                        }
                    }

                    .contest-full-description :global(p) {
                        margin-bottom: 16px;
                    }

                    .contest-full-description :global(h1),
                    .contest-full-description :global(h2),
                    .contest-full-description :global(h3) {
                        color: #1e293b;
                        margin: 20px 0 12px 0;
                    }

                    .rules-section h4 {
                        font-size: 1.125rem;
                        font-weight: 600;
                        margin-bottom: 16px;
                        color: #1e293b;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    @media (min-width: 768px) {
                        .rules-section h4 {
                            font-size: 1.25rem;
                        }
                    }

                    .rules-section h4 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .rules-list {
                        list-style: none;
                        padding: 0;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .rules-list {
                            font-size: 1rem;
                        }
                    }

                    .rules-list li {
                        display: flex;
                        align-items: flex-start;
                        gap: 10px;
                        padding: 10px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .rules-list li:last-child {
                        border-bottom: none;
                    }

                    .rules-list .svg-icon {
                        color: #10b981;
                        flex-shrink: 0;
                        margin-top: 2px;
                        width: 1em;
                        height: 1em;
                    }

                    /* Sidebar Cards */
                    .quick-info h4,
                    .prizes-summary h4 {
                        font-size: 1.125rem;
                        font-weight: 600;
                        margin-bottom: 16px;
                        color: #1e293b;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    @media (min-width: 768px) {
                        .quick-info h4,
                        .prizes-summary h4 {
                            font-size: 1.25rem;
                            margin-bottom: 20px;
                        }
                    }

                    .quick-info h4 .svg-icon,
                    .prizes-summary h4 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .info-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .info-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 12px;
                    }

                    .info-item .svg-icon {
                        color: #3b82f6;
                        font-size: 1rem;
                        flex-shrink: 0;
                        width: 1em;
                        height: 1em;
                    }

                    .info-label {
                        font-size: 0.75rem;
                        color: #64748b;
                    }

                    .info-value {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .info-value {
                            font-size: 1rem;
                        }
                    }

                    .prizes-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .prize-summary-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 12px;
                    }

                    .prize-rank {
                        font-size: 1.25rem;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .prize-rank .svg-icon {
                        width: 1.5em;
                        height: 1.5em;
                    }

                    .prize-details {
                        flex: 1;
                        min-width: 0;
                    }

                    .prize-type {
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        margin-bottom: 4px;
                    }

                    .prize-type:last-child {
                        margin-bottom: 0;
                    }

                    .prize-type.regular {
                        background: #dbeafe;
                        color: #1e40af;
                    }

                    .prize-type.premium {
                        background: #fef3c7;
                        color: #92400e;
                    }

                    .no-prizes {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 16px;
                        background: #f8fafc;
                        border-radius: 12px;
                        color: #64748b;
                        justify-content: center;
                        font-size: 0.875rem;
                    }

                    .no-prizes .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .cta-card {
                        background: linear-gradient(135deg, #248248, #54a673ff);
                        color: white;
                        border-radius: 16px;
                        padding: 24px;
                        margin-top: 24px;
                    }

                    @media (min-width: 768px) {
                        .cta-card {
                            padding: 30px;
                            margin-top: 30px;
                        }
                    }

                    .cta-content h4 {
                        font-size: 1.125rem;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .cta-content p {
                        opacity: 0.9;
                        margin-bottom: 16px;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .cta-content h4 {
                            font-size: 1.25rem;
                        }

                        .cta-content p {
                            font-size: 1rem;
                        }
                    }

                    .cta-content h4 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .cta-button.secondary {
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        width: 100%;
                        justify-content: center;
                    }

                    @media (min-width: 480px) {
                        .cta-button.secondary {
                            width: auto;
                            justify-content: flex-start;
                        }
                    }

                    .cta-button.secondary:hover:not(:disabled) {
                        background: white;
                        color: #3b82f6;
                    }

                    /* Entries Tab */
                    .entries-header {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        margin-bottom: 24px;
                    }

                    @media (min-width: 640px) {
                        .entries-header {
                            flex-direction: row;
                            justify-content: space-between;
                            align-items: center;
                            gap: 20px;
                            margin-bottom: 30px;
                        }
                    }

                    .entries-header h3 {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                    }

                    @media (min-width: 768px) {
                        .entries-header h3 {
                            font-size: 1.5rem;
                        }
                    }

                    .view-toggle-btn {
                        padding: 8px 16px;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 0.875rem;
                        align-self: flex-start;
                    }

                    .entries-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    @media (min-width: 480px) {
                        .entries-grid {
                            grid-template-columns: repeat(
                                auto-fill,
                                minmax(280px, 1fr)
                            );
                        }
                    }

                    @media (min-width: 768px) {
                        .entries-grid {
                            grid-template-columns: repeat(
                                auto-fill,
                                minmax(350px, 1fr)
                            );
                            gap: 24px;
                        }
                    }

                    .entry-card {
                        background: white;
                        border-radius: 16px;
                        padding: 20px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        transition: all 0.3s ease;
                        display: flex;
                        flex-direction: column;
                        min-height: 220px;
                    }

                    @media (min-width: 768px) {
                        .entry-card {
                            padding: 24px;
                        }
                    }

                    .entry-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    }

                    .entry-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 16px;
                    }

                    .entry-user {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex: 1;
                        min-width: 0;
                    }

                    .user-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        object-fit: cover;
                        flex-shrink: 0;
                    }

                    @media (min-width: 768px) {
                        .user-avatar {
                            width: 40px;
                            height: 40px;
                        }
                    }

                    .user-name {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 0.875rem;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    @media (min-width: 768px) {
                        .user-name {
                            font-size: 1rem;
                        }
                    }

                    .entry-date {
                        font-size: 0.75rem;
                        color: #64748b;
                    }

                    .winner-badge {
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 20px;
                        font-size: 0.625rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        flex-shrink: 0;
                        margin-left: 8px;
                    }

                    @media (min-width: 768px) {
                        .winner-badge {
                            font-size: 0.75rem;
                            padding: 6px 12px;
                        }
                    }

                    .winner-badge .svg-icon {
                        width: 0.875em;
                        height: 0.875em;
                    }

                    .entry-content {
                        flex: 1;
                        margin-bottom: 16px;
                    }

                    .entry-title {
                        font-size: 1rem;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #1e293b;
                        line-height: 1.4;
                    }

                    @media (min-width: 768px) {
                        .entry-title {
                            font-size: 1.125rem;
                        }
                    }

                    .entry-description {
                        color: #64748b;
                        line-height: 1.6;
                        font-size: 0.875rem;
                        display: -webkit-box;
                        -webkit-line-clamp: 3;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    @media (min-width: 768px) {
                        .entry-description {
                            font-size: 1rem;
                        }
                    }

                    .entry-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 16px;
                        border-top: 1px solid #f1f5f9;
                    }

                    .entry-stats {
                        display: flex;
                        gap: 16px;
                    }

                    .stat {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        color: #64748b;
                        font-size: 0.75rem;
                    }

                    @media (min-width: 768px) {
                        .stat {
                            font-size: 0.875rem;
                        }
                    }

                    .stat .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .vote-button {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        color: inherit;
                        font-size: inherit;
                    }

                    .vote-button:disabled {
                        cursor: not-allowed;
                        opacity: 0.6;
                    }

                    .vote-button .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .no-entries {
                        text-align: center;
                        padding: 40px 20px;
                        color: #64748b;
                    }

                    .no-entries .svg-icon {
                        width: 3em;
                        height: 3em;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    @media (min-width: 768px) {
                        .no-entries .svg-icon {
                            width: 4em;
                            height: 4em;
                            margin-bottom: 20px;
                        }
                    }

                    .no-entries h4 {
                        font-size: 1.25rem;
                        margin-bottom: 8px;
                        color: #475569;
                    }

                    @media (min-width: 768px) {
                        .no-entries h4 {
                            font-size: 1.5rem;
                        }
                    }

                    /* Reviews Tab */
                    .reviews-header {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                    }

                    @media (min-width: 768px) {
                        .reviews-header {
                            grid-template-columns: 1fr 2fr;
                            gap: 40px;
                            margin-bottom: 40px;
                        }
                    }

                    .rating-overview {
                        background: white;
                        padding: 24px;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        text-align: center;
                    }

                    @media (min-width: 768px) {
                        .rating-overview {
                            padding: 30px;
                        }
                    }

                    .average-rating {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .rating-score {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 8px;
                    }

                    @media (min-width: 768px) {
                        .rating-score {
                            font-size: 3rem;
                        }
                    }

                    .rating-stars {
                        margin-bottom: 8px;
                        display: flex;
                        gap: 4px;
                        justify-content: center;
                    }

                    .rating-stars .svg-icon {
                        width: 1.5em;
                        height: 1.5em;
                    }

                    .rating-stars .svg-icon:not(.active) {
                        color: #cbd5e1;
                    }

                    .rating-stars .svg-icon.active {
                        color: #f59e0b;
                    }

                    .rating-count {
                        color: #64748b;
                        font-size: 0.875rem;
                    }

                    .add-review-section {
                        background: white;
                        padding: 24px;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    }

                    @media (min-width: 768px) {
                        .add-review-section {
                            padding: 30px;
                        }
                    }

                    .add-review-section h4 {
                        font-size: 1.125rem;
                        font-weight: 600;
                        margin-bottom: 16px;
                        color: #1e293b;
                    }

                    @media (min-width: 768px) {
                        .add-review-section h4 {
                            font-size: 1.25rem;
                            margin-bottom: 20px;
                        }
                    }

                    .review-form {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .rating-input label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: #374151;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .rating-input label {
                            font-size: 1rem;
                        }
                    }

                    .star-rating {
                        display: flex;
                        gap: 6px;
                        flex-wrap: wrap;
                    }

                    .star-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 1.25rem;
                        color: #cbd5e1;
                        transition: all 0.2s ease;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    @media (min-width: 768px) {
                        .star-btn {
                            font-size: 1.5rem;
                        }
                    }

                    .star-btn.active {
                        color: #f59e0b;
                    }

                    .star-btn:hover:not(:disabled) {
                        transform: scale(1.2);
                    }

                    .star-btn:disabled {
                        cursor: not-allowed;
                        opacity: 0.6;
                    }

                    .star-btn .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .decision-select {
                        width: 100%;
                        font-size: 0.875rem;
                    }

                    .comment-input textarea {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        font-family: inherit;
                        font-size: 0.875rem;
                        resize: vertical;
                        transition: border-color 0.3s ease;
                        min-height: 100px;
                    }

                    @media (min-width: 768px) {
                        .comment-input textarea {
                            padding: 16px;
                            font-size: 1rem;
                        }
                    }

                    .comment-input textarea:focus {
                        outline: none;
                        border-color: #3b82f6;
                    }

                    .comment-input textarea:disabled {
                        background-color: #f8fafc;
                        cursor: not-allowed;
                    }

                    .submit-review-btn {
                        padding: 10px 20px;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        align-self: flex-start;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .submit-review-btn {
                            padding: 12px 24px;
                            font-size: 1rem;
                            gap: 8px;
                        }
                    }

                    .submit-review-btn:hover:not(:disabled) {
                        background: #2563eb;
                    }

                    .submit-review-btn:disabled {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }

                    .submit-review-btn .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .contest-ended-notice {
                        background: #fef3c7;
                        border: 1px solid #f59e0b;
                        border-radius: 12px;
                        padding: 16px;
                        text-align: center;
                        color: #92400e;
                        font-size: 0.875rem;
                    }

                    .contest-ended-notice .svg-icon {
                        width: 1.5em;
                        height: 1.5em;
                        margin-bottom: 8px;
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    @media (min-width: 768px) {
                        .contest-ended-notice {
                            padding: 20px;
                            font-size: 1rem;
                        }

                        .contest-ended-notice .svg-icon {
                            width: 2em;
                            height: 2em;
                            margin-bottom: 10px;
                        }
                    }

                    .reviews-list {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    @media (min-width: 768px) {
                        .reviews-list {
                            gap: 20px;
                        }
                    }

                    .review-card {
                        background: white;
                        padding: 20px;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    }

                    @media (min-width: 768px) {
                        .review-card {
                            padding: 24px;
                        }
                    }

                    .review-header {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 16px;
                    }

                    @media (min-width: 480px) {
                        .review-header {
                            flex-direction: row;
                            justify-content: space-between;
                            align-items: flex-start;
                            gap: 16px;
                        }
                    }

                    .reviewer-info {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex: 1;
                        min-width: 0;
                    }

                    .reviewer-avatar {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        object-fit: cover;
                        flex-shrink: 0;
                    }

                    @media (min-width: 768px) {
                        .reviewer-avatar {
                            width: 40px;
                            height: 40px;
                        }
                    }

                    .reviewer-details {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                    }

                    .reviewer-name {
                        font-weight: 600;
                        color: #1e293b;
                        margin-bottom: 4px;
                        font-size: 0.875rem;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    @media (min-width: 768px) {
                        .reviewer-name {
                            font-size: 1rem;
                        }
                    }

                    .review-rating {
                        display: flex;
                        gap: 2px;
                    }

                    .review-rating .svg-icon {
                        width: 0.875em;
                        height: 0.875em;
                        color: #f59e0b;
                    }

                    .review-date {
                        color: #64748b;
                        font-size: 0.75rem;
                        flex-shrink: 0;
                    }

                    .review-content p {
                        line-height: 1.6;
                        color: #475569;
                        font-size: 0.875rem;
                    }

                    @media (min-width: 768px) {
                        .review-content p {
                            font-size: 1rem;
                        }
                    }

                    .no-reviews {
                        text-align: center;
                        padding: 40px 20px;
                        color: #64748b;
                    }

                    .no-reviews .svg-icon {
                        width: 3em;
                        height: 3em;
                        margin-bottom: 16px;
                        opacity: 0.5;
                        color: #f59e0b;
                    }

                    @media (min-width: 768px) {
                        .no-reviews .svg-icon {
                            width: 4em;
                            height: 4em;
                            margin-bottom: 20px;
                        }
                    }

                    .no-reviews h4 {
                        font-size: 1.25rem;
                        margin-bottom: 8px;
                        color: #475569;
                    }

                    @media (min-width: 768px) {
                        .no-reviews h4 {
                            font-size: 1.5rem;
                        }
                    }

                    /* Winners Tab */
                    .winners-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    @media (min-width: 768px) {
                        .winners-header {
                            margin-bottom: 40px;
                        }
                    }

                    .winners-header h3 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: #1e293b;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    @media (min-width: 768px) {
                        .winners-header h3 {
                            font-size: 2rem;
                        }
                    }

                    .winners-header h3 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .winners-header p {
                        font-size: 1rem;
                        color: #64748b;
                    }

                    @media (min-width: 768px) {
                        .winners-header p {
                            font-size: 1.125rem;
                        }
                    }

                    .winners-podium {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 20px;
                        align-items: end;
                        margin-bottom: 30px;
                    }

                    @media (min-width: 768px) {
                        .winners-podium {
                            grid-template-columns: repeat(3, 1fr);
                            gap: 30px;
                            margin-bottom: 40px;
                        }
                    }

                    .winner-card {
                        background: white;
                        padding: 24px;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        text-align: center;
                        position: relative;
                    }

                    @media (min-width: 768px) {
                        .winner-card {
                            padding: 30px;
                        }

                        .winner-card.position-1 {
                            transform: translateY(-20px);
                            background: linear-gradient(
                                135deg,
                                #fef3c7,
                                #f59e0b
                            );
                        }
                    }

                    .winner-card.position-2 {
                        background: linear-gradient(135deg, #e5e7eb, #6b7280);
                    }

                    .winner-card.position-3 {
                        background: linear-gradient(135deg, #fcd34d, #f59e0b);
                    }

                    .winner-medal {
                        font-size: 3rem;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    @media (min-width: 768px) {
                        .winner-medal {
                            font-size: 4rem;
                            margin-bottom: 16px;
                        }
                    }

                    .winner-medal .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .winner-avatar {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        object-fit: cover;
                        margin: 0 auto 12px;
                        border: 3px solid white;
                    }

                    @media (min-width: 768px) {
                        .winner-avatar {
                            width: 80px;
                            height: 80px;
                            border: 4px solid white;
                            margin: 0 auto 16px;
                        }
                    }

                    .winner-info {
                        min-height: 60px;
                    }

                    .winner-name {
                        font-size: 1.125rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: #1e293b;
                        word-break: break-word;
                    }

                    @media (min-width: 768px) {
                        .winner-name {
                            font-size: 1.25rem;
                        }
                    }

                    .winner-prize {
                        font-size: 1rem;
                        font-weight: 600;
                        margin-bottom: 4px;
                        color: #059669;
                    }

                    @media (min-width: 768px) {
                        .winner-prize {
                            font-size: 1.125rem;
                        }
                    }

                    .winner-entry {
                        color: #2c3138ff;
                        font-size: 0.75rem;
                        line-height: 1.4;
                    }

                    @media (min-width: 768px) {
                        .winner-entry {
                            font-size: 0.875rem;
                        }
                    }

                    .no-winners {
                        text-align: center;
                        padding: 40px 20px;
                        color: #64748b;
                    }

                    .no-winners .svg-icon {
                        width: 3em;
                        height: 3em;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    @media (min-width: 768px) {
                        .no-winners .svg-icon {
                            width: 4em;
                            height: 4em;
                            margin-bottom: 20px;
                        }
                    }

                    .no-winners h4 {
                        font-size: 1.25rem;
                        margin-bottom: 8px;
                        color: #475569;
                    }

                    @media (min-width: 768px) {
                        .no-winners h4 {
                            font-size: 1.5rem;
                        }
                    }

                    /* Sponsor Tab Styles */
                    .sponsor-tab {
                        padding: 20px 0;
                    }

                    .sponsor-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    @media (min-width: 768px) {
                        .sponsor-header {
                            margin-bottom: 40px;
                        }
                    }

                    .sponsor-header h3 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: #1e293b;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    }

                    @media (min-width: 768px) {
                        .sponsor-header h3 {
                            font-size: 2rem;
                        }
                    }

                    .sponsor-header h3 .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .sponsor-header p {
                        font-size: 1rem;
                        color: #64748b;
                    }

                    @media (min-width: 768px) {
                        .sponsor-header p {
                            font-size: 1.125rem;
                        }
                    }

                    .sponsor-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 20px;
                        margin-bottom: 30px;
                    }

                    @media (min-width: 768px) {
                        .sponsor-grid {
                            grid-template-columns: repeat(
                                auto-fit,
                                minmax(300px, 1fr)
                            );
                            gap: 24px;
                            margin-bottom: 40px;
                        }
                    }

                    .sponsor-card {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                        background: white;
                        border-radius: 16px;
                        padding: 24px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                        transition: all 0.3s ease;
                    }

                    @media (min-width: 768px) {
                        .sponsor-card {
                            flex-direction: row;
                            align-items: center;
                        }
                    }

                    .sponsor-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                    }

                    .sponsor-avatar {
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    @media (min-width: 768px) {
                        .sponsor-avatar {
                            width: 65%;
                        }
                    }

                    .sponsor-avatar img {
                        width: 100%;
                        max-width: 300px;
                        height: auto;
                        max-height: 200px;
                        object-fit: contain;
                        border-radius: 12px;
                        border: 4px solid #f1f5f9;
                    }

                    .sponsor-info {
                        flex: 1;
                        text-align: center;
                        width: 100%;
                    }

                    @media (min-width: 768px) {
                        .sponsor-info {
                            text-align: right;
                        }
                    }

                    .sponsor-name {
                        font-size: 1.125rem;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 12px;
                        word-break: break-word;
                    }

                    @media (min-width: 768px) {
                        .sponsor-name {
                            font-size: 1.25rem;
                            margin-bottom: 8px;
                        }
                    }

                    .sponsor-contact {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #64748b;
                        font-size: 0.875rem;
                        margin-bottom: 6px;
                        justify-content: center;
                    }

                    @media (min-width: 768px) {
                        .sponsor-contact {
                            justify-content: flex-end;
                        }
                    }

                    .sponsor-contact .svg-icon {
                        color: #3b82f6;
                        width: 1em;
                        height: 1em;
                        flex-shrink: 0;
                    }

                    .sponsor-contact a {
                        color: inherit;
                        text-decoration: none;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .sponsor-contact a:hover {
                        color: #3b82f6;
                        text-decoration: underline;
                    }

                    .verification-badge {
                        display: inline-flex;
                        gap: 6px;
                        background: #10b981;
                        color: white;
                        padding: 4px 10px;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        margin-top: 8px;
                        align-items: center;
                        justify-content: center;
                    }

                    .verification-badge .svg-icon {
                        width: 1em;
                        height: 1em;
                    }

                    .no-sponsor {
                        text-align: center;
                        padding: 40px 20px;
                        color: #64748b;
                    }

                    .no-sponsor .svg-icon {
                        width: 3em;
                        height: 3em;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    @media (min-width: 768px) {
                        .no-sponsor .svg-icon {
                            width: 4em;
                            height: 4em;
                            margin-bottom: 20px;
                        }
                    }

                    .no-sponsor h3 {
                        font-size: 1.25rem;
                        margin-bottom: 8px;
                        color: #475569;
                    }

                    @media (min-width: 768px) {
                        .no-sponsor h3 {
                            font-size: 1.5rem;
                        }
                    }

                    /* Login Prompt */
                    .login-prompt {
                        grid-column: 1 / -1;
                        text-align: center;
                        padding: 40px 20px;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    }

                    .login-prompt p {
                        font-size: 1rem;
                        color: #475569;
                    }

                    .login-prompt a {
                        color: #3b82f6;
                        text-decoration: none;
                        font-weight: 600;
                    }

                    .login-prompt a:hover {
                        text-decoration: underline;
                    }

                    /* Touch-friendly improvements */
                    @media (hover: none) and (pointer: coarse) {
                        .tab-button,
                        .cta-button,
                        .view-toggle-btn,
                        .vote-button,
                        .star-btn,
                        .submit-review-btn {
                            min-height: 44px;
                            min-width: 44px;
                        }

                        .vote-button,
                        .star-btn {
                            padding: 8px;
                        }

                        .tabs-navigation {
                            gap: 8px;
                        }

                        .tab-button {
                            padding: 12px 16px;
                        }
                    }

                    /* High contrast mode support */
                    @media (prefers-contrast: high) {
                        .toast-notification {
                            border: 2px solid white;
                        }

                        .tab-button.active {
                            outline: 2px solid white;
                            outline-offset: 2px;
                        }

                        .cta-button {
                            border: 2px solid transparent;
                        }

                        .vote-button:disabled,
                        .star-btn:disabled,
                        .submit-review-btn:disabled {
                            opacity: 0.4;
                        }
                    }

                    /* Reduced motion */
                    @media (prefers-reduced-motion: reduce) {
                        .toast-notification,
                        .cta-button,
                        .entry-card,
                        .sponsor-card,
                        .prize-glow,
                        .svg-spinner {
                            transition: none;
                            animation: none;
                        }

                        .loading-spinner .svg-icon {
                            animation: none;
                        }
                    }
                    .modal-backdrop {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        z-index: 99999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .modal-container {
                        background: #ffffff;
                        width: 100%;
                        max-width: 500px;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        animation: fadeIn 0.2s ease-out;
                    }
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    .modal-header {
                        background: #ffffff;
                        padding: 16px 24px;
                        border-bottom: 1px solid #eaeaea;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-title {
                        font-size: 18px;
                        font-weight: 600;
                        color: #1a1a1a;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .modal-title i {
                        color: #dc3545;
                    }
                    .modal-close-btn {
                        background: transparent;
                        border: none;
                        color: #666;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 5px;
                        border-radius: 50%;
                        transition: background 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                    }
                    .modal-close-btn:hover {
                        background: #f5f5f5;
                        color: #333;
                    }
                    .modal-body {
                        padding: 24px;
                        background: #fff;
                    }
                    .info-box {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        padding: 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        color: #555;
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .info-box i {
                        color: #007bff;
                        margin-top: 2px;
                    }
                    .form-group {
                        margin-bottom: 0;
                    }
                    .form-label {
                        display: block;
                        font-weight: 500;
                        margin-bottom: 8px;
                        color: #333;
                        font-size: 14px;
                    }
                    .required {
                        color: #dc3545;
                    }
                    .form-textarea {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #ced4da;
                        border-radius: 8px;
                        font-family: inherit;
                        font-size: 14px;
                        color: #333;
                        transition: border-color 0.2s;
                        resize: vertical;
                    }
                    .form-textarea:focus {
                        outline: none;
                        border-color: #80bdff;
                        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                    }
                    .char-count {
                        text-align: right;
                        font-size: 12px;
                        color: #999;
                        margin-top: 5px;
                    }
                    .alert {
                        margin-top: 15px;
                        padding: 10px 15px;
                        border-radius: 6px;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .alert-error {
                        background: #fde8e8;
                        color: #c53030;
                    }
                    .alert-success {
                        background: #def7ec;
                        color: #03543f;
                    }
                    .modal-footer {
                        padding: 16px 24px;
                        background: #f8f9fa;
                        border-top: 1px solid #eaeaea;
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                    }
                    .btn {
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 500;
                        font-size: 14px;
                        cursor: pointer;
                        border: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .btn-secondary {
                        background: #fff;
                        border-color: #ced4da;
                        color: #495057;
                    }
                    .btn-secondary:hover:not(:disabled) {
                        background: #e9ecef;
                        border-color: #adb5bd;
                    }
                    .btn-danger {
                        background: #dc3545;
                        color: white;
                    }
                    .btn-danger:hover:not(:disabled) {
                        background: #c82333;
                    }

                    /* --- Entry card report button --- */
                    .btn-report {
                        background: none;
                        border: none;
                        color: #9ca3af;
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        transition: color 0.2s;
                        padding: 0;
                    }
                    .btn-report:hover {
                        color: #dc3545;
                    }
                    .btn-report .svg-icon {
                        width: 13px;
                        height: 13px;
                    }
                `}</style>
            </FrontAuthenticatedLayout>
        </>
    );
}

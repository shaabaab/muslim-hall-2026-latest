import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

export default function Header() {
    const { header, auth } = usePage().props;
    const user = auth?.user;
    const isMember = user?.subscriptions?.[0]?.status == 1;
    const canAccess = isMember || user?.role == 2;

    const [state, setState] = useState({
        mobile: false,
        search: false,
        query: "",
        showRestrictedModal: false,
        restrictedLink: null,

        // ✅ mobile submenu state
        mobileIslamicOpen: false,
        mobileCalendarOpen: false,
    });

    const updateState = (key, value) =>
        setState((prev) => ({ ...prev, [key]: value }));

    const commonLinks = useMemo(
        () => [
            { href: "/", label: "Home", icon: "fa-home" },
            { href: "/post-details", label: "Posts", icon: "fa-newspaper" },
        ],
        [],
    );

    const featureLinks = useMemo(
        () => [
            {
                href: "/community",
                label: "Community",
                icon: "fa-users",
                restricted: true,
            },
            {
                href: "/exhibition-details",
                label: "Exhibition",
                icon: "fa-images",
                restricted: true,
            },
            {
                href: "/contests-details",
                label: "Contest",
                icon: "fa-trophy",
                restricted: false,
            },
        ],
        [],
    );

    // Bootstrap only once
    useEffect(() => {
        if (typeof window !== "undefined" && !window.bootstrap) {
            const s = document.createElement("script");
            s.src =
                "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
            s.crossOrigin = "anonymous";
            document.head.appendChild(s);
        }
    }, []);

    // ✅ Always close mobile menu on first mount
    useEffect(() => {
        setState((p) => ({ ...p, mobile: false }));
    }, []);

    // ✅ Close menu on route change (Inertia)
    useEffect(() => {
        const off = router.on("start", () => {
            setState((p) => ({
                ...p,
                mobile: false,
                search: false,
                query: "",
                mobileIslamicOpen: false,
                mobileCalendarOpen: false,
            }));
        });

        return () => off();
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = state.mobile ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [state.mobile]);

    // Close on ESC
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setState((p) => ({
                    ...p,
                    mobile: false,
                    search: false,
                    query: "",
                    showRestrictedModal: false,
                    restrictedLink: null,
                    mobileIslamicOpen: false,
                    mobileCalendarOpen: false,
                }));
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (state.query.trim()) {
            router.get(
                "/search",
                { q: state.query.trim() },
                { preserveState: true, preserveScroll: true },
            );
            updateState("search", false);
            updateState("query", "");
        }
    };

    const handleRestrictedLinkClick = (e, link) => {
        e.preventDefault();
        if (link.restricted && !canAccess) {
            setState((prev) => ({
                ...prev,
                showRestrictedModal: true,
                restrictedLink: link,
            }));
        } else {
            router.get(link.href);
        }
    };

    const closeRestrictedModal = () => {
        setState((prev) => ({
            ...prev,
            showRestrictedModal: false,
            restrictedLink: null,
        }));
    };

    const renderAuth = (isMobile) => {
        const baseClass = isMobile ? "mobile-register-btn" : "register-btn";
        if (!user)
            return (
                <Link
                    className={baseClass}
                    href="/login"
                    onClick={() => isMobile && updateState("mobile", false)}
                >
                    <i className="fas fa-sign-in-alt mr-2"></i>Login
                </Link>
            );

        if (user.role == 1 || user.role == 2) {
            return (
                <Link
                    className={baseClass}
                    href={user.role == 1 ? "/dashboard" : "/admin/dashboard"}
                    onClick={() => isMobile && updateState("mobile", false)}
                >
                    <i
                        className={`fas ${
                            user.role == 1 ? "fa-tachometer-alt" : "fa-crown"
                        } mr-2`}
                    ></i>
                    {user.role == 1 ? "Dashboard" : "Admin"}
                </Link>
            );
        }
        return null;
    };

    // ✅ FIX: Logo never disappears / never changes width
    const [logoOk, setLogoOk] = useState(true);

    const LogoContent = () => {
        if (header?.header_logo && logoOk) {
            return (
                <div className="logo-image">
                    <img
                        src={getS3PublicUrl(`${header.header_logo}`)}
                        alt={header?.header_title || "Muslim Hall"}
                        loading="eager"
                        decoding="async"
                        onError={() => setLogoOk(false)}
                    />
                </div>
            );
        }

        return (
            <div className="logo-icon">
                <i className="fas fa-mosque"></i>
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>
                    {header?.header_title ||
                        "Muslim Hall - Islamic Publications"}
                </title>

                {/* ✅ Zoom out / mobile width fix */}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                />

                <link
                    rel="icon"
                    type="image/x-icon"
                    href={
                        header?.favicon
                            ? getS3PublicUrl(header.favicon)
                            : "/favicon.ico"
                    }
                />
                <link
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                    rel="stylesheet"
                />
                <meta
                    name="description"
                    content={
                        header?.footer_content || "Muslim Hall Islamic content"
                    }
                />
            </Head>

            {/* ✅ GLOBAL FIX: prevent zoom-out gap + horizontal overflow */}
            <style jsx global>{`
                html {
                    overflow-y: scroll;
                    width: 100%;
                    max-width: 100%;
                }
                body {
                  padding-top: 72px; 
                    scrollbar-gutter: stable;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                }
                #app {
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                }
                img,
                video,
                canvas,
                svg {
                    max-width: 100%;
                    height: auto;
                }
                @media (min-width: 992px) {
                    .desktop-islamic-dropdown:hover > .dropdown-menu {
                        display: block;
                        margin-top: 0;
                    }
                    .dropdown-submenu {
                        position: relative;
                    }
                    .dropdown-submenu:hover > .dropdown-menu {
                        display: block;
                        top: 0;
                        left: 100%;
                        margin-top: -1px;
                    }
                }
            `}</style>

            {/* Restricted Access Modal */}
            {state.showRestrictedModal && (
                <div className="modal-overlay" onClick={closeRestrictedModal}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i
                                    className="fas fa-lock mr-2"
                                    style={{ color: "#1b7a3a" }}
                                ></i>
                                Member Exclusive
                            </h3>
                            <button
                                className="modal-close"
                                onClick={closeRestrictedModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-icon">
                                <i className="fas fa-crown"></i>
                            </div>
                            <h4 className="modal-feature-title">
                                Members Only
                            </h4>
                            <p className="modal-description">
                                Join our community to access exclusive features
                                including:
                            </p>

                            <div className="modal-buttons">
                                <Link
                                    href="/login"
                                    className="modal-btn-primary"
                                    onClick={closeRestrictedModal}
                                >
                                    <i className="fas fa-user-plus mr-2"></i>
                                    Member
                                </Link>
                                <button
                                    className="modal-btn-secondary"
                                    onClick={closeRestrictedModal}
                                >
                                    Maybe Later
                                </button>
                            </div>

                            {user && !isMember && (
                                <p className="modal-login-note">
                                    <i className="fas fa-info-circle"></i>
                                    You're logged in but not a member yet.
                                    <Link
                                        href="/membership"
                                        className="upgrade-link"
                                    >
                                        Upgrade to Membership
                                    </Link>
                                </p>
                            )}

                            {!user && (
                                <p className="modal-login-note">
                                    <i className="fas fa-sign-in-alt"></i>
                                    Already have an account?
                                    <Link
                                        href="/login"
                                        className="login-link"
                                        onClick={closeRestrictedModal}
                                    >
                                        {" "}
                                        Login
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer */}
            <div className="header-spacer" aria-hidden="true" />

            <div className="header-container">
                {/* Mobile Search */}
                <div
                    className={`mobil__searchbar ${state.search ? "active" : ""}`}
                    id="mobilSearch"
                >
                    <div className="input__wrapper">
                        <div className="container-md">
                            <div className="row">
                                <div className="col-12">
                                    <div className="pb-3 d-flex align-items-center justify-content-between">
                                        <h5 className="text-white mb-0">
                                            What are you looking for?
                                        </h5>
                                        <span
                                            className="close__search text-white cursor-pointer"
                                            onClick={() => {
                                                updateState("search", false);
                                                updateState("query", "");
                                            }}
                                        >
                                            Close
                                        </span>
                                    </div>

                                    <form onSubmit={handleSearch}>
                                        <div className="d-flex">
                                            <input
                                                placeholder="Search Item, Creators, Collections etc."
                                                type="text"
                                                className="form-control"
                                                value={state.query}
                                                onChange={(e) =>
                                                    updateState(
                                                        "query",
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                className="submit-v1 ml-2"
                                                disabled={!state.query.trim()}
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <header className="header-main fixed">
                    <div className="header-content">
                        <Link
                            href="/"
                            className="logo-brand flex items-center gap-1.5 xs:gap-2 min-w-0 flex-nowrap"
                        >
                            <div className="flex items-center">
                                <span className="">
                                    <LogoContent />
                                </span>

                                <span className="md:hidden whitespace-nowrap text-base sm:text-xl font-bold text-green-700 leading-none mr-8 muslim-hall-text">
                                    Muslim Hall
                                </span>
                            </div>
                        </Link>

                        <nav className="desktop-nav">
                            <ul className="nav-list">
                                {commonLinks.map((l, i) => (
                                    <li key={i} className="nav-item">
                                        <Link
                                            className="nav-link"
                                            href={l.href}
                                        >
                                            <i
                                                className={`fas ${l.icon} mr-2`}
                                            ></i>
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}

                                <li className="nav-item dropdown desktop-islamic-dropdown">
                                    <Link
                                        className="nav-link dropdown-toggle"
                                        href="/islamic-zone"
                                    >
                                        <i className="fas fa-star-and-crescent mr-2"></i>
                                        Islamic Zone
                                    </Link>

                                    <ul className="dropdown-menu">
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                href="/book-details"
                                            >
                                                <i className="fas fa-book mr-2"></i>
                                                Books
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                href="/islamic-details"
                                            >
                                                <i className="fas fa-quran mr-2"></i>
                                                Islamic Content
                                            </Link>
                                        </li>

                                        <li className="dropdown-submenu">
                                            <a
                                                className="dropdown-item dropdown-toggle"
                                                href="#"
                                            >
                                                <i className="fas fa-calendar-alt mr-2"></i>
                                                Calendar
                                            </a>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <Link
                                                        className="dropdown-item"
                                                        href="/islamic/calendar"
                                                    >
                                                        <i className="fas fa-calendar mr-2"></i>
                                                        Islamic Calendar
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        className="dropdown-item"
                                                        href="/prayer/calendar"
                                                    >
                                                        <i className="fas fa-clock mr-2"></i>
                                                        Prayer Calendar
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        className="dropdown-item"
                                                        href="/ramadan/calendar"
                                                    >
                                                        <i className="fas fa-moon mr-2"></i>
                                                        Ramadan Calendar
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>

                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                href="/islamic/quran"
                                            >
                                                <i className="fas fa-quran mr-2"></i>
                                                Quran
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="dropdown-item"
                                                href="/islamic/hadith"
                                            >
                                                <i className="fas fa-quote-right mr-2"></i>
                                                Hadith
                                            </Link>
                                        </li>
                                    </ul>
                                </li>

                                {featureLinks.map((l, i) => (
                                    <li key={i} className="nav-item">
                                        {l.restricted && !canAccess ? (
                                            <a
                                                className="nav-link restricted-link"
                                                href="#"
                                                onClick={(e) =>
                                                    handleRestrictedLinkClick(
                                                        e,
                                                        l,
                                                    )
                                                }
                                            >
                                                <i
                                                    className={`fas ${l.icon} mr-2`}
                                                ></i>
                                                {l.label}
                                                <span className="member-badge">
                                                    <i className="fas fa-crown"></i>
                                                </span>
                                            </a>
                                        ) : (
                                            <Link
                                                className="nav-link"
                                                href={l.href}
                                            >
                                                <i
                                                    className={`fas ${l.icon} mr-2`}
                                                ></i>
                                                {l.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        <div className="header-actions">
                            {state.search && (
                                <div className="desktop-search-input">
                                    <form
                                        onSubmit={handleSearch}
                                        className="search-form"
                                    >
                                        <div className="search-input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="Search posts, articles, books..."
                                                className="search-input"
                                                value={state.query}
                                                onChange={(e) =>
                                                    updateState(
                                                        "query",
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                className="search-submit"
                                                disabled={!state.query.trim()}
                                                aria-label="Search"
                                            >
                                                <i className="fas fa-search"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="search-close"
                                                aria-label="Close search"
                                                onClick={() => {
                                                    updateState(
                                                        "search",
                                                        false,
                                                    );
                                                    updateState("query", "");
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <button
                                className="search-btn"
                                onClick={() =>
                                    updateState("search", !state.search)
                                }
                                aria-label="Toggle search"
                            >
                                <i className="fas fa-search"></i>
                            </button>

                            <div className="hidden md:flex items-center gap-3">
                                {renderAuth(false)}
                            </div>

                            <button
                                className="mobile-menu-toggle"
                                onClick={() =>
                                    updateState("mobile", !state.mobile)
                                }
                                aria-label="Toggle menu"
                            >
                                <span
                                    className={`hamburger ${state.mobile ? "active" : ""}`}
                                >
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Nav */}
                    <div
                        className={`mobile-nav ${state.mobile ? "active" : ""}`}
                    >
                        <div className="mobile-nav-content">
                            <div className="mobile-nav-header">
                                <Link
                                    href="/"
                                    onClick={() => updateState("mobile", false)}
                                    className="flex  items-center justify-center gap-2"
                                >
                                    <LogoContent />
                                    <span className="text-xl font-extrabold text-green-700 tracking-wide">
                                        Muslim Hall
                                    </span>
                                </Link>
                                <button
                                    className="mobile-close-btn"
                                    onClick={() => updateState("mobile", false)}
                                    aria-label="Close menu"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <ul className="mobile-nav-list">
                                {commonLinks.map((l, i) => (
                                    <li key={i} className="mobile-nav-item">
                                        <Link
                                            className="mobile-nav-link"
                                            href={l.href}
                                            onClick={() =>
                                                setState((p) => ({
                                                    ...p,
                                                    mobile: false,
                                                    mobileIslamicOpen: false,
                                                    mobileCalendarOpen: false,
                                                }))
                                            }
                                        >
                                            <i
                                                className={`fas ${l.icon} mr-2`}
                                            ></i>
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}

                                {/* Islamic Zone */}
                                <li className="mobile-nav-item mobile-dropdown">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <Link href="/islamic-zone" className="mobile-nav-link text-decoration-none flex-grow-1" onClick={() => updateState("mobile", false)}>
                                            <i className="fas fa-star-and-crescent mr-2"></i>
                                            Islamic Zone
                                        </Link>
                                        <button
                                            className="mobile-dropdown-toggle border-0 bg-transparent text-white p-2"
                                            type="button"
                                            onClick={() =>
                                                setState((p) => ({
                                                    ...p,
                                                    mobileIslamicOpen: !p.mobileIslamicOpen,
                                                    mobileCalendarOpen: false,
                                                }))
                                            }
                                        >
                                            <i
                                                className={`fas fa-chevron-down ${
                                                    state.mobileIslamicOpen ? "rot" : ""
                                                }`}
                                            ></i>
                                        </button>
                                    </div>

                                    <ul
                                        className={`mobile-submenu ${
                                            state.mobileIslamicOpen
                                                ? "open"
                                                : ""
                                        }`}
                                    >
                                        <li>
                                            <Link
                                                className="mobile-submenu-link"
                                                href="/book-details"
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobile: false,
                                                        mobileIslamicOpen: false,
                                                        mobileCalendarOpen: false,
                                                    }))
                                                }
                                            >
                                                <i className="fas fa-book mr-2"></i>
                                                Books
                                            </Link>
                                        </li>

                                        <li>
                                            <Link
                                                className="mobile-submenu-link"
                                                href="/islamic-details"
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobile: false,
                                                        mobileIslamicOpen: false,
                                                        mobileCalendarOpen: false,
                                                    }))
                                                }
                                            >
                                                <i className="fas fa-quran mr-2"></i>
                                                Islamic Content
                                            </Link>
                                        </li>

                                        {/* Calendar */}
                                        <li className="mobile-submenu-item">
                                            <button
                                                className="mobile-submenu-link mobile-submenu-toggle"
                                                type="button"
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobileCalendarOpen:
                                                            !p.mobileCalendarOpen,
                                                    }))
                                                }
                                            >
                                                <span className="d-flex align-items-center">
                                                    <i className="fas fa-calendar-alt mr-2"></i>
                                                    Calendar
                                                </span>
                                                <i
                                                    className={`fas fa-chevron-down ml-auto ${
                                                        state.mobileCalendarOpen
                                                            ? "rot"
                                                            : ""
                                                    }`}
                                                ></i>
                                            </button>

                                            <ul
                                                className={`mobile-submenu-inner ${
                                                    state.mobileCalendarOpen
                                                        ? "open"
                                                        : ""
                                                }`}
                                            >
                                                <li>
                                                    <Link
                                                        className="mobile-submenu-link"
                                                        href="/islamic/calendar"
                                                        onClick={() =>
                                                            setState((p) => ({
                                                                ...p,
                                                                mobile: false,
                                                                mobileIslamicOpen: false,
                                                                mobileCalendarOpen: false,
                                                            }))
                                                        }
                                                    >
                                                        <i className="fas fa-calendar mr-2"></i>
                                                        Islamic Calendar
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        className="mobile-submenu-link"
                                                        href="/prayer/calendar"
                                                        onClick={() =>
                                                            setState((p) => ({
                                                                ...p,
                                                                mobile: false,
                                                                mobileIslamicOpen: false,
                                                                mobileCalendarOpen: false,
                                                            }))
                                                        }
                                                    >
                                                        <i className="fas fa-clock mr-2"></i>
                                                        Prayer Calendar
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link
                                                        className="mobile-submenu-link"
                                                        href="/ramadan/calendar"
                                                        onClick={() =>
                                                            setState((p) => ({
                                                                ...p,
                                                                mobile: false,
                                                                mobileIslamicOpen: false,
                                                                mobileCalendarOpen: false,
                                                            }))
                                                        }
                                                    >
                                                        <i className="fas fa-moon mr-2"></i>
                                                        Ramadan Calendar
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>

                                        <li>
                                            <Link
                                                className="mobile-submenu-link"
                                                href="/islamic/quran"
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobile: false,
                                                        mobileIslamicOpen: false,
                                                        mobileCalendarOpen: false,
                                                    }))
                                                }
                                            >
                                                <i className="fas fa-quran mr-2"></i>
                                                Quran
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                className="mobile-submenu-link"
                                                href="/islamic/hadith"
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobile: false,
                                                        mobileIslamicOpen: false,
                                                        mobileCalendarOpen: false,
                                                    }))
                                                }
                                            >
                                                <i className="fas fa-quote-right mr-2"></i>
                                                Hadith
                                            </Link>
                                        </li>
                                    </ul>
                                </li>

                                {featureLinks.map((l, i) => (
                                    <li key={i} className="mobile-nav-item">
                                        {l.restricted && !canAccess ? (
                                            <a
                                                className="mobile-nav-link restricted-link"
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRestrictedLinkClick(
                                                        e,
                                                        l,
                                                    );
                                                    updateState(
                                                        "mobile",
                                                        false,
                                                    );
                                                }}
                                            >
                                                <i
                                                    className={`fas ${l.icon} mr-2`}
                                                ></i>
                                                {l.label}
                                                <span className="member-badge">
                                                    <i className="fas fa-crown"></i>
                                                </span>
                                            </a>
                                        ) : (
                                            <Link
                                                className="mobile-nav-link"
                                                href={l.href}
                                                onClick={() =>
                                                    setState((p) => ({
                                                        ...p,
                                                        mobile: false,
                                                        mobileIslamicOpen: false,
                                                        mobileCalendarOpen: false,
                                                    }))
                                                }
                                            >
                                                <i
                                                    className={`fas ${l.icon} mr-2`}
                                                ></i>
                                                {l.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            <div className="mobile-auth-section">
                                {renderAuth(true)}
                            </div>
                        </div>
                    </div>

                    <div
                        className={`mobile-nav-overlay ${state.mobile ? "active" : ""}`}
                        onClick={() => updateState("mobile", false)}
                    ></div>
                </header>

                {/* Css Style */}
                <style jsx>{`
                    :global(:root) {
                        --header-h: 85px;
                    }

                    .header-spacer {
                        height: var(--header-h);
                    }

                    .header-container {
                        width: 100%;
                        max-width: 100%;
                        overflow-x: clip;
                    }

                    .header-main.fixed {
                        position: fixed;
                        top: 0;
                        z-index: 999;
                        left: 0;
                        right: 0;
                        background: rgba(255, 255, 255, 0.92);
                        backdrop-filter: blur(14px) saturate(140%);
                        -webkit-backdrop-filter: blur(14px) saturate(140%);
                        border-bottom: 1px solid rgba(27, 122, 58, 0.12);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                    }

                    .header-content {
                        max-width: 1400px;
                        margin: 0 auto;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        height: var(--header-h);
                        padding: 10px 80px;
                    }

                    .muslim-hall-text {
                        margin-right: 10px;
                    }

                    .logo-brand {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        text-decoration: none;
                        color: #1a1a1a;
                    }

                    .logo-image {
                        width: 170px;
                        height: 80px;
                        display: flex;
                        align-items: center;
                    }
                    .logo-image img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        object-position: left center;
                        display: block;
                        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
                    }

                    .logo-icon {
                        width: 50px;
                        height: 50px;
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 22px;
                        box-shadow: 0 6px 16px rgba(27, 122, 58, 0.18);
                    }

                    .desktop-nav {
                        display: flex;
                        align-items: center;
                    }
                    .nav-list {
                        display: flex;
                        list-style: none;
                        margin: 0;
                        padding: 0;
                        gap: 6px;
                    }
                    .nav-item {
                        margin: 0;
                        position: relative;
                    }
                    .nav-link {
                        color: #1b7a3a;
                        text-decoration: none;
                        font-weight: 650;
                        padding: 10px 14px;
                        border-radius: 12px;
                        transition: background 160ms ease;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        letter-spacing: 0.2px;
                    }
                    .nav-link:hover {
                        background: rgba(27, 122, 58, 0.08);
                        color: #1b7a3a;
                    }

                    .restricted-link {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .member-badge {
                        background: linear-gradient(
                            135deg,
                            #ffd700 0%,
                            #ffa500 100%
                        );
                        color: #1a1a1a;
                        font-size: 10px;
                        font-weight: 700;
                        padding: 2px 6px;
                        border-radius: 999px;
                        display: inline-flex;
                        align-items: center;
                        gap: 2px;
                        margin-left: 6px;
                    }
                    .member-badge i {
                        font-size: 8px;
                        color: #1a1a1a;
                    }

                    .dropdown-menu {
                        border: none;
                        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.14);
                        border-radius: 14px;
                        padding: 10px 0;
                        margin-top: 8px;
                        border: 1px solid rgba(27, 122, 58, 0.1);
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(10px);
                    }
                    .dropdown-item {
                        padding: 10px 18px;
                        color: #555;
                        font-weight: 520;
                        transition:
                            background 160ms ease,
                            padding-left 160ms ease;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                    }
                    .dropdown-item:hover {
                        color: #1b7a3a;
                        background: rgba(27, 122, 58, 0.08);
                        padding-left: 22px;
                    }
                    .dropdown-submenu {
                        position: relative;
                    }
                    .dropdown-submenu:hover > .dropdown-menu {
                        display: block;
                        position: absolute;
                        left: 100%;
                        top: -10px;
                        margin-left: 0;
                    }
                    .dropdown-submenu > .dropdown-toggle::after {
                        content: "›";
                        float: right;
                        margin-left: 10px;
                        border: none;
                        font-size: 16px;
                        font-weight: 700;
                    }

                    .header-actions {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .desktop-search-input {
                        position: absolute;
                        right: 140px;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 1001;
                    }

                    .search-input-wrapper {
                        display: flex;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.92);
                        border-radius: 999px;
                        padding: 6px;
                        border: 1px solid rgba(27, 122, 58, 0.18);
                        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
                        backdrop-filter: blur(10px);
                    }
                    .search-input {
                        border: none;
                        background: transparent;
                        padding: 0 14px;
                        width: 300px;
                        font-size: 14px;
                        outline: none;
                        color: #333;
                        font-weight: 500;
                    }
                    .search-submit {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        border: none;
                        color: white;
                        width: 36px;
                        height: 36px;
                        border-radius: 999px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 4px;
                        transition: transform 160ms ease;
                    }
                    .search-submit:hover:not(:disabled) {
                        transform: scale(1.05);
                    }
                    .search-submit:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }
                    .search-close {
                        background: rgba(0, 0, 0, 0.04);
                        border: 1px solid rgba(0, 0, 0, 0.06);
                        color: #666;
                        width: 36px;
                        height: 36px;
                        border-radius: 999px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 16px;
                        transition:
                            transform 160ms ease,
                            background 160ms ease;
                    }
                    .search-close:hover {
                        transform: rotate(90deg);
                        background: rgba(27, 122, 58, 0.12);
                        color: #1b7a3a;
                    }

                    .search-btn {
                        background: rgba(27, 122, 58, 0.08);
                        border: 1px solid rgba(27, 122, 58, 0.18);
                        color: #1b7a3a;
                        font-size: 16px;
                        cursor: pointer;
                        padding: 10px;
                        border-radius: 999px;
                        transition:
                            transform 160ms ease,
                            background 160ms ease,
                            color 160ms ease;
                        width: 44px;
                        height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .search-btn:hover {
                        color: white;
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        transform: scale(1.05);
                    }

                    .register-btn {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                        text-decoration: none;
                        padding: 11px 24px;
                        border-radius: 999px;
                        font-weight: 650;
                        font-size: 14px;
                        transition:
                            transform 160ms ease,
                            box-shadow 160ms ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: none;
                        box-shadow: 0 10px 26px rgba(27, 122, 58, 0.18);
                    }
                    .register-btn:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 14px 30px rgba(27, 122, 58, 0.22);
                        color: white;
                    }

                    .mobile-menu-toggle {
                        display: none;
                        background: rgba(27, 122, 58, 0.08);
                        border: 1px solid rgba(27, 122, 58, 0.18);
                        cursor: pointer;
                        padding: 10px;
                        border-radius: 12px;
                    }

                    .hamburger {
                        display: flex;
                        flex-direction: column;
                        width: 24px;
                        height: 18px;
                    }
                    .hamburger-line {
                        width: 100%;
                        height: 2.5px;
                        background: #1b7a3a;
                        margin: 2.5px 0;
                        transition: all 200ms ease;
                        border-radius: 3px;
                    }
                    .hamburger.active .hamburger-line:nth-child(1) {
                        transform: rotate(45deg) translate(6px, 6px);
                    }
                    .hamburger.active .hamburger-line:nth-child(2) {
                        opacity: 0;
                    }
                    .hamburger.active .hamburger-line:nth-child(3) {
                        transform: rotate(-45deg) translate(6px, -6px);
                    }

                    /* ✅ Mobile Drawer (transform-based, no flash) */
                    .mobile-nav {
                        position: fixed;
                        top: 0;
                        right: 0;
                        width: 320px;
                        height: 100vh;

                        background: linear-gradient(
                            135deg,
                            #ffffff 0%,
                            #f8f9fa 100%
                        );
                        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.16);
                        z-index: 1001;
                        overflow-y: auto;
                        border-left: 1px solid rgba(27, 122, 58, 0.18);

                        transform: translateX(110%);
                        opacity: 0;
                        visibility: hidden;
                        pointer-events: none;

                        transition:
                            transform 260ms ease,
                            opacity 180ms ease,
                            visibility 180ms ease;
                    }
                    .mobile-nav.active {
                        transform: translateX(0);
                        opacity: 1;
                        visibility: visible;
                        pointer-events: auto;
                    }

                    .mobile-nav-content {
                        padding: 22px;
                    }
                    .mobile-nav-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 22px;
                    }
                    .mobile-close-btn {
                        background: rgba(27, 122, 58, 0.08);
                        border: 1px solid rgba(27, 122, 58, 0.18);
                        font-size: 18px;
                        color: #1b7a3a;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 12px;
                        width: 44px;
                        height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .mobile-nav-list {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                    }
                    .mobile-nav-item {
                        margin-bottom: 8px;
                    }

                    .mobile-nav-link {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 14px 14px;
                        color: #444;
                        text-decoration: none;
                        font-weight: 650;
                        border-radius: 14px;
                        font-size: 16px;
                        background: rgba(255, 255, 255, 0.85);
                        border: 1px solid rgba(27, 122, 58, 0.1);
                    }

                    /* button style (for dropdown toggles) */
                    button.mobile-nav-link {
                        cursor: pointer;
                        text-align: left;
                    }

                    .mobile-submenu {
                        display: none;
                        list-style: none;
                        margin: 10px 0 0 16px;
                        padding: 0;
                        border-left: 2px solid rgba(27, 122, 58, 0.14);
                    }
                    .mobile-submenu.open {
                        display: block;
                    }

                    .mobile-submenu-link {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 12px 14px;
                        color: #555;
                        text-decoration: none;
                        font-weight: 520;
                        border-radius: 12px;
                        font-size: 14px;
                        margin-left: 10px;
                        background: white;
                        margin-bottom: 6px;
                        border: 1px solid rgba(0, 0, 0, 0.04);
                    }

                    button.mobile-submenu-link {
                        cursor: pointer;
                        text-align: left;
                    }

                    .mobile-submenu-inner {
                        display: none;
                        list-style: none;
                        margin: 6px 0 0 18px;
                        padding: 0;
                        border-left: 2px solid rgba(27, 122, 58, 0.1);
                    }
                    .mobile-submenu-inner.open {
                        display: block;
                    }

                    .rot {
                        transform: rotate(180deg);
                        transition: transform 160ms ease;
                    }

                    .mobile-auth-section {
                        margin-top: 22px;
                        padding-top: 18px;
                        padding-bottom: 22px;
                        border-top: 1px solid rgba(27, 122, 58, 0.12);
                    }

                    .mobile-register-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                        text-decoration: none;
                        padding: 12px 16px;
                        border-radius: 16px;
                        font-weight: 650;
                        font-size: 16px;
                        box-shadow: 0 12px 28px rgba(27, 122, 58, 0.18);
                    }

                    .mobile-nav-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.55);
                        backdrop-filter: blur(3px);
                        opacity: 0;
                        visibility: hidden;
                        transition:
                            opacity 180ms ease,
                            visibility 180ms ease;
                        z-index: 1000;
                    }
                    .mobile-nav-overlay.active {
                        opacity: 1;
                        visibility: visible;
                    }

                    .mobil__searchbar {
                        position: fixed;
                        top: -100%;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.92);
                        backdrop-filter: blur(6px);
                        z-index: 9999;
                        transition: top 220ms ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .mobil__searchbar.active {
                        top: 0;
                    }

                    .close__search {
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 8px 14px;
                        background: rgba(255, 255, 255, 0.12);
                        border-radius: 999px;
                    }

                    /* Modal Styles (same as your old styles) */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(8px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        animation: fadeIn 0.2s ease;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 24px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
                        animation: slideUp 0.3s ease;
                        overflow: hidden;
                    }

                    .modal-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 20px 24px;
                        border-bottom: 1px solid rgba(27, 122, 58, 0.1);
                    }

                    .modal-title {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        color: #1a1a1a;
                    }

                    .modal-close {
                        background: rgba(27, 122, 58, 0.08);
                        border: 1px solid rgba(27, 122, 58, 0.18);
                        color: #1b7a3a;
                        width: 36px;
                        height: 36px;
                        border-radius: 999px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .modal-close:hover {
                        background: #1b7a3a;
                        color: white;
                    }

                    .modal-body {
                        padding: 32px 24px;
                        text-align: center;
                    }

                    .modal-icon {
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 24px;
                        box-shadow: 0 10px 25px rgba(27, 122, 58, 0.3);
                    }

                    .modal-icon i {
                        font-size: 40px;
                        color: #ffd700;
                    }

                    .modal-feature-title {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1a1a1a;
                        margin-bottom: 16px;
                    }

                    .modal-description {
                        color: #666;
                        font-size: 16px;
                        margin-bottom: 24px;
                        line-height: 1.6;
                    }

                    .modal-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .modal-btn-primary {
                        background: linear-gradient(
                            135deg,
                            #1b7a3a 0%,
                            #2e8b57 100%
                        );
                        color: white;
                        text-decoration: none;
                        padding: 14px 24px;
                        border-radius: 999px;
                        font-weight: 700;
                        font-size: 16px;
                        transition: all 0.2s ease;
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 8px 20px rgba(27, 122, 58, 0.3);
                    }

                    .modal-btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 25px rgba(27, 122, 58, 0.4);
                        color: white;
                    }

                    .modal-btn-secondary {
                        background: white;
                        color: #666;
                        text-decoration: none;
                        padding: 14px 24px;
                        border-radius: 999px;
                        font-weight: 600;
                        font-size: 16px;
                        transition: all 0.2s ease;
                        border: 1px solid rgba(27, 122, 58, 0.2);
                        cursor: pointer;
                    }

                    .modal-btn-secondary:hover {
                        background: rgba(27, 122, 58, 0.04);
                        color: #1b7a3a;
                    }

                    .modal-login-note {
                        margin-top: 24px;
                        padding-top: 20px;
                        border-top: 1px solid rgba(27, 122, 58, 0.1);
                        color: #666;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        flex-wrap: wrap;
                    }

                    .modal-login-note i {
                        color: #1b7a3a;
                    }

                    .login-link,
                    .upgrade-link {
                        color: #1b7a3a;
                        font-weight: 700;
                        text-decoration: none;
                        margin-left: 4px;
                    }

                    .login-link:hover,
                    .upgrade-link:hover {
                        text-decoration: underline;
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }

                    @keyframes slideUp {
                        from {
                            transform: translateY(30px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }

                    @media (max-width: 1024px) {
                        .desktop-nav {
                            display: none;
                        }
                        .mobile-menu-toggle {
                            display: block;
                        }
                    }

                    @media (max-width: 768px) {
                        :global(:root) {
                            --header-h: 85px;
                        }

                        .logo-image {
                            height: 60px;
                            width: 150px;
                        }
                        .search-input {
                            width: 240px;
                        }
                        .desktop-search-input {
                            right: 10px;
                            top: 110%;
                            transform: translateY(0);
                        }
                        .header-content {
                            padding: 10px 15px;
                        }
                    }

                    @media (max-width: 480px) {
                        .mobile-nav {
                            width: 100%;
                        }
                        .search-btn,
                        .mobile-menu-toggle {
                            width: 40px;
                            height: 40px;
                            padding: 8px;
                        }
                        .modal-content {
                            width: 95%;
                            margin: 20px;
                        }

                        .logo-image {
                            width: 50px;
                            height: 40px;
                        }

                        .logo-brand {
                            gap: 4px;
                            margin-left: -5px;
                        }

                        .logo-brand span:last-child {
                            font-size: 20px;
                            font-weight: 800;
                            letter-spacing: -0.3px;
                        }

                        .header-content {
                            padding: 10px 15px;
                            gap: 4px;
                        }

                        .header-actions {
                            gap: 4px;
                        }

                        .search-btn,
                        .mobile-menu-toggle {
                            width: 36px;
                            height: 36px;
                            padding: 5px;
                            font-size: 14px;
                        }
                    }

                    @media (max-width: 360px) {
                        .logo-brand span:last-child {
                            font-size: 0.85rem;
                            display: none;
                        }
                        .logo-image {
                            width: 80px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Footer from "./Footer";
import Header from "./Header";
import LatestContestSection from "./LatestContestSection";
import RunningContestMultipol from "./RunningContestMultipol";

export default function Home() {
    const {
        sponsors,
        endedcontests,
        sliders,
        settings,
        social,
        islamic,
        post,
        exhibition,
        advertisement,
        auth,
        contactInfo,
    } = usePage().props;

    const user = auth.user;

    const isMember =
        auth.user?.subscriptions?.length > 0 &&
        auth.user?.subscriptions[0]?.status == 1;

    const isAdmin = auth.user?.role == 2;

    const headerAds = advertisement.filter(
        (ad) =>
            (ad.type === "banner" || ad.type === "video_ad") &&
            ad.status === "approved" &&
            ad.is_active == 1 &&
            ad.position === "header",
    );

    const inContentAds = advertisement.filter(
        (ad) =>
            (ad.type === "banner" || ad.type === "video_ad") &&
            ad.status === "approved" &&
            ad.is_active == 1 &&
            ad.position === "in_content",
    );

    const contentSwiperBreakpoints = {
        320: { slidesPerView: 1, spaceBetween: 20 },
        576: { slidesPerView: 2, spaceBetween: 25 },
        992: { slidesPerView: 3, spaceBetween: 30 },
        1200: { slidesPerView: 4, spaceBetween: 30 },
    };

    const [showModal, setShowModal] = useState(false);

    const handleMemberClick = (e) => {
        if (!isMember) {
            e.preventDefault();
            setShowModal(true);
        }
    };

    const DEFAULT_BG = "#1b7a3a";
    const swiperRef = useRef(null);

    const getIsFullWidthImage = (slide) => {
        const value =
            slide?.is_full_width_image ??
            slide?.isFullWidthImage ??
            slide?.is_full_width ??
            slide?.full_width_image ??
            slide?.fullWidthImage ??
            false;

        return (
            value === true ||
            value === 1 ||
            value === "1" ||
            value === "true" ||
            value === "TRUE" ||
            value === "yes" ||
            value === "YES" ||
            value === "on" ||
            value === "ON"
        );
    };

    useEffect(() => {
        const resume = () => {
            const swiper = swiperRef.current;

            if (!swiper) return;

            if (swiper?.autoplay && !swiper?.destroyed) {
                swiper.autoplay.start();
            }
        };

        const onVisibility = () => {
            if (!document.hidden) {
                resume();
            }
        };

        window.addEventListener("focus", resume);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            window.removeEventListener("focus", resume);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <FrontAuthenticatedLayout>
            <Header header={settings} />

            {/* --- HERO SECTION --- */}
            <section className="container mb-5 mt-4">
                <div className="hero-wrapper">
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay, EffectFade]}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                            swiper.autoplay?.start?.();
                        }}
                        navigation
                        pagination={{
                            clickable: true,
                            el: ".hero-pagination",
                        }}
                        autoplay={{
                            delay: 2500,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: false,
                            waitForTransition: false,
                            stopOnLastSlide: false,
                        }}
                        loop={(sliders?.length || 0) > 1}
                        speed={700}
                        effect="fade"
                        fadeEffect={{ crossFade: true }}
                        className="hero-swiper"
                    >
                        {sliders && sliders.length > 0 ? (
                            sliders.map((slide) => {
                                const isFullWidthImage =
                                    getIsFullWidthImage(slide);

                                const sliderImageUrl = getS3PublicUrl(
                                    `${slide.image_path}`,
                                );

                                return (
                                    <SwiperSlide key={slide.id}>
                                        <div
                                            className={`hero-slide-content ${isFullWidthImage
                                                ? "hero-full-image-mode"
                                                : ""
                                                }`}
                                            style={{
                                                backgroundColor:
                                                    slide.background_color ||
                                                    DEFAULT_BG,
                                                color: "#ffffff",
                                                "--hero-full-bg": `url(${sliderImageUrl})`,
                                            }}
                                        >
                                            {isFullWidthImage && (
                                                <div className="hero-full-bg-layer"></div>
                                            )}

                                            <div
                                                className={`hero-text-col ${isFullWidthImage
                                                    ? "hero-text-center"
                                                    : ""
                                                    }`}
                                            >
                                                <h1
                                                    className="hero-title"
                                                    style={{ color: "#fff" }}
                                                >
                                                    {slide.title}
                                                </h1>

                                                <p
                                                    className="hero-desc"
                                                    style={{ color: "#fff" }}
                                                >
                                                    {slide.subtitle || ""}
                                                </p>

                                                <div className="hero-buttons">
                                                    {user == null ? (
                                                        <Link
                                                            className="hero-btn primary"
                                                            href="/user/posts/create"
                                                        >
                                                            Create Post
                                                            <i className="fas fa-pen-fancy ml-2"></i>
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            className="hero-btn primary"
                                                            href={
                                                                isAdmin
                                                                    ? "/admin/posts/create"
                                                                    : "/user/posts/create"
                                                            }
                                                        >
                                                            Create Post
                                                            <i className="fas fa-pen-fancy ml-2"></i>
                                                        </Link>
                                                    )}

                                                    <Link
                                                        className="hero-btn secondary"
                                                        href="/contests-details"
                                                    >
                                                        Join Contest
                                                    </Link>
                                                </div>
                                            </div>

                                            {!isFullWidthImage && (
                                                <div className="hero-img-col">
                                                    <div className="img-frame">
                                                        <img
                                                            src={
                                                                sliderImageUrl
                                                            }
                                                            alt={slide.title}
                                                            onError={(e) => {
                                                                e.target.src =
                                                                    "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                );
                            })
                        ) : (
                            <SwiperSlide>
                                <div
                                    className="hero-slide-content"
                                    style={{
                                        backgroundColor: DEFAULT_BG,
                                        color: "#fff",
                                    }}
                                >
                                    <div className="hero-text-col">
                                        <span className="hero-badge">
                                            Welcome
                                        </span>

                                        <h1
                                            className="hero-title"
                                            style={{ color: "#fff" }}
                                        >
                                            Welcome to Our Islamic Library
                                        </h1>

                                        <p
                                            className="hero-desc"
                                            style={{ color: "#fff" }}
                                        >
                                            Explore Qur&apos;anic studies,
                                            Hadith collections, and more.
                                        </p>

                                        <div className="hero-buttons">
                                            <a
                                                className="hero-btn primary"
                                                href="/categories"
                                            >
                                                Explore Content
                                            </a>

                                            <a
                                                className="hero-btn secondary"
                                                href="/community"
                                            >
                                                Join Community
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>

                    <div className="hero-pagination"></div>
                </div>
            </section>

            <style jsx>{`
                .hero-wrapper {
                    position: relative;
                    width: 100%;
                    border-radius: 24px;
                    overflow: hidden;
                }

                .hero-swiper {
                    width: 100%;
                    border-radius: 24px;
                    overflow: hidden;
                }

                .hero-slide-content {
                    position: relative;
                    min-height: 520px;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
                    align-items: center;
                    gap: 40px;
                    padding: 60px 70px;
                    overflow: hidden;
                    border-radius: 24px;
                    isolation: isolate;
                }

                .hero-text-col {
                    position: relative;
                    z-index: 2;
                    max-width: 620px;
                }

                .hero-title {
                    font-size: 54px;
                    line-height: 1.08;
                    font-weight: 900;
                    margin: 0 0 18px;
                    letter-spacing: -1.8px;
                }

                .hero-desc {
                    font-size: 19px;
                    line-height: 1.7;
                    margin: 0 0 28px;
                    max-width: 560px;
                    opacity: 0.95;
                }

                .hero-buttons {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .hero-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 48px;
                    padding: 13px 24px;
                    border-radius: 999px;
                    font-weight: 800;
                    text-decoration: none;
                    transition:
                        transform 0.18s ease,
                        box-shadow 0.18s ease,
                        background 0.18s ease;
                }

                .hero-btn.primary {
                    background: #ffffff;
                    color: #1b7a3a;
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
                }

                .hero-btn.primary:hover {
                    color: #1b7a3a;
                    transform: translateY(-2px);
                    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.24);
                }

                .hero-btn.secondary {
                    background: rgba(255, 255, 255, 0.14);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.35);
                    backdrop-filter: blur(10px);
                }

                .hero-btn.secondary:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.22);
                    transform: translateY(-2px);
                }

                .hero-img-col {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .img-frame {
                    width: 100%;
                    max-width: 430px;
                    aspect-ratio: 1 / 1;
                    border-radius: 28px;
                    padding: 18px;
                    background: rgba(255, 255, 255, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    box-shadow: 0 26px 60px rgba(0, 0, 0, 0.22);
                    backdrop-filter: blur(12px);
                }

                .img-frame img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    display: block;
                    border-radius: 22px;
                }

                .hero-full-image-mode {
                    min-height: 560px;
                    grid-template-columns: 1fr;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    background-image:
                        linear-gradient(
                            90deg,
                            rgba(0, 0, 0, 0.34),
                            rgba(0, 0, 0, 0.18),
                            rgba(0, 0, 0, 0.34)
                        ),
                        var(--hero-full-bg);
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    box-shadow:
                        inset 0 0 0 1000px rgba(0, 0, 0, 0.02),
                        inset 0 -100px 130px rgba(0, 0, 0, 0.2);
                }

                .hero-full-bg-layer {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    pointer-events: none;
                    background:
                        radial-gradient(
                            circle at center,
                            rgba(255, 255, 255, 0.2),
                            transparent 42%
                        ),
                        linear-gradient(
                            180deg,
                            rgba(0, 0, 0, 0.1),
                            rgba(0, 0, 0, 0.28)
                        );
                }

                .hero-full-image-mode .hero-text-col {
                    max-width: 760px;
                    margin: 0 auto;
                    padding: 38px 46px;
                    border-radius: 28px;
                    background: rgba(0, 0, 0, 0.16);
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(5px);
                }

                .hero-full-image-mode .hero-desc {
                    margin-left: auto;
                    margin-right: auto;
                }

                .hero-full-image-mode .hero-buttons {
                    justify-content: center;
                }

                .hero-pagination {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 18px;
                    z-index: 5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                :global(.hero-pagination .swiper-pagination-bullet) {
                    width: 10px;
                    height: 10px;
                    background: rgba(255, 255, 255, 0.7);
                    opacity: 1;
                }

                :global(.hero-pagination .swiper-pagination-bullet-active) {
                    width: 26px;
                    border-radius: 999px;
                    background: #ffffff;
                }

                @media (max-width: 991px) {
                    .hero-slide-content {
                        min-height: auto;
                        grid-template-columns: 1fr;
                        padding: 42px 28px;
                        text-align: center;
                    }

                    .hero-text-col {
                        margin: 0 auto;
                    }

                    .hero-desc {
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .hero-buttons {
                        justify-content: center;
                    }

                    .hero-img-col {
                        margin-top: 12px;
                    }

                    .img-frame {
                        max-width: 330px;
                    }

                    .hero-full-image-mode {
                        min-height: 460px;
                    }

                    .hero-full-image-mode .hero-text-col {
                        padding: 30px 24px;
                    }

                    .hero-title {
                        font-size: 40px;
                    }
                }

                @media (max-width: 575px) {
                    .hero-wrapper,
                    .hero-swiper,
                    .hero-slide-content {
                        border-radius: 18px;
                    }

                    .hero-slide-content {
                        padding: 34px 18px;
                    }

                    .hero-title {
                        font-size: 30px;
                        letter-spacing: -0.8px;
                    }

                    .hero-desc {
                        font-size: 16px;
                        line-height: 1.55;
                    }

                    .hero-btn {
                        width: 100%;
                        min-height: 46px;
                    }

                    .hero-full-image-mode {
                        min-height: 420px;
                    }

                    .hero-full-image-mode .hero-text-col {
                        padding: 24px 18px;
                        border-radius: 20px;
                    }

                    .img-frame {
                        max-width: 260px;
                        padding: 12px;
                        border-radius: 20px;
                    }
                }
            `}</style>

            <RunningContestMultipol />
            <LatestContestSection />
            {/* --- HEADER AD BANNER (AFTER LATEST CONTEST) --- */}
            {headerAds.length > 0 && (
                <section className="container my-5">
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        slidesPerView={1}
                        autoplay={{ delay: 5000 }}
                        pagination={{ clickable: true }}
                        loop={headerAds.length > 1}
                        className="header-ad-swiper"
                    >
                        {headerAds.map((ad) => (
                            <SwiperSlide key={ad.id}>
                                <div className="header-ad-container">
                                    <a
                                        href={ad.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="header-ad-link"
                                    >
                                        {ad.type === 'video_ad' ? (
                                            <div className="header-ad-video-container">
                                                {ad.video ? (
                                                    <video
                                                        src={getS3PublicUrl(ad.video)}
                                                        className="header-ad-video"
                                                        controls={false}
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                ) : ad.video_url ? (
                                                    <div className="video-ad-iframe-wrapper">
                                                        <iframe
                                                            src={ad.video_url}
                                                            frameBorder="0"
                                                            allow="autoplay; encrypted-media"
                                                            allowFullScreen
                                                            title={ad.title}
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <div className="header-ad-text-content">
                                                        <h3>{ad.title}</h3>
                                                        <p>{ad.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : ad.image ? (
                                            <img
                                                src={getS3PublicUrl(ad.image)}
                                                alt={ad.title}
                                                className="header-ad-image"
                                            />
                                        ) : (
                                            <div
                                                className="header-ad-text-content"
                                                style={{
                                                    background:
                                                        ad.background_color ||
                                                        "#f8f9fa",
                                                    color:
                                                        ad.text_color || "#333",
                                                }}
                                            >
                                                <h3>{ad.title}</h3>
                                                <p>{ad.description}</p>
                                            </div>
                                        )}
                                    </a>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}
            {/* =========================================
                LATEST UPDATES (BLOG)
               ========================================= */}
            <section className="section-padding">
                <div className="container">
                    <div className="section-header-modern">
                        <div>
                            <h5 className="sub-title">From the Blog</h5>
                            <Link href="/post-details">
                                <h2 className="main-title">Latest Updatess</h2>
                            </Link>
                        </div>
                        <div className="header-actions">
                            <Link href="/post-details" className="btn-view-all">
                                View All Posts{" "}
                                <i className="fas fa-arrow-right"></i>
                            </Link>
                            <Link
                                href={
                                    isAdmin
                                        ? "/admin/posts/create"
                                        : "/user/posts/create"
                                }
                                className="btn-circle-add"
                            >
                                <i className="fas fa-plus"></i>
                            </Link>
                        </div>
                    </div>

                    <Swiper
                        modules={[Navigation]}
                        navigation
                        spaceBetween={30}
                        breakpoints={contentSwiperBreakpoints}
                        className="blog-swiper"
                    >
                        {post && post.length > 0 ? (
                            post.map((p) => {
                                const date = new Date(p.created_at);
                                return (
                                    <SwiperSlide key={p.id}>
                                        <div className="blog-card-clean border-1 border-[#0f8022] shadow-md shadow-blue bg-[#ffffff]">
                                            <div className="blog-img-holder">
                                                <Link
                                                    href={`/post-detail/${p.slug}`}
                                                >
                                                    <img
                                                        src={getS3PublicUrl(
                                                            p.thumbnail ??
                                                            p.image,
                                                        )}
                                                        alt={p.title}
                                                        onError={(e) => {
                                                            e.target.src =
                                                                "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                        }}
                                                    />
                                                </Link>
                                                <div className="date-badge">
                                                    <span className="day">
                                                        {date.getDate()}
                                                    </span>
                                                    <span className="month">
                                                        {date.toLocaleString(
                                                            "default",
                                                            { month: "short" },
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="blog-content">
                                                <h3 className="post-title">
                                                    <Link
                                                        href={`/post-detail/${p.slug}`}
                                                    >
                                                        {p.title}
                                                    </Link>
                                                </h3>
                                                <p className="post-excerpt">
                                                    {p.content
                                                        ?.replace(
                                                            /<[^>]+>/g,
                                                            "",
                                                        )
                                                        .slice(0, 80)}
                                                    ...
                                                </p>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                );
                            })
                        ) : (
                            <SwiperSlide>
                                <div className="empty-state">
                                    No posts found.
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>
            </section>
            {/* =========================================
                ISLAMIC ZONE
               ========================================= */}
            <section className="section-padding islamic-section-bg">
                <div className="container">
                    <div className="section-header-modern">
                        <div>
                            <h5 className="sub-title green-text">
                                Enlightenment
                            </h5>
                            <Link href="/islamic-zone">
                                <h2 className="main-title">Islamic Zone</h2>
                            </Link>
                        </div>
                        <Link
                            href="/islamic-zone"
                            className="btn-view-all green"
                        >
                            Browse Library <i className="fas fa-book-open"></i>
                        </Link>
                    </div>

                    <Swiper
                        modules={[Navigation]}
                        navigation
                        spaceBetween={30}
                        breakpoints={contentSwiperBreakpoints}
                        className="islamic-swiper"
                    >
                        {islamic && islamic.length > 0 ? (
                            islamic.map((p) => (
                                <SwiperSlide key={p.id}>
                                    <div className="islamic-card-clean border-1 border-[#0f8022] shadow-md shadow-blue bg-[#ffffff] ">
                                        <div className="islamic-img-holder">
                                            <Link
                                                href={`/islamic-detail/${p.id}`}
                                            >
                                                <img
                                                    src={
                                                        p.gallery
                                                            ? getS3PublicUrl(
                                                                JSON.parse(
                                                                    p.gallery,
                                                                )[0],
                                                            )
                                                            : getS3PublicUrl(
                                                                p.image,
                                                            )
                                                    }
                                                    alt={p.title}
                                                    onError={(e) => {
                                                        e.target.src =
                                                            "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png";
                                                    }}
                                                />
                                            </Link>
                                            <div className="type-badge">
                                                {p.type || "Knowledge"}
                                            </div>
                                        </div>
                                        <div className="islamic-content">
                                            <h3 className="islamic-title">
                                                <Link
                                                    href={`/islamic-detail/${p.id}`}
                                                >
                                                    {p.title}
                                                </Link>
                                            </h3>
                                            <p className="islamic-desc">
                                                {p.description
                                                    ?.replace(/<[^>]+>/g, "")
                                                    .slice(0, 60)}
                                                ...
                                            </p>
                                            <div className="islamic-footer">
                                                <Link
                                                    href={`/islamic-detail/${p.id}`}
                                                    className="learn-more-link"
                                                >
                                                    Learn More
                                                </Link>
                                                <span className="islamic-date">
                                                    <i className="far fa-clock"></i>{" "}
                                                    {new Date(
                                                        p.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))
                        ) : (
                            <SwiperSlide>
                                <div className="empty-state">
                                    No content found.
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>
            </section>
            {/* --- IN-CONTENT AD BANNER (BEFORE EXHIBITION) --- */}
            {inContentAds.length > 0 && (
                <section className="container my-5">
                    <Swiper
                        modules={[Autoplay]}
                        slidesPerView={1}
                        autoplay={{ delay: 6000 }}
                        loop={inContentAds.length > 1}
                        className="in-content-ad-swiper"
                    >
                        {inContentAds.map((ad) => (
                            <SwiperSlide key={ad.id}>
                                <div className="in-content-ad-container">
                                    <a
                                        href={ad.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="in-content-ad-link"
                                    >
                                        {ad.type === 'video_ad' ? (
                                            <div className="in-content-ad-video-container">
                                                {ad.video ? (
                                                    <video
                                                        src={getS3PublicUrl(ad.video)}
                                                        className="in-content-ad-video"
                                                        controls={false}
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                    />
                                                ) : ad.video_url ? (
                                                    <div className="video-ad-iframe-wrapper">
                                                        <iframe
                                                            src={ad.video_url}
                                                            frameBorder="0"
                                                            allow="autoplay; encrypted-media"
                                                            allowFullScreen
                                                            title={ad.title}
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    <div className="in-content-ad-text-content">
                                                        <h3>{ad.title}</h3>
                                                        <p>{ad.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : ad.image ? (
                                            <img
                                                src={getS3PublicUrl(ad.image)}
                                                alt={ad.title}
                                                className="in-content-ad-image"
                                            />
                                        ) : (
                                            <div
                                                className="in-content-ad-text-content"
                                                style={{
                                                    background:
                                                        ad.background_color ||
                                                        "#f8f9fa",
                                                    color:
                                                        ad.text_color || "#333",
                                                }}
                                            >
                                                <h3>{ad.title}</h3>
                                                <p>{ad.description}</p>
                                                {ad.button_text && (
                                                    <span className="in-content-ad-button">
                                                        {ad.button_text}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </a>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}
            {/* =========================================
                EXHIBITION SECTION
               ========================================= */}
            <section className="section-container">
                <div className="container">
                    <div className="section-header-modern">
                        <div>
                            <h5 className="sub-title">Gallery</h5>

                            <h2 className="main-title">Exhibitions</h2>

                            <p className="section-subtitle mt-1 text-muted">
                                Exclusive art and cultural showcases
                            </p>
                        </div>
                        {isMember && (
                            <Link
                                href="/exhibition-details"
                                className="btn-view-all"
                            >
                                View Gallery{" "}
                                <i className="fas fa-arrow-right"></i>
                            </Link>
                        )}
                    </div>

<Swiper
    modules={[Navigation, Autoplay, Pagination]}
    spaceBetween={30}
    breakpoints={contentSwiperBreakpoints}
    navigation
    pagination={{ clickable: true }}
    loop={exhibition && exhibition.length > 4}
    speed={800}
    autoplay={{
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    }}
    className="custom-swiper exhibition-slider"
>
    {exhibition && exhibition.length > 0 ? (
        exhibition.map((p) => (
            <SwiperSlide key={p.id}>
                <div
                    className={`modern-card border-1 border-[#0f8022] shadow-md shadow-blue bg-[#ffffff] ${
                        !isMember ? "locked-card" : ""
                    }`}
                >
                    <div className="card-media">
                        <Link
                            href={
                                isMember
                                    ? `/exhibition-detail/${p.id}`
                                    : "#"
                            }
                            onClick={(e) => handleMemberClick(e)}
                        >
                            <img
                                src={getS3PublicUrl(p.image)}
                                alt={
                                    p.title
                                        ? String(p.title).replace(/<[^>]+>/g, "")
                                        : "Untitled Exhibition"
                                }
                                onError={(e) =>
                                    (e.target.src =
                                        "https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png")
                                }
                            />

                            {!isMember && (
                                <div className="lock-overlay">
                                    <div className="lock-circle">
                                        <i className="fas fa-lock"></i>
                                    </div>
                                    <span>Member Exclusive</span>
                                </div>
                            )}
                        </Link>
                    </div>

                    <div className="card-body">
                        <div className="meta-row space-between">
                            <span className="badge-outline">
                                {p.type || "Art"}
                            </span>

                            {p.price > 0 && (
                                <span className="price-tag">
                                    ${parseFloat(p.price).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <h3
                            className="card-title"
                            dangerouslySetInnerHTML={{
                                __html: isMember
                                    ? `<a href="/exhibition-detail/${p.id}">${
                                          p.title || "Untitled Exhibition"
                                      }</a>`
                                    : `${p.title || "Untitled Exhibition"}`,
                            }}
                        />
                    </div>
                </div>
            </SwiperSlide>
        ))
    ) : (
        <SwiperSlide>
            <div className="empty-state">No exhibitions found.</div>
        </SwiperSlide>
    )}
</Swiper>
                </div>
            </section>
            {/* --- SPONSORS --- */}
            {sponsors && sponsors.length > 0 && (
                <section className="sponsor-carousel-section">
                    <div className="container">
                        <div className="section-header-center">
                            <h2 className="section-title">Sponsors</h2>
                        </div>
                        <div className="logo-slider-container">
                            <div className="logo-slider-track">
                                {sponsors.slice(0, 6).map(
                                    (sponsor) =>
                                        sponsor.photo && (
                                            <div
                                                key={sponsor.id}
                                                className="logo-slide"
                                            >
                                                <img
                                                    src={getS3PublicUrl(
                                                        sponsor.photo,
                                                    )}
                                                    className="sponsor-logo"
                                                    alt="Sponsor"
                                                />
                                            </div>
                                        ),
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}
            <Footer
                footer={settings}
                social={social}
                contactInfo={contactInfo}
            />
            {/* --- MEMBERSHIP MODAL --- */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-icon">
                            <i className="fas fa-crown"></i>
                        </div>
                        <h3>Premium Content</h3>
                        <p>
                            Unlock exclusive exhibitions and resources by
                            becoming a member today.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                            <Link href="/subscriptions" className="btn-primary">
                                Upgrade Membership
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
                .hero-pagination.swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination-horizontal {
                    display: none;
                }
                /* --- Layout --- */
                .section-container {
                    padding: 80px 0;
                }

                /* --- Card Design (From Second Instance) --- */
                .custom-swiper {
                    padding: 10px 5px 40px !important;
                }

                .modern-card {
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .modern-card:hover {
                    box-shadow: 0 15px 30px rgba(27, 122, 58, 0.15);
                    border-color: #1b7a3a;
                }

                .card-media {
                    position: relative;
                    height: 220px;
                    overflow: hidden;
                }
                .card-media img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.6s
                        cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .modern-card:hover .card-media img {
                    transform: scale(1.08);
                }

                /* --- Card Body --- */
                .card-body {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .meta-row {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: #888;
                    margin-bottom: 12px;
                }
                .meta-row.space-between {
                    justify-content: space-between;
                }

                .badge-outline {
                    border: 1px solid #ddd;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    color: #0b4206;
                    font-weight: 600;
                }
                .price-tag {
                    color: #1b7a3a;
                    font-weight: 700;
                    font-size: 1rem;
                }

                .card-title {
                    font-size: 1.25rem;
                    margin-bottom: 10px;
                    line-height: 1.4;
                    font-weight: 700;
                    color: #000000;
                }
                .card-title a {
                    text-decoration: none;
                    color: inherit;
                    transition: 0.2s;
                }
                .card-title a:hover {
                    color: #1b7a3a;
                }

                .card-text {
                    font-size: 0.95rem;
                    color: #666;
                    line-height: 1.6;
                    margin: 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* --- Locked State --- */
                .locked-card .card-media img {
                    filter: grayscale(1);
                    opacity: 0.7;
                }
                .lock-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    opacity: 0;
                    transition: 0.3s;
                    cursor: pointer;
                }
                .locked-card:hover .lock-overlay {
                    opacity: 1;
                }
                .lock-circle {
                    width: 40px;
                    height: 40px;
                    background: #1b7a3a;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin-bottom: 8px;
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                /* --- Swiper Navigation Override --- */
                :global(.custom-swiper .swiper-button-next),
                :global(.custom-swiper .swiper-button-prev) {
                    background: white;
                    color: #1b7a3a;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transition: 0.2s;
                }
                :global(.custom-swiper .swiper-button-next:hover),
                :global(.custom-swiper .swiper-button-prev:hover) {
                    background: #1b7a3a;
                    color: white;
                }
                :global(.swiper-button-next:after),
                :global(.swiper-button-prev:after) {
                    font-size: 18px;
                    font-weight: bold;
                }

                /* --- HEADER AD STYLES --- */
                .header-ad-swiper {
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .header-ad-container {
                    height: 250px;
                    position: relative;
                }

                .header-ad-link {
                    display: block;
                    height: 100%;
                    text-decoration: none;
                }

                .header-ad-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s ease;
                }

                .header-ad-container:hover .header-ad-image {
                    transform: scale(1.02);
                }

                .header-ad-text-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px;
                    text-align: center;
                }

                .header-ad-text-content h3 {
                    font-size: 1.8rem;
                    margin-bottom: 15px;
                    font-weight: 700;
                }

                .header-ad-text-content p {
                    font-size: 1.1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }

                /* --- IN-CONTENT AD STYLES --- */
                .in-content-ad-swiper {
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
                }

                .in-content-ad-container {
                    height: 200px;
                    position: relative;
                }

                .in-content-ad-link {
                    display: block;
                    height: 100%;
                    text-decoration: none;
                }

                .in-content-ad-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s ease;
                }

                .in-content-ad-container:hover .in-content-ad-image {
                    transform: scale(1.02);
                }

                .in-content-ad-text-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    text-align: center;
                }

                .in-content-ad-text-content h3 {
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .in-content-ad-text-content p {
                    font-size: 1rem;
                    max-width: 500px;
                    margin: 0 auto 15px;
                }

                .in-content-ad-button {
                    display: inline-block;
                    padding: 8px 20px;
                    background: #1b7a3a;
                    color: white;
                    border-radius: 4px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .in-content-ad-button:hover {
                    background: #145c2b;
                }

                /* --- Swiper Pagination for Ads --- */
                :global(.header-ad-swiper .swiper-pagination),
                :global(.in-content-ad-swiper .swiper-pagination) {
                    bottom: 10px !important;
                }

                :global(.header-ad-swiper .swiper-pagination-bullet),
                :global(.in-content-ad-swiper .swiper-pagination-bullet) {
                    background: rgba(255, 255, 255, 0.5);
                    opacity: 1;
                }

                :global(.header-ad-swiper .swiper-pagination-bullet-active),
                :global(
                    .in-content-ad-swiper .swiper-pagination-bullet-active
                ) {
                    background: #ffffff;
                }

                :global(.in-content-ad-swiper .swiper-pagination-bullet) {
                    background: rgba(0, 0, 0, 0.2);
                }

                :global(
                    .in-content-ad-swiper .swiper-pagination-bullet-active
                ) {
                    background: #1b7a3a;
                }

                /* --- Modal --- */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 450px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
                }
                .modal-icon {
                    font-size: 3.5rem;
                    color: #ffd700;
                    margin-bottom: 20px;
                }
                .modal-content h3 {
                    font-size: 1.6rem;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .modal-content p {
                    color: #666;
                    margin-bottom: 30px;
                    line-height: 1.6;
                }

                .modal-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                .btn-primary {
                    background: #1b7a3a;
                    color: white;
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: 0.2s;
                    border: none;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    background: #145c2b;
                    transform: translateY(-2px);
                }
                .btn-secondary {
                    background: #00000026;
                    color: #555;
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }

                @keyframes popIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* =========================
   HERO / BANNER (FULL FIXED)
   Copy-Paste Replace CSS
   ========================= */

                /* wrapper (FIXED HEIGHT) */
                .hero-wrapper {
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                    position: relative;
                    background: transparent;

                    /* FIXED banner height (Desktop) */
                    height: 520px;
                }

                /* Tablet */
                @media (max-width: 992px) {
                    .hero-wrapper {
                        height: 640px;
                    }
                }

                /* Mobile */
                @media (max-width: 576px) {
                    .hero-wrapper {
                        height: 620px;
                    }
                }

                .hero-swiper {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    border-radius: 24px;
                    overflow: hidden;
                    background: transparent !important;
                }

                /* Swiper elements height locked */
                :global(.hero-swiper),
                :global(.hero-swiper .swiper),
                :global(.hero-swiper .swiper-wrapper),
                :global(.hero-swiper .swiper-slide) {
                    border-radius: 24px;
                    overflow: hidden;
                    height: 100% !important;
                }

                /* texture overlay */
                .hero-swiper::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    opacity: 0.08;
                    background-image: url("https://www.transparenttextures.com/patterns/arabesque.png");
                    pointer-events: none;
                    z-index: 1;
                }

                /* Slide content (LOCKED inside fixed banner height) */
                .hero-slide-content {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    padding: 56px 48px;
                    gap: 32px;

                    border-radius: 24px;
                    overflow: hidden;
                    margin: 0;
                    box-sizing: border-box;
                }

                /* text column */
                .hero-text-col {
                    flex: 1;
                    min-width: 0;
                    color: #fff;
                    z-index: 2;
                }

                /* badge */
                .hero-badge {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }

                /* title (CLAMP so banner never jumps) */
                .hero-title {
                    font-size: 3rem;
                    font-weight: 800;
                    line-height: 1.15;
                    margin-bottom: 12px;

                    display: -webkit-box;
                    -webkit-line-clamp: 2; /* max 2 lines */
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* desc (CLAMP so banner never jumps) */
                .hero-desc {
                    font-size: 1.1rem;
                    opacity: 0.95;
                    line-height: 1.6;
                    max-width: 640px;
                    margin-bottom: 28px;

                    display: -webkit-box;
                    -webkit-line-clamp: 3; /* max 3 lines */
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* buttons */
                .hero-buttons {
                    display: flex;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .hero-btn {
                    padding: 12px 30px;
                    border-radius: 999px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.25s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    white-space: nowrap;
                }

                .hero-btn.primary {
                    background: #fff;
                    color: #000;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
                }

                .hero-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
                }

                .hero-btn.secondary {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.45);
                }

                .hero-btn.secondary:hover {
                    background: #fff;
                    color: #1b7a3a;
                }

                /* image column */
                .hero-img-col {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2;
                }

                /* fixed image box (prevents layout shift) */
                .img-frame {
                    width: 100%;
                    max-width: 520px;

                    /* fixed image area height */
                    height: 360px;

                    background: rgba(255, 255, 255, 0.1);
                    padding: 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(6px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    overflow: hidden;

                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .img-frame img {
                    width: 100%;
                    height: 100%;
                    border-radius: 15px;
                    object-fit: contain;
                    display: block;
                }

                /* Pagination container spacing */
                .hero-pagination {
                    position: absolute;
                    left: 0;
                    right: 0;
                    bottom: 16px;
                    z-index: 5;
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    pointer-events: auto;
                }

                /* Make swiper bullets visible on any bg */
                :global(.hero-pagination .swiper-pagination-bullet) {
                    width: 10px;
                    height: 10px;
                    opacity: 0.45;
                    background: rgba(255, 255, 255, 0.95);
                }

                :global(.hero-pagination .swiper-pagination-bullet-active) {
                    opacity: 1;
                    transform: scale(1.15);
                }

                /* =========================
   RESPONSIVE
   ========================= */

                /* Tablet */
                @media (max-width: 992px) {
                    .hero-slide-content {
                        flex-direction: column;
                        text-align: center;
                        justify-content: center;
                        padding: 42px 18px;
                        gap: 22px;
                    }

                    .hero-title {
                        font-size: 2.2rem;
                    }

                    .hero-desc {
                        margin: 0 auto 22px;
                    }

                    .hero-buttons {
                        justify-content: center;
                    }

                    .img-frame {
                        max-width: 560px;
                        height: 320px;
                    }
                }

                /* Mobile */
                @media (max-width: 576px) {
                    .hero-title {
                        font-size: 1.8rem;
                    }

                    /* buttons full width on mobile */
                    .hero-btn {
                        width: 100%;
                    }

                    .img-frame {
                        height: 260px;
                    }

                    .hero-pagination {
                        bottom: 12px;
                    }
                }

                /* seam/flicker fix */
                :global(.hero-swiper .swiper-wrapper) {
                    transform: translate3d(0, 0, 0);
                }

                /* --- GLOBAL SECTIONS --- */
                .section-padding {
                    padding: 80px 0;
                }
                .section-header-modern {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 40px;
                }
                .sub-title {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #666;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                .sub-title.green-text {
                    color: #1b7a3a;
                }
                .main-title {
                    font-size: 36px;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin: 0;
                    line-height: 1.2;
                }

                .btn-view-all {
                    font-weight: 700;
                    color: #333;
                    text-decoration: none;
                    transition: 0.3s;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }
                .btn-view-all:hover {
                    color: #1b7a3a;
                    gap: 12px;
                }
                .btn-view-all.green {
                    color: #1b7a3a;
                }
                .btn-view-all.green:hover {
                    color: #145c2b;
                }

                .btn-circle-add {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #1b7a3a;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: 0.3s;
                    box-shadow: 0 4px 10px rgba(27, 122, 58, 0.3);
                    text-decoration: none;
                }
                .btn-circle-add:hover {
                    transform: scale(1.1);
                    background: #145c2b;
                }

                /* =======================================
                    (BLOG) DESIGN
                   ======================================= */
                .blog-swiper {
                    padding: 10px;
                    padding-bottom: 40px;
                }
                .blog-card-clean {
                    border-radius: 12px;
                    overflow: hidden;

                    transition: 0.3s;

                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                s .blog-card-clean:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
                }

                .blog-img-holder {
                    position: relative;
                    height: 240px;
                    overflow: hidden;
                }
                .blog-img-holder img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s;
                }
                .blog-card-clean:hover .blog-img-holder img {
                    transform: scale(1.05);
                }

                .date-badge {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    background: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 2;
                }
                .date-badge .day {
                    font-size: 20px;
                    font-weight: 800;
                    line-height: 1;
                    color: #1b7a3a;
                }
                .date-badge .month {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #888;
                    margin-top: 2px;
                }

                .blog-content {
                    padding: 15px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .meta-info {
                    display: flex;
                    gap: 15px;
                    font-size: 13px;
                    color: #999;
                    margin-bottom: 12px;
                    font-weight: 500;
                }
                .meta-info i {
                    color: #1b7a3a;
                    margin-right: 5px;
                }

                .post-title {
                    font-size: 20px;
                    font-weight: 800;
                    line-height: 1.4;
                    margin-bottom: 12px;
                }
                .post-title a {
                    color: #1a1a1a;
                    text-decoration: none;
                    transition: 0.2s;
                }
                .post-title a:hover {
                    color: #1b7a3a;
                }

                .post-excerpt {
                    color: #666;
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 0px;
                    flex: 1;
                }

                /* =======================================
                   ISLAMIC ZONE DESIGN
                   ======================================= */
                .islamic-section-bg {
                    background-color: #f8fafc;
                }
                .islamic-swiper {
                    padding-bottom: 40px;
                }

                .islamic-card-clean {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(27, 122, 59, 0.24);
                    transition: 0.3s;

                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .islamic-card-clean:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 35px rgba(27, 122, 58, 0.15);
                    border-color: #1b7a3a;
                }

                .islamic-img-holder {
                    position: relative;
                    height: 200px;
                }
                .islamic-img-holder img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .type-badge {
                    position: absolute;
                    bottom: 15px;
                    left: 15px;
                    background: #1b7a3a;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .islamic-content {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .islamic-title {
                    font-size: 18px;
                    font-weight: 800;
                    line-height: 1.4;
                    margin-bottom: 10px;
                }
                .islamic-title a {
                    color: #1f2937;
                    text-decoration: none;
                    transition: 0.2s;
                }
                .islamic-title a:hover {
                    color: #1b7a3a;
                }

                .islamic-desc {
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    flex: 1;
                }

                .islamic-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px dashed #e5e7eb;
                }
                .learn-more-link {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1b7a3a;
                    text-decoration: none;
                }
                .islamic-date {
                    font-size: 12px;
                    color: #9ca3af;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                /* --- SPONSOR SECTION --- */
                .sponsor-carousel-section {
                    padding: 4rem 0;
                    background: #f8fafc;
                    overflow: hidden;
                }
                .section-header-center {
                    text-align: center;
                    margin-bottom: 3rem;
                }
                .section-title {
                    font-size: 32px;
                    font-weight: 800;
                    color: #1b7a3a;
                    margin: 0;
                }
                .logo-slider-container {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                    mask-image: linear-gradient(
                        to right,
                        transparent,
                        black 10%,
                        black 90%,
                        transparent
                    );
                }
                .logo-slider-track {
                    display: flex;
                    animation: slide 30s linear infinite;
                    gap: 4rem;
                    width: max-content;
                }
                .logo-slide {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem 0.5rem;
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #eee;
                    transition: all 0.3s ease;
                }
                .logo-slide:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
                }
                .sponsor-logo {
                    max-width: 150px;
                    max-height: 60px;
                    object-fit: contain;
                    filter: grayscale(100%);
                    opacity: 0.6;
                    transition: all 0.3s ease;
                }
                .sponsor-logo:hover {
                    filter: grayscale(0%);
                    opacity: 1;
                }
                @keyframes slide {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                /* --- RESPONSIVE --- */
                @media (max-width: 992px) {
                    .hero-slide-content {
                        flex-direction: column;
                        text-align: center;
                        padding: 3rem 1.5rem;
                    }
                    .hero-desc {
                        margin: 0 auto 2rem;
                    }
                    .hero-buttons {
                        justify-content: center;
                    }
                    .hero-title {
                        font-size: 2.2rem;
                    }

                    .header-ad-container {
                        height: 200px;
                    }
                    .in-content-ad-container {
                        height: 180px;
                    }
                }

                @media (max-width: 768px) {
                    .header-ad-container {
                        height: 180px;
                    }
                    .in-content-ad-container {
                        height: 160px;
                    }

                    .header-ad-text-content h3 {
                        font-size: 1.5rem;
                    }
                    .in-content-ad-text-content h3 {
                        font-size: 1.3rem;
                    }

                    .section-header-modern {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }
                    .header-actions {
                        width: 100%;
                        display: flex;
                        justify-content: end;
                    }
                }

                @media (max-width: 576px) {
                    .hero-title {
                        font-size: 1.8rem;
                    }

                    .header-ad-container {
                        height: 150px;
                    }
                    .in-content-ad-container {
                        height: 140px;
                    }

                    .header-ad-text-content {
                        padding: 15px;
                    }
                    .in-content-ad-text-content {
                        padding: 15px;
                    }

                    .header-ad-text-content h3 {
                        font-size: 1.3rem;
                    }
                    .in-content-ad-text-content h3 {
                        font-size: 1.1rem;
                    }

                    .header-ad-text-content p,
                    .in-content-ad-text-content p {
                        font-size: 0.9rem;
                    }
                }

                .swiper-button-prev:after,
                .swiper-rtl .swiper-button-prev:after,
                .swiper-button-prev {
                    display: none;
                }
                .swiper-button-next:after,
                .swiper-rtl .swiper-button-next:after,
                .swiper-button-next {
                    display: none;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { toHijri } from "hijri-converter";
export default function Footer() {
    const { social, footer, contactInfo, events } = usePage().props;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [islamicDate, setIslamicDate] = useState("");
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [loading, setLoading] = useState(true);

    // Format address safely
    const formatAddress = (address) => {
        if (!address) return "Islamic Knowledge Center, Dhaka";

        if (typeof address === "string") return address;

        if (typeof address === "object" && address !== null) {
            const { street, city, state, zip } = address;
            const parts = [street, city, state, zip].filter(Boolean);
            return parts.join(", ");
        }
        return "Islamic Knowledge Center, Dhaka";
    };

    // Get contact info with fallbacks
    const getContactEmail = () => {
        return contactInfo?.email_one || "info@muslimhall.com";
    };

    const getContactPhone = () => {
        return contactInfo?.phone_one || "+880 XXXX-XXXXXX";
    };

    const getContactAddress = () => {
        return formatAddress(contactInfo?.address);
    };

    // Calculate Islamic date (Hijri)
    const calculateIslamicDate = () => {
        try {
            // Bangladesh is typically 1 day behind Saudi Arabia (Umm al-Qura calendar)
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - 1);

            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();

            const hijri = toHijri(year, month, day);

            const islamicMonths = [
                "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
                "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
                "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
            ];

            return `${islamicMonths[hijri.hm - 1]} ${hijri.hd}, ${hijri.hy} AH`;
        } catch (error) {
            console.error("Error calculating Islamic date:", error);
            return "Calculation Error";
        }
    };

    // Calculate Bangladesh prayer times
    const calculatePrayerTimes = async () => {
        try {
            const adhan = await import("adhan");
            const { Coordinates, CalculationMethod, PrayerTimes } = adhan;

            // Coordinates for Dhaka, Bangladesh
            const coordinates = new Coordinates(23.8103, 90.4125);

            // Use Muslim World League method or similar as per Bangladesh convention
            const params = CalculationMethod.MuslimWorldLeague();

            const date = new Date();
            const prayerTimes = new PrayerTimes(coordinates, date, params);

            return {
                fajr: formatTime(prayerTimes.fajr),
                sunrise: formatTime(prayerTimes.sunrise),
                dhuhr: prayerTimes.dhuhr ? formatTime(prayerTimes.dhuhr) : "--:--",
                asr: formatTime(prayerTimes.asr),
                maghrib: formatTime(prayerTimes.maghrib),
                isha: formatTime(prayerTimes.isha),
            };
        } catch (error) {
            console.error("Error calculating prayer times:", error);
            return null;
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-BD", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get current Bangladesh time
    const getBangladeshTime = () => {
        const now = new Date();
        const bangladeshOffset = 6 * 60; // GMT+6 in minutes
        const localOffset = now.getTimezoneOffset();
        const bangladeshTime = new Date(
            now.getTime() + (bangladeshOffset + localOffset) * 60000,
        );
        return bangladeshTime;
    };

    useEffect(() => {
        const updateTimes = async () => {
            const bangladeshTime = getBangladeshTime();
            setCurrentDate(bangladeshTime);
            setIslamicDate(calculateIslamicDate());
            const times = await calculatePrayerTimes();
            if (times) {
                setPrayerTimes(times);
            }
            setLoading(false);
        };

        // Initial update
        updateTimes();

        // Update every minute (prayer times don't change that often, but why not)
        const interval = setInterval(updateTimes, 60000);

        return () => clearInterval(interval);
    }, []);

    const upcomingEvents = events?.slice(0, 3) || [];

    return (
        <div className="footer-container">
            <footer className="modern-footer">
                <div className="container-md">
                    {/* Main Footer Section */}
                    <div className="footer-main">
                        {/* Brand Section */}
                        <div className="footer-brand">
                            <Link href="/" className="footer-logo">
                                {footer?.footer_logo ? (
                                    <img
                                        alt={
                                            footer?.footer_title ||
                                            "Muslim Hall"
                                        }
                                        src={getS3PublicUrl(`${footer.footer_logo}`)}
                                        onError={(e) => {
                                            e.target.src =
                                                "https://i.postimg.cc/13wzJ2gs/Muslim-Hall-Logo-Design-1.png";
                                        }}
                                    />
                                ) : (
                                    <img
                                        alt="Muslim Hall"
                                        src="https://i.postimg.cc/13wzJ2gs/Muslim-Hall-Logo-Design-1.png"
                                    />
                                )}
                            </Link>
                            <p className="brand-description">
                                {footer?.footer_content ||
                                    "Muslim Hall is your premier destination for Islamic knowledge, connecting communities through authentic publications, educational resources, and spiritual guidance."}
                            </p>
                            <div className="social-links">
                                {social && social.length > 0 ? (
                                    social.map((platform) => (
                                        <Link
                                            key={platform.id}
                                            href={platform.url}
                                            className="social-link"
                                            aria-label={platform.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {/* Use platform.icon instead of platform.name */}
                                            <i className={platform.icon}></i>
                                        </Link>
                                    ))
                                ) : (
                                    <>
                                        <a
                                            href="https://twitter.com"
                                            className="social-link"
                                            aria-label="Twitter"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fab fa-twitter"></i>
                                        </a>
                                        <a
                                            href="https://facebook.com"
                                            className="social-link"
                                            aria-label="Facebook"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fab fa-facebook-f"></i>
                                        </a>
                                        <a
                                            href="https://instagram.com"
                                            className="social-link"
                                            aria-label="Instagram"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fab fa-instagram"></i>
                                        </a>
                                        <a
                                            href="https://youtube.com"
                                            className="social-link"
                                            aria-label="YouTube"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fab fa-youtube"></i>
                                        </a>
                                        <a
                                            href="https://linkedin.com"
                                            className="social-link"
                                            aria-label="LinkedIn"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fab fa-linkedin-in"></i>
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="row">
                            <div className="col-md-4">
                                <h4 className="link-title">Explore</h4>
                                <ul className="link-list">
                                    <li>
                                        <Link href="/contact">Contact</Link>
                                    </li>
                                    <li>
                                        <Link href="/terms">Terms & Conditions</Link>
                                    </li>
                                    <li>
                                        <Link href="/post-details">Posts</Link>
                                    </li>
                                    <li>
                                        <Link href="/islamic-zone">
                                            Islamic Zone
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/exhibition-details">
                                            Exhibitions
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/book-details">Books</Link>
                                    </li>
                                </ul>
                            </div>

                            <div className="col-md-8 mt-5 mt-md-0">
                                <h4 className="link-title">
                                    Bangladesh Prayer Times
                                </h4>

                                {/* Current Dates */}
                                <div className="date-display">
                                    <div className="gregorian-date">
                                        <i className="fas fa-calendar-alt"></i>
                                        {currentDate.toLocaleDateString(
                                            "en-BD",
                                            {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                timeZone: "Asia/Dhaka",
                                            },
                                        )}
                                    </div>
                                    <div className="islamic-date">
                                        <i className="fas fa-moon"></i>
                                        {islamicDate}
                                    </div>
                                    <div className="current-time">
                                        <i className="fas fa-clock"></i>
                                        {currentDate.toLocaleTimeString(
                                            "en-BD",
                                            {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                second: "2-digit",
                                                hour12: true,
                                                timeZone: "Asia/Dhaka",
                                            },
                                        )}{" "}
                                        (BST)
                                    </div>
                                </div>

                                {/* Prayer Times */}
                                {!loading && prayerTimes && (
                                    <div className="prayer-times mt-3">
                                        <h5>Today's Prayer Times</h5>
                                        <div className="prayer-grid">
                                            <div className="prayer">
                                                <span>Fajr</span>
                                                <span>{prayerTimes.fajr}</span>
                                            </div>
                                            <div className="prayer">
                                                <span>Sunrise</span>
                                                <span>
                                                    {prayerTimes.sunrise}
                                                </span>
                                            </div>
                                            <div className="prayer">
                                                <span>Dhuhr</span>
                                                <span>{prayerTimes.dhuhr}</span>
                                            </div>
                                            <div className="prayer">
                                                <span>Asr</span>
                                                <span>{prayerTimes.asr}</span>
                                            </div>
                                            <div className="prayer">
                                                <span>Maghrib</span>
                                                <span>
                                                    {prayerTimes.maghrib}
                                                </span>
                                            </div>
                                            <div className="prayer">
                                                <span>Isha</span>
                                                <span>{prayerTimes.isha}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {loading && (
                                    <div className="prayer-times mt-3">
                                        <h5>Today's Prayer Times</h5>
                                        <div className="loading-prayer">
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <span>Loading prayer times...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Newsletter Section */}
                        <div className="newsletter-section">
                            <h4 className="newsletter-title">Stay Updated</h4>
                            <p className="newsletter-description">
                                Subscribe to our newsletter for the latest
                                Islamic publications, events, and spiritual
                                insights.
                            </p>
                            <div className="contact-info">
                                <div className="contact-item-update">
                                    <i className="fas fa-envelope"></i>
                                    <span>{getContactEmail()}</span>
                                </div>
                                <div className="contact-item-update">
                                    <i className="fas fa-phone"></i>
                                    <span>{getContactPhone()}</span>
                                </div>
                                <div className="contact-item-update">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{getContactAddress()}</span>
                                </div>
                                <div className="contact-item-update">
                                    <i className="fas fa-globe-asia"></i>
                                    <span>Bangladesh Time (GMT+6)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="footer-bottom">
                        <div className="footer-bottom-content">
                            <div className="copyright">
                                <p>
                                    &copy; {new Date().getFullYear()}{" "}
                                    {footer?.footer_title || "Muslim Hall"}. All
                                    rights reserved.
                                </p>
                                <small>
                                    Prayer times are calculated for Bangladesh
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .footer-container {
                    width: 100%;
                    margin-top: auto;
                }

                .modern-footer {
                    background: linear-gradient(
                        135deg,
                        #0f5c2a 0%,
                        #1b7a3a 100%
                    );
                    color: white;
                    position: relative;
                    overflow: hidden;
                }

                /* Main Footer Section */
                .footer-main {
                    display: grid;
                    grid-template-columns: 2fr 3fr 2fr;
                    gap: 60px;
                    padding: 60px 0 40px;
                }

                /* Brand Section */
                .footer-brand {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .footer-logo img {
                        height: 120px;
                    filter: brightness(0) invert(1);
                }

                .brand-description {
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                }

                .social-links {
                    display: flex;
                    gap: 12px;
                    margin-top: 10px;
                }

                .social-link {
                    width: 40px;
                    height: 40px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 16px;
                }

                .social-link:hover {
                    background: white;
                    color: #1b7a3a;
                    border-color: white;
                    transform: translateY(-2px);
                }

                /* Links Section */
                .link-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: white;
                }

                .link-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .link-list li a {
                    color: rgba(255, 255, 255, 0.7);
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }

                .link-list li a:hover {
                    color: white;
                    padding-left: 5px;
                }

                /* Newsletter Section */
                .newsletter-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .newsletter-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 5px;
                }

                .newsletter-description {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .contact-info {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 20px;
                }

                .contact-item-update{
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: rgba(255, 255, 255, 1);
                    font-size: 14px;
                    background:none;
                }

                .contact-item i {
                    width: 16px;
                    text-align: center;
                }

                /* Footer Bottom */
                .footer-bottom {
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 25px 0;
                }

                .footer-bottom-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .copyright p {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 14px;
                }

                .copyright small {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 12px;
                }

                /* Calendar Section */
                .date-display {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                }

                .gregorian-date,
                .islamic-date,
                .current-time {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.9);
                }

                .gregorian-date i,
                .islamic-date i,
                .current-time i {
                    width: 16px;
                    text-align: center;
                    color: #4caf50;
                }

                .current-time {
                    color: #ffd700;
                    font-weight: 500;
                }

                .prayer-times {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                }

                .prayer-times h5 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: white;
                    text-align: center;
                }

                .prayer-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }

                .prayer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    padding: 6px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .prayer:last-child {
                    border-bottom: none;
                }

                .prayer span:first-child {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                }

                .prayer span:last-child {
                    color: #4caf50;
                    font-weight: 600;
                }

                .loading-prayer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 20px;
                    color: rgba(255, 255, 255, 0.7);
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .footer-main {
                        grid-template-columns: 1fr 1fr;
                        gap: 40px;
                    }

                    .newsletter-section {
                        grid-column: 1 / -1;
                    }
                }

                @media (max-width: 768px) {
                    .footer-main {
                        grid-template-columns: 1fr;
                        gap: 40px;
                        padding: 40px 0 30px;
                    }

                    .footer-bottom-content {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .prayer-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 480px) {
                    .footer-main {
                        gap: 30px;
                        padding: 30px 0 20px;
                    }

                    .social-links {
                        justify-content: center;
                    }

                    .date-display {
                        padding: 10px;
                    }

                    .gregorian-date,
                    .islamic-date,
                    .current-time {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
}

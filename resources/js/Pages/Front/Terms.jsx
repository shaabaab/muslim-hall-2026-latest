// resources/js/Pages/TermsCondition/Index.jsx
import { Head, Link } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import Footer from "./Footer";
import Header from "./Header";

export default function Terms() {
    const lastUpdated = "December 17, 2024";
    
    return (
        <FrontAuthenticatedLayout>
            <Head title="Terms and Conditions - Muslim Hall" />

            <Header />

            {/* Hero Section */}
            <div className="terms-hero">
                <div className="container">
                    <h1 className="terms-hero-title">Terms and Conditions</h1>
                    <p className="terms-hero-subtitle">
                        Last Updated: {lastUpdated}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="terms-content">
                <div className="container">
                    <div className="terms-container">
                        {/* Quick Navigation */}
                        <div className="terms-navigation">
                            <div className="nav-title">Quick Navigation</div>
                            <ul className="nav-links">
                                <li><a href="#acceptance">Acceptance of Terms</a></li>
                                <li><a href="#services">Our Services</a></li>
                                <li><a href="#user-conduct">User Conduct</a></li>
                                <li><a href="#intellectual">Intellectual Property</a></li>
                                <li><a href="#donations">Donations & Payments</a></li>
                                <li><a href="#privacy">Privacy Policy</a></li>
                                <li><a href="#limitation">Limitation of Liability</a></li>
                                <li><a href="#termination">Termination</a></li>
                                <li><a href="#governing">Governing Law</a></li>
                                <li><a href="#changes">Changes to Terms</a></li>
                                <li><a href="#contact">Contact Us</a></li>
                            </ul>
                        </div>

                        {/* Terms Content */}
                        <div className="terms-details">
                            <div className="terms-intro">
                                <p className="intro-text">
                                    Welcome to Muslim Hall. These Terms and Conditions govern your use of our website, 
                                    services, and all interactions with our organization. By accessing or using our services, 
                                    you agree to be bound by these terms. Please read them carefully.
                                </p>
                            </div>

                            {/* Section 1 */}
                            <section id="acceptance" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">1.</span>
                                    Acceptance of Terms
                                </h2>
                                <div className="section-content">
                                    <p>
                                        By accessing and using the Muslim Hall website (<strong>www.muslimhall.com</strong>) 
                                        and related services, you acknowledge that you have read, understood, and agree 
                                        to be bound by these Terms and Conditions. If you do not agree with any part 
                                        of these terms, you must not use our services.
                                    </p>
                                    <p>
                                        These terms constitute a legally binding agreement between you and Muslim Hall, 
                                        a non-profit Islamic organization registered in Bangladesh.
                                    </p>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section id="services" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">2.</span>
                                    Our Services
                                </h2>
                                <div className="section-content">
                                    <p>
                                        Muslim Hall provides the following services:
                                    </p>
                                    <ul className="services-list">
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5c-1.95 0-4.05.4-5.5 1.5c-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5c.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5c1.35-.85 3.8-1.5 5.5-1.5c1.65 0 3.35.3 4.75 1.05c.1.05.15.05.25.05c.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5c-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5c1.2 0 2.4.15 3.5.5v11.5z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Islamic Publications:</strong> Distribution of authentic Islamic books, 
                                                articles, and educational materials.
                                            </div>
                                        </li>
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Educational Programs:</strong> Islamic courses, workshops, seminars, 
                                                and online learning resources.
                                            </div>
                                        </li>
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9c0 .74-.16 1.44-.43 2.08l3.01 3.01c1.66-1.27 2.92-3.14 2.92-5.09C21 5.91 16.97 2 12 2S3 5.91 3 9c0 1.96 1.26 3.82 2.92 5.09l2.51-2.51C8.16 10.44 8 9.74 8 9c0-1.93 1.57-3.5 3.5-3.5m0 9c-1.93 0-3.5 1.57-3.5 3.5 0 .74.16 1.44.43 2.08l3.01 3.01c1.66-1.27 2.92-3.14 2.92-5.09 0-1.93-1.57-3.5-3.5-3.5m0-11C8.13 3.5 5 6.63 5 10.5c0 2.28 1.08 4.31 2.75 5.63l8.5-8.5C16.19 6.08 14.16 5 12 5z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Community Services:</strong> Religious guidance, counseling, 
                                                and community development programs.
                                            </div>
                                        </li>
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17 13h-5v5h5v-5zM16 2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V2h-2zm3 18H5V9h14v11z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Event Organization:</strong> Islamic conferences, exhibitions, 
                                                and cultural programs.
                                            </div>
                                        </li>
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 9H3V5h9v7zm2 0V5h7v7h-7zm-2 2H3v7h9v-7zm2 0h7v7h-7v-7z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Digital Content:</strong> Online articles, videos, podcasts, 
                                                and social media content.
                                            </div>
                                        </li>
                                        <li>
                                            <div className="service-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <strong>Donation Platform:</strong> Facilitating charitable donations 
                                                for Islamic causes and community projects.
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section id="user-conduct" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">3.</span>
                                    User Conduct and Responsibilities
                                </h2>
                                <div className="section-content">
                                    <p>
                                        As a user of Muslim Hall services, you agree to:
                                    </p>
                                    
                                    <div className="conduct-grid">
                                        <div className="conduct-item allowed">
                                            <h4>
                                                <svg className="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                </svg>
                                                Permitted Activities
                                            </h4>
                                            <ul>
                                                <li>Respect Islamic values and principles in all interactions</li>
                                                <li>Use content for personal educational purposes</li>
                                                <li>Share content with proper attribution</li>
                                                <li>Provide constructive feedback</li>
                                                <li>Participate in discussions respectfully</li>
                                                <li>Report inappropriate content or behavior</li>
                                            </ul>
                                        </div>

                                        <div className="conduct-item prohibited">
                                            <h4>
                                                <svg className="x-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                                </svg>
                                                Prohibited Activities
                                            </h4>
                                            <ul>
                                                <li>Misrepresent Islamic teachings or our organization</li>
                                                <li>Use content for commercial purposes without permission</li>
                                                <li>Upload or distribute inappropriate content</li>
                                                <li>Harass or offend other users</li>
                                                <li>Attempt to hack or disrupt our services</li>
                                                <li>Spread misinformation about Islam</li>
                                                <li>Use services for political campaigning</li>
                                                <li>Violate any applicable laws or regulations</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section id="intellectual" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">4.</span>
                                    Intellectual Property Rights
                                </h2>
                                <div className="section-content">
                                    <p>
                                        All content on the Muslim Hall website and platforms, including but not limited to:
                                    </p>
                                    <ul className="ip-list">
                                        <li>Text, articles, and written materials</li>
                                        <li>Graphics, logos, and design elements</li>
                                        <li>Videos, audio recordings, and podcasts</li>
                                        <li>Software and website code</li>
                                        <li>Databases and organizational materials</li>
                                    </ul>
                                    <p>
                                        are the property of Muslim Hall or its content providers and are protected by 
                                        copyright and other intellectual property laws.
                                    </p>
                                    
                                    <div className="ip-notes">
                                        <div className="ip-note">
                                            <div className="ip-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Educational Use</h4>
                                                <p>
                                                    You may use our educational content for personal, non-commercial 
                                                    educational purposes with proper attribution to Muslim Hall.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ip-note">
                                            <div className="ip-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v3h10V5h2v14z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Permissions</h4>
                                                <p>
                                                    For reproduction, distribution, or commercial use of any content, 
                                                    written permission must be obtained from Muslim Hall management.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 5 */}
                            <section id="donations" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">5.</span>
                                    Donations, Payments, and Refunds
                                </h2>
                                <div className="section-content">
                                    <h3 className="subsection-title">5.1 Donation Policy</h3>
                                    <p>
                                        Muslim Hall accepts donations for various Islamic causes including:
                                    </p>
                                    <ul>
                                        <li>Islamic education and scholarship programs</li>
                                        <li>Community development projects</li>
                                        <li>Publication of Islamic literature</li>
                                        <li>Charitable activities and relief work</li>
                                    </ul>
                                    
                                    <h3 className="subsection-title">5.2 Payment Terms</h3>
                                    <ul>
                                        <li>All donations are voluntary and non-refundable</li>
                                        <li>We accept donations through secure payment gateways</li>
                                        <li>All transactions are processed in Bangladeshi Taka (BDT)</li>
                                        <li>Donation receipts will be provided for all contributions</li>
                                    </ul>
                                    
                                    <h3 className="subsection-title">5.3 Zakat and Sadaqah</h3>
                                    <p>
                                        For Zakat donations, Muslim Hall ensures compliance with Islamic principles 
                                        regarding Zakat distribution to eligible recipients as per Islamic jurisprudence.
                                    </p>
                                    
                                    <h3 className="subsection-title">5.4 Refund Policy</h3>
                                    <p>
                                        Due to the charitable nature of donations, refunds are generally not provided. 
                                        However, in exceptional circumstances, requests may be considered on a case-by-case basis.
                                    </p>
                                </div>
                            </section>

                            {/* Section 6 */}
                            <section id="privacy" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">6.</span>
                                    Privacy Policy
                                </h2>
                                <div className="section-content">
                                    <p>
                                        Muslim Hall is committed to protecting your privacy. Our Privacy Policy governs 
                                        the collection, use, and protection of your personal information.
                                    </p>
                                    
                                    <div className="privacy-points">
                                        <div className="privacy-point">
                                            <div className="privacy-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Information Collection</h4>
                                                <p>We collect information you provide voluntarily during registration, 
                                                donations, or when contacting us.</p>
                                            </div>
                                        </div>
                                        <div className="privacy-point">
                                            <div className="privacy-icon">
                                                <svg xmlns="http://www.w3.org2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Data Usage</h4>
                                                <p>Your information is used to provide services, process donations, 
                                                and improve user experience.</p>
                                            </div>
                                        </div>
                                        <div className="privacy-point">
                                            <div className="privacy-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Information Sharing</h4>
                                                <p>We do not sell or rent personal information to third parties. 
                                                Information may be shared with service providers for operational purposes only.</p>
                                            </div>
                                        </div>
                                        <div className="privacy-point">
                                            <div className="privacy-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4>Data Security</h4>
                                                <p>We implement appropriate security measures to protect your information 
                                                from unauthorized access.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 7 */}
                            <section id="limitation" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">7.</span>
                                    Limitation of Liability
                                </h2>
                                <div className="section-content">
                                    <p>
                                        Muslim Hall strives to provide accurate and authentic Islamic information, 
                                        but we cannot guarantee:
                                    </p>
                                    <ul>
                                        <li>Absolute accuracy of all content</li>
                                        <li>Uninterrupted access to our services</li>
                                        <li>Freedom from errors or omissions</li>
                                        <li>Compatibility with all devices or browsers</li>
                                    </ul>
                                    <p>
                                        <strong>Disclaimer:</strong> Muslim Hall and its representatives shall not be 
                                        liable for any direct, indirect, incidental, or consequential damages arising 
                                        from your use of our services or reliance on our content.
                                    </p>
                                    <div className="islamic-note">
                                        <div className="islamic-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <strong>Islamic Note:</strong> While we strive for authenticity, Islamic 
                                            interpretations may vary. We encourage users to consult with qualified scholars 
                                            for personal religious matters.
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 8 */}
                            <section id="termination" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">8.</span>
                                    Termination of Access
                                </h2>
                                <div className="section-content">
                                    <p>
                                        Muslim Hall reserves the right to terminate or suspend your access to our 
                                        services at our sole discretion, without notice, for conduct that we believe:
                                    </p>
                                    <ul>
                                        <li>Violates these Terms and Conditions</li>
                                        <li>Violates Islamic principles or values</li>
                                        <li>Is harmful to other users or the organization</li>
                                        <li>Is unlawful or inappropriate</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 9 */}
                            <section id="governing" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">9.</span>
                                    Governing Law and Dispute Resolution
                                </h2>
                                <div className="section-content">
                                    <p>
                                        These Terms and Conditions shall be governed by and construed in accordance 
                                        with the laws of the People's Republic of Bangladesh.
                                    </p>
                                    <p>
                                        Any disputes arising from these terms shall first be attempted to be resolved 
                                        through mutual discussion and mediation in accordance with Islamic principles 
                                        of conflict resolution.
                                    </p>
                                    <p>
                                        If mediation fails, disputes shall be subject to the exclusive jurisdiction 
                                        of the courts in Dhaka, Bangladesh.
                                    </p>
                                </div>
                            </section>

                            {/* Section 10 */}
                            <section id="changes" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">10.</span>
                                    Changes to Terms and Conditions
                                </h2>
                                <div className="section-content">
                                    <p>
                                        Muslim Hall reserves the right to modify these Terms and Conditions at any time. 
                                        We will notify users of significant changes by:
                                    </p>
                                    <ul>
                                        <li>Posting the updated terms on our website</li>
                                        <li>Updating the "Last Updated" date</li>
                                        <li>Sending email notifications to registered users</li>
                                    </ul>
                                    <p>
                                        Your continued use of our services after any changes constitutes acceptance 
                                        of the modified terms.
                                    </p>
                                </div>
                            </section>

                            {/* Section 11 */}
                            <section id="contact" className="terms-section">
                                <h2 className="section-title">
                                    <span className="section-number">11.</span>
                                    Contact Information
                                </h2>
                                <div className="section-content">
                                    <p>
                                        For questions, concerns, or requests regarding these Terms and Conditions, 
                                        please contact us:
                                    </p>
                                    <div className="contact-info">
                                        <div className="contact-item">
                                            <div className="contact-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                                </svg>
                                            </div>
                                            <span>Email: legal@muslimhall.com</span>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                                </svg>
                                            </div>
                                            <span>Phone: +880 XXX-XXXXXXX</span>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                </svg>
                                            </div>
                                            <span>Address: Muslim Hall Office, Dhaka, Bangladesh</span>
                                        </div>
                                        <div className="contact-item">
                                            <div className="contact-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                                </svg>
                                            </div>
                                            <span>Response Time: 3-5 business days</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Acceptance Footer */}
                            <div className="acceptance-footer">
                                <h3>Acceptance Acknowledgment</h3>
                                <p>
                                    By using Muslim Hall services, you acknowledge that you have read, understood, 
                                    and agree to be bound by these Terms and Conditions. These terms, together with 
                                    our Privacy Policy, constitute the complete agreement between you and Muslim Hall.
                                </p>
                                <div className="last-updated">
                                    <div className="update-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 8V4l8 8-8 8v-4H4V8h8z"/>
                                        </svg>
                                    </div>
                                    Last updated: {lastUpdated}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
                /* Hero Section */
                .terms-hero {
                    background: linear-gradient(135deg, #1b7a3a 0%, #0f5c2a 100%);
                    color: white;
                    padding: 80px 0;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .terms-hero:before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('https://i.postimg.cc/13wzJ2gs/Muslim-Hall-Logo-Design-1.png') center/200px no-repeat;
                    opacity: 0.1;
                }

                .terms-hero-title {
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 15px;
                    position: relative;
                }

                .terms-hero-subtitle {
                    font-size: 18px;
                    opacity: 0.9;
                    position: relative;
                }

                /* Main Content */
                .terms-content {
                    padding: 60px 0;
                    background: #f8f9fa;
                    min-height: calc(100vh - 200px);
                }


                .terms-container {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 40px;
                    position: relative;
                }

                /* Navigation */
                .terms-navigation {
                    position: sticky;
                    top: 100px;
                    height: fit-content;
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
                }

                .nav-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1b7a3a;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e8f5e8;
                }

                .nav-links {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .nav-links li {
                    margin-bottom: 12px;
                }

                .nav-links a {
                    color: #555;
                    text-decoration: none;
                    font-size: 14px;
                    display: block;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .nav-links a:hover {
                    background: #e8f5e8;
                    color: #1b7a3a;
                    padding-left: 20px;
                }

                /* Terms Details */
                .terms-details {
                    background: white;
                    border-radius: 15px;
                    padding: 40px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
                }

                .terms-intro {
                    margin-bottom: 40px;
                    padding-bottom: 30px;
                    border-bottom: 2px solid #e8f5e8;
                }

                .intro-text {
                    font-size: 16px;
                    line-height: 1.8;
                    color: #444;
                }

                /* Section Styling */
                .terms-section {
                    margin-bottom: 50px;
                    padding-bottom: 40px;
                    border-bottom: 1px solid #eee;
                }

                .terms-section:last-of-type {
                    border-bottom: none;
                }

                .section-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .section-number {
                    background: #1b7a3a;
                    color: white;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }

                .section-content {
                    color: #444;
                    line-height: 1.7;
                }

                .section-content p {
                    margin-bottom: 15px;
                }

                .section-content ul {
                    margin-left: 20px;
                    margin-bottom: 20px;
                }

                .section-content li {
                    margin-bottom: 8px;
                }

                /* Services List */
                .services-list {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                }

                .services-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #1b7a3a;
                }

                .service-icon {
                    width: 24px;
                    height: 24px;
                    color: #1b7a3a;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .service-icon svg {
                    width: 100%;
                    height: 100%;
                }

                /* Conduct Grid */
                .conduct-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin: 25px 0;
                }

                .conduct-item {
                    padding: 25px;
                    border-radius: 10px;
                    border: 2px solid;
                }

                .conduct-item.allowed {
                    border-color: #28a745;
                    background: #f0fff4;
                }

                .conduct-item.prohibited {
                    border-color: #dc3545;
                    background: #fff5f5;
                }

                .conduct-item h4 {
                    margin-bottom: 15px;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .check-icon, .x-icon {
                    width: 20px;
                    height: 20px;
                }

                .check-icon {
                    color: #28a745;
                }

                .x-icon {
                    color: #dc3545;
                }

                .conduct-item ul {
                    margin-left: 0;
                    list-style: none;
                    padding: 0;
                }

                .conduct-item li {
                    margin-bottom: 10px;
                    padding-left: 25px;
                    position: relative;
                }

                .conduct-item.allowed li:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 5px;
                    width: 16px;
                    height: 16px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2328a745'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
                    background-size: contain;
                }

                .conduct-item.prohibited li:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 5px;
                    width: 16px;
                    height: 16px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc3545'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E");
                    background-size: contain;
                }

                /* IP Notes */
                .ip-notes {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 25px 0;
                }

                .ip-note {
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #1b7a3a;
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }

                .ip-icon {
                    width: 24px;
                    height: 24px;
                    color: #1b7a3a;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .ip-icon svg {
                    width: 100%;
                    height: 100%;
                }

                .ip-note h4 {
                    color: #1b7a3a;
                    margin-bottom: 10px;
                    font-size: 16px;
                }

                .ip-note p {
                    font-size: 14px;
                    color: #666;
                    line-height: 1.6;
                }

                /* Privacy Points */
                .privacy-points {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 25px 0;
                }

                .privacy-point {
                    padding: 20px;
                    background: #f0f9ff;
                    border-radius: 10px;
                    border: 1px solid #d1ecf1;
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }

                .privacy-icon {
                    width: 24px;
                    height: 24px;
                    color: #1b7a3a;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .privacy-icon svg {
                    width: 100%;
                    height: 100%;
                }

                .privacy-point h4 {
                    color: #1b7a3a;
                    margin-bottom: 10px;
                    font-size: 16px;
                }

                .privacy-point p {
                    font-size: 14px;
                    color: #666;
                    line-height: 1.6;
                }

                /* Islamic Note */
                .islamic-note {
                    background: #fff8e1;
                    padding: 20px;
                    border-radius: 10px;
                    border-left: 4px solid #ffc107;
                    margin-top: 20px;
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                }

                .islamic-icon {
                    width: 24px;
                    height: 24px;
                    color: #ffc107;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .islamic-icon svg {
                    width: 100%;
                    height: 100%;
                }

                .islamic-note strong {
                    color: #856404;
                }

                /* Contact Info */
                .contact-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 25px;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 15px;
                    background: none;
                    border-radius: 8px;
                }

                .contact-icon {
                    width: 20px;
                    height: 20px;
                    color: #1b7a3a;
                    flex-shrink: 0;
                }

                .contact-icon svg {
                    width: 100%;
                    height: 100%;
                }

                /* Acceptance Footer */
                .acceptance-footer {
                    background: #e8f5e8;
                    padding: 30px;
                    border-radius: 15px;
                    margin-top: 50px;
                    text-align: center;
                    border: 2px solid #1b7a3a;
                }

                .acceptance-footer h3 {
                    color: #1b7a3a;
                    margin-bottom: 20px;
                }

                .last-updated {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    margin-top: 20px;
                    font-weight: 500;
                }

                .update-icon {
                    width: 20px;
                    height: 20px;
                    color: #1b7a3a;
                }

                .update-icon svg {
                    width: 100%;
                    height: 100%;
                }

                /* Subsection */
                .subsection-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 25px 0 15px;
                    padding-left: 10px;
                    border-left: 4px solid #1b7a3a;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .terms-container {
                        grid-template-columns: 250px 1fr;
                        gap: 30px;
                    }

                    .conduct-grid,
                    .ip-notes {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .terms-hero-title {
                        font-size: 36px;
                    }

                    .terms-container {
                        grid-template-columns: 1fr;
                    }

                    .terms-navigation {
                        position: static;
                        margin-bottom: 30px;
                    }

                    .nav-links {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 10px;
                    }

                    .terms-details {
                        padding: 30px;
                    }

                    .section-title {
                        font-size: 20px;
                    }

                    .services-list li {
                        flex-direction: column;
                        gap: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .terms-hero {
                        padding: 60px 0;
                    }

                    .terms-hero-title {
                        font-size: 28px;
                    }

                    .terms-content {
                        padding: 40px 0;
                    }

                    .terms-details {
                        padding: 20px;
                    }

                    .conduct-item,
                    .ip-note,
                    .privacy-point,
                    .islamic-note {
                        padding: 15px;
                    }

                    .acceptance-footer {
                        padding: 20px;
                    }

                    .contact-info {
                        grid-template-columns: 1fr;
                    }
                }

                /* Print Styles */
                @media print {
                    .terms-navigation {
                        display: none;
                    }

                    .terms-container {
                        grid-template-columns: 1fr;
                    }

                    .terms-hero {
                        background: white !important;
                        color: black !important;
                        padding: 40px 0 !important;
                    }

                    .acceptance-footer {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
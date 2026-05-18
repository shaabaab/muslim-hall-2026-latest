// resources/js/Pages/Contact/Index.jsx
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';
import { useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";

export default function ContactPage() {
    const { contactInfo, social, settings } = usePage().props;
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        
        post(route('contact.store'), {
            onSuccess: () => {
                setSubmitted(true);
                reset();
                setTimeout(() => setSubmitted(false), 5000);
            },
        });
    };

    // Format address safely
    const formatAddress = () => {
        if (!contactInfo?.address) return "Islamic Knowledge Center, Dhaka";

        if (typeof contactInfo.address === 'string') {
            return contactInfo.address;
        }

        if (typeof contactInfo.address === 'object' && contactInfo.address !== null) {
            const { street, city, state, zip } = contactInfo.address;
            const parts = [street, city, state, zip].filter(Boolean);
            return parts.join(', ');
        }
        
        return "Islamic Knowledge Center, Dhaka";
    };

    // Get contact information with fallbacks
    const getContactEmail = () => {
        return contactInfo?.email_one || "info@muslimhall.com";
    };

    const getSupportEmail = () => {
        return contactInfo?.email_two || "support@muslimhall.com";
    };

    const getContactPhone = () => {
        return contactInfo?.phone_one || "+880 XXXX-XXXXXX";
    };

    const getSupportPhone = () => {
        return contactInfo?.phone_two || "+880 XXXX-XXXXXX";
    };

    // Format business hours from settings or use default
    const getBusinessHours = () => {
        if (contactInfo?.business_hours) {
            return contactInfo.business_hours;
        }
        
        // Default business hours
        return {
            weekday: "Monday - Friday: 9:00 AM - 6:00 PM",
            saturday: "Saturday: 10:00 AM - 4:00 PM",
            sunday: "Sunday: Closed"
        };
    };

    // Get current Bangladesh time
    const getCurrentBangladeshTime = () => {
        const now = new Date();
        const bangladeshOffset = 6 * 60; // GMT+6 in minutes
        const localOffset = now.getTimezoneOffset();
        return new Date(now.getTime() + (bangladeshOffset + localOffset) * 60000);
    };

    const currentTime = getCurrentBangladeshTime();

    return (
        <FrontAuthenticatedLayout>
            <Header/>

            {/* Hero Section */}
            <div className="contact-hero">
                <div className="container">
                    <h1 className="contact-hero-title">Contact Us</h1>
                    <p className="contact-hero-subtitle">
                        We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </div>

            {/* Contact Section */}
            <div className="contact-section">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Form */}
                        <div className="contact-form-container">
                            <div className="contact-form-header">
                                <h2 className="contact-form-title">Send Message</h2>
                                <p className="contact-form-description">
                                    Fill out the form below and we'll get back to you shortly.
                                </p>
                            </div>

                            {submitted && (
                                <div className="success-message">
                                    <i className="fas fa-check-circle"></i>
                                    Thank you for your message! We will get back to you soon.
                                </div>
                            )}

                            <form onSubmit={submit} className="contact-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="name" className="form-label">
                                            Full Name *
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className={`form-input ${errors.name ? 'error' : ''}`}
                                            placeholder="Your full name"
                                            required
                                        />
                                        {errors.name && <div className="form-error">{errors.name}</div>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">
                                            Email Address *
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={`form-input ${errors.email ? 'error' : ''}`}
                                            placeholder="your.email@example.com"
                                            required
                                        />
                                        {errors.email && <div className="form-error">{errors.email}</div>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone" className="form-label">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className={`form-input ${errors.phone ? 'error' : ''}`}
                                        placeholder="+880 1XXX-XXXXXX"
                                    />
                                    {errors.phone && <div className="form-error">{errors.phone}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject" className="form-label">
                                        Subject *
                                    </label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        className={`form-input ${errors.subject ? 'error' : ''}`}
                                        placeholder="What is this regarding?"
                                        required
                                    />
                                    {errors.subject && <div className="form-error">{errors.subject}</div>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message" className="form-label">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className={`form-textarea ${errors.message ? 'error' : ''}`}
                                        placeholder="Please describe your inquiry in detail..."
                                        rows="6"
                                        required
                                    />
                                    {errors.message && <div className="form-error">{errors.message}</div>}
                                </div>

                                <div className="form-submit">
                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i>
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Contact Information */}
                        <div className="contact-info">
                            <div className="contact-info-card">
                                <h3 className="contact-info-title">Contact Information</h3>
                                <p className="contact-info-description">
                                    Feel free to reach out to us through any of the following channels.
                                </p>

                                <div className="current-time-display">
                                    <div className="current-time">
                                        <i className="fas fa-clock"></i>
                                        <span>
                                            Bangladesh Time: {currentTime.toLocaleTimeString('en-BD', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Dhaka'
                                            })} (GMT+6)
                                        </span>
                                    </div>
                                </div>

                                <div className="contact-info-items">
                                    <div className="contact-info-item">
                                        <div className="contact-info-icon">
                                            <i className="fas fa-map-marker-alt"></i>
                                        </div>
                                        <div className="contact-info-content">
                                            <h4 className="contact-info-item-title">Our Location</h4>
                                            <p className="contact-info-item-text">
                                                {formatAddress()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="contact-info-item">
                                        <div className="contact-info-icon">
                                            <i className="fas fa-phone"></i>
                                        </div>
                                        <div className="contact-info-content">
                                            <h4 className="contact-info-item-title">Phone Numbers</h4>
                                            <p className="contact-info-item-text">
                                                {getContactPhone()}<br />
                                                {getSupportPhone()}<br />
                                                <small className="phone-hours">Mon - Fri, 9:00 AM - 6:00 PM</small>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="contact-info-item">
                                        <div className="contact-info-icon">
                                            <i className="fas fa-envelope"></i>
                                        </div>
                                        <div className="contact-info-content">
                                            <h4 className="contact-info-item-title">Email Addresses</h4>
                                            <p className="contact-info-item-text">
                                                {getContactEmail()}<br />
                                                {getSupportEmail()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="contact-info-item">
                                        <div className="contact-info-icon">
                                            <i className="fas fa-clock"></i>
                                        </div>
                                        <div className="contact-info-content">
                                            <h4 className="contact-info-item-title">Business Hours</h4>
                                            <div className="contact-info-item-text">
                                                {typeof getBusinessHours() === 'object' ? (
                                                    <>
                                                        <div>{getBusinessHours().weekday}</div>
                                                        <div>{getBusinessHours().saturday}</div>
                                                        <div>{getBusinessHours().sunday}</div>
                                                    </>
                                                ) : (
                                                    getBusinessHours()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
                <div className="container">
                    <div className="faq-header">
                        <h2 className="faq-title">Frequently Asked Questions</h2>
                        <p className="faq-subtitle">
                            Can't find what you're looking for? Check out our FAQ section.
                        </p>
                    </div>

                    <div className="faq-grid">
                        <div className="faq-item">
                            <div className="faq-question">
                                <i className="fas fa-question-circle"></i>
                                How long does it take to get a response?
                            </div>
                            <div className="faq-answer">
                                We typically respond within 24-48 hours during business days. For urgent matters, please call our support line.
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <i className="fas fa-question-circle"></i>
                                Do you offer technical support?
                            </div>
                            <div className="faq-answer">
                                Yes, we provide technical support for all our products and services. Please include your product details in your message.
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <i className="fas fa-question-circle"></i>
                                Can I schedule a meeting or call?
                            </div>
                            <div className="faq-answer">
                                Absolutely! Mention your preferred date and time in your message, and we'll get back to you to confirm the appointment.
                            </div>
                        </div>

                        <div className="faq-item">
                            <div className="faq-question">
                                <i className="fas fa-question-circle"></i>
                                What information should I include in my message?
                            </div>
                            <div className="faq-answer">
                                Please include your contact information, specific details about your inquiry, and any relevant order or account numbers if applicable.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* Hero Section */
                .contact-hero {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    color: white;
                    padding: 80px 0;
                    text-align: center;
                }

                .contact-hero-title {
                    font-size: 48px;
                    font-weight: 700;
                    margin-bottom: 20px;
                }

                .contact-hero-subtitle {
                    font-size: 18px;
                    opacity: 0.9;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                /* Contact Section */
                .contact-section {
                    padding: 80px 0;
                    background: #f9f9f9;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .contact-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 50px;
                }

                /* Current Time Display */
                .current-time-display {
                    background: #e8f5e8;
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #1b7a3a;
                }

                .current-time {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #1b7a3a;
                    font-weight: 500;
                    font-size: 14px;
                }

                .current-time i {
                    color: #1b7a3a;
                }

                /* Phone Hours */
                .phone-hours {
                    color: #666;
                    font-size: 12px;
                    margin-top: 5px;
                    display: block;
                }

                /* Contact Form */
                .contact-form-container {
                    background: white;
                    border-radius: 15px;
                    padding: 40px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                }

                .contact-form-header {
                    margin-bottom: 30px;
                }

                .contact-form-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 10px;
                }

                .contact-form-description {
                    color: #666;
                    font-size: 15px;
                }

                .success-message {
                    background: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-left: 4px solid #28a745;
                }

                .contact-form {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-label {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #333;
                    font-size: 14px;
                }

                .form-input, .form-textarea {
                    padding: 12px 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 15px;
                    transition: all 0.3s ease;
                }

                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                .form-input.error, .form-textarea.error {
                    border-color: #dc3545;
                }

                .form-error {
                    color: #dc3545;
                    font-size: 13px;
                    margin-top: 5px;
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 120px;
                    font-family: inherit;
                }

                .form-submit {
                    margin-top: 10px;
                }

                .submit-button {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                }

                .submit-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                .submit-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Contact Information */
                .contact-info-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                    position: sticky;
                    top: 100px;
                }

                .contact-info-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 10px;
                }

                .contact-info-description {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .contact-info-items {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                    margin-bottom: 30px;
                }

                .contact-info-item {
                    display: flex;
                    gap: 15px;
                }

                .contact-info-icon {
                    width: 50px;
                    height: 50px;
                    background: #e8f5e8;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .contact-info-icon i {
                    font-size: 20px;
                    color: #1b7a3a;
                }

                .contact-info-content {
                    flex: 1;
                }

                .contact-info-item-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                }

                .contact-info-item-text {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .contact-social {
                    border-top: 2px solid #f0f0f0;
                    padding-top: 25px;
                }

                .contact-social-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 15px;
                }

                .social-links {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .social-link {
                    width: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }

                .social-link:hover {
                    background: #1b7a3a;
                    color: white;
                    transform: translateY(-3px);
                }

                /* FAQ Section */
                .faq-section {
                    padding: 80px 0;
                    background: #f9f9f9;
                }

                .faq-header {
                    text-align: center;
                    margin-bottom: 50px;
                }

                .faq-title {
                    font-size: 36px;
                    font-weight: 700;
                    color: #333;
                    margin-bottom: 15px;
                }

                .faq-subtitle {
                    color: #666;
                    font-size: 16px;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .faq-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                }

                .faq-item {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                }

                .faq-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                }

                .faq-question {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .faq-question i {
                    color: #1b7a3a;
                }

                .faq-answer {
                    color: #666;
                    line-height: 1.6;
                    font-size: 15px;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .contact-grid {
                        grid-template-columns: 1fr;
                        gap: 40px;
                    }

                    .contact-info-card {
                        position: static;
                    }
                }

                @media (max-width: 768px) {
                    .contact-hero-title {
                        font-size: 36px;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .faq-title {
                        font-size: 28px;
                    }

                    .contact-hero,
                    .contact-section,
                    .faq-section {
                        padding: 60px 0;
                    }

                    .contact-form-container,
                    .contact-info-card {
                        padding: 30px;
                    }

                    .social-links {
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    .contact-hero-title {
                        font-size: 28px;
                    }

                    .contact-hero-subtitle {
                        font-size: 16px;
                    }

                    .contact-form-container,
                    .contact-info-card {
                        padding: 20px;
                    }

                    .faq-grid {
                        grid-template-columns: 1fr;
                    }

                    .contact-info-item {
                        flex-direction: column;
                        text-align: center;
                    }

                    .contact-info-icon {
                        margin: 0 auto;
                    }
                }
            `}</style>
            <Footer/>
        </FrontAuthenticatedLayout>
    );
}
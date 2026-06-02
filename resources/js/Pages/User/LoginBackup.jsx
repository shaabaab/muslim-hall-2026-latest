import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import {
    EyeInvisibleOutlined,
    EyeTwoTone,
    GoogleCircleFilled,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import Footer from "../Front/Footer";
import Header from "../Front/Header";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(route("login"), formData, {
            onSuccess: () => {
                setIsSubmitting(false);
                // Redirect will be handled by Laravel
            },
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
            preserveState: true,
        });
    };

    const inputFields = [
        {
            name: "email",
            type: "email",
            placeholder: "Email",
            icon: "fa-solid fa-envelope",
        },
        {
            name: "password",
            type: passwordVisible ? "text" : "password",
            placeholder: "Password",
            icon: "fa-solid fa-lock",
        },
    ];

    return (
        <FrontAuthenticatedLayout>
            <Header />

            {/* Login Form Section */}
            <div className="content-section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-xl-6 col-lg-8">
                            <div className="registration-card">
                                <div className="registration-header">
                                    <h2 className="registration-title">
                                        Sign In to Your Account
                                    </h2>
                                    <p className="registration-subtitle">
                                        Welcome back! Please enter your
                                        credentials
                                    </p>
                                </div>

                                <form
                                    className="registration-form"
                                    onSubmit={handleSubmit}
                                >
                                    {inputFields.map((field) => (
                                        <div
                                            key={field.name}
                                            className="form-group"
                                        >
                                            <div
                                                className={`input-wrapper${errors[field.name] ? " error" : ""}`}
                                            >
                                                <div className="input-icon">
                                                    <i className={field.icon} />
                                                </div>
                                                {field.name === "password" ? (
                                                    <div
                                                        style={{
                                                            position:
                                                                "relative",
                                                            width: "100%",
                                                        }}
                                                    >
                                                        <input
                                                            type={field.type}
                                                            name={field.name}
                                                            placeholder={
                                                                field.placeholder
                                                            }
                                                            required
                                                            className={`form-input${errors[field.name] ? " error" : ""} w-full`}
                                                            value={
                                                                formData[
                                                                    field.name
                                                                ]
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            style={{
                                                                paddingRight:
                                                                    "2.5rem",
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                right: "10px",
                                                                top: "50%",
                                                                transform:
                                                                    "translateY(-50%)",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "20px",
                                                                color: "#666",
                                                            }}
                                                            onClick={() =>
                                                                setPasswordVisible(
                                                                    (v) => !v,
                                                                )
                                                            }
                                                        >
                                                            {passwordVisible ? (
                                                                <EyeTwoTone />
                                                            ) : (
                                                                <EyeInvisibleOutlined />
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        placeholder={
                                                            field.placeholder
                                                        }
                                                        required
                                                        className={`form-input${errors[field.name] ? " error" : ""}`}
                                                        value={
                                                            formData[field.name]
                                                        }
                                                        onChange={handleChange}
                                                        disabled={isSubmitting}
                                                    />
                                                )}
                                            </div>
                                            {errors[field.name] && (
                                                <div className="error-message">
                                                    {errors[field.name]}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        className="submit-button submit-button-bg"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="button-loading">
                                                <i className="fa-solid fa-spinner fa-spin me-2"></i>
                                                Signing In...
                                            </span>
                                        ) : (
                                            "Sign In"
                                        )}
                                    </button>

                                    <p className="text-center  mt-4">or</p>

                                    <a
                                        type="button"
                                        className="submit-button google-button-bg"
                                        href="/auth/google"
                                    >
                                        <>
                                            {" "}
                                            <GoogleCircleFilled /> Login with
                                            <span style={{ color: "#4285F4" }}>
                                                {" "}
                                                G
                                            </span>
                                            <span style={{ color: "#DB4437" }}>
                                                o
                                            </span>
                                            <span style={{ color: "#F4B400" }}>
                                                o
                                            </span>
                                            <span style={{ color: "#4285F4" }}>
                                                g
                                            </span>
                                            <span style={{ color: "#0F9D58" }}>
                                                l
                                            </span>
                                            <span style={{ color: "#DB4437" }}>
                                                e{" "}
                                            </span>
                                            <GoogleCircleFilled />
                                        </>
                                    </a>
                                </form>

                                <div className="registration-footer">
                                    <p className="login-text">
                                        Don't have an account?
                                        <Link
                                            href="/registration"
                                            className="login-link"
                                        >
                                            Create Account
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx>{`
                /* Hero Section Styles */
                .hero-section {
                    border-radius: 20px;
                    padding: 4rem 2rem;
                    margin: 2rem auto;
                    max-width: 1200px;
                    color: white;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(20, 108, 32, 0.9) 0%,
                            rgba(46, 139, 87, 0.9) 100%
                        ),
                        url("https://i.postimg.cc/wx0LVLsG/footer-decor-full.png");
                    background-size: cover;
                    background-position: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .hero-content {
                    flex: 1;
                    padding-right: 2rem;
                }

                .hero-title {
                    font-size: 45px;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    line-height: 1.2;
                }

                .hero-text {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 2rem;
                    opacity: 0.95;
                    max-width: 600px;
                }

                .hero-image {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .hero-image img {
                    max-width: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                    border: 1px solid gold;
                    box-shadow: 0px 0px 8px black;
                }

                /* Login Section */
                .content-section {
                    padding: 80px 0;
                    background-color: #f9f9f9;
                }

                .registration-card {
                    background: white;
                    border-radius: 20px;
                    padding: 3rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e0e0e0;
                }

                .registration-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .registration-title {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin-bottom: 0.5rem;
                }

                .registration-subtitle {
                    color: #666;
                    font-size: 1rem;
                    margin: 0;
                }

                /* Form Styles */
                .registration-form {
                    margin-bottom: 2rem;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    background: white;
                }

                .input-wrapper:focus-within {
                    border-color: #1b7a3a;
                    box-shadow: 0 0 0 3px rgba(27, 122, 58, 0.1);
                }

                .input-wrapper.error {
                    border-color: #dc3545;
                }

                .input-icon {
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #666;
                    font-size: 1rem;
                }

                .form-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    padding: 0.75rem 0.5rem;
                    font-size: 1rem;
                    background: transparent;
                    border-radius: 12px;
                }

                .form-input::placeholder {
                    color: #999;
                }

                .form-input:disabled {
                    background-color: #f8f9fa;
                    cursor: not-allowed;
                }

                .error-message {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    padding-left: 0.5rem;
                }

                /* Submit Button */
                .submit-button {
                    width: 100%;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 1rem;
                    text-align: center;
                }

                .submit-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                }

                .submit-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .submit-button-bg {
                    background: linear-gradient(
                        135deg,
                        #1b7a3a 0%,
                        #2e8b57 100%
                    );
                }

                .google-button-bg {
                    background-color: #ac1000 !important;
                    font-size: 23px;
                }

                .button-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Registration Footer */
                .registration-footer {
                    text-align: center;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                }

                .login-text {
                    color: #666;
                    margin: 0;
                    font-size: 1rem;
                }

                .login-link {
                    color: #1b7a3a;
                    text-decoration: none;
                    font-weight: 600;
                    margin-left: 0.5rem;
                    transition: color 0.3s ease;
                }

                .login-link:hover {
                    color: #2e8b57;
                    text-decoration: underline;
                }

                /* Responsive Design */
                @media (max-width: 992px) {
                    .hero-section {
                        flex-direction: column;
                        text-align: center;
                        padding: 3rem 1.5rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        margin-bottom: 2rem;
                    }

                    .hero-title {
                        font-size: 2.5rem;
                    }

                    .registration-card {
                        padding: 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .content-section {
                        padding: 60px 0;
                    }

                    .hero-title {
                        font-size: 2rem;
                    }

                    .hero-text {
                        font-size: 1rem;
                    }

                    .registration-title {
                        font-size: 28px;
                    }

                    .registration-card {
                        padding: 1.5rem;
                        margin: 0 1rem;
                    }
                }

                @media (max-width: 576px) {
                    .hero-section {
                        padding: 2rem 1rem;
                        margin: 1rem auto;
                        min-height: 300px;
                    }

                    .hero-title {
                        font-size: 1.8rem;
                    }

                    .hero-text {
                        font-size: 0.9rem;
                    }

                    .content-section {
                        padding: 40px 0;
                    }

                    .registration-title {
                        font-size: 24px;
                    }

                    .registration-card {
                        padding: 1.5rem 1rem;
                        border-radius: 15px;
                    }

                    .input-wrapper {
                        border-radius: 10px;
                    }

                    .form-input {
                        padding: 0.75rem 0.5rem;
                        font-size: 0.9rem;
                    }

                    .submit-button {
                        padding: 0.875rem 1.5rem;
                        font-size: 1rem;
                        border-radius: 10px;
                    }
                }

                @media (max-width: 480px) {
                    .hero-title {
                        font-size: 1.5rem;
                    }

                    .registration-title {
                        font-size: 22px;
                    }

                    .input-icon {
                        width: 45px;
                        height: 45px;
                        font-size: 0.9rem;
                    }

                    .form-input {
                        font-size: 0.875rem;
                    }

                    .login-text {
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

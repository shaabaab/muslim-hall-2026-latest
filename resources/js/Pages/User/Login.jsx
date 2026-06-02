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
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log(route('login'))
        router.post(route("login"), formData, {
            onSuccess: () => setIsSubmitting(false),
            onError: (err) => {
                setErrors(err);
                console.log(err)
                setIsSubmitting(false);
            },
            preserveState: true,
        });
        console.log('hi')
    };

    return (
        <FrontAuthenticatedLayout>
            <Header />

            <div className="min-h-screen bg-gray-50 flex flex-col justify-start pt-10  sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-6 shadow-xl border border-gray-100 rounded-2xl sm:px-10">
                        {/* Header Section */}
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-extrabold text-[#1b7a3a]">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Please enter your details to sign in
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <div
                                    className={`relative flex items-center border-2 rounded-xl transition-all ${errors.email ? "border-red-500" : "border-gray-100 focus-within:border-[#1b7a3a] bg-gray-50"}`}
                                >
                                    <div className="pl-4 text-gray-400">
                                        <i className="fa-solid fa-envelope" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-900"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <Link
                                        href={route("password.request")}
                                        className="text-xs font-semibold text-[#1b7a3a] hover:text-[#2e8b57]"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div
                                    className={`relative flex items-center border-2 rounded-xl transition-all ${errors.password ? "border-red-500" : "border-gray-100 focus-within:border-[#1b7a3a] bg-gray-50"}`}
                                >
                                    <div className="pl-4 text-gray-400">
                                        <i className="fa-solid fa-lock" />
                                    </div>
                                    <input
                                        type={
                                            passwordVisible
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        placeholder="••••••••"
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-900"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPasswordVisible(!passwordVisible)
                                        }
                                        className="pr-4 text-gray-400 hover:text-gray-600"
                                    >
                                        {passwordVisible ? (
                                            <EyeTwoTone />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1b7a3a] hover:bg-[#145a2b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b7a3a] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>{" "}
                                        Signing In...
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google Button */}
                            <a
                                href="/auth/google"
                                className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                <GoogleCircleFilled className="text-xl mr-2 text-[#DB4437]" />
                                Sign in with Google
                            </a>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?
                                <Link
                                    href="/registration"
                                    className="ml-1 font-bold text-[#1b7a3a] hover:underline"
                                >
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </FrontAuthenticatedLayout>
    );
}

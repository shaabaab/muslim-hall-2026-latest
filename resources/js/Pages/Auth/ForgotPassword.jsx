import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import Footer from "../Front/Footer";
import Header from "../Front/Header";

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <FrontAuthenticatedLayout>
            <Head title="Forgot Password" />
            <Header />

            <div className="min-h-[80vh] bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-xl border border-gray-100 rounded-2xl">
                        {/* Header Section */}
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                                <i className="fa-solid fa-key text-2xl text-[#1b7a3a]"></i>
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#1b7a3a]">
                                Forgot Password?
                            </h2>
                            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                                No problem! Enter your email address and we'll
                                send you a link to reset your password.
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium rounded-r-md">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
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
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        placeholder="Enter your registered email"
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-900"
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1b7a3a] hover:bg-[#145a2b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b7a3a] transition-all disabled:opacity-50"
                            >
                                {processing ? (
                                    <span className="flex items-center">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>{" "}
                                        Sending...
                                    </span>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        {/* Back to Login */}
                        <div className="mt-8 text-center border-t border-gray-100 pt-6">
                            <Link
                                href={route("login")}
                                className="inline-flex items-center text-sm font-bold text-[#1b7a3a] hover:text-[#2e8b57] transition-colors"
                            >
                                <i className="fa-solid fa-arrow-left mr-2 text-xs"></i>
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </FrontAuthenticatedLayout>
    );
}

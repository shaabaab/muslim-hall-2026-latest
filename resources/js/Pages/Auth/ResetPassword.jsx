import FrontAuthenticatedLayout from "@/Layouts/FrontEndLayout";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { Head, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import Footer from "../Front/Footer";
import Header from "../Front/Header";

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("password.store"));
    };

    return (
        <FrontAuthenticatedLayout>
            <Head title="Reset Password" />
            <Header />

            <div className="min-h-[80vh] bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-8 shadow-xl border border-gray-100 rounded-2xl">
                        {/* Header Section */}
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                                <i className="fa-solid fa-shield-halved text-2xl text-[#1b7a3a]"></i>
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#1b7a3a]">
                                Set New Password
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Secure your account with a strong password
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Email Field (Disabled for security context) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="relative flex items-center border-2 border-gray-100 rounded-xl bg-gray-100 opacity-70">
                                    <div className="pl-4 text-gray-400">
                                        <i className="fa-solid fa-envelope" />
                                    </div>
                                    <input
                                        type="email"
                                        value={data.email}
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-600 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* New Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
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
                                        value={data.password}
                                        placeholder="••••••••"
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-900"
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        autoFocus
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

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <div
                                    className={`relative flex items-center border-2 rounded-xl transition-all ${errors.password_confirmation ? "border-red-500" : "border-gray-100 focus-within:border-[#1b7a3a] bg-gray-50"}`}
                                >
                                    <div className="pl-4 text-gray-400">
                                        <i className="fa-solid fa-lock" />
                                    </div>
                                    <input
                                        type={
                                            confirmVisible ? "text" : "password"
                                        }
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        placeholder="••••••••"
                                        className="w-full border-none bg-transparent focus:ring-0 py-3 px-4 text-gray-900"
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setConfirmVisible(!confirmVisible)
                                        }
                                        className="pr-4 text-gray-400 hover:text-gray-600"
                                    >
                                        {confirmVisible ? (
                                            <EyeTwoTone />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.password_confirmation}
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
                                        Updating...
                                    </span>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </FrontAuthenticatedLayout>
    );
}

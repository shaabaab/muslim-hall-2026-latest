// resources/js/Pages/Report/Admin/Index.jsx
import { Head, Link, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";

export default function AdminReportIndex({
    entry_reports,
    categories,
    reports,
    filters,
    highlightId,
}) {
    const { auth } = usePage().props;
    const [selectedReport, setSelectedReport] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showHidePostModal, setShowHidePostModal] = useState(false);
    const [postActionData, setPostActionData] = useState(null);
    const [activeHighlight, setActiveHighlight] = useState(null);
    const [activeTab, setActiveTab] = useState("post");

    const rowRefs = useRef({});
    const highlightApplied = useRef(false);
    console.log(
        "report",
        reports.data.map((r) => r),
    );
    useEffect(() => {
        if (!highlightId) return;

        const id = Number(highlightId);

        const timer = setTimeout(() => {
            const el = rowRefs.current[id];
            if (!el) {
                console.log("can not find this row ", id);
                return;
            }

            el.scrollIntoView({ behavior: "smooth", block: "center" });

            setActiveHighlight(id);

            setTimeout(() => {
                setActiveHighlight(null);
            }, 50000);
        }, 400);

        return () => clearTimeout(timer);
    }, [highlightId, reports.data]);

    // ✅ Permanent delete request (Backend destroy() -> forceDelete() must)
    const deleteReport = (reportId) => {
        if (
            !confirm("Are you sure you want to permanently delete this report?")
        )
            return;

        router.delete(route("admin.reports.destroy", reportId), {
            preserveScroll: true,
            onSuccess: () => {
                // optional toast
            },
            onError: () => {
                alert("Delete failed!");
            },
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                bg: "bg-yellow-100",
                text: "text-yellow-800",
                label: "Pending",
            },
            reviewed: {
                bg: "bg-blue-100",
                text: "text-blue-800",
                label: "Reviewed",
            },
            resolved: {
                bg: "bg-green-100",
                text: "text-green-800",
                label: "Resolved",
            },
        };

        const config = statusConfig[status] || {
            bg: "bg-gray-100",
            text: "text-gray-800",
            label: status,
        };

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
            >
                {config.label}
            </span>
        );
    };

    const PostStatusBadge = ({ post }) => {
        if (!post) return null;

        return post.status == 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Hidden
            </span>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Active
            </span>
        );
    };

    const updateStatus = (reportId, status) => {
        router.put(
            route("admin.reports.update-status", reportId),
            { status },
            {
                preserveScroll: true,
            },
        );
    };

    const hidePost = (postId, reason = "Reported content") => {
        router.post(
            route("admin.posts.hide", postId),
            {
                reason: reason,
                report_id: selectedReport?.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowHidePostModal(false);
                    setSelectedReport(null);
                    setPostActionData(null);
                },
            },
        );
    };

    const unhidePost = (postId) => {
        router.post(
            route("admin.posts.unhide", postId),
            {},
            { preserveScroll: true },
        );
    };

    const handleQuickAction = (report, action) => {
        setSelectedReport(report);

        if (action === "hide-post") {
            setPostActionData({
                postId: report.reportable_id,
                postTitle: report.reportable?.title || "Post",
                reason: report.reason,
            });
            setShowHidePostModal(true);
        } else if (action === "review-and-hide") {
            router.put(
                route("admin.reports.update-status", report.id),
                { status: "reviewed" },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setPostActionData({
                            postId: report.reportable_id,
                            postTitle: report.reportable?.title || "Post",
                            reason: report.reason,
                        });
                        setShowHidePostModal(true);
                    },
                },
            );
        }
    };

    // Stats calculation
    const stats = {
        total: reports.total,
        pending: reports.data.filter((r) => r.status === "pending").length,
        hidden: reports.data.filter((r) => r.reportable?.status == 0).length,
        resolved: reports.data.filter((r) => r.status === "resolved").length,
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Report Management
                    </h2>
                    <div className="mt-2 sm:mt-0">
                        <span className="text-sm text-gray-600">
                            Last updated: {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Report Management" />

            <div className="py-6">
                <div className="mx-auto  md:px-4 ">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Total Reports"
                            value={stats.total}
                            color="blue"
                            icon={
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Pending Review"
                            value={stats.pending}
                            color="yellow"
                            icon={
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Hidden Posts"
                            value={stats.hidden}
                            color="red"
                            icon={
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Resolved"
                            value={stats.resolved}
                            color="green"
                            icon={
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            }
                        />
                    </div>

                    {/* Filters Section */}
                    <div className="mb-6">
                        <FilterBar filters={filters} reports={reports} />
                    </div>

                    {/* Reports Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <ReportsTable
                            reports={reports}
                            filters={filters}
                            rowRefs={rowRefs}
                            activeHighlight={activeHighlight}
                            getStatusBadge={getStatusBadge}
                            PostStatusBadge={PostStatusBadge}
                            updateStatus={updateStatus}
                            handleQuickAction={handleQuickAction}
                            unhidePost={unhidePost}
                            deleteReport={deleteReport}
                            setSelectedReport={setSelectedReport}
                            setShowActionModal={setShowActionModal}
                        />

                        {/* Pagination */}
                        {reports.data.length > 0 && (
                            <Pagination reports={reports} />
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showActionModal && (
                <ActionModal
                    selectedReport={selectedReport}
                    setSelectedReport={setSelectedReport}
                    setShowActionModal={setShowActionModal}
                    handleQuickAction={handleQuickAction}
                    updateStatus={updateStatus}
                />
            )}

            {showHidePostModal && (
                <HidePostModal
                    postActionData={postActionData}
                    setShowHidePostModal={setShowHidePostModal}
                    setPostActionData={setPostActionData}
                    hidePost={hidePost}
                />
            )}
        </AuthenticatedLayout>
    );
}

// Stat Card Component
const StatCard = ({ title, value, color, icon }) => {
    const colors = {
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        red: "bg-red-50 border-red-200 text-red-700",
        green: "bg-green-50 border-green-200 text-green-700",
    };

    return (
        <div
            className={`${colors[color]} p-6 rounded-xl border transition-transform hover:scale-105 duration-200`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-75">{title}</p>
                    <p className="text-3xl font-bold mt-2">{value}</p>
                </div>
                <div className="opacity-75">{icon}</div>
            </div>
        </div>
    );
};

// Filter Bar Component
const FilterBar = ({ filters, reports }) => {
    const statusCounts = {
        pending: reports.data.filter((r) => r.status === "pending").length,
        reviewed: reports.data.filter((r) => r.status === "reviewed").length,
        resolved: reports.data.filter((r) => r.status === "resolved").length,
    };

    const filters_list = [
        {
            key: "pending",
            label: "Pending",
            color: "yellow",
            count: statusCounts.pending,
        },
        {
            key: "reviewed",
            label: "Reviewed",
            color: "blue",
            count: statusCounts.reviewed,
        },
        {
            key: "resolved",
            label: "Resolved",
            color: "green",
            count: statusCounts.resolved,
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {filters_list.map((filter) => (
                <button
                    key={filter.key}
                    onClick={() =>
                        router.get(route("admin.reports.index"), {
                            status: filter.key,
                        })
                    }
                    className={`
                        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                            filters.status === filter.key
                                ? `bg-${filter.color}-500 text-white shadow-md`
                                : `bg-${filter.color}-50 text-${filter.color}-700 hover:bg-${filter.color}-100 border border-${filter.color}-200`
                        }
                    `}
                >
                    {filter.label}
                    <span
                        className={`
                        ml-2 px-2 py-0.5 rounded-full text-xs
                        ${filters.status === filter.key ? "bg-white bg-opacity-20" : `bg-${filter.color}-200`}
                    `}
                    >
                        {filter.count}
                    </span>
                </button>
            ))}

            <button
                onClick={() => router.get(route("admin.reports.index"))}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-all"
            >
                Clear Filters
            </button>
        </div>
    );
};

// Reports Table Component
const ReportsTable = ({
    reports,
    rowRefs,
    activeHighlight,
    getStatusBadge,
    PostStatusBadge,
    updateStatus,
    handleQuickAction,
    unhidePost,
    deleteReport,
    setSelectedReport,
    setShowActionModal,
}) => {
    return (
        <div className="">
            <div className="w-full overflow-x-auto">
                {/* Desktop/Table View - hidden on mobile */}
                <table className="min-w-full divide-y divide-gray-200 hidden md:table">
                    <thead className="bg-gray-50">
                        <tr>
                            {[
                                "ID",
                                "Reported Content",
                                "Reason",
                                "Reported By",
                                "Status",
                                "Reported At",
                                "Actions",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className="px-3 lg:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {reports.data.map((report, index) => (
                            <tr
                                key={report.id}
                                ref={(el) => (rowRefs.current[report.id] = el)}
                                className={`
        transition-all duration-500 rounded-sm
        ${index % 2 === 0 ? "" : "bg-gray-50/50"}
        ${report.reportable?.status == 0 ? "bg-red-50/30" : ""}
        ${
            activeHighlight === report.id
                ? "bg-yellow-500/10 border-2 border-amber-400 shadow-[0_0_30px_rgba(59,130,246,0.7)]"
                : "bg-white"
        }
        hover:bg-gray-100
    `}
                            >
                                {/* ID */}
                                <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                                        #{report.id}
                                    </span>
                                </td>

                                {/* Reported Content */}
                                <td className="px-3 lg:px-4 py-3 max-w-[260px]">
                                    {report.reportable_type?.includes("Post") &&
                                    report.reportable ? (
                                        <div className="space-y-2 w-full">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    href={route(
                                                        "admin.posts.show",
                                                        report.reportable_id,
                                                    )}
                                                    className="group inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    <span>
                                                        Post #
                                                        {report.reportable_id}
                                                    </span>
                                                </Link>
                                                <PostStatusBadge
                                                    post={report.reportable}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {report.reportable.title}
                                                </p>
                                                <div className="flex flex-col gap-1 text-xs text-gray-500 break-words">
                                                    <span>
                                                        📁{" "}
                                                        {report.reportable
                                                            ?.category?.name ??
                                                            "N/A"}
                                                    </span>
                                                    <span>
                                                        👤{" "}
                                                        {report.user?.name ||
                                                            "Unknown"}
                                                    </span>
                                                    <span>
                                                        📅{" "}
                                                        {new Date(
                                                            report.reportable
                                                                .created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : report.reportable_type?.includes(
                                          "Entry",
                                      ) && report.reportable ? (
                                        <div className="space-y-2 w-full">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    href={route(
                                                        "admin.entries.show",
                                                        report.reportable_id,
                                                    )}
                                                    className="group inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800"
                                                >
                                                    <span>
                                                        Entry #
                                                        {report.reportable_id}
                                                    </span>
                                                </Link>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {report.reportable.title}
                                                </p>
                                                <div className="flex flex-col gap-1 text-xs text-gray-500 break-words">
                                                    <span>
                                                        🏆{" "}
                                                        {report.reportable
                                                            .contest?.title ||
                                                            "Contest"}
                                                    </span>
                                                    <span>
                                                        👤{" "}
                                                        {report.user?.name ||
                                                            "Unknown"}
                                                    </span>
                                                    <span>
                                                        📅{" "}
                                                        {new Date(
                                                            report.reportable
                                                                .created_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-600">
                                            #{report.reportable_id}
                                        </span>
                                    )}
                                </td>

                                {/* Reason */}
                                <td className="px-3 lg:px-4 py-3 max-w-xs">
                                    <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                                        {report.reason}
                                    </p>
                                </td>

                                {/* Reported By */}
                                <td className="px-3 lg:px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                {report.user?.name?.charAt(0) ||
                                                    "U"}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {report.user?.name ||
                                                    "Unknown User"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate hidden lg:block">
                                                {report.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                                    {getStatusBadge(report.status)}
                                </td>

                                {/* Reported At */}
                                <td className="px-3 lg:px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {new Date(
                                            report.created_at,
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>
                                    <div className="text-xs text-gray-500 hidden lg:block">
                                        {new Date(
                                            report.created_at,
                                        ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-3 lg:px-4 py-3">
                                    <ActionButtons
                                        report={report}
                                        setSelectedReport={setSelectedReport}
                                        setShowActionModal={setShowActionModal}
                                        handleQuickAction={handleQuickAction}
                                        unhidePost={unhidePost}
                                        updateStatus={updateStatus}
                                        deleteReport={deleteReport}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View - visible only on mobile */}
                <div className="md:hidden space-y-4">
                    {reports.data.map((report) => (
                        <div
                            key={report.id}
                            ref={(el) => (rowRefs.current[report.id] = el)}
                            className={`
                                 rounded-lg shadow-sm p-4 space-y-3
                                ${report.reportable?.status == 0 ? "bg-red-50/30" : ""}
                                        ${
                                            activeHighlight === report.id
                                                ? "bg-yellow-50 border-1 border-amber-400 shadow-[0_0_30px_rgba(59,130,246,0.7)]"
                                                : "bg-white"
                                        }
                            `}
                        >
                            {/* Header with ID and Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                                        #{report.id}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        Report
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(report.status)}
                                </div>
                            </div>

                            {/* Reported Content */}
                            <div className="border-t border-gray-100 pt-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    REPORTED CONTENT
                                </div>
                                {report.reportable_type?.includes("Post") &&
                                report.reportable ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={route(
                                                    "admin.posts.show",
                                                    report.reportable_id,
                                                )}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600"
                                            >
                                                <span>
                                                    Post #{report.reportable_id}
                                                </span>
                                            </Link>
                                            <PostStatusBadge
                                                post={report.reportable}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">
                                            {report.reportable.title}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                            <span>
                                                📁{" "}
                                                {report.reportable?.category
                                                    ?.name ?? "N/A"}
                                            </span>
                                            <span>
                                                👤{" "}
                                                {report.user?.name || "Unknown"}
                                            </span>
                                            <span>
                                                📅{" "}
                                                {new Date(
                                                    report.reportable
                                                        .created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : report.reportable_type?.includes("Entry") &&
                                  report.reportable ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={route(
                                                    "admin.entries.show",
                                                    report.reportable_id,
                                                )}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-purple-600"
                                            >
                                                <span>
                                                    Entry #
                                                    {report.reportable_id}
                                                </span>
                                            </Link>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">
                                            {report.reportable.title}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                            <span>
                                                🏆{" "}
                                                {report.reportable.contest
                                                    ?.title || "Contest"}
                                            </span>
                                            <span>
                                                👤{" "}
                                                {report.user?.name || "Unknown"}
                                            </span>
                                            <span>
                                                📅{" "}
                                                {new Date(
                                                    report.reportable
                                                        .created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-600">
                                        #{report.reportable_id}
                                    </span>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="border-t border-gray-100 pt-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    REASON
                                </div>
                                <p className="text-sm text-gray-700">
                                    {report.reason}
                                </p>
                            </div>

                            {/* Reporter */}
                            <div className="border-t border-gray-100 pt-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    REPORTED BY
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                        {report.user?.name?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {report.user?.name ||
                                                "Unknown User"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {report.user?.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="border-t border-gray-100 pt-2">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    REPORTED AT
                                </div>
                                <div className="text-sm text-gray-900">
                                    {new Date(
                                        report.created_at,
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                    {" at "}
                                    {new Date(
                                        report.created_at,
                                    ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-100 pt-3">
                                <ActionButtons
                                    report={report}
                                    setSelectedReport={setSelectedReport}
                                    setShowActionModal={setShowActionModal}
                                    handleQuickAction={handleQuickAction}
                                    unhidePost={unhidePost}
                                    updateStatus={updateStatus}
                                    deleteReport={deleteReport}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {reports.data.length === 0 && <EmptyState />}
        </div>
    );
};

// Action Buttons Component
const ActionButtons = ({
    report,
    setSelectedReport,
    setShowActionModal,
    handleQuickAction,
    unhidePost,
    updateStatus,
    deleteReport,
}) => {
    const Btn = ({ onClick, color, children, icon }) => (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                transition-all hover:scale-105 active:scale-95
                bg-${color}-50 text-${color}-700 hover:bg-${color}-100
                border border-${color}-200
            `}
        >
            {icon && <span className="text-sm">{icon}</span>}
            {children}
        </button>
    );

    const deleteEntry = (entryId) => {
        Swal.fire({
            title: "Delete Entry?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("admin.entries.destroyEntry", entryId), {
                    preserveScroll: true,
                    preserveState: true,

                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Deleted!",
                            text: "Entry deleted successfully.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },

                    onError: () => {
                        Swal.fire("Error", "Failed to delete entry.", "error");
                    },
                });
            }
        });
    };

    const disqualifyEntry = (entryId) => {
        Swal.fire({
            title: "Disqualify Entry?",
            text: "This will disqualify the entry from the contest.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d97706",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, disqualify!",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("admin.user.entries.disqualify", entryId),
                    {},
                    {
                        preserveScroll: true,
                        onError: () =>
                            Swal.fire(
                                "Error",
                                "Failed to disqualify entry.",
                                "error",
                            ),
                    },
                );
            }
        });
    };

    const isEntry = report.reportable_type?.includes("Entry");
    const isPost = report.reportable_type?.includes("Post");

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1">
                {/* POST: unchanged */}
                {isPost && (
                    <>
                        <Btn
                            onClick={() => {
                                setSelectedReport(report);
                                setShowActionModal(true);
                            }}
                            color="purple"
                            icon="⚡"
                        >
                            Actions
                        </Btn>
                        <Btn
                            onClick={() => deleteReport(report.id)}
                            color="red"
                            icon="🗑️"
                        >
                            Delete
                        </Btn>
                        <Link
                            href={route(
                                "admin.posts.show",
                                report.reportable_id,
                            )}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        >
                            <span className="text-sm">👁️</span>
                            View
                        </Link>
                    </>
                )}

                {/* ENTRY: new buttons */}
                {isEntry && (
                    <>
                        <Btn
                            onClick={() => deleteReport(report.id)}
                            color="red"
                            icon="🗑️"
                        >
                            Delete Report
                        </Btn>
                        <Btn
                            onClick={() => deleteEntry(report.reportable_id)}
                            color="orange"
                            icon="🏆"
                        >
                            Delete Entry
                        </Btn>
                        <button
                            onClick={() =>
                                !report.reportable?.is_disqualified &&
                                disqualifyEntry(report.reportable_id)
                            }
                            disabled={report.reportable?.is_disqualified}
                            className={`
        inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all border
        ${
            report.reportable?.is_disqualified
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 hover:scale-105 active:scale-95"
        }
    `}
                        >
                            <span className="text-sm">🚫</span>
                            {report.reportable?.is_disqualified
                                ? "Disqualified"
                                : "Disqualify"}
                        </button>
                        <Link
                            href={route(
                                "admin.entries.show",
                                report.reportable_id,
                            )}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        >
                            <span className="text-sm">👁️</span>
                            View
                        </Link>
                    </>
                )}
            </div>

            {/* POST hide/unhide: unchanged */}
            {isPost && report.reportable && (
                <div className="flex flex-wrap gap-1">
                    {report.reportable.status == 1 ? (
                        <Btn
                            onClick={() =>
                                handleQuickAction(report, "hide-post")
                            }
                            color="red"
                            icon="🔒"
                        >
                            Hide
                        </Btn>
                    ) : (
                        <Btn
                            onClick={() => unhidePost(report.reportable_id)}
                            color="green"
                            icon="🔓"
                        >
                            Unhide
                        </Btn>
                    )}
                    {/* Status update: unchanged */}
                    <div className="flex flex-wrap gap-1">
                        {report.status === "pending" && (
                            <Btn
                                onClick={() =>
                                    updateStatus(report.id, "reviewed")
                                }
                                color="blue"
                                icon="✓"
                            >
                                Review
                            </Btn>
                        )}
                        {report.status === "reviewed" && (
                            <Btn
                                onClick={() =>
                                    updateStatus(report.id, "resolved")
                                }
                                color="green"
                                icon="✓✓"
                            >
                                Resolve
                            </Btn>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Empty State Component
const EmptyState = () => (
    <div className="text-center py-12">
        <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
            />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reports found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new report or clear your filters.
        </p>
    </div>
);

// Pagination Component
const Pagination = ({ reports }) => (
    <div className="border-t border-gray-200 px-2 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{reports.from}</span> to{" "}
                <span className="font-medium">{reports.to}</span> of{" "}
                <span className="font-medium">{reports.total}</span> reports
            </div>

            <div className="flex gap-2">
                {reports.links.map((link, index) => (
                    <button
                        key={index}
                        onClick={() => link.url && router.get(link.url)}
                        disabled={!link.url}
                        className={`
                            min-w-[36px] px-3 py-2 text-sm font-medium rounded-lg transition-all
                            ${
                                link.active
                                    ? "bg-blue-500 text-white shadow-md"
                                    : link.url
                                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                                      : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                            }
                        `}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Action Modal Component
const ActionModal = ({
    selectedReport,
    setSelectedReport,
    setShowActionModal,
    handleQuickAction,
    updateStatus,
}) => {
    if (!selectedReport) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Take Action on Report #{selectedReport.id}
                        </h3>
                        <button
                            onClick={() => {
                                setSelectedReport(null);
                                setShowActionModal(false);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-3">
                        <ActionOption
                            title="Hide Post"
                            description="Make post invisible to users"
                            color="red"
                            icon="🔒"
                            onClick={() =>
                                handleQuickAction(selectedReport, "hide-post")
                            }
                        />

                        <ActionOption
                            title="Review & Hide"
                            description="Mark as reviewed and hide post"
                            color="yellow"
                            icon="✓🔒"
                            onClick={() =>
                                handleQuickAction(
                                    selectedReport,
                                    "review-and-hide",
                                )
                            }
                        />

                        <ActionOption
                            title="Resolve Report"
                            description="Keep post active, mark report as resolved"
                            color="green"
                            icon="✓✓"
                            onClick={() =>
                                updateStatus(selectedReport.id, "resolved")
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActionOption = ({ title, description, color, icon, onClick }) => (
    <button
        onClick={onClick}
        className={`
            w-full text-left p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]
            bg-${color}-50 hover:bg-${color}-100 border border-${color}-200
            group
        `}
    >
        <div className="flex items-center justify-between">
            <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    {title}
                </div>
                <div className="text-sm text-gray-600 mt-1">{description}</div>
            </div>
            <span
                className={`text-${color}-500 group-hover:translate-x-1 transition-transform`}
            >
                →
            </span>
        </div>
    </button>
);

const HidePostModal = ({
    postActionData,
    setShowHidePostModal,
    setPostActionData,
    hidePost,
}) => {
    if (!postActionData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Hide Post: {postActionData.postTitle}
                    </h3>

                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-sm text-yellow-800">
                            <span className="font-medium">Report Reason:</span>{" "}
                            {postActionData.reason}
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            id="adminNote"
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="Add any additional notes..."
                            defaultValue={`Reported content: ${postActionData.reason}`}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setShowHidePostModal(false);
                                setPostActionData(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={() => {
                                const adminNote =
                                    document.getElementById("adminNote")
                                        ?.value || postActionData.reason;
                                hidePost(postActionData.postId, adminNote);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                        >
                            Confirm & Hide Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

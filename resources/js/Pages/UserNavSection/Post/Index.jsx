import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    AudioOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FilterOutlined,
    InboxOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    SyncOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography,
    notification as antNotification,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useBackgroundUpload } from "@/Contexts/BackgroundUploadContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

export default function Index({ posts, categories, filters, auth }) {
    const { uploads } = useBackgroundUpload();
    const [searchText, setSearchText] = useState(filters.search || "");

    // Get progress info for a specific post from the background upload context
    const getUploadInfo = (postId) => {
        const activeUploads = uploads.filter(u => u.postId === postId && u.status === 'uploading');
        if (activeUploads.length === 0) return null;
        // Average progress across all files for this post
        const totalProgress = activeUploads.reduce((sum, u) => sum + (u.progress || 0), 0);
        const avgProgress = Math.round(totalProgress / activeUploads.length);
        const isServerProcessing = activeUploads.some(u => u.phase === 'processing');
        return { progress: avgProgress, isServerProcessing };
    };
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [loadingIds, setLoadingIds] = useState({});
    const [localPosts, setLocalPosts] = useState(posts.data);
    const [isSearching, setIsSearching] = useState(false);

    // Sync localPosts with incoming props when filters change
    useEffect(() => {
        setLocalPosts(posts.data);
        setIsSearching(false);
    }, [posts.data]);

    // Poll every 30s for completed file-processing notifications
    useEffect(() => {
        // Only poll if there are any processing posts currently visible
        const hasProcessing = posts.data.some(
            (p) =>
                p.audio === 'processing' ||
                p.videos?.some((v) => v.video === 'processing') ||
                p.pdfs?.some((pf) => pf.pdf === 'processing') ||
                p.audios?.some((a) => a.audio === 'processing'),
        );
        if (!hasProcessing) return;

        const poll = async () => {
            try {
                const res = await fetch('/poll-processing-done', {
                    credentials: 'same-origin',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach((n) => {
                        antNotification.success({
                            message: 'Upload Complete ✅',
                            description: n.message,
                            placement: 'topRight',
                            duration: 8,
                        });
                    });
                    // Refresh the table so the processing badge disappears
                    router.reload({ only: ['posts'] });
                }
            } catch (_) {}
        };

        const timer = setInterval(poll, 30000);
        return () => clearInterval(timer);
    }, [posts.data]);

    const handleSearch = (value) => {
        setIsSearching(true);
        router.get(
            route("user.posts.index"),
            { ...filters, search: value, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            },
        );
    };

    const handleFilter = (key, value) => {
        setIsSearching(true);
        router.get(
            route("user.posts.index"),
            { ...filters, [key]: value, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            },
        );
    };

    const handleReset = () => {
        setIsSearching(true);
        router.get(
            route("user.posts.index"),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setSearchText("");
                    setShowMobileFilters(false);
                    setIsSearching(false);
                },
            },
        );
    };

    // Handle toggle status change
    const handleStatusChange = (postId, checked) => {
        setLoadingIds((prev) => ({ ...prev, [postId]: true }));

        setLocalPosts((prev) =>
            prev.map((post) =>
                post.id === postId
                    ? { ...post, status: checked ? 1 : 0 }
                    : post,
            ),
        );

        router.post(
            route("user.posts.update-status", postId),
            {
                _method: "PUT",
                status: checked ? 1 : 0,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        `Post ${checked ? "published" : "drafted"} successfully`,
                    );
                },
                onError: (errors) => {
                    message.error("Failed to update post status");
                    setLocalPosts(posts.data);
                },
                onFinish: () => {
                    setLoadingIds((prev) => ({ ...prev, [postId]: false }));
                },
            },
        );
    };

    // Function to truncate title
    const truncateTitle = (title, limit = 40) => {
        if (title.length <= limit) return title;
        return title.substring(0, limit) + "...";
    };

    const showDeleteConfirm = (id) => {
        confirm({
            title: "Delete this post?",
            icon: <ExclamationCircleOutlined />,
            content: "This action cannot be undone.",
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            centered: true,
            onOk() {
                handleDelete(id);
            },
        });
    };

    const handleDelete = (id) => {
        router.delete(route("user.posts.destroy", id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                message.success("Post deleted successfully");
                setLocalPosts((prev) => prev.filter((post) => post.id !== id));
            },
            onError: () => {
                message.error("Failed to delete post");
            },
        });
    };

    // Helper function to get media type
    const getMediaType = (record) => {
        if (record.pdf) return "pdf";
        if (record.video || record.video_url) return "video";
        if (record.audio) return "audio";
        if (record.content) return "content";
        return "none";
    };

    // Desktop columns - FIXED with multiline title
    const columns = [
        {
            title: "POST CONTENT",
            key: "post_content",
            responsive: ["xs", "sm", "md", "lg", "xl"],
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        shape="square"
                        size={{ xs: 40, sm: 48, md: 54 }}
                        src={getS3PublicUrl(
                            `${record.thumbnail ?? record?.image}`,
                        )}
                        icon={<FileImageOutlined />}
                        className="rounded-lg shadow-sm border flex-shrink-0"
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {/* FIXED: Multiline title with Tailwind */}
                        <Text
                            strong
                            className="text-xs sm:text-sm leading-tight block line-clamp-2 max-w-[160px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[320px] xl:max-w-[420px]"
                            title={record.title}
                        >
                            {record.title}
                        </Text>
                        <Space size={4} wrap className="flex-wrap">
                            <Tag
                                color="geekblue"
                                className="rounded border-none text-[10px] px-2 capitalize m-0"
                            >
                                {record.category?.name || "Uncategorized"}
                            </Tag>
                            {/* Processing badge — visible when any media is still uploading */}
                                {(() => {
                                    const isProcessing = record.audio === 'processing' ||
                                        record.videos?.some(v => v.video === 'processing') ||
                                        record.pdfs?.some(p => p.pdf === 'processing') ||
                                        record.audios?.some(a => a.audio === 'processing');
                                    
                                    if (!isProcessing) return null;
                                    const info = getUploadInfo(record.id);

                                    return (
                                        <Tag
                                            icon={<SyncOutlined spin />}
                                            color="processing"
                                            className="rounded border-none text-[10px] px-2 m-0"
                                        >
                                            {info ? `${info.isServerProcessing ? 'Processing' : 'Uploading'} ${info.progress}%` : 'Processing'}
                                        </Tag>
                                    );
                                })()}
                            {getMediaType(record) !== "none" && (
                                <Tag
                                    color="gold"
                                    className="rounded border-none text-[10px] px-2 m-0 flex items-center"
                                >
                                    {getMediaType(record) === "video" && (
                                        <VideoCameraOutlined className="mr-1 text-xs" />
                                    )}
                                    {getMediaType(record) === "pdf" && (
                                        <FilePdfOutlined className="mr-1 text-xs" />
                                    )}
                                    {getMediaType(record) === "audio" && (
                                        <AudioOutlined className="mr-1 text-xs" />
                                    )}
                                    <span className="capitalize text-xs">
                                        {getMediaType(record)}
                                    </span>
                                </Tag>
                            )}
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            title: "METRICS",
            key: "metrics",
            responsive: ["lg", "xl"],
            render: (_, record) => (
                <div className="flex flex-col">
                    <Text className="text-xs">
                        <EyeOutlined className="mr-1" />{" "}
                        {record.viewer_count || 0}
                    </Text>
                    <Text type="secondary" className="text-[10px]">
                        Total Views
                    </Text>
                </div>
            ),
        },
        {
            title: "DATE & STATUS",
            key: "status",
            responsive: ["md", "lg", "xl"],
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    <Badge
                        status={record.status == 1 ? "success" : "default"}
                        text={
                            <span
                                className={`text-[10px] md:text-[11px] font-bold ${record.status == 1 ? "text-green-600" : "text-gray-400"}`}
                            >
                                {record.status == 1 ? "PUBLISHED" : "DRAFT"}
                            </span>
                        }
                    />
                    <Badge
                        status={
                            record.permission == "approved"
                                ? "success"
                                : "default"
                        }
                        text={
                            <span
                                className={`text-[10px] md:text-[11px] font-bold ${record.permission == "approved" ? "text-green-600" : "text-orange-400"}`}
                            >
                                {record.permission == "approved"
                                    ? "APPROVED"
                                    : "PENDING"}
                            </span>
                        }
                    />
                    <Text type="secondary" className="text-[10px]">
                        {dayjs(record.created_at).format("MMM DD, YYYY")}
                    </Text>
                </div>
            ),
        },
        {
            title: "ACTIONS",
            key: "actions",
            responsive: ["md", "lg", "xl"],
            align: "right",
            render: (_, record) => {
                const isProcessing =
                    record.audio === 'processing' ||
                    record.videos?.some(v => v.video === 'processing') ||
                    record.pdfs?.some(p => p.pdf === 'processing') ||
                    record.audios?.some(a => a.audio === 'processing');

                return (
                <Space size="small">
                    <Tooltip
                        title={
                            record.status == 1
                                ? "Published - Click to draft"
                                : "Draft - Click to publish"
                        }
                    >
                        <Switch
                            checked={record.status == 1}
                            onChange={(checked) =>
                                handleStatusChange(record.id, checked)
                            }
                            loading={loadingIds[record.id]}
                            size="small"
                            className="scale-90"
                        />
                    </Tooltip>

                    <Tooltip title={isProcessing ? "Media is still being processed…" : "Preview"}>
                        <Button
                            type="text"
                            size="small"
                            disabled={isProcessing}
                            icon={
                                <EyeOutlined className={isProcessing ? "text-gray-300 text-xs md:text-sm" : "text-gray-500 text-xs md:text-sm"} />
                            }
                            onClick={() =>
                                !isProcessing && window.open(
                                    route("user.posts.show", record.id),
                                    "_blank",
                                )
                            }
                            className="p-1 md:p-2"
                        />
                    </Tooltip>

                    <Tooltip title="Edit">
                        <Link href={route("user.posts.edit", record.id)}>
                            <Button
                                type="text"
                                size="small"
                                icon={
                                    <EditOutlined className="text-blue-500 text-xs md:text-sm" />
                                }
                                className="p-1 md:p-2"
                            />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={
                                <DeleteOutlined className="text-xs md:text-sm" />
                            }
                            onClick={() => showDeleteConfirm(record.id)}
                            className="p-1 md:p-2"
                        />
                    </Tooltip>
                </Space>
                );
            },
        },
    ];

    // Mobile columns - FIXED with multiline title and better layout
    const mobileColumns = [
        {
            key: "post_content",
            render: (_, record) => (
                <div className="flex flex-col gap-3">
                    {/* Main content row */}
                    <div className="flex items-start gap-3">
                        <Avatar
                            shape="square"
                            size={56}
                            src={getS3PublicUrl(
                                `${record.thumbnail ?? record?.image}`,
                            )}
                            icon={<FileImageOutlined />}
                            className="rounded-lg shadow-sm border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            {/* FIXED: Mobile multiline title */}
                            <Text
                                strong
                                className="text-sm block mb-1 leading-tight"
                                title={record.title}
                            >
                                {truncateTitle(record.title, 35)}
                            </Text>

                            {/* Tags row */}
                            <Space size={4} wrap className="flex-wrap mb-1">
                                <Tag
                                    color="geekblue"
                                    className="rounded border-none text-[10px] px-2 capitalize m-0"
                                >
                                    {record.category?.name || "Uncategorized"}
                                </Tag>
                                {(() => {
                                    const isProcessing = record.audio === 'processing' ||
                                        record.videos?.some(v => v.video === 'processing') ||
                                        record.pdfs?.some(p => p.pdf === 'processing') ||
                                        record.audios?.some(a => a.audio === 'processing');
                                    
                                    if (!isProcessing) return null;
                                    const info = getUploadInfo(record.id);

                                    return (
                                        <Tag
                                            icon={<SyncOutlined spin />}
                                            color="processing"
                                            className="rounded border-none text-[10px] px-2 m-0"
                                        >
                                            {info ? `${info.isServerProcessing ? 'Processing' : 'Uploading'} ${info.progress}%` : 'Processing'}
                                        </Tag>
                                    );
                                })()}
                                {getMediaType(record) !== "none" && (
                                    <Tag
                                        color="gold"
                                        className="rounded border-none text-[10px] px-2 m-0 flex items-center"
                                    >
                                        {getMediaType(record) === "video" && (
                                            <VideoCameraOutlined className="mr-1 text-[10px]" />
                                        )}
                                        {getMediaType(record) === "pdf" && (
                                            <FilePdfOutlined className="mr-1 text-[10px]" />
                                        )}
                                        {getMediaType(record) === "audio" && (
                                            <AudioOutlined className="mr-1 text-[10px]" />
                                        )}
                                        <span className="capitalize text-[10px]">
                                            {getMediaType(record)}
                                        </span>
                                    </Tag>
                                )}
                            </Space>

                            {/* Status and views row */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={record.status == 1}
                                            onChange={(checked) =>
                                                handleStatusChange(
                                                    record.id,
                                                    checked,
                                                )
                                            }
                                            loading={loadingIds[record.id]}
                                            size="small"
                                        />
                                        <span
                                            className={`text-[10px] font-bold ${record.status == 1 ? "text-green-600" : "text-gray-400"}`}
                                        >
                                            {record.status == 1
                                                ? "PUBLISHED"
                                                : "DRAFT"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <EyeOutlined className="text-xs" />
                                        <span className="text-xs">
                                            {record.viewer_count || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-[10px] font-bold ${
                                            record.permission === "approved"
                                                ? "text-green-600"
                                                : record.permission ===
                                                    "pending"
                                                  ? "text-orange-400"
                                                  : "text-red-500"
                                        }`}
                                    >
                                        {record.permission === "approved"
                                            ? "APPROVED"
                                            : record.permission === "pending"
                                              ? "PENDING"
                                              : "REJECTED"}
                                    </span>
                                    <Text
                                        type="secondary"
                                        className="text-[9px]"
                                    >
                                        {dayjs(record.created_at).format(
                                            "MMM DD, YYYY",
                                        )}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Tooltip title="Preview">
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() =>
                                    window.open(
                                        route("user.posts.show", record.id),
                                        "_blank",
                                    )
                                }
                                className="flex-1 flex items-center justify-center"
                            >
                                <span className="ml-1 text-xs">Preview</span>
                            </Button>
                        </Tooltip>

                        <Tooltip title="Edit">
                            <Link
                                href={route("user.posts.edit", record.id)}
                                className="flex-1"
                            >
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    className="w-full flex items-center justify-center"
                                >
                                    <span className="ml-1 text-xs">Edit</span>
                                </Button>
                            </Link>
                        </Tooltip>

                        <Tooltip title="Delete">
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => showDeleteConfirm(record.id)}
                                className="flex-1 flex items-center justify-center"
                            >
                                <span className="ml-1 text-xs">Delete</span>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
    ];

    // Use localPosts for table data
    const tableData = localPosts.map((p) => ({ ...p, key: p.id }));

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Create Post">
            <div className="p-2 sm:p-2 max-w-[1400px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 bg-white p-4 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-full sm:w-auto">
                        <Title
                            level={4}
                            className="!mb-1 font-bold text-lg sm:text-xl"
                        >
                            My Posts
                        </Title>
                        <Text type="secondary" className="text-xs sm:text-sm">
                            Create, edit, and manage your articles.
                        </Text>
                    </div>
                    <div className="w-full sm:w-auto flex gap-2">
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() =>
                                setShowMobileFilters(!showMobileFilters)
                            }
                            className="sm:hidden flex-1"
                            size="large"
                        >
                            Filters
                        </Button>
                        <Link
                            href={route("user.posts.create")}
                            className="flex-1 sm:flex-none"
                        >
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                className="rounded-lg h-11 px-4 sm:px-6 font-semibold shadow-md border-none bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">
                                    Create New Post
                                </span>
                                <span className="sm:hidden">New Post</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Filters Panel */}
                {showMobileFilters && (
                    <div className="sm:hidden mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-slideDown">
                        <div className="flex justify-between items-center mb-3">
                            <Text strong className="text-sm">
                                Filter Posts
                            </Text>
                            <Button
                                type="text"
                                size="small"
                                onClick={() => setShowMobileFilters(false)}
                                icon={<FilterOutlined />}
                            />
                        </div>
                        <div className="space-y-4">
                            <Input
                                placeholder="Search posts..."
                                prefix={
                                    <SearchOutlined className="text-gray-300" />
                                }
                                size="large"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={() => {
                                    handleSearch(searchText);
                                    setShowMobileFilters(false);
                                }}
                                allowClear
                                onClear={() => {
                                    setSearchText("");
                                    handleSearch("");
                                    setShowMobileFilters(false);
                                }}
                                className="rounded-lg"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    placeholder="Category"
                                    size="large"
                                    onChange={(val) => {
                                        handleFilter("category_id", val);
                                        setShowMobileFilters(false);
                                    }}
                                    allowClear
                                    onClear={() => {
                                        handleFilter("category_id", "");
                                        setShowMobileFilters(false);
                                    }}
                                    className="w-full"
                                >
                                    {categories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    placeholder="Status"
                                    size="large"
                                    value={filters.status || undefined}
                                    onChange={(val) => {
                                        handleFilter("status", val);
                                        setShowMobileFilters(false);
                                    }}
                                    allowClear
                                    onClear={() => {
                                        handleFilter("status", "");
                                        setShowMobileFilters(false);
                                    }}
                                    className="w-full"
                                >
                                    <Option value="1">Published</Option>
                                    <Option value="0">Draft</Option>
                                    <Option value="processing">⏳ Processing</Option>
                                </Select>
                            </div>

                            <Button
                                block
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                size="large"
                                className="rounded-lg"
                                loading={isSearching}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                )}

                {/* Desktop Filters */}
                <div className="hidden sm:block mb-6">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={24} lg={12} xl={8}>
                            <Input
                                placeholder="Search by title..."
                                prefix={
                                    <SearchOutlined className="text-gray-300" />
                                }
                                size="large"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={() => handleSearch(searchText)}
                                allowClear
                                onClear={() => {
                                    setSearchText("");
                                    handleSearch("");
                                }}
                                className="rounded-lg shadow-sm w-full"
                            />
                        </Col>
                        <Col xs={12} sm={12} md={4} lg={2} xl={2}>
                            <Button
                                block
                                icon={<SearchOutlined />}
                                onClick={() => handleSearch(searchText)}
                                size="large"
                                className="rounded-lg hover:bg-gray-50 border-gray-200"
                                loading={isSearching}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6} xl={5}>
                            <Select
                                placeholder="All Categories"
                                className="w-full"
                                size="large"
                                onChange={(val) =>
                                    handleFilter("category_id", val)
                                }
                                allowClear
                                onClear={() => handleFilter("category_id", "")}
                            >
                                {categories.map((c) => (
                                    <Option key={c.id} value={c.id}>
                                        {c.name}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6} xl={5}>
                            <Select
                                placeholder="All Status"
                                className="w-full"
                                size="large"
                                value={filters.status || undefined}
                                onChange={(val) => handleFilter("status", val)}
                                allowClear
                                onClear={() => handleFilter("status", "")}
                            >
                                <Option value="1">Published</Option>
                                <Option value="0">Draft</Option>
                                <Option value="processing">⏳ Processing</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={12} md={4} lg={3} xl={3}>
                            <Button
                                block
                                icon={<ReloadOutlined />}
                                onClick={handleReset}
                                size="large"
                                className="rounded-lg hover:bg-gray-50 border-gray-200"
                                loading={isSearching}
                            >
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Table Section */}
                <Card
                    className="rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                    bodyStyle={{ padding: 0 }}
                >
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            loading={isSearching}
                            pagination={{
                                current: posts.current_page,
                                pageSize: posts.per_page,
                                total: posts.total,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} posts`,
                                responsive: true,
                                className: "px-4 sm:px-6 py-4 border-t",
                                size: "default",
                                showLessItems: true,
                            }}
                            onChange={(pagination) => {
                                setIsSearching(true);
                                router.get(
                                    route("user.posts.index"),
                                    { ...filters, page: pagination.current },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onFinish: () => setIsSearching(false),
                                    },
                                );
                            }}
                            locale={{
                                emptyText: (
                                    <div className="py-8 sm:py-12 text-center">
                                        <InboxOutlined className="text-4xl sm:text-5xl text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm sm:text-base mb-4">
                                            {isSearching
                                                ? "Loading..."
                                                : "No posts found"}
                                        </p>
                                        {!isSearching && (
                                            <Link
                                                href={route(
                                                    "user.posts.create",
                                                )}
                                            >
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    className="rounded-lg"
                                                >
                                                    Create Your First Post
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ),
                            }}
                            className="custom-post-table"
                            scroll={{ x: "max-content" }}
                        />
                    </div>

                    {/* Mobile Table */}
                    <div className="sm:hidden">
                        <Table
                            columns={mobileColumns}
                            dataSource={tableData}
                            loading={isSearching}
                            pagination={{
                                current: posts.current_page,
                                pageSize: posts.per_page,
                                total: posts.total,
                                showSizeChanger: false,
                                simple: true,
                                showTotal: (total) => `${total} posts`,
                                className: "px-4 py-4 border-t",
                                size: "small",
                            }}
                            onChange={(pagination) => {
                                setIsSearching(true);
                                router.get(
                                    route("user.posts.index"),
                                    { ...filters, page: pagination.current },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onFinish: () => setIsSearching(false),
                                    },
                                );
                            }}
                            locale={{
                                emptyText: (
                                    <div className="py-8 text-center">
                                        <InboxOutlined className="text-4xl text-gray-200 mb-3" />
                                        <p className="text-gray-400 mb-4">
                                            {isSearching
                                                ? "Loading..."
                                                : "No posts found"}
                                        </p>
                                        {!isSearching && (
                                            <Link
                                                href={route(
                                                    "user.posts.create",
                                                )}
                                            >
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    className="rounded-lg"
                                                >
                                                    Create First Post
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ),
                            }}
                            className="custom-mobile-post-table"
                            showHeader={false}
                            size="middle"
                        />
                    </div>
                </Card>
            </div>

            <style jsx>{`
                :global(.custom-post-table .ant-table-thead > tr > th) {
                    background: #fafafa !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #8c8c8c !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 12px 16px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                :global(.custom-post-table .ant-table-tbody > tr > td) {
                    padding: 12px 16px !important;
                }
                :global(.custom-post-table .ant-table-row:hover > td) {
                    background-color: #f9fbff !important;
                }
                :global(.ant-select-selector) {
                    border-radius: 8px !important;
                }

                /* Mobile table styles */
                :global(.custom-mobile-post-table .ant-table-tbody > tr > td) {
                    padding: 0 !important;
                }

                /* Animation for mobile filters */
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                :global(.animate-slideDown) {
                    animation: slideDown 0.2s ease-out;
                }

                /* Responsive adjustments */
                @media (max-width: 640px) {
                    :global(.ant-pagination) {
                        display: flex !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                        gap: 4px !important;
                    }
                    :global(.ant-pagination .ant-pagination-item),
                    :global(.ant-pagination .ant-pagination-prev),
                    :global(.ant-pagination .ant-pagination-next) {
                        min-width: 32px !important;
                        height: 32px !important;
                        line-height: 32px !important;
                        font-size: 12px !important;
                    }

                    :global(.ant-modal) {
                        max-width: calc(100vw - 32px) !important;
                        margin: 16px auto !important;
                    }
                }

                @media (max-width: 768px) {
                    :global(.ant-table) {
                        font-size: 13px !important;
                    }
                }

                /* Button hover effects */
                :global(.ant-btn-text:hover) {
                    background-color: #f5f5f5 !important;
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}

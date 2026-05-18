import Authenticated from "@/Layouts/AuthenticatedLayout";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    AudioOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FilterOutlined,
    InboxOutlined,
    MoreOutlined,
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
    Dropdown,
    Input,
    Menu,
    message,
    Popconfirm,
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
import { useEffect, useState } from "react";
import { useBackgroundUpload } from "@/Contexts/BackgroundUploadContext";
const { Title, Text } = Typography;
const { Option } = Select;

export default function Index({ posts, categories, filters, auth }) {
    const { uploads } = useBackgroundUpload();
    const [searchText, setSearchText] = useState(filters.search || "");

    const getUploadProgress = (postId) => {
        const activeUploads = uploads.filter(u => u.postId === postId && u.status === 'uploading');
        if (activeUploads.length === 0) return null;
        const totalProgress = activeUploads.reduce((sum, u) => sum + (u.progress || 0), 0);
        return Math.round(totalProgress / activeUploads.length);
    };
    const [loadingIds, setLoadingIds] = useState({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [localPosts, setLocalPosts] = useState(posts.data);

    // Poll every 30s for completed file-processing notifications
    useEffect(() => {
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
                    router.reload({ only: ['posts'] });
                }
            } catch (_) {}
        };

        const timer = setInterval(poll, 30000);
        return () => clearInterval(timer);
    }, [posts.data]);

    // Handle toggle status change - FIXED VERSION
    const handleStatusChange = (postId, checked) => {
        setLoadingIds((prev) => ({ ...prev, [postId]: true }));

        setLocalPosts((prev) =>
            prev.map((post) =>
                post.id === postId
                    ? { ...post, status: checked ? 1 : 0 }
                    : post,
            ),
        );

        // Send request to backend
        router.post(
            route("admin.posts.update-status", postId),
            {
                _method: "PUT",
                status: checked ? 1 : 0,
            },
            {
                preserveScroll: true,
                preserveState: false,
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

    const handleSearch = (value) => {
        router.get(
            route("admin.posts.index"),
            { ...filters, search: value, page: 1 },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("admin.posts.index"),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true },
        );
    };

    const handleDelete = (id) => {
        router.delete(route("admin.posts.destroy", id), {
            onSuccess: () => message.success("Post deleted successfully"),
        });
    };

    const handleApproved = (id) => {
        router.post(route("admin.posts.approved", id), {
            onSuccess: () => message.success("Post approved successfully"),
        });
    };

    const handleRejected = (id) => {
        router.post(route("admin.posts.rejected", id), {
            onSuccess: () => message.success("Post rejected successfully"),
        });
    };

    // Function to truncate title
    const truncateTitle = (title, limit = 40) => {
        if (title.length <= limit) return title;
        return title.substring(0, limit) + "...";
    };

    const columns = [
        {
            title: "POST CONTENT",
            key: "post_content",
            responsive: ["xs", "sm", "md", "lg", "xl"],
            render: (_, record) => (
                <div className="flex items-center gap-3 sm:gap-4">
                    <Avatar
                        shape="square"
                        size={{ xs: 40, sm: 48, md: 54 }}
                        src={getS3PublicUrl(record.thumbnail ?? record.image)}
                        alt="Thumbnail"
                        icon={<FileImageOutlined />}
                        className="rounded-lg shadow-sm border flex-shrink-0"
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <Text
                            strong
                            className="text-xs sm:text-sm leading-tight block line-clamp-2 max-w-[160px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[320px] xl:max-w-[420px]"
                            title={record.title} // Show full title on hover
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
                            {/* Processing badge */}
                            {(() => {
                                const isProcessing = record.audio === 'processing' ||
                                    record.videos?.some(v => v.video === 'processing') ||
                                    record.pdfs?.some(p => p.pdf === 'processing') ||
                                    record.audios?.some(a => a.audio === 'processing');
                                
                                if (!isProcessing) return null;
                                const progress = getUploadProgress(record.id);

                                return (
                                    <Tag
                                        icon={<SyncOutlined spin />}
                                        color="processing"
                                        className="rounded border-none text-[10px] px-2 m-0"
                                    >
                                        Processing {progress !== null ? `${progress}%` : ''}
                                    </Tag>
                                );
                            })()}
                            {record.media_type !== "none" && (
                                <Tag
                                    color="gold"
                                    className="rounded border-none text-[10px] px-2 m-0 flex items-center"
                                >
                                    {record.media_type == "video" && (
                                        <VideoCameraOutlined className="mr-1" />
                                    )}
                                    {record.media_type == "pdf" && (
                                        <FilePdfOutlined className="mr-1" />
                                    )}
                                    {record.media_type == "audio" && (
                                        <AudioOutlined className="mr-1" />
                                    )}
                                    <span className="capitalize text-xs">
                                        {record.media_type}
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
            responsive: ["md", "lg", "xl"],
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
            responsive: ["sm", "md", "lg", "xl"],
            render: (_, record) => (
                <div className="flex flex-col gap-1 ">
                    <Badge
                        status={record.status == 1 ? "success" : "default"}
                        text={
                            <span
                                className={`text-[11px] font-bold ${record.status == 1 ? "text-green-600" : "text-gray-400"}`}
                            >
                                {record.status == 1 ? "Published" : "Draft"}
                            </span>
                        }
                    />
                    <Badge
                        status={
                            record.permission === "approved"
                                ? "success"
                                : record.permission === "pending"
                                  ? "warning"
                                  : "error"
                        }
                        text={
                            <span
                                className={`text-[11px] font-bold ${
                                    record.permission === "approved"
                                        ? "text-green-600"
                                        : record.permission === "pending"
                                          ? "text-orange-400"
                                          : "text-red-500"
                                }`}
                            >
                                {record.permission === "approved"
                                    ? "Approved"
                                    : record.permission === "pending"
                                      ? "Pending"
                                      : "Rejected"}
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
            align: "right",
            responsive: ["xs", "sm", "md", "lg", "xl"],
            render: (_, record) => {
                // Disable preview if any media is still processing in DB
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
                                <EyeOutlined className={isProcessing ? "text-gray-300 text-xs" : "text-gray-500 text-xs"} />
                            }
                            onClick={() =>
                                !isProcessing && window.open(
                                    route("admin.posts.show", record.id),
                                    "_blank",
                                )
                            }
                            className="p-1"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Link href={route("admin.posts.edit", record.id)}>
                            <Button
                                type="text"
                                size="small"
                                icon={
                                    <EditOutlined className="text-blue-500 text-xs" />
                                }
                                className="p-1"
                            />
                        </Link>
                    </Tooltip>
                    <Dropdown
                        overlay={
                            <Menu
                                items={[
                                    {
                                        key: "delete",
                                        danger: true,
                                        icon: <DeleteOutlined />,
                                        label: (
                                            <Popconfirm
                                                title="Delete Permanently"
                                                description="Are you sure to delete this post?"
                                                onConfirm={() =>
                                                    handleDelete(record.id)
                                                }
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <span>Delete Permanently</span>
                                            </Popconfirm>
                                        ),
                                    },
                                    {
                                        key: "approve",
                                        label: "Approved",
                                        icon: <CheckOutlined />,
                                        onClick: () =>
                                            handleApproved(record.id),
                                    },
                                    {
                                        key: "rejected",
                                        label: "Rejected",
                                        icon: <CloseOutlined />,
                                        onClick: () =>
                                            handleRejected(record.id),
                                    },
                                ]}
                            />
                        }
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined className="text-xs" />}
                            className="p-1"
                        />
                    </Dropdown>
                </Space>
                );
            },
        },
    ];

    // Enhanced Mobile view columns with better UX
    const mobileColumns = [
        {
            title: "POST",
            key: "post_content",
            render: (_, record) => (
                <div className="flex flex-col gap-3">
                    {/* Main post content with thumbnail */}
                    <div className="flex items-start gap-3">
                        <Avatar
                            shape="square"
                            size={56}
                            src={getS3PublicUrl(
                                record.thumbnail ?? record.image,
                            )}
                            alt="Thumbnail"
                            icon={<FileImageOutlined />}
                            className="rounded-lg shadow-sm border flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <Text
                                strong
                                className="text-sm block mb-1 leading-tight"
                                title={record.title}
                            >
                                {truncateTitle(record.title, 35)}
                            </Text>
                            <Space size={4} wrap className="flex-wrap mb-1">
                                <Tag
                                    color="geekblue"
                                    className="rounded border-none text-[9px] px-1.5 py-0.5 m-0"
                                >
                                    {record.category?.name || "Uncategorized"}
                                </Tag>
                                {(() => {
                                    const isProcessing = record.audio === 'processing' ||
                                        record.videos?.some(v => v.video === 'processing') ||
                                        record.pdfs?.some(p => p.pdf === 'processing') ||
                                        record.audios?.some(a => a.audio === 'processing');
                                    
                                    if (!isProcessing) return null;
                                    const progress = getUploadProgress(record.id);

                                    return (
                                        <Tag
                                            icon={<SyncOutlined spin />}
                                            color="processing"
                                            className="rounded border-none text-[9px] px-1.5 py-0.5 m-0"
                                        >
                                            Processing {progress !== null ? `${progress}%` : ''}
                                        </Tag>
                                    );
                                })()}
                                {record.media_type !== "none" && (
                                    <Tag
                                        color="gold"
                                        className="rounded border-none text-[9px] px-1.5 py-0.5 m-0 flex items-center"
                                    >
                                        {record.media_type == "video" && (
                                            <VideoCameraOutlined className="mr-1 text-[8px]" />
                                        )}
                                        {record.media_type == "pdf" && (
                                            <FilePdfOutlined className="mr-1 text-[8px]" />
                                        )}
                                        {record.media_type == "audio" && (
                                            <AudioOutlined className="mr-1 text-[8px]" />
                                        )}
                                        <span className="capitalize text-[9px]">
                                            {record.media_type}
                                        </span>
                                    </Tag>
                                )}
                            </Space>

                            {/* Quick stats row */}
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <span>
                                    <EyeOutlined className="mr-1" />{" "}
                                    {record.viewer_count || 0}
                                </span>
                                <span>•</span>
                                <span>
                                    {dayjs(record.created_at).format("MMM DD")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status badges row */}
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-3">
                            {/* Status badge */}
                            <div className="flex items-center gap-1">
                                <Badge
                                    status={
                                        record.status == 1
                                            ? "success"
                                            : "default"
                                    }
                                    className="scale-75"
                                />
                                <span
                                    className={`text-[10px] font-medium ${record.status == 1 ? "text-green-600" : "text-gray-500"}`}
                                >
                                    {record.status == 1 ? "Published" : "Draft"}
                                </span>
                            </div>

                            {/* Permission badge */}
                            <div className="flex items-center gap-1">
                                <Badge
                                    status={
                                        record.permission === "approved"
                                            ? "success"
                                            : record.permission === "pending"
                                              ? "warning"
                                              : "error"
                                    }
                                    className="scale-75"
                                />
                                <span
                                    className={`text-[10px] font-medium ${
                                        record.permission === "approved"
                                            ? "text-green-600"
                                            : record.permission === "pending"
                                              ? "text-orange-500"
                                              : "text-red-500"
                                    }`}
                                >
                                    {record.permission === "approved"
                                        ? "Approved"
                                        : record.permission === "pending"
                                          ? "Pending"
                                          : "Rejected"}
                                </span>
                            </div>
                        </div>

                        {/* Status switch */}
                        <Tooltip title="Toggle publish status">
                            <Switch
                                checked={record.status == 1}
                                onChange={(checked) =>
                                    handleStatusChange(record.id, checked)
                                }
                                loading={loadingIds[record.id]}
                                size="small"
                            />
                        </Tooltip>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center justify-end gap-2 border-t pt-2">
                        {(() => {
                            const isProcessing =
                                record.audio === 'processing' ||
                                record.videos?.some(v => v.video === 'processing') ||
                                record.pdfs?.some(p => p.pdf === 'processing') ||
                                record.audios?.some(a => a.audio === 'processing');
                            return (
                            <Tooltip title={isProcessing ? "Media is still being processed…" : "Preview"}>
                                <Button
                                    type="text"
                                    size="small"
                                    disabled={isProcessing}
                                    icon={<EyeOutlined className={isProcessing ? "text-gray-300" : "text-gray-600"} />}
                                    onClick={() =>
                                        !isProcessing && window.open(
                                            route("admin.posts.show", record.id),
                                            "_blank",
                                        )
                                    }
                                    className="flex-1 flex items-center justify-center"
                                >
                                    <span className="ml-1 text-xs">Preview</span>
                                </Button>
                            </Tooltip>
                            );
                        })()}

                        <Tooltip title="Edit">
                            <Link
                                href={route("admin.posts.edit", record.id)}
                                className="flex-1"
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={
                                        <EditOutlined className="text-blue-500" />
                                    }
                                    className="w-full flex items-center justify-center"
                                >
                                    <span className="ml-1 text-xs">Edit</span>
                                </Button>
                            </Link>
                        </Tooltip>

                        <Dropdown
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: "approve",
                                            label: "Approve",
                                            icon: <CheckOutlined />,
                                            onClick: () =>
                                                handleApproved(record.id),
                                        },
                                        {
                                            key: "rejected",
                                            label: "Reject",
                                            icon: <CloseOutlined />,
                                            onClick: () =>
                                                handleRejected(record.id),
                                        },
                                        {
                                            type: "divider",
                                        },
                                        {
                                            key: "delete",
                                            label: "Delete",
                                            icon: <DeleteOutlined />,
                                            danger: true,
                                            onClick: () =>
                                                handleDelete(record.id),
                                        },
                                    ]}
                                />
                            }
                            trigger={["click"]}
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<MoreOutlined />}
                                className="flex-1 flex items-center justify-center"
                            >
                                <span className="ml-1 text-xs">More</span>
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Posts Library">
            <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-full sm:w-auto">
                        <Title
                            level={4}
                            className="!mb-1 font-bold text-base sm:text-xl"
                        >
                            Posts Management
                        </Title>
                        <Text type="secondary" className="text-xs sm:text-sm">
                            Create, edit, and manage your website articles.
                        </Text>
                    </div>
                    <div className="w-full sm:w-auto flex gap-2">
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() =>
                                setShowMobileFilters(!showMobileFilters)
                            }
                            className="sm:hidden flex-1"
                            size="middle"
                        >
                            Filters
                        </Button>
                        <Link
                            href={route("admin.posts.create")}
                            className="flex-1 sm:flex-none"
                        >
                            <Button
                                type="primary"
                                size="middle"
                                icon={<PlusOutlined />}
                                className="rounded-lg h-10 px-4 sm:px-6 font-semibold shadow-md border-none bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">
                                    Create New Post
                                </span>
                                <span className="sm:hidden">New Post</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Filters - Enhanced with better UX */}
                {showMobileFilters && (
                    <div className="sm:hidden mb-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-slideDown">
                        <div className="flex justify-between items-center mb-3">
                            <Text strong className="text-sm">
                                Filter Posts
                            </Text>
                            <Button
                                type="text"
                                size="small"
                                onClick={() => setShowMobileFilters(false)}
                                icon={<CloseOutlined />}
                            />
                        </div>
                        <Row gutter={[12, 12]}>
                            <Col span={24}>
                                <Input
                                    placeholder="Search posts..."
                                    prefix={
                                        <SearchOutlined className="text-gray-400" />
                                    }
                                    size="middle"
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    onPressEnter={() => {
                                        handleSearch(searchText);
                                        setShowMobileFilters(false);
                                    }}
                                    allowClear
                                    className="rounded-lg"
                                />
                            </Col>

                            <Col span={12}>
                                <Select
                                    placeholder="Category"
                                    className="w-full"
                                    size="middle"
                                    onChange={(val) => {
                                        handleFilter("category_id", val);
                                        setShowMobileFilters(false);
                                    }}
                                    allowClear
                                >
                                    {categories.map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <Select
                                    placeholder="Status"
                                    className="w-full"
                                    size="middle"
                                    onChange={(val) => {
                                        handleFilter("status", val);
                                        setShowMobileFilters(false);
                                    }}
                                    allowClear
                                >
                                <Option value="1">Published</Option>
                                    <Option value="0">Draft</Option>
                                    <Option value="processing">⏳ Processing</Option>
                                </Select>
                            </Col>
                            <Col span={24}>
                                <Button
                                    block
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                        router.get(route("admin.posts.index"));
                                        setShowMobileFilters(false);
                                    }}
                                    size="middle"
                                    className="rounded-lg"
                                >
                                    Reset Filters
                                </Button>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* Desktop Filters - Optimized */}
                <div className="hidden sm:block mb-6">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8} lg={8}>
                            <Input
                                placeholder="Search by title..."
                                prefix={
                                    <SearchOutlined className="text-gray-400" />
                                }
                                size="large"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={() => handleSearch(searchText)}
                                allowClear
                                className="rounded-lg shadow-sm w-full"
                            />
                        </Col>
                        <Col xs={12} sm={12} md={4} lg={2} xl={2}>
                            <Button
                                block
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={() => handleSearch(searchText)}
                                size="large"
                                className=" rounded-lg hover:bg-gray-50 border-gray-200"
                            ></Button>
                        </Col>
                        <Col xs={24} sm={8} md={6} lg={5}>
                            <Select
                                placeholder="All Categories"
                                className="w-full"
                                size="large"
                                onChange={(val) =>
                                    handleFilter("category_id", val)
                                }
                                allowClear
                            >
                                {categories.map((c) => (
                                    <Option key={c.id} value={c.id}>
                                        {c.name}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={6} md={4} lg={4}>
                            <Select
                                placeholder="All Status"
                                className="w-full"
                                size="large"
                                onChange={(val) => handleFilter("status", val)}
                                allowClear
                            >
                                <Option value="1">Published</Option>
                                <Option value="0">Draft</Option>
                                <Option value="processing">⏳ Processing</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={6} md={3} lg={3}>
                            <Button
                                block
                                icon={<ReloadOutlined />}
                                onClick={() =>
                                    router.get(route("admin.posts.index"))
                                }
                                size="large"
                                className="rounded-lg"
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
                            dataSource={posts.data.map((p) => ({
                                ...p,
                                key: p.id,
                            }))}
                            pagination={{
                                current: posts.current_page,
                                pageSize: posts.per_page,
                                total: posts.total,
                                showSizeChanger: true,
                                showTotal: (total) => `Total ${total} posts`,
                                responsive: true,
                                className: "px-4 sm:px-6 py-4 border-t",
                                size: "default",
                            }}
                            onChange={(pagination) => {
                                router.get(
                                    route("admin.posts.index"),
                                    { ...filters, page: pagination.current },
                                    { preserveState: true },
                                );
                            }}
                            locale={{
                                emptyText: (
                                    <div className="py-16 text-center">
                                        <InboxOutlined className="text-5xl text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-base">
                                            No posts found in library
                                        </p>
                                        <Link
                                            href={route("admin.posts.create")}
                                        >
                                            <Button
                                                type="link"
                                                className="mt-2"
                                            >
                                                Create your first post
                                            </Button>
                                        </Link>
                                    </div>
                                ),
                            }}
                            className="custom-post-table"
                            scroll={{ x: "max-content" }}
                        />
                    </div>

                    {/* Mobile Table - Enhanced */}
                    <div className="sm:hidden">
                        <Table
                            columns={mobileColumns}
                            dataSource={posts.data.map((p) => ({
                                ...p,
                                key: p.id,
                            }))}
                            pagination={{
                                current: posts.current_page,
                                pageSize: posts.per_page,
                                total: posts.total,
                                showSizeChanger: false,
                                simple: true,
                                showTotal: (total) => `${total} posts`,
                                className: "px-4 py-3 border-t",
                                size: "small",
                            }}
                            onChange={(pagination) => {
                                router.get(
                                    route("admin.posts.index"),
                                    { ...filters, page: pagination.current },
                                    { preserveState: true },
                                );
                            }}
                            locale={{
                                emptyText: (
                                    <div className="py-12 text-center">
                                        <InboxOutlined className="text-4xl text-gray-200 mb-2" />
                                        <p className="text-gray-400 text-sm">
                                            No posts found
                                        </p>
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
                    padding: 16px 20px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                :global(.custom-post-table .ant-table-tbody > tr > td) {
                    padding: 12px 20px !important;
                }
                :global(.custom-post-table .ant-table-row:hover > td) {
                    background-color: #f9fbff !important;
                }
                :global(.ant-select-selector) {
                    border-radius: 8px !important;
                }

                /* Mobile table styles */
                :global(.custom-mobile-post-table .ant-table-tbody > tr > td) {
                    padding: 16px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                :global(
                    .custom-mobile-post-table
                        .ant-table-tbody
                        > tr:last-child
                        > td
                ) {
                    border-bottom: none !important;
                }
                :global(.custom-mobile-post-table .ant-table-row) {
                    background: white !important;
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

                /* Mobile pagination styles */
                @media (max-width: 640px) {
                    :global(.ant-pagination) {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        gap: 4px !important;
                    }
                    :global(.ant-pagination .ant-pagination-item) {
                        min-width: 32px !important;
                        height: 32px !important;
                        line-height: 32px !important;
                        margin: 0 2px !important;
                    }
                    :global(.ant-pagination .ant-pagination-prev),
                    :global(.ant-pagination .ant-pagination-next) {
                        min-width: 32px !important;
                        height: 32px !important;
                        line-height: 32px !important;
                    }
                    :global(.ant-pagination .ant-pagination-item a) {
                        font-size: 12px !important;
                    }
                }

                /* Button hover effects */
                :global(.ant-btn-text:hover) {
                    background-color: #f5f5f5 !important;
                }
            `}</style>
        </Authenticated>
    );
}

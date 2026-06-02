import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    CheckCircleOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PauseOutlined,
    PictureOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    StarFilled,
    StarOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Grid,
    Image,
    Input,
    message,
    Popconfirm,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import { useMemo } from "react";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid;

export default function Index({ advertisements, stats, filters = {}, auth }) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = screens.md && !screens.lg;

    // ---------- helpers ----------
    const formatNumber = (value, decimals = 2) => {
        if (value === null || value === undefined || isNaN(value))
            return "0.00";
        return parseFloat(value).toFixed(decimals);
    };

    const calculateCTR = (ad) => {
        const impressions = ad.impressions_count || 0;
        const clicks = ad.clicks_count || 0;
        if (!impressions) return "0.00";
        return ((clicks / impressions) * 100).toFixed(2);
    };

    const calculateProgress = (ad) => {
        const spent = ad.spent_amount || 0;
        const total = ad.total_budget || 0;
        if (!total) return 0;
        return Math.min(100, (spent / total) * 100);
    };

    const isActive = (ad) => {
        const now = new Date();
        const startDate = ad.start_date ? new Date(ad.start_date) : null;
        const endDate = ad.end_date ? new Date(ad.end_date) : null;

        return (
            ad.is_active &&
            ad.status === "approved" &&
            (!startDate || startDate <= now) &&
            (!endDate || endDate >= now) &&
            (!ad.max_impressions ||
                (ad.impressions_count || 0) < ad.max_impressions) &&
            (!ad.max_clicks || (ad.clicks_count || 0) < ad.max_clicks) &&
            (!ad.total_budget || (ad.spent_amount || 0) < ad.total_budget)
        );
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "video_ad":
                return <VideoCameraOutlined />;
            default:
                return <PictureOutlined />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "banner":
                return "blue";
            case "sidebar":
                return "green";
            case "popup":
                return "orange";
            case "interstitial":
                return "magenta";
            case "video_ad":
                return "purple";
            default:
                return "default";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "green";
            case "pending":
                return "orange";
            case "rejected":
                return "red";
            case "paused":
                return "default";
            case "completed":
                return "cyan";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckOutlined />;
            case "pending":
                return <ClockCircleOutlined />;
            case "rejected":
                return <CloseOutlined />;
            case "paused":
                return <PauseOutlined />;
            case "completed":
                return <CheckCircleOutlined />;
            default:
                return null;
        }
    };

    // ---------- actions ----------
    const handleDelete = (id) => {
        router.delete(route("admin.advertisements.destroy", id), {
            preserveScroll: true,
            onSuccess: () =>
                message.success("Advertisement deleted successfully"),
            onError: () => message.error("Error deleting advertisement"),
        });
    };

    const handleSearch = (value) => {
        router.get(
            route("admin.advertisements.index"),
            { ...filters, search: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const handleFilter = (key, value) => {
        router.get(
            route("admin.advertisements.index"),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        router.get(
            route("admin.advertisements.index"),
            {},
            { preserveState: true, replace: true },
        );
    };

    const approveAd = (id) => {
        router.post(
            route("admin.approve.status", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    message.success("Advertisement approved successfully"),
            },
        );
    };

    const rejectAd = (id) => {
        router.post(
            route("admin.advertisements.reject", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => message.success("Advertisement rejected"),
            },
        );
    };

    const toggleActive = (id, currentStatus) => {
        router.post(
            route("admin.advertisements.toggle-active", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    message.success(
                        `Advertisement ${currentStatus ? "paused" : "activated"} successfully`,
                    ),
            },
        );
    };

    const toggleFeatured = (id, currentStatus) => {
        router.post(
            route("admin.advertisements.toggle-featured", id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    message.success(
                        `Advertisement ${currentStatus ? "unfeatured" : "featured"} successfully`,
                    ),
            },
        );
    };

    // ---------- safe stats ----------
    const safeStats = {
        total: stats?.total || 0,
        active: stats?.active || 0,
        pending: stats?.pending || 0,
        total_spent: stats?.total_spent || 0,
        total_impressions: stats?.total_impressions || 0,
        total_clicks: stats?.total_clicks || 0,
    };

    const dataSource = (advertisements?.data || []).map((item) => ({
        ...item,
        key: item.id,
    }));

    // ---------- ui bits ----------
    const ActionButtons = ({ record }) => {
        return (
            <Space size="small" wrap>
                <Tooltip title="Edit">
                    <Link href={route("admin.advertisements.edit", record.id)}>
                        <Button size="small" icon={<EditOutlined />} />
                    </Link>
                </Tooltip>

                {record.status === "pending" && (
                    <>
                        <Tooltip title="Approve">
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => approveAd(record.id)}
                            />
                        </Tooltip>
                        <Tooltip title="Reject">
                            <Button
                                size="small"
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => rejectAd(record.id)}
                            />
                        </Tooltip>
                    </>
                )}

                <Tooltip title={record.is_active ? "Pause" : "Activate"}>
                    <Button
                        size="small"
                        type={record.is_active ? "default" : "primary"}
                        icon={
                            record.is_active ? (
                                <PauseOutlined />
                            ) : (
                                <PlayCircleOutlined />
                            )
                        }
                        onClick={() =>
                            toggleActive(record.id, record.is_active)
                        }
                    />
                </Tooltip>

                <Tooltip title={record.is_featured ? "Unfeature" : "Feature"}>
                    <Button
                        size="small"
                        type={record.is_featured ? "primary" : "default"}
                        icon={
                            record.is_featured ? (
                                <StarFilled />
                            ) : (
                                <StarOutlined />
                            )
                        }
                        onClick={() =>
                            toggleFeatured(record.id, record.is_featured)
                        }
                    />
                </Tooltip>

                <Popconfirm
                    title="Delete Advertisement"
                    description="Are you sure to delete this advertisement?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Tooltip title="Delete">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                </Popconfirm>
            </Space>
        );
    };

    const expandedRowRender = (record) => {
        return (
            <div className="p-2">
                <Row gutter={[16, 12]}>
                    <Col xs={24} md={8}>
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                            <p className="font-semibold text-gray-900">
                                Performance
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                                <p>
                                    👁️{" "}
                                    {(
                                        record.impressions_count || 0
                                    ).toLocaleString()}
                                    {record.max_impressions
                                        ? ` / ${record.max_impressions.toLocaleString()}`
                                        : ""}
                                </p>
                                <p>
                                    🖱️{" "}
                                    {(
                                        record.clicks_count || 0
                                    ).toLocaleString()}
                                    {record.max_clicks
                                        ? ` / ${record.max_clicks.toLocaleString()}`
                                        : ""}
                                </p>
                                <p className="text-gray-500">
                                    CTR: {calculateCTR(record)}%
                                </p>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={8}>
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                            <p className="font-semibold text-gray-900">
                                Budget
                            </p>
                            <div className="mt-2">
                                {record.total_budget ? (
                                    <>
                                        <p className="text-sm font-medium text-gray-900">
                                            ${formatNumber(record.spent_amount)}{" "}
                                            / $
                                            {formatNumber(record.total_budget)}
                                        </p>
                                        <div className="mt-2">
                                            <Progress
                                                percent={calculateProgress(
                                                    record,
                                                )}
                                                size="small"
                                                showInfo={false}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No budget
                                    </p>
                                )}
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={8}>
                        <div className="rounded-xl border border-gray-200 bg-white p-3">
                            <p className="font-semibold text-gray-900">
                                Campaign
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                                {record.start_date && (
                                    <p>
                                        Start:{" "}
                                        {new Date(
                                            record.start_date,
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                                {record.end_date && (
                                    <p>
                                        End:{" "}
                                        {new Date(
                                            record.end_date,
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                                {record.end_date &&
                                    new Date(record.end_date) > new Date() && (
                                        <Countdown
                                            value={new Date(record.end_date)}
                                            format="D[d] H[h]"
                                            valueStyle={{ fontSize: 12 }}
                                        />
                                    )}
                            </div>
                        </div>
                    </Col>

                    <Col xs={24}>
                        <Divider className="my-3" />
                        <div className="flex flex-wrap justify-start gap-2">
                            <ActionButtons record={record} />
                        </div>
                    </Col>
                </Row>
            </div>
        );
    };

    const columns = useMemo(() => {
        return [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 80,
                responsive: ["lg"],
            },
            {
                title: "Advertisement",
                key: "ad",
                render: (_, record) => {
                    return (
                        <div className="flex items-start gap-3">
                            {record.image ? (
                                <Image
                                    width={isMobile ? 56 : 64}
                                    height={isMobile ? 40 : 44}
                                    // src={`/storage/${record.image}`}
                                    src={getS3PublicUrl(record.image)}
                                    alt={record.title}
                                    preview={false}
                                    className="rounded-lg object-cover"
                                    fallback="/placeholder-ad.jpg"
                                />
                            ) : (
                                <div className="flex h-11 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                    {getTypeIcon(record.type)}
                                </div>
                            )}

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-semibold text-gray-900">
                                        {record.title}
                                    </p>
                                    {record.is_featured && (
                                        <Tooltip title="Featured">
                                            <StarFilled className="text-yellow-500" />
                                        </Tooltip>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500">
                                    by {record.advertiser_name}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Tag
                                        color={getTypeColor(record.type)}
                                        className="m-0"
                                    >
                                        {record.type
                                            ?.replace("_", " ")
                                            ?.toUpperCase()}
                                    </Tag>
                                    <Tag
                                        color={getStatusColor(record.status)}
                                        icon={getStatusIcon(record.status)}
                                        className="m-0"
                                    >
                                        {record.status?.toUpperCase()}
                                    </Tag>
                                    {isActive(record) && (
                                        <Badge status="success" text="Active" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                },
            },
            {
                title: "Type/Position",
                key: "type_position",
                responsive: ["lg"],
                render: (_, record) => (
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {getTypeIcon(record.type)}
                            <Tag
                                color={getTypeColor(record.type)}
                                className="m-0"
                            >
                                {record.type?.replace("_", " ")?.toUpperCase()}
                            </Tag>
                        </div>
                        <p className="text-xs text-gray-500">
                            {record.position
                                ?.split("_")
                                ?.map(
                                    (w) =>
                                        w.charAt(0).toUpperCase() + w.slice(1),
                                )
                                ?.join(" ")}
                        </p>
                    </div>
                ),
            },
            {
                title: "Performance",
                key: "performance",
                responsive: ["xl"],
                render: (_, record) => (
                    <div className="space-y-1 text-sm">
                        <p>
                            👁️{" "}
                            {(record.impressions_count || 0).toLocaleString()}
                        </p>
                        <p>🖱️ {(record.clicks_count || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                            CTR: {calculateCTR(record)}%
                        </p>
                    </div>
                ),
            },
            {
                title: "Budget",
                key: "budget",
                responsive: ["xl"],
                render: (_, record) =>
                    record.total_budget ? (
                        <div className="min-w-[180px] space-y-2">
                            <p className="font-medium text-gray-900">
                                ${formatNumber(record.spent_amount)} / $
                                {formatNumber(record.total_budget)}
                            </p>
                            <Progress
                                percent={calculateProgress(record)}
                                size="small"
                                showInfo={false}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No budget</p>
                    ),
            },
            {
                title: "Campaign",
                key: "campaign",
                responsive: ["xl"],
                render: (_, record) => (
                    <div className="space-y-1 text-sm">
                        {record.start_date && (
                            <p>
                                Start:{" "}
                                {new Date(
                                    record.start_date,
                                ).toLocaleDateString()}
                            </p>
                        )}
                        {record.end_date && (
                            <p>
                                End:{" "}
                                {new Date(record.end_date).toLocaleDateString()}
                            </p>
                        )}
                        {record.end_date &&
                            new Date(record.end_date) > new Date() && (
                                <Countdown
                                    value={new Date(record.end_date)}
                                    format="D[d] H[h]"
                                    valueStyle={{ fontSize: 12 }}
                                />
                            )}
                    </div>
                ),
            },
            {
                title: "Actions",
                key: "actions",
                width: 220,
                responsive: ["lg"],
                render: (_, record) => <ActionButtons record={record} />,
            },
        ];
    }, [isMobile]);

    return (
        <Authenticated user={auth.user} header="Advertisement Management">
            {/* scoped style: table hover light gray + active/pending/rejected subtle */}

            <div className="mx-auto w-full md:max-w-6xl ">
                <Card className="rounded-2xl"   bodyStyle={{ padding: 0 }}>
                    
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <Title level={isMobile ? 3 : 2} className="!mb-1">
                                Advertisement Management
                            </Title>
                            <Text type="secondary">
                                Manage banners, sidebar ads, popups, and video
                                advertisements
                            </Text>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                            <Link
                                href={route("admin.advertisements.create")}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    size={isMobile ? "middle" : "large"}
                                    className="w-full"
                                >
                                    Create Ads
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {safeStats.total}
                            </p>
                            <p className="text-sm text-gray-500">Total Ads</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {safeStats.active}
                            </p>
                            <p className="text-sm text-gray-500">Active</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                {safeStats.pending}
                            </p>
                            <p className="text-sm text-gray-500">Pending</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900">
                                ${formatNumber(safeStats.total_spent)}
                            </p>
                            <p className="text-sm text-gray-500">Total Spent</p>
                        </div>
                    </div>
                    {/* Performance stats */}
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <Statistic
                                title="Total Impressions"
                                value={safeStats.total_impressions}
                                prefix={<EyeOutlined />}
                            />
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <Statistic
                                title="Total Clicks"
                                value={safeStats.total_clicks}
                                prefix={<UserOutlined />}
                            />
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <Statistic
                                title="Overall CTR"
                                value={
                                    safeStats.total_impressions
                                        ? (
                                              (safeStats.total_clicks /
                                                  safeStats.total_impressions) *
                                              100
                                          ).toFixed(2)
                                        : 0
                                }
                                suffix="%"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                            <div className="md:col-span-5">
                                <Search
                                    placeholder="Search by title, advertiser..."
                                    allowClear
                                    enterButton={<SearchOutlined />}
                                    size="large"
                                    defaultValue={filters.search}
                                    onSearch={handleSearch}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Select
                                    placeholder="Type"
                                    allowClear
                                    size="large"
                                    className="w-full"
                                    value={filters.type || null}
                                    onChange={(v) => handleFilter("type", v)}
                                >
                                    <Option value="banner">Banner</Option>
                                    <Option value="sidebar">Sidebar</Option>
                                    <Option value="popup">Popup</Option>
                                    <Option value="interstitial">
                                        Interstitial
                                    </Option>
                                    <Option value="video_ad">Video Ad</Option>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Select
                                    placeholder="Status"
                                    allowClear
                                    size="large"
                                    className="w-full"
                                    value={filters.status || null}
                                    onChange={(v) => handleFilter("status", v)}
                                >
                                    <Option value="pending">Pending</Option>
                                    <Option value="approved">Approved</Option>
                                    <Option value="rejected">Rejected</Option>
                                    <Option value="paused">Paused</Option>
                                    <Option value="completed">Completed</Option>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <Select
                                    placeholder="Position"
                                    allowClear
                                    size="large"
                                    className="w-full"
                                    value={filters.position || null}
                                    onChange={(v) =>
                                        handleFilter("position", v)
                                    }
                                >
                                    <Option value="header">Header</Option>
                                    <Option value="footer">Footer</Option>
                                    <Option value="sidebar_left">
                                        Sidebar Left
                                    </Option>
                                    <Option value="sidebar_right">
                                        Sidebar Right
                                    </Option>
                                    <Option value="popup">Popup</Option>
                                    <Option value="in_content">
                                        In Content
                                    </Option>
                                </Select>
                            </div>

                            <div className="md:col-span-1">
                                <Button
                                    icon={<ReloadOutlined />}
                                    size="large"
                                    onClick={resetFilters}
                                    className="w-full"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ad-table-scope mt-5">
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            size={isMobile ? "small" : "middle"}
                            sticky
                            rowKey="id"
                            rowClassName={(record) => {
                                if (isActive(record)) return "row-active";
                                if (record.status === "pending")
                                    return "row-pending";
                                if (record.status === "rejected")
                                    return "row-rejected";
                                return "";
                            }}
                            expandable={
                                isMobile || isTablet
                                    ? {
                                          expandedRowRender,
                                          expandRowByClick: true,
                                      }
                                    : undefined
                            }
                            pagination={{
                                current: advertisements?.current_page || 1,
                                pageSize: advertisements?.per_page || 10,
                                total: advertisements?.total || 0,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} advertisements`,
                            }}
                            scroll={{ x: "max-content" }}
                        />
                    </div>
                </Card>
            </div>
        </Authenticated>
    );
}

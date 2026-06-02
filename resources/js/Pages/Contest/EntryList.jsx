import React from "react";
import { Link, router, useForm } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";

import {
    Table,
    Button,
    Space,
    Tag,
    Input,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Row,
    Col,
    Select,
    Statistic,
    Divider,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    TrophyOutlined,
    LikeOutlined,
    UserOutlined,
    StarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_REJECTED = "rejected";

const statusOptions = [
    { label: "Pending", value: STATUS_PENDING, color: "blue" },
    { label: "Approved", value: STATUS_APPROVED, color: "green" },
    { label: "Rejected", value: STATUS_REJECTED, color: "red" },
];

export default function Index({
    entries,
    contest,
    userVotes,
    filters,
    stats,
    auth,
}) {
    const { data, setData, get, processing } = useForm({
        search: filters.search || "",
        status: filters.status || "",
        sort: filters.sort || "votes_desc",
    });

    console.log("Entries:", stats);

    function formatDateTime(dateString) {
        if (!dateString) return "N/A";

        const date = new Date(dateString);

        const options = {
            day: "numeric",
            month: "long",
            year: "numeric",
        };

        // Format date part
        const datePart = date.toLocaleDateString("en-US", options);

        // Format time part
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;

        return `${datePart} at ${formattedHours}:${minutes} ${ampm}`;
    }

    const handleFilter = () => {
        get(route("admin.entries.contest.index", contest.id), {
            preserveState: true,
            preserveScroll: true,
            data: data,
        });
    };

    // function previousUrl() {
    //     return ;
    // }

    const handleReset = () => {
        setData({
            search: "",
            status: "",
            sort: "votes_desc",
        });
        get(route("admin.entries.contest.index", contest.id), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeclareWinner = (entryId) => {
        router.post(
            route("admin.winner.declare", entryId),
            {},
            {
                onSuccess: () => {
                    message.success("Winner declared successfully");
                },
                onError: (errors) => {
                    message.error(errors.error || "Error declaring winner");
                },
            },
        );
    };

    const handleDeclareWinnerManual = (entryId) => {
        router.post(
            route("admin.manual.winner", entryId),
            {},
            {
                onSuccess: () => {
                    message.success("Winner declared successfully");
                },
                onError: (errors) => {
                    message.error(errors.error || "Error declaring winner");
                },
            },
        );
    };

    const handleDelete = (id) => {
        router.delete(route("admin.entries.contest.index", id), {
            onBefore: () => {
                console.log(id);
            },
            onSuccess: () => {
                message.success("Entry deleted successfully");
            },
            onError: () => {
                message.error("Error deleting entry");
            },
        });
    };

    const columns = [
        {
            title: "Rank",
            key: "rank",
            render: (_, record, index) => {
                const currentPage = entries.current_page || 1;
                const pageSize = entries.per_page || 10;
                return (
                    <Text strong>
                        #{(currentPage - 1) * pageSize + index + 1}
                    </Text>
                );
            },
            width: 80,
        },

        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (text) => (
                <Space size="small">
                    {statusOptions.map((option) =>
                        option.value === text ? (
                            <Tag color={option.color} key={option.value}>
                                {option.label}
                            </Tag>
                        ) : null,
                    )}
                </Space>
            ),
        },
        {
            title: "User Info",
            key: "user_id",
            render: (_, record) => (
                <div>
                    <Text strong>{record.user?.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {record.user?.email}
                    </Text>
                </div>
            ),
        },
        {
            title: "Winner Status",
            key: "winner_id",
            render: (_, record) =>
                record.winner ? (
                    <Tag color="gold" style={{ padding: "4px 8px" }}>
                        <TrophyOutlined /> {record.winner.position} Position
                    </Tag>
                ) : (
                    <Tag color="default">Not Winner</Tag>
                ),
        },
        {
            title: "Media",
            dataIndex: "media_path",
            key: "media_path",
            render: (text) => {
                if (!text) return "N/A";

                const fileUrl = `/storage/${text}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(text);
                const isVideo = /\.(mp4|webm|ogg)$/i.test(text);

                return (
                    <Tooltip
                        title={
                            isImage
                                ? "View Image"
                                : isVideo
                                  ? "View Video"
                                  : "Download File"
                        }
                    >
                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="Entry Media"
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                                    cursor: "pointer",
                                }}
                                onClick={() => window.open(fileUrl, "_blank")}
                            />
                        ) : isVideo ? (
                            <video
                                src={fileUrl}
                                controls
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                }}
                            />
                        ) : (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        )}
                    </Tooltip>
                );
            },
        },
        {
            title: "Total Votes",
            dataIndex: "total_votes",
            key: "total_votes",
            render: (text, record) => (
                <Space>
                    <LikeOutlined style={{ color: "#ff4d4f" }} />
                    <Text strong>{text}</Text>
                    {userVotes.includes(record.id) && (
                        <Tag color="blue" size="small">
                            Your Vote
                        </Tag>
                    )}
                </Space>
            ),
            sorter: true,
        },

        {
            title: "Total Reviews",
            dataIndex: "review_count",
            key: "review_count",
            render: (review_count) => (
                <Space>
                    <StarOutlined style={{ color: "#faad14" }} />
                    <Text strong>{review_count || 0}</Text>
                </Space>
            ),
            sorter: true,
        },

        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() =>
                                router.visit(
                                    route("admin.entries.show", record.id),
                                )
                            }
                        />
                    </Tooltip>

                    {/* <Tooltip title="Declare Winner (Auto)">
                        <Button 
                            type="primary" 
                            size="small"
                            icon={<TrophyOutlined />}
                            onClick={() => handleDeclareWinner(record.id)}
                            disabled={!!record.winner}
                        >
                            {record.winner ? 'Winner' : 'Declare'}
                        </Button>
                    </Tooltip> */}

                    <Tooltip title="Declare Winner (Manual)">
                        <Button
                            type="primary"
                            size="small"
                            icon={<TrophyOutlined />}
                            onClick={() => handleDeclareWinnerManual(record.id)}
                            disabled={!!record.winner}
                        >
                            {record.winner ? "Winner" : "Declare"}
                        </Button>
                    </Tooltip>

                    <Popconfirm
                        title="Delete this entry?"
                        description="Are you sure you want to delete this entry?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Entry">
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const [selectedRowKeys, setSelectedRowKeys] = React.useState([]);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: !!record.winner, // Disable selection for already winners
            name: record.title,
        }),
    };

    const handleBulkDeclareWinners = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("Please select at least one entry");
            return;
        }

        router.post(
            route("admin.entries.bulk-winner"),
            {
                contest_id: contest.id,
                entry_ids: selectedRowKeys,
            },
            {
                onSuccess: () => {
                    setSelectedRowKeys([]);
                    message.success("Winners declared successfully");
                },
                onError: (errors) => {
                    message.error(errors.error || "Error declaring winners");
                },
            },
        );
    };

    const handleTableChange = (pagination, filters, sorter) => {
        const sortOrder = sorter.order === "ascend" ? "asc" : "desc";
        const sortField =
            sorter.field === "total_votes" ? "votes" : "created_at";

        setData("sort", `${sortField}_${sortOrder}`);
        handleFilter();
    };

    return (
        <Authenticated
            user={auth.user}
            header={`All Entries - ${contest.title}`}
        >
            <Card>
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Entries for {contest.title}
                        </Title>
                        <Text type="secondary">
                            <html
                                dangerouslySetInnerHTML={{
                                    __html: contest.description,
                                }}
                            />
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                            Contest Period: {formatDateTime(contest.start_date)}{" "}
                            to {formatDateTime(contest.end_date)}
                        </Text>
                    </div>

                    <div className="mt-2">
                        <Space>
                            {selectedRowKeys.length > 0 && (
                                <Popconfirm
                                    title="Declare as winners?"
                                    description={`Are you sure you want to declare ${selectedRowKeys.length} selected entries as winners?`}
                                    onConfirm={handleBulkDeclareWinners}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button
                                        type="primary"
                                        icon={<TrophyOutlined />}
                                        style={{
                                            backgroundColor: "#faad14",
                                            borderColor: "#faad14",
                                        }}
                                    >
                                        Declare {selectedRowKeys.length}{" "}
                                        Winner(s)
                                    </Button>
                                </Popconfirm>
                            )}
                            <Link href={route("admin.contests.index")}>
                                <Button
                                    type="default"
                                    icon={<ReloadOutlined />}
                                >
                                    Back to Contests
                                </Button>
                            </Link>
                        </Space>
                    </div>
                </div>

                {/* Stats Section */}
                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Total Entries"
                                value={stats.total_entries}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Total Votes"
                                value={stats.total_votes}
                                prefix={<LikeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Winners Declared"
                                value={stats.winners_count}
                                prefix={<TrophyOutlined />}
                                suffix={`/ ${contest.total_prize_positions}`}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Your Votes"
                                value={stats.user_votes_count}
                                prefix={<LikeOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters Section */}
                <Card className="mb-6">
                    <Row gutter={16} align="middle">
                        <Col xs={24} sm={8}>
                            <Input
                                placeholder="Search entries..."
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                prefix={<SearchOutlined />}
                                onPressEnter={handleFilter}
                            />
                        </Col>
                        <Col xs={24} sm={4}>
                            <Select
                                placeholder="Filter by status"
                                style={{ width: "100%" }}
                                value={data.status || null}
                                onChange={(value) => setData("status", value)}
                                allowClear
                            >
                                {statusOptions.map((option) => (
                                    <Option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={4}>
                            <Select
                                placeholder="Sort by"
                                style={{ width: "100%" }}
                                value={data.sort}
                                onChange={(value) => setData("sort", value)}
                            >
                                <Option value="votes_desc">
                                    Most Votes First
                                </Option>
                                <Option value="votes_asc">
                                    Least Votes First
                                </Option>
                                <Option value="created_desc">
                                    Newest First
                                </Option>
                                <Option value="created_asc">
                                    Oldest First
                                </Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={4}>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<FilterOutlined />}
                                    onClick={handleFilter}
                                    loading={processing}
                                >
                                    Filter
                                </Button>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleReset}
                                    loading={processing}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Entries Table */}
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={entries.data.map((entry) => ({
                        ...entry,
                        key: entry.id,
                    }))}
                    rowKey="id"
                    pagination={{
                        current: entries.current_page,
                        pageSize: entries.per_page,
                        total: entries.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} entries`,
                    }}
                    onChange={handleTableChange}
                    loading={processing}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </Authenticated>
    );
}

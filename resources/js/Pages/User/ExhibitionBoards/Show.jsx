import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import {
    Card,
    Button,
    Typography,
    Image,
    Tag,
    Badge,
    Table,
    Space,
    Tabs,
    Tooltip,
    Popconfirm,
    message,
    Empty,
    Descriptions,
} from "antd";
import {
    ArrowLeftOutlined,
    EditOutlined,
    PlusOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    TeamOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function Show({ auth, board }) {
    const getImageUrl = (path) => {
        if (!path) {
            return "/placeholder-image.jpg";
        }

        if (typeof path === "string") {
            if (path.startsWith("http")) {
                return path;
            }

            if (path.startsWith("/storage")) {
                return path;
            }

            return `/storage/${path}`;
        }

        if (typeof path === "object") {
            if (path.image_url) {
                return path.image_url;
            }

            if (path.image) {
                return getImageUrl(path.image);
            }
        }

        return "/placeholder-image.jpg";
    };

    const getApprovalColor = (status) => {
        switch (status) {
            case "approved":
                return "green";
            case "rejected":
                return "red";
            case "pending":
                return "orange";
            default:
                return "default";
        }
    };

    const getApprovalIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircleOutlined />;
            case "rejected":
                return <CloseCircleOutlined />;
            case "pending":
                return <ClockCircleOutlined />;
            default:
                return <ClockCircleOutlined />;
        }
    };

    const approveOwnerRequest = (requestId) => {
        router.post(
            route("user.exhibition-board-member-requests.owner-approve", requestId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Request approved. Waiting for admin approval.");
                },
                onError: () => {
                    message.error("Failed to approve request");
                },
            }
        );
    };

    const rejectOwnerRequest = (requestId) => {
        router.post(
            route("user.exhibition-board-member-requests.owner-reject", requestId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Request rejected");
                },
                onError: () => {
                    message.error("Failed to reject request");
                },
            }
        );
    };

    const stripHtml = (html) => {
        if (!html) return "";
        return html.replace(/<[^>]+>/g, "");
    };

    const isOwner = board.user_id === auth.user.id;
    const canCreateExhibition = board.approval_status === "approved";

    const exhibitionColumns = [
        {
            title: "Item",
            key: "item",
            render: (_, record) => (
                <Space>
                    <Image
                        width="100%"
                        height={180}
                        src={board.image_url || "/placeholder-image.jpg"}
                        fallback="/placeholder-image.jpg"
                        style={{
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "1px solid #eee",
                        }}
                    />

                    <Space direction="vertical" size={0}>
                        <Text strong>{stripHtml(record.title)}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            By: {record.user?.name || "Unknown"}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => <Tag>{status?.toUpperCase()}</Tag>,
        },
        {
            title: "Approval",
            dataIndex: "approval_status",
            key: "approval_status",
            render: (status) => (
                <Tag color={getApprovalColor(status)} icon={getApprovalIcon(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Price",
            key: "price",
            render: (_, record) =>
                record.price ? (
                    <Text strong>
                        {record.currency || "USD"}{" "}
                        {parseFloat(record.price).toLocaleString()}
                    </Text>
                ) : (
                    <Text type="secondary">Free</Text>
                ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Link href={route("user.exhibitions.show", record.id)}>
                        <Button size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>

                    {record.user_id === auth.user.id && (
                        <Link href={route("user.exhibitions.edit", record.id)}>
                            <Button size="small" type="primary" icon={<EditOutlined />}>
                                Edit
                            </Button>
                        </Link>
                    )}
                </Space>
            ),
        },
    ];

    const requestColumns = [
        {
            title: "Requested User",
            key: "user",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.user?.name || "Unknown"}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.user?.email || ""}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Owner Status",
            dataIndex: "owner_status",
            key: "owner_status",
            render: (status) => (
                <Tag color={getApprovalColor(status)}>{status?.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Admin Status",
            dataIndex: "admin_status",
            key: "admin_status",
            render: (status) => (
                <Tag color={getApprovalColor(status)}>{status?.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Final Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getApprovalColor(status)}>{status?.toUpperCase()}</Tag>
            ),
        },
        {
            title: "Message",
            dataIndex: "request_message",
            key: "request_message",
            render: (value) =>
                value ? (
                    <Tooltip title={value}>
                        <Text>
                            {value.length > 35 ? `${value.slice(0, 35)}...` : value}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => {
                if (!isOwner || record.owner_status !== "pending") {
                    return <Text type="secondary">No action</Text>;
                }

                return (
                    <Space>
                        <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => approveOwnerRequest(record.id)}
                        >
                            Approve
                        </Button>

                        <Popconfirm
                            title="Reject this request?"
                            okText="Reject"
                            cancelText="Cancel"
                            onConfirm={() => rejectOwnerRequest(record.id)}
                        >
                            <Button
                                size="small"
                                danger
                                icon={<CloseCircleOutlined />}
                            >
                                Reject
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const tabItems = [
        {
            key: "exhibitions",
            label: (
                <span>
                    <AppstoreOutlined /> Exhibitions
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={exhibitionColumns}
                    dataSource={board.exhibitions || []}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: <Empty description="No exhibition found under this board." />,
                    }}
                    scroll={{ x: 950 }}
                />
            ),
        },
        {
            key: "requests",
            label: (
                <span>
                    <TeamOutlined /> Access Requests
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={requestColumns}
                    dataSource={board.member_requests || []}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: <Empty description="No access request found." />,
                    }}
                    scroll={{ x: 950 }}
                />
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Board Details">
            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        marginBottom: 24,
                    }}
                >
                    <div>
                        <Link href={route("user.exhibition-boards.index")}>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                style={{ paddingLeft: 0, marginBottom: 8 }}
                            >
                                Back to Boards
                            </Button>
                        </Link>

                        <Title level={3} style={{ marginBottom: 4 }}>
                            {board.title}
                        </Title>

                        <Space wrap>
                            <Tag
                                color={getApprovalColor(board.approval_status)}
                                icon={getApprovalIcon(board.approval_status)}
                            >
                                {board.approval_status?.toUpperCase()}
                            </Tag>

                            <Badge
                                status={board.is_active ? "success" : "default"}
                                text={board.is_active ? "Active" : "Inactive"}
                            />

                            <Text type="secondary">
                                Owner: {board.owner?.name || "Unknown"}
                            </Text>
                        </Space>
                    </div>

                    <Space wrap>
                        {isOwner && (
                            <Link href={route("user.exhibition-boards.edit", board.id)}>
                                <Button type="primary" icon={<EditOutlined />}>
                                    Edit Board
                                </Button>
                            </Link>
                        )}

                        {canCreateExhibition && (
                            <Link href={route("user.exhibitions.create")}>
                                <Button icon={<PlusOutlined />}>
                                    Create Exhibition
                                </Button>
                            </Link>
                        )}
                    </Space>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "260px 1fr",
                        gap: 24,
                        marginBottom: 30,
                    }}
                    className="board-show-grid"
                >
                    <div>
                        <Image
                            width="100%"
                            height={180}
                            src={board.image_url}
                            fallback="/placeholder-image.jpg"
                            style={{
                                objectFit: "cover",
                                borderRadius: 12,
                                border: "1px solid #eee",
                            }}
                        />
                    </div>

                    <div>
                        <Descriptions
                            bordered
                            size="small"
                            column={{
                                xs: 1,
                                sm: 1,
                                md: 2,
                            }}
                        >
                            <Descriptions.Item label="Board ID">
                                {board.id}
                            </Descriptions.Item>

                            <Descriptions.Item label="Slug">
                                {board.slug}
                            </Descriptions.Item>

                            <Descriptions.Item label="Approval">
                                <Tag color={getApprovalColor(board.approval_status)}>
                                    {board.approval_status?.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item label="Active">
                                {board.is_active ? "Yes" : "No"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Approved At">
                                {board.approved_at
                                    ? new Date(board.approved_at).toLocaleString()
                                    : "N/A"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Admin Note">
                                {board.admin_note || "N/A"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Paragraph style={{ marginTop: 16 }}>
                            {board.description || "No description"}
                        </Paragraph>
                    </div>
                </div>

                <Tabs defaultActiveKey="exhibitions" items={tabItems} />
            </Card>

            <style>{`
                @media (max-width: 768px) {
                    .board-show-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </Authenticated>
    );
}
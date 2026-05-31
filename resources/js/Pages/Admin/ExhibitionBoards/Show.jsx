import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    Card,
    Button,
    Typography,
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
    Modal,
    Form,
    Input,
} from "antd";
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    DeleteOutlined,
    UserOutlined,
    TeamOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Show({ auth, board }) {
    const [rejectBoardModalOpen, setRejectBoardModalOpen] = useState(false);
    const [rejectBoardNote, setRejectBoardNote] = useState("");

    const [rejectMemberModalOpen, setRejectMemberModalOpen] = useState(false);
    const [selectedMemberRequest, setSelectedMemberRequest] = useState(null);
    const [rejectMemberNote, setRejectMemberNote] = useState("");

    const placeholderImage = "/placeholder-image.jpg";

    const makeImageUrl = (urlOrPath) => {
        if (!urlOrPath) {
            return placeholderImage;
        }

        if (typeof urlOrPath !== "string") {
            return placeholderImage;
        }

        const value = urlOrPath.trim();

        if (!value) {
            return placeholderImage;
        }

        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("blob:") ||
            value.startsWith("data:")
        ) {
            return value;
        }

        if (value.startsWith("/storage/")) {
            return value;
        }

        if (value.startsWith("storage/")) {
            return `/${value}`;
        }

        if (value.startsWith("/")) {
            return value;
        }

        return `/storage/${value}`;
    };

    const getBoardImageUrl = () => {
        if (board?.image_url) {
            return makeImageUrl(board.image_url);
        }

        if (board?.image) {
            return makeImageUrl(board.image);
        }

        return placeholderImage;
    };

    const getExhibitionImageUrl = (item) => {
        if (item?.image_url) {
            return makeImageUrl(item.image_url);
        }

        if (item?.image) {
            return makeImageUrl(item.image);
        }

        return placeholderImage;
    };

    const getSponsorImageUrl = (item) => {
        if (item?.sponsor_image_url) {
            return makeImageUrl(item.sponsor_image_url);
        }

        if (item?.sponsor_image) {
            return makeImageUrl(item.sponsor_image);
        }

        return placeholderImage;
    };

    const hasSponsorImage = (item) => {
        return Boolean(item?.sponsor_image_url || item?.sponsor_image);
    };

    const stripHtml = (html) => {
        if (!html) {
            return "";
        }

        return String(html).replace(/<[^>]+>/g, "");
    };

    const handleImageError = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = placeholderImage;
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

    const approveBoard = () => {
        router.post(
            route("admin.exhibition-boards.approve", board.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Board approved successfully");
                },
                onError: () => {
                    message.error("Failed to approve board");
                },
            }
        );
    };

    const submitRejectBoard = () => {
        router.post(
            route("admin.exhibition-boards.reject", board.id),
            {
                admin_note: rejectBoardNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Board rejected successfully");
                    setRejectBoardModalOpen(false);
                    setRejectBoardNote("");
                },
                onError: () => {
                    message.error("Failed to reject board");
                },
            }
        );
    };

    const approveMemberRequest = (requestId) => {
        router.post(
            route("admin.exhibition-board-member-requests.admin-approve", requestId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Member request approved by admin");
                },
                onError: () => {
                    message.error("Failed to approve member request");
                },
            }
        );
    };

    const openRejectMemberModal = (record) => {
        setSelectedMemberRequest(record);
        setRejectMemberNote("");
        setRejectMemberModalOpen(true);
    };

    const closeRejectMemberModal = () => {
        setSelectedMemberRequest(null);
        setRejectMemberNote("");
        setRejectMemberModalOpen(false);
    };

    const submitRejectMemberRequest = () => {
        if (!selectedMemberRequest) {
            return;
        }

        router.post(
            route(
                "admin.exhibition-board-member-requests.admin-reject",
                selectedMemberRequest.id
            ),
            {
                admin_note: rejectMemberNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Member request rejected by admin");
                    closeRejectMemberModal();
                },
                onError: () => {
                    message.error("Failed to reject member request");
                },
            }
        );
    };

    const deleteBoard = () => {
        router.delete(route("admin.exhibition-boards.destroy", board.id), {
            onSuccess: () => {
                message.success("Board deleted successfully");
            },
            onError: () => {
                message.error("Failed to delete board");
            },
        });
    };

    const exhibitionColumns = [
        {
            title: "Item",
            key: "item",
            render: (_, record) => {
                const imageUrl = getExhibitionImageUrl(record);

                return (
                    <Space>
                        <img
                            src={imageUrl}
                            alt={stripHtml(record.title) || "Exhibition"}
                            onError={handleImageError}
                            style={{
                                width: 65,
                                height: 55,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid #eee",
                                display: "block",
                                background: "#f5f5f5",
                            }}
                        />

                        <Space direction="vertical" size={0}>
                            <Text strong>{stripHtml(record.title)}</Text>

                            <Text type="secondary" style={{ fontSize: 12 }}>
                                By: {record.user?.name || "Unknown"}
                            </Text>
                        </Space>
                    </Space>
                );
            },
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
            title: "Sponsor",
            key: "sponsor",
            render: (_, record) => {
                const sponsorUrl = getSponsorImageUrl(record);

                return hasSponsorImage(record) ? (
                    <img
                        src={sponsorUrl}
                        alt="Sponsor"
                        onError={handleImageError}
                        style={{
                            width: 80,
                            height: 40,
                            objectFit: "contain",
                            border: "1px solid #eee",
                            borderRadius: 6,
                            background: "#fff",
                            display: "block",
                        }}
                    />
                ) : (
                    <Text type="secondary">N/A</Text>
                );
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Link href={route("admin.exhibitions.show", record.id)}>
                        <Button size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>
                </Space>
            ),
        },
    ];

    const memberRequestColumns = [
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
            title: "Request Message",
            dataIndex: "request_message",
            key: "request_message",
            render: (value) =>
                value ? (
                    <Tooltip title={value}>
                        <Text>
                            {value.length > 40 ? `${value.slice(0, 40)}...` : value}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Owner Note",
            dataIndex: "owner_note",
            key: "owner_note",
            render: (value) =>
                value ? (
                    <Tooltip title={value}>
                        <Text>
                            {value.length > 30 ? `${value.slice(0, 30)}...` : value}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Admin Note",
            dataIndex: "admin_note",
            key: "admin_note",
            render: (value) =>
                value ? (
                    <Tooltip title={value}>
                        <Text type="danger">
                            {value.length > 30 ? `${value.slice(0, 30)}...` : value}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Action",
            key: "action",
            width: 230,
            render: (_, record) => (
                <Space wrap>
                    {record.admin_status !== "approved" && (
                        <Popconfirm
                            title="Approve this member request?"
                            okText="Approve"
                            cancelText="Cancel"
                            onConfirm={() => approveMemberRequest(record.id)}
                        >
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                            >
                                Approve
                            </Button>
                        </Popconfirm>
                    )}

                    {record.admin_status !== "rejected" && (
                        <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => openRejectMemberModal(record)}
                        >
                            Reject
                        </Button>
                    )}
                </Space>
            ),
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
                    scroll={{ x: 1000 }}
                />
            ),
        },
        {
            key: "member-requests",
            label: (
                <span>
                    <TeamOutlined /> Member Requests
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={memberRequestColumns}
                    dataSource={board.member_requests || []}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: <Empty description="No member request found." />,
                    }}
                    scroll={{ x: 1150 }}
                />
            ),
        },
    ];

    const boardImageUrl = getBoardImageUrl();

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
                        <Link href={route("admin.exhibition-boards.index")}>
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
                                <UserOutlined /> Owner: {board.owner?.name || "Unknown"}
                            </Text>
                        </Space>
                    </div>

                    <Space wrap>
                        {board.approval_status !== "approved" && (
                            <Popconfirm
                                title="Approve this board?"
                                okText="Approve"
                                cancelText="Cancel"
                                onConfirm={approveBoard}
                            >
                                <Button type="primary" icon={<CheckCircleOutlined />}>
                                    Approve Board
                                </Button>
                            </Popconfirm>
                        )}

                        {board.approval_status !== "rejected" && (
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => setRejectBoardModalOpen(true)}
                            >
                                Reject Board
                            </Button>
                        )}

                        <Popconfirm
                            title="Delete this board?"
                            description="This action cannot be undone."
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                            onConfirm={deleteBoard}
                        >
                            <Button danger icon={<DeleteOutlined />}>
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "280px 1fr",
                        gap: 24,
                        marginBottom: 30,
                    }}
                    className="admin-board-show-grid"
                >
                    <div>
                        <img
                            src={boardImageUrl}
                            alt={board.title || "Board"}
                            onError={handleImageError}
                            style={{
                                width: "100%",
                                height: 190,
                                objectFit: "cover",
                                borderRadius: 12,
                                border: "1px solid #eee",
                                display: "block",
                                background: "#f5f5f5",
                            }}
                        />

                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                image: {board?.image || "N/A"}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                image_url: {board?.image_url || "N/A"}
                            </Text>
                        </div>
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
                                {board.slug || "N/A"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Owner">
                                {board.owner?.name || "Unknown"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Owner Email">
                                {board.owner?.email || "N/A"}
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

            <Modal
                title="Reject Board"
                open={rejectBoardModalOpen}
                onCancel={() => {
                    setRejectBoardModalOpen(false);
                    setRejectBoardNote("");
                }}
                onOk={submitRejectBoard}
                okText="Reject"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="Board">
                        <Input value={board.title || ""} disabled />
                    </Form.Item>

                    <Form.Item label="Admin Note">
                        <TextArea
                            rows={4}
                            value={rejectBoardNote}
                            onChange={(e) => setRejectBoardNote(e.target.value)}
                            placeholder="Write rejection reason or admin note..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Reject Member Request"
                open={rejectMemberModalOpen}
                onCancel={closeRejectMemberModal}
                onOk={submitRejectMemberRequest}
                okText="Reject"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="Requested User">
                        <Input
                            value={selectedMemberRequest?.user?.name || ""}
                            disabled
                        />
                    </Form.Item>

                    <Form.Item label="Admin Note">
                        <TextArea
                            rows={4}
                            value={rejectMemberNote}
                            onChange={(e) => setRejectMemberNote(e.target.value)}
                            placeholder="Write rejection reason or admin note..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                @media (max-width: 768px) {
                    .admin-board-show-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </Authenticated>
    );
}
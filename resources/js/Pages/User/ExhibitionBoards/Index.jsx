import { Link, router } from "@inertiajs/react";
import Authenticated from "@/Layouts/FrontAuthenticatedLayout";
import { useState } from "react";
import {
    Card,
    Button,
    Table,
    Tag,
    Space,
    Typography,
    Image,
    Badge,
    Tooltip,
    Popconfirm,
    message,
    Tabs,
    Empty,
    Modal,
    Input,
} from "antd";
import {
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    AppstoreOutlined,
    UsergroupAddOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Index({
    auth,
    myBoards = [],
    joinedBoards = [],
    pendingRequests = [],
    availableBoards = [],
}) {
    const [requestBoard, setRequestBoard] = useState(null);
    const [requestMessage, setRequestMessage] = useState("");
    const [requesting, setRequesting] = useState(false);

    const getImageUrl = (recordOrPath) => {
        if (!recordOrPath) {
            return "/placeholder-image.jpg";
        }

        if (typeof recordOrPath === "object") {
            if (recordOrPath.image_url) {
                return recordOrPath.image_url;
            }

            if (recordOrPath.image) {
                if (recordOrPath.image.startsWith("http")) {
                    return recordOrPath.image;
                }

                return `/storage/${recordOrPath.image}`;
            }

            return "/placeholder-image.jpg";
        }

        if (recordOrPath.startsWith("http")) {
            return recordOrPath;
        }

        return `/storage/${recordOrPath}`;
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

    const handleDelete = (id) => {
        router.delete(route("user.exhibition-boards.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                message.success("Board deleted successfully");
            },
            onError: () => {
                message.error("Failed to delete board");
            },
        });
    };

    const approveOwnerRequest = (requestId) => {
        router.post(
            route(
                "user.exhibition-board-member-requests.owner-approve",
                requestId,
            ),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        "Request approved. Waiting for admin approval.",
                    );
                },
                onError: () => {
                    message.error("Failed to approve request");
                },
            },
        );
    };

    const rejectOwnerRequest = (requestId) => {
        router.post(
            route(
                "user.exhibition-board-member-requests.owner-reject",
                requestId,
            ),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success("Request rejected");
                },
                onError: () => {
                    message.error("Failed to reject request");
                },
            },
        );
    };

    const openRequestModal = (board) => {
        setRequestBoard(board);
        setRequestMessage("");
    };

    const closeRequestModal = () => {
        setRequestBoard(null);
        setRequestMessage("");
    };

    const submitRequestAccess = () => {
        if (!requestBoard) {
            return;
        }

        setRequesting(true);

        router.post(
            route("user.exhibition-boards.request-access", requestBoard.id),
            { request_message: requestMessage },
            {
                preserveScroll: true,
                onSuccess: () => {
                    message.success(
                        "Request sent. Board owner and admin approval required.",
                    );
                    closeRequestModal();
                },
                onError: (errors) => {
                    message.error(
                        errors?.request_message || "Failed to send request",
                    );
                },
                onFinish: () => setRequesting(false),
            },
        );
    };

    const myBoardColumns = [
        {
            title: "Board",
            key: "board",
            render: (_, record) => (
                <Space>
                    <Image
                        width={70}
                        height={55}
                        src={getImageUrl(record)}
                        fallback="/placeholder-image.jpg"
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid #eee",
                        }}
                    />

                    <Space direction="vertical" size={0}>
                        <Text strong>{record.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Slug: {record.slug}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Approval",
            dataIndex: "approval_status",
            key: "approval_status",
            render: (status) => (
                <Tag
                    color={getApprovalColor(status)}
                    icon={getApprovalIcon(status)}
                >
                    {status ? status.toUpperCase() : "PENDING"}
                </Tag>
            ),
        },
        {
            title: "Active",
            dataIndex: "is_active",
            key: "is_active",
            render: (isActive) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={isActive ? "Active" : "Inactive"}
                />
            ),
        },
        {
            title: "Exhibitions",
            key: "exhibitions",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>
                        Total: <strong>{record.exhibitions_count || 0}</strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Approved: {record.approved_exhibitions_count || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Admin Note",
            dataIndex: "admin_note",
            key: "admin_note",
            render: (note) =>
                note ? (
                    <Tooltip title={note}>
                        <Text type="danger">
                            {note.length > 30
                                ? `${note.slice(0, 30)}...`
                                : note}
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
                    <Link
                        href={route("user.exhibition-boards.show", record.id)}
                    >
                        <Button size="small" icon={<EyeOutlined />}>
                            View
                        </Button>
                    </Link>

                    <Link
                        href={route("user.exhibition-boards.edit", record.id)}
                    >
                        <Button
                            size="small"
                            type="primary"
                            icon={<EditOutlined />}
                        >
                            Edit
                        </Button>
                    </Link>

                    <Popconfirm
                        title="Delete this board?"
                        description="This action cannot be undone."
                        okText="Yes"
                        cancelText="No"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const joinedBoardColumns = [
        {
            title: "Board",
            key: "board",
            render: (_, record) => (
                <Space>
                    <Image
                        width={70}
                        height={55}
                        src={getImageUrl(record)}
                        fallback="/placeholder-image.jpg"
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid #eee",
                        }}
                    />

                    <Space direction="vertical" size={0}>
                        <Text strong>{record.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Owner: {record.owner?.name || "Unknown"}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Approval",
            dataIndex: "approval_status",
            key: "approval_status",
            render: (status) => (
                <Tag
                    color={getApprovalColor(status)}
                    icon={getApprovalIcon(status)}
                >
                    {status ? status.toUpperCase() : "PENDING"}
                </Tag>
            ),
        },
        {
            title: "Active",
            dataIndex: "is_active",
            key: "is_active",
            render: (isActive) => (
                <Badge
                    status={isActive ? "success" : "default"}
                    text={isActive ? "Active" : "Inactive"}
                />
            ),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Link href={route("user.exhibition-boards.show", record.id)}>
                    <Button size="small" icon={<EyeOutlined />}>
                        View
                    </Button>
                </Link>
            ),
        },
    ];

    const availableBoardColumns = [
        {
            title: "Board",
            key: "board",
            render: (_, record) => (
                <Space>
                    <Image
                        width={70}
                        height={55}
                        src={getImageUrl(record)}
                        fallback="/placeholder-image.jpg"
                        style={{
                            borderRadius: 8,
                            objectFit: "cover",
                            border: "1px solid #eee",
                        }}
                    />

                    <Space direction="vertical" size={0}>
                        <Text strong>{record.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Owner: {record.owner?.name || "Unknown"}
                        </Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (description) =>
                description ? (
                    <Tooltip title={description}>
                        <Text>
                            {description.length > 60
                                ? `${description.slice(0, 60)}...`
                                : description}
                        </Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: "Exhibitions",
            key: "exhibitions",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>
                        Total: <strong>{record.exhibitions_count || 0}</strong>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Approved: {record.approved_exhibitions_count || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Action",
            key: "action",
            width: 200,
            render: (_, record) => (
                <Button
                    size="small"
                    type="primary"
                    icon={<UsergroupAddOutlined />}
                    onClick={() => openRequestModal(record)}
                >
                    Request Access
                </Button>
            ),
        },
    ];

    const requestColumns = [
        {
            title: "Board",
            key: "board",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.board?.title || "N/A"}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Owner: {record.board?.owner?.name || "Unknown"}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Requested User",
            key: "user",
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.user?.name || "Unknown"}</Text>
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
                <Tag color={getApprovalColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Admin Status",
            dataIndex: "admin_status",
            key: "admin_status",
            render: (status) => (
                <Tag color={getApprovalColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Final Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getApprovalColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Message",
            dataIndex: "request_message",
            key: "request_message",
            render: (messageText) =>
                messageText ? (
                    <Tooltip title={messageText}>
                        <Text>
                            {messageText.length > 30
                                ? `${messageText.slice(0, 30)}...`
                                : messageText}
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
                const isOwnerOfBoard = record.board?.user_id === auth.user.id;
                const canOwnerApprove =
                    isOwnerOfBoard && record.owner_status === "pending";

                if (!canOwnerApprove) {
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
            key: "my-boards",
            label: (
                <span>
                    <AppstoreOutlined /> My Boards
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={myBoardColumns}
                    dataSource={myBoards}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: (
                            <Empty description="No board found. Create your first board." />
                        ),
                    }}
                    scroll={{ x: 900 }}
                />
            ),
        },
        {
            key: "joined-boards",
            label: (
                <span>
                    <TeamOutlined /> Joined Boards
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={joinedBoardColumns}
                    dataSource={joinedBoards}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: (
                            <Empty description="No joined board found." />
                        ),
                    }}
                    scroll={{ x: 700 }}
                />
            ),
        },
        {
            key: "available-boards",
            label: (
                <span>
                    <UsergroupAddOutlined /> Available Boards
                    {availableBoards.length > 0 &&
                        ` (${availableBoards.length})`}
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={availableBoardColumns}
                    dataSource={availableBoards}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: (
                            <Empty description="No board available to join right now." />
                        ),
                    }}
                    scroll={{ x: 900 }}
                />
            ),
        },
        {
            key: "requests",
            label: (
                <span>
                    <ClockCircleOutlined /> Board Requests
                </span>
            ),
            children: (
                <Table
                    rowKey="id"
                    columns={requestColumns}
                    dataSource={pendingRequests}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                    }}
                    locale={{
                        emptyText: <Empty description="No request found." />,
                    }}
                    scroll={{ x: 1100 }}
                />
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Exhibition Boards">
            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 24,
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <Title level={3} style={{ marginBottom: 4 }}>
                            Exhibition Boards
                        </Title>
                        <Text type="secondary">
                            Create boards, manage approval requests, and post
                            exhibitions under approved boards.
                        </Text>
                    </div>

                    {/* <Link href={route("user.exhibition-boards.create")}>
                        <Button type="primary" icon={<PlusOutlined />}>
                            Create Board
                        </Button>
                    </Link> */}
                </div>

                <Tabs defaultActiveKey="my-boards" items={tabItems} />
            </Card>

            <Modal
                title={`Request access to "${requestBoard?.title || ""}"`}
                open={!!requestBoard}
                onOk={submitRequestAccess}
                onCancel={closeRequestModal}
                okText="Send Request"
                cancelText="Cancel"
                confirmLoading={requesting}
                destroyOnClose
            >
                <Text type="secondary">
                    Your request needs approval from the board owner and then
                    from an admin before you can post exhibitions under this
                    board.
                </Text>

                <Input.TextArea
                    rows={4}
                    maxLength={1000}
                    showCount
                    style={{ marginTop: 16 }}
                    placeholder="Optional message to the board owner"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                />
            </Modal>
        </Authenticated>
    );
}

import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { Link, router, usePage } from "@inertiajs/react";
import {
    Button,
    Card,
    message,
    Popconfirm,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";

const { Title, Text } = Typography;

export default function Index({ users }) {
    const { auth } = usePage().props;

    console.log("User Page ");
    console.log(auth);

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        console.log("Delete user with ID:", id);
        router.delete(route("admin.users.destroy", id), {
            onSuccess: () => {
                message.success("User deleted successfully");
            },
            onError: () => {
                message.error("Error deleting user");
            },
        });
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space>
                    <Text strong>{text}</Text>
                    {record.id === auth.user.id && <Tag color="blue">You</Tag>}
                </Space>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Registration Date",
            dataIndex: "created_at",
            key: "created_at",
        },
        {
            title: "Roles",
            dataIndex: "roles",
            key: "roles",
            render: (roles) => (
                <Space size="small">
                    {roles.map((role) => (
                        <Tag
                            key={role.id}
                            color={
                                role.name === "admin"
                                    ? "red"
                                    : role.name === "user"
                                      ? "blue"
                                      : "default"
                            }
                        >
                            {role.name}
                        </Tag>
                    ))}
                </Space>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    {
                        <Tooltip title="Edit User">
                            <Link href={route("admin.users.edit", record.id)}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    size="small"
                                    disabled={record.id === auth.user.id}
                                >
                                    Edit
                                </Button>
                            </Link>
                        </Tooltip>
                    }

                    {record.id !== auth.user.id && (
                        <Popconfirm
                            title="Delete User"
                            description="Are you sure you want to delete this user?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                            placement="top"
                        >
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="User Management">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <TeamOutlined className="mr-2" />
                            Users
                        </Title>
                        <Text type="secondary">
                            Manage your application users and their roles
                        </Text>
                    </div>

                    {can("admin.users.create") && (
                        <Link href={route("admin.users.create")}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                            >
                                Add User
                            </Button>
                        </Link>
                    )}
                </div>

                <Table
                    columns={columns}
                    dataSource={users.map((user) => ({
                        ...user,
                        key: user.id,
                    }))}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </Authenticated>
    );
}

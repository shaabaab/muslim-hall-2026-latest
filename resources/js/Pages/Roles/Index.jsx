import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { Link, router } from "@inertiajs/react";
import {
    Badge,
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

export default function Index({ roles, permissions, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };
    //console.log(permissions);

    const handleDelete = (id) => {
        router.delete(route("admin.roles.destroy", id), {
            onSuccess: () => {
                message.success("Role deleted successfully");
            },
            onError: () => {
                message.error("Error deleting role");
            },
        });
    };

    const columns = [
        {
            title: "Role Name",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Permissions",
            dataIndex: "permissions",
            key: "permissions",
            render: (permissions) => (
                <Space wrap>
                    {permissions.slice(0, 3).map((permission) => (
                        <Tag key={permission.id} color="blue">
                            {permission.name}
                        </Tag>
                    ))}
                    {permissions.length > 3 && (
                        <Badge
                            count={`+${permissions.length - 3}`}
                            style={{ backgroundColor: "#52c41a" }}
                        />
                    )}
                </Space>
            ),
        },
        {
            title: "Users Count",
            dataIndex: "users_count",
            key: "users_count",
            render: (count) => (
                <Tag color={count > 0 ? "green" : "default"}>{count} users</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    {(
                        <Tooltip title="Edit Role">
                            <Link href={route("admin.roles.edit", record.id)}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    size="small"
                                >
                                    Edit
                                </Button>
                            </Link>
                        </Tooltip>
                    )}

                    {record.name !== "admin" && (
                        <Popconfirm
                            title="Delete Role"
                            description="Are you sure to delete this role?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete Role">
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                >
                                    Delete
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Roles & Permissions">
    <Card
        className="rounded-xl shadow-sm"
        bodyStyle={{ padding: "16px" }}
    >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
                <Title level={3} className="!mb-1 flex items-center gap-2">
                    <SafetyCertificateOutlined />
                    Roles & Permissions
                </Title>
                <Text type="secondary" className="text-sm sm:text-base">
                    Manage roles and their permissions in the system
                </Text>
            </div>

            {can("admin.roles.create") && (
                <Link href={route("admin.roles.create")}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="w-full sm:w-auto"
                    >
                        Add Role
                    </Button>
                </Link>
            )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <Table
                columns={columns}
                dataSource={roles.map((role) => ({
                    ...role,
                    key: role.id,
                    users_count: role.users_count || 0,
                }))}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    responsive: true,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                }}
                scroll={{ x: 900 }}
            />
        </div>
    </Card>
</Authenticated>
    );
}

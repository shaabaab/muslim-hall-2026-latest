import Authenticated from "@/Layouts/AuthenticatedLayout";
import { router } from "@inertiajs/react";

import { DeleteOutlined, TeamOutlined } from "@ant-design/icons";
import {
    Button,
    Card,
    message,
    Popconfirm,
    Space,
    Table,
    Tooltip,
    Typography,
} from "antd";

const { Title, Text } = Typography;

export default function Index({ comments, auth }) {
    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route("admin.comments.destroy", id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log("Confirmed");
            },
            onSuccess: () => {
                message.success("Language deleted successfully");
            },
            onError: () => {
                message.error("Error deleting language");
            },
        });
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },

        {
            title: "Post Title",
            key: "title",
            render: (_, record) => (
                <Text>{record.post ? record.post.title : "N/A"}</Text>
            ),
        },

        {
            title: "Comment",
            dataIndex: "comment",
            key: "comment",
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: "Commented By",
            key: "name",
            render: (_, record) => (
                <Text>
                    {record.comment_by
                        ? record.comment_by.name +
                          " (" +
                          record.comment_by.email +
                          ")"
                        : "N/A"}
                </Text>
            ),
        },

        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="small">
                    <Popconfirm
                        title="Delete Comment"
                        description="Are you sure to delete this Comment?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Comment">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            >
                                Delete
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated user={auth.user} header="Sections Management">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <TeamOutlined className="mr-2" />
                            Comments
                        </Title>
                        <Text type="secondary">
                            Manage your application comments
                        </Text>
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={comments.map((comment) => ({
                        ...comment,
                        key: comment.id,
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

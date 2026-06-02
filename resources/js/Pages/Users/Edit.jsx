import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    MailOutlined,
    SafetyCertificateOutlined,
    SaveOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Input,
    message,
    Row,
    Select,
    Space,
    Tag,
    Typography,
} from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ user, roles, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        roles: user.roles.map((role) => role.name),
        is_active: true,
    });

    const submit = () => {
        put(route("admin.users.update", user.id), {
            onSuccess: () => {
                message.success("User updated successfully");
            },
            onError: () => {
                message.error("Error updating user");
            },
        });
    };

    const isCurrentUser = user.id === auth.user.id;

    return (
        <Authenticated user={auth.user} header="Edit User">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.users.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Users
                        </Button>
                    </Link>

                    <div className="flex justify-between items-start">
                        <div>
                            <Title level={3}>
                                <UserOutlined className="mr-2" />
                                Edit User: {user.name}
                            </Title>
                            <Text type="secondary">
                                Update user information and role assignments
                            </Text>
                        </div>

                        {isCurrentUser && (
                            <Alert
                                message="You are editing your own profile"
                                type="info"
                                showIcon
                            />
                        )}
                    </div>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col xs={24} lg={12}>
                            <Card
                                title="Basic Information"
                                size="default"
                                className="mb-4"
                            >
                                <Form.Item
                                    label="Full Name"
                                    validateStatus={errors.name ? "error" : ""}
                                    help={errors.name}
                                    required
                                >
                                    <Input
                                        size="large"
                                        prefix={<UserOutlined />}
                                        placeholder="Enter full name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Email Address"
                                    validateStatus={errors.email ? "error" : ""}
                                    help={errors.email}
                                    required
                                >
                                    <Input
                                        size="large"
                                        prefix={<MailOutlined />}
                                        type="email"
                                        placeholder="Enter email address"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                </Form.Item>

                                {/* <Form.Item label="Account Status">
                                    <Space>
                                        <Switch
                                            checked={data.is_active}
                                            onChange={(checked) => setData('is_active', checked)}
                                        />
                                        <Text>
                                            {data.is_active ? 'Active' : 'Inactive'}
                                        </Text>
                                    </Space>
                                </Form.Item> */}
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card
                                title="Role Assignment"
                                size="default"
                                extra={<SafetyCertificateOutlined />}
                            >
                                <Form.Item
                                    label="Roles"
                                    validateStatus={errors.roles ? "error" : ""}
                                    help={errors.roles}
                                    required
                                >
                                    <Select
                                        mode="multiple"
                                        size="large"
                                        placeholder="Select roles"
                                        value={data.roles}
                                        onChange={(value) =>
                                            setData("roles", value)
                                        }
                                        suffixIcon={<TeamOutlined />}
                                        disabled={isCurrentUser}
                                    >
                                        {roles.map((role) => (
                                            <Option
                                                key={role.id}
                                                value={role.name}
                                            >
                                                <Space>
                                                    <span>{role.name}</span>
                                                    <Tag
                                                        color={
                                                            role.name ===
                                                            "admin"
                                                                ? "red"
                                                                : role.name ===
                                                                    "user"
                                                                  ? "blue"
                                                                  : "green"
                                                        }
                                                    >
                                                        {role.users_count || 0}{" "}
                                                        users
                                                    </Tag>
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {isCurrentUser && (
                                    <Alert
                                        message="You cannot change your own roles"
                                        type="warning"
                                        showIcon
                                    />
                                )}

                                <div className="mt-4">
                                    <Text strong>Current Permissions:</Text>
                                    <div className="mt-2">
                                        {user.roles.map((role) => (
                                            <Tag
                                                key={role.id}
                                                color="blue"
                                                className="mb-1"
                                            >
                                                {role.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Form.Item className="mt-6">
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                                disabled={
                                    isCurrentUser && data.roles.length === 0
                                }
                            >
                                Update User
                            </Button>
                            <Link href={route("admin.users.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>
                        </Space>

                        {isCurrentUser && data.roles.length === 0 && (
                            <div className="mt-2">
                                <Text type="danger">
                                    You must have at least one role assigned
                                </Text>
                            </div>
                        )}
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}

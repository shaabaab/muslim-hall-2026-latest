import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    LockOutlined,
    MailOutlined,
    SaveOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import {
    Button,
    Card,
    Form,
    Input,
    Select,
    Space,
    Typography,
    message,
} from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

export default function Create({ roles, auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        roles: [],
    });

    const submit = () => {
        post(route("admin.users.store"), {
            onSuccess: () => {
                message.success("User created successfully");
            },
            onError: () => {
                message.error("Error creating user");
            },
        });
    };

    return (
        <Authenticated user={auth.user} header="Create User">
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
                    <Title level={3}>
                        <UserOutlined className="mr-2" />
                        Create New User
                    </Title>
                    <Text type="secondary">
                        Add a new user to your application and assign roles
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-2xl">
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
                            onChange={(e) => setData("name", e.target.value)}
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
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        validateStatus={errors.password ? "error" : ""}
                        help={errors.password}
                        required
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Enter password"
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Confirm Password"
                        validateStatus={
                            errors.password_confirmation ? "error" : ""
                        }
                        help={errors.password_confirmation}
                        required
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Confirm password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData("password_confirmation", e.target.value)
                            }
                        />
                    </Form.Item>

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
                            onChange={(value) => setData("roles", value)}
                            suffixIcon={<TeamOutlined />}
                        >
                            {roles.map((role) => (
                                <Option key={role.id} value={role.name}>
                                    {role.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create User
                            </Button>
                            <Link href={route("admin.users.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}

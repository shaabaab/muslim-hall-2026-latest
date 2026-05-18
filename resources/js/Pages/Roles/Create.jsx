import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    ArrowLeftOutlined,
    KeyOutlined,
    SafetyCertificateOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { Link, useForm } from "@inertiajs/react";
import {
    Button,
    Card,
    Col,
    Divider,
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

export default function Create({ permissions, auth }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        permissions: [],
    });

    const submit = () => {
        post(route("admin.roles.store"), {
            onSuccess: () => {
                message.success("Role created successfully");
            },
            onError: () => {
                message.error("Error creating role");
            },
        });
    };

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.name.split(".")[0];
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {});

    return (
        <Authenticated user={auth.user} header="Create Role">
            <Card>
                <div className="mb-6">
                    <Link href={route("admin.roles.index")}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            type="text"
                            className="mb-4"
                        >
                            Back to Roles
                        </Button>
                    </Link>
                    <Title level={3}>
                        <SafetyCertificateOutlined className="mr-2" />
                        Create New Role
                    </Title>
                    <Text type="secondary">
                        Create a new role and assign permissions to it
                    </Text>
                </div>

                <Form layout="vertical" onFinish={submit} className="max-w-4xl">
                    <Row gutter={24}>
                        <Col xs={24} lg={12}>
                            <Form.Item
                                label="Role Name"
                                validateStatus={errors.name ? "error" : ""}
                                help={errors.name}
                                required
                            >
                                <Input
                                    size="large"
                                    prefix={<KeyOutlined />}
                                    placeholder="Enter role name (e.g., manager, editor)"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label="Permissions"
                                validateStatus={
                                    errors.permissions ? "error" : ""
                                }
                                help={errors.permissions}
                                required
                            >
                                <Select
                                    mode="multiple"
                                    size="large"
                                    placeholder="Select permissions"
                                    value={data.permissions}
                                    onChange={(value) =>
                                        setData("permissions", value)
                                    }
                                    style={{ width: "100%" }}
                                    optionLabelProp="label"
                                >
                                    {permissions.map((permission) => (
                                        <Option
                                            key={permission.id}
                                            value={permission.name}
                                            label={permission.name}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{permission.name}</span>
                                                <Tag color="blue" size="small">
                                                    {
                                                        permission.name.split(
                                                            "."
                                                        )[0]
                                                    }
                                                </Tag>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card
                                title="Selected Permissions"
                                size="small"
                                style={{ height: "100%" }}
                            >
                                {data.permissions.length === 0 ? (
                                    <Text type="secondary">
                                        No permissions selected
                                    </Text>
                                ) : (
                                    <Space
                                        direction="vertical"
                                        style={{ width: "100%" }}
                                    >
                                        {Object.entries(groupedPermissions).map(
                                            ([module, modulePermissions]) => {
                                                const selectedModulePermissions =
                                                    modulePermissions.filter(
                                                        (p) =>
                                                            data.permissions.includes(
                                                                p.name
                                                            )
                                                    );

                                                if (
                                                    selectedModulePermissions.length ===
                                                    0
                                                )
                                                    return null;

                                                return (
                                                    <div key={module}>
                                                        <Text
                                                            strong
                                                            className="capitalize"
                                                        >
                                                            {module} Module
                                                        </Text>
                                                        <div className="mt-2">
                                                            {selectedModulePermissions.map(
                                                                (
                                                                    permission
                                                                ) => (
                                                                    <Tag
                                                                        key={
                                                                            permission.id
                                                                        }
                                                                        color="green"
                                                                        closable
                                                                        onClose={() => {
                                                                            setData(
                                                                                "permissions",
                                                                                data.permissions.filter(
                                                                                    (
                                                                                        p
                                                                                    ) =>
                                                                                        p !==
                                                                                        permission.name
                                                                                )
                                                                            );
                                                                        }}
                                                                        style={{
                                                                            marginBottom:
                                                                                "4px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            permission.name
                                                                        }
                                                                    </Tag>
                                                                )
                                                            )}
                                                        </div>
                                                        <Divider
                                                            style={{
                                                                margin: "12px 0",
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            }
                                        )}
                                    </Space>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Create Role
                            </Button>
                            <Link href={route("admin.roles.index")}>
                                <Button size="large">Cancel</Button>
                            </Link>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </Authenticated>
    );
}

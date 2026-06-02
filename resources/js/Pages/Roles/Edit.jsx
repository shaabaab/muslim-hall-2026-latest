import { useForm } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Select, 
    Typography, 
    Space,
    message,
    Row,
    Col,
    Tag,
    Divider,
    Descriptions
} from 'antd';
import { 
    SafetyCertificateOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    KeyOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Edit({ role, permissions, auth }) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions.map(p => p.name),
    });

    const submit = () => {
        put(route('admin.roles.update', role.id), {
            onSuccess: () => {
                message.success('Role updated successfully');
            },
            onError: () => {
                message.error('Error updating role');
            }
        });
    };

    const groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.name.split('.')[0];
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {});

    return (
        <Authenticated
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <SafetyCertificateOutlined className="mr-2 text-blue-600" />
                        <span>Edit Role: {role.name}</span>
                    </div>
                </div>
            }
        >
            <Card>
                <div style={{ marginBottom: 24 }}>
                    <Link href={route('admin.roles.index')}>
                        <Button icon={<ArrowLeftOutlined />} type="text" style={{ marginBottom: 16 }}>
                            Back to Roles
                        </Button>
                    </Link>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 16
                    }}>
                        <div style={{ flex: 1, minWidth: 300 }}>
                            <Title level={3} style={{ margin: 0 }}>
                                Edit Role: {role.name}
                            </Title>
                            <Text type="secondary">
                                Update role details and permissions
                            </Text>
                        </div>
                        
                        <Descriptions size="small" column={1} style={{ marginBottom: 0 }}>
                            <Descriptions.Item label={
                                <span>
                                    <TeamOutlined style={{ marginRight: 4 }} />
                                    Users
                                </span>
                            }>
                                {role.users_count || 0}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                </div>

                <Form
                    layout="vertical"
                    onFinish={submit}
                    style={{ maxWidth: '100%' }}
                >
                    <Row gutter={[24, 16]}>
                        <Col xs={24} lg={12}>
                            <Card 
                                title="Role Information" 
                                style={{ height: '100%' }}
                                styles={{ body: { paddingTop: 16 } }}
                            >
                                <Form.Item
                                    label="Role Name"
                                    validateStatus={errors.name ? 'error' : ''}
                                    help={errors.name}
                                    required
                                    style={{ marginBottom: 16 }}
                                >
                                    <Input
                                        size="large"
                                        prefix={<KeyOutlined />}
                                        placeholder="Enter role name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Permissions"
                                    validateStatus={errors.permissions ? 'error' : ''}
                                    help={errors.permissions}
                                    required
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        mode="multiple"
                                        size="large"
                                        placeholder="Select permissions"
                                        value={data.permissions}
                                        onChange={(value) => setData('permissions', value)}
                                        style={{ width: '100%' }}
                                        optionLabelProp="label"
                                        dropdownStyle={{ zIndex: 9999 }}
                                    >
                                        {permissions.map(permission => (
                                            <Option 
                                                key={permission.id} 
                                                value={permission.name}
                                                label={permission.name}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}>
                                                    <span>{permission.name}</span>
                                                    <Tag color="blue" size="small">
                                                        {permission.name.split('.')[0]}
                                                    </Tag>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card 
                                title="Selected Permissions" 
                                style={{ height: '100%' }}
                                extra={
                                    <Text strong>
                                        {data.permissions.length} permissions
                                    </Text>
                                }
                            >
                                {data.permissions.length === 0 ? (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '20px 0',
                                        color: '#999'
                                    }}>
                                        <SafetyCertificateOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                        <div>No permissions selected</div>
                                    </div>
                                ) : (
                                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                                        {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                                            const selectedModulePermissions = modulePermissions.filter(
                                                p => data.permissions.includes(p.name)
                                            );
                                            
                                            if (selectedModulePermissions.length === 0) return null;

                                            return (
                                                <div key={module} style={{ marginBottom: 16 }}>
                                                    <Text strong style={{ 
                                                        textTransform: 'capitalize',
                                                        display: 'block',
                                                        marginBottom: 8
                                                    }}>
                                                        {module} Module ({selectedModulePermissions.length})
                                                    </Text>
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexWrap: 'wrap',
                                                        gap: 8
                                                    }}>
                                                        {selectedModulePermissions.map(permission => (
                                                            <Tag 
                                                                key={permission.id}
                                                                color="green"
                                                                closable
                                                                onClose={(e) => {
                                                                    e.preventDefault();
                                                                    setData('permissions', 
                                                                        data.permissions.filter(p => p !== permission.name)
                                                                    );
                                                                }}
                                                                style={{ 
                                                                    margin: 0,
                                                                    padding: '4px 8px',
                                                                    borderRadius: 6
                                                                }}
                                                            >
                                                                {permission.name.split('.')[1] || permission.name}
                                                            </Tag>
                                                        ))}
                                                    </div>
                                                    {module !== Object.keys(groupedPermissions)[Object.keys(groupedPermissions).length - 1] && (
                                                        <Divider style={{ margin: '12px 0' }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    <div style={{ 
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={processing}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Update Role
                            </Button>
                            <Link href={route('admin.roles.index')}>
                                <Button size="large">
                                    Cancel
                                </Button>
                            </Link>
                        </Space>
                    </div>
                </Form>
            </Card>
        </Authenticated>
    );
}
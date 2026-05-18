import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Tag, 
    Typography, 
    Row, 
    Col, 
    Statistic,
    Divider,
    Popconfirm,
    message,
    Tooltip,
    Badge
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    PhoneOutlined, 
    MailOutlined, 
    EnvironmentOutlined,
    TeamOutlined,
    GlobalOutlined,
    CopyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Index({ auth, contactInfo }) {
    // Function to handle deletion
    const handleDelete = (id) => {
        router.delete(route('admin.settings.contactinfo.destroy', id), {
            onSuccess: () => {
                message.success('Contact information deleted successfully');
            },
            onError: () => {
                message.error('Error deleting contact information');
            }
        });
    };

    // Copy to clipboard function
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            message.success('Copied to clipboard!');
        });
    };

    // Table columns
    const columns = [
        {
            title: 'Primary Phone',
            dataIndex: 'phone_one',
            key: 'phone_one',
            render: (phone) => (
                <Space>
                    <PhoneOutlined className="text-blue-500" />
                    <Text strong>{phone || 'N/A'}</Text>
                    {phone && (
                        <Tooltip title="Copy phone number">
                            <Button 
                                type="text" 
                                icon={<CopyOutlined />} 
                                size="small"
                                onClick={() => copyToClipboard(phone)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Primary Email',
            dataIndex: 'email_one',
            key: 'email_one',
            render: (email) => (
                <Space>
                    <MailOutlined className="text-green-500" />
                    <Text strong>{email || 'N/A'}</Text>
                    {email && (
                        <Tooltip title="Copy email">
                            <Button 
                                type="text" 
                                icon={<CopyOutlined />} 
                                size="small"
                                onClick={() => copyToClipboard(email)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
        {
            title: 'Location',
            key: 'location',
            render: (record) => (
                <Space direction="vertical" size="small">
                    <div>
                        <EnvironmentOutlined className="text-purple-500 mr-2" />
                        {record.address.city && record.address.state ? `${record.address.city}, ${record.address.state}` : 'N/A'}
                    </div>
                    <Text type="secondary" className="text-xs mr-2">
                        {record.address.street + ' (' + record.address.zip + ')' || 'No address provided'}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (record) => (
                <Badge 
                    status="success" 
                    text="Active" 
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record) => (
                <Space size="middle">
                    <Link href={route('admin.settings.contactinfo.edit', record.id)}>
                        <Tooltip title="Edit">
                            <Button 
                                type="primary" 
                                icon={<EditOutlined />} 
                                size="small"
                                className="bg-blue-500 hover:bg-blue-600 border-0"
                            />
                        </Tooltip>
                    </Link>
                    <Popconfirm
                        title="Delete Contact Information"
                        description="Are you sure you want to delete this contact information?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete">
                            <Button 
                                type="primary" 
                                icon={<DeleteOutlined />} 
                                size="small"
                                danger
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // Statistics data
    const totalContacts = contactInfo.length;
    // const contactsWithPhone = contactInfo.filter(item => item.phone_one).length;
    // const contactsWithEmail = contactInfo.filter(item => item.email_one).length;
    // const contactsWithAddress = contactInfo.filter(item => item.street && item.city).length;

    return (
        <Authenticated
            user={auth.user}
            header={'Contact'}
        >
            {/* Statistics Overview */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={6}>
                    <Card className="text-center shadow-sm border-0 bg-gradient-to-r from-blue-50 to-blue-100">
                        <Statistic
                            title="Total Contacts"
                            value={totalContacts}
                            prefix={<TeamOutlined className="text-blue-500" />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card className="text-center shadow-sm border-0 bg-gradient-to-r from-green-50 to-green-100">
                        <Statistic
                            title="With Phone"
                            // value={contactsWithPhone}
                            prefix={<PhoneOutlined className="text-green-500" />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card className="text-center shadow-sm border-0 bg-gradient-to-r from-orange-50 to-orange-100">
                        <Statistic
                            title="With Email"
                            // value={contactsWithEmail}
                            prefix={<MailOutlined className="text-orange-500" />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={6}>
                    <Card className="text-center shadow-sm border-0 bg-gradient-to-r from-purple-50 to-purple-100">
                        <Statistic
                            title="With Address"
                            // value={contactsWithAddress}
                            prefix={<EnvironmentOutlined className="text-purple-500" />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Card className="mb-6 shadow-sm border-0">
                <Title level={4} className="text-gray-700 mb-4">
                    Quick Actions
                </Title>
                <Space size="middle" wrap>
                    <Button 
                        icon={<PhoneOutlined />}
                        onClick={() => {
                            const primaryPhone = contactInfo[0]?.phone_one;
                            if (primaryPhone) {
                                copyToClipboard(primaryPhone);
                            } else {
                                message.warning('No primary phone number available');
                            }
                        }}
                    >
                        Copy Primary Phone
                    </Button>
                    <Button 
                        icon={<MailOutlined />}
                        onClick={() => {
                            const primaryEmail = contactInfo[0]?.email_one;
                            if (primaryEmail) {
                                copyToClipboard(primaryEmail);
                            } else {
                                message.warning('No primary email available');
                            }
                        }}
                    >
                        Copy Primary Email
                    </Button>
                </Space>
            </Card>

            <Card 
                title={
                    <Space>
                        <TeamOutlined className="text-blue-500" />
                        <span className="text-lg font-semibold">Contact Information List</span>
                        <Tag color="blue" className="ml-2">
                            {totalContacts} {totalContacts === 1 ? 'Entry' : 'Entries'}
                        </Tag>
                    </Space>
                }
                className="shadow-md border-0"
            >
                {contactInfo.length > 0 ? (
                    <Table 
                        columns={columns}
                        dataSource={contactInfo.map(item => ({ ...item, key: item.id }))}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} items`,
                        }}
                        scroll={{ x: 800 }}
                    />
                ) : (
                    <div className="text-center py-12">
                        <TeamOutlined className="text-4xl text-gray-300 mb-4" />
                        <Title level={4} className="text-gray-500">
                            No Contact Information Found
                        </Title>
                        <Text type="secondary" className="mb-6 block">
                            Get started by adding your first contact information.
                        </Text>
                        <Link href={route('admin.settings.contactinfo.create')}>
                            <Button 
                                type="primary" 
                                icon={<PlusOutlined />}
                                size="large"
                                className="bg-blue-600 hover:bg-blue-700 border-0"
                            >
                                Add Contact Information
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>

            {contactInfo.length > 0 && (
                <Row gutter={[16, 16]} className="mt-6">
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <PhoneOutlined className="text-blue-500" />
                                    <span>Primary Contact</span>
                                </Space>
                            }
                            className="shadow-sm border-0"
                        >
                            {contactInfo.slice(0, 1).map(contact => (
                                <div key={contact.id} className="space-y-4">
                                    <div>
                                        <Text strong className="text-gray-600">Phone Numbers:</Text>
                                        <div className="mt-2 space-y-2">
                                            {contact.phone_one && (
                                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                    <Space>
                                                        <PhoneOutlined className="text-blue-500" />
                                                        <Text strong>{contact.phone_one}</Text>
                                                        <Tag color="blue">Primary</Tag>
                                                    </Space>
                                                    <Button 
                                                        type="text" 
                                                        icon={<CopyOutlined />}
                                                        size="small"
                                                        onClick={() => copyToClipboard(contact.phone_one)}
                                                    />
                                                </div>
                                            )}
                                            {contact.phone_two && (
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <Space>
                                                        <PhoneOutlined className="text-gray-500" />
                                                        <Text>{contact.phone_two}</Text>
                                                        <Tag color="default">Secondary</Tag>
                                                    </Space>
                                                    <Button 
                                                        type="text" 
                                                        icon={<CopyOutlined />}
                                                        size="small"
                                                        onClick={() => copyToClipboard(contact.phone_two)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <Divider />
                                    
                                    <div>
                                        <Text strong className="text-gray-600">Email Addresses:</Text>
                                        <div className="mt-2 space-y-2">
                                            {contact.email_one && (
                                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                    <Space>
                                                        <MailOutlined className="text-green-500" />
                                                        <Text strong>{contact.email_one}</Text>
                                                        <Tag color="green">Primary</Tag>
                                                    </Space>
                                                    <Button 
                                                        type="text" 
                                                        icon={<CopyOutlined />}
                                                        size="small"
                                                        onClick={() => copyToClipboard(contact.email_one)}
                                                    />
                                                </div>
                                            )}
                                            {contact.email_two && (
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <Space>
                                                        <MailOutlined className="text-gray-500" />
                                                        <Text>{contact.email_two}</Text>
                                                        <Tag color="default">Secondary</Tag>
                                                    </Space>
                                                    <Button 
                                                        type="text" 
                                                        icon={<CopyOutlined />}
                                                        size="small"
                                                        onClick={() => copyToClipboard(contact.email_two)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </Col>
                    
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <EnvironmentOutlined className="text-purple-500" />
                                    <span>Address Information</span>
                                </Space>
                            }
                            className="shadow-sm border-0"
                        >
                            {contactInfo.slice(0, 1).map(contact => (
                                <div key={contact.id} className="space-y-3">
                                    {contact.address.street && (
                                        <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                                            <EnvironmentOutlined className="text-purple-500 mt-1 mr-3" />
                                            <div>
                                                <Text strong className="block">{contact.address.street}</Text>
                                                <Text type="secondary">
                                                    {[contact.address.city, contact.address.state, contact.address.zip].filter(Boolean).join(', ')}
                                                </Text>
                                            </div>
                                        </div>
                                    )}

                                    {!contact.address.street && !contact.address.city && !contact.address.state && (
                                        <div className="text-center py-8">
                                            <EnvironmentOutlined className="text-3xl text-gray-300 mb-3" />
                                            <Text type="secondary" className="block">
                                                No address information available
                                            </Text>
                                        </div>
                                    )}
                                    
                                    <Divider />
                                    
                                    <div className="text-center">
                                        <Link href={route('admin.settings.contactinfo.edit', contactInfo[0]?.id)}>
                                            <Button type="primary" icon={<EditOutlined />}>
                                                Update Contact Information
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </Col>
                </Row>
            )}
        </Authenticated>
    );
}
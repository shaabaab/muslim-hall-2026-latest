import { Link, router } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';

import { 
    Table, 
    Button, 
    Space, 
    Row, 
    Col,
    Card, 
    Typography, 
    Popconfirm,
    message,
    Tooltip,
    Tag,
    Image,
    Divider,
    Statistic,
    Progress,
    Timeline,
    Descriptions,
    Badge
} from 'antd';
import { 
    EditOutlined, 
    DeleteOutlined, 
    ArrowLeftOutlined,
    UserOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    HistoryOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ExclamationCircleOutlined,
    DollarOutlined,
    IdcardOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Show({ subscription, auth, paymentHistory }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = () => {
        router.delete(route('user.subscriptions.destroy', subscription.id), {
            onSuccess: () => {
                message.success('Subscription deleted successfully');
            },
            onError: () => {
                message.error('Failed to delete subscription');
            }
        });
    };

    const getStatusTag = (status) => {
        const statusConfig = {
            '1': { color: 'green', text: 'Active', icon: <CheckCircleOutlined /> },
            '2': { color: 'red', text: 'Expired', icon: <ExclamationCircleOutlined /> },
            '3': { color: 'volcano', text: 'Cancelled', icon: <CloseCircleOutlined /> },
            '4': { color: 'orange', text: 'Pending', icon: <SyncOutlined spin /> },
        };
        
        const config = statusConfig[String(status)] || { color: 'default', text: status, icon: null };
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        );
    };

    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            'pending': { color: 'orange', text: 'Pending' },
            'completed': { color: 'green', text: 'Completed' },
            'failed': { color: 'red', text: 'Failed' },
            'refunded': { color: 'volcano', text: 'Refunded' },
            'cancelled': { color: 'default', text: 'Cancelled' }
        };
        
        const config = statusConfig[status?.toLowerCase()] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'

        });
    };

    const formatCurrency = (amount, currency = 'BDT') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const calculateDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const calculateProgress = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        
        const totalDuration = end - start;
        const elapsedDuration = today - start;
        
        const progress = (elapsedDuration / totalDuration) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    const columns = [
        {
            title: 'Payment ID',
            dataIndex: 'transaction_id',
            key: 'transaction_id',
            render: (text) => <Text code>{text || 'N/A'}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount, record) => formatCurrency(amount, record.currency)
        },
        {
            title: 'Payment Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (method) => <Tag color="blue">{method || 'N/A'}</Tag>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getPaymentStatusTag(status)
        },
        {
            title: 'Payment Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => formatDate(date)
        },

    ];

    const daysRemaining = calculateDaysRemaining(subscription.end_date);
    const progress = calculateProgress(subscription.start_date, subscription.end_date);

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Subscription Details"
        >
            <div className="space-y-6">
                {/* Header Section */}
                <Card>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={route('user.subscriptions.index')}>
                                <Button icon={<ArrowLeftOutlined />} size="large" />
                            </Link>
                            <div>
                                <Title level={2} className="mb-1">
                                    <IdcardOutlined className="mr-2" />
                                    Subscription #{subscription.id}
                                </Title>
                                <Text type="secondary">
                                    Comprehensive view of subscription and payment history
                                </Text>
                            </div>
                        </div>

                        <Space>
                            {can('edit-subscription') && (
                                <Link href={route('user.subscriptions.edit', subscription.id)}>
                                    <Button type="primary" icon={<EditOutlined />} size="large">
                                        Edit Subscription
                                    </Button>
                                </Link>
                            )}
                            {can('delete-subscription') && (
                                <Popconfirm
                                    title="Delete this subscription?"
                                    description="Are you sure you want to delete this subscription? This action cannot be undone."
                                    onConfirm={handleDelete}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button danger icon={<DeleteOutlined />} size="large">
                                        Delete
                                    </Button>
                                </Popconfirm>
                            )}
                        </Space>
                    </div>
                </Card>

                {/* Stats Overview */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Subscription Status"
                                value={subscription.status == 1 ? 'Active' : subscription.status == 2 ? 'Expired' : subscription.status == 3 ? 'Cancelled' : 'Pending'}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ 
                                    color: subscription.status === '1' ? '#3f8600' : '#cf1322' 
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Days Remaining"
                                value={daysRemaining}
                                prefix={<ClockCircleOutlined />}
                                suffix="days"
                                valueStyle={{ 
                                    color: daysRemaining > 7 ? '#3f8600' : daysRemaining > 3 ? '#faad14' : '#cf1322' 
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="Validity"
                                value={subscription.validity}
                                suffix="days"
                                prefix={<CalendarOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    {/* Left Column - Subscription Details */}
                    <Col xs={24} lg={12}>
                        {/* Subscription Progress */}
                        <Card title="Subscription Timeline" className="mb-4">
                            <div className="mb-4">
                                <div className="flex justify-between mb-2">
                                    <Text strong>Progress</Text>
                                    <Text strong>{progress.toFixed(1)}%</Text>
                                </div>
                                <Progress 
                                    percent={progress} 
                                    status={
                                        subscription.status === 'active' ? 'active' : 
                                        subscription.status === 'expired' ? 'exception' : 'normal'
                                    }
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                            </div>
                            
                            <Timeline>
                                <Timeline.Item 
                                    color="green" 
                                    dot={<CheckCircleOutlined />}
                                >
                                    <Text strong>Start Date</Text>
                                    <br />
                                    <Text type="secondary">{formatDate(subscription.start_date)}</Text>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color={daysRemaining > 0 ? "blue" : "red"}
                                    dot={daysRemaining > 0 ? <SyncOutlined spin /> : <CloseCircleOutlined />}
                                >
                                    <Text strong>Current Status</Text>
                                    <br />
                                    <Text type="secondary">
                                        {daysRemaining > 0 
                                            ? `${daysRemaining} days remaining` 
                                            : 'Subscription expired'
                                        }
                                    </Text>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color={new Date(subscription.end_date) > new Date() ? "blue" : "red"}
                                    dot={<CalendarOutlined />}
                                >
                                    <Text strong>End Date</Text>
                                    <br />
                                    <Text type="secondary">{formatDate(subscription.end_date)}</Text>
                                </Timeline.Item>
                            </Timeline>
                        </Card>

                        {/* Your Information */}
                        <Card title="Your Information" className="mb-4">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="User ID">
                                    <Text strong>#{subscription.user?.id}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Name">
                                    <Space>
                                        <UserOutlined />
                                        <Text>{subscription.user?.name || 'N/A'}</Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Email">
                                    <Text>{subscription.user?.email || 'N/A'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Member Since">
                                    <Text>{formatDate(subscription.user?.created_at)}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* Right Column - Plan & Payment Details */}
                    <Col xs={24} lg={12}>
                        {/* Plan Information */}
                        <Card title="Plan Details" className="mb-4">
                            <div className="text-center mb-4">
                                <Title level={3} style={{ color: '#1890ff' }}>
                                    {subscription.plan?.name || 'N/A'}
                                </Title>
                                <Text type="secondary">
                                    {subscription.plan?.description || 'No description available'}
                                </Text>
                            </div>
                            
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Plan Type">
                                    <Tag color="purple">{subscription.plan?.plan_type == 2 ? 'Premium' : 'Free' || 'N/A'}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Price">
                                    <Space>
                                        <Text strong>
                                            {formatCurrency(
                                                subscription.plan?.price, 
                                            )}
                                        </Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Billing Cycle">
                                    <Text>{subscription.plan?.billing_cycle || 'N/A'}</Text>
                                </Descriptions.Item>
                                {/* <Descriptions.Item label="Features">
                                    {subscription.plan?.features ? (
                                        <Space direction="vertical" size="small">
                                            {subscription.plan.features.split(',').map((feature, index) => (
                                                <Text key={index} type="secondary">• {feature.trim()}</Text>
                                            ))}
                                        </Space>
                                    ) : (
                                        <Text type="secondary">No features listed</Text>
                                    )}
                                </Descriptions.Item> */}
                            </Descriptions>
                        </Card>

                        {/* Subscription Summary */}
                        <Card title="Subscription Summary" size="small">
                            <Descriptions column={1}>
                                <Descriptions.Item label="Status">
                                    {getStatusTag(subscription.status)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Start Date">
                                    <Space>
                                        <CalendarOutlined />
                                        <Text>{formatDate(subscription.start_date)}</Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="End Date">
                                    <Space>
                                        <CalendarOutlined />
                                        <Text>{formatDate(subscription.end_date)}</Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Validity Period">
                                    <Text>{subscription.validity} days</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Created At">
                                    <Text>{formatDate(subscription.created_at)}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Updated At">
                                    <Text>{formatDate(subscription.updated_at)}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>

                {/* Payment History */}
                <Card 
                    title={
                        <Space>
                            <HistoryOutlined />
                            Payment History
                            <Tag>{paymentHistory?.length || 0} payments</Tag>
                        </Space>
                    }
                >
                    {paymentHistory && paymentHistory.length > 0 ? (
                        <Table 
                            columns={columns}
                            dataSource={paymentHistory}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="small"
                        />
                    ) : (
                        <div className="text-center py-8">
                            <CreditCardOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                            <br />
                            <Text type="secondary">No payment history available</Text>
                        </div>
                    )}
                </Card>

                {/* Quick Actions */}
                <Card>
                    <div className="flex justify-center">
                        <Space>
                            <Link href={route('user.subscriptions.index')}>
                                <Button icon={<ArrowLeftOutlined />}>
                                    All Subscriptions
                                </Button>
                            </Link>
                            {can('edit-subscription') && (
                                <Link href={route('user.subscriptions.edit', subscription.id)}>
                                    <Button type="primary" icon={<EditOutlined />}>
                                        Edit Subscription
                                    </Button>
                                </Link>
                            )}
            
                            {/* <Button 
                                icon={<HistoryOutlined />}
                                onClick={() => message.info('Invoice generation coming soon!')}
                            >
                                Generate Invoice
                            </Button> */}
                        </Space>
                    </div>
                </Card>
            </div>
        </FrontAuthenticatedLayout>
    );
}
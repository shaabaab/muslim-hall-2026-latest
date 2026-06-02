import { Link, router , usePage } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
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
    Badge,
    Modal,
    QRCode
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
    ClockCircleOutlined,
    PrinterOutlined,
    DownloadOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { useRef,useState } from 'react';

const { Title, Text } = Typography;

export default function Show({ subscription, auth, paymentHistory }) {
    const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);
    const invoiceRef = useRef();
    const { header ,footer ,contactInfo , social } = usePage().props;

    console.log("contactinfo",contactInfo, social,header,footer);

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = () => {
        router.delete(route('admin.subscriptions.destroy', subscription.id), {
            onSuccess: () => {
                message.success('Subscription deleted successfully');
            },
            onError: () => {
                message.error('Failed to delete subscription');
            }
        });
    };

    const generateInvoice = () => {
        setIsInvoiceVisible(true);
    };

    const handlePrint = () => {
        const invoiceElement = invoiceRef.current;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${subscription.id}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        color: #333;
                    }
                    .invoice-container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 20px;
                    }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #1890ff;
                        padding-bottom: 20px;
                    }
                    .company-info { text-align: right; }
                    .invoice-title { 
                        color: #1890ff; 
                        font-size: 28px; 
                        font-weight: bold;
                        margin: 0;
                    }
                    .section { 
                        margin-bottom: 20px; 
                    }
                    .section-title { 
                        background: #f0f2f5; 
                        padding: 10px; 
                        font-weight: bold; 
                        margin-bottom: 10px;
                        border-left: 4px solid #1890ff;
                    }
                    .details-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 20px; 
                        margin-bottom: 20px;
                    }
                    .detail-item { margin-bottom: 8px; }
                    .detail-label { font-weight: bold; color: #666; }
                    .table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    .table th, .table td { 
                        border: 1px solid #ddd; 
                        padding: 12px; 
                        text-align: left;
                    }
                    .table th { 
                        background: #f0f2f5; 
                        font-weight: bold;
                    }
                    .total-section { 
                        text-align: right; 
                        margin-top: 20px;
                    }
                    .total-amount { 
                        font-size: 20px; 
                        font-weight: bold; 
                        color: #1890ff;
                    }
                    .footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #666; 
                        border-top: 1px solid #ddd;
                        padding-top: 20px;
                    }
                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                    }
                    .status-active { background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; }
                    .status-pending { background: #fff7e6; border: 1px solid #ffd591; color: #fa8c16; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none !important; }
                        .invoice-container { box-shadow: none; margin: 0; padding: 15px; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    ${invoiceElement.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = () => {
        handlePrint(); // For now, same as print. You can implement PDF generation later
        message.success('Invoice download started');
    };

    const getStatusTag = (status) => {
        const statusMap = {
            1: { key: 'active', color: 'green', text: 'Active', icon: <CheckCircleOutlined /> },
            2: { key: 'expired', color: 'default', text: 'Expired', icon: <ExclamationCircleOutlined /> },
            3: { key: 'cancelled', color: 'volcano', text: 'Cancelled', icon: <CloseCircleOutlined /> },
            4: { key: 'pending', color: 'orange', text: 'Pending', icon: <SyncOutlined spin /> },
        };

        const normalizedStatus = Number(status);   
        const config = statusMap[normalizedStatus] || {
            color: 'default',
            text: 'Unknown',
            icon: null,
        };

        return (
            <Badge 
                status={config.color} 
                text={
                    <Tag color={config.color} icon={config.icon}>
                        {config.text}
                    </Tag>
                }
            />
        );
    };


    const getPaymentStatusTag = (status) => {
        const statusConfig = {
            'completed': { color: 'green', text: 'Completed' },
            'pending': { color: 'orange', text: 'Pending' },
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
            day: 'numeric'
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

    // Invoice Component
    const InvoiceContent = () => (
        <div ref={invoiceRef} style={{ background: 'white', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #1890ff', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#1890ff', fontSize: '28px', margin: 0, fontWeight: 'bold' }}>INVOICE</h1>
                    <p style={{ margin: '5px 0', color: '#666' }}>Subscription Payment</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Muslim Hall</h2>
                    <p style={{ margin: 0, color: '#333' }}>{contactInfo.phone_one}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>{contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zip}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>{contactInfo.email_one}</p>
                </div>
            </div>

            {/* Invoice Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ color: '#1890ff', marginBottom: '10px' }}>Bill To:</h3>
                    <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{subscription.user?.name || 'N/A'}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}>{subscription.user?.email || 'N/A'}</p>
                    <p style={{ margin: '5px 0', color: '#666' }}>User ID: #{subscription.user?.id}</p>
                </div>
                <div>
                    <h3 style={{ color: '#1890ff', marginBottom: '10px' }}>Invoice Details:</h3>
                    <p style={{ margin: '5px 0' }}><strong>Invoice #:</strong> INV-{subscription.id}</p>
                    <p style={{ margin: '5px 0' }}><strong>Issue Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p style={{ margin: '5px 0' }}><strong>Due Date:</strong> {formatDate(subscription.end_date)}</p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Status:</strong> 
                        <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            marginLeft: '8px',
                        }}>
                            {getStatusTag(subscription.status).props.text && (<span>{getStatusTag(subscription.status).props.text}</span>)}
                        </span>
                    </p>
                </div>
            </div>

            {/* Subscription Details */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ background: '#f0f2f5', padding: '10px', margin: 0, borderLeft: '4px solid #1890ff' }}>
                    Subscription Details
                </h3>
                <div style={{ padding: '15px', border: '1px solid #f0f2f5', borderTop: 'none' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Description</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Plan</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Period</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                    {subscription.plan?.name || 'Subscription Plan'}
                                    <br />
                                    <small style={{ color: '#666' }}>{subscription.plan?.description || 'Monthly subscription'}</small>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                    {subscription.plan?.plan_type == 2 ? 'Premium' : 'Free'}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                    {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                                    <br />
                                    <small>({subscription.validity} days)</small>
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {formatCurrency(subscription.plan?.price || 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Summary */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ background: '#f0f2f5', padding: '10px', margin: 0, borderLeft: '4px solid #1890ff' }}>
                    Payment Summary
                </h3>
                <div style={{ padding: '15px', border: '1px solid #f0f2f5', borderTop: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subscription.plan?.price || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Tax (0%):</span>
                        <span>{formatCurrency(0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>Total:</span>
                        <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '18px' }}>
                            {formatCurrency(subscription.plan?.price || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            {paymentHistory && paymentHistory.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ background: '#f0f2f5', padding: '10px', margin: 0, borderLeft: '4px solid #1890ff' }}>
                        Payment History
                    </h3>
                    <div style={{ padding: '15px', border: '1px solid #f0f2f5', borderTop: 'none' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Transaction ID</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Method</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map((payment, index) => (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(payment.created_at)}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.transaction_id || 'N/A'}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.payment_method || 'N/A'}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '3px',
                                                backgroundColor: payment.status === 'completed' ? '#f6ffed' : 
                                                               payment.status === 'pending' ? '#fff7e6' : '#fff2f0',
                                                color: payment.status === 'completed' ? '#52c41a' : 
                                                      payment.status === 'pending' ? '#fa8c16' : '#ff4d4f'
                                            }}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                                            {formatCurrency(payment.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '40px', textAlign: 'center', color: '#666', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                <p>Thank you for your business!</p>
                <p style={{ fontSize: '12px' }}>
                    If you have any questions about this invoice, please contact our support team.
                </p>
                <div style={{ marginTop: '20px' }}>
                    <QRCode value={`https://yourapp.com/invoices/INV-${subscription.id}`} size={80} />
                </div>
            </div>
        </div>
    );

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
        <Authenticated
            user={auth.user}
            header="Subscription Details"
        >
            <div className="space-y-6">
                {/* Header Section */}
                <Card>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link href={route('admin.subscriptions.index')}>
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
                                <Link href={route('admin.subscriptions.edit', subscription.id)}>
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
                                value={subscription.status}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ 
                                    color: subscription.status === 'active' ? '#3f8600' : '#cf1322' 
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

                        {/* User Information */}
                        <Card title="User Information" className="mb-4">
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
                            <Link href={route('admin.subscriptions.index')}>
                                <Button icon={<ArrowLeftOutlined />}>
                                    All Subscriptions
                                </Button>
                            </Link>
                            {can('edit-subscription') && (
                                <Link href={route('admin.subscriptions.edit', subscription.id)}>
                                    <Button type="primary" icon={<EditOutlined />}>
                                        Edit Subscription
                                    </Button>
                                </Link>
                            )}
                            <Button 
                                icon={<CreditCardOutlined />}
                                onClick={() => message.info('Payment feature coming soon!')}
                            >
                                Process Payment
                            </Button>
                            <Button 
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={generateInvoice}
                            >
                                Generate Invoice
                            </Button>
                        </Space>
                    </div>
                </Card>
            </div>

            {/* Invoice Modal */}
            <Modal
                title={
                    <Space>
                        <FilePdfOutlined />
                        Invoice #INV-{subscription.id}
                    </Space>
                }
                open={isInvoiceVisible}
                onCancel={() => setIsInvoiceVisible(false)}
                width="90%"
                style={{ maxWidth: 1000 }}
                footer={[
                    <Button key="cancel" onClick={() => setIsInvoiceVisible(false)}>
                        Cancel
                    </Button>,
                    <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
                        Print
                    </Button>,
                    <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
                        Download PDF
                    </Button>
                ]}
            >
                <InvoiceContent />
            </Modal>
        </Authenticated>
    );
}
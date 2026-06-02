import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';

import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    Card, 
    Typography, 
    Popconfirm,
    message,
    Tooltip,
    Row,
    Col,
    Select,
    Input,
} from 'antd';
import { 
    PlusOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ payments, filters, auth }) {
    // Search handler
    const handleSearch = (value) => {
        router.get(route('admin.payments.index'), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };
    
    // Filter handler
    const handleFilter = (key, value) => {
        router.get(route('admin.payments.index'), {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };
    
    // Table change handler (pagination, sorting)
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('admin.payments.index'), {
            ...filters,
            sort_field: sorter.field || 'id',
            sort_direction: sorter.order === 'ascend' ? 'asc' : 'desc',
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };
    
    // Reset all filters
    const resetFilters = () => {
        router.get(route('admin.payments.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const STATUS_LABELS = [
        { label: 'completed', color: 'green' },
        { label: 'failed', color: 'red' },
        { label: 'pending', color: 'orange' },
    ]; 

 

    const columns = [
        {
            title: 'S/N',
            key: 'sn',
            render: (text, record, index) => index + 1,
        },


        {
            title: 'Assigned Plan',
            key: 'plan_id',
            render: (_, record) => (
                <Text>{record.subscription.plan ? `${record.subscription.plan.name} (${record.subscription.plan.price} tk)` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Assigned User',
            key: 'user_id',
            render: (_, record) => (
                <Text>{record.subscription.user ? `${record.subscription.user.name} (${record.subscription.user.email})` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: 'Amount (Tk)',
            dataIndex: 'amount',
            key: 'amount',
            render: (text) => <Text>{text} Tk</Text>,
        },

        {
            title: 'Transaction ID',
            dataIndex: 'transaction_id',
            key: 'transaction_id',
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'blue' : 'red'}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag>
            ),
        },

        {
            title: 'Recorded At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => (
                <Text>{text ? new Date(text).toLocaleDateString() : 'N/A'}</Text>
            ),
        },
  
    ];
    
    return (
        <Authenticated
            user={auth.user}
            header="Subscription Payments Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Subscriptions Payments
                        </Title>
                        <Text type="secondary">
                            Manage your application subscriptions Payments
                        </Text>
                    </div>
                </div>

                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by user name,email,plan,plan_type..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="status"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.status || null}
                                onChange={(value) => handleFilter('status', value)}
                            >
                               { STATUS_LABELS.map((status) => (
                                    <Option style={{ color: status.color }} key={status.label} value={status.label}>
                                        {status.label.charAt(0).toUpperCase() + status.label.slice(1)}
                                    </Option>
                               )) }
                            </Select>
                        </Col>
                  
                        <Col xs={24} sm={12} md={4}>
                            <Button 
                                icon={<ReloadOutlined />} 
                                size="large" 
                                onClick={resetFilters}
                                style={{ width: '100%' }}
                            >
                                Reset Filters
                            </Button>
                        </Col>
                    </Row>
                </Card>

                <Table 
                    columns={columns} 
                    dataSource={payments.data.map(payment => ({ 
                        ...payment, 
                        key: payment.id 
                    }))}
                    pagination={{
                        current: payments.current_page,
                        pageSize: payments.per_page,
                        total: payments.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} payments`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={payments.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    )
}
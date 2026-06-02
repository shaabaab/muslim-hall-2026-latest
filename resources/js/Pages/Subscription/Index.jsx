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
    ReloadOutlined ,
    CheckOutlined, 
    EyeOutlined,
    EditOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ subscriptions, filters, auth }) {
    // Search handler
    
    const handleSearch = (value) => {
        router.get(route('admin.subscriptions.index'), {
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
        router.get(route('admin.subscriptions.index'), {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };
    
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('admin.subscriptions.index'), {
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
        router.get(route('admin.subscriptions.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const STATUS_LABELS = [
        { label: 'Active', color: 'green' },
        { label: 'Expired', color: 'red' },
        { label: 'Cancelled', color: 'orange' },
        { label: 'Pending', color: 'blue' },
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
                <Text>{record.plan ? `${record.plan.name} (${record.plan.price} tk)` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Assigned User',
            key: 'user_id',
            render: (_, record) => (
                <Text>{record.user ? `${record.user.name} (${record.user.email})` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Validity (days)',
            dataIndex: 'validity',
            key: 'validity',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={STATUS_LABELS[status - 1]?.color || 'default'}>
                    {STATUS_LABELS[status - 1]?.label || 'Unknown'}
                </Tag>
            ),
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (text) => (
                <Text>{text ? new Date(text).toLocaleDateString() : 'N/A'}</Text>
            ),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (text) => (

            <Text type="secondary">
                ({text ? Math.max(0, Math.ceil((new Date(text) - new Date()) / (1000 * 60 * 60 * 24))) : 'N/A'} days left)
            </Text>

            ),
        },

        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => ( 
                <Space size="middle">

                    {/* {(record.status == 4 || record.status == 3) && ( */}
                        <Tooltip title="Renew Subscription">
                        <Link href={route('admin.subscriptions.edit', record.id)}>
                            <Button 
                            type="primary" 
                            icon={<EditOutlined />} 
                            size="small"
                            className="mr-1"
                            />
                        </Link>
                        </Tooltip>
                    {/* )} */}

                    <Tooltip title="Payment History">
                        <Link href={route('admin.subscriptions.payments', record.id)}>
                        <Button 
                            icon={<EyeOutlined />} 
                            size="small"
                            className="mr-1"
                        />
                        </Link>
                    </Tooltip>

                    {(record.status == 4 || record.status == 2 || record.status == 3) && (
                        <Tooltip title="Verify Subscription">
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            size="small"
                            onClick={() => router.post(route('admin.subscriptions.verify', record.id))}
                        />
                        </Tooltip>
                    )}


                </Space>
            ),
        }
        
    ];
    
    return (
        <Authenticated
            user={auth.user}
            header="Subscription Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Subscriptions
                        </Title>
                        <Text type="secondary">
                            Manage your application subscriptions
                        </Text>
                    </div>

                    <Link href={route('admin.subscriptions.create')}>
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Assign New Subscription
                        </Button>
                    </Link>
                </div>

                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by plan_type, plan_name, description..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="plan_type"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.plan_type || null}
                                onChange={(value) => handleFilter('plan_type', value)}
                            >
                                <Option value="1">Free</Option>
                                <Option value="2">Paid</Option>
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
                    dataSource={subscriptions.data.map(subscription => ({ 
                        ...subscription, 
                        key: subscription.id 
                    }))}
                    pagination={{
                        current: subscriptions.current_page,
                        pageSize: subscriptions.per_page,
                        total: subscriptions.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} subscriptions`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={subscriptions.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    )
}
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
    Input,
    Select,
    Row,
    Col,
    Badge
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    SecurityScanOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    UserOutlined,
    ClockCircleOutlined,
    GlobalOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ blockedips, filters, auth }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route('admin.blockedips.destroy', id), {
            onSuccess: () => {
                message.success('Blocked IP deleted successfully');
            },
            onError: () => {
                message.error('Error deleting blocked IP');
            }
        });
    };

    const handleSearch = (value) => {
        router.get(route('admin.blockedips.index'), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleFilter = (key, value) => {
        router.get(route('admin.blockedips.index'), {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('admin.blockedips.index'), {
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

    const resetFilters = () => {
        router.get(route('admin.blockedips.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const isBlockActive = (record) => {
        if (record.is_permanent) return true;
        if (!record.blocked_until) return false;
        return new Date(record.blocked_until) > new Date();
    };

    const isBlockExpired = (record) => {
        if (record.is_permanent) return false;
        if (!record.blocked_until) return true;
        return new Date(record.blocked_until) <= new Date();
    };

    const getStatusBadge = (record) => {
        if (record.is_permanent) {
            return <Badge status="error" text="Active" />;
        }
        if (isBlockActive(record)) {
            return <Badge status="processing" text="Active" />;
        }
        return <Badge status="default" text="Expired" />;
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
            sortOrder: filters.sort_field === 'id' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 80,
        },
        {
            title: 'IP Address',
            dataIndex: 'ip_address',
            key: 'ip_address',
            sorter: true,
            sortOrder: filters.sort_field === 'ip_address' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (text) => (
                <Tag color="blue" icon={<GlobalOutlined />} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
            render: (text) => (
                <Tooltip title={text}>
                    <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
                        {text || 'No reason provided'}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: 'Block Type',
            dataIndex: 'is_permanent',
            key: 'is_permanent',
            sorter: true,
            sortOrder: filters.sort_field === 'is_permanent' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (isPermanent, record) => (
                <Space size="small">
                    {isPermanent ? (
                        <Tag color="red" icon={<CloseCircleOutlined />}>
                            Permanent
                        </Tag>
                    ) : (
                        <Tag color="orange" icon={<ClockCircleOutlined />}>
                            Temporary
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => getStatusBadge(record),
        },
        {
            title: 'Blocked Until',
            dataIndex: 'blocked_until',
            key: 'blocked_until',
            sorter: true,
            sortOrder: filters.sort_field === 'blocked_until' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (date, record) => (
                record.is_permanent ? (
                    <Text type="secondary">Indefinitely</Text>
                ) : date ? (
                    <Tooltip title={formatDate(date)}>
                        <Text>{formatDate(date)}</Text>
                    </Tooltip>
                ) : (
                    <Text type="secondary">Not set</Text>
                )
            ),
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortOrder: filters.sort_field === 'created_at' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (date) => <Text>{formatDate(date)}</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 80,
            render: (_, record) => (
                <Space size="small">
                    {/* <Tooltip title="Edit Blocked IP">
                        <Link href={route('admin.blockedips.edit', record.id)}>
                            <Button 
                                type="primary" 
                                icon={<EditOutlined />} 
                                size="small"
                            >
                                Edit
                            </Button>
                        </Link>
                    </Tooltip>
                     */}
                    <Popconfirm
                        title="Delete Blocked IP"
                        description="Are you sure to delete this blocked IP?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Blocked IP">
                            <Button 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                            >
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated
            user={auth.user}
            header="Blocked IPs Management"
        >
            <Card>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <SecurityScanOutlined className="mr-2" />
                            Blocked IPs
                        </Title>
                        <Text type="secondary">
                            Manage blocked IP addresses in your application
                        </Text>
                    </div>

                    <Link href={route('admin.blockedips.create')}>
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Add Blocked IP
                        </Button>
                    </Link>
                </div>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by IP address or reason..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Block Type"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.block_type || null}
                                onChange={(value) => handleFilter('block_type', value)}
                            >
                                <Option value="permanent">Permanent</Option>
                                <Option value="temporary">Temporary</Option>
                                <Option value="active">Active</Option>
                                <Option value="expired">Expired</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Duration"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.duration || null}
                                onChange={(value) => handleFilter('duration', value)}
                            >
                                <Option value="today">Today</Option>
                                <Option value="week">This Week</Option>
                                <Option value="month">This Month</Option>
                                <Option value="year">This Year</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Input
                                placeholder="IP Range (e.g., 192.168)"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                defaultValue={filters.ip_range}
                                onChange={(e) => handleFilter('ip_range', e.target.value)}
                                onPressEnter={(e) => handleFilter('ip_range', e.target.value)}
                            />
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

                {/* Blocked IPs Table */}
                <Table 
                    columns={columns} 
                    dataSource={blockedips.data.map(blockedip => ({ ...blockedip, key: blockedip.id }))}
                    pagination={{
                        current: blockedips.current_page,
                        pageSize: blockedips.per_page,
                        total: blockedips.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} blocked IPs`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    loading={blockedips.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
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
    Col
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    TeamOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ langs = [], filters , auth }) {

    // Delete handler
    const handleDelete = (id) => {
        router.delete(route('admin.langs.destroy', id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log('Confirmed');
            },
            onSuccess: () => {
                message.success('Language deleted successfully');
            },
            onError: () => {
                message.error('Error deleting language');
            }
        });
    };


     // Search handler
    const handleSearch = (value) => {
        router.get(route('admin.langs.index'), {
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
        router.get(route('admin.langs.index'), {
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
        router.get(route('admin.langs.index'), {
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
        router.get(route('admin.langs.index'), {}, {
            preserveState: true,
            replace: true
        });
    };


    const columns = [
        {
            title: 'Lang Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Lang Code',
            dataIndex: 'code',
            key: 'code',
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: 'Lang Status',
            dataIndex: 'status',
            key: 'status',
            render: (_, record) => (
                <Space size="small">
                    <Tag color={record.status == 1 ? 'green' : 'red'}>
                        {record.status == 1 ? 'Active' : 'Inactive'}
                    </Tag>
                </Space>
            ),
        },

        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                        <Tooltip title="Edit Lang">
                            <Link href={route('admin.langs.edit', record.id)}>
                                <Button 
                                    type="primary" 
                                    icon={<EditOutlined />} 
                                    size="small"
                                />
                            </Link>
                        </Tooltip>
                    
                        <Popconfirm
                            title="Delete Lang"
                            description="Are you sure to delete this Lang?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete Lang">
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    size="small"
                                />
                            </Tooltip>
                        </Popconfirm>
                </Space>
            ),
        },
    ];

    
    return (
        <Authenticated
            user={auth.user}
            header="Language Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Languages
                        </Title>
                        <Text type="secondary">
                            Manage your application languages
                        </Text>
                    </div>

                        <Link href={route('admin.langs.create')}>
                            <Button type="primary" icon={<PlusOutlined />} size="large">
                                Add Lang
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
                                placeholder="Search by name, code..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>

                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Status"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.status || null}
                                onChange={(value) => handleFilter('status', value)}
                            >
                                <Option value="1">Active</Option>
                                <Option value="0">Inactive</Option>
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
                    dataSource={langs.data.map(lang => ({ ...lang, key: lang.id }))}
                    pagination={{
                        current: langs.current_page,
                        pageSize: langs.per_page,
                        total: langs.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} langs`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    // loading={langs.data.length === 0 && !filters.search}
                />

            </Card>
        </Authenticated>
    );
}
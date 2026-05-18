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

export default function Index({ categories, filters, auth }) {



    const handleDelete = (id) => {
        router.delete(route('admin.contest.category.destroy', id), {
            onSuccess: () => {
                message.success('Category deleted successfully');
            },
            onError: () => {
                message.error('Error deleting category');
            }
        });
    };

    

    // Search handler
    const handleSearch = (value) => {
        router.get(route('admin.contest.category.index'), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };


    // Table change handler (pagination, sorting)
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('admin.contest.category.index'), {
            ...filters,
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };


    // Reset all filters
    const resetFilters = () => {
        router.get(route('admin.contest.category.index'), {}, {
            preserveState: true,
            replace: true
        });
    };



    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (text,record,index) => (
                <Space>
                    <Text strong>{index + 1}</Text>
                </Space>
            ),
        },

  

        {
            title: 'Category Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },


        {
            title: 'Category Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: 'Category Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (
                <Space>
                    <Text strong>{text || 'N/A'}</Text>
                </Space>
            ),
        },
 
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space size="small">
               
                    <Popconfirm
                        title="Delete Category"
                        description="Are you sure to delete this category?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Category">
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
            header="Contest Categories Management"
        >
            <Card>
                {/* Header Section */}
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Categories
                        </Title>
                        <Text type="secondary">
                            Manage your application categories
                        </Text>
                    </div>

                    <Link href={route('admin.contest.category.create')}>
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Add Category
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
                                placeholder="Search by name, slug, or des..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
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

                {/* Categories Table */}
                <Table 
                    columns={columns} 
                    dataSource={categories.data.map(category => ({ ...category, key: category.id }))}
                    pagination={{
                        current: categories.current_page,
                        pageSize: categories.per_page,
                        total: categories.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} categories`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={categories.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
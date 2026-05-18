import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { getS3PublicUrl } from "@/Utils/s3Helpers";
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

export default function Index({ categories, filters, languages, auth }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route('admin.categories.destroy', id), {
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
        router.get(route('admin.categories.index'), {
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
        router.get(route('admin.categories.index'), {
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
        router.get(route('admin.categories.index'), {
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
        router.get(route('admin.categories.index'), {}, {
            preserveState: true,
            replace: true
        });
    };



    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
            sortOrder: filters.sort_field === 'id' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 80,
            render: (text,record,index) => <Text>{index + 1}</Text>,
        },
        {
            title: 'Category Name',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            sortOrder: filters.sort_field === 'name' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
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
            sorter: true,
            sortOrder: filters.sort_field === 'slug' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Category Status',
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            sortOrder: filters.sort_field === 'status' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (_, record) => (
                <Space size="small">
                    <Tag color={record.status == 1 ? 'green' : 'red'}>
                        {record.status == 1 ? 'Active' : 'Inactive'}
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Language',
            key: 'language',
            render: (_, record) => (
                <Text>{record.language ? `${record.language.name} (${record.language.code})` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Category Image',
            dataIndex: 'img',
            key: 'img',
            render: (text) => (
                text ? (
                    <img
                        src={getS3PublicUrl(`${text}`)}
                        alt="Category"
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                ) : (
                    'No Image'
                )
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Category">
                        <Link href={route('admin.categories.edit', record.id)}>
                            <Button 
                                type="primary" 
                                icon={<EditOutlined />} 
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                    
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
            header="Categories Management"
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

                    <Link href={route('admin.categories.create')}>
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
                                placeholder="Search by name, slug, or language..."
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
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Language"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.lang_id || null}
                                onChange={(value) => handleFilter('lang_id', value)}
                            >
                                {languages.map(lang => (
                                    <Option key={lang.id} value={lang.id}>
                                        {lang.name} ({lang.code})
                                    </Option>
                                ))}
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
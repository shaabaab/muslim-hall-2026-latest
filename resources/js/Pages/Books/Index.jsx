import { Link, router, usePage } from '@inertiajs/react';
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
    Image,
    Input,
    Row,
    Col,
    Select,
    DatePicker,
    Form,
    Badge,
    Alert,
    Spin
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    BookOutlined,
    EyeFilled,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useState, useMemo } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function Index({ books, auth, filters }) {
    // Safe destructuring with defaults
    const { 
        data = [], 
        links = {}, 
        meta = {} 
    } = books || {};

    const [searchParams, setSearchParams] = useState({
        search: filters?.search || '',
        page_count_min: filters?.page_count_min || '',
        page_count_max: filters?.page_count_max || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        has_pdf: filters?.has_pdf || '',
        sort_field: filters?.sort_field || 'created_at',
        sort_direction: filters?.sort_direction || 'desc',
        per_page: filters?.per_page || 10
    });

    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const can = (permission) => {
        return auth?.user?.permissions?.includes(permission) || false;
    };

    const handleDelete = (id) => {
        router.delete(route('admin.books.destroy', id), {
            onSuccess: () => {
                message.success("Book deleted successfully");
            },
            onError: () => {
                message.error("Error deleting book");
            },
        });
    };

    const handleSearch = (values) => {
        setLoading(true);
        const params = { ...values };
        
        // Remove empty values
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === undefined || params[key] === null) {
                delete params[key];
            }
        });

        router.get(route('admin.books.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false)
        });
    };

    const handleReset = () => {
        form.resetFields();
        setSearchParams({
            search: '',
            page_count_min: '',
            page_count_max: '',
            date_from: '',
            date_to: '',
            has_pdf: '',
            sort_field: 'created_at',
            sort_direction: 'desc',
            per_page: 10
        });
        setLoading(true);
        router.get(route('admin.books.index'), {}, {
            onFinish: () => setLoading(false)
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setLoading(true);
        const params = {
            ...searchParams,
            page: pagination.current,
            per_page: pagination.pageSize,
            sort_field: sorter.field || 'created_at',
            sort_direction: sorter.order === 'ascend' ? 'asc' : 'desc'
        };

        router.get(route('admin.books.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false)
        });
    };

    const handleSort = (field) => {
        setLoading(true);
        const direction = searchParams.sort_field === field && searchParams.sort_direction === 'asc' ? 'desc' : 'asc';
        const params = {
            ...searchParams,
            sort_field: field,
            sort_direction: direction
        };

        setSearchParams(params);
        router.get(route('admin.books.index'), params, {
            preserveState: true,
            replace: true,
            onFinish: () => setLoading(false)
        });
    };

    const getSortIcon = (field) => {
        if (searchParams.sort_field !== field) {
            return <SortAscendingOutlined />;
        }
        return searchParams.sort_direction === 'asc' ? 
            <SortAscendingOutlined style={{ color: '#1890ff' }} /> : 
            <SortDescendingOutlined style={{ color: '#1890ff' }} />;
    };

    const columns = [
        {
            title: (
                <Space>
                    ID
                    <Button 
                        type="text" 
                        size="small" 
                        icon={getSortIcon('id')}
                        onClick={() => handleSort('id')}
                    />
                </Space>
            ),
            dataIndex: 'id',
            key: 'id',
            sorter: true,
            sortOrder: searchParams.sort_field === 'id' ? 
                (searchParams.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 80,
        },
        {
            title: (
                <Space>
                    Title
                    <Button 
                        type="text" 
                        size="small" 
                        icon={getSortIcon('title')}
                        onClick={() => handleSort('title')}
                    />
                </Space>
            ),
            dataIndex: 'title',
            key: 'title',
            sorter: true,
            sortOrder: searchParams.sort_field === 'title' ? 
                (searchParams.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.description?.substring(0, 50)}...
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Photo',
            dataIndex: 'photo',
            key: 'photo',
            width: 100,
            render: (photo) =>
                photo ? (
                    <Image
                        src={getS3PublicUrl(photo)}
                        alt="Book Photo"
                        width={50}
                        height={65}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={false}
                    />
                ) : (
                    <Badge status="error" text="No Photo" />
                ),
        },
        {
            title: 'PDF Files',
            key: 'pdf_files',
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={4}>
                    {record.original_pdf ? (
                        <a
                            href={getS3PublicUrl(record.original_pdf)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '12px' }}
                        >
                            📄 Original
                        </a>
                    ) : (
                        <Tag color="red" size="small">No PDF</Tag>
                    )}
                    {record.compressed_pdf && (
                        <a
                            href={getS3PublicUrl(record.compressed_pdf)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '12px' }}
                        >
                            📦 Compressed
                        </a>
                    )}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    Pages
                    <Button 
                        type="text" 
                        size="small" 
                        icon={getSortIcon('page_count')}
                        onClick={() => handleSort('page_count')}
                    />
                </Space>
            ),
            dataIndex: 'page_count',
            key: 'page_count',
            sorter: true,
            sortOrder: searchParams.sort_field === 'page_count' ? 
                (searchParams.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 100,
            render: (count) => (
                <Tag color={count > 100 ? 'red' : count > 50 ? 'orange' : 'blue'}>
                    {count} pages
                </Tag>
            ),
        },
        {
            title: (
                <Space>
                    Created
                    <Button 
                        type="text" 
                        size="small" 
                        icon={getSortIcon('created_at')}
                        onClick={() => handleSort('created_at')}
                    />
                </Space>
            ),
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortOrder: searchParams.sort_field === 'created_at' ? 
                (searchParams.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 120,
            render: (date) => (
                <Tooltip title={new Date(date).toLocaleString()}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(date).toLocaleDateString()}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Book">
                        <Link href={route('admin.books.show', record.id)}>
                            <Button
                                type="primary"
                                icon={<EyeFilled />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Edit Book">
                        <Link href={route('admin.books.edit', record.id)}>
                            <Button
                                type="default"
                                icon={<EditOutlined />}
                                size="small"
                            />
                        </Link>
                    </Tooltip>
                    <Popconfirm
                        title="Delete Book"
                        description="Are you sure to delete this book?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete Book">
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

    // If books data is not available, show error
    if (!books) {
        return (
            <Authenticated user={auth?.user} header="Books Management">
                <Card>
                    <Alert
                        message="Error Loading Books"
                        description="Unable to load books data. Please try again later."
                        type="error"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                    />
                </Card>
            </Authenticated>
        );
    }

    return (
        <Authenticated
            user={auth?.user}
            header="Books Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <BookOutlined className="mr-2" />
                            Books
                        </Title>
                        <Text type="secondary">
                            Manage your book records ({meta?.total || 0} books found)
                        </Text>
                    </div>

                    <Link href={route("admin.books.create")}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            size="large"
                        >
                            Add Book
                        </Button>
                    </Link>
                </div>

                {/* Search and Filter Section */}
                <Card 
                    size="small" 
                    className="mb-4" 
                    title={
                        <Space>
                            <FilterOutlined />
                            Search & Filters
                        </Space>
                    }
                    extra={
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={handleReset}
                            size="small"
                        >
                            Reset
                        </Button>
                    }
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSearch}
                        initialValues={searchParams}
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item name="search" label="Search">
                                    <Input 
                                        placeholder="Search by title or description..." 
                                        prefix={<SearchOutlined />}
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={3}>
                                <Form.Item name="page_count_min" label="Min Pages">
                                    <Input 
                                        type="number" 
                                        placeholder="Min" 
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={3}>
                                <Form.Item name="page_count_max" label="Max Pages">
                                    <Input 
                                        type="number" 
                                        placeholder="Max" 
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={4}>
                                <Form.Item name="has_pdf" label="PDF Status">
                                    <Select placeholder="All" allowClear>
                                        <Option value="yes">Has PDF</Option>
                                        <Option value="no">No PDF</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Form.Item name="date_range" label="Date Range">
                                    <RangePicker 
                                        style={{ width: '100%' }}
                                        onChange={(dates, dateStrings) => {
                                            if (dates) {
                                                form.setFieldsValue({
                                                    date_from: dateStrings[0],
                                                    date_to: dateStrings[1]
                                                });
                                            } else {
                                                form.setFieldsValue({
                                                    date_from: '',
                                                    date_to: ''
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={2}>
                                <Form.Item label=" ">
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        style={{ width: '100%' }}
                                        loading={loading}
                                    >
                                        Search
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                {/* Books Table */}
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={data.map(book => ({ ...book, key: book.id }))}
                        pagination={{
                            current: meta?.current_page || 1,
                            pageSize: meta?.per_page || 10,
                            total: meta?.total || 0,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => 
                                `${range[0]}-${range[1]} of ${total} items`,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        onChange={handleTableChange}
                        scroll={{ x: 1000 }}
                        size="middle"
                        locale={{
                            emptyText: 'No books found'
                        }}
                    />
                </Spin>
            </Card>
        </Authenticated>
    );
}
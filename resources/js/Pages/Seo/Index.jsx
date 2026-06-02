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
    Image,
    Badge,
    Statistic
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    GlobalOutlined,
    PictureOutlined,
    EyeOutlined,
    LinkOutlined,
    TagOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ seos, filters, auth }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    const handleDelete = (id) => {
        router.delete(route('admin.seos.destroy', id), {
            onSuccess: () => {
                message.success('SEO deleted successfully');
            },
            onError: () => {
                message.error('Error deleting SEO');
            }
        });
    };

    const handleSearch = (value) => {
        router.get(route('admin.seos.index'), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleFilter = (key, value) => {
        router.get(route('admin.seos.index'), {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('admin.seos.index'), {
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
        router.get(route('admin.seos.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Calculate statistics
    const stats = {
        total: seos.total,
        withCanonical: seos.data.filter(seo => seo.canonical_url).length,
        withImages: seos.data.filter(seo => seo.fav_icon || seo.header_logo || seo.og_image).length,
        withKeywords: seos.data.filter(seo => seo.meta_keywords && JSON.parse(seo.meta_keywords).length > 0).length,
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true,
            sortOrder: filters.sort_field === 'id' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 70,
            fixed: 'left',
            render: (id) => <Text strong>#{id}</Text>,
        },
    

        {
            title: 'Meta Data',
            key: 'meta_data',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {record.meta_title && (
                        <Tooltip title={record.meta_title}>
                            <div className="flex items-start">
                                <Tag color="blue" size="small" className="mr-1">M</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.meta_title}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {record.og_title && (
                        <Tooltip title={record.og_title}>
                            <div className="flex items-start">
                                <Tag color="green" size="small" className="mr-1">OG</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.og_title}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {record.twitter_title && (
                        <Tooltip title={record.twitter_title}>
                            <div className="flex items-start">
                                <Tag color="purple" size="small" className="mr-1">TW</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.twitter_title}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {!record.meta_title && !record.og_title && !record.twitter_title && (
                        <Text type="secondary" className="text-xs">No meta titles</Text>
                    )}
                </Space>
            ),
        },

        {
            title: 'Meta Site',
            key: 'meta_site',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {record.twitter_creator && (
                        <Tooltip title={record.twitter_creator}>
                            <div className="flex items-start">
                                <Tag color="blue" size="small" className="mr-1">M</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.twitter_creator}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {record.og_site_name && (
                        <Tooltip title={record.og_site_name}>
                            <div className="flex items-start">
                                <Tag color="green" size="small" className="mr-1">OG</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.og_site_name}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {record.twitter_site && (
                        <Tooltip title={record.twitter_site}>
                            <div className="flex items-start">
                                <Tag color="purple" size="small" className="mr-1">TW</Tag>
                                <Text className="text-xs" ellipsis style={{ maxWidth: 200 }}>
                                    {record.twitter_site}
                                </Text>
                            </div>
                        </Tooltip>
                    )}

                    {!record.meta_title && !record.og_title && !record.twitter_title && (
                        <Text type="secondary" className="text-xs">No meta titles</Text>
                    )}
                </Space>
            ),
        },


        {
            title: 'Keywords',
            key: 'keywords',
            width: 200,
            render: (_, record) => {
                const metaKeywords = record.meta_keywords ? 
                    (typeof record.meta_keywords === 'string' ? JSON.parse(record.meta_keywords) : record.meta_keywords) : [];
                const focusKeywords = record.focus_keywords ? 
                    (typeof record.focus_keywords === 'string' ? JSON.parse(record.focus_keywords) : record.focus_keywords) : [];

                return (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {metaKeywords.length > 0 && (
                            <div>
                                <Text className="text-xs" type="secondary">Meta:</Text>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {metaKeywords.slice(0, 3).map((keyword, index) => (
                                        <Tag key={index} color="blue" size="small" className="text-xs">
                                            {keyword}
                                        </Tag>
                                    ))}
                                    {metaKeywords.length > 3 && (
                                        <Tag size="small" className="text-xs">+{metaKeywords.length - 3}</Tag>
                                    )}
                                </div>
                            </div>
                        )}
                        {focusKeywords.length > 0 && (
                            <div>
                                <Text className="text-xs" type="secondary">Focus:</Text>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {focusKeywords.slice(0, 2).map((keyword, index) => (
                                        <Tag key={index} color="green" size="small" className="text-xs">
                                            {keyword}
                                        </Tag>
                                    ))}
                                    {focusKeywords.length > 2 && (
                                        <Tag size="small" className="text-xs">+{focusKeywords.length - 2}</Tag>
                                    )}
                                </div>
                            </div>
                        )}
                        {metaKeywords.length === 0 && focusKeywords.length === 0 && (
                            <Text type="secondary" className="text-xs">No keywords</Text>
                        )}
                    </Space>
                );
            },
        },



        // {
        //     title: 'Images',
        //     key: 'images',
        //     width: 120,
        //     render: (_, record) => {
        //         const hasOgImage = !!record.og_image;
        //         const hasTwitterImage = !!record.twitter_image;

        //         const imageCount = [ hasOgImage, hasTwitterImage].filter(Boolean).length;

        //         return (
        //             <Space direction="vertical" align="center" size={4}>
        //                 <Badge count={imageCount} showZero={false} size="small">
        //                     <PictureOutlined style={{ fontSize: '20px', color: imageCount > 0 ? '#1890ff' : '#d9d9d9' }} />
        //                 </Badge>
        //                 {imageCount > 0 && (
        //                     <div className="flex gap-1">
        //                         {hasOgImage && <div className="w-2 h-2 bg-purple-500 rounded-full" title="OG Image"></div>}
        //                         {hasTwitterImage && <div className="w-2 h-2 bg-cyan-500 rounded-full" title="Twitter Image"></div>}
        //                     </div>
        //                 )}
        //             </Space>
        //         );
        //     },
        // },

        {
            title: 'Model Type',
            key: 'seoable_type',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {record.seoable_type && (
                        <Tooltip title={record.seoable_type}>
                            <div className="flex items-center">
                                <Tag color="blue" size="small" className="mr-1">{record.seoable_type}</Tag>
                            </div>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    

        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_, record) => {
                const hasMetaTitle = !!record.meta_title;
                const hasMetaDesc = !!record.meta_description;
                const hasCanonical = !!record.canonical_url;
                const hasImages = record.fav_icon || record.header_logo || record.og_image;
                const hasKeywords = record.meta_keywords && JSON.parse(record.meta_keywords).length > 0;

                const completedFields = [hasMetaTitle, hasMetaDesc, hasCanonical, hasImages, hasKeywords].filter(Boolean).length;
                const completionRate = (completedFields / 5) * 100;

                let statusColor = 'red';
                let statusText = 'Poor';

                if (completionRate >= 80) {
                    statusColor = 'green';
                    statusText = 'Excellent';
                } else if (completionRate >= 60) {
                    statusColor = 'blue';
                    statusText = 'Good';
                } else if (completionRate >= 40) {
                    statusColor = 'orange';
                    statusText = 'Fair';
                }

                return (
                    <Tooltip title={`${completedFields}/5 fields completed (${completionRate}%)`}>
                        <Tag color={statusColor} className="cursor-pointer">
                            {statusText}
                        </Tag>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            sorter: true,
            sortOrder: filters.sort_field === 'created_at' ? (filters.sort_direction === 'asc' ? 'ascend' : 'descend') : false,
            width: 100,
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text className="text-sm">{new Date(date).toLocaleDateString()}</Text>
                    <Text type="secondary" className="text-xs">
                        {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 50,
            render: (_, record) => (
                    <Popconfirm
                        title="Delete SEO Configuration"
                        description="This action cannot be undone. Are you sure?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okType="danger"
                    >
                        <Tooltip title="Delete">
                            <Button 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
            ),
        },
    ];

    return (
        <Authenticated
            user={auth.user}
            header="SEO Management"
        >
            <Card>
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <GlobalOutlined className="mr-2" />
                            SEO Management
                        </Title>
                        <Text type="secondary">
                            Manage and optimize your website's search engine visibility
                        </Text>
                    </div>
                </div>

                {/* Statistics Cards */}
                <Row gutter={16} className="mb-6">
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic
                                title="Total SEO"
                                value={stats.total}
                                prefix={<GlobalOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic
                                title="With Canonical"
                                value={stats.withCanonical}
                                prefix={<LinkOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic
                                title="With Images"
                                value={stats.withImages}
                                prefix={<PictureOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic
                                title="With Keywords"
                                value={stats.withKeywords}
                                prefix={<TagOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <FilterOutlined className="mr-2" />
                            <Text strong>Filters & Search</Text>
                        </div>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={resetFilters}
                            size="small"
                        >
                            Reset
                        </Button>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search titles, meta data, URLs..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        {/* <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Image Status"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.has_images || null}
                                onChange={(value) => handleFilter('has_images', value)}
                            >
                                <Option value="any">Any Images</Option>
                                <Option value="favicon">Has Favicon</Option>
                                <Option value="logo">Has Logo</Option>
                                <Option value="og">Has OG Image</Option>
                                <Option value="none">No Images</Option>
                            </Select>
                        </Col> */}
                        {/* <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="SEO Status"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.seo_status || null}
                                onChange={(value) => handleFilter('seo_status', value)}
                            >
                                <Option value="excellent">Excellent</Option>
                                <Option value="good">Good</Option>
                                <Option value="fair">Fair</Option>
                                <Option value="poor">Poor</Option>
                            </Select>
                        </Col> */}
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Sort By"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.sort_field || 'id'}
                                onChange={(value) => handleFilter('sort_field', value)}
                            >
                                <Option value="id">ID</Option>
                                <Option value="meta_title">Meta Title</Option>
                                <Option value="created_at">Created Date</Option>
                            </Select>
                        </Col>
                    </Row>
                </Card>

                {/* SEO Table */}
                {/* <Table 
                    columns={columns} 
                    dataSource={seos.data.map(seo => ({ ...seo, key: seo.id }))}
                    pagination={{
                        current: seos.current_page,
                        pageSize: seos.per_page,
                        total: seos.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `Showing ${range[0]}-${range[1]} of ${total} SEO configurations`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        size: 'default',
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }}
                    loading={seos.data.length === 0 && !filters.search}
                    size="middle"
                    className="custom-table"
                /> */}

                <Table
                    columns={columns}
                    dataSource={seos.data.map(seo => ({ ...seo, key: seo.id }))}
                    pagination={{
                        current: seos.current_page,
                        pageSize: seos.per_page,
                        total: seos.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} SEO configurations`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }}
                    loading={seos.data.length === 0 && !filters.search}
                    size="middle"
                    className="custom-table"
                    />

            </Card>
        </Authenticated>
    );
}
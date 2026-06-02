import { Link, router } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';

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
    TeamOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    BackwardFilled
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function Index({ reviews, filters, auth }) {
    // Search handler
    const handleSearch = (value) => {
        router.get(route('user.reviews.index'), {
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
        router.get(route('user.reviews.index'), {
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
        router.get(route('user.reviews.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Delete handler
    const handleDelete = (id) => {
        router.delete(route('user.reviews.destroy', id), {
            onSuccess: () => {
                message.success('Review deleted successfully');
            },
            onError: () => {
                message.error('Failed to delete review');
            }
        });
    };

    // Get decision tag color
    const STATUS_APPROVED = 1;
    const STATUS_PENDING = 2;
    const STATUS_REJECTED = 3;

    const statusOptions = [
        { label: 'Approved', value: STATUS_APPROVED ,color: 'green'},
        { label: 'Pending', value: STATUS_PENDING ,color: 'blue' },
        { label: 'Rejected', value: STATUS_REJECTED, color: 'red' },
    ];

    // Get rating stars
    const renderRating = (rating) => {
        return (
            <Space>
                <span style={{ color: '#faad14' }}>★</span>
                <Text>{rating}/5</Text>
            </Space>
        );
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            sorter: true,
        },
        {
            title: 'Contest',
            dataIndex: 'contest',
            key: 'contest',
            render: (contest) => (
                <Text>
                    {contest?.title  || 'N/A'}
                </Text>
            ),
        },
        {
            title: 'Reviewer',
            dataIndex: 'reviewer',
            key: 'reviewer',
            render: (reviewer) => (
                <Text>
                    {reviewer?.name || `User #${reviewer?.id}` || 'N/A'}
                </Text>
            ),
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => renderRating(rating),
            sorter: true,
        },
       {
            title: 'Decision',
            dataIndex: 'decision',
            key: 'decision',
            render: (decision) => {
            const status = statusOptions.find((s) => s.value == decision);
            return status ? (
                <Tag color={status.color}>{status.label}</Tag>
            ) : (
                <Tag>Unknown</Tag>
            );
            },
        },
        {
            title: 'Comments',
            dataIndex: 'comments',
            key: 'comments',
            render: (comments) => (
                <Tooltip title={comments}>
                    <Text ellipsis={{ tooltip: comments }}>
                        {comments || 'No comments'}
                    </Text>
                </Tooltip>
            ),
        },
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     fixed: 'right',
        //     width: 150,
        //     render: (_, record) => (
        //         <Space size="small">
        //             <Tooltip title="Delete">
        //                 <Popconfirm
        //                     title="Delete this review?"
        //                     description="Are you sure you want to delete this review?"
        //                     onConfirm={() => handleDelete(record.id)}
        //                     okText="Yes"
        //                     cancelText="No"
        //                     okType="danger"
        //                 >
        //                     <Button 
        //                         type="text" 
        //                         icon={<DeleteOutlined />} 
        //                         size="small"
        //                         danger
        //                     />
        //                 </Popconfirm>
        //             </Tooltip>
        //         </Space>
        //     ),
        // },
    ];
    
    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Contest Reviews"
        >
            <Card>
               <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Reviews {reviews.total > 0 ? `(${reviews.total})` : ''}
                        </Title>
                        <Text type="secondary">
                            Manage contest entry reviews and evaluations
                        </Text>
                    </div>
                    <Link href={route('user.contests.index')}>
                        <Button type="primary" icon={<BackwardFilled />} size="large">
                                Back to contests
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
                                placeholder="Search by comments, "
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters?.search}
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

                <Table 
                    columns={columns} 
                    dataSource={reviews.data ? reviews.data.map(review => ({ ...review, key: review.id })) : []}
                    pagination={{
                        current: reviews.current_page,
                        pageSize: reviews.per_page,
                        total: reviews.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} reviews`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </FrontAuthenticatedLayout>
    );
}
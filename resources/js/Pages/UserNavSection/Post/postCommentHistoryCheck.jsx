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
    Row,
    Col,
    Select,
    Input,
    Avatar,
    Badge,
} from 'antd';
import { 
    CommentOutlined,
    EyeOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    DeleteOutlined,
    EditOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function PostCommentHistory({ comments, filters, auth, post }) {

    // Search handler
    const handleSearch = (value) => {
        router.get(route('user.posts.comments.history', post.id), {
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
        router.get(route('user.posts.comments.history', post.id), {
            ...filters,
            [key]: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Reset all filters
    const resetFilters = () => {
        router.get(route('user.posts.comments.history', post.id), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Handle table changes (pagination, sorting)
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('user.posts.comments.history', post.id), {
            ...filters,
            sort_field: sorter.field || 'created_at',
            sort_direction: sorter.order === 'ascend' ? 'asc' : 'desc',
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Get status config
    const getStatusConfig = (status) => {
        const config = {
            approved: { color: 'green', icon: <CheckCircleOutlined />, text: 'Approved' },
            pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Pending' },
            rejected: { color: 'red', icon: <DeleteOutlined />, text: 'Rejected' },
            spam: { color: 'volcano', icon: <DeleteOutlined />, text: 'Spam' }
        };
        return config[status] || { color: 'default', icon: null, text: status };
    };

    // Update comment status
    const handleStatusUpdate = (commentId, status) => {
        router.patch(route('user.posts.comments.update-status', commentId), {
            status: status
        }, {
            onSuccess: () => {
                message.success(`Comment ${status} successfully`);
            },
            onError: () => {
                message.error('Error updating comment status');
            }
        });
    };

    // Delete comment
    const handleDelete = (id) => {
        router.delete(route('user.posts.comments.destroy', id), {
            onSuccess: () => {
                message.success('Comment deleted successfully');
            },
            onError: () => {
                message.error('Error deleting comment');
            }
        });
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
            title: 'User',
            dataIndex: 'comment_by',
            key: 'comment_by',
            render: (user) => (
                <Space>
                    <Avatar 
                        src={user?.avatar ? `/storage/${user.avatar}` : null} 
                        icon={!user?.avatar && <UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div>
                            <Text strong>{user?.name || 'Anonymous'}</Text>
                        </div>
                        <div>
                            <Text type="secondary" size="small">
                                {user?.email || 'N/A'}
                            </Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Comment',
            dataIndex: 'comment',
            key: 'comment',
            render: (text) => (
                <Paragraph 
                    ellipsis={{ 
                        rows: 2, 
                        expandable: true, 
                        symbol: 'more' 
                    }}
                    style={{ margin: 0, maxWidth: 300 }}
                >
                    {text}
                </Paragraph>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const config = getStatusConfig(status);
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.text}
                    </Tag>
                );
            },
            filters: [
                { text: 'Approved', value: 'approved' },
                { text: 'Pending', value: 'pending' },
                { text: 'Rejected', value: 'rejected' },
                { text: 'Spam', value: 'spam' },
            ],
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => (
                rating ? (
                    <Badge 
                        count={rating} 
                        style={{ backgroundColor: '#52c41a' }}
                        showZero 
                    />
                ) : (
                    <Text type="secondary">N/A</Text>
                )
            ),
        },
        {
            title: 'Comment Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => (
                <Space direction="vertical" size={0}>
                    <Text>{new Date(date).toLocaleDateString()}</Text>
                    <Text type="secondary" size="small">
                        {new Date(date).toLocaleTimeString()}
                    </Text>
                </Space>
            ),
            sorter: true,
            defaultSortOrder: 'descend',
        },
      
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                 

                    {/* Status Update Buttons */}
                    {record.status !== 'approved' && (
                        <Tooltip title="Approve Comment">
                            <Button 
                                type="primary" 
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleStatusUpdate(record.id, 'approved')}
                            />
                        </Tooltip>
                    )}

                    {record.status !== 'rejected' && (
                        <Tooltip title="Reject Comment">
                            <Button 
                                danger 
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleStatusUpdate(record.id, 'rejected')}
                            />
                        </Tooltip>
                    )}

                    {record.status !== 'spam' && (
                        <Tooltip title="Mark as Spam">
                            <Button 
                                type="dashed" 
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleStatusUpdate(record.id, 'spam')}
                            />
                        </Tooltip>
                    )}

                    <Popconfirm
                        title="Delete Comment"
                        description="Are you sure to delete this comment? This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Comment">
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

    // Calculate comment statistics
    const commentStats = comments.data.reduce((stats, comment) => {
        stats[comment.status] = (stats[comment.status] || 0) + 1;
        stats.total = (stats.total || 0) + 1;
        stats.withRating = (stats.withRating || 0) + (comment.rating ? 1 : 0);
        return stats;
    }, {});

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`Post Comments - ${post?.title || 'Post'}`}
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <CommentOutlined /> Post Comments
                        </Title>
                        <Text type="secondary">
                            Managing comments for: <Text strong>"{post?.title}"</Text>
                        </Text>
                        
                        {commentStats.total > 0 && (
                            <div className="mt-2">
                                <Space size="middle" wrap>
                                    <Text strong>Comment Summary:</Text>
                                    {Object.entries(commentStats).map(([type, count]) => {
                                        if (type === 'total' || type === 'withRating') return null;
                                        const config = getStatusConfig(type);
                                        return (
                                            <Tag key={type} color={config.color} icon={config.icon}>
                                                {config.text}: {count}
                                            </Tag>
                                        );
                                    })}
                                    <Tag color="blue">
                                        Total: {commentStats.total}
                                    </Tag>
                                    {commentStats.withRating > 0 && (
                                        <Tag color="gold">
                                            With Rating: {commentStats.withRating}
                                        </Tag>
                                    )}
                                </Space>
                            </div>
                        )}
                    </div>

                    <Space>
                        <Link href={route('user.posts.show', post.id)}>
                            <Button type="default" icon={<EyeOutlined />} size="large">
                                View Post
                            </Button>
                        </Link>
                        <Link href={route('user.posts.index')}>
                            <Button type="primary" size="large">
                                Back to Posts
                            </Button>
                        </Link>
                    </Space>
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
                                placeholder="Search by user name, email, or comment..."
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
                                <Option value="approved">Approved</Option>
                                <Option value="pending">Pending</Option>
                                <Option value="rejected">Rejected</Option>
                                <Option value="spam">Spam</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Has Rating"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.has_rating || null}
                                onChange={(value) => handleFilter('has_rating', value)}
                            >
                                <Option value="1">With Rating</Option>
                                <Option value="0">Without Rating</Option>
                            </Select>
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Sort By"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.sort || null}
                                onChange={(value) => handleFilter('sort', value)}
                            >
                                <Option value="latest">Latest First</Option>
                                <Option value="oldest">Oldest First</Option>
                                <Option value="rating">Highest Rating</Option>
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

                {/* Comments Table */}
                <Table 
                    columns={columns} 
                    dataSource={comments.data.map(comment => ({ 
                        ...comment, 
                        key: comment.id 
                    }))}
                    pagination={{
                        current: comments.current_page,
                        pageSize: comments.per_page,
                        total: comments.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} comments`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    loading={comments.data.length === 0 && !filters.search}
                    locale={{
                        emptyText: 'No comments found for this post'
                    }}
                />
            </Card>
        </FrontAuthenticatedLayout>
    );
}
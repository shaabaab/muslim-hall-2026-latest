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
} from 'antd';
import { 
    HeartOutlined,
    LikeOutlined,
    DislikeOutlined,
    StarOutlined,
    EyeOutlined,
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    DeleteOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function PostReactionHistory({ reactions, filters, auth, post }) {

    // Search handler
    const handleSearch = (value) => {
        router.get(route('user.posts.reactions', post.id), {
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
        router.get(route('user.posts.reactions', post.id), {
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
        router.get(route('user.posts.reactions', post.id), {}, {
            preserveState: true,
            replace: true
        });
    };

    // Handle table changes (pagination, sorting)
    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('user.posts.reactions', post.id), {
            ...filters,
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Get reaction icon and color
    const getReactionConfig = (type) => {
        const config = {
            like: { icon: <LikeOutlined />, color: 'blue', text: 'Like' },
            love: { icon: <HeartOutlined />, color: 'red', text: 'Love' },
            star: { icon: <StarOutlined />, color: 'gold', text: 'Star' },
            dislike: { icon: <DislikeOutlined />, color: 'volcano', text: 'Dislike' }
        };
        return config[type] || { icon: <LikeOutlined />, color: 'default', text: type };
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
            dataIndex: 'user',
            key: 'user',
            render: (user) => (
                <Space>
                    <Avatar 
                        src={user?.avatar ? `/storage/${user.avatar}` : null} 
                        icon={!user?.avatar && <UserOutlined />}
                        size="small"
                    />
                    <Text strong>{user?.name || 'Anonymous'}</Text>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'user',
            key: 'email',
            render: (user) => (
                <Text type="secondary">{user?.email || 'N/A'}</Text>
            ),
        },
        {
            title: 'Reaction Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const config = getReactionConfig(type);
                return (
                    <Tag icon={config.icon} color={config.color}>
                        {config.text}
                    </Tag>
                );
            },
            filters: [
                { text: 'Like', value: 'like' },
                { text: 'Love', value: 'love' },
                { text: 'Star', value: 'star' },
                { text: 'Dislike', value: 'dislike' },
            ],
        },
        {
            title: 'Reaction Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => (
                <Text>{new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString()}</Text>
            ),
            sorter: true,
            defaultSortOrder: 'descend',
        },
        
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space size="small">
                    <Popconfirm
                        title="Remove Reaction"
                        description="Are you sure to remove this reaction?"
                        onConfirm={() => handleRemoveReaction(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Remove Reaction">
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

    // Remove reaction handler
    const handleRemoveReaction = (id) => {
        router.delete(route('user.posts.reactions.destroy', id), {
            onSuccess: () => {
                message.success('Reaction removed successfully');
            },
            onError: () => {
                message.error('Error removing reaction');
            }
        });
    };

    // Calculate reaction statistics
    const reactionStats = reactions.data.reduce((stats, reaction) => {
        stats[reaction.type] = (stats[reaction.type] || 0) + 1;
        stats.total = (stats.total || 0) + 1;
        return stats;
    }, {});

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`Post Reactions - ${post?.title || 'Post'}`}
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Post Reactions
                        </Title>
                        <Text type="secondary">
                            Viewing reactions for: <Text strong>"{post?.title}"</Text>
                        </Text>
                        
                        {/* Reaction Statistics */}
                        {reactionStats.total > 0 && (
                            <div className="mt-2">
                                <Space size="middle">
                                    <Text strong>Reaction Summary:</Text>
                                    {Object.entries(reactionStats).map(([type, count]) => {
                                        if (type === 'total') return null;
                                        const config = getReactionConfig(type);
                                        return (
                                            <Tag key={type} color={config.color} icon={config.icon}>
                                                {config.text}: {count}
                                            </Tag>
                                        );
                                    })}
                                    <Tag color="default">
                                        Total: {reactionStats.total}
                                    </Tag>
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
                                placeholder="Search by user name or email..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col>
                        <Col xs={12} sm={6} md={4}>
                            <Select
                                placeholder="Reaction Type"
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                value={filters.type || null}
                                onChange={(value) => handleFilter('type', value)}
                            >
                                <Option value="like">Like</Option>
                                <Option value="love">Love</Option>
                                <Option value="dislike">Dislike</Option>
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

                {/* Reactions Table */}
                <Table 
                    columns={columns} 
                    dataSource={reactions.data.map(reaction => ({ 
                        ...reaction, 
                        key: reaction.id 
                    }))}
                    pagination={{
                        current: reactions.current_page,
                        pageSize: reactions.per_page,
                        total: reactions.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} reactions`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                    loading={reactions.data.length === 0 && !filters.search}
                    locale={{
                        emptyText: 'No reactions found for this post'
                    }}
                />
            </Card>
        </FrontAuthenticatedLayout>
    );
}
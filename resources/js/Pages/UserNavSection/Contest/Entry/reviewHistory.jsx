import { Head, Link, router } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';

import {
    Table,
    Card,
    Row,
    Col,
    Statistic,
    Tag,
    Space,
    Typography,
    Button,
    Avatar,
    Empty,
    Input,
    Tooltip,
    Rate,
} from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    FilterOutlined,
    EyeOutlined,
    StarOutlined,
    MessageOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const ReviewHistory = ({ entryId, reviewHistory, filters = {}, auth }) => {
    
    const columns = [
        {
            title: 'Reviewer',
            dataIndex: 'reviewer',
            key: 'reviewer',
            render: (reviewer) => (
                <Space>
                    <Avatar 
                        icon={<UserOutlined />} 
                        src={reviewer?.avatar} 
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{reviewer?.name || 'Unknown Reviewer'}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            @{reviewer?.email || 'N/A'}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'reviewer',
            key: 'email',
            render: (reviewer) => (
                <Text>{reviewer?.email || 'N/A'}</Text>
            ),
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            align: 'center',
            render: (rating) => (
                <Space direction="vertical" size="small">
                    <Rate 
                        disabled 
                        value={rating} 
                        style={{ fontSize: '16px' }}
                    />
                    <Tag 
                        color={getRatingColor(rating)} 
                        style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '50px' }}
                    >
                        {rating}/5
                    </Tag>
                </Space>
            ),
        },
        {
            title: 'Comments',
            dataIndex: 'comments',
            key: 'comments',
            render: (comments) => (
                <Tooltip title={comments}>
                    <Paragraph 
                        ellipsis={{ 
                            rows: 2, 
                            expandable: true, 
                            symbol: 'more' 
                        }}
                        style={{ margin: 0, maxWidth: '300px' }}
                    >
                        {comments || <Text type="secondary">No comments</Text>}
                    </Paragraph>
                </Tooltip>
            ),
        },
        {
            title: 'Reviewed At',
            dataIndex: 'created_at_formatted',
            key: 'created_at',
            render: (date, record) => (
                <Space>
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    <Text>{date}</Text>
                </Space>
            ),
        },
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     align: 'center',
        //     render: (_, record) => (
        //         <Tooltip title="View Reviewer Profile">
        //             <Button 
        //                 type="link" 
        //                 size="small"
        //                 icon={<EyeOutlined />}
        //                 onClick={() => handleViewReviewer(record.reviewer?.id)}
        //                 disabled={!record.reviewer?.id}
        //             >
        //                 View Profile
        //             </Button>
        //         </Tooltip>
        //     ),
        // },
        
    ];

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return '#52c41a'; // Excellent - Green
        if (rating >= 4) return '#73d13d';   // Very Good - Light Green
        if (rating >= 3) return '#faad14';   // Average - Yellow
        if (rating >= 2) return '#fa8c16';   // Poor - Orange
        return '#f5222d';                    // Very Poor - Red
    };

    const handleViewReviewer = (reviewerId) => {
        if (reviewerId) {
            window.location.href = `/users/${reviewerId}`;
        }
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(route('user.entries.review-history', entryId), {
            ...filters,
            search: value,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    // Reset all filters
    const resetFilters = () => {
        router.get(route('user.entries.review-history', entryId), {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('user.entries.review-history', entryId), {
            ...filters,
            page: pagination.current,
            per_page: pagination.pageSize,
            sort_field: sorter.field,
            sort_order: sorter.order,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const calculateStats = () => {
        if (!reviewHistory.data || reviewHistory.data.length === 0) {
            return { 
                average: 0, 
                total: 0, 
                highest: 0, 
                lowest: 0,
                withComments: 0 
            };
        }
        
        const ratings = reviewHistory.data.map(review => review.rating);
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const highest = Math.max(...ratings);
        const lowest = Math.min(...ratings);
        const withComments = reviewHistory.data.filter(review => review.comments).length;

        return {
            average: average.toFixed(1),
            total: reviewHistory.total,
            highest,
            lowest,
            withComments,
        };
    };

    const stats = calculateStats();

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Contest Management"
        >
            <Head title={`Review History - Entry #${entryId}`} />
            
            <div style={{ padding: '24px' }}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Space>
                            <Link href={window.previousUrl || route('user.contests.index')}>
                                <Button icon={<ArrowLeftOutlined />}>
                                    Back
                                </Button>
                            </Link>
                            <Title level={2} className="mb-2" style={{ margin: 0 }}>
                                Review History
                            </Title>
                        </Space>
                        <div>
                            <Text type="secondary">
                                All reviews received for Entry #{entryId}
                            </Text>
                            <Tag color="blue" style={{ marginLeft: '8px' }}>
                                {reviewHistory.total || 0} Total Reviews
                            </Tag>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Total Reviews"
                                value={stats.total}
                                prefix={<MessageOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Average Rating"
                                value={stats.average}
                                precision={1}
                                suffix="/5"
                                valueStyle={{ 
                                    color: getRatingColor(parseFloat(stats.average)) 
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Highest Rating"
                                value={stats.highest}
                                suffix="/5"
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Reviews with Comments"
                                value={stats.withComments}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by reviewer name, email, or comments..."
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

                {/* Reviews Table */}
                <Card 
                    title={
                        <Space>
                            <StarOutlined />
                            <span>All Reviews ({reviewHistory.total || 0})</span>
                        </Space>
                    }
                >
                    {reviewHistory.data && reviewHistory.data.length > 0 ? (
                        <Table
                            columns={columns}
                            dataSource={reviewHistory.data.map(review => ({ ...review, key: review.id }))}
                            pagination={{
                                current: reviewHistory.current_page || 1,
                                pageSize: reviewHistory.per_page || 10,
                                total: reviewHistory.total || 0,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} of ${total} reviews`,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            scroll={{ x: 1000 }}
                        />
                    ) : (
                        <Empty
                            description="No reviews found for this entry"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary">
                                Share Entry to Get Reviews
                            </Button>
                        </Empty>
                    )}
                </Card>
            </div>
        </FrontAuthenticatedLayout>
    );
};

export default ReviewHistory;
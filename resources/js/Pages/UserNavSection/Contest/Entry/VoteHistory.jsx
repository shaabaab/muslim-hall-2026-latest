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
} from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    ReloadOutlined,
    FilterOutlined,
    EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const VoteHistory = ({ entryId, voteHistory, filters = {}, auth }) => {
    
    const columns = [
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
            render: (user) => (
                <Space>
                    <Avatar 
                        icon={<UserOutlined />} 
                        src={user?.avatar} 
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{user?.name || 'Unknown User'}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            @{user?.email || 'N/A'}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'user',
            key: 'email',
            render: (user) => (
                <Text>{user?.email || 'N/A'}</Text>
            ),
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            align: 'center',
            render: (score) => (
                <Tag 
                    color={getScoreColor(score)} 
                    style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '50px' }}
                >
                    {score}
                </Tag>
            ),
        },
        {
            title: 'Voted At',
            dataIndex: 'created_at_formatted',
            key: 'created_at',
            render: (date, record) => (
                <Space>
                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                    <Text>{date}</Text>
                </Space>
            ),
        },
        
    ];

    const getScoreColor = (score) => {
        if (score >= 9) return '#52c41a'; 
        if (score >= 7) return '#1890ff'; 
        if (score >= 5) return '#faad14'; 
        return '#f5222d'; 
    };

    const handleViewUser = (userId) => {
        if (userId) {
            window.location.href = `/users/${userId}`;
        }
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(route('user.entries.vote-history', entryId), {
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
        router.get(route('user.entries.vote-history', entryId), {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        router.get(route('user.entries.vote-history', entryId), {
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
        if (!voteHistory.data || voteHistory.data.length === 0) {
            return { average: 0, total: 0, highest: 0, lowest: 0 };
        }
        
        const scores = voteHistory.data.map(vote => vote.score);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);

        return {
            average: average.toFixed(1),
            total: voteHistory.total,
            highest,
            lowest,
        };
    };

    const stats = calculateStats();

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header="Contest Management"
        >
            <Head title={`Vote History - Entry #${entryId}`} />
            
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
                                Vote History
                            </Title>
                        </Space>
                        <div>
                            <Text type="secondary">
                                All votes received for Entry #{entryId}
                            </Text>
                            <Tag color="blue" style={{ marginLeft: '8px' }}>
                                {voteHistory.total || 0} Total Votes
                            </Tag>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Total Votes"
                                value={stats.total}
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Average Score"
                                value={stats.average}
                                precision={1}
                                valueStyle={{ 
                                    color: getScoreColor(parseFloat(stats.average)) 
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Highest Score"
                                value={stats.highest}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Lowest Score"
                                value={stats.lowest}
                                valueStyle={{ color: '#f5222d' }}
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
                                placeholder="Search by user name, email..."
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

                {/* Votes Table */}
                <Card 
                    title={
                        <Space>
                            <UserOutlined />
                            <span>All Votes ({voteHistory.total || 0})</span>
                        </Space>
                    }
                >
                    {voteHistory.data && voteHistory.data.length > 0 ? (
                        <Table
                            columns={columns}
                            dataSource={voteHistory.data.map(vote => ({ ...vote, key: vote.id }))}
                            pagination={{
                                current: voteHistory.current_page || 1,
                                pageSize: voteHistory.per_page || 10,
                                total: voteHistory.total || 0,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} of ${total} votes`,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            scroll={{ x: 800 }}
                        />
                    ) : (
                        <Empty
                            description="No votes found for this entry"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary">
                                Share Entry to Get Votes
                            </Button>
                        </Empty>
                    )}
                </Card>
            </div>
        </FrontAuthenticatedLayout>
    );
};

export default VoteHistory;
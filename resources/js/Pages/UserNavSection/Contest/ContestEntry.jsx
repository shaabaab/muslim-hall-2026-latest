import { Link, router } from '@inertiajs/react';
import FrontAuthenticatedLayout from '@/Layouts/FrontAuthenticatedLayout';

import { 
    Table, 
    Button, 
    Space, 
    Tag, 
    Input,
    Card, 
    Typography, 
    Popconfirm,
    message,
    Tooltip,
    Row,
    Col,
    Select,
    Badge,
    Progress,
    Avatar,
    Rate,
    Modal,
    Form,
    Image
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    FilterOutlined,
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    HeartOutlined,
    HeartFilled,
    TrophyOutlined,
    UserOutlined,
    StarOutlined,
    LikeOutlined,
    PictureOutlined
} from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';

const statusOptions = [
    { value: STATUS_PENDING, label: 'Pending', color: 'orange' },
    { value: STATUS_APPROVED, label: 'Approved', color: 'green' },
    { value: STATUS_REJECTED, label: 'Rejected', color: 'red' },
];

export default function ContestEntry({ entries, auth, contest, filters }) {
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [reviewForm] = Form.useForm();



     const handleSearch = (value) => {
            router.get(route('user.entries.index', { id: contest.id }), {
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
            router.get(route('user.entries.index', { id: contest.id }), {
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
            router.get(route('user.entries.index',{ id: contest.id }), {}, {
                preserveState: true,
                replace: true
            });
        };

        const hasUserVoted = (contest) => {
            return contest.votes && contest.votes.some(vote => vote.user_id == auth.user.id);
        };

        const hasUserContestVoted = (contest) => {
            return contest.votes && contest.votes.some(vote => vote.user_id == auth.user.id);
        };

        // const hasUserReviewed = (entry) => {
        //     return entry.reviews && entry.reviews.some(review => review.reviewed_by  == auth.user.id);
        // };
      

        const hasUserReviewed = (entries) => {
            if (!Array.isArray(entries)) return false;

            return entries.some(entry =>
                Array.isArray(entry.reviews) &&
                entry.reviews.some(review => review.reviewed_by  == auth.user.id)
            );
        };


    



    // Check if entry is a winner
    const isWinner = (entry) => {
        return entry.winner !== null;
    };

    // Vote handler
    const handleVote = (entryId) => {
        router.post(route('user.entries.vote', entryId), {}, {
            preserveState: true,
            onSuccess: () => {
                message.success('Vote submitted successfully!');
            },
            onError: (errors) => {
                console.log(errors.error);
                message.error(errors.error || 'Failed to submit vote.');
            }
        });
    };

    // Review handler
    const handleReview = (entry) => {
        setSelectedEntry(entry);
        setReviewModalVisible(true);
    };

    ///hader view entry

    const handleViewEntry = (entry) => {
        router.get(route('user.entries.show', entry.id));
    }

    // Submit review
    const submitReview = (values) => {
        if (!selectedEntry) return;

        console.log('Submitting review for entry ID:', selectedEntry.id, 'with values:', values);

        router.post(route('user.entry.reviews.store', selectedEntry.id), values, {
            preserveState: true,
            onSuccess: () => {
                message.success(' Review submitted successfully!');
                setReviewModalVisible(false);
                setSelectedEntry(null);
                reviewForm.resetFields();
            },
            onError: (errors) => {
                console.log('Review submission errors:', errors.error);
                message.error(errors.error || 'Failed to submit review.');
            }
        });
    };

 

       const columns = [
    
            {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                render: (text,record,index) => <Text>{index + 1}</Text>,
            },
    
            {
                title: 'Title',
                dataIndex: 'title',
                key: 'title',
                render: (text) => (
                    <Space>
                        <Text strong>{text}</Text>
                    </Space>
                ),
            },
    
            {
                title: 'Total Vote',
                dataIndex: 'total_votes',
                key: 'total_votes',
                render: (text) => <Text>{text}</Text>,
            },
    
            {
                title: ' Status',
                dataIndex: 'status',
                key: 'status',
                render: (text) => (
                <Space size="small">
                    {statusOptions.map((option) =>
                        option.value === text ? (
                            <Tag color={option.color} key={option.value}>
                                {option.label}
                            </Tag>
                        ) : null
                    )}
                </Space>
                ),
            },

            {
                title: 'User Info',
                key: 'user_id',
                render: (_, record) => (
                    <Text>{record.user ? `${record.user.name} (${record.user.email})` : 'N/A'}</Text>
                ),
            },

            {
                title: 'Winner',
                key: 'winner',
                width: 100,
                render: (_, record) => (
                    isWinner(record) ? (
                        <Badge.Ribbon text="Winner" color="gold">
                            <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                        </Badge.Ribbon>
                    ) : (
                        <Text type="secondary">------</Text>
                    )
                ),
            },
    
           {
            title: 'Media',
            dataIndex: 'media_path',
            key: 'media_path',
            render: (text) => {
                if (!text) return 'N/A';
    
                const fileUrl = `/storage/${text}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(text);
                const isVideo = /\.(mp4|webm|ogg)$/i.test(text);
    
                return (
                    <>
                        {isImage ? (
                            <img
                                src={fileUrl}
                                alt="Entry Media"
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                                }}
                            />
                        ) : isVideo ? (
                            <video
                                src={fileUrl}
                                controls
                                style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                }}
                            />
                        ) : (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                Download File
                            </a>
                        )}
                    </>
                );
                    },
                },
    
    
    
                {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (
                        <Space size="small">
    
                                {/* {hasUserVoted(record) && ( */}
                                    <Tooltip title="Vote for this Entry">
                                        <Button 
                                            type="primary" 
                                            icon={<HeartFilled />}
                                            size="small"
                                            disabled={hasUserContestVoted(record)}
                                            onClick={() => handleVote(record.id)}
                                            style={{
                                                backgroundColor: '#ff4d4f',
                                                borderColor: '#ff4d4f',
                                            }}
                                            block
                                        >
                                            Vote
                                        </Button>
                                    </Tooltip>
                                {/* )} */}

                                <Tooltip title="View Entry">
                                    <Button 
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        size="small"
                                        onClick={() => handleViewEntry(record)}
                                    />
                                </Tooltip>

                                <Tooltip title="Add Review & Rating">
                                    <Button 
                                    type="dashed"
                                        icon={<StarOutlined />}
                                    size="small"
                                    onClick={() => handleReview(record)}
                                    >
                                    Review
                                </Button>
                                </Tooltip> 
                               
                        </Space>
                    ),
                },
            ];


    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`Contest Entries - ${contest?.title || 'Entries'}`}
        >
            <Card>
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2 flex items-center">
                            <TrophyOutlined className="mr-2 text-yellow-500" />
                            Contest Entries
                        </Title>
                        <Text type="secondary">
                            {contest?.title ? `Viewing all entries for: "${contest.title}"` : 'Browse contest entries'}
                        </Text>
                        <div className="mt-2">
                            <Text strong>Your Participation: </Text>
                            <Tag color="green" icon={<UserOutlined />}>
                                Registered Participant
                            </Tag>
                        </div>
                    </div>
                    
                    <Link href={route('user.contests.show', contest?.id)}>
                        <Button type="default" icon={<EyeOutlined />}>
                            View Contest
                        </Button>
                    </Link>
                </div>

                {/* Stats Overview */}
                <Card size="small" className="mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Row gutter={16}>
                        <Col xs={12} sm={6}>
                            <div className="text-center text-white">
                                <Title level={3} className="text-white mb-1">
                                    {entries.data.length + 1 || 0}
                                </Title>
                                <Text className="text-white opacity-90">Total Entries</Text>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="text-center text-white">
                                <Title level={3} className="text-white mb-1">
                                {(entries?.data || []).reduce(
                                    (sum, entry) => sum + (entry.total_votes || 0),
                                    0
                                )}
                                </Title>
                                <Text className="text-white opacity-90">Total Votes</Text>
                            </div>
                        </Col>

                        <Col xs={12} sm={6}>
                            <div className="text-center text-white">
                                <Title level={3} className="text-white mb-1">
                                {(entries?.data || []).filter(entry => isWinner(entry)).length}
                                </Title>
                                <Text className="text-white opacity-90">Winners</Text>
                            </div>
                        </Col>


                        <Col xs={12} sm={6}>
                            <div className="text-center text-white">
                                <Title level={3} className="text-white mb-1">
                                {(entries?.data || []).filter(entry => hasUserVoted(entry)).length}
                                </Title>
                                <Text className="text-white opacity-90">Your Votes</Text>
                            </div>
                        </Col>

                    </Row>
                </Card>
                
                {/* Quick Actions */}
                <Card size="small" className="mb-4">
                    <Row gutter={[16, 16]} justify="space-between" align="middle">
                        <Col>
                            <Text strong>Quick Actions:</Text>
                        </Col>
                        <Col>
                            <Space>
                                <Text type="secondary">Your voting progress:</Text>
                                    <Progress 
                                        percent={Math.round(
                                        ((entries?.data?.filter(entry => hasUserVoted(entry)).length || 0) /
                                            ((entries?.data?.length || 1))) * 100
                                        )}
                                        size="small"
                                        style={{ width: 150 }}
                                        strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                        }}
                                    />
                                    <Text type="secondary">
                                        {(entries?.data?.filter(entry => hasUserVoted(entry)).length || 0)} of {(entries?.data?.length || 0)} voted
                                    </Text>
                            </Space>
                        </Col>
                        <Col>
                            <Text style = {{color : '#F84B4D'}} strong>You can vote only once for this contest.</Text>
                        </Col>
                    </Row>
                </Card>

                <Row justify="space-between" align="middle" className="mb-4">
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Search by title, description..."
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
                    

                {/* Entries Table */}
                <Table 
                    columns={columns} 
                    dataSource={entries.data.map(entry => ({ ...entry, key: entry.id }))}
                    pagination={{
                        current: entries.current_page,
                        pageSize: entries.per_page,
                        total: entries.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} entries`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={entries.data.length === 0 && !filters.search}
                />


                {/* Review Modal */}
                <Modal
                    title={
                        <Space>
                            <StarOutlined />
                            Review Entry: {selectedEntry?.title}
                        </Space>
                    }
                    open={reviewModalVisible}
                    onCancel={() => {
                        setReviewModalVisible(false);
                        setSelectedEntry(null);
                        reviewForm.resetFields();
                    }}
                    footer={null}
                    width={600}
                    destroyOnClose
                >
                    {selectedEntry && (
                        <div className="p-4">
                            {/* Entry Preview */}
                            <Card size="small" className="mb-4">
                                <div className="flex items-start">
                                    <div>
                                        <Text strong>{selectedEntry.title}</Text>
                                        <br />
                                        <Text type="secondary">by {selectedEntry.user?.name}</Text>
                                        <br />
                                        <Text type="secondary">Votes: {selectedEntry.total_votes}</Text>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Review Form */}
                            <Form
                                form={reviewForm}
                                layout="vertical"
                                onFinish={submitReview}
                            >
                                <Form.Item
                                    name="rating"
                                    label="Rating"
                                    rules={[{ required: true, message: 'Please provide a rating' }]}
                                >
                                    <Rate allowHalf style={{ fontSize: 24 }} />
                                </Form.Item>

                                <Form.Item
                                    name="comment"
                                    label="Review Comment"
                                    rules={[{ required: true, message: 'Please write a review comment' }]}
                                >
                                    <Input.TextArea 
                                        rows={4}
                                        placeholder="Share your honest thoughts about this entry. What did you like? Any suggestions?"
                                        maxLength={500}
                                        showCount
                                    />
                                </Form.Item>

                                <Form.Item className="mb-0">
                                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                        <Button 
                                            onClick={() => {
                                                setReviewModalVisible(false);
                                                reviewForm.resetFields();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit"
                                            icon={<StarOutlined />}
                                        >
                                            Submit Review
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                    )}
                </Modal>
            </Card>
        </FrontAuthenticatedLayout>
    );
}
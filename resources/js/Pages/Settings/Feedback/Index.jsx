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
    DeleteOutlined, 
    FilterOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function Index({ feedbacks, auth }) {

    const TruncatedText = ({ text, limit = 50 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!text) return <Text type="secondary">No message</Text>;

    const isLong = text.length > limit;
    const displayText = expanded ? text : text.slice(0, limit);

    return (
        <Text>
        {displayText}
        {isLong && !expanded && '... '}
        {isLong && (
            <a
            onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
            }}
            style={{ marginLeft: 4, color: '#1677ff', cursor: 'pointer' }}
            >
            {expanded ? 'show less' : 'see more'}
            </a>
        )}
        </Text>
    );
    };



    const handleDelete = (id) => {
        router.delete(route('admin.settings.feedback.destroy', id), {
            onSuccess: () => {
                message.success('Data deleted successfully');
            },
            onError: () => {
                message.error('Error deleting data');
            }
        });
    };


    const handleTableChange = (pagination, filters) => {
        router.get(route('admin.settings.feedback.index'), {
            ...filters,
            page: pagination.current,
            per_page: pagination.pageSize
        }, {
            preserveState: true,
            replace: true
        });
    };


    const resetFilters = () => {
        router.get(route('admin.settings.feedback.index'), {}, {
            preserveState: true,
            replace: true
        });
    };



    const columns = [
        {
            title: 'ID',
            key: 'id',
            width: 80,
            dataIndex: 'id',
        },

        {
            title: 'User Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <Text >{text}</Text>
                </Space>
            ),
        },
        {
            title: 'User Email',
            dataIndex: 'email',
            key: 'email',
            render: (text) => (
                <Space>
                    <Text >{text}</Text>
                </Space>
            ),
        },

        {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            render: (text) => <TruncatedText text={text} limit={50} />,
        },

        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space size="small">
         
                    <Popconfirm
                        title="Delete Data"
                        description="Are you sure to delete this data?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete Data">
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
            header="Feedbacks Management"
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            feedbacks
                        </Title>
                        <Text type="secondary">
                            Manage your application feedbacks
                        </Text>
                    </div>
             
                </div>

                {/* Filters Section */}
                <Card size="small" className="mb-4">
                    <div className="flex items-center mb-4">
                        <FilterOutlined className="mr-2" />
                        <Text strong>Filters & Search</Text>
                    </div>
                    
                    <Row gutter={[16, 16]} align="middle">
                        {/* <Col xs={24} sm={12} md={8}>
                            <Search
                                placeholder="Search by name, slug, or language..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                defaultValue={filters.search}
                                onSearch={handleSearch}
                            />
                        </Col> */}
                       
                       
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

                {/* feedbacks Table */}
                <Table 
                    columns={columns} 
                    dataSource={feedbacks.data.map(feedback => ({ ...feedback, key: feedback.id }))}
                    pagination={{
                        current: feedbacks.current_page,
                        pageSize: feedbacks.per_page,
                        total: feedbacks.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} feedbacks`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                    loading={feedbacks.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
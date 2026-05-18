import { Link, router } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';

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
    Select
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    FilterOutlined  ,
    SearchOutlined ,
    ReloadOutlined ,
    EyeOutlined,
    EyeTwoTone
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const statusOptions = {
  1: { label: 'Upcoming', color: 'blue' },
  2: { label: 'Running', color: 'green' },
  3: { label: 'Ended', color: 'red' },
  4: { label: 'Archived', color: 'gray' },
};

export default function Index({ contests, filters, auth }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };

    // Search handler
    const handleSearch = (value) => {
        router.get(route('admin.archived.index'), {
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
        router.get(route('admin.archived.index'), {
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
        router.get(route('admin.archived.index'), {
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
        router.get(route('admin.archived.index'), {}, {
            preserveState: true,
            replace: true
        });
    };

    const handleDelete = (id) => {
        router.delete(route('admin.archived.destroy', id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log('Confirmed');
            },
            onSuccess: () => {
                message.success('Contest deleted successfully');
            },
            onError: () => {
                message.error('Error deleting contest');
            }
        });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            fixed: 'left', // Fixed to left
            width: 80, // Set a fixed width for better performance
            render: (text, record, index) => (   
                <Text strong>{index + 1}</Text>
            ),
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 200, // Set appropriate widths for scrollable columns
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category) => (
                <Text>{category ? category.name : 'N/A'}</Text>
            ),
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Contest Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                switch (Number(status)) {
                    case 1: return <Tag color="blue">Upcoming</Tag>;
                    case 2: return <Tag color="green">Running</Tag>;
                    case 3: return <Tag color="red">Ended</Tag>;
                    case 4: return <Tag color="gray">Archived</Tag>;
                    default: return <Tag color="default">Unknown</Tag>;
                }
            },
        },
        {
            title: 'Created By',
            key: 'created_by',
            width: 200,
            render: (_, record) => (
                <Text>{record.creator ? `${record.creator.name} (${record.creator.email})` : 'N/A'}</Text>
            ),
        },
        {
            title: 'Prize Positions',
            key: 'prize_positions',
            width: 120,
            render: (_, record) => (
                <Text>{record.prizes ? record.prizes.length : 'N/A'}</Text>
            ),
        },
        {
            title: 'Total Entries',
            key: 'total_entries',
            width: 120,
            render: (_, record) => (
                <Text>{record.entries ? record.entries.length : 'N/A'}</Text>
            ),
        },
   
    ];
    
    return (
        <Authenticated
            user={auth.user}
            header="Contest Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Contests
                        </Title>
                        <Text type="secondary">
                            Manage your application contests
                        </Text>
                    </div>

                    <Link href={route('admin.contests.create')}>
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Add Contest
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
                </Card>

                <Table 
                    columns={columns} 
                    dataSource={contests.data.map(contest => ({ ...contest, key: contest.id }))}
                    pagination={{
                        current: contests.current_page,
                        pageSize: contests.per_page,
                        total: contests.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} contests`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }} // Increase scroll width to accommodate all columns
                    loading={contests.data.length === 0 && !filters.search}
                />
            </Card>
        </Authenticated>
    );
}
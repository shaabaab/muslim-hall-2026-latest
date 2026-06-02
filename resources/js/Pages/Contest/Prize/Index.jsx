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
    PlusOutlined, 
    TeamOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;


export default function Index({ prizes,filters , auth }) {


    // Search handler
    const handleSearch = (value) => {
        router.get(route('admin.prizes.index'), {
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
        router.get(route('admin.prizes.index'), {
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
        router.get(route('admin.prizes.index'), {}, {
            preserveState: true,
            replace: true
        });
    };




    const columns = [

        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
      

        {
            title: 'Position Title',
            dataIndex: 'position',
            key: 'position',
            render: (position) => {
                const isWinner = position?.toLowerCase().includes('1') || position?.toLowerCase().includes('winner');
                return (
                    <Text strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isWinner && <span>🏆</span>}
                        {position || 'N/A'}
                    </Text>
                );
            },
        },

        
        {
            title: 'Normal User Amount (tk)',
            dataIndex: 'amount_normal_user',
            key: 'amount_normal_user',
            render: (amount_normal_user) => (
                <Text>{amount_normal_user ? `${amount_normal_user} Tk Only` : 'N/A'}</Text>
            ),
        },

        {
            title: 'Premium User Amount (tk)',
            dataIndex: 'amount_premium_user',
            key: 'amount_premium_user',
            render: (amount_premium_user) => (
                <Text>{amount_premium_user ? `${amount_premium_user} Tk Only` : 'N/A'}</Text>
            ),
        },


        
    ];

    
    return (
        <Authenticated
            user={auth.user}
            header="Prize List"
        >
            <Card>
               <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Prizes
                        </Title>
                        <Text type="secondary">
                            Manage your application prizes
                        </Text>
                    </div>

                        <Link href={route('admin.prizes.create')}>
                            <Button type="primary" icon={<PlusOutlined />} size="large">
                                Add Prize Poll
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
                                placeholder="Search by contest title, position..."
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
                    dataSource={prizes.data.map(prize => ({ ...prize, key: prize.id }))}
                    pagination={{
                        current: prizes.current_page,
                        pageSize: prizes.per_page,
                        total: prizes.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} prizes`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                />
            </Card>
        </Authenticated>
    );
}
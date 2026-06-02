import { Link, usePage } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Table, 
    Button, 
    Card, 
    Space, 
    Tag, 
    Typography, 
    Popconfirm, 
    message,
    Tooltip,
    Switch,
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined,
    EyeOutlined,
    TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Index({ auth, badges }) {
    const { props } = usePage();
    
    const handleStatusChange = (badge, checked) => {
        console.log(`Updating badge ${badge.id} status to:`, checked);
        message.info(`Badge status updated to ${checked ? 'Active' : 'Inactive'}`);
    };

    const handleDelete = (badge) => {
        console.log('Deleting badge:', badge.id);
        message.success('Badge deleted successfully');
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <div 
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: record.color || '#ccc',
                            display: 'inline-block',
                        }}
                    />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Min Amount',
            dataIndex: 'min_amount',
            key: 'min_amount',
            render: (amount) => `Tk ${parseFloat(amount).toFixed(2)}`,
        },
        {
            title: 'Max Amount',
            dataIndex: 'max_amount',
            key: 'max_amount',
            render: (amount) => `Tk ${parseFloat(amount).toFixed(2)}`,
        },
        {
            title: 'Color',
            dataIndex: 'color',
            key: 'color',
            render: (color) => (
                <Space>
                    <div 
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            backgroundColor: color,
                            border: '1px solid #d9d9d9',
                        }}
                    />
                    <Text>{color}</Text>
                </Space>
            ),
        },

        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Badge">
                        <Link href={route('admin.badges.edit', record.id)}>
                            <Button 
                                type="primary" 
                                icon={<EditOutlined />} 
                                size="small"
                                ghost
                            />
                        </Link>
                    </Tooltip>


                    <Tooltip title="Delete Badge">
                        <Popconfirm
                            title="Delete Badge"
                            description="Are you sure you want to delete this badge?"
                            onConfirm={() => handleDelete(record)}
                            okText="Yes"
                            cancelText="No"
                            okType="danger"
                        >
                            <Button 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Authenticated
            user={auth.user}
            header="Badge Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between mb-6">
                    <div>
                        <Title level={3} className="mb-2">
                            Badge
                        </Title>
                        <Text type="secondary">
                            Manage all Badge in your application
                        </Text>
                    </div>
                    
                    <Link href={route('admin.badges.create')}>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            size="large"
                        >
                            Create New Bridge
                        </Button>
                    </Link>
                </div>

                <Table
                    columns={columns}
                    dataSource={badges.map(badge => ({ 
                        ...badge, 
                        key: badge.id 
                    }))}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </Authenticated>
    );
}
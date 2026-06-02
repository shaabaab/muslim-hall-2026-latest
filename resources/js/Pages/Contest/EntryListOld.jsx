import { Link, router, useForm } from '@inertiajs/react';
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
    EyeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';
const STATUS_REJECTED = 'rejected';

const statusOptions = [
    { label: 'Pending', value: STATUS_PENDING ,color: 'blue'},
    { label: 'Approved', value: STATUS_APPROVED ,color: 'green' },
    { label: 'Rejected', value: STATUS_REJECTED, color: 'red' },
];

export default function Index({ entries, contestTitle, filters, auth }) {

    const handleDeclareWinner = (entryId) => {
        router.post(route('winner.declare', entryId), {}, {
            onSuccess: () => {
                message.success('Winner declared successfully');
            },
            onError: () => {
                message.error('Error declaring winner');
            },
        });
    };

    const handleDelete = (id) => {
        router.delete(route('admin.entries.destroy', id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log('Confirmed');
            },
            onSuccess: () => {
                message.success('Language deleted successfully');
            },
            onError: () => {
                message.error('Error deleting language');
            }
        });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
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
            title: 'Winner Status',
            key: 'winner_id',
            render: (_, record) => (
                <Tag color="gold" >
                    <Text>{record.winner ? `🏆 ${record.winner.position} Position 🏆` : 'N/A'}</Text>
                </Tag>
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
            title: 'Total Vote',
            dataIndex: 'total_votes',
            key: 'total_votes',
            render: (text) => <Text>{text}</Text>,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Declare Winner">
                        <Button 
                            type="primary" 
                            size="small"
                            onClick={() => handleDeclareWinner(record.id)}
                        > 
                            Winner Declaration
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];
        
    return (
        <Authenticated
            user={auth.user}
            header={`All Entries of ${contestTitle}`}
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Entries for {contestTitle}
                        </Title>
                        <Text type="secondary">
                            Manage your application entries
                        </Text>
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={entries.map(entry => ({
                        ...entry,
                        key: entry.id,
                    }))}
                    rowKey="id"
                />
            </Card>
        </Authenticated>
    );
}
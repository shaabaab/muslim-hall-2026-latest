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
    Tooltip
} from 'antd';
import { 
    PlusOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    TeamOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function Index({ sections, auth }) {

    const can = (permission) => {
        return auth.user.permissions.includes(permission);
    };


    const handleDelete = (id) => {
        router.delete(route('admin.sections.destroy', id), {
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
            title: 'Section Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: 'Section Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: 'Section Status',
            dataIndex: 'status',
            key: 'status',
            render: (text) => (
                <Space size="small">
                    <Tag color={text ? 'green' : 'red'}>
                        {text ? 'Active' : 'Inactive'}
                    </Tag>
                </Space>
            ),
        },

        // lang_code
        {
            title: 'Language Name',
            key: 'language',
            render: (_, record) => (
            <Text>{record.language ? `${record.language.name} (${record.language.code})` : 'N/A'}</Text>
            ),
        },


        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    {/* {can('langs.edit') && ( */}
                        <Tooltip title="Edit Section">
                            <Link href={route('admin.sections.edit', record.id)}>
                                <Button 
                                    type="primary" 
                                    icon={<EditOutlined />} 
                                    size="small"
                                />
                            </Link>
                        </Tooltip>
                    {/* )} */}
                    
                    {/* {can('users.destroy') && record.id !== auth.user.id && ( */}
                        <Popconfirm
                            title="Delete Section"
                            description="Are you sure to delete this Section?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete Section">
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    size="small"
                                />
                            </Tooltip>
                        </Popconfirm>
                    {/* )} */}
                </Space>
            ),
        },
    ];

    
    return (
        <Authenticated
            user={auth.user}
            header="Sections Management"
        >
            <Card>
                <div className="flex sm:flex-row flex-col gap-3 justify-between items-center mb-6">
                    <div className="sm:text-left text-center">
                        <Title level={2} className="mb-2">
                            Sections
                        </Title>
                        <Text type="secondary">
                            Manage your application sections
                        </Text>
                    </div>

                    {/* {can('sections.create') && ( */}
                        <Link href={route('admin.sections.create')}>
                            <Button type="primary" icon={<PlusOutlined />} size="large">
                                Add Section
                            </Button>
                        </Link>
                    {/* )} */}
                </div>

                <Table 
                    columns={columns} 
                    dataSource={sections.map(section => ({ ...section, key: section.id }))}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </Authenticated>
    );
}
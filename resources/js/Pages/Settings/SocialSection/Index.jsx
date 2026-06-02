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
} from '@ant-design/icons';

const { Title, Text } = Typography;
import { useState } from 'react';

export default function Index({ socialLinks, auth }) {

    console.log(socialLinks);

    // const [socialLinks, setSocialLinks] = useState([]);

    const handleDelete = (id) => {
        router.delete(route('admin.settings.sociallinks.destroy', id), {
            onBefore: () => {
                console.log(id);
            },
            onConfirm: () => {
                console.log('Confirmed');
            },
            onSuccess: () => {
                message.success('Social Link deleted successfully');
            },
            onError: () => {
                message.error('Error deleting Social Link');
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
            title: 'Social Link Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => (
                <Space>
                    <Text strong>{text}</Text>
                </Space>
            ),
        },

        {
            title: 'Social Link Slug',
            dataIndex: 'url',
            key: 'url',
            render: (text) => <Text>{text}</Text>,
        },

        //icon
        {
            title: 'Social Link Icon',
            dataIndex: 'icon',
            key: 'icon',
            render: (text) => <Tag>{text}</Tag>,
        },

       
     
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                        <Tooltip title="Edit Social Link">
                            <Link href={route('admin.settings.sociallinks.edit', record.id)}>
                                <Button 
                                    type="primary" 
                                    icon={<EditOutlined />} 
                                    size="small"
                                />
                            </Link>
                        </Tooltip>
                    
                        <Popconfirm
                            title="Delete Social Link"
                            description="Are you sure to delete this Social Link?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete Social Link">
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
      <Authenticated user={auth.user} header="Social Links Management">
    <Card
        className="rounded-xl shadow-sm"
        bodyStyle={{ padding: "16px" }}
    >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
                <Title level={3} className="!mb-1">
                    Social Links
                </Title>
                <Text type="secondary" className="text-sm sm:text-base">
                    Manage your application social links
                </Text>
            </div>

            <Link href={route("admin.settings.sociallinks.create")}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    className="w-full sm:w-auto"
                >
                    Add Social Link
                </Button>
            </Link>
        </div>

        {/* Table wrapper for mobile */}
        <div className="overflow-x-auto">
            <Table
                columns={columns}
                dataSource={
                    Array.isArray(socialLinks)
                        ? socialLinks.map((link) => ({ ...link, key: link.id }))
                        : Array.isArray(socialLinks?.data)
                        ? socialLinks.data.map((link) => ({
                              ...link,
                              key: link.id,
                          }))
                        : []
                }
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                }}
                scroll={{ x: 800 }}
                className="rounded-lg"
            />
        </div>
    </Card>
</Authenticated>
    );
}
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

export default function Index({ archivedContests, auth }) {

    // const handleDelete = (id) => {
    //     router.delete(route('admin.archived.destroy', id), {
    //         onBefore: () => {
    //             console.log(id);
    //         },
    //         onConfirm: () => {
    //             console.log('Confirmed');
    //         },
    //         onSuccess: () => {
    //             message.success('Language deleted successfully');
    //         },
    //         onError: () => {
    //             message.error('Error deleting language');
    //         }
    //     });
    // };


    const columns = [

        {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        },

        {
            title: 'Contest ID',
            key: 'contest_id',
            render: (_, record) => (
            <Text>{record.contest ? `${record.contest.title} (${record.contest.id})` : 'N/A'}</Text>
            ),
        },

        {
            title: 'Archived At',
            dataIndex: 'archived_at',
            key: 'archived_at',
            render: (text) => <Text>{text}</Text>,
        },

        {
            title: 'Summary',
            dataIndex: 'summary',
            key: 'summary',
            render: (text) => <Text>{text}</Text>,
        },


        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     render: (_, record) => (
        //         <Space size="small">
        //                 <Tooltip title="Edit Section">
        //                     <Link href={route('admin.archived.edit', record.id)}>
        //                         <Button 
        //                             type="primary" 
        //                             icon={<EditOutlined />} 
        //                             size="small"
        //                         />
        //                     </Link>
        //                 </Tooltip>
                    
        //                 <Popconfirm
        //                     title="Delete Section"
        //                     description="Are you sure to delete this Section?"
        //                     onConfirm={() => handleDelete(record.id)}
        //                     okText="Yes"
        //                     cancelText="No"
        //                 >
        //                     <Tooltip title="Delete Section">
        //                         <Button 
        //                             danger 
        //                             icon={<DeleteOutlined />} 
        //                             size="small"
        //                         />
        //                     </Tooltip>
        //                 </Popconfirm>
        //         </Space>
        //     ),
        // },
    ];

    
    return (
        <Authenticated
            user={auth.user}
            header="Archived Contests Management"
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            Archived Contests
                        </Title>
                        <Text type="secondary">
                            Manage your archived contests
                        </Text>
                    </div>

                        <Link href={route('admin.archived.create')}>
                            <Button type="primary" icon={<PlusOutlined />} size="large">
                                Archived New Contests
                            </Button>
                        </Link>
                </div>

                <Table 
                    columns={columns} 
                    dataSource={archivedContests.map(contest => ({ ...contest, key: contest.id }))}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} archivedContests`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>
        </Authenticated>
    );
}
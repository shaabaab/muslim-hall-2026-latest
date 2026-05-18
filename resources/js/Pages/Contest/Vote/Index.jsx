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
    EditOutlined, 
    DeleteOutlined, 
    TeamOutlined ,
} from '@ant-design/icons';

const { Title, Text } = Typography;


export default function Index({ votes, auth }) {

    // Table columns definition

    const columns = [

        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
      

        {
            title: 'Entry Title',
            key: 'entry_id',
            render: (_, record) => (
            <Text>{record.entry ? record.entry.title : 'N/A'}</Text>
            ),
        },

         {
            title: 'Contest Title',
            key: 'title',
            render: (_, record) => (
            <Text>{record.entry ? record.entry.contest.title : 'N/A'}</Text>
            ),
        },


        {
            title: 'Voted By',
            key: 'user_id',
            render: (_, record) => (
            <Text>{record.user ? `${record.user.name} (${record.user.email})` : 'N/A'}</Text>
            ),
        },


        
    ];

    
    return (
        <Authenticated
            user={auth.user}
            header="Vote List"
        >
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="mb-2">
                            <TeamOutlined className="mr-2" />
                            Votes
                        </Title>
                        <Text type="secondary">
                            Manage your application votes here.
                        </Text>
                    </div>

                     
                </div>

                <Table 
                    columns={columns} 
                    dataSource={votes.map(vote => ({ ...vote, key: vote.id }))}
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
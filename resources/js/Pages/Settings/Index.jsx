import Authenticated from '@/Layouts/AuthenticatedLayout';
import { 
    Card, 
    Descriptions, 
    Button, 
    Space, 
    Typography, 
    Image,
    Row,
    Col,
    Tag,
    Popconfirm ,
    Tooltip 
} from 'antd';
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { 
    ArrowLeftOutlined, 
    EditOutlined,
    GlobalOutlined,
    PictureOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { Link } from '@inertiajs/react';

const { Title, Text } = Typography;

export default function Show({ auth, setting, langs }) {

    console.log('Setting:', setting);

    
    const handleDelete = (id) => {
        router.delete(route('admin.settings.destroy', id), {
            onSuccess: () => {
                message.success('Setting deleted successfully');
            },
            onError: () => {
                message.error('Error deleting setting');
            }
        });
    };


    return (
        <Authenticated
            user={auth.user}
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Title level={2}>Setting Details</Title>
                        <Text type="secondary">
                            View detailed information for this setting
                        </Text>
                    </div>
                    <Space>
                        <Link href={route('admin.settings.edit', setting[0].id)}>
                            <Button size="small" type="primary" icon={<EditOutlined />}>
                                Edit
                            </Button>
                        </Link>

                        <Popconfirm
                            title="Delete Setting"
                            description="Are you sure to delete this setting?"
                            onConfirm={() => handleDelete(setting[0].id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Delete Setting">
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    size="small"
                                > Delete
                                </Button>
                            </Tooltip>
                        </Popconfirm>

                    </Space>
                </div>

                <Row gutter={16}>
                    <Col span={16}>
                        <Card title="Basic Information">
                            <Descriptions column={1} bordered>
                                <Descriptions.Item label="Language">
                                    <Tag icon={<GlobalOutlined />} color="blue">
                                        {setting[0].language ? `${setting[0].language.name} (${setting[0].language.code})` : 'Not specified'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Header Title">
                                    {setting[0].header_title || <Text type="secondary">Not set</Text>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Footer Title">
                                    {setting[0].footer_title || <Text type="secondary">Not set</Text>}
                                </Descriptions.Item>
                                <Descriptions.Item label="Footer Content">
                                    {setting[0].footer_content || <Text type="secondary">Not set</Text>}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    
                    <Col span={8}>
                        <Card title="Media Files">
                            <div className="space-y-4">
                                <div className="text-center">
                                    <Text strong>Favicon</Text> <br />
                                    {setting[0].favicon ? (
                                        <Image
                                            width={100}
                                            height={80}
                                            src={getS3PublicUrl(`${setting[0].favicon}`)}
                                            alt="Favicon"
                                            style={{ marginTop: '8px' }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '64px', 
                                            background: '#f0f0f0', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            marginTop: '8px'
                                        }}>
                                            <PictureOutlined />
                                            <Text type="secondary" className="ml-2">No favicon</Text>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <Text strong>Header Logo</Text>
                                    {setting[0].header_logo ? (
                                        <Image
                                            width="100%"
                                            height="auto"
                                            src={getS3PublicUrl(`${setting[0].header_logo}`)}
                                            alt="Header Logo"
                                            style={{ marginTop: '8px' }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '60px', 
                                            background: '#f0f0f0', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            marginTop: '8px'
                                        }}>
                                            <PictureOutlined />
                                            <Text type="secondary" className="ml-2">No logo</Text>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <Text strong>Footer Logo</Text>
                                    {setting[0].footer_logo ? (
                                        <Image
                                            width="100%"
                                            height="auto"
                                            src={getS3PublicUrl(`${setting[0].footer_logo}`)}
                                            alt="Footer Logo"
                                            style={{ marginTop: '8px' }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '60px', 
                                            background: '#f0f0f0', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            marginTop: '8px'
                                        }}>
                                            <PictureOutlined />
                                            <Text type="secondary" className="ml-2">No logo</Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Authenticated>
    );
}
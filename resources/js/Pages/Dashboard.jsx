import Authenticated from "@/Layouts/AuthenticatedLayout";
import {
    AppstoreOutlined,
    ArrowUpOutlined,
    BoxPlotOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    TeamOutlined,
    UserOutlined,
    WalletOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Typography } from "antd";

const { Title, Text } = Typography;

export default function Dashboard({ auth, stats }) {
    const showBackButton = false;

    const timeFormat = (time) => {
        const now = new Date();
        const past = new Date(time);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    const recentActivities = [
        {
            title: "New user registered",
            description: `${stats.latest_users.name} joined the system`,
            time: timeFormat(stats.latest_users.created_at),
            icon: <UserOutlined />,
            color: "#52c41a",
        },

        {
            title: "New exhibition created",
            description: stats?.latest_exhibitions?.title,
            time: timeFormat(stats?.latest_exhibitions?.created_at),
            icon: <AppstoreOutlined />,
            color: "#1890ff",
        },
        {
            title: "New community post created",
            description: stats?.latest_community_posts?.title,
            time: timeFormat(stats?.latest_community_posts?.created_at),
            icon: <TeamOutlined />,
            color: "#faad14",
        },
    ];

    return (
        <Authenticated user={auth.user} header="Dashboard">
            <Space direction="vertical" size="large" className="w-full">
                {/* Statistics Row */}
                <Row gutter={18}>
                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href =
                                    route("admin.users.index"))
                            }
                        >
                            <Statistic
                                className="font-semibold"
                                title={
                                    <span className="text-gray-700 text-lg font-bold">
                                        Total Users
                                    </span>
                                }
                                value={stats?.total_users || 0}
                                prefix={<TeamOutlined />}
                                valueStyle={{
                                    color: "#3f8600",
                                    fontWeight: 500,
                                }}
                                suffix={<ArrowUpOutlined />}
                            />
                        </Card>
                    </Col>

                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href =
                                    route("admin.users.index"))
                            }
                        >
                            <Statistic
                                className="font-semibold"
                                title={<span className="text-gray-700 text-lg font-bold">Total Members</span>}
                                value={stats?.total_members || 0}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: "#1890ff",fontWeight: 500, }}
                            />
                        </Card>
                    </Col>

                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href =
                                    route("admin.posts.index"))
                            }
                        >
                            <Statistic
                                className="font-semibold"
                                title={<span className="text-gray-700 text-lg font-bold">Your Permissions</span>}
                                value={auth.user.permissions.length}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: "#cf1322", fontWeight: 500, }}
                            />
                        </Card>
                    </Col>

                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href =
                                    route("admin.posts.index"))
                            }
                        >
                            <Statistic
                                className="font-semibold"
                                title={<span className="text-gray-700 text-lg font-bold">Total Posts</span>}
                                value={stats?.total_posts || 0}
                                prefix={<BoxPlotOutlined />}
                                valueStyle={{ color: "#722ed1", fontWeight: 500, }}
                            />
                        </Card>
                    </Col>

                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card hoverable>
                            <Statistic
                                className="font-semibold"
                                title={<span className="text-gray-700 text-lg font-bold">Wallet Balance</span>}
                                value={Number(auth?.user?.deposit || 0).toFixed(2)}
                                suffix="TK"
                                prefix={<WalletOutlined />}
                                valueStyle={{ color: "#1b7a3a", fontWeight: "bold", }}
                            />
                        </Card>
                    </Col>

                    <Col xs={28} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            style={{ border: "1.5px solid #52c41a" }}
                        >
                            <Statistic
                                className="font-semibold"
                                title={
                                    <span className="text-gray-700 text-lg font-bold" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: "#52c41a",
                                                boxShadow: "0 0 0 2px #b7eb8f",
                                                animation: "pulse 1.5s infinite",
                                            }}
                                        />
                                        Active Now
                                    </span>
                                }
                                value={stats?.active_users || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: "#52c41a", fontWeight: 600 }}
                                suffix={<span style={{ fontSize: 13, color: "#888" }}>online</span>}
                            />
                            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                                Users active in last 5 min
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Recent Activities and Quick Actions */}
                <Row gutter={16}>
                    {/* <Col xs={28}  lg={12}>
                        <Card title="Recent Activities" bordered={false}>
                            <List
                                itemLayout="horizontal"
                                dataSource={recentActivities}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar
                                                    icon={item.icon}
                                                    style={{ backgroundColor: item.color }}
                                                />
                                            }
                                            title={item.title}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <Text>{item.description}</Text>
                                                    <Text type="secondary" className="text-xs">
                                                        {item.time}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col> */}

                    <Col xs={28} lg={14}>
                        <Card
                            title={
                                <span className="font-bold text-2xl">
                                    Quick Actions
                                </span>
                            }
                            bordered={false}
                            style={{
                                borderRadius: 14,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                            }}
                            bodyStyle={{ padding: 18 }}
                        >
                            <Space direction="vertical" className="w-full">
                                <Text type="secondary font-semibold">
                                    Manage your application efficiently with
                                    these quick actions
                                </Text>

                                <Row gutter={[12, 12]} className="mt-4">
                                    {auth.user.permissions.includes(
                                        "users.index",
                                    ) && (
                                        <Col xs={12} sm={12} md={8}>
                                            <Card
                                                size="small"
                                                hoverable
                                                className="transition-all hover:-translate-y-0.5"
                                                style={{ borderRadius: 12 }}
                                                bodyStyle={{ padding: 14 }}
                                                onClick={() =>
                                                    (window.location.href =
                                                        route(
                                                            "admin.users.index",
                                                        ))
                                                }
                                            >
                                                <div className="text-center">
                                                    <TeamOutlined
                                                        style={{
                                                            fontSize: "26px",
                                                            color: "#1890ff",
                                                            fontWeight: 500,
                                                        }}
                                                    />
                                                    <div className="mt-2 font-bold">
                                                        Users
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-500">
                                                        Manage users
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    )}

                                    {auth.user.permissions.includes(
                                        "roles.index",
                                    ) && (
                                        <Col xs={12} sm={12} md={8}>
                                            <Card
                                                size="small"
                                                hoverable
                                                className="transition-all hover:-translate-y-0.5"
                                                style={{ borderRadius: 12 }}
                                                bodyStyle={{ padding: 14 }}
                                                onClick={() =>
                                                    (window.location.href =
                                                        route(
                                                            "admin.roles.index",
                                                        ))
                                                }
                                            >
                                                <div className="text-center">
                                                    <SafetyCertificateOutlined
                                                        style={{
                                                            fontSize: "26px",
                                                            color: "#52c41a",
                                                        }}
                                                    />
                                                    <div className="mt-2 font-bold">
                                                        Roles
                                                    </div>
                                                    <div className="text-xs font-semibold text-gray-500">
                                                        Manage roles
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    )}
                                </Row>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </Authenticated>
    );
}

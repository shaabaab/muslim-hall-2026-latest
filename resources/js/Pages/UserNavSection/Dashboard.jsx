import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import dayjs from "dayjs";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import {
    Row,
    Col,
    Card,
    Statistic,
    Typography,
    Space,
    Progress,
    Tabs,
    List,
} from "antd";
import { getS3PublicUrl } from "../../Utils/s3Helpers";
import {
    TeamOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
    ArrowUpOutlined,
    CheckCircleOutlined,
    PictureOutlined,
    CommentOutlined,
    EyeOutlined,
    HeartOutlined,
    PlusCircleFilled,
    TrophyOutlined,
    ShopOutlined,
    WalletOutlined,
} from "@ant-design/icons";

import { useState } from "react";

const { Title, Text, Link } = Typography;
const { TabPane } = Tabs;

export default function Dashboard({
    user,
    auth,
    total_contests,
    contests,
    posts,
    communitys,
    exhibitions,
}) {
    const subscription = user?.subscriptions?.[0];

    const [activeTab, setActiveTab] = useState("posts");

    const isMember = user?.role == 1 && user?.subscriptions?.[0]?.status == 1;
    console.log("Is Member:", isMember);

    let percent = 0;
    if (subscription?.start_date && subscription?.end_date) {
        const start = dayjs(subscription.start_date);
        const end = dayjs(subscription.end_date);
        const today = dayjs();

        const totalDays = end.diff(start, "day");
        const usedDays = today.diff(start, "day");
        percent = Math.min(Math.max((usedDays / totalDays) * 100, 0), 100);
    }

    // Calculate post statistics for the chart
    const calculatePostStats = () => {
        if (!user?.posts || user.posts.length === 0) return [];

        // Group by date (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = dayjs().subtract(i, "day").format("MMM DD");
            last7Days.push({
                date,
                views: 0,
                comments: 0,
                reactions: 0,
            });
        }

        // Fill with actual data
        user.posts.forEach((post) => {
            const postDate = dayjs(post.created_at).format("MMM DD");
            const dayData = last7Days.find((day) => day.date === postDate);

            if (dayData) {
                dayData.viewer_count += post.viewer_count || 0;
                dayData.comments += post.comments_count || 0;
                dayData.reactions += post.reactions_count || 0;
            }
        });

        return last7Days;
    };

    const chartData = calculatePostStats();

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const total = payload.reduce(
                (sum, entry) => sum + (entry.value || 0),
                0,
            );

            return (
                <Card size="small" title={label}>
                    {payload.map((entry, index) => (
                        <div
                            key={index}
                            style={{ color: entry.color, padding: "2px 0" }}
                        >
                            {entry.name}: {entry.value} (
                            {total > 0
                                ? Math.round((entry.value / total) * 100)
                                : 0}
                            %)
                        </div>
                    ))}
                    {total > 0 && (
                        <div style={{ fontWeight: "bold", marginTop: "4px" }}>
                            Total: {total}
                        </div>
                    )}
                </Card>
            );
        }
        return null;
    };

    // Calculate overall percentages
    const calculateOverallPercentages = () => {
        const totalStats = user?.posts?.reduce(
            (acc, post) => {
                acc.viewer_count += post.viewer_count || 0;
                acc.comments += post.comments_count || 0;
                acc.reactions += post.reactions_count || 0;
                return acc;
            },
            { viewer_count: 0, comments: 0, reactions: 0 },
        ) || { viewer_count: 0, comments: 0, reactions: 0 };

        const total =
            totalStats.viewer_count +
            totalStats.comments +
            totalStats.reactions;

        // Fixed: Use totalStats instead of acc

        return {
            views:
                total > 0
                    ? Math.round((totalStats.viewer_count / total) * 100)
                    : 0,
            comments:
                total > 0 ? Math.round((totalStats.comments / total) * 100) : 0,
            reactions:
                total > 0
                    ? Math.round((totalStats.reactions / total) * 100)
                    : 0,
            total,
            ...totalStats,
        };
    };
    const overallPercentages = calculateOverallPercentages();

    return (
        <FrontAuthenticatedLayout user={auth.user} header="Dashboard">
            <Space direction="vertical" size="large" className="w-full">
                <Row gutter={24} className="mb-4">
                    <Col xs={24} lg={8} className="mb-2">
                        <Space direction="vertical" className="w-full">
                            <Card
                                className="p-0"
                                title="Quick Actions"
                                bordered={false}
                                hoverable
                            >
                                <Text strong>
                                    {" "}
                                    <Link href={route("user.posts.create")}>
                                        {" "}
                                        <PlusCircleFilled /> Create post
                                    </Link>{" "}
                                </Text>{" "}
                                <br />
                                <Text
                                    strong
                                    type={!isMember ? "secondary" : undefined}
                                >
                                    {isMember ? (
                                        <Link href={route("user.contests.create")}>
                                            <PlusCircleFilled /> Create Contest
                                        </Link>
                                    ) : (
                                        <span style={{ cursor: "not-allowed" }}>
                                            <PlusCircleFilled /> Create Contest
                                        </span>
                                    )}
                                </Text>
                            </Card>

                            <Card hoverable bordered={false}>
                                <Statistic
                                    title={
                                        <span className="text-gray-700 text-lg font-bold">
                                            Wallet Balance
                                        </span>
                                    }
                                    value={Number(user?.deposit || 0).toFixed(2)}
                                    suffix="TK"
                                    prefix={<WalletOutlined />}
                                    valueStyle={{
                                        color: "#1b7a3a",
                                        fontWeight: "bold",
                                    }}
                                />
                            </Card>
                        </Space>
                    </Col>

                    <Col xs={24} lg={16} className="mb-2">
                        <Card style={{ height: "100%" }}>
                            {user?.subscriptions?.length > 0 &&
                            user?.subscriptions[0]?.status == 1 ? (
                                <>
                                    <Title level={4}>
                                        Subscription Details
                                    </Title>
                                    <Text strong className="pr-3">
                                        {user?.subscriptions[0]?.plan?.name ||
                                            "Create a Subscription Plan"}{" "}
                                        ({user?.subscriptions[0]?.validity || 0}{" "}
                                        Days)
                                    </Text>
                                    <Text strong className="pr-3">
                                        Start:{" "}
                                        {user?.subscriptions[0]?.start_date ||
                                            "0/0/0"}
                                    </Text>
                                    <Text strong className="pr-3">
                                        to End Date:{" "}
                                        {user?.subscriptions[0]?.end_date ||
                                            "0/0/0"}
                                    </Text>

                                    <Progress
                                        percent={percent.toFixed(2)}
                                        status={
                                            percent >= 100
                                                ? "success"
                                                : "active"
                                        }
                                        format={(p) => `${p}% used`}
                                    />
                                </>
                            ) : (
                                <Title level={3}>
                                    Welcome to Muslim Hall, {user?.name}! Please
                                    subscribe to a plan to get started.
                                </Title>
                            )}
                        </Card>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col xs={24} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href =
                                    route("user.posts.index"))
                            }
                        >
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Total Posts
                                    </span>
                                }
                                value={user?.posts?.length || 0}
                                prefix={<PictureOutlined />}
                                valueStyle={{
                                    color: "#3f8600",
                                    fontWeight: 500, // semibold
                                }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href = route(
                                    "user.communities.index",
                                ))
                            }
                        >
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Communities
                                    </span>
                                }
                                value={user?.communities?.length || 0}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: "#43474bff" }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href = route(
                                    "user.contests.index",
                                ))
                            }
                        >
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Total Contests
                                    </span>
                                }
                                value={total_contests || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: "#cf1322" }}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} sm={12} md={8} lg={6} className="mb-2">
                        <Card
                            hoverable
                            onClick={() =>
                                (window.location.href = route(
                                    "user.exhibitions.index",
                                ))
                            }
                        >
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Exhibitions
                                    </span>
                                }
                                value={user?.exhibitions?.length || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: "#722ed1" }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Post Engagement Statistics */}
                <Row gutter={16}>
                    <Col xs={24} sm={8} className="mb-2">
                        <Card hoverable>
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Total Views
                                    </span>
                                }
                                value={`${overallPercentages.views}%`}
                                prefix={<EyeOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8} className="mb-2">
                        <Card hoverable>
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Total Comments
                                    </span>
                                }
                                value={`${overallPercentages.comments}%`}
                                prefix={<CommentOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8} className="mb-2">
                        <Card hoverable>
                            <Statistic
                                title={
                                    <span className="text-gray-700  text-lg font-bold">
                                        Total Reactions
                                    </span>
                                }
                                value={`${overallPercentages.reactions}%`}
                                prefix={<HeartOutlined />}
                                valueStyle={{ color: "#ff4d4f" }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Chart Section */}
                <Row gutter={16}>
                    <Col xs={24} lg={16}>
                        <Card
                            hoverable
                            title="Post Engagement Analytics (Last 7 Days)"
                            bordered={false}
                        >
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar
                                            dataKey="views"
                                            name="Views"
                                            fill="#1890ff"
                                        />
                                        <Bar
                                            dataKey="comments"
                                            name="Comments"
                                            fill="#52c41a"
                                        />
                                        <Bar
                                            dataKey="reactions"
                                            name="Reactions"
                                            fill="#faad14"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8">
                                    <PictureOutlined
                                        style={{
                                            fontSize: "48px",
                                            color: "#d9d9d9",
                                        }}
                                    />
                                    <div className="mt-2">
                                        No post data available for the last 7
                                        days
                                    </div>
                                </div>
                            )}
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            hoverable
                            title="Engagement Summary"
                            bordered={false}
                        >
                            <Space direction="vertical" className="w-full">
                                <div>
                                    <Text strong>Total Engagement: </Text>
                                    <Text>{overallPercentages.total}</Text>
                                </div>
                                <Progress
                                    percent={overallPercentages.views}
                                    strokeColor="#1890ff"
                                    format={() =>
                                        `Views: ${overallPercentages.views}%`
                                    }
                                />
                                <Progress
                                    percent={overallPercentages.comments}
                                    strokeColor="#52c41a"
                                    format={() =>
                                        `Comments: ${overallPercentages.comments}%`
                                    }
                                />
                                <Progress
                                    percent={overallPercentages.reactions}
                                    strokeColor="#faad14"
                                    format={() =>
                                        `Reactions: ${overallPercentages.reactions}%`
                                    }
                                />
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col xs={24}>
                        <Card>
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                type="card"
                            >
                                <TabPane
                                    tab={
                                        <span>
                                            <UserOutlined />
                                            Posts
                                        </span>
                                    }
                                    key="posts"
                                >
                                    {posts.length > 0 ? (
                                        <List
                                            dataSource={posts}
                                            renderItem={(post) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={
                                                            post.images
                                                                ?.length > 0 ? (
                                                                <img
                                                                    src={getS3PublicUrl(post.images[0]?.image)}
                                                                    alt={
                                                                        post.title
                                                                    }
                                                                    style={{
                                                                        width: 90,
                                                                        height: 60,
                                                                        objectFit:
                                                                            "cover",
                                                                        borderRadius: 4,
                                                                        marginTop:
                                                                            "8px",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        width: 90,
                                                                        height: 60,
                                                                        background:
                                                                            "#f0f0f0",
                                                                        borderRadius: 4,
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        justifyContent:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Text type="secondary">
                                                                        No Image
                                                                    </Text>
                                                                </div>
                                                            )
                                                        }
                                                        title={
                                                            <Link
                                                                target="_blank"
                                                                href={route(
                                                                    "post-detail",
                                                                    post.slug,
                                                                )}
                                                            >
                                                                {post.title}
                                                            </Link>
                                                        }
                                                        description={
                                                            <>
                                                                <Text type="secondary">
                                                                    {new Date(
                                                                        post.created_at,
                                                                    ).toLocaleDateString(
                                                                        "en-US",
                                                                        {
                                                                            year: "numeric",
                                                                            month: "long",
                                                                            day: "numeric",
                                                                        },
                                                                    )}
                                                                </Text>
                                                                <br />
                                                                <Text>
                                                                    Likes:{" "}
                                                                    {post.user_reaction_count ||
                                                                        0}{" "}
                                                                    • Comments:{" "}
                                                                    {post.all_comments_count ||
                                                                        0}
                                                                </Text>
                                                            </>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                textAlign: "center",
                                                padding: "20px",
                                            }}
                                        >
                                            <Text>No Posts Available</Text>
                                        </div>
                                    )}
                                </TabPane>

                                <TabPane
                                    tab={
                                        <span>
                                            <TrophyOutlined />
                                            Contest Participations
                                        </span>
                                    }
                                    key="contests"
                                >
                                    {/* Contest participations content will go here */}
                                    <div style={{ padding: "20px" }}>
                                        {contests.length > 0 ? (
                                            <List
                                                dataSource={contests}
                                                renderItem={(contest) => (
                                                    <List.Item>
                                                        <List.Item.Meta
                                                            title={
                                                                // <Link href={route('contest.show', contest.contest.slug)}>
                                                                <Link>
                                                                    {
                                                                        contest
                                                                            .contest
                                                                            .title
                                                                    }
                                                                </Link>
                                                            }
                                                            description={
                                                                <div>
                                                                    <Text type="secondary">
                                                                        Participated
                                                                        on:{" "}
                                                                        {new Date(
                                                                            contest.created_at,
                                                                        ).toLocaleDateString(
                                                                            "en-US",
                                                                            {
                                                                                year: "numeric",
                                                                                month: "long",
                                                                                day: "numeric",
                                                                            },
                                                                        )}
                                                                    </Text>
                                                                    <br />
                                                                    <Text>
                                                                        Winner
                                                                        Positions:{" "}
                                                                        {contest.winner
                                                                            ? `${contest.winner.position}  Positions` ||
                                                                              0
                                                                            : "Participated"}{" "}
                                                                        •
                                                                        Review:{" "}
                                                                        {contest.review
                                                                            ? contest
                                                                                  .review
                                                                                  .length ||
                                                                              0
                                                                            : 0}
                                                                    </Text>
                                                                </div>
                                                            }
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        ) : (
                                            <Text>
                                                Contest participations will be
                                                displayed here
                                            </Text>
                                        )}
                                    </div>
                                </TabPane>

                                <TabPane
                                    tab={
                                        <span>
                                            <TeamOutlined />
                                            Community
                                        </span>
                                    }
                                    key="community"
                                >
                                    {isMember && (
                                        <div style={{ padding: "20px" }}>
                                            {communitys.length > 0 ? (
                                                <List
                                                    dataSource={communitys}
                                                    renderItem={(item) => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                avatar={
                                                                    item.image !=
                                                                    null ? (
                                                                        <img
                                                                            src={`/storage/${item.image}`}
                                                                            alt={
                                                                                item.title
                                                                            }
                                                                            style={{
                                                                                width: 90,
                                                                                height: 60,
                                                                                objectFit:
                                                                                    "cover",
                                                                                borderRadius: 4,
                                                                                marginTop:
                                                                                    "8px",
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            style={{
                                                                                width: 90,
                                                                                height: 60,
                                                                                background:
                                                                                    "#f0f0f0",
                                                                                borderRadius: 4,
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            <Text type="secondary">
                                                                                No
                                                                                Image
                                                                            </Text>
                                                                        </div>
                                                                    )
                                                                }
                                                                title={
                                                                    <Link
                                                                        href={route(
                                                                            "community-details",
                                                                            item.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            item.title
                                                                        }
                                                                    </Link>
                                                                }
                                                                description={
                                                                    <div>
                                                                        <Text type="secondary">
                                                                            Participated
                                                                            on:{" "}
                                                                            {new Date(
                                                                                item.created_at,
                                                                            ).toLocaleDateString(
                                                                                "en-US",
                                                                                {
                                                                                    year: "numeric",
                                                                                    month: "long",
                                                                                    day: "numeric",
                                                                                },
                                                                            )}
                                                                        </Text>

                                                                        <br />
                                                                        <Text>
                                                                            Total
                                                                            Comment:{" "}
                                                                            <strong>
                                                                                {
                                                                                    item.comments_count
                                                                                }
                                                                            </strong>{" "}
                                                                            •
                                                                            Total
                                                                            Reaction:{" "}
                                                                            <strong>
                                                                                {
                                                                                    item.likes_count
                                                                                }
                                                                            </strong>{" "}
                                                                            •
                                                                            Status:{" "}
                                                                            <strong
                                                                                style={{
                                                                                    color:
                                                                                        item.status ==
                                                                                        "published"
                                                                                            ? "green"
                                                                                            : "red",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    item.status
                                                                                }
                                                                            </strong>
                                                                        </Text>
                                                                    </div>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Text>
                                                    Community content will be
                                                    displayed here
                                                </Text>
                                            )}
                                        </div>
                                    )}

                                    {!isMember && (
                                        <div
                                            style={{
                                                textAlign: "center",
                                                padding: "20px",
                                            }}
                                        >
                                            <Text>
                                                You need to be a member to view
                                                community content.
                                            </Text>
                                        </div>
                                    )}
                                </TabPane>

                                <TabPane
                                    tab={
                                        <span>
                                            <ShopOutlined />
                                            Exhibition
                                        </span>
                                    }
                                    key="exhibition"
                                >
                                    {isMember && (
                                        <div style={{ padding: "20px" }}>
                                            {exhibitions.length > 0 ? (
                                                <List
                                                    dataSource={exhibitions}
                                                    renderItem={(item) => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                avatar={
                                                                    item.image !=
                                                                    null ? (
                                                                        <img
                                                                            src={`/storage/${item.image}`}
                                                                            alt={
                                                                                item.title
                                                                            }
                                                                            style={{
                                                                                width: 90,
                                                                                height: 60,
                                                                                objectFit:
                                                                                    "cover",
                                                                                borderRadius: 4,
                                                                                marginTop:
                                                                                    "8px",
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            style={{
                                                                                width: 90,
                                                                                height: 60,
                                                                                background:
                                                                                    "#f0f0f0",
                                                                                borderRadius: 4,
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            <Text type="secondary">
                                                                                No
                                                                                Image
                                                                            </Text>
                                                                        </div>
                                                                    )
                                                                }
                                                                title={
                                                                    <Link
                                                                        href={route(
                                                                            "exhibition-detail",
                                                                            item.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            item.title
                                                                        }
                                                                    </Link>
                                                                }
                                                                description={
                                                                    <div>
                                                                        <Text type="secondary">
                                                                            Participated
                                                                            on:{" "}
                                                                            {new Date(
                                                                                item.created_at,
                                                                            ).toLocaleDateString(
                                                                                "en-US",
                                                                                {
                                                                                    year: "numeric",
                                                                                    month: "long",
                                                                                    day: "numeric",
                                                                                },
                                                                            )}
                                                                        </Text>
                                                                        <br />
                                                                        <Text>
                                                                            Type:{" "}
                                                                            <strong>
                                                                                {
                                                                                    item.type
                                                                                }
                                                                            </strong>{" "}
                                                                            •
                                                                            Status:{" "}
                                                                            <strong
                                                                                style={{
                                                                                    color:
                                                                                        item.status ==
                                                                                        "published"
                                                                                            ? "green"
                                                                                            : "red",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    item.status
                                                                                }
                                                                            </strong>
                                                                        </Text>
                                                                    </div>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Text>
                                                    Not Available exhibition
                                                    content will be displayed
                                                    here
                                                </Text>
                                            )}
                                        </div>
                                    )}
                                    {!isMember && (
                                        <div
                                            style={{
                                                textAlign: "center",
                                                padding: "20px",
                                            }}
                                        >
                                            <Text>
                                                You need to be a member to view
                                                exhibition content.
                                            </Text>
                                        </div>
                                    )}
                                </TabPane>
                            </Tabs>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </FrontAuthenticatedLayout>
    );
}

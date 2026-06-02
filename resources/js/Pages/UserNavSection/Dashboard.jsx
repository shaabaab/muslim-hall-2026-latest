import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import dayjs from "dayjs";
import axios from "axios";
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
    Button,
    message,
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
    CreditCardOutlined,
} from "@ant-design/icons";

import { useState } from "react";
import { Link, router } from "@inertiajs/react";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const stripHtml = (html) => {
    if (!html) return "";
    return String(html).replace(/<[^>]*>/g, "");
};

const getCommonImageUrl = (path) => {
    if (!path) {
        return null;
    }

    if (String(path).startsWith("http")) {
        return path;
    }

    if (String(path).startsWith("/storage")) {
        return path;
    }

    if (String(path).startsWith("/")) {
        return path;
    }

    return `/storage/${path}`;
};

const getCardDateParts = (date) => {
    if (!date) {
        return {
            day: "",
            month: "",
        };
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return {
            day: "",
            month: "",
        };
    }

    return {
        day: parsedDate.toLocaleDateString("en-US", {
            day: "2-digit",
        }),
        month: parsedDate
            .toLocaleDateString("en-US", {
                month: "short",
            })
            .toUpperCase(),
    };
};

const getShortText = (text, length = 45) => {
    const cleanText = stripHtml(text || "");

    if (!cleanText) {
        return "...";
    }

    return cleanText.length > length
        ? `${cleanText.slice(0, length)}...`
        : cleanText;
};

const getPostImage = (post) => {
    if (post.images?.length > 0 && post.images[0]?.image) {
        return getS3PublicUrl(post.images[0].image);
    }

    return null;
};

const getCommunityImage = (item) => {
    return item.image ? getCommonImageUrl(item.image) : null;
};

const getExhibitionImage = (item) => {
    return item.image ? getCommonImageUrl(item.image) : null;
};

const getContestImage = (contest) => {
    if (contest.contest?.image) {
        return getCommonImageUrl(contest.contest.image);
    }

    if (contest.contest?.thumbnail) {
        return getCommonImageUrl(contest.contest.thumbnail);
    }

    if (contest.image) {
        return getCommonImageUrl(contest.image);
    }

    return null;
};
export default function Dashboard({
    user,
    auth,
    defaultPlan,
    total_contests,
    contests,
    posts,
    communitys,
    exhibitions,
}) {
    const activeSubscription = user?.subscriptions?.find((subscription) => {
        if (Number(subscription?.status) !== 1) {
            return false;
        }

        if (!subscription?.end_date) {
            return false;
        }

        return (
            dayjs(subscription.end_date).isAfter(dayjs(), "day") ||
            dayjs(subscription.end_date).isSame(dayjs(), "day")
        );
    });

    const subscription = activeSubscription || user?.subscriptions?.[0];

    const [activeTab, setActiveTab] = useState("posts");

    const isMember = Number(user?.role) === 1 && !!activeSubscription;

    console.log("Is Member:", isMember);

    const handleDirectPayment = () => {
        if (!defaultPlan?.id) {
            message.error("No active paid subscription plan found.");
            return;
        }

        message.loading("Redirecting to SSLCommerz payment gateway...", 1);

        axios
            .post(
                route("user.subscriptions.pay"),
                {
                    plan_id: defaultPlan.id,
                },
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                }
            )
            .then((response) => {
                console.log("SSLCommerz Response:", response.data);

                if (response.data?.status === true && response.data?.redirect_url) {
                    window.location.href = response.data.redirect_url;
                    return;
                }

                message.error(
                    response.data?.message || "SSLCommerz redirect URL not found."
                );
            })
            .catch((error) => {
                console.log("SSLCommerz Error:", error);
                console.log("SSLCommerz Error Response:", error.response?.data);

                if (error.response?.status === 419) {
                    message.error("Session expired. Please refresh and login again.");
                    return;
                }

                if (error.response?.status === 401) {
                    message.error("Please login first.");
                    return;
                }

                if (error.response?.status === 422) {
                    message.error(
                        error.response?.data?.message ||
                        error.response?.data?.errors?.plan_id?.[0] ||
                        "Validation failed."
                    );
                    return;
                }

                message.error(
                    error.response?.data?.message ||
                    "Failed to start SSLCommerz payment."
                );
            });
    };

    let percent = 0;

    if (subscription?.start_date && subscription?.end_date) {
        const start = dayjs(subscription.start_date);
        const end = dayjs(subscription.end_date);
        const today = dayjs();

        const totalDays = end.diff(start, "day");
        const usedDays = today.diff(start, "day");

        percent = Math.min(Math.max((usedDays / totalDays) * 100, 0), 100);
    }

    const calculatePostStats = () => {
        if (!user?.posts || user.posts.length === 0) return [];

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

        user.posts.forEach((post) => {
            const postDate = dayjs(post.created_at).format("MMM DD");
            const dayData = last7Days.find((day) => day.date === postDate);

            if (dayData) {
                dayData.views += post.viewer_count || 0;
                dayData.comments += post.comments_count || 0;
                dayData.reactions += post.reactions_count || 0;
            }
        });

        return last7Days;
    };

    const chartData = calculatePostStats();

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

        return {
            views:
                total > 0
                    ? Math.round((totalStats.viewer_count / total) * 100)
                    : 0,
            comments:
                total > 0
                    ? Math.round((totalStats.comments / total) * 100)
                    : 0,
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
                                        <Link
                                            href={route(
                                                "user.contests.create",
                                            )}
                                        >
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
                            {activeSubscription ? (
                                <>
                                    <Title level={4}>
                                        Subscription Details
                                    </Title>

                                    <Text strong className="pr-3">
                                        {subscription?.plan?.name ||
                                            "Create a Subscription Plan"}{" "}
                                        ({subscription?.validity || 0} Days)
                                    </Text>

                                    <Text strong className="pr-3">
                                        Start:{" "}
                                        {subscription?.start_date || "0/0/0"}
                                    </Text>

                                    <Text strong className="pr-3">
                                        to End Date:{" "}
                                        {subscription?.end_date || "0/0/0"}
                                    </Text>

                                    <Progress
                                        percent={Number(percent.toFixed(2))}
                                        status={
                                            percent >= 100
                                                ? "success"
                                                : "active"
                                        }
                                        format={(p) => `${p}% used`}
                                    />
                                </>
                            ) : (
                                <div>
                                    <Title level={3}>
                                        Welcome to Muslim Hall, {user?.name}!
                                        Please subscribe to a plan to get
                                        started.
                                    </Title>

                                    {defaultPlan ? (
                                        <>
                                            <Text>
                                                Selected Plan:{" "}
                                                <strong>
                                                    {defaultPlan.name}
                                                </strong>{" "}
                                                - Tk{" "}
                                                <strong>
                                                    {defaultPlan.price}
                                                </strong>{" "}
                                                -{" "}
                                                <strong>
                                                    {defaultPlan.validity}
                                                </strong>{" "}
                                                days
                                            </Text>

                                            <br />

                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<CreditCardOutlined />}
                                                onClick={handleDirectPayment}
                                                style={{ marginTop: 16 }}
                                            >
                                                Pay With SSLCommerz
                                            </Button>
                                        </>
                                    ) : (
                                        <Text type="danger">
                                            No active paid subscription plan
                                            found.
                                        </Text>
                                    )}
                                </div>
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
                                    fontWeight: 500,
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
                                    <div className="profile-card-section">
                                        {posts.length > 0 ? (
                                            <div className="profile-card-grid">
                                                {posts.map((post) => {
                                                    const dateParts = getCardDateParts(
                                                        post.created_at,
                                                    );

                                                    const imageUrl = getPostImage(post);

                                                    return (
                                                        <Link
                                                            key={post.id}
                                                            target="_blank"
                                                            href={route(
                                                                "post-detail",
                                                                post.slug,
                                                            )}
                                                            className="profile-same-card"
                                                        >
                                                            <div className="profile-same-date">
                                                                <strong>{dateParts.day}</strong>
                                                                <span>{dateParts.month}</span>
                                                            </div>

                                                            <div className="profile-same-image-wrap">
                                                                {imageUrl ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={stripHtml(
                                                                            post.title,
                                                                        )}
                                                                        className="profile-same-image"
                                                                    />
                                                                ) : (
                                                                    <div className="profile-same-placeholder">
                                                                        <i className="fas fa-newspaper"></i>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="profile-same-content">
                                                                <h3
                                                                    className="profile-same-title"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html:
                                                                            post.title ||
                                                                            "Untitled",
                                                                    }}
                                                                />

                                                                <p className="profile-same-desc">
                                                                    Likes:{" "}
                                                                    {post.user_reaction_count ||
                                                                        0}{" "}
                                                                    • Comments:{" "}
                                                                    {post.all_comments_count ||
                                                                        0}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="profile-same-empty">
                                                <Text>No Posts Available</Text>
                                            </div>
                                        )}
                                    </div>
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
                                    <div className="profile-card-section">
                                        {contests.length > 0 ? (
                                            <div className="profile-card-grid">
                                                {contests.map((contest) => {
                                                    const dateParts = getCardDateParts(
                                                        contest.created_at,
                                                    );

                                                    const imageUrl = getContestImage(contest);

                                                    const contestTitle =
                                                        contest.contest?.title ||
                                                        contest.title ||
                                                        "Untitled";

                                                    const winnerText = contest.winner
                                                        ? `${contest.winner.position} Positions`
                                                        : "Participated";

                                                    return (
                                                        <div
                                                            key={contest.id}
                                                            className="profile-same-card"
                                                        >
                                                            <div className="profile-same-date">
                                                                <strong>{dateParts.day}</strong>
                                                                <span>{dateParts.month}</span>
                                                            </div>

                                                            <div className="profile-same-image-wrap">
                                                                {imageUrl ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={stripHtml(
                                                                            contestTitle,
                                                                        )}
                                                                        className="profile-same-image"
                                                                    />
                                                                ) : (
                                                                    <div className="profile-same-placeholder">
                                                                        <i className="fas fa-trophy"></i>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="profile-same-content">
                                                                <h3
                                                                    className="profile-same-title"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: contestTitle,
                                                                    }}
                                                                />

                                                                <p className="profile-same-desc">
                                                                    {winnerText} • Review:{" "}
                                                                    {contest.review
                                                                        ? contest.review
                                                                            .length || 0
                                                                        : 0}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="profile-same-empty">
                                                <Text>
                                                    Contest participations will be displayed here
                                                </Text>
                                            </div>
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
                                        <div className="profile-card-section">
                                            {communitys.length > 0 ? (
                                                <div className="profile-card-grid">
                                                    {communitys.map((item) => {
                                                        const dateParts = getCardDateParts(
                                                            item.created_at,
                                                        );

                                                        const imageUrl =
                                                            getCommunityImage(item);

                                                        return (
                                                            <Link
                                                                key={item.id}
                                                                href={route(
                                                                    "community-details",
                                                                    item.id,
                                                                )}
                                                                className="profile-same-card"
                                                            >
                                                                <div className="profile-same-date">
                                                                    <strong>
                                                                        {dateParts.day}
                                                                    </strong>
                                                                    <span>
                                                                        {dateParts.month}
                                                                    </span>
                                                                </div>

                                                                <div className="profile-same-image-wrap">
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt={stripHtml(
                                                                                item.title,
                                                                            )}
                                                                            className="profile-same-image"
                                                                        />
                                                                    ) : (
                                                                        <div className="profile-same-placeholder">
                                                                            <i className="fas fa-users"></i>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="profile-same-content">
                                                                    <h3
                                                                        className="profile-same-title"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html:
                                                                                item.title ||
                                                                                "Untitled",
                                                                        }}
                                                                    />

                                                                    <p className="profile-same-desc">
                                                                        Total Comment:{" "}
                                                                        {item.comments_count ||
                                                                            0}{" "}
                                                                        • Total Reaction:{" "}
                                                                        {item.likes_count || 0}
                                                                    </p>

                                                                    <p
                                                                        className={`profile-same-status ${item.status ==
                                                                            "published"
                                                                            ? "published"
                                                                            : "unpublished"
                                                                            }`}
                                                                    >
                                                                        {item.status}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="profile-same-empty">
                                                    <Text>
                                                        Community content will be displayed here
                                                    </Text>
                                                </div>
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
                                                You need to be a member to view community
                                                content.
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
                                        <div className="profile-card-section">
                                            {exhibitions.length > 0 ? (
                                                <div className="profile-card-grid">
                                                    {exhibitions.map((item) => {
                                                        const dateParts = getCardDateParts(
                                                            item.created_at,
                                                        );

                                                        const imageUrl =
                                                            getExhibitionImage(item);

                                                        return (
                                                            <Link
                                                                key={item.id}
                                                                href={route(
                                                                    "exhibition-detail",
                                                                    item.id,
                                                                )}
                                                                className="profile-same-card"
                                                            >
                                                                <div className="profile-same-date">
                                                                    <strong>
                                                                        {dateParts.day}
                                                                    </strong>
                                                                    <span>
                                                                        {dateParts.month}
                                                                    </span>
                                                                </div>

                                                                <div className="profile-same-image-wrap">
                                                                    {imageUrl ? (
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt={stripHtml(
                                                                                item.title,
                                                                            )}
                                                                            className="profile-same-image"
                                                                        />
                                                                    ) : (
                                                                        <div className="profile-same-placeholder">
                                                                            <i className="fas fa-mosque"></i>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="profile-same-content">
                                                                    <h3
                                                                        className="profile-same-title"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html:
                                                                                item.title ||
                                                                                "Untitled",
                                                                        }}
                                                                    />

                                                                    <p className="profile-same-desc">
                                                                        {getShortText(
                                                                            item.short_description ||
                                                                            item.description ||
                                                                            item.excerpt ||
                                                                            "",
                                                                        )}
                                                                    </p>

                                                                    <p
                                                                        className={`profile-same-status ${item.status ==
                                                                            "published"
                                                                            ? "published"
                                                                            : "unpublished"
                                                                            }`}
                                                                    >
                                                                        {item.status}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="profile-same-empty">
                                                    <Text>
                                                        Not Available exhibition content will be
                                                        displayed here
                                                    </Text>
                                                </div>
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
                                                You need to be a member to view exhibition
                                                content.
                                            </Text>
                                        </div>
                                    )}
                                </TabPane>
                            </Tabs>

                            <style jsx>{`
                .profile-card-section {
                    padding: 20px 0;
                    width: 100%;
                }

                .profile-card-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 28px;
                    width: 100%;
                }

                .profile-same-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    min-height: 420px;
                    background: #ffffff;
                    border: 1.5px solid #55b86d;
                    border-radius: 14px;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    transition:
                        transform 0.18s ease,
                        box-shadow 0.18s ease;
                }

                .profile-same-card:hover {
                    color: inherit;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 26px rgba(27, 122, 58, 0.13);
                }

                .profile-same-date {
                    position: absolute;
                    top: 0;
                    left: 34px;
                    width: 64px;
                    min-height: 74px;
                    background: #ffffff;
                    border-radius: 0 0 18px 18px;
                    z-index: 3;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
                }

                .profile-same-date strong {
                    display: block;
                    color: #14833a;
                    font-size: 24px;
                    line-height: 1;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                }

                .profile-same-date span {
                    display: block;
                    color: #8c8c8c;
                    font-size: 14px;
                    line-height: 1;
                    font-weight: 800;
                    margin-top: 8px;
                }

                .profile-same-image-wrap {
                    height: 260px;
                    width: 100%;
                    background: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .profile-same-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .profile-same-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                }

                .profile-same-placeholder i {
                    font-size: 150px;
                    line-height: 1;
                    color: #0f842e;
                }

                .profile-same-content {
                    flex: 1;
                    padding: 28px 20px 22px;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                }

                .profile-same-title {
                    margin: 0 0 22px;
                    color: #171717;
                    font-size: 24px;
                    line-height: 1.2;
                    font-weight: 900;
                    letter-spacing: -0.7px;
                    word-break: break-word;
                }

                .profile-same-title * {
                    margin: 0;
                    color: inherit;
                    font-size: inherit;
                    line-height: inherit;
                    font-weight: inherit;
                    letter-spacing: inherit;
                }

                .profile-same-desc {
                    margin: 0;
                    color: #777777;
                    font-size: 18px;
                    line-height: 1.45;
                    font-weight: 500;
                    word-break: break-word;
                }

                .profile-same-status {
                    margin: 12px 0 0;
                    font-size: 14px;
                    line-height: 1;
                    font-weight: 800;
                    text-transform: capitalize;
                }

                .profile-same-status.published {
                    color: green;
                }

                .profile-same-status.unpublished {
                    color: red;
                }

                .profile-same-empty {
                    text-align: center;
                    padding: 20px;
                }

                @media (max-width: 1199px) {
                    .profile-card-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 24px;
                    }
                }

                @media (max-width: 991px) {
                    .profile-card-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 22px;
                    }

                    .profile-same-card {
                        min-height: 400px;
                    }

                    .profile-same-image-wrap {
                        height: 245px;
                    }
                }

                @media (max-width: 575px) {
                    .profile-card-section {
                        padding: 16px 0;
                    }

                    .profile-card-grid {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .profile-same-card {
                        min-height: 410px;
                        border-radius: 14px;
                    }

                    .profile-same-image-wrap {
                        height: 260px;
                    }

                    .profile-same-date {
                        left: 32px;
                        width: 64px;
                        min-height: 74px;
                    }

                    .profile-same-title {
                        font-size: 24px;
                    }

                    .profile-same-desc {
                        font-size: 18px;
                    }
                }
            `}</style>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </FrontAuthenticatedLayout>
    );
}
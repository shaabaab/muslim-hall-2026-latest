import { Link, router, usePage } from "@inertiajs/react";
import FrontAuthenticatedLayout from "@/Layouts/FrontAuthenticatedLayout";
import {
    Table,
    Button,
    Space,
    Row,
    Col,
    Card,
    Typography,
    Popconfirm,
    message,
    Tooltip,
    Tag,
    Image,
    Divider,
    List,
    Avatar,
    Tabs,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    BackwardFilled,
    FileTextOutlined,
    VideoCameraOutlined,
    GlobalOutlined,
    EyeFilled,
    TranslationOutlined,
    MessageOutlined,
    MailOutlined,
    SettingOutlined,
    HeartOutlined,
    UserOutlined,
    TeamOutlined,
    TrophyOutlined,
    ShopOutlined,
    HistoryOutlined,
} from "@ant-design/icons";

import { useState } from "react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function UserProfile({
    user,
    auth,
    followers,
    following,
    userStats,
    posts,
    contests,
    exhibitions,
    communitys,
}) {
    const [activeTab, setActiveTab] = useState("profile");
    const [showFollowerList, setShowFollowerList] = useState(false);
    const [showFollowingList, setShowFollowingList] = useState(false);

    const isMember =
        auth.user?.subscriptions?.length > 0 &&
        auth.user?.subscriptions[0]?.status == 1;
    console.log("isMember:", isMember);

    console.log("exhibitions with communitys:", posts);

    const handleFollow = (userId) => {
        router.post(
            route("user.follow", userId),
            {},
            {
                onSuccess: () => {
                    message.success("Followed successfully");
                    router.reload();
                },
                onError: (errors) => {
                    message.error(errors.info || "Failed to follow user");
                },
            },
        );
    };

    const handleUnfollow = (userId) => {
        router.post(
            route("user.unfollow", userId),
            {},
            {
                onSuccess: () => {
                    message.success("Unfollowed successfully");
                    router.reload();
                },
                onError: (errors) => {
                    message.error(errors.info || "Failed to unfollow user");
                },
            },
        );
    };

    const isOwnProfile = auth.user.id === user.id;
    const isFollowingProfileOwner = followers.some(
        (follower) => follower.id === auth.user.id,
    );

    const userStatsData = [
        {
            title: "Total Participate Contests",
            value: userStats?.total_contests || 0,
            icon: <TrophyOutlined />,
            color: "#1890ff",
        },
        {
            title: "Entries Submitted",
            value: userStats?.total_entries || 0,
            icon: <FileTextOutlined />,
            color: "#52c41a",
        },
        {
            title: "Total Votes",
            value: userStats?.total_votes || 0,
            icon: <HeartOutlined />,
            color: "#eb2f96",
        },
        {
            title: "Wins",
            value: userStats?.wins || 0,
            icon: <TrophyOutlined />,
            color: "#faad14",
        },
    ];

    const FollowerList = () => (
        <Card
            title={`Followers (${followers.length ?? 0})`}
            size="small"
            extra={
                <Button type="link" onClick={() => setShowFollowerList(false)}>
                    Close
                </Button>
            }
        >
            <List
                dataSource={followers}
                renderItem={(follower) => (
                    <List.Item
                        actions={[
                            !isOwnProfile && follower.id !== auth.user.id && (
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => handleFollow(follower.id)}
                                >
                                    Follow Back
                                </Button>
                            ),
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    src={follower.avatar}
                                    icon={<UserOutlined />}
                                    size="large"
                                />
                            }
                            title={
                                <Link
                                    href={route(
                                        "user.profile.show",
                                        follower.id,
                                    )}
                                >
                                    {follower.name}
                                </Link>
                            }
                            description={follower.bio || "No bio available"}
                        />
                    </List.Item>
                )}
                locale={{ emptyText: "No followers yet" }}
            />
        </Card>
    );

    const FollowingList = () => (
        <Card
            title={`Following (${following.length ?? 0})`}
            size="small"
            extra={
                <Button type="link" onClick={() => setShowFollowingList(false)}>
                    Close
                </Button>
            }
        >
            <List
                dataSource={following}
                renderItem={(followedUser) => (
                    <List.Item
                        actions={[
                            !isOwnProfile && (
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    onClick={() =>
                                        handleUnfollow(followedUser.id)
                                    }
                                >
                                    Unfollow
                                </Button>
                            ),
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    src={followedUser.avatar}
                                    icon={<UserOutlined />}
                                    size="large"
                                />
                            }
                            title={
                                <Link
                                    href={route(
                                        "user.profile.show",
                                        followedUser.id,
                                    )}
                                >
                                    {followedUser.name}
                                </Link>
                            }
                            description={followedUser.bio || "No bio available"}
                        />
                    </List.Item>
                )}
                locale={{ emptyText: "Not following anyone" }}
            />
        </Card>
    );

    return (
        <FrontAuthenticatedLayout
            user={auth.user}
            header={`${user.name}'s Profile`}
        >
            <Row gutter={[24, 24]}>
                {/* Left Sidebar - User Info */}
                <Col xs={24} lg={8}>
                    {/* <Card
                        className="text-center"
                        style={{ backgroundColor: bannerColor }}
                    >
                        <Avatar
                            size={120}
                            src={
                                user.photo
                                    ? user.photo.startsWith("http")
                                        ? user.photo
                                        : getS3PublicUrl(user.photo)
                                    : null
                            }
                            icon={!user.photo ? <UserOutlined /> : null}
                            className="mb-3"
                        />

                        <Title level={3}>{user.name}</Title>

                        <h1 className="text-gray-700 font-normal">
                            {user.bio}
                        </h1>
                        <Tag
                            className="mb-2"
                            color={user.badges ? user.badges.color : "green"}
                        >
                            {user.badges ? user.badges.name : "New"}
                        </Tag>
                        <br />

                        <div className="mb-4">
                            <Space size="large">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setShowFollowerList(true)}
                                >
                                    <Title level={4} className="mb-0">
                                        {followers.length ?? 0}
                                    </Title>
                                    <Text className="text-primary" type="link">
                                        Followers
                                    </Text>
                                </div>

                                <div
                                    className="cursor-pointer"
                                    onClick={() => setShowFollowingList(true)}
                                >
                                    <Title level={4} className="mb-0 ">
                                        {following.length ?? 0}
                                    </Title>
                                    <Text className="text-primary" type="link">
                                        Following
                                    </Text>
                                </div>
                            </Space>
                        </div>

                        {!isOwnProfile && (
                            <Button
                                type={
                                    isFollowingProfileOwner
                                        ? "default"
                                        : "primary"
                                }
                                icon={<UserOutlined />}
                                onClick={() =>
                                    isFollowingProfileOwner
                                        ? handleUnfollow(user.id)
                                        : handleFollow(user.id)
                                }
                                className="mb-3"
                                block
                            >
                                {isFollowingProfileOwner
                                    ? "Unfollow"
                                    : "Follow"}
                            </Button>
                        )}

                        {isOwnProfile && (
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <Link href={route("user.profile.edit")}>
                                    <Button icon={<EditOutlined />} block>
                                        Edit Profile
                                    </Button>
                                </Link>
                            </Space>
                        )}
                    </Card> */}
                    <Card className="text-center">
                        <Avatar
                            size={120}
                            src={
                                user.photo
                                    ? user.photo.startsWith("http")
                                        ? user.photo
                                        : getS3PublicUrl(user.photo)
                                    : null
                            }
                            icon={!user.photo ? <UserOutlined /> : null}
                            className="mb-3"
                        />

                        <Title level={3}>{user.name}</Title>

                        <h1 className="text-gray-700 font-normal">
                            {user.bio}
                        </h1>
                        <Tag
                            className="mb-2"
                            color={user.badges ? user.badges.color : "green"}
                        >
                            {user.badges ? user.badges.name : "New"}
                        </Tag>
                        <br />

                        <div className="mb-4">
                            <Space size="large">
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setShowFollowerList(true)}
                                >
                                    <Title level={4} className="mb-0">
                                        {followers.length ?? 0}
                                    </Title>
                                    <Text className="text-primary" type="link">
                                        Followers
                                    </Text>
                                </div>

                                <div
                                    className="cursor-pointer"
                                    onClick={() => setShowFollowingList(true)}
                                >
                                    <Title level={4} className="mb-0 ">
                                        {following.length ?? 0}
                                    </Title>
                                    <Text className="text-primary" type="link">
                                        Following
                                    </Text>
                                </div>
                            </Space>
                        </div>

                        {!isOwnProfile && (
                            <Button
                                type={
                                    isFollowingProfileOwner
                                        ? "default"
                                        : "primary"
                                }
                                icon={<UserOutlined />}
                                onClick={() =>
                                    isFollowingProfileOwner
                                        ? handleUnfollow(user.id)
                                        : handleFollow(user.id)
                                }
                                className="mb-3"
                                block
                            >
                                {isFollowingProfileOwner
                                    ? "Unfollow"
                                    : "Follow"}
                            </Button>
                        )}

                        {isOwnProfile && (
                            <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                            >
                                <Link href={route("user.profile.edit")}>
                                    <Button icon={<EditOutlined />} block>
                                        Edit Profile
                                    </Button>
                                </Link>
                            </Space>
                        )}
                    </Card>

                    {/* Stats Card */}
                    <Card title="Statistics" size="small" className="mt-3">
                        <Space
                            direction="vertical"
                            style={{ width: "100%" }}
                            size="middle"
                        >
                            {userStatsData.map((stat, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center"
                                >
                                    <Space>
                                        <span style={{ color: stat.color }}>
                                            {stat.icon}
                                        </span>
                                        <Text>{stat.title}</Text>
                                    </Space>
                                    <Tag color={stat.color}>{stat.value}</Tag>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>

                {/* Main Content */}
                <Col xs={24} lg={16}>
                    {showFollowerList && <FollowerList />}
                    {showFollowingList && <FollowingList />}

                    {!showFollowerList && !showFollowingList && (
                        <>
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
                                                Profile
                                            </span>
                                        }
                                        key="profile"
                                    >
                                        <Space
                                            direction="vertical"
                                            style={{ width: "100%" }}
                                            size="large"
                                        >
                                            <div>
                                                <Title level={4}>About</Title>
                                                <Paragraph>
                                                    {user.bio ||
                                                        "No information provided."}
                                                </Paragraph>
                                            </div>

                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} sm={12}>
                                                    <Text strong>Joined:</Text>
                                                    <br />
                                                    <Text>
                                                        {new Date(
                                                            user.created_at,
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                year: "numeric",
                                                                month: "long",
                                                                day: "numeric",
                                                            },
                                                        )}
                                                    </Text>
                                                </Col>
                                                {/* <Col xs={24} sm={12}>
                                                <Text strong>Location:</Text>
                                                <br />
                                                <Text>{user.location || 'Not specified'}</Text>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <Text strong>Website:</Text>
                                                <br />
                                                {user.website ? (
                                                    <a href={user.website} target="_blank" rel="noopener noreferrer">
                                                        {user.website}
                                                    </a>
                                                ) : (
                                                    <Text>https://muslimhall.com/</Text>
                                                )}
                                            </Col> */}
                                            </Row>
                                        </Space>
                                    </TabPane>

                                    <TabPane
                                        tab={
                                            <span>
                                                <TeamOutlined />
                                                Followers (
                                                {followers.length ?? 0})
                                            </span>
                                        }
                                        key="followers"
                                    >
                                        <List
                                            dataSource={followers}
                                            renderItem={(follower) => {
                                                const isOwnAccount =
                                                    auth.user.id ===
                                                    follower.id;
                                                const isAlreadyFollowing =
                                                    following.some(
                                                        (f) =>
                                                            f.id ===
                                                            follower.id,
                                                    );

                                                return (
                                                    <List.Item
                                                        actions={[
                                                            !isOwnAccount &&
                                                            (isAlreadyFollowing ? (
                                                                <Button
                                                                    type="default"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleUnfollow(
                                                                            follower.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Unfollow
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleFollow(
                                                                            follower.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Follow
                                                                    Back
                                                                </Button>
                                                            )),
                                                        ]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={
                                                                <Avatar
                                                                    src={
                                                                        follower.avatar
                                                                    }
                                                                    icon={
                                                                        <UserOutlined />
                                                                    }
                                                                    size="large"
                                                                />
                                                            }
                                                            title={
                                                                <Link
                                                                    href={route(
                                                                        "user.profile.show",
                                                                        follower.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        follower.name
                                                                    }
                                                                </Link>
                                                            }
                                                            description={
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "12px",
                                                                        color: "#666",
                                                                        marginTop:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    Followers:{" "}
                                                                    {follower.followers_count ||
                                                                        0}{" "}
                                                                    • Following:{" "}
                                                                    {follower.followings_count ||
                                                                        0}
                                                                </div>
                                                            }
                                                        />
                                                    </List.Item>
                                                );
                                            }}
                                            locale={{
                                                emptyText: "No followers yet",
                                            }}
                                        />
                                    </TabPane>

                                    <TabPane
                                        tab={
                                            <span>
                                                <TeamOutlined />
                                                Following (
                                                {following.length ?? 0})
                                            </span>
                                        }
                                        key="following"
                                    >
                                        <List
                                            dataSource={following}
                                            renderItem={(followedUser) => {
                                                const isOwnAccount =
                                                    auth.user.id ===
                                                    followedUser.id;

                                                return (
                                                    <List.Item
                                                        actions={[
                                                            !isOwnAccount && (
                                                                <Button
                                                                    type="default"
                                                                    size="small"
                                                                    danger
                                                                    onClick={() =>
                                                                        handleUnfollow(
                                                                            followedUser.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Unfollow
                                                                </Button>
                                                            ),
                                                        ]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={
                                                                <Avatar
                                                                    src={
                                                                        followedUser.avatar
                                                                    }
                                                                    icon={
                                                                        <UserOutlined />
                                                                    }
                                                                    size="large"
                                                                />
                                                            }
                                                            title={
                                                                <Link
                                                                    href={route(
                                                                        "user.profile.show",
                                                                        followedUser.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        followedUser.name
                                                                    }
                                                                </Link>
                                                            }
                                                            description={
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "12px",
                                                                        color: "#666",
                                                                        marginTop:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    Followers:{" "}
                                                                    {followedUser.followers_count ||
                                                                        0}{" "}
                                                                    • Following:{" "}
                                                                    {followedUser.followings_count ||
                                                                        0}
                                                                </div>
                                                            }
                                                        />
                                                    </List.Item>
                                                );
                                            }}
                                            locale={{
                                                emptyText:
                                                    "Not following anyone yet",
                                            }}
                                        />
                                    </TabPane>

                                    {isOwnProfile && (
                                        <TabPane
                                            tab={
                                                <span>
                                                    <SettingOutlined />
                                                    Settings
                                                </span>
                                            }
                                            key="settings"
                                        >
                                            <Space
                                                direction="vertical"
                                                style={{ width: "100%" }}
                                            >
                                                <Link
                                                    href={route(
                                                        "user.profile.edit",
                                                    )}
                                                >
                                                    <Button
                                                        icon={<EditOutlined />}
                                                    >
                                                        Edit Profile
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={route(
                                                        "user.profile.edit",
                                                    )}
                                                >
                                                    <Button
                                                        icon={
                                                            <SettingOutlined />
                                                        }
                                                    >
                                                        Change Password
                                                    </Button>
                                                </Link>
                                            </Space>
                                        </TabPane>
                                    )}
                                </Tabs>
                            </Card>

                            <br />

                            {/* <Card>
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
                                                                    ?.length >
                                                                    0 ? (
                                                                    <img
                                                                        src={`/storage/${post.images[0]?.image}`}
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
                                                                            No
                                                                            Image
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
                                                                <div>
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
                                                                        •
                                                                        Comments:{" "}
                                                                        {post.all_comments_count ||
                                                                            0}
                                                                    </Text>
                                                                </div>
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
                                                    Contest participations will
                                                    be displayed here
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
                                                                                Created
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
                                                        Community content will
                                                        be displayed here
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
                                                    You need to be a member to
                                                    view community content.
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
                                                                                Created
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
                                                        content will be
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
                                                    You need to be a member to
                                                    view exhibition content.
                                                </Text>
                                            </div>
                                        )}
                                    </TabPane>
                                </Tabs>
                            </Card> */}
                        </>
                    )}
                </Col>
            </Row>
        </FrontAuthenticatedLayout>
    );
}

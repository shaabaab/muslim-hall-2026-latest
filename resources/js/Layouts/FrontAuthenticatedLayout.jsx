import { Link, router, usePage } from "@inertiajs/react";
import {
    Layout,
    Menu,
    Button,
    Avatar,
    Dropdown,
    Space,
    Typography,
    theme,
    Drawer,
    Grid,
    Badge,
} from "antd";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import {
    LogoutOutlined,
    UserOutlined,
    SettingOutlined,
    TrophyOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    TeamOutlined,
    PictureOutlined,
    LockOutlined,
    DashboardOutlined,
    CloseOutlined,
    DollarOutlined,
    HomeOutlined,
    TrophyFilled,
    NotificationOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import NotificationDropdown from "../Components/NotificationDropdown";
import BackgroundUploadIndicator from "@/Components/BackgroundUploadIndicator";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function FrontAuthenticatedLayout({ children }) {
    const { token } = theme.useToken();
    const screens = useBreakpoint();

    // Determine device state
    const isMobile = !screens.md; // Mobile if smaller than 'md' (768px)

    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);

    const { auth } = usePage().props;
    const { url } = usePage();
    const user = auth.user;

    // Check membership status safely
    const isMember =
        user?.subscriptions?.length > 0 && user?.subscriptions[0]?.status == 1;

    const isAdmin = user?.role == 2;
    const canAccessExhibitionMenu = isMember || isAdmin;

    // --- Styling Constants ---
    const customTheme = {
        sidebarBg: "#1a237e",
        sidebarText: "#ffffff",
        headerBg: "#ffffff",
        contentBg: "#f0f2f5",
        accentColor: "#6366f1",
        gradient: "linear-gradient(135deg, #4f46e5 0%, #764ba2 100%)", // slightly brighter gradient
    };

    const handleBackToHome = () => {
        window.location.href = "/";
    };

    const handleLogout = () => {
        router.post(route("logout"));
    };

    // Auto-collapse sidebar logic
    useEffect(() => {
        if (isMobile) {
            setCollapsed(false); // Reset collapsed state on mobile so drawer works
        }
    }, [isMobile]);

    // --- Menu Selection Logic ---
    useEffect(() => {
        const currentPath = url;
        const routeToKeyMap = {
            "/dashboard": ["dashboard"],
            "/user/participate/contests": ["participate-contests-list"],
            "/user/contests": ["contests-list"],
            "/user/communities": ["communities-list"],

            "/user/exhibition-boards/create": ["exhibition-boards-create"],
            "/user/exhibition-boards": ["exhibition-boards-list"],
            "/user/exhibitions/create": ["exhibitions-create"],
            "/user/exhibitions": ["exhibitions-list"],

            "/user/posts/create": ["posts-create"],
            "/user/posts": ["posts-list"],

            "/user/subscriptions": ["subscriptions-list"],
            "/profile": ["profile"],
            "/user/entries": ["own-entry"],
            "/user/history_contest": ["contests-history"],
            "/user/contest-fees": ["contest-fees"],
            "/user/sponsors": ["sponsors-list"],
        };

        let foundKey = ["dashboard"];
        for (const [route, keys] of Object.entries(routeToKeyMap)) {
            if (currentPath.startsWith(route)) {
                foundKey = keys;
                break;
            }
        }
        setSelectedKeys(foundKey);

        // Auto-expand logic (simplified)
        const parentMap = {
            "participate-contests-list": "participation-contests",
            "own-entry": "participation-contests",
            "contests-history": "participation-contests",
            "contest-fees": "participation-contests",
            "contests-list": "contests-management",
            "sponsors-list": "contests-management",
            "communities-list": "community-management",

            "exhibition-boards-list": "exhibition-management",
            "exhibition-boards-create": "exhibition-management",
            "exhibitions-list": "exhibition-management",
            "exhibitions-create": "exhibition-management",

            "posts-create": "post-management",
            "posts-list": "post-management",
            "subscriptions-list": "subscription-management",
        };

        if (parentMap[foundKey[0]]) {
            setOpenKeys([parentMap[foundKey[0]]]);
        }
    }, [url]);

    // --- Menu Items Configuration ---
    const userMenuItems = [
        {
            key: "profile",
            icon: <SettingOutlined />,
            label: (
                <Link href={route("user.profile.show", user?.id)}>Profile</Link>
            ),
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Logout",
            onClick: handleLogout,
            danger: true,
        },
    ];

    const menuItems = [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link href={route("dashboard")}>Dashboard</Link>,
        },
        {
            key: "participation-contests",
            icon: <TrophyOutlined />,
            label: "Participation",
            children: [
                {
                    key: "participate-contests-list",
                    label: (
                        <Link href={route("user.contests.participate.index")}>
                            Contests
                        </Link>
                    ),
                },
                {
                    key: "own-entry",
                    label: (
                        <Link href={route("user.own_entry.index")}>
                            Own Entries
                        </Link>
                    ),
                },
                {
                    key: "contests-history",
                    label: (
                        <Link href={route("user.history.index")}>History</Link>
                    ),
                },
                {
                    key: "contest-fees",
                    icon: <DollarOutlined />,
                    label: (
                        <Link href={route("user.contest-fees.index")}>
                            Contest Fee
                        </Link>
                    ),
                },
            ],
        },
        {
            key: "post-management",
            icon: <PictureOutlined />,
            label: "Posts",
            children: [
                {
                    key: "posts-create",
                    label: (
                        <Link href={route("user.posts.create")}>
                            Create Post
                        </Link>
                    ),
                },
                {
                    key: "posts-list",
                    label: (
                        <Link href={route("user.posts.index")}>All Posts</Link>
                    ),
                },
            ],
        },
        {
            key: "subscription-management",
            icon: <DollarOutlined />,
            label: "Subscriptions",
            children: [
                {
                    key: "subscriptions-list",
                    label: (
                        <Link href={route("user.subscriptions.index")}>
                            My Plan
                        </Link>
                    ),
                },
            ],
        },
        { type: "divider" }, // Visual separator for locked content
        {
            key: "community-management",
            icon: isMember ? <TeamOutlined /> : <LockOutlined />,
            label: "Community",
            disabled: !isMember,
            children: [
                {
                    key: "communities-list",
                    label: (
                        <Link href={route("user.communities.index")}>
                            Community List
                        </Link>
                    ),
                },
            ],
        },
        {
            key: "exhibition-management",
            icon: canAccessExhibitionMenu ? <PictureOutlined /> : <LockOutlined />,
            label: "Exhibitions",
            disabled: !canAccessExhibitionMenu,
            children: [
                {
                    key: "exhibition-boards-list",
                    label: (
                        <Link href={route("user.exhibition-boards.index")}>
                            Board List
                        </Link>
                    ),
                },
                {
                    key: "exhibition-boards-create",
                    label: (
                        <Link href={route("user.exhibition-boards.create")}>
                            Create Board
                        </Link>
                    ),
                },
                {
                    key: "exhibitions-list",
                    label: (
                        <Link href={route("user.exhibitions.index")}>
                            Exhibition List
                        </Link>
                    ),
                },
                {
                    key: "exhibitions-create",
                    label: (
                        <Link href={route("user.exhibitions.create")}>
                            Create Exhibition
                        </Link>
                    ),
                },
            ],
        },
        {
            key: "contests-management",
            icon: isMember ? <TrophyFilled /> : <LockOutlined />,
            label: "Contest Mgmt",
            disabled: !isMember,
            children: [
                {
                    key: "contests-list",
                    label: (
                        <Link href={route("user.contests.index")}>
                            Manage Contests
                        </Link>
                    ),
                },
                {
                    key: "sponsors-list",
                    label: (
                        <Link href={route("user.sponsors.index")}>
                            Sponsors
                        </Link>
                    ),
                },
            ],
        },
    ];

    // --- Component: Logo ---
    const Logo = () => (
        <div
            style={{
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.1)",
                gap: 10,
                overflow: "hidden",
                whiteSpace: "nowrap",
            }}
        >
            <div
                style={{
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: "50%",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
            >
                <img
                    width="32"
                    height="32"
                    src="https://img.icons8.com/pulsar-gradient/48/user.png"
                    alt="logo"
                />
            </div>
            {(!collapsed || isMobile) && (
                <Text
                    strong
                    style={{
                        color: "#fff",
                        fontSize: "16px",
                        letterSpacing: "0.5px",
                    }}
                >
                    Muslim Hall
                </Text>
            )}
        </div>
    );

    // --- Component: Sidebar Content ---
    const sidebarContent = (
        <>
            <Logo />
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedKeys}
                openKeys={openKeys}
                onOpenChange={setOpenKeys}
                items={menuItems}
                style={{ background: "transparent", borderRight: 0 }}
            />
        </>
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {/* Desktop Sider */}
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={250}
                    style={{
                        background: customTheme.gradient,
                        height: "100vh",
                        position: "fixed",
                        left: 0,
                        top: 0,
                        zIndex: 1001,
                        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
                    }}
                >
                    {sidebarContent}
                </Sider>
            )}

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setMobileDrawerVisible(false)}
                open={mobileDrawerVisible}
                width={250}
                styles={{
                    body: { padding: 0, background: customTheme.gradient },
                    header: { display: "none" }, // We use custom Logo component inside
                }}
            >
                {/* Close button for drawer */}
                <div
                    style={{
                        position: "absolute",
                        top: 15,
                        right: 15,
                        zIndex: 10,
                    }}
                >
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ color: "white" }} />}
                        onClick={() => setMobileDrawerVisible(false)}
                    />
                </div>
                {sidebarContent}
            </Drawer>

            {/* Main Layout Area */}
            <Layout
                style={{
                    marginLeft: isMobile ? 0 : collapsed ? 80 : 250,
                    transition: "margin-left 0.2s",
                    background: customTheme.contentBg,
                }}
            >
                <Header
                    style={{
                        padding: "0 16px",
                        background: token.colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 999,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                >
                    {/* Left: Trigger & Welcome */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <Button
                            type="text"
                            icon={
                                isMobile || collapsed ? (
                                    <MenuUnfoldOutlined />
                                ) : (
                                    <MenuFoldOutlined />
                                )
                            }
                            onClick={() =>
                                isMobile
                                    ? setMobileDrawerVisible(true)
                                    : setCollapsed(!collapsed)
                            }
                            style={{ fontSize: "16px", width: 48, height: 48 }}
                        />

                        {/* Hide welcome text on mobile to save space */}
                        {!isMobile && (
                            <Text strong style={{ fontSize: "16px" }}>
                                Welcome back, {user?.name?.split(" ")[0]}! 👋
                            </Text>
                        )}
                    </div>

                    {/* Right: Actions & User */}
                    <Space size={isMobile ? 8 : 16}>
                        {/* Responsive "Back to Home" - Icon only on mobile */}
                        <Button
                            onClick={handleBackToHome}
                            icon={<HomeOutlined />}
                            shape={isMobile ? "circle" : "default"}
                        >
                            {!isMobile && "Home"}
                        </Button>

                        <BackgroundUploadIndicator />
                        <NotificationDropdown />

                        <Dropdown
                            menu={{ items: userMenuItems }}
                            trigger={["click"]}
                        >
                            <div
                                style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "4px 8px",
                                    borderRadius: token.borderRadiusLG,
                                    transition: "background 0.3s",
                                }}
                                className="user-dropdown-trigger"
                            >
                                <Badge dot status="success" offset={[-4, 30]}>
                                    <Avatar
                                        style={{
                                            background: customTheme.gradient,
                                        }}
                                        src={
                                            user.photo
                                                ? getS3PublicUrl(user.photo)
                                                : null
                                        }
                                        icon={!user.photo && <UserOutlined />}
                                    />
                                </Badge>

                                {/* Hide Name/Role on Mobile */}
                                {!isMobile && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        <Text strong style={{ fontSize: 13 }}>
                                            {user?.name}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                        >
                                            {user?.role == 2
                                                ? "Admin"
                                                : isMember
                                                  ? "Member"
                                                  : "User"}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </Space>
                </Header>

                <Content
                    style={{
                        margin: isMobile ? "16px" : "24px",
                        overflow: "initial",
                    }}
                >
                    <div
                        style={{
                            padding: isMobile ? 16 : 24,
                            background: token.colorBgContainer,
                            borderRadius: token.borderRadiusLG,
                            minHeight: "calc(100vh - 112px)", // Adjusted for header + margin
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>

            <style jsx global>{`
                .user-dropdown-trigger:hover {
                    background-color: rgba(0, 0, 0, 0.03);
                }

                /* Custom scrollbar for sidebar */
                .ant-layout-sider-children::-webkit-scrollbar {
                    width: 6px;
                }
                .ant-layout-sider-children::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                }
            `}</style>
        </Layout>
    );
}
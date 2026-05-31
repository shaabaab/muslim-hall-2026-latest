import {
    AppstoreOutlined,
    BankOutlined,
    BookOutlined,
    CloseOutlined,
    CommentOutlined,
    ControlOutlined,
    DashboardOutlined,
    DollarOutlined,
    FileTextOutlined,
    FlagOutlined,
    FolderOpenOutlined,
    GiftOutlined,
    GlobalOutlined,
    HomeOutlined,
    LikeOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    NotificationOutlined,
    SafetyCertificateOutlined,
    SecurityScanOutlined,
    SettingOutlined,
    ShareAltOutlined,
    SlidersOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    TrophyFilled,
    TrophyOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Link as InertiaLink, router, usePage } from "@inertiajs/react";
import {
    Avatar,
    Badge,
    Button,
    Drawer,
    Dropdown,
    Grid,
    Layout,
    Menu,
    Typography,
    theme,
} from "antd";
import { useEffect, useState } from "react";
import NotificationDropdown from "../Components/NotificationDropdown";
import BackgroundUploadIndicator from "../Components/BackgroundUploadIndicator";
import { getS3PublicUrl } from "@/Utils/s3Helpers";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function AuthenticatedLayout({ header, children }) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const screens = useBreakpoint();
    const isMobile = !screens.lg;

    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);

    const { url } = usePage();
    const { auth, reportCount } = usePage().props;
    const user = auth.user;

    const profilePhotoUrl = auth?.user?.photo_url
        ? auth.user.photo_url
        : auth?.user?.photo
            ? getS3PublicUrl(auth.user.photo)
            : null;

    const can = (permission) => user?.permissions?.includes(permission);
    const handleLogout = () => router.post(route("logout"));
    const handleBackToHome = () => (window.location.href = "/");

    useEffect(() => {
        const path = url ? url.split("?")[0] : window.location.pathname;

        const routeMap = {
            "/admin/dashboard": ["dashboard", []],
            "/admin/users": ["users-list", ["users"]],
            "/admin/roles": ["roles-list", ["roles"]],
            "/admin/books": ["books-list", ["islamic-zone"]],
            "/admin/seos": ["seos-list", ["seos"]],
            "/admin/blockedips": ["blockedips-list", ["blockedips"]],
            "/admin/sponsors": ["sponsors-list", ["sponsors"]],
            "/admin/communities": ["communities-list", ["communities"]],
            "/admin/islamic-zone": ["islamic-zone-list", ["islamic-zone"]],
            "/admin/exhibitions": ["exhibitions-list", ["exhibitions"]],
            "/admin/exhibition-boards": ["exhibition-boards-list", ["exhibitions"]],
            "/admin/advertisements": [
                "advertisements-list",
                ["advertisements"],
            ],
            "/admin/langs": ["langs-list", ["langs"]],
            "/admin/sections": ["sections-list", ["sections"]],
            "/admin/categories": ["categories-list", ["categories"]],
            "/admin/posts": ["posts-list", ["posts"]],
            "/admin/posts/create": ["posts-create", ["posts"]],
            "/admin/reports": ["reports-list", ["reports"]],
            "/admin/contests_category": [
                "contests-category-list",
                ["contests"],
            ],
            "/admin/contests": ["contests-list", ["contests"]],
            "/admin/entries": ["entries-list", ["contests"]],
            "/admin/votes": ["votes-list", ["contests"]],
            "/admin/prizes": ["prizes-list", ["contests"]],
            "/admin/reviews": ["reviews-list", ["contests"]],
            "/admin/archived": ["archived-list", ["contests"]],
            "/admin/contests-fees": ["contests-fees-list", ["contests"]],
            "/admin/plans": ["plans-list", ["plans"]],
            "/admin/subscriptions": ["subscriptions-list", ["subscriptions"]],
            "/admin/payments": ["payments-list", ["subscriptions"]],
            "/admin/badges": ["badges-list", ["badges"]],
            "/admin/settings/slider": ["slider-settings", ["settings"]],
            "/admin/settings/contact-info": [
                "contact-information",
                ["settings"],
            ],
            "/admin/settings/feedback": ["user-feedback", ["settings"]],
            "/admin/settings/social-links": ["social-links", ["settings"]],
            "/admin/settings/optimization": ["optimization", ["settings"]],
            "/admin/settings": ["settings-list", ["settings"]],
        };

        const matchedPath = Object.keys(routeMap)
            .sort((a, b) => b.length - a.length)
            .find((key) => path.startsWith(key));

        if (matchedPath) {
            const [select, open] = routeMap[matchedPath];
            setSelectedKeys([select]);
            if (!collapsed) {
                setOpenKeys((prev) => [...new Set([...prev, ...open])]);
            }
        }
    }, [url, collapsed]);

    // Handle menu item click
    const handleMenuClick = ({ key }) => {
        setSelectedKeys([key]);
        if (isMobile) {
            setMobileDrawerVisible(false);
        }
    };

    // Handle open keys change
    const handleOpenChange = (keys) => {
        setOpenKeys(keys);
    };

    // Menu Item Definitions with proper Inertia links
    const menuItems = [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: (
                <InertiaLink href={route("admin.dashboard")} preserveScroll>
                    Dashboard
                </InertiaLink>
            ),
        },
        {
            key: "users",
            icon: <TeamOutlined />,
            label: "User Management",
            children: [
                {
                    key: "users-list",
                    icon: <UserOutlined />,
                    label: (
                        <InertiaLink href={route("admin.users.index")} preserveScroll>
                            Users
                        </InertiaLink>
                    ),
                },
                can("users.create") && {
                    key: "users-create",
                    icon: <UserOutlined />,
                    label: (
                        <InertiaLink href={route("admin.users.create")} preserveScroll>
                            Create User
                        </InertiaLink>
                    ),
                },
            ].filter(Boolean),
        },
        {
            key: "roles",
            icon: <SafetyCertificateOutlined />,
            label: "Roles & Permissions",
            children: [
                {
                    key: "roles-list",
                    icon: <SafetyCertificateOutlined />,
                    label: (
                        <InertiaLink href={route("admin.roles.index")} preserveScroll>
                            Roles
                        </InertiaLink>
                    ),
                },
                can("roles.create") && {
                    key: "roles-create",
                    icon: <SafetyCertificateOutlined />,
                    label: (
                        <InertiaLink href={route("admin.roles.create")} preserveScroll>
                            Create Role
                        </InertiaLink>
                    ),
                },
            ].filter(Boolean),
        },
        {
            key: "seos",
            icon: <GlobalOutlined />,
            label: "SEO",
            children: [
                {
                    key: "seos-list",
                    label: (
                        <InertiaLink href={route("admin.seos.index")} preserveScroll>
                            SEO List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "blockedips",
            icon: <SecurityScanOutlined />,
            label: "Security",
            children: [
                {
                    key: "blockedips-list",
                    label: (
                        <InertiaLink href={route("admin.blockedips.index")} preserveScroll>
                            Blocked IPs
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "sponsors",
            icon: <TrophyFilled />,
            label: "Sponsors",
            children: [
                {
                    key: "sponsors-list",
                    label: (
                        <InertiaLink href={route("admin.sponsors.index")} preserveScroll>
                            List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "communities",
            icon: <TeamOutlined />,
            label: "Community",
            children: [
                {
                    key: "communities-list",
                    label: (
                        <InertiaLink href={route("admin.communities.index")}>
                            Communities
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "posts",
            icon: <FileTextOutlined />,
            label: "Posts",
            children: [
                {
                    key: "posts-list",
                    label: (
                        <InertiaLink href={"/admin/posts"}>
                            Post List
                        </InertiaLink>
                    ),
                },
                {
                    key: "posts-create",
                    label: (
                        <InertiaLink href={route("admin.posts.create")}>
                            Create Post
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "reports",
            icon: <FileTextOutlined />,
            label: `Reports (${reportCount ?? 0})`,
            children: [
                {
                    key: "reports-list",
                    label: (
                        <InertiaLink href={"/admin/reports"}>
                            Report List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "islamic-zone",
            icon: <BankOutlined />,
            label: "Islamic Zone",
            children: [
                {
                    key: "islamic-zone-list",
                    icon: <BankOutlined />,
                    label: (
                        <InertiaLink href={route("admin.islamic-zone.index")}>
                            Zone Home
                        </InertiaLink>
                    ),
                },
                {
                    key: "books-list",
                    icon: <BookOutlined />,
                    label: (
                        <InertiaLink href={route("admin.books.index")}>
                            Books
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "exhibitions",
            icon: <AppstoreOutlined />,
            label: "Exhibitions",
            children: [
                {
                    key: "exhibition-boards-list",
                    label: (
                        <InertiaLink href={route("admin.exhibition-boards.index")} preserveScroll>
                            Board List
                        </InertiaLink>
                    ),
                },
                {
                    key: "exhibitions-list",
                    label: (
                        <InertiaLink href={route("admin.exhibitions.index")} preserveScroll>
                            Exhibition List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "advertisements",
            icon: <NotificationOutlined />,
            label: "Ads",
            children: [
                {
                    key: "advertisements-list",
                    label: (
                        <InertiaLink href={route("admin.advertisements.index")}>
                            Ads List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "langs",
            icon: <FlagOutlined />,
            label: "Languages",
            children: [
                {
                    key: "langs-list",
                    label: (
                        <InertiaLink href={route("admin.langs.index")}>
                            Language List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "sections",
            icon: <AppstoreOutlined />,
            label: "Sections",
            children: [
                {
                    key: "sections-list",
                    label: (
                        <InertiaLink href={route("admin.sections.index")}>
                            Section List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "categories",
            icon: <FolderOpenOutlined />,
            label: "Categories",
            children: [
                {
                    key: "categories-list",
                    label: (
                        <InertiaLink href={"/admin/categories"}>
                            Category List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "Lottery",
            icon: <TrophyOutlined />,
            label: "Lottery",
            children: [
                {
                    key: "contests-list",
                    icon: <TrophyOutlined />,
                    label: (
                        <InertiaLink href={"/admin/lottery"}>
                            Lottery List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "contests",
            icon: <TrophyOutlined />,
            label: "Contests",
            children: [
                {
                    key: "contests-list",
                    icon: <TrophyOutlined />,
                    label: (
                        <InertiaLink href={"/admin/contests"}>
                            Main List
                        </InertiaLink>
                    ),
                },
                {
                    key: "contests-category-list",
                    icon: <TrophyFilled />,
                    label: (
                        <InertiaLink href={"/admin/contests_category"}>
                            Categories
                        </InertiaLink>
                    ),
                },
                {
                    key: "entries-list",
                    icon: <FileTextOutlined />,
                    label: (
                        <InertiaLink href={"/admin/entries"}>
                            Entries
                        </InertiaLink>
                    ),
                },
                {
                    key: "votes-list",
                    icon: <LikeOutlined />,
                    label: (
                        <InertiaLink href={"/admin/votes"}>Votes</InertiaLink>
                    ),
                },
                {
                    key: "prizes-list",
                    icon: <GiftOutlined />,
                    label: (
                        <InertiaLink href={"/admin/prizes"}>Prizes</InertiaLink>
                    ),
                },
                {
                    key: "reviews-list",
                    icon: <LikeOutlined />,
                    label: (
                        <InertiaLink href={"/admin/reviews"}>
                            Reviews
                        </InertiaLink>
                    ),
                },
                {
                    key: "archived-list",
                    icon: <ThunderboltOutlined />,
                    label: (
                        <InertiaLink href={"/admin/archived"}>
                            Archived
                        </InertiaLink>
                    ),
                },
                {
                    key: "contests-fees-list",
                    icon: <DollarOutlined />,
                    label: (
                        <InertiaLink href={route("admin.contests.fees.index")}>
                            Contest Fees
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "plans",
            icon: <DollarOutlined />,
            label: "Plans",
            children: [
                {
                    key: "plans-list",
                    label: (
                        <InertiaLink href={"/admin/plans"}>
                            Plan List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "subscriptions",
            icon: <DollarOutlined />,
            label: "Subscriptions",
            children: [
                {
                    key: "subscriptions-list",
                    label: (
                        <InertiaLink href={"/admin/subscriptions"}>
                            Sub List
                        </InertiaLink>
                    ),
                },
                {
                    key: "payments-list",
                    label: (
                        <InertiaLink href={"/admin/payments"}>
                            Payments
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "badges",
            icon: <BookOutlined />,
            label: "Badges",
            children: [
                {
                    key: "badges-list",
                    label: (
                        <InertiaLink href={route("admin.badges.index")}>
                            Badge List
                        </InertiaLink>
                    ),
                },
            ],
        },
        {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Settings",
            children: [
                {
                    key: "settings-list",
                    label: (
                        <InertiaLink href={"/admin/settings"}>
                            General
                        </InertiaLink>
                    ),
                },
                {
                    key: "slider-settings",
                    icon: <SlidersOutlined />,
                    label: (
                        <InertiaLink href={"/admin/settings/slider"}>
                            Slider
                        </InertiaLink>
                    ),
                },
                {
                    key: "contact-information",
                    icon: <ControlOutlined />,
                    label: (
                        <InertiaLink href={"/admin/settings/contact-info"}>
                            Contact Info
                        </InertiaLink>
                    ),
                },
                {
                    key: "user-feedback",
                    icon: <CommentOutlined />,
                    label: (
                        <InertiaLink href={"/admin/settings/feedback"}>
                            Feedback
                        </InertiaLink>
                    ),
                },
                {
                    key: "social-links",
                    icon: <ShareAltOutlined />,
                    label: (
                        <InertiaLink href={"/admin/settings/social-links"}>
                            Social Links
                        </InertiaLink>
                    ),
                },
                {
                    key: "optimization",
                    icon: <ThunderboltOutlined />,
                    label: (
                        <InertiaLink href={"/admin/settings/optimization"}>
                            Optimization
                        </InertiaLink>
                    ),
                },
            ],
        },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <SettingOutlined />,
            label: (
                <InertiaLink href={route("admin.profile.edit")}>
                    Profile
                </InertiaLink>
            ),
        },
        { type: "divider" },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Log Out",
            onClick: handleLogout,
            danger: true,
        },
    ];

    const SidebarContent = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
            }}
        >
            {/* LOGO - Stays fixed at the top of the sider */}
            <div
                style={{
                    height: 64,
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    background: "#001529",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <div
                    style={{
                        background: "#1890ff",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <span style={{ color: "white", fontWeight: "bold" }}>
                        M
                    </span>
                </div>
                {!collapsed && (
                    <Text
                        strong
                        style={{
                            color: "#fff",
                            fontSize: "16px",
                            marginLeft: 12,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Muslim Hall
                    </Text>
                )}
            </div>

            {/* MENU - Scrollable area */}
            <div
                style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
                className="custom-scrollbar"
            >
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={handleOpenChange}
                    onClick={handleMenuClick}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                    forceSubMenuRender={false}
                />
            </div>
        </div>
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {!isMobile && (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={260}
                    collapsedWidth={80}
                    style={{
                        position: "fixed",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 1001,
                        height: "100vh",
                        overflow: "hidden",
                    }}
                >
                    <SidebarContent />
                </Sider>
            )}

            <Drawer
                placement="left"
                onClose={() => setMobileDrawerVisible(false)}
                open={mobileDrawerVisible}
                width={260}
                styles={{
                    body: { padding: 0, background: "#001529" },
                    header: { display: "none" },
                }}
                closeIcon={<CloseOutlined style={{ color: "#fff" }} />}
            >
                <SidebarContent />
            </Drawer>

            <Layout
                style={{
                    marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
                    transition: "margin-left 0.2s",
                    background: "#f0f2f5",
                }}
            >
                <Header
                    style={{
                        padding: "0 24px",
                        background: colorBgContainer,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 999,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        height: 64,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Button
                            type="text"
                            icon={
                                collapsed ? (
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
                            style={{
                                fontSize: "16px",
                                width: 48,
                                height: 48,
                                marginRight: 16,
                            }}
                        />
                        <Button
                            icon={<HomeOutlined />}
                            onClick={handleBackToHome}
                            shape={isMobile ? "circle" : "default"}
                        >
                            {!isMobile && "View Site"}
                        </Button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                                    gap: 10,
                                }}
                            >
                                <Badge dot status="processing">
                                    <Avatar
                                        size="large"
                                        src={profilePhotoUrl || undefined}
                                        icon={!profilePhotoUrl ? <UserOutlined /> : null}
                                        style={{ backgroundColor: "#001529" }}
                                    />
                                </Badge>
                                {!isMobile && <Text strong>{user?.name}</Text>}
                            </div>
                        </Dropdown>
                    </div>
                </Header>

                <Content
                    style={{
                        margin: isMobile ? "16px" : "24px",
                        overflow: "initial",
                    }}
                >
                    <div
                        style={{
                            padding: 24,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            minHeight: "calc(100vh - 112px)",
                        }}
                    >
                        {children}
                    </div>
                </Content>
            </Layout>

            <style jsx global>{`
                /* Hide scrollbar tracks for a cleaner look but allow scrolling */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                }

                /* Fix for Inertia links in Ant Design Menu */
                .ant-menu-item a {
                    color: inherit !important;
                    text-decoration: none !important;
                }

                .ant-menu-item-selected a {
                    color: #fff !important;
                }

                .ant-menu-dark .ant-menu-item-selected {
                    background-color: #1890ff !important;
                }

                /* Prevent page jumping */
                html {
                    scroll-behavior: auto;
                }

                /* Ensure smooth transitions */
                .ant-layout {
                    transition: none;
                }
            `}</style>
        </Layout>
    );
}

import React, { useState, useEffect } from "react";
import {
    BellOutlined,
    MessageOutlined,
    FileTextOutlined,
    DeleteOutlined,
    CheckOutlined,
} from "@ant-design/icons";
import {
    Badge,
    Dropdown,
    List,
    Avatar,
    Typography,
    Button,
    Spin,
    Empty,
    Space,
} from "antd";
import { Link, router } from "@inertiajs/react";
import axios from "axios";
import moment from "moment";

const { Text, Title } = Typography;

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth < 480;

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route("notifications.index"));
            setNotifications(response.data.notifications.data);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.post(route("notifications.mark-as-read", id));
            setNotifications(
                notifications.map((n) =>
                    n.id === id ? { ...n, read_at: new Date() } : n,
                ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route("notifications.mark-all-as-read"));
            setNotifications(
                notifications.map((n) => ({ ...n, read_at: new Date() })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(route("notifications.destroy", id));
            setNotifications(notifications.filter((n) => n.id !== id));
            const deleted = notifications.find((n) => n.id === id);
            if (deleted && !deleted.read_at) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
    try {
        if (!notification.read_at) {
            await markAsRead(notification.id);
        }

        setVisible(false);

        if (notification?.data?.link) {
            router.visit(notification.data.link);
        }
    } catch (error) {
        console.error('Notification click error:', error);
    }
};

   const getIcon = (type) => {
    switch (type) {
        case "post":
            return <FileTextOutlined style={{ color: "#1890ff" }} />;
        case "report":
            return <MessageOutlined style={{ color: "#f5222d" }} />;
        case "comment":
            return <MessageOutlined style={{ color: "#52c41a" }} />;
        default:
            return <BellOutlined />;
    }
};

    const dropdownContent = (
        <div
            style={{
                width: isMobile ? windowWidth - 16 : 350,
                background: "#fff",
                boxShadow:
                    "0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
                borderRadius: 8,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Title level={5} className="lg:m-0 ">
                    Notifications
                </Title>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={markAllAsRead}>
                        Mark all as read
                    </Button>
                )}
            </div>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {loading && notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center" }}>
                        <Spin />
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        locale={{
                            emptyText: (
                                <Empty
                                    description="No notifications"
                                    style={{ padding: 20 }}
                                />
                            ),
                        }}
                        renderItem={(item) => (
                            <List.Item
                                onClick={() => handleNotificationClick(item)}
                                style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    transition: "background 0.3s",
                                    background: item.read_at
                                        ? "#fff"
                                        : "#e6f7ff",
                                }}
                                className="notification-item"
                                actions={[
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        onClick={(e) =>
                                            deleteNotification(item.id, e)
                                        }
                                        danger
                                    />,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            icon={getIcon(item.data.type)}
                                            style={{
                                                backgroundColor: "#f5f5f5",
                                            }}
                                        />
                                    }
                                   title={
    <Space
        direction="vertical"
        size={0}
        style={{ width: "100%" }}
    >
        <Text strong>{item.data.message}</Text>

        {item.data.comment_text && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
                {item.data.comment_text}
            </Text>
        )}

        <Text
            type="secondary"
            size="small"
            style={{ fontSize: "12px" }}
        >
            {moment(item.created_at).fromNow()}
        </Text>
    </Space>
}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
        </div>
    );

    return (
        <Dropdown
            overlay={dropdownContent}
            trigger={["click"]}
            open={visible}
            onOpenChange={setVisible}
            placement={isMobile ? "bottomCenter" : "bottomRight"}
        >
            <div
                style={{
                    cursor: "pointer",
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Badge
                    count={unreadCount}
                    overflowCount={99}
                    size="small"
                    offset={[2, 0]}
                >
                    <BellOutlined style={{ fontSize: "20px" }} />
                </Badge>
            </div>
        </Dropdown>
    );
}

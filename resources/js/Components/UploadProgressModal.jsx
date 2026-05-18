import React from "react";
import { Modal, Progress, Typography, Space } from "antd";
import {
    CheckCircleOutlined,
    CloudUploadOutlined,
    LoadingOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

/**
 * UploadProgressModal
 *
 * Props:
 *  - open       : boolean  — show/hide
 *  - percent    : number   — 0-100 (upload progress)
 *  - done       : boolean  — upload finished (shows success state)
 *  - fileName   : string   — name of the file being uploaded
 *  - onClose    : fn       — called when user closes the success modal
 */
export default function UploadProgressModal({
    open = false,
    percent = 0,
    done = false,
    fileName = "",
    onClose,
}) {
    return (
        <Modal
            open={open}
            footer={null}
            closable={done}
            onCancel={done ? onClose : undefined}
            maskClosable={false}
            centered
            width={420}
            styles={{
                content: {
                    borderRadius: 16,
                    padding: "40px 32px",
                },
            }}
        >
            <div className="flex flex-col items-center text-center gap-6">
                {!done ? (
                    <>
                        {/* Uploading state */}
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 24px rgba(102,126,234,0.4)",
                            }}
                        >
                            <CloudUploadOutlined
                                style={{ fontSize: 32, color: "#fff" }}
                            />
                        </div>

                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                Uploading File...
                            </Title>
                            {fileName && (
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 13,
                                        display: "block",
                                        marginTop: 4,
                                        wordBreak: "break-all",
                                    }}
                                >
                                    {fileName}
                                </Text>
                            )}
                        </div>

                        <Progress
                            percent={Math.round(percent)}
                            status="active"
                            strokeColor={{
                                "0%": "#667eea",
                                "100%": "#764ba2",
                            }}
                            style={{ width: "100%" }}
                        />

                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {percent < 100
                                ? "Please wait while your file is being uploaded..."
                                : "File received! Processing on server..."}
                        </Text>

                        <Text
                            style={{
                                fontSize: 12,
                                color: "#faad14",
                                fontWeight: 500,
                            }}
                        >
                            ⚠️ Do not close this browser tab
                        </Text>
                    </>
                ) : (
                    <>
                        {/* Success state */}
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 24px rgba(82,196,26,0.4)",
                            }}
                        >
                            <CheckCircleOutlined
                                style={{ fontSize: 32, color: "#fff" }}
                            />
                        </div>

                        <div>
                            <Title level={4} style={{ margin: 0, color: "#52c41a" }}>
                                ✅ Submission Uploaded Successfully!
                            </Title>
                            <Text
                                type="secondary"
                                style={{ display: "block", marginTop: 8, fontSize: 14 }}
                            >
                                Your submission has been received. Large media files
                                (video/audio/pdf) are being processed in the background.
                                Your content is saved and will be fully available shortly.
                            </Text>
                        </div>

                        <div
                            style={{
                                background: "#f6ffed",
                                border: "1px solid #b7eb8f",
                                borderRadius: 8,
                                padding: "12px 16px",
                                width: "100%",
                                textAlign: "left",
                            }}
                        >
                            <Space direction="vertical" size={4}>
                                <Text style={{ fontSize: 13 }}>
                                    <LoadingOutlined
                                        spin
                                        style={{ color: "#52c41a", marginRight: 6 }}
                                    />
                                    Background upload in progress...
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    You can safely navigate away. The file will be
                                    available once processing completes.
                                </Text>
                            </Space>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: "100%",
                                padding: "10px 0",
                                borderRadius: 8,
                                background:
                                    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 15,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Got it, Continue
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
}

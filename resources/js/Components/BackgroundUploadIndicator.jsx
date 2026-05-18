import React, { useState, useEffect } from 'react';
import { useBackgroundUpload } from '../Contexts/BackgroundUploadContext';
import { Dropdown, Menu, Progress, Typography, Button, Tooltip } from 'antd';
import {
    CloudUploadOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const BackgroundUploadIndicator = () => {
    const { uploads } = useBackgroundUpload();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth || 1024);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 480;

    // All uploads that are still in progress (not completed / not error)
    const activeUploads = uploads.filter(u => u.status === 'uploading');
    const hasActive     = activeUploads.length > 0;

    if (uploads.length === 0) return null;

    /**
     * Determine the icon shown on the upload row based on phase/status.
     */
    const getRowIcon = (upload) => {
        if (upload.status === 'completed') {
            return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />;
        }
        if (upload.status === 'error') {
            return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />;
        }
        // uploading phase
        if (upload.phase === 'processing') {
            return (
                <Tooltip title="Server is processing your file…">
                    <SyncOutlined spin style={{ color: '#1890ff', fontSize: 14 }} />
                </Tooltip>
            );
        }
        return <LoadingOutlined spin style={{ color: '#1890ff', fontSize: 14 }} />;
    };

    /**
     * Label shown below file name: e.g. "Uploading chunks… 42%"
     *                                   "Server processing… 67%"
     *                                   "Complete"
     */
    const getPhaseLabel = (upload) => {
        if (upload.status === 'completed') return 'Complete';
        if (upload.status === 'error')     return 'Failed';
        if (upload.phase === 'processing') {
            return `Server processing… ${upload.progress}%`;
        }
        return `Uploading… ${upload.progress}%`;
    };

    /**
     * Progress bar status for antd Progress component.
     */
    const getProgressStatus = (upload) => {
        if (upload.status === 'error')     return 'exception';
        if (upload.status === 'completed') return 'success';
        return 'active';
    };

    /**
     * The cloud icon in the navbar.
     * - While ANY upload is active: animated spinner effect (pulsing blue icon, no number badge)
     * - When all done: plain icon, no badge
     */
    const navbarIcon = (
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            {hasActive ? (
                /* Animated upload icon — no count badge */
                <span
                    style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        position:       'relative',
                    }}
                >
                    <CloudUploadOutlined
                        style={{
                            fontSize:  22,
                            color:     '#1890ff',
                            animation: 'pulse-upload 1.4s ease-in-out infinite',
                        }}
                    />
                    {/* Small spinning dot to indicate activity */}
                    <LoadingOutlined
                        style={{
                            fontSize: 10,
                            color:    '#1890ff',
                            position: 'absolute',
                            top:      -4,
                            right:    -6,
                        }}
                    />
                </span>
            ) : (
                <CloudUploadOutlined style={{ fontSize: 22, color: 'inherit' }} />
            )}
        </div>
    );

    const menu = (
        <Menu style={{ width: isMobile ? windowWidth - 32 : 320, padding: '8px 0' }}>
            <Menu.Item key="title" disabled style={{ cursor: 'default', padding: '4px 16px' }}>
                <Text strong style={{ fontSize: 13 }}>Uploads & Processing</Text>
            </Menu.Item>
            <Menu.Divider />

            {uploads.map((upload) => (
                <Menu.Item key={upload.id} disabled style={{ cursor: 'default', padding: '10px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* File name row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <Text
                                ellipsis
                                style={{ maxWidth: isMobile ? windowWidth - 120 : 240, fontSize: 12, fontWeight: 500 }}
                                title={upload.file?.name}
                            >
                                {upload.file?.name}
                            </Text>
                            {getRowIcon(upload)}
                        </div>

                        {/* Phase label */}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {getPhaseLabel(upload)}
                        </Text>

                        {/* Progress bar — shows % at all times, no empty bar */}
                        <Progress
                            percent={upload.progress}
                            size="small"
                            status={getProgressStatus(upload)}
                            showInfo={upload.status !== 'uploading'}
                        />
                    </div>
                </Menu.Item>
            ))}

            {uploads.length > 5 && (
                <Menu.Item key="more" disabled style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>
                    Showing latest 5 uploads
                </Menu.Item>
            )}
        </Menu>
    );

    return (
        <>
            {/* Inline keyframe for pulsing icon — injected once */}
            <style>{`
                @keyframes pulse-upload {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.6; transform: scale(1.1); }
                }
            `}</style>

            <Dropdown
                menu={{ items: [] }}
                dropdownRender={() => menu}
                trigger={['click']}
                placement={isMobile ? 'bottomCenter' : 'bottomRight'}
            >
                {navbarIcon}
            </Dropdown>
        </>
    );
};

export default BackgroundUploadIndicator;

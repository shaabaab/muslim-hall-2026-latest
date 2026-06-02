import React, { useMemo, useRef } from "react";
import { Tag, Button, message } from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    UploadOutlined,
    VideoCameraOutlined,
    FilePdfOutlined,
    AudioOutlined,
} from "@ant-design/icons";
import { buildS3UrlAlways } from "@/Utils/s3Helpers";

const MultipleMediaUpload = ({
    files = [],
    onAdd,
    onRemove,
    onUpdate,
    existingFiles = [],
    type = "video", // video, pdf, or audio
    max = null,
}) => {
    const itemsToShow = useMemo(() => {
        return (files || []).map((item, idx) => {
            // If it's already a formatted object from parent state
            if (item && typeof item === 'object' && !(item instanceof File)) {
                let existingName = item.name || `Existing ${type}`;
                if (item[type] && typeof item[type] === 'string') {
                    existingName = item[type].split("/").pop();
                } else if (item.file && item.file.name) {
                    existingName = item.file.name;
                }
                
                let previewUrl = item.url;
                if (!previewUrl) {
                    if (item.file) {
                        previewUrl = URL.createObjectURL(item.file);
                    } else if (item[type]) {
                        previewUrl = buildS3UrlAlways(item[type]);
                    }
                }

                return {
                    ...item,
                    id: item.id || `item-${idx}`,
                    name: existingName,
                    url: previewUrl,
                    isExisting: item.isExisting !== undefined ? item.isExisting : true,
                    originalItem: item
                };
            }

            // Fallback for raw File objects
            const uid = item.uid || `new-${idx}-${Math.random().toString(36).substr(2, 9)}`;
            return {
                id: uid,
                file: item,
                name: item?.name || `${type} ${idx + 1}`,
                url: (item instanceof File) ? URL.createObjectURL(item) : null,
                isExisting: false,
                originalItem: item
            };
        });
    }, [files, type]);

    const addInputRef = useRef(null);
    const replaceInputRefs = useRef({});

    const canAddMore = max == null ? true : itemsToShow.length < max;
    const accept = type === "video" ? "video/*" : (type === "audio" ? "audio/*" : "application/pdf");
    const Icon = type === "video" ? VideoCameraOutlined : (type === "audio" ? AudioOutlined : FilePdfOutlined);

    const handleAddSelect = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        e.target.value = "";
        if (!selectedFiles.length) return;

        let allowed = selectedFiles;
        if (max != null) {
            const remain = max - itemsToShow.length;
            if (remain <= 0) return message.error(`Max ${max} items allowed`);
            allowed = selectedFiles.slice(0, remain);
        }

        if (allowed.length > 0) {
            // ✅ Send files ONE BY ONE to maintain compatibility with legacy handlers
            allowed.forEach(file => {
                onAdd?.(file);
            });
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 capitalize">
                        {type}s
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        {max == null ? `Add multiple ${type}s.` : (max === 1 ? `Upload a ${type}.` : `Add multiple ${type}s (Max ${max}).`)}
                    </p>
                </div>
                <Tag color="blue">{itemsToShow.length} Selected</Tag>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {itemsToShow.map((item, index) => {
                    const name = item.name || item.file?.name || `${type} ${index + 1}`;
                    const isImage = item.file?.type?.startsWith("image/") || (item.url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.url));

                    return (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-300 transition-all group relative flex flex-col">
                            {/* Preview Area */}
                            <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
                                {isImage ? (
                                    <img src={item.url} alt={name} className="w-full h-full object-cover" />
                                ) : type === "video" && item.url ? (
                                    <video src={item.url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Icon style={{ fontSize: '32px' }} />
                                    </div>
                                )}
                                
                                {/* Hover Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button
                                        size="small"
                                        shape="circle"
                                        icon={<UploadOutlined />}
                                        onClick={() => replaceInputRefs.current[index]?.click()}
                                        title="Replace"
                                    />
                                    <Button
                                        size="small"
                                        shape="circle"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            // Standardized signature: (type, index, id, isExisting)
                                            onRemove?.(type, index, item.id, item.isExisting);
                                        }}
                                        title="Delete"
                                    />
                                </div>
                            </div>

                            {/* Info Area */}
                            <div className="p-3">
                                <p className="text-sm font-medium truncate mb-1" title={name}>{name}</p>
                                <div className="flex justify-between items-center">
                                    <Tag color={item.isExisting ? "default" : "green"} className="text-[10px] m-0">
                                        {item.isExisting ? "SERVER" : "NEW"}
                                    </Tag>
                                </div>
                            </div>

                            <input
                                ref={(el) => (replaceInputRefs.current[index] = el)}
                                type="file"
                                hidden
                                accept={accept}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = "";
                                    if (file) {
                                        // Standardized signature: (type, index, file, id, isExisting)
                                        onUpdate?.(type, index, file, item.id, item.isExisting);
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                    canAddMore ? "border-gray-300 hover:border-blue-500 hover:bg-blue-50 focus:outline-none" : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canAddMore && addInputRef.current?.click()}
            >
                <PlusOutlined className="text-2xl text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700">Add {type}</p>
                <p className="text-xs text-gray-500 mt-1">Select one or multiple files</p>
                <input ref={addInputRef} type="file" hidden accept={accept} multiple={max !== 1} onChange={handleAddSelect} />
            </div>
        </div>
    );
};

export default MultipleMediaUpload;

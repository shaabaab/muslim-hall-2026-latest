import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Card } from "antd";
import { useState } from "react";

const PostInfoDropdown = ({ title, items }) => {
    const [open, setOpen] = useState(false);

    return (
        <Card className="rounded-xl shadow-sm overflow-hidden">
            <div
                className="info-header flex justify-between items-center cursor-pointer "
                onClick={() => setOpen(!open)}
            >
                <span className="text-sm font-semibold text-gray-900">
                    {title}
                </span>
                {open ? (
                    <UpOutlined className="text-gray-700 text-sm" />
                ) : (
                    <DownOutlined className="text-gray-700 text-sm" />
                )}
            </div>

            <div
                className={`info-list overflow-hidden transition-all duration-300 ${
                    open ? "max-h-[400px] px-3 pb-3" : "max-h-0 px-3"
                }`}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="info-item flex items-center gap-2 py-2 border-b last:border-b-0"
                    >
                        <div className="icon-box w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 text-sm">
                            {item.icon}
                        </div>
                        <div className="info-text">
                            <div className="label text-[11px] text-gray-500 text-left">
                                {item.label}
                            </div>
                            <div className="value text-sm font-medium text-gray-900">
                                {item.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default PostInfoDropdown;

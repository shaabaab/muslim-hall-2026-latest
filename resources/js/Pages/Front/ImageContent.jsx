import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ImageContent = ({ post }) => {
    const images = post?.images || [];
    const hasMultipleSlides = images.length > 1;

    if (!images.length && !post?.thumbnail) return null;

    // Inline styles
    const styles = {
        wrapper: {
            position: "relative",
            width: "100%",
            marginTop: "1rem",
        },
        btn: {
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
            cursor: "pointer",
            transition: "transform .2s ease, background .2s ease",
        },
        btnHover: {
            transform: "translateY(-50%) scale(1.05)",
            background: "rgba(255,255,255,1)",
        },
        img: {
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: 8,
            maxHeight: "800px",
            margin: "0 auto",
            display: "block",
        },
    };

    return (
        <div style={styles.wrapper} className="mb-4">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                navigation={
                    hasMultipleSlides
                        ? {
                              nextEl: ".custom-next",
                              prevEl: ".custom-prev",
                          }
                        : false
                }
                pagination={hasMultipleSlides ? { clickable: true } : false}
                autoplay={false}
                loop={hasMultipleSlides}
                slidesPerView={1}
                spaceBetween={20}
                autoHeight={true}
                style={{ width: "100%" }}
            >
                {images.length > 0 ? (
                    images.map((image, index) => (
                        <SwiperSlide key={index}>
                            <img
                                className="w-full h-auto object-contain"
                                src={getS3PublicUrl(image.image)}
                                alt={post.title}
                                style={styles.img}
                            />
                        </SwiperSlide>
                    ))
                ) : (
                    <SwiperSlide>
                        <img
                            className="w-full h-auto object-contain"
                            src={getS3PublicUrl(post.thumbnail)}
                            alt={post.title}
                            style={styles.img}
                        />
                    </SwiperSlide>
                )}
            </Swiper>

            {/* Prev Button */}
            {hasMultipleSlides && (
                <button
                    className="custom-prev"
                    style={styles.btn}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                            styles.btnHover.transform;
                        e.currentTarget.style.background =
                            styles.btnHover.background;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = styles.btn.transform;
                        e.currentTarget.style.background =
                            styles.btn.background;
                    }}
                >
                    <LeftOutlined />
                </button>
            )}

            {/* Next Button */}
            {hasMultipleSlides && (
                <button
                    className="custom-next"
                    style={{ ...styles.btn, right: 10 }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                            styles.btnHover.transform;
                        e.currentTarget.style.background =
                            styles.btnHover.background;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = styles.btn.transform;
                        e.currentTarget.style.background =
                            styles.btn.background;
                    }}
                >
                    <RightOutlined />
                </button>
            )}
        </div>
    );
};

export default ImageContent;

import { Link, usePage } from "@inertiajs/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Footer from "./Footer";
import Header from "./Header";
import FrontAuthenticatedLayout from '@/Layouts/FrontEndLayout';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Category() {
    const { category } = usePage().props;

    const swiperBreakpoints = {
        320: {
            slidesPerView: 1,
            spaceBetween: 10
        },
        480: {
            slidesPerView: 2,
            spaceBetween: 15
        },
        768: {
            slidesPerView: 3,
            spaceBetween: 20
        },
        1024: {
            slidesPerView: 4,
            spaceBetween: 25
        },
        1200: {
            slidesPerView: 5,
            spaceBetween: 30
        },
        1400: {
            slidesPerView: 6,
            spaceBetween: 30
        }
    };

    return (
        <FrontAuthenticatedLayout>
            <Header/>

            {/* Categories Slider Section */}
            <section className="container-md">
                <div className="quick-links-section">

                    <Swiper
                        modules={[Navigation]}
                        navigation
                        spaceBetween={30}
                        breakpoints={swiperBreakpoints}
                        className="categories-swiper"
                    >
                        {category && category.length > 0 ? (
                            category.map((c) => (
                                <SwiperSlide key={c.id}>
                                    <div className="quick-link-card">
                                        <Link href={`/category-single/${c.slug}`} className="quick-link-content">
                                            <div className="quick-link-icon">
                                                <img
                                                    src={`${window.location.origin}/storage/${c.img}`}
                                                    alt={c.name}
                                                    onError={(e) => {
                                                        e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="quick-link-label">{c.name}</div>
                                        </Link>
                                    </div>
                                </SwiperSlide>
                            ))
                        ) : (
                            <SwiperSlide>
                                <div className="no-categories">
                                    <p>No categories found.</p>
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>
            </section>


            <Footer/>

            <style jsx>{`
                /* Hero Swiper Styles */
                .hero-swiper {
                    width: 100%;
                    border-radius: 20px;
                    overflow: hidden;
                    // margin: 2rem auto;
                    // box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }
                .swiper-button-next,.swiper-button-prev{
                    display:none
                }
                .swiper-pagination-bullet-active{
                    background:white !important
                }

                .hero-pagination{
                    display:none;
                }

                /* Hero Section Styles - EXACT SAME DESIGN */
                .hero-section {
                    border-radius: 20px;
                    padding: 4rem 2rem;
                    // margin: 0 auto;
                     width: 100% !important;
                    color: white;
                    min-height: 500px;
                    display: flex;
                    align-items: center;
                    background: linear-gradient(135deg, rgba(20, 108, 32, 0.9) 0%, rgba(46, 139, 87, 0.9) 100%),
                        url('https://i.postimg.cc/wx0LVLsG/footer-decor-full.png');
                    background-size: cover;
                    background-position: center;
                }

                .hero-section .swiper-slide{
                    width: 100% !important;
                }

                .hero-content {
                    flex: 1;
                    padding-right: 2rem;
                }

                .hero-title {
                    font-size: 45px;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    line-height: 1.2;
                }

                .hero-text {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 2rem;
                    opacity: 0.95;
                    max-width: 600px;
                }

                .hero-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn-more-info {
                    background-color: white;
                    color: #1b7a3a;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 50px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-block;
                    text-decoration: none;
                }

                .btn-more-info:hover {
                    background-color: #f0f0f0;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    text-decoration: none;
                    color: #1b7a3a;
                }

                .btn-more-info.varient-2 {
                    background-color: transparent;
                    color: white;
                    border: 2px solid white;
                }

                .btn-more-info.varient-2:hover {
                    background-color: white;
                    color: #1b7a3a;
                }

                .hero-image {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .hero-image img {
                    max-width: 100%;
                    object-fit: cover;
                    border-radius: 10px;
                    // border: 1px solid gold;
                    // box-shadow: 0px 0px 8px black;
                }

                :global(.hero-swiper .swiper-pagination-bullet) {
                    width: 12px;
                    height: 12px;
                    background: #ccc;
                    opacity: 0.7;
                    margin: 0 5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                :global(.hero-swiper .swiper-pagination-bullet-active) {
                    background: #1b7a3a;
                    opacity: 1;
                    transform: scale(1.2);
                }

                /* Swiper Navigation Customization for Hero */
                :global(.hero-swiper .swiper-button-next),
                :global(.hero-swiper .swiper-button-prev) {
                    color: white;
                    background: rgba(27, 122, 58, 0.8);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }

                :global(.hero-swiper .swiper-button-next:after),
                :global(.hero-swiper .swiper-button-prev:after) {
                    font-size: 20px;
                    font-weight: bold;
                }

                :global(.hero-swiper .swiper-button-next:hover),
                :global(.hero-swiper .swiper-button-prev:hover) {
                    background: #1b7a3a;
                    color: white;
                }

                /* Rest of your existing styles remain exactly the same */
                /* Quick Links Section Styles */
                .quick-links-section {
                    padding: 80px 0;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                .quick-links-title {
                    font-size: 32px;
                    font-weight: 700;
                    line-height: 1.2;
                    color: #1b7a3a;
                    margin: 0;
                }

                .view-all-btn {
                    background: linear-gradient(135deg, #1b7a3a 0%, #2e8b57 100%);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }

                .view-all-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(27, 122, 58, 0.3);
                    color: white;
                    text-decoration: none;
                }

                .view-all-btn svg {
                    transition: transform 0.3s ease;
                }

                .view-all-btn:hover svg {
                    transform: translateX(3px);
                }

                /* Categories Swiper */
                .categories-swiper {
                    padding: 10px 5px 30px;
                }

                .quick-link-card {
                    border: 2px solid #e0e0e0;
                    border-radius: 15px;
                    padding: 0;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    background: white;
                    overflow: hidden;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .quick-link-card:hover {
                    border-color: #1b7a3a;
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(27, 122, 58, 0.15);
                }

                .quick-link-content {
                    text-decoration: none;
                    color: inherit;
                    display: block;
                    padding: 8px 20px 0 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .quick-link-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    transition: all 0.3s ease;
                    overflow: hidden;
                }

                .quick-link-card:hover .quick-link-icon {
                    border-color: #1b7a3a;
                    background: rgba(27, 122, 58, 0.05);
                    transform: scale(1.1);
                }

                .quick-link-icon img {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                    transition: transform 0.3s ease;
                }

                .quick-link-card:hover .quick-link-icon img {
                    transform: scale(1.1);
                }

                .quick-link-label {
                    font-size: 16px;
                    font-weight: 700;
                    color: #333;
                    line-height: 1.4;
                    transition: color 0.3s ease;
                    margin-bottom: 15px;
                }

                .quick-link-card:hover .quick-link-label {
                    color: #1b7a3a;
                }

                .no-categories {
                    text-align: center;
                    padding: 40px;
                    grid-column: 1 / -1;
                }

                .no-categories p {
                    color: #666;
                    font-size: 18px;
                    font-style: italic;
                    margin: 0;
                }

                /* Content Sections */
                .content-section {
                    padding: 80px 0;
                }

                .bg-light {
                    background-color: #f9f9f9;
                }

                .section-title {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1b7a3a;
                    margin: 0;
                }

                /* Content Swiper */
                .content-swiper {
                    padding: 10px 5px 40px;
                }

                .content-card {
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .content-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                }

                .card-image {
                    height: 200px;
                    overflow: hidden;
                }

                .card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .content-card:hover .card-image img {
                    transform: scale(1.05);
                }

                .card-content {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .card-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 10px;
                    color: #333;
                    line-height: 1.4;
                }

                .card-title a {
                    color: inherit;
                    text-decoration: none;
                }

                .card-title a:hover {
                    color: #1b7a3a;
                }

                .card-description {
                    font-size: 14px;
                    color: #666;
                    line-height: 1.5;
                    margin: 0;
                    flex: 1;
                }

                .no-content {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 40px;
                }

                /* Swiper Navigation Customization for other sections */
                :global(.categories-swiper .swiper-button-next),
                :global(.categories-swiper .swiper-button-prev),
                :global(.content-swiper .swiper-button-next),
                :global(.content-swiper .swiper-button-prev) {
                    color: #1b7a3a;
                    background: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                :global(.categories-swiper .swiper-button-next:after),
                :global(.categories-swiper .swiper-button-prev:after),
                :global(.content-swiper .swiper-button-next:after),
                :global(.content-swiper .swiper-button-prev:after) {
                    font-size: 18px;
                    font-weight: bold;
                }

                :global(.categories-swiper .swiper-button-next:hover),
                :global(.categories-swiper .swiper-button-prev:hover),
                :global(.content-swiper .swiper-button-next:hover),
                :global(.content-swiper .swiper-button-prev:hover) {
                    background: #1b7a3a;
                    color: white;
                }

                /* Responsive Design */
                @media (max-width: 1200px) {
                    .section-header {
                        flex-direction: column;
                        gap: 20px;
                        text-align: center;
                    }
                    
                    .quick-links-title {
                        font-size: 28px;
                    }
                }

                @media (max-width: 992px) {
                    .hero-section {
                        flex-direction: column;
                        text-align: center;
                        padding: 3rem 1.5rem;
                    }

                    .hero-content {
                        padding-right: 0;
                        margin-bottom: 2rem;
                    }

                    .hero-title {
                        font-size: 2.5rem;
                    }
                }

                @media (max-width: 768px) {
                    .quick-links-section {
                        padding: 60px 0;
                    }
                    
                    .content-section {
                        padding: 60px 0;
                    }
                    
                    .quick-link-content {
                        padding: 25px 15px;
                    }
                    
                    .quick-link-icon {
                        width: 70px;
                        height: 70px;
                        margin-bottom: 15px;
                    }
                    
                    .quick-link-icon img {
                        width: 40px;
                        height: 40px;
                    }
                    
                    .quick-link-label {
                        font-size: 15px;
                    }
                    
                    .hero-title {
                        font-size: 2rem;
                    }

                    .hero-text {
                        font-size: 1rem;
                    }

                    .hero-actions {
                        justify-content: center;
                    }

                    :global(.hero-swiper .swiper-button-next),
                    :global(.hero-swiper .swiper-button-prev) {
                        display: none;
                    }
                }

                @media (max-width: 576px) {
                    .quick-links-section {
                        padding: 40px 0;
                    }
                    
                    .content-section {
                        padding: 40px 0;
                    }
                    
                    .quick-links-title {
                        font-size: 24px;
                    }
                    
                    .section-title {
                        font-size: 24px;
                    }
                    
                    .view-all-btn {
                        padding: 10px 20px;
                        font-size: 13px;
                    }
                    
                    .hero-title {
                        font-size: 1.8rem;
                    }
                    
                    .hero-text {
                        font-size: 0.9rem;
                    }
                    
                    .btn-more-info {
                        padding: 0.6rem 1.5rem;
                        font-size: 0.9rem;
                    }
                }

                @media (max-width: 480px) {
                    .quick-link-content {
                        padding: 20px 15px;
                    }
                    
                    .quick-link-icon {
                        width: 60px;
                        height: 60px;
                        margin-bottom: 12px;
                    }
                    
                    .quick-link-icon img {
                        width: 35px;
                        height: 35px;
                    }
                    
                    .quick-link-label {
                        font-size: 14px;
                    }
                    
                    .card-content {
                        padding: 15px;
                    }
                    
                    .card-title {
                        font-size: 16px;
                    }
                    
                    .card-description {
                        font-size: 13px;
                    }
                }
            `}</style>
        </FrontAuthenticatedLayout>
    );
}
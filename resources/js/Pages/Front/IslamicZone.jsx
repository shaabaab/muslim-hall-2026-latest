import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import Header from './Header';
import Footer from './Footer';

export default function IslamicZone({ quran, hadith, islamicContent, books, currentSort = 'latest' }) {
    
    // Handle Filter selection
    const handleSortChange = (e) => {
        router.get('/islamic-zone', { sort: e.target.value }, { preserveState: true, replace: true, preserveScroll: true });
    };

    // Generic render row function
    const renderSection = (title, items, type, viewAllLink) => {
        return (
            <div className="islamic-zone-section mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="section-title mb-0">{title}</h3>
                    <Link href={viewAllLink} className="view-all-link">View All <i className="fas fa-arrow-right ml-1"></i></Link>
                </div>
                <div className="row">
                    {items && items.length > 0 ? items.map((item, idx) => (
                        <div key={idx} className="col-md-4 mb-4">
                            <Link href={type === 'book' ? `/book-detail/${item.id}` : `/islamic-detail/${item.id}`} className="card h-100 text-decoration-none text-dark">
                                <div className="card-img-top relative" style={{ height: '200px', overflow: 'hidden' }}>
                                    {type === 'book' ? (
                                        <img 
                                            src={item.photo ? getS3PublicUrl(item.photo) : 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'} 
                                            alt={item.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                            onError={(e) => { e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'; }}
                                        />
                                    ) : (
                                        <img 
                                            src={item.image ? getS3PublicUrl(item.image) : 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'} 
                                            alt={item.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                            onError={(e) => { e.target.src = 'https://i.ibb.co.com/7xnc8z33/Chat-GPT-Image-Jan-11-2026-02-55-52-PM-removebg-preview.png'; }}
                                        />
                                    )}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title text-truncate">{item.title}</h5>
                                </div>
                            </Link>
                        </div>
                    )) : (
                        <div className="col-12">
                            <p className="text-muted">No content available.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
        <Header />
        <div className="islamic-zone-page py-5" style={{ minHeight: '80vh', backgroundColor: '#f9f9f9',}}>
            <Head title="Islamic Zone" />
            
            <div className="container">
                <div className="row mb-5 align-items-center">
                    <div className="col-md-6 text-left text-md-left">
                        <h2 className="font-weight-bold" style={{ color: '#1b7a3a', fontSize: '2rem' }}>Islamic Zone</h2>
                    </div>
                    <div className="col-md-6 text-center text-md-right mt-3 mt-md-0 d-flex justify-content-md-end justify-content-center">
                        <div className="filter-wrapper d-flex align-items-center">
                            <label className="mr-2 font-weight-bold text-dark">Filter By:</label>
                            <select 
                                className="form-control" 
                                style={{ width: '200px', backgroundColor: '#fff', color: '#000', cursor: 'pointer', border: '1px solid #ced4da' }}
                                value={currentSort}
                                onChange={handleSortChange}
                            >
                                <option value="latest" style={{ color: '#000', backgroundColor: '#fff' }}>Latest</option>
                                <option value="popular" style={{ color: '#000', backgroundColor: '#fff' }}>Most Popular</option>
                            </select>
                        </div>
                    </div>
                </div>

                {renderSection('Quran', quran, 'islamic', '/islamic/quran')}
                {renderSection('Hadith', hadith, 'islamic', '/islamic/hadith')}
                {renderSection('Islamic Content', islamicContent, 'islamic', '/islamic-details')}
                {renderSection('Books', books, 'book', '/book-details')}
                
            </div>

            <style jsx>{`
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #333;
                }
                .view-all-link {
                    color: #1b7a3a;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .view-all-link:hover {
                    color: #125c2a;
                    text-decoration: underline;
                }
                .card {
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: none;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
        <Footer />
        </>
    );
}

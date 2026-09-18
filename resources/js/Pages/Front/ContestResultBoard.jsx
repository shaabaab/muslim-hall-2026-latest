import { Head, Link, usePage } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { useState } from "react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// Temporary preview of the contest result board. The winners below are sample
// rows; wire them to real contest data when the feature lands.
const WINNERS = [
    {
        place: 1,
        name: "Nusrat Jahan Mim",
        email: "nusrat.mim@example.com",
        prize: "৳15,000",
        note: "Champion",
    },
    {
        place: 2,
        name: "Mohammad Ridwan Kabir",
        email: "ridwan.kabir@example.com",
        prize: "৳10,000",
        note: "Runner-up",
    },
    {
        place: 3,
        name: "Ayesha Siddiqua",
        email: "ayesha.s@example.com",
        prize: "৳7,000",
        note: "Third place",
    },
    {
        name: "Tanvir Hasan Rafi",
        email: "tanvir.rafi@example.com",
        prize: "৳3,000",
        note: "Merit",
    },
    {
        name: "Sadia Afrin Nova",
        email: "sadia.nova@example.com",
        prize: "৳3,000",
        note: "Merit",
    },
    {
        name: "Imran Chowdhury",
        email: "imran.ch@example.com",
        prize: "৳3,000",
        note: "Merit",
    },
    {
        name: "Farhana Yasmin",
        email: "farhana.y@example.com",
        prize: "Certificate",
        note: "Finalist",
    },
    {
        name: "Abdullah Al Mamun",
        email: "mamun.abdullah@example.com",
        prize: "Certificate",
        note: "Finalist",
    },
    {
        name: "Rubaiya Islam Tisha",
        email: "rubaiya.tisha@example.com",
        prize: "Certificate",
        note: "Finalist",
    },
    {
        name: "Shahriar Alam Niloy",
        email: "shahriar.niloy@example.com",
        prize: "Certificate",
        note: "Finalist",
    },
];

const FALLBACK_LOGO = "/assets/images/logo3.png";

export default function ContestResultBoard() {
    const { header, advertisement = [] } = usePage().props;

    // The admin-configured logo wins; the packaged mark is the fallback.
    const [logoSrc, setLogoSrc] = useState(
        header?.header_logo
            ? getS3PublicUrl(header.header_logo)
            : FALLBACK_LOGO,
    );

    const approvedHeaderAds = advertisement.filter(
        (ad) =>
            (ad.type === "banner" || ad.type === "video_ad") &&
            ad.status === "approved" &&
            ad.is_active == 1 &&
            ad.position === "header",
    );

    // One sponsor is shown. Picking it by index (.slice(2, 3)) only worked
    // locally: production has one fewer approved header ad, so there was no
    // third entry and the slot rendered empty. Prefer the first banner that
    // actually carries artwork, and fall back to whatever is approved.
    const bannerAds = approvedHeaderAds.filter(
        (ad) => ad.type === "banner" && ad.image,
    );

    const headerAds = (bannerAds.length ? bannerAds : approvedHeaderAds).slice(
        0,
        1,
    );

    return (
        <>
            <Head>
                <title>Calligraphy Contest Results — Muslim Hall</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Karla:wght@400;500;600&family=Noto+Serif+Bengali:wght@400;600&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="result-page">
                <main className="board">
                    <header className="crown">
                        <div className="hall-logo">
                            <img
                                src={logoSrc}
                                alt="Muslim Hall"
                                onError={() => setLogoSrc(FALLBACK_LOGO)}
                            />
                        </div>

                        <p className="hall">Muslim Hall</p>

                        <div className="sponsor">
                            <p className="sponsor-title">Sponsored by</p>

                            <div className="">
                                {headerAds.length > 0 && (
                                    <div className="sponsor-ad">
                                        <Swiper
                                            modules={[Autoplay, Pagination]}
                                            slidesPerView={1}
                                            autoplay={{ delay: 5000 }}
                                            pagination={{ clickable: true }}
                                            loop={headerAds.length > 1}
                                            // the crown's width settles after
                                            // the webfonts land, so let Swiper
                                            // re-measure instead of keeping
                                            // the widths it read on mount
                                            observer={true}
                                            observeParents={true}
                                            className="header-ad-swiper"
                                        >
                                            {headerAds.map((ad) => (
                                                <SwiperSlide key={ad.id}>
                                                    <div className="header-ad-container">
                                                        <a
                                                            href={ad.target_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="header-ad-link"
                                                        >
                                                            {ad.type ===
                                                            "video_ad" ? (
                                                                <div className="header-ad-video-container">
                                                                    {ad.video ? (
                                                                        <video
                                                                            src={getS3PublicUrl(
                                                                                ad.video,
                                                                            )}
                                                                            className="header-ad-video"
                                                                            controls={
                                                                                false
                                                                            }
                                                                            autoPlay
                                                                            muted
                                                                            loop
                                                                            playsInline
                                                                        />
                                                                    ) : ad.video_url ? (
                                                                        <div className="video-ad-iframe-wrapper">
                                                                            <iframe
                                                                                src={
                                                                                    ad.video_url
                                                                                }
                                                                                frameBorder="0"
                                                                                allow="autoplay; encrypted-media"
                                                                                allowFullScreen
                                                                                title={
                                                                                    ad.title
                                                                                }
                                                                            ></iframe>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="header-ad-text-content">
                                                                            <h3>
                                                                                {
                                                                                    ad.title
                                                                                }
                                                                            </h3>
                                                                            <p>
                                                                                {
                                                                                    ad.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : ad.image ? (
                                                                <img
                                                                    src={getS3PublicUrl(
                                                                        ad.image,
                                                                    )}
                                                                    alt={
                                                                        ad.title
                                                                    }
                                                                    className="header-ad-image"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="header-ad-text-content"
                                                                    style={{
                                                                        background:
                                                                            ad.background_color ||
                                                                            "#f8f9fa",
                                                                        color:
                                                                            ad.text_color ||
                                                                            "#333",
                                                                    }}
                                                                >
                                                                    <h3>
                                                                        {
                                                                            ad.title
                                                                        }
                                                                    </h3>
                                                                    <p>
                                                                        {
                                                                            ad.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </a>
                                                    </div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1>
                            Calligraphy Contest<span>Results</span>
                        </h1>
                        <p className="announced">
                            Judged on line, proportion and composition by a
                            panel of three. Winners are listed in order of final
                            score.
                        </p>
                        <hr className="rule" />
                    </header>

                    <div className="sheet">
                        <table className="roll">
                            <caption>Winners — 1447 / 2026</caption>

                            <thead>
                                <tr>
                                    <th scope="col">No.</th>
                                    <th scope="col">Participant</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Prize</th>
                                </tr>
                            </thead>

                            <tbody>
                                {WINNERS.map((winner, index) => (
                                    <tr
                                        key={winner.email}
                                        data-place={winner.place}
                                    >
                                        <td className="serial">
                                            <span className="mark">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="name">{winner.name}</td>
                                        <td className="email">
                                            <a href={`mailto:${winner.email}`}>
                                                {winner.email}
                                            </a>
                                        </td>
                                        <td className="prize">
                                            {winner.prize}
                                            <small>{winner.note}</small>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="colophon">
                        <p className="closing">
                            Winners will be contacted at the email listed above
                            with collection details for the prize. Questions
                            about scoring can be sent to{" "}
                            <a href="mailto:contest@muslimhall.example">
                                contest@muslimhall.example
                            </a>
                            .
                        </p>

                        <Link
                            href={route("exhibition-details")}
                            className="back-link"
                        >
                            ← Back to exhibition boards
                        </Link>
                    </footer>
                </main>
            </div>

            <style>{`
                .result-page{
                    --lapis-deep:#0E1B3D;
                    --lapis:#1B2F5F;
                    --gold:#C9A24A;
                    --gold-light:#E8CE8D;
                    --parchment:#F3E9D6;
                    --parchment-shade:#E7DAC1;
                    --vermilion:#8E3B27;
                    --ink:#221B12;
                    --ink-soft:#6B5E4B;

                    --display:"Amiri","Noto Serif Bengali",Georgia,serif;
                    --text:"Karla","Noto Serif Bengali",system-ui,sans-serif;

                    padding:clamp(16px,4vw,56px) clamp(12px,4vw,40px);
                    background:
                      radial-gradient(120% 90% at 50% 0%, #16264E 0%, var(--lapis-deep) 55%, #080F24 100%);
                    color:var(--ink);
                    font-family:var(--text);
                    line-height:1.55;
                    min-height:100vh;
                }

                .result-page *{box-sizing:border-box;}

                /* ---------- the page ---------- */

                .result-page .board{
                    max-width:920px;
                    margin:0 auto;
                    background:var(--lapis-deep);
                    padding:clamp(14px,2.4vw,26px);
                    /* the jadwal: nested manuscript ruling, uneven weights on purpose */
                    box-shadow:
                      inset 0 0 0 1px var(--gold),
                      inset 0 0 0 5px var(--lapis-deep),
                      inset 0 0 0 7px rgba(201,162,74,.55),
                      inset 0 0 0 10px var(--lapis-deep),
                      inset 0 0 0 12px var(--gold),
                      0 30px 70px rgba(0,0,0,.45);
                    animation:result-settle .7s ease-out both;
                }

                @keyframes result-settle{
                    from{opacity:0;transform:translateY(10px);}
                    to{opacity:1;transform:none;}
                }

                /* ---------- crown ---------- */

                .result-page .crown{
                    text-align:center;
                    padding:clamp(22px,4vw,40px) clamp(14px,4vw,36px) clamp(20px,3.4vw,32px);
                }

                /* the Muslim Hall mark sits on a parchment medallion so it
                   reads against the lapis ground whatever colours it uses */
                .result-page .hall-logo{
                    display:grid;
                    place-items:center;
                    width:clamp(72px,11vw,96px);
                    height:clamp(72px,11vw,96px);
                    margin:0 auto clamp(14px,2.4vw,20px);
                    padding:clamp(8px,1.4vw,12px);
                    border-radius:50%;
                    background:var(--parchment);
                    box-shadow:0 0 0 1px var(--gold), 0 0 0 5px var(--lapis-deep),
                        0 0 0 6px rgba(201,162,74,.55);
                }

                .result-page .hall-logo img{
                    display:block;
                    max-width:100%;
                    max-height:100%;
                    width:auto;
                    height:auto;
                    object-fit:contain;
                }

                .result-page .hall{
                    margin:0;
                    font-family:var(--text);
                    font-size:clamp(11px,1.5vw,13px);
                    font-weight:600;
                    letter-spacing:.14em;
                    color:var(--gold-light);
                    opacity:.85;
                }

                .result-page .crown h1{
                    margin:.28em 0 .18em;
                    font-family:var(--display);
                    font-weight:700;
                    font-size:clamp(30px,6.4vw,54px);
                    line-height:1.06;
                    color:var(--parchment);
                    letter-spacing:.005em;
                }

                .result-page .crown h1 span{
                    display:block;
                    font-style:italic;
                    font-weight:400;
                    font-size:.54em;
                    color:var(--gold);
                    margin-top:.2em;
                }

                .result-page .announced{
                    margin:.9em auto 0;
                    max-width:44ch;
                    font-size:clamp(13px,1.7vw,15px);
                    color:rgba(243,233,214,.72);
                }

                .result-page .rule{
                    width:min(220px,60%);
                    height:1px;
                    margin:clamp(18px,3vw,26px) auto 0;
                    border:0;
                    background:linear-gradient(90deg,transparent,var(--gold),transparent);
                }

                /* ---------- the written surface ---------- */

                .result-page .sheet{
                    background:
                      linear-gradient(180deg,var(--parchment) 0%,#EFE3CB 100%);
                    padding:clamp(8px,2vw,20px) clamp(8px,2.2vw,26px) clamp(16px,2.6vw,28px);
                    box-shadow:0 0 0 1px rgba(201,162,74,.5), 0 8px 24px rgba(0,0,0,.28);
                }

                .result-page .roll{
                    width:100%;
                    border-collapse:collapse;
                    text-align:left;
                }

                .result-page .roll caption{
                    caption-side:top;
                    padding:clamp(14px,2.4vw,20px) 4px clamp(10px,1.8vw,14px);
                    font-family:var(--display);
                    font-size:clamp(17px,2.4vw,21px);
                    color:var(--vermilion);
                    text-align:left;
                }

                .result-page .roll th{
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:600;
                    letter-spacing:.06em;
                    color:var(--ink-soft);
                    padding:0 12px 10px;
                    border-bottom:1.5px solid rgba(142,59,39,.45);
                    white-space:nowrap;
                }

                .result-page .roll th:first-child{padding-left:4px;}
                .result-page .roll th:last-child{text-align:right;padding-right:4px;}

                .result-page .roll td{
                    padding:clamp(12px,1.8vw,16px) 12px;
                    border-bottom:1px solid rgba(34,27,18,.12);
                    vertical-align:middle;
                }

                .result-page .roll tbody tr:last-child td{border-bottom:0;}

                .result-page .roll tbody tr{transition:background .18s ease;}
                .result-page .roll tbody tr:hover{background:rgba(201,162,74,.12);}

                /* serial — verse-marker rosette */

                .result-page .serial{width:1%;padding-left:4px !important;}

                .result-page .mark{
                    display:grid;
                    place-items:center;
                    width:38px;height:38px;
                    border-radius:50%;
                    font-family:var(--display);
                    font-size:16px;
                    font-weight:700;
                    color:var(--ink-soft);
                    border:1px solid rgba(142,59,39,.35);
                    background:rgba(255,255,255,.4);
                }

                .result-page tr[data-place] .mark{
                    color:#2C1F0A;
                    border-color:var(--gold);
                    background:radial-gradient(circle at 32% 28%,var(--gold-light),var(--gold) 72%);
                    box-shadow:0 1px 6px rgba(201,162,74,.55);
                }

                /* name */

                .result-page .name{
                    font-family:var(--display);
                    font-size:clamp(18px,2.4vw,22px);
                    font-weight:400;
                    color:var(--ink);
                    line-height:1.25;
                }

                .result-page tr[data-place] .name{font-weight:700;}

                /* email */

                .result-page .email{
                    font-size:14px;
                    color:var(--ink-soft);
                    word-break:break-all;
                }

                .result-page .email a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(107,94,75,.35);}
                .result-page .email a:hover{color:var(--vermilion);border-bottom-color:var(--vermilion);}

                /* prize */

                .result-page .prize{
                    text-align:right;
                    padding-right:4px !important;
                    font-family:var(--display);
                    font-size:clamp(16px,2.1vw,19px);
                    color:var(--vermilion);
                    white-space:nowrap;
                }

                .result-page .prize small{
                    display:block;
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:500;
                    color:var(--ink-soft);
                    margin-top:1px;
                }

                /* ---------- sponsor (sits in the crown, under the mark and
                   the Muslim Hall line, above the contest title) ---------- */

                .result-page .sponsor{
                    margin:clamp(14px,2.4vw,20px) auto clamp(16px,2.6vw,22px);
                    max-width:720px;
                }

                .result-page .sponsor-title{
                    margin:0 0 10px;
                    font-family:var(--display);
                    font-style:italic;
                    font-size:clamp(13px,1.8vw,15px);
                    color:var(--gold);
                }

                .result-page .sponsor-slot{
                    display:grid;
                    /* an auto column would size to the Swiper's max-content
                       width, which is ~0 before Swiper measures its slides —
                       the carousel then renders at zero width and the ad
                       images never appear. A 1fr column gives it a real one. */
                    grid-template-columns:minmax(0,1fr);
                    place-items:center;
                    min-height:88px;
                    /* a full-width ad wants the slot to be little more than a
                       frame, so the padding stays thin */
                    padding:10px;
                    margin:0 auto;
                    max-width:100%;
                    background:rgba(243,233,214,.06);
                    border:1px dashed rgba(201,162,74,.55);
                }

                /* only a logo dropped straight into the slot — an ad image
                   inside the carousel is sized by .header-ad-image below */
                .result-page .sponsor-slot > img{
                    display:block;
                    max-width:100%;
                    max-height:72px;
                    height:auto;
                    width:auto;
                }

                .result-page .sponsor-slot .placeholder{
                    font-size:13px;
                    color:rgba(243,233,214,.55);
                    margin:0;
                }

                /* real artwork present -> drop the placeholder line and the dashed outline */
                .result-page .sponsor-slot:has(img) .placeholder,
                .result-page .sponsor-slot:has(video) .placeholder,
                .result-page .sponsor-slot:has(iframe) .placeholder{display:none;}

                .result-page .sponsor-slot:has(img),
                .result-page .sponsor-slot:has(video),
                .result-page .sponsor-slot:has(iframe){
                    border-style:solid;
                    border-color:rgba(201,162,74,.3);
                }

                /* the header ads come straight from the home page, so their
                   .header-ad-* classes need sizing here too — scaled down to
                   fit the crown rather than the 250px home banner */
                .result-page .sponsor-ad{
                    width:100%;
                    justify-self:stretch;
                }

                .result-page .header-ad-swiper{
                    width:100%;
                    border-radius:6px;
                    overflow:hidden;
                }

                .result-page .header-ad-swiper .swiper-slide{
                    width:100%;
                }

                .result-page .header-ad-container{
                    position:relative;
                    height:clamp(160px,26vw,240px);
                }

                .result-page .header-ad-link{
                    display:block;
                    height:100%;
                    text-decoration:none;
                }

                .result-page .header-ad-image,
                .result-page .header-ad-video{
                    width:100%;
                    height:100%;
                    object-fit:contain;
                }

                .result-page .header-ad-video-container,
                .result-page .video-ad-iframe-wrapper,
                .result-page .video-ad-iframe-wrapper iframe{
                    width:100%;
                    height:100%;
                }

                .result-page .header-ad-text-content{
                    height:100%;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    padding:12px;
                    text-align:center;
                }

                .result-page .header-ad-text-content h3{
                    margin:0 0 6px;
                    font-size:16px;
                    font-weight:700;
                }

                .result-page .header-ad-text-content p{
                    margin:0;
                    font-size:13px;
                }

                /* the default swiper bullets vanish on the lapis ground */
                .result-page .header-ad-swiper .swiper-pagination-bullet{
                    background:var(--gold-light);
                    opacity:.45;
                }

                .result-page .header-ad-swiper .swiper-pagination-bullet-active{
                    opacity:1;
                }

                /* ---------- colophon ---------- */

                .result-page .colophon{
                    padding:clamp(22px,3.6vw,34px) clamp(14px,3vw,30px) clamp(18px,3vw,26px);
                    text-align:center;
                }

                .result-page .closing{
                    margin:0 auto;
                    max-width:52ch;
                    font-size:13px;
                    line-height:1.7;
                    color:rgba(243,233,214,.6);
                }

                .result-page .closing a{color:var(--gold-light);}

                .result-page .back-link{
                    display:inline-block;
                    margin-top:clamp(16px,2.6vw,22px);
                    font-size:13px;
                    font-weight:600;
                    letter-spacing:.04em;
                    color:var(--gold-light);
                    text-decoration:none;
                    border-bottom:1px solid rgba(232,206,141,.4);
                }

                .result-page .back-link:hover{
                    color:var(--gold);
                    border-bottom-color:var(--gold);
                }

                /* ---------- focus ---------- */

                .result-page a:focus-visible{
                    outline:2px solid var(--gold);
                    outline-offset:3px;
                    border-radius:2px;
                }

                /* ---------- small screens: rows stack into records ---------- */

                @media (max-width:640px){
                    .result-page .roll thead{
                        position:absolute;
                        width:1px;height:1px;
                        overflow:hidden;
                        clip:rect(0 0 0 0);
                        white-space:nowrap;
                    }

                    .result-page .roll caption{padding-bottom:6px;}

                    .result-page .roll tbody tr{
                        display:grid;
                        grid-template-columns:auto 1fr;
                        gap:2px 14px;
                        align-items:start;
                        padding:16px 4px;
                        border-bottom:1px solid rgba(34,27,18,.14);
                    }

                    .result-page .roll tbody tr:last-child{border-bottom:0;}

                    .result-page .roll td{
                        padding:0;
                        border:0;
                    }

                    .result-page .serial{
                        grid-row:1 / span 3;
                        width:auto;
                        padding-left:0 !important;
                    }

                    .result-page .email{font-size:13px;}

                    .result-page .prize{
                        display:flex;
                        align-items:baseline;
                        gap:8px;
                        text-align:left;
                        padding-right:0 !important;
                        margin-top:6px;
                    }

                    /* the column header rides along with the value once the table stacks */
                    .result-page .prize::before{
                        content:"Prize";
                        font-family:var(--text);
                        font-size:12px;
                        font-weight:600;
                        letter-spacing:.06em;
                        color:var(--ink-soft);
                    }

                    .result-page .prize small{margin-top:0;}
                }

                @media (prefers-reduced-motion:reduce){
                    .result-page .board{animation:none;}
                    .result-page .roll tbody tr{transition:none;}
                }

                /* ---------- print ---------- */

                @media print{
                    .result-page{
                        background:#fff;
                        padding:0;
                        print-color-adjust:exact;
                        -webkit-print-color-adjust:exact;
                    }
                    .result-page .board{
                        box-shadow:inset 0 0 0 1px var(--gold), inset 0 0 0 12px var(--lapis-deep);
                        max-width:none;
                    }
                    .result-page .roll tbody tr{page-break-inside:avoid;}
                    .result-page .back-link{display:none;}
                }
            `}</style>
        </>
    );
}

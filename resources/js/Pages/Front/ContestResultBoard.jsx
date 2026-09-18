import { Head, Link, usePage } from "@inertiajs/react";
import { getS3PublicUrl } from "@/Utils/s3Helpers";
import { useState } from "react";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// The published prize list. `place` is set only for the top three, which is
// what gives those rows the gilded rosette; everyone else takes the plain one.
// Every winner also receives a certificate and a book alongside the cash.
const WINNERS = [
    {
        place: 1,
        entry: "48",
        name: "Afifa Jannat Zuma",
        score: 241,
        prize: "Tk 3,000",
    },
    {
        place: 2,
        entry: "22",
        name: "Abu Bokor Siddiq",
        score: 229,
        prize: "Tk 2,500",
    },
    {
        place: 3,
        entry: "39",
        name: "Fahim Chowdhury",
        score: 226,
        prize: "Tk 2,000",
    },
    { entry: "32", name: "Samiullah Riyad", score: 224, prize: "Tk 1,500" },
    { entry: "35", name: "Shamim Hossain", score: 223, prize: "Tk 1,000" },
    { entry: "03", name: "Amatullah Bushra", score: 223, prize: "Tk 500" },
    { entry: "23", name: "Israt Jahan Hafsa", score: 218, prize: "Tk 500" },
    { entry: "24", name: "Rifah Sanjida", score: 217, prize: "Tk 500" },
    { entry: "38", name: "Mohammad Akmam", score: 216, prize: "Tk 500" },
    {
        entry: "36",
        name: "Mohammad Shahedul Islam",
        score: 215,
        prize: "Tk 500",
    },
    // No score was published for the first participant's award.
    {
        entry: "57",
        name: "Hamida",
        score: null,
        prize: "Tk 500",
        note: "First participant",
    },
];

// Awarded outside the scored ranking.
const SPECIAL_AWARD = { entry: "41", title: "Most Viewed" };

const SPONSOR = {
    caption: "Sponsor of the Muslim Hall online Calligraphy Event",
    name: "Metropolitan Heart & Vascular Centre",
};

const COLLABORATORS = [
    "Bangladesh Charushilpi Parishad, Dhaka",
    "Hadith Department (SHIS), International Islamic University Chittagong (IIUC)",
    "Sikandar Mehedi Academy, Chittagong",
];

const ADJUDICATORS = [
    {
        name: "Renowned Artist Mr Ibrahim Mondal",
        role: "President, Bangladesh Charushilpi Parishad, Dhaka",
    },
    {
        name: "Mr. Nazmul Huda",
        role: "Associate Professor, Department of Hadith (SHIS), International Islamic University Chittagong (IIUC)",
    },
    {
        name: "Artist Sikandar Mehedi",
        role: "Sikandar Mehedi Academy, Chittagong",
    },
    {
        name: "Chowdhury Golam Mawla",
        role: "Chairman, Muslim Hall",
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
        1,
        2,
    );

    return (
        <>
            <Head>
                <title>
                    Hadith Calligraphy Exhibition &rsquo;26 Results — Muslim
                    Hall
                </title>
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

                            <p className="sponsor-caption">{SPONSOR.caption}</p>
                            <p className="sponsor-name">{SPONSOR.name}</p>
                        </div>

                        <div className="credits">
                            <section className="credit-block">
                                <h2>Our Collaborators</h2>
                                <ol>
                                    {COLLABORATORS.map((name) => (
                                        <li key={name}>{name}</li>
                                    ))}
                                </ol>
                            </section>

                            <section className="credit-block">
                                <h2>Adjudicators Panel</h2>
                                <ol>
                                    {ADJUDICATORS.map((judge) => (
                                        <li key={judge.name}>
                                            {judge.name}
                                            <small>{judge.role}</small>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        </div>

                        <h1>
                            Hadith Calligraphy Exhibition &rsquo;26
                            <span>Results</span>
                        </h1>
                        <p className="announced">
                            Judged on line, proportion and composition by the
                            adjudicators panel. Winners are listed in order of
                            final score.
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
                                    <th scope="col">Score</th>
                                    <th scope="col">Prize</th>
                                </tr>
                            </thead>

                            <tbody>
                                {WINNERS.map((winner, index) => (
                                    <tr
                                        key={winner.entry}
                                        data-place={winner.place}
                                    >
                                        <td className="serial">
                                            <span className="mark">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="name">
                                            {winner.name}
                                            <small>Entry #{winner.entry}</small>
                                        </td>
                                        <td className="score">
                                            {winner.score ?? "—"}
                                            {winner.note && (
                                                <small>{winner.note}</small>
                                            )}
                                        </td>
                                        <td className="prize">
                                            {winner.prize}
                                            <small>Certificate + book</small>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* <p className="special">
                            <span>Special award</span>
                            Entry #{SPECIAL_AWARD.entry} — {SPECIAL_AWARD.title}
                        </p> */}
                    </div>

                    <footer className="colophon">
                        <p className="closing">
                            Winners will be contacted with collection details
                            for the prize, the certificate and the book.
                            Questions about scoring can be sent to{" "}
                            <a href="mailto:cgmstad@gmail.com">
                                cgmstad@gmail.com
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
                    /* sampled from the Muslim Hall mark: #20891B at the top of
                       its gradient down to #006637 at the foot. The ground is
                       those greens taken several stops darker so the gold
                       ruling and the parchment sheet still carry the page. */
                    --green-deep:#052A1B;
                    --green:#0B5A2E;
                    --green-logo:#20891B;
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
                      radial-gradient(120% 90% at 50% 0%, var(--green) 0%, var(--green-deep) 55%, #01130A 100%);
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
                    background:var(--green-deep);
                    padding:clamp(14px,2.4vw,26px);
                    /* the jadwal: nested manuscript ruling, uneven weights on purpose */
                    box-shadow:
                      inset 0 0 0 1px var(--gold),
                      inset 0 0 0 5px var(--green-deep),
                      inset 0 0 0 7px rgba(201,162,74,.55),
                      inset 0 0 0 10px var(--green-deep),
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
                   reads against the green ground whatever colours it uses */
                .result-page .hall-logo{
                    display:grid;
                    place-items:center;
                    width:clamp(72px,11vw,96px);
                    height:clamp(72px,11vw,96px);
                    margin:0 auto clamp(14px,2.4vw,20px);
                    padding:clamp(8px,1.4vw,12px);
                    border-radius:50%;
                    background:var(--parchment);
                    /* the outermost ring picks up the mark's own leaf green so
                       the medallion reads as part of the logo, not a sticker */
                    box-shadow:0 0 0 1px var(--gold), 0 0 0 5px var(--green-deep),
                        0 0 0 7px var(--green-logo), 0 0 0 8px rgba(201,162,74,.55);
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

                /* the entry number rides under the name rather than taking a
                   column of its own — it identifies the piece, it is not a
                   thing anyone reads down the page */
                .result-page .name small{
                    display:block;
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:500;
                    letter-spacing:.04em;
                    color:var(--ink-soft);
                    margin-top:2px;
                }

                /* score */

                .result-page .score{
                    font-family:var(--display);
                    font-size:clamp(16px,2.1vw,19px);
                    color:var(--ink);
                    font-variant-numeric:tabular-nums;
                    white-space:nowrap;
                }

                .result-page .score small{
                    display:block;
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:500;
                    color:var(--ink-soft);
                    margin-top:1px;
                    white-space:normal;
                }

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

                /* the special award sits outside the scored ranking, so it gets
                   a line of its own under the roll rather than a numbered row */
                .result-page .special{
                    display:flex;
                    flex-wrap:wrap;
                    align-items:baseline;
                    gap:10px;
                    margin:clamp(14px,2.2vw,20px) 4px 0;
                    padding-top:clamp(12px,2vw,16px);
                    border-top:1.5px solid rgba(142,59,39,.45);
                    font-family:var(--display);
                    font-size:clamp(16px,2.1vw,19px);
                    color:var(--ink);
                }

                .result-page .special span{
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:600;
                    letter-spacing:.06em;
                    text-transform:uppercase;
                    color:var(--vermilion);
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

                /* the default swiper bullets vanish on the green ground */
                .result-page .header-ad-swiper .swiper-pagination-bullet{
                    background:var(--gold-light);
                    opacity:.45;
                }

                .result-page .header-ad-swiper .swiper-pagination-bullet-active{
                    opacity:1;
                }

                /* the sponsor is named directly beneath its artwork */
                .result-page .sponsor-caption{
                    margin:clamp(10px,1.8vw,14px) 0 2px;
                    font-size:clamp(11px,1.5vw,12px);
                    font-weight:600;
                    letter-spacing:.08em;
                    text-transform:uppercase;
                    color:rgba(243,233,214,.6);
                }

                .result-page .sponsor-name{
                    margin:0;
                    font-family:var(--display);
                    font-size:clamp(17px,2.4vw,21px);
                    font-weight:700;
                    line-height:1.25;
                    color:var(--parchment);
                }

                /* ---------- collaborators & adjudicators ---------- */

                .result-page .credits{
                    display:grid;
                    grid-template-columns:repeat(2,minmax(0,1fr));
                    gap:clamp(18px,3vw,34px);
                    max-width:760px;
                    margin:clamp(20px,3.2vw,30px) auto 0;
                    padding-top:clamp(18px,2.8vw,26px);
                    border-top:1px solid rgba(201,162,74,.28);
                    text-align:left;
                }

                .result-page .credit-block h2{
                    margin:0 0 10px;
                    font-family:var(--text);
                    font-size:clamp(11px,1.5vw,12px);
                    font-weight:600;
                    letter-spacing:.12em;
                    text-transform:uppercase;
                    color:var(--gold);
                }

                .result-page .credit-block ol{
                    margin:0;
                    padding-left:1.15em;
                    display:flex;
                    flex-direction:column;
                    gap:9px;
                }

                .result-page .credit-block li{
                    font-family:var(--display);
                    font-size:clamp(14px,1.9vw,16px);
                    line-height:1.35;
                    color:var(--parchment);
                }

                .result-page .credit-block li::marker{
                    color:var(--gold);
                    font-family:var(--text);
                    font-size:12px;
                }

                /* the affiliation is support for the name, not a second name */
                .result-page .credit-block li small{
                    display:block;
                    font-family:var(--text);
                    font-size:12px;
                    font-weight:400;
                    line-height:1.5;
                    color:rgba(243,233,214,.6);
                    margin-top:2px;
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
                    .result-page .credits{
                        grid-template-columns:minmax(0,1fr);
                    }

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

                    .result-page .score,
                    .result-page .prize{
                        display:flex;
                        align-items:baseline;
                        gap:8px;
                        text-align:left;
                        padding-right:0 !important;
                        margin-top:6px;
                    }

                    /* the column header rides along with the value once the table stacks */
                    .result-page .score::before{
                        content:"Score";
                        font-family:var(--text);
                        font-size:12px;
                        font-weight:600;
                        letter-spacing:.06em;
                        color:var(--ink-soft);
                    }

                    .result-page .score small{margin-top:0;}

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
                        box-shadow:inset 0 0 0 1px var(--gold), inset 0 0 0 12px var(--green-deep);
                        max-width:none;
                    }
                    .result-page .roll tbody tr{page-break-inside:avoid;}
                    .result-page .back-link{display:none;}
                }
            `}</style>
        </>
    );
}

// import { useEffect, useRef, useState } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FilePdfOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MobilePDFViewer = ({ pdfPath }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);

    if (!pdfPath) return null;

    // Build an absolute URL
    const absoluteUrl = pdfPath.startsWith("http")
        ? pdfPath
        : `${window.location.origin}/${pdfPath.replace(/^\//, "")}`;

    useEffect(() => {
        let isMounted = true;
        const loadPDF = async () => {
            setLoading(true);
            if (containerRef.current) containerRef.current.innerHTML = "";
            try {
                const pdf = await pdfjsLib.getDocument(absoluteUrl).promise;
                if (!isMounted) return;

                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });

                if (!containerRef.current) return;
                const containerWidth = containerRef.current.clientWidth || window.innerWidth - 32;
                const scale = containerWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });

                const canvas = document.createElement("canvas");
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                canvas.style.width = "100%";
                canvas.style.height = "auto";
                canvas.className = "rounded shadow-sm bg-white";

                containerRef.current.appendChild(canvas);

                const context = canvas.getContext("2d");
                await page.render({
                    canvasContext: context,
                    viewport: scaledViewport,
                }).promise;

            } catch (error) {
                console.error("Error loading PDF preview:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (absoluteUrl) loadPDF();

        return () => { isMounted = false; };
    }, [absoluteUrl]);

    return (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white pb-4">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 mb-4">
                <div className="flex items-center gap-2">
                    <FilePdfOutlined className="text-red-500 text-lg" />
                    <span className="text-sm font-medium text-gray-700">PDF Document</span>
                </div>
                <Tooltip title="Open Full PDF">
                    <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="small" icon={<FullscreenOutlined />} type="text">
                            Full View
                        </Button>
                    </a>
                </Tooltip>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-3"></div>
                    <span className="text-gray-500 text-sm">Loading Preview...</span>
                </div>
            )}

            <div className="px-4">
                <div ref={containerRef} className={`w-full flex justify-center border border-gray-200 rounded p-1 bg-gray-50 mb-4 ${loading ? 'hidden' : 'block'}`} style={{ minHeight: !loading ? 'auto' : '200px' }} />

                {!loading && (
                    <a href={absoluteUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button type="primary" size="large" block className="bg-blue-500 hover:bg-blue-600">
                            Open PDF
                        </Button>
                    </a>
                )}
            </div>
        </div>
    );
};

// const DesktopPDFViewer = ({ pdfPath }) => {
//     const containerRef = useRef(null);
//     const [pdfDoc, setPdfDoc] = useState(null);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(0);
//     const [loading, setLoading] = useState(true);

//     const pagesPerLoad = 5;

//     // Build an absolute URL
//     const absoluteUrl = pdfPath.startsWith("http")
//         ? pdfPath
//         : `${window.location.origin}/${pdfPath.replace(/^\//, "")}`;

//     useEffect(() => {
//         let isMounted = true;

//         const loadPDF = async () => {
//             setLoading(true);
//             if (containerRef.current) containerRef.current.innerHTML = "";

//             try {
//                 const pdf = await pdfjsLib.getDocument(absoluteUrl).promise;
//                 if (!isMounted) return;

//                 setPdfDoc(pdf);
//                 setTotalPages(pdf.numPages);

//                 const initialEnd = Math.min(pagesPerLoad, pdf.numPages);

//                 await loadPages(pdf, 1, initialEnd);

//                 if (!isMounted) return;
//                 setCurrentPage(initialEnd + 1);
//             } catch (error) {
//                 console.error("Error loading PDF:", error);
//             } finally {
//                 if (isMounted) setLoading(false);
//             }
//         };

//         if (absoluteUrl) {
//             loadPDF();
//         }

//         return () => { isMounted = false; };
//     }, [absoluteUrl]);

//     const loadPages = async (pdf, start, end) => {
//         if (!containerRef.current) return;
//         const containerWidth = containerRef.current.clientWidth || 800;

//         for (let pageNum = start; pageNum <= end; pageNum++) {
//             const page = await pdf.getPage(pageNum);
//             const viewport = page.getViewport({ scale: 1 });

//             const scale = containerWidth / viewport.width;
//             const scaledViewport = page.getViewport({ scale });

//             const canvas = document.createElement("canvas");
//             canvas.width = scaledViewport.width;
//             canvas.height = scaledViewport.height;
//             canvas.style.width = "100%";
//             canvas.style.height = "auto";
//             canvas.className = "mb-4 border border-gray-200 shadow-sm rounded bg-white";

//             if (containerRef.current) {
//                 containerRef.current.appendChild(canvas);
//             }

//             const context = canvas.getContext("2d");
//             await page.render({
//                 canvasContext: context,
//                 viewport: scaledViewport,
//             }).promise;
//         }
//     };

//     const loadMorePages = async () => {
//         if (!pdfDoc) return;

//         const start = currentPage;
//         const end = Math.min(currentPage + pagesPerLoad - 1, totalPages);

//         await loadPages(pdfDoc, start, end);
//         setCurrentPage(end + 1);
//     };

//     return (
//         <div className="w-full relative bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
//             {/* Header bar */}
//             <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg mb-4">
//                 <div className="flex items-center gap-2">
//                     <FilePdfOutlined className="text-red-500 text-lg" />
//                     <span className="text-sm font-medium text-gray-700">PDF Document</span>
//                 </div>
//                 <Tooltip title="Open in new tab">
//                     <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">
//                         <Button size="small" icon={<FullscreenOutlined />} type="text">
//                             Full View
//                         </Button>
//                     </a>
//                 </Tooltip>
//             </div>

//             {/* Loader overlay */}
//             {loading && (
//                 <div className="flex flex-col items-center justify-center py-10">
//                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
//                     <span className="text-gray-500 text-sm">Loading PDF...</span>
//                 </div>
//             )}

//             {/* PDF container stays visible */}
//             <div ref={containerRef} className="w-full flex flex-col items-center" />

//             {!loading && currentPage <= totalPages && (
//                 <div className="flex justify-center mt-4 pb-4">
//                     <button
//                         className="btn btn-success px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
//                         onClick={loadMorePages}
//                     >
//                         Load More Pages
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// };

const DesktopPDFViewer = ({ pdfPath }) => {
    const containerRef = useRef(null);
    const loaderRef = useRef(null);
    const loadingMoreRef = useRef(false);

    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const pagesPerLoad = 5;

    const absoluteUrl = pdfPath?.startsWith("http")
        ? pdfPath
        : `${window.location.origin}/${pdfPath.replace(/^\//, "")}`;

    const loadPages = useCallback(async (pdf, start, end) => {
        if (!containerRef.current || !pdf) return;

        const containerWidth = containerRef.current.clientWidth || 800;

        for (let pageNum = start; pageNum <= end; pageNum++) {
            if (!containerRef.current) return;

            const oldPage = containerRef.current.querySelector(
                `[data-page-number="${pageNum}"]`
            );

            if (oldPage) continue;

            const pageWrapper = document.createElement("div");
            pageWrapper.className = "w-full mb-4 flex justify-center";
            pageWrapper.setAttribute("data-page-number", pageNum);

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1 });

            const scale = containerWidth / viewport.width;

            const scaledViewport = page.getViewport({
                scale,
            });

            const canvas = document.createElement("canvas");

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            canvas.style.width = "100%";
            canvas.style.height = "auto";

            canvas.className =
                "border border-gray-200 shadow-sm rounded bg-white";

            pageWrapper.appendChild(canvas);

            containerRef.current.appendChild(pageWrapper);

            const context = canvas.getContext("2d");

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;
        }
    }, []);

    const loadMorePages = useCallback(async () => {
        if (!pdfDoc || loadingMoreRef.current) return;

        if (currentPage > totalPages) return;

        loadingMoreRef.current = true;

        setLoadingMore(true);

        const start = currentPage;

        const end = Math.min(
            currentPage + pagesPerLoad - 1,
            totalPages
        );

        try {
            await loadPages(pdfDoc, start, end);

            setCurrentPage(end + 1);
        } catch (error) {
            console.error("Error loading more PDF pages:", error);
        } finally {
            loadingMoreRef.current = false;

            setLoadingMore(false);
        }
    }, [
        pdfDoc,
        currentPage,
        totalPages,
        loadPages,
    ]);

    useEffect(() => {
        let isMounted = true;

        const loadPDF = async () => {
            setLoading(true);

            setPdfDoc(null);

            setCurrentPage(1);

            setTotalPages(0);

            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }

            try {
                const pdf =
                    await pdfjsLib.getDocument(absoluteUrl)
                        .promise;

                if (!isMounted) return;

                setPdfDoc(pdf);

                setTotalPages(pdf.numPages);

                const initialEnd = Math.min(
                    pagesPerLoad,
                    pdf.numPages
                );

                await loadPages(pdf, 1, initialEnd);

                if (!isMounted) return;

                setCurrentPage(initialEnd + 1);
            } catch (error) {
                console.error("Error loading PDF:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (absoluteUrl) {
            loadPDF();
        }

        return () => {
            isMounted = false;
        };
    }, [absoluteUrl, loadPages]);

    useEffect(() => {
        if (!loaderRef.current || !pdfDoc) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];

                if (
                    firstEntry.isIntersecting &&
                    !loading &&
                    !loadingMoreRef.current &&
                    currentPage <= totalPages
                ) {
                    loadMorePages();
                }
            },
            {
                root: null,
                rootMargin: "600px",
                threshold: 0.1,
            }
        );

        observer.observe(loaderRef.current);

        return () => {
            observer.disconnect();
        };
    }, [
        pdfDoc,
        loading,
        currentPage,
        totalPages,
        loadMorePages,
    ]);

    return (
        <div className="w-full relative bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
            {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>

                    <span className="text-gray-500 text-sm">
                        Loading PDF...
                    </span>
                </div>
            )}

            <div
                ref={containerRef}
                className="w-full flex flex-col items-center"
            />

            <div
                ref={loaderRef}
                className="w-full py-6 text-center"
            >
                {!loading && loadingMore && (
                    <span className="text-gray-500 text-sm">
                        Loading more pages...
                    </span>
                )}

                {!loading &&
                    currentPage > totalPages &&
                    totalPages > 0 && (
                        <span className="text-gray-400 text-xs">
                            End of PDF
                        </span>
                    )}
            </div>
        </div>
    );
};

const PDFViewer = ({ pdfPath }) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 768 : false
    );

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();

        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    if (!pdfPath) return null;

    if (isMobile) {
        return <MobilePDFViewer pdfPath={pdfPath} />;
    }

    return <DesktopPDFViewer pdfPath={pdfPath} />;
};

export default PDFViewer;

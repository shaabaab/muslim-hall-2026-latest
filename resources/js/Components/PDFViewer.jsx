import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownOutlined, ArrowUpOutlined, FilePdfOutlined, FullscreenOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, InputNumber, Space, Tooltip } from "antd";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const buildAbsoluteUrl = (pdfPath) => {
    if (!pdfPath) return "";
    return pdfPath.startsWith("http") ? pdfPath : `${window.location.origin}/${pdfPath.replace(/^\//, "")}`;
};

const MobilePDFViewer = ({ pdfPath }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const absoluteUrl = buildAbsoluteUrl(pdfPath);

    useEffect(() => {
        let isMounted = true;
        const loadPDF = async () => {
            setLoading(true);
            if (containerRef.current) containerRef.current.innerHTML = "";
            try {
                const pdf = await pdfjsLib.getDocument(absoluteUrl).promise;
                if (!isMounted) return;
                setTotalPages(pdf.numPages);
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                const containerWidth = containerRef.current?.clientWidth || window.innerWidth - 32;
                const scale = containerWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });
                const canvas = document.createElement("canvas");
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                canvas.style.width = "100%";
                canvas.style.height = "auto";
                canvas.className = "rounded shadow-sm bg-white";
                containerRef.current?.appendChild(canvas);
                await page.render({ canvasContext: canvas.getContext("2d"), viewport: scaledViewport }).promise;
            } catch (error) {
                console.error("Error loading PDF preview:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        if (absoluteUrl) loadPDF();
        return () => { isMounted = false; };
    }, [absoluteUrl]);

    if (!pdfPath) return null;

    return (
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white pb-4">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 mb-4">
                <div className="flex items-center gap-2">
                    <FilePdfOutlined className="text-red-500 text-lg" />
                    <span className="text-sm font-medium text-gray-700">PDF Document {totalPages ? `(1/${totalPages})` : ""}</span>
                </div>
                <Tooltip title="Open Full PDF">
                    <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="small" icon={<FullscreenOutlined />} type="text">Full View</Button>
                    </a>
                </Tooltip>
            </div>
            {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mb-3" />
                    <span className="text-gray-500 text-sm">Loading Preview...</span>
                </div>
            )}
            <div className="px-4">
                <div ref={containerRef} className={`w-full flex justify-center border border-gray-200 rounded p-1 bg-gray-50 mb-4 ${loading ? "hidden" : "block"}`} />
                {!loading && (
                    <a href={absoluteUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button type="primary" size="large" block className="bg-blue-500 hover:bg-blue-600">Open PDF</Button>
                    </a>
                )}
            </div>
        </div>
    );
};

const DesktopPDFViewer = ({ pdfPath }) => {
    const wrapperRef = useRef(null);
    const containerRef = useRef(null);
    const loaderRef = useRef(null);
    const loadingMoreRef = useRef(false);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [nextPage, setNextPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [jumpPage, setJumpPage] = useState(1);
    const pagesPerLoad = 5;
    const absoluteUrl = buildAbsoluteUrl(pdfPath);

    const loadPages = useCallback(async (pdf, start, end) => {
        if (!containerRef.current || !pdf) return;
        const containerWidth = containerRef.current.clientWidth || 800;
        for (let pageNum = start; pageNum <= end; pageNum++) {
            if (!containerRef.current) return;
            if (containerRef.current.querySelector(`[data-page-number="${pageNum}"]`)) continue;
            const pageWrapper = document.createElement("div");
            pageWrapper.className = "w-full mb-4 flex flex-col items-center scroll-mt-24";
            pageWrapper.setAttribute("data-page-number", pageNum);
            const label = document.createElement("div");
            label.className = "text-xs text-gray-500 mb-2";
            label.innerText = `Page ${pageNum}`;
            pageWrapper.appendChild(label);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1 });
            const scale = containerWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            canvas.className = "border border-gray-200 shadow-sm rounded bg-white";
            pageWrapper.appendChild(canvas);
            containerRef.current.appendChild(pageWrapper);
            await page.render({ canvasContext: canvas.getContext("2d"), viewport: scaledViewport }).promise;
        }
    }, []);

    const loadMorePages = useCallback(async () => {
        if (!pdfDoc || loadingMoreRef.current || nextPage > totalPages) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        const start = nextPage;
        const end = Math.min(nextPage + pagesPerLoad - 1, totalPages);
        try {
            await loadPages(pdfDoc, start, end);
            setNextPage(end + 1);
        } catch (error) {
            console.error("Error loading more PDF pages:", error);
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [pdfDoc, nextPage, totalPages, loadPages]);

    const ensurePageLoaded = useCallback(async (pageNumber) => {
        if (!pdfDoc || !containerRef.current) return false;
        const targetPage = Math.min(Math.max(Number(pageNumber || 1), 1), totalPages || 1);
        if (!containerRef.current.querySelector(`[data-page-number="${targetPage}"]`)) {
            await loadPages(pdfDoc, nextPage, targetPage);
            setNextPage((old) => Math.max(old, targetPage + 1));
        }
        return true;
    }, [pdfDoc, totalPages, nextPage, loadPages]);

    const jumpToPage = useCallback(async () => {
        const pageNumber = Math.min(Math.max(Number(jumpPage || 1), 1), totalPages || 1);
        await ensurePageLoaded(pageNumber);
        containerRef.current?.querySelector(`[data-page-number="${pageNumber}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [jumpPage, totalPages, ensurePageLoaded]);

    const goTop = () => wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const goBottom = async () => {
        if (pdfDoc && nextPage <= totalPages) {
            await loadPages(pdfDoc, nextPage, totalPages);
            setNextPage(totalPages + 1);
        }
        loaderRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    useEffect(() => {
        let isMounted = true;
        const loadPDF = async () => {
            setLoading(true); setPdfDoc(null); setNextPage(1); setTotalPages(0); setJumpPage(1);
            if (containerRef.current) containerRef.current.innerHTML = "";
            try {
                const pdf = await pdfjsLib.getDocument(absoluteUrl).promise;
                if (!isMounted) return;
                setPdfDoc(pdf); setTotalPages(pdf.numPages);
                const initialEnd = Math.min(pagesPerLoad, pdf.numPages);
                await loadPages(pdf, 1, initialEnd);
                if (!isMounted) return;
                setNextPage(initialEnd + 1);
            } catch (error) {
                console.error("Error loading PDF:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        if (absoluteUrl) loadPDF();
        return () => { isMounted = false; };
    }, [absoluteUrl, loadPages]);

    useEffect(() => {
        if (!loaderRef.current || !pdfDoc) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loading && !loadingMoreRef.current && nextPage <= totalPages) loadMorePages();
        }, { root: null, rootMargin: "600px", threshold: 0.1 });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [pdfDoc, loading, nextPage, totalPages, loadMorePages]);

    if (!pdfPath) return null;

    return (
        <div ref={wrapperRef} className="w-full relative bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-lg mb-4 px-4 py-2.5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FilePdfOutlined className="text-red-500 text-lg" />
                        <span className="text-sm font-medium text-gray-700">PDF Document {totalPages ? `(${totalPages} pages)` : ""}</span>
                    </div>
                    <Space wrap>
                        <InputNumber min={1} max={totalPages || 1} value={jumpPage} onChange={(value) => setJumpPage(value || 1)} onPressEnter={jumpToPage} size="small" addonBefore="Page" addonAfter={totalPages || ""} disabled={!totalPages} />
                        <Tooltip title="Go to page"><Button size="small" icon={<SearchOutlined />} onClick={jumpToPage} disabled={!totalPages}>Search</Button></Tooltip>
                        <Tooltip title="Top"><Button size="small" icon={<ArrowUpOutlined />} onClick={goTop} /></Tooltip>
                        <Tooltip title="Bottom"><Button size="small" icon={<ArrowDownOutlined />} onClick={goBottom} disabled={!totalPages} /></Tooltip>
                        <Tooltip title="Open in new tab"><a href={absoluteUrl} target="_blank" rel="noopener noreferrer"><Button size="small" icon={<FullscreenOutlined />} type="text">Full View</Button></a></Tooltip>
                    </Space>
                </div>
            </div>
            {loading && <div className="flex flex-col items-center justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3" /><span className="text-gray-500 text-sm">Loading PDF...</span></div>}
            <div ref={containerRef} className="w-full flex flex-col items-center" />
            <div ref={loaderRef} className="w-full py-6 text-center">
                {!loading && loadingMore && <span className="text-gray-500 text-sm">Loading more pages...</span>}
                {!loading && nextPage > totalPages && totalPages > 0 && <span className="text-gray-400 text-xs">End of PDF</span>}
            </div>
        </div>
    );
};

const PDFViewer = ({ pdfPath }) => {
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile(); window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    if (!pdfPath) return null;
    return isMobile ? <MobilePDFViewer pdfPath={pdfPath} /> : <DesktopPDFViewer pdfPath={pdfPath} />;
};

export default PDFViewer;

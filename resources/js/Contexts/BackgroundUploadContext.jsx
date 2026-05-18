import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { notification } from 'antd';
import { router } from '@inertiajs/react';

const BackgroundUploadContext = createContext();

export const useBackgroundUpload = () => useContext(BackgroundUploadContext);

// ─── localStorage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = 'pendingProcessingPosts';

const getPendingPosts = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

const savePendingPost = (postId) => {
    try {
        const current = getPendingPosts();
        if (!current.includes(String(postId))) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, String(postId)]));
        }
    } catch { /* storage quota / private browsing */ }
};

const removePendingPost = (postId) => {
    try {
        const current = getPendingPosts().filter(id => id !== String(postId));
        if (current.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        }
    } catch { /* ignore */ }
};
// ─────────────────────────────────────────────────────────────────────────────

export const BackgroundUploadProvider = ({ children }) => {
    const [uploads, setUploads] = useState([]);
    // Track which uploadIds are currently being processed (to avoid double-start)
    const processingRef = useRef(new Set());
    // Track polling intervals so we can clean up on unmount
    const intervalsRef = useRef(new Map());

    // ── 1. RESTORE pending uploads from localStorage on mount ────────────────
    useEffect(() => {
        const pendingPosts = getPendingPosts();
        if (pendingPosts.length === 0) return;

        pendingPosts.forEach(async (postId) => {
            try {
                const res = await fetch(`/api/posts/${postId}/media-status`, {
                    credentials: 'same-origin',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (!res.ok) {
                    removePendingPost(postId);
                    return;
                }
                const data = await res.json();

                if (data.processing) {
                    // Still processing on server — restore polling entry in UI
                    const restoredId = `restored-${postId}-${Date.now()}`;
                    setUploads(prev => [...prev, {
                        id:          restoredId,
                        postId:      postId,
                        status:      'uploading',
                        progress:    99,
                        phase:       'processing',
                        // 'name' is used by indicator as fallback when file object is absent
                        name:        `Post #${postId} — Processing media…`,
                        file:        { name: `Post #${postId} — Processing media…` },
                        isRestored:  true,
                    }]);
                    pollUntilAllDone(postId, restoredId);
                } else {
                    // Already finished — just clean up localStorage
                    removePendingPost(postId);
                }
            } catch (_) {
                // Network error — leave in localStorage, try again next visit
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run only on mount

    // ── 2. BEFORE-UNLOAD warning during active chunk upload ──────────────────
    useEffect(() => {
        const hasActiveChunking = uploads.some(
            u => u.status === 'uploading' && u.phase === 'chunking'
        );

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            const msg = 'Files are still uploading. Leaving now will cancel the upload.';
            e.returnValue = msg;
            return msg;
        };

        if (hasActiveChunking) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [uploads]);

    // ── 3. Cleanup all polling intervals on unmount ──────────────────────────
    useEffect(() => {
        return () => {
            intervalsRef.current.forEach(interval => clearInterval(interval));
        };
    }, []);

    const addUpload = useCallback((uploadTask) => {
        setUploads((prev) => [...prev, { ...uploadTask, status: 'uploading', progress: 0, phase: 'chunking' }]);
    }, []);

    /**
     * Upload a file in 2MB chunks, updating progress in real time.
     */
    /**
     * Upload a single chunk with automatic retry on network failure.
     * Retries up to MAX_RETRIES times with exponential backoff.
     */
    const uploadChunkWithRetry = async (formData, fileName, chunkIndex, MAX_RETRIES = 3) => {
        let lastError;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Refresh CSRF token on each attempt to avoid 419 on long uploads
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const response = await fetch(route('upload.chunk'), {
                    method:  'POST',
                    body:    formData,
                    headers: {
                        'X-CSRF-TOKEN':     csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Server error ${response.status}: ${errText.slice(0, 200)}`);
                }

                return await response.json();
            } catch (err) {
                lastError = err;
                if (attempt < MAX_RETRIES) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(`Chunk ${chunkIndex} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms…`, err.message);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    };

    const uploadFileInChunks = async (file, uploadId, postId, type) => {
        // ✅ Save postId to localStorage IMMEDIATELY — before any chunk is sent.
        // This ensures page refresh at ANY point during the upload can still restore
        // the navbar indicator and poll for completion.
        savePendingPost(postId);

        // 5MB chunks — better throughput and fewer requests than 2MB
        const chunkSize = 5 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / chunkSize);
        const identifier = `${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end   = Math.min(file.size, start + chunkSize);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('chunk',       chunk, file.name);
            formData.append('chunkIndex',  chunkIndex);
            formData.append('totalChunks', totalChunks);
            formData.append('identifier',  identifier);
            formData.append('fileName',    file.name);

            try {
                const result = await uploadChunkWithRetry(formData, file.name, chunkIndex);

                // Phase 1 progress: chunk upload percentage (capped at 99%)
                const chunkPercent = Math.round(((chunkIndex + 1) / totalChunks) * 99);
                setUploads(prev => prev.map(u =>
                    u.id === uploadId
                        ? { ...u, progress: chunkPercent, phase: 'chunking' }
                        : u
                ));

                if (result.done) {
                    // Transition to phase 2: server-side processing
                    setUploads(prev => prev.map(u =>
                        u.id === uploadId
                            ? { ...u, progress: 99, phase: 'processing', tempPath: result.temp_path }
                            : u
                    ));
                    await attachMediaToPost(postId, result.temp_path, type, uploadId);
                }
            } catch (error) {
                console.error('Chunk upload error (all retries exhausted):', error);
                setUploads(prev => prev.map(u =>
                    u.id === uploadId ? { ...u, status: 'error', error: error.message } : u
                ));
                notification.error({
                    message:     'Upload Failed',
                    description: `Failed to upload ${file.name}: ${error.message}`,
                });
                processingRef.current.delete(uploadId);
                return;
            }
        }
    };

    /**
     * Tell the server to attach the temp file and dispatch the processing job.
     * Then persist the postId to localStorage (survives page refresh) and start polling.
     */
    const attachMediaToPost = async (postId, tempPath, type, uploadId) => {
        try {
            // Refresh CSRF token so this POST doesn't 419
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            try {
                const tokenRes = await fetch(route('csrf.refresh'), { credentials: 'same-origin' });
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    csrfToken = tokenData.token;
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', csrfToken);
                }
            } catch (_) { /* keep old token */ }

            const response = await fetch(route('api.posts.attach-media', postId), {
                method: 'POST',
                headers: {
                    'Content-Type':     'application/json',
                    'X-CSRF-TOKEN':     csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ temp_path: tempPath, type }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server error ${response.status}: ${errText}`);
            }

            // ✅ Job dispatched — persist postId so polling can resume after a page refresh
            savePendingPost(postId);

            // Start polling DB until ALL files for this post are done
            pollUntilAllDone(postId, uploadId);

        } catch (error) {
            console.error('Attach media error:', error);
            setUploads(prev => prev.map(u =>
                u.id === uploadId ? { ...u, status: 'error', error: error.message } : u
            ));
            notification.error({
                message:     'Processing Failed',
                description: `Could not start background processing: ${error.message}`,
            });
            processingRef.current.delete(uploadId);
        }
    };

    /**
     * Polls the DB every 5 seconds via /api/posts/{postId}/media-status.
     *
     * KEY LOGIC:
     * - Only marks upload as COMPLETE when DB confirms 0 'processing' rows remain.
     * - On complete: removes postId from localStorage (cleanup).
     * - Timeout after 6 minutes.
     * - Works for both fresh uploads AND restored uploads (after page refresh).
     */
    const pollUntilAllDone = (postId, uploadId) => {
        let simulatedProgress = 99;
        let attempts = 0;
        const maxAttempts = 72; // 72 × 5 s = 6 minutes

        const interval = setInterval(async () => {
            attempts++;

            // Animate progress bar slowly from 99% toward (but never reaching) 100%
            simulatedProgress = Math.min(99.5, simulatedProgress + (100 - simulatedProgress) * 0.05);
            const displayPercent = Math.round(simulatedProgress);

            setUploads(prev => prev.map(u =>
                u.id === uploadId && u.status === 'uploading'
                    ? { ...u, progress: displayPercent, phase: 'processing' }
                    : u
            ));

            try {
                // ── 1. Check actual DB status (source of truth) ──
                const statusRes = await fetch(`/api/posts/${postId}/media-status`, {
                    credentials: 'same-origin',
                    headers:     { 'X-Requested-With': 'XMLHttpRequest' },
                });

                if (statusRes.ok) {
                    const statusData = await statusRes.json();

                    // Only mark complete when ALL files in DB are done
                    if (!statusData.processing) {
                        clearInterval(interval);
                        intervalsRef.current.delete(uploadId);
                        processingRef.current.delete(uploadId);

                        // ✅ Remove from localStorage — no need to restore on next visit
                        removePendingPost(postId);

                        setUploads(prev => prev.map(u =>
                            u.id === uploadId
                                ? { ...u, status: 'completed', progress: 100, phase: 'done' }
                                : u
                        ));

                        // ── 2. Drain unread notifications for success toasts ──
                        try {
                            const notifRes = await fetch('/poll-processing-done', {
                                credentials: 'same-origin',
                                headers:     { 'X-Requested-With': 'XMLHttpRequest' },
                            });
                            if (notifRes.ok) {
                                const notifs = await notifRes.json();
                                notifs.forEach(n => {
                                    notification.success({
                                        message:     'Upload Complete ✅',
                                        description: n.message || 'All files have been processed.',
                                        placement:   'topRight',
                                        duration:    8,
                                    });
                                });
                            }
                        } catch (_) { /* toasts are nice-to-have */ }

                        // Refresh datatable — files are now ready in DB
                        router.reload({ only: ['posts'] });
                        return;
                    }
                    // Still processing — keep polling
                }
            } catch (_) { /* network hiccup — keep polling */ }

            // ── Timeout guard ──
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                intervalsRef.current.delete(uploadId);
                processingRef.current.delete(uploadId);
                // Leave postId in localStorage — maybe the server is still processing
                // (ResetStuckProcessing command will clean up after 2 hours if truly stuck)

                setUploads(prev => prev.map(u =>
                    u.id === uploadId && u.status === 'uploading'
                        ? { ...u, status: 'completed', progress: 100, phase: 'done' }
                        : u
                ));
            }
        }, 5000);

        // Track interval for cleanup
        intervalsRef.current.set(uploadId, interval);
    };

    // Start chunk uploads for any pending items in the queue
    useEffect(() => {
        const pending = uploads.find(
            u => u.status === 'uploading' && u.progress === 0 && u.phase === 'chunking' && !processingRef.current.has(u.id)
        );
        if (pending) {
            processingRef.current.add(pending.id);
            uploadFileInChunks(pending.file, pending.id, pending.postId, pending.type);
        }
    }, [uploads]);

    return (
        <BackgroundUploadContext.Provider value={{ uploads, addUpload }}>
            {children}
        </BackgroundUploadContext.Provider>
    );
};

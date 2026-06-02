import './bootstrap';
import '../css/app.css';
// import 'react-quill/dist/quill.snow.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ConfigProvider } from 'antd';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();


// Import Ant Design CSS
import { BackgroundUploadProvider } from './Contexts/BackgroundUploadContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `Muslim Hall`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#3b82f6',
                        borderRadius: 6,
                    },
                }}
            >
                <BackgroundUploadProvider>
                    <App {...props} />
                </BackgroundUploadProvider>
            </ConfigProvider>
        );
    },
    progress: {
        color: '#3b82f6',
    },
});
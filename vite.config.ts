import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import basicSsl from "@vitejs/plugin-basic-ssl";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "./dist",
    },
    base: "/bonus-monster/",
    server: {
        proxy: {
            '/api/ipapi': {
                target: 'https://ipapi.co',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/ipapi/, '')
            },
            // Add banner API proxies to solve CORS issues
            '/api/banner': {
                target: 'https://bonusforyou.org',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api\/banner/, '/api/user')
            },
            // Add specific proxy for country-wise-banner-image endpoint
            '/api/country-banner': {
                target: 'https://bonusforyou.org',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api\/country-banner/, '/api/user')
            }
        }
    }
});

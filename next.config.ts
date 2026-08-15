import type { NextConfig } from "next";

// noinspection SpellCheckingInspection
const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '4934.tech',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'olavorw.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: "https",
                hostname: "placehold.co",
                port: "",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;

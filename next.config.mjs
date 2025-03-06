/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
    // Add your production domain here once deployed
    // e.g. domains: ['localhost', 'timesheet.yourcompany.com'],
  },
  // Add analytics if available
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  // Improve production performance
  experimental: {
    // Enable server components for better performance
    serverComponents: true,
    // Optional: HTTP/3 support
    http3: true,
  },
  // Add headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 15
  // Configure image domains if needed
  images: {
    domains: ['localhost'],
    // Add your production domain here once deployed
    // e.g. domains: ['localhost', 'timesheet.yourcompany.com'],
  },
  // Remove analyticsId as it's not a valid top-level option
  
  // Update experimental options to valid ones for Next.js 15
  experimental: {
    // serverComponents is enabled by default in Next.js 13+
    // http3 has been removed from experimental options
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
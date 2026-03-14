/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // API proxy rewrites - only proxy specific FastAPI routes, NOT Next.js API routes
  async rewrites() {
    return [
      { source: '/catalog/:path*', destination: 'http://localhost:8000/catalog/:path*' },
      // NOTE: /api/royalty-finder/*, /api/forensic/*, /api/lawyer-pdf/*, /api/ddex/*, /api/artist-ipi are Next.js routes — NOT proxied
      { source: '/api/health-audit', destination: 'http://localhost:8000/api/health-audit' },
      { source: '/api/identifier-gap', destination: 'http://localhost:8000/api/identifier-gap' },
      { source: '/api/reconcile', destination: 'http://localhost:8000/api/reconcile' },
      { source: '/api/splits', destination: 'http://localhost:8000/api/splits' },
      { source: '/api/rights-ready', destination: 'http://localhost:8000/api/rights-ready' },
    ];
  },
  
  // Optional: Add image domains if you're using Next.js Image component
  images: {
    domains: ['s3.eu-central-2.idrivee2.com', 's3.frankfurt.traproyaltiespro.com'],
  },
}

module.exports = nextConfig

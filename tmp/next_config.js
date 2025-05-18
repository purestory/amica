/** @type {import('next').NextConfig} */
const nextConfig = {
  output,
  reactStrictMode: false,
  assetPrefix: process.env.BASE_PATH || "/amica",
  basePath: process.env.BASE_PATH || "/amica",
  trailingSlash: true,
  publicRuntimeConfig: {
    root: process.env.BASE_PATH || "/amica",
  },
  optimizeFonts: true,
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  swcMinify: true,
  // 모든 인터페이스에서 접속 허용
  devServer: {
    host: '0.0.0.0',
    port: 3100,
    allowedHosts: ['itsmyzone.iptime.org', 'localhost', '127.0.0.1'],
  },
} 
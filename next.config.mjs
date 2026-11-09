/** @type {import('next').NextConfig} */
const config = { reactStrictMode: true, distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next-production' };
export default config;

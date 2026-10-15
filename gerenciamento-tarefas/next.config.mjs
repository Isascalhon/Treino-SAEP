/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: process.cwd() },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;

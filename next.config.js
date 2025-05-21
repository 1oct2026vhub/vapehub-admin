// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: ['vapehub-dev.s3.eu-central-1.amazonaws.com'],
//   },
// }

// module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["vapehub-dev.s3.eu-central-1.amazonaws.com", "www.vapehub.co.uk"],
  },
  experimental: {
    esmExternals: false, // Ensure compatibility with CKEditor
  },
};

export default nextConfig;

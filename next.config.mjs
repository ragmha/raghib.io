/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/projects',
        destination: '/?_page=projects',
      },
    ]
  },
}

export default nextConfig

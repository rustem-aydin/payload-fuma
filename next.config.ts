import { fileURLToPath } from 'node:url'
import bundleAnalyzer from '@next/bundle-analyzer'
import { withBotId } from 'botid/next/config'
import { createMDX } from 'fumadocs-mdx/next'
import { withPayload } from '@payloadcms/next/withPayload' // 1. Payload eklentisini ekledik
import type { NextConfig } from 'next'

async function createNextConfig(): Promise<NextConfig> {
  const { createJiti } = await import('jiti')
  const jiti = createJiti(fileURLToPath(import.meta.url))

  await jiti.import('./src/env')

  const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: process.env.SOURCE_MAPS === 'true',
    devIndicators: false,
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    experimental: {
      viewTransition: true,
      // reactCompiler: true, // Eğer kullanıyorsan açık kalabilir
    },
    images: {
      dangerouslyAllowSVG: true,
      qualities: [100, 75, 85, 95],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'avatars.githubusercontent.com',
          port: '',
        },
        {
          protocol: 'https',
          hostname: 'fumadocs.dev',
          port: '',
        },
        // Yerel geliştirme için resimlerin görünmesini sağlar
        {
          protocol: 'http',
          hostname: 'localhost',
        }
      ],
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    serverExternalPackages: [
      'ts-morph',
      'typescript',
      'oxc-transform',
      'twoslash',
      'twoslash-protocol',
      'shiki',
      '@takumi-rs/image-response',
    ],
    async rewrites() {
      return [
        {
          source: '/posts/:path*.mdx',
          destination: '/blog.mdx/:path*',
        },
      ]
    },
  }

  return nextConfig
}

const bundleAnalyzerPlugin = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const mdxPlugin = createMDX()

const NextApp = async () => {
  const nextConfig = await createNextConfig()
  
  // 2. Eklentiler listesine withPayload'ı ekledik
  // Not: withPayload genelde en dışta veya en içte olmalıdır. 
  // Burada MDX ve Bundle Analyzer ile birlikte işleme sokuyoruz.
  const plugins = [bundleAnalyzerPlugin, mdxPlugin, withPayload] 
  
  const config = plugins.reduce((config, plugin) => plugin(config), nextConfig)
  
  // 3. BotId en son sarmalayıcı olarak kalabilir
  return withBotId(config)
}

export default NextApp
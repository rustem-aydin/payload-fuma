// src/app/posts/[slug]/page.tsx

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Bileşenler
import BlogProgressBar from '@/components/blog/progress-bar'
import { PostJsonLd } from '@/components/json-ld'
import { Section } from '@/components/section'
import RichText from '@/components/RichText' // Önceki adımlarda oluşturduğumuz bileşen
import { Header } from './_components/header'
import { Share } from './page.client'

// Tipler
import type { Post, Media } from '@/payload-types'
import { draftMode } from 'next/headers'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export default async function Page(props: {
  params: Promise<{ slug: string }>
}) {
    const { isEnabled: draft } = await draftMode() // 3. Draft kontrolü yap

  const params = await props.params
  const payload = await getPayload({ config: configPromise })

   const result = await payload.find({
    collection: 'posts',
    draft: draft, 
    where: {
      slug: { equals: params.slug },
    },
    limit: 1,
  })

  const post = result.docs[0] as Post

  if (!post) {
    notFound()
  }

  const authorName = post.populatedAuthors?.[0]?.name || 'Unknown'
  const createdAt = new Date(post.publishedAt || post.createdAt)
  const updatedAt = post.updatedAt ? new Date(post.updatedAt) : undefined

  return (
    <>
          {draft && <LivePreviewListener />}

      <BlogProgressBar />
      
      <Header page={post} />

      <Section className='h-full' sectionClassName='flex flex-1'>
        <article className='flex min-h-full flex-col lg:flex-row'>
          <div className='flex flex-1 flex-col gap-4'>
            
            
            <div className='prose min-w-0 flex-1 px-4 py-8'>
              <RichText data={post.content} enableGutter={false} />
            </div>
         
          </div>

          {/* Sidebar: Yazar ve Tarih Bilgileri */}
          <div className='flex flex-col gap-4 p-4 text-sm lg:sticky lg:top-[4rem] lg:h-[calc(100vh-4rem)] lg:w-[250px] lg:self-start lg:overflow-y-auto lg:border-border lg:border-l lg:border-dashed'>
            <div>
              <p className='mb-1 text-fd-muted-foreground'>Written by</p>
              <p className='font-medium'>{authorName}</p>
            </div>
            <div>
              <p className='mb-1 text-fd-muted-foreground text-sm'>Created At</p>
              <p className='font-medium'>{createdAt.toDateString()}</p>
            </div>
            {updatedAt && (
              <div>
                <p className='mb-1 text-fd-muted-foreground text-sm'>Updated At</p>
                <p className='font-medium'>{updatedAt.toDateString()}</p>
              </div>
            )}
            <Share url={`/posts/${post.slug}`} />
          </div>
        </article>
      </Section>
      
      {/* JSON-LD için post verisini uyarlaman gerekebilir */}
      <PostJsonLd page={post} />
    </>
  )
}

// SEO Metadata Ayarları
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const params = await props.params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: params.slug } },
    limit: 1,
  })

  const post = result.docs[0] as Post
  if (!post) return {}

  const image = typeof post.meta?.image === 'object' 
    ? (post.meta.image as Media).url 
    : undefined

  return {
    title: post.meta?.title || post.title,
    description: post.meta?.description,
    openGraph: {
      url: `/posts/${post.slug}`,
      images: image ? [image] : [],
    },
  }
}

// Statik Parametreler (Build zamanı sayfaları oluşturmak için)
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    limit: 1000,
    select: { slug: true },
  })

  return posts.docs.map((post) => ({
    slug: post.slug,
  }))
}
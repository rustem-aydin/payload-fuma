import type { BlogPosting, BreadcrumbList, Graph } from 'schema-dts'
import { baseUrl } from '@/constants'
import { title as homeTitle, owner } from '@/constants/site'
import type { Post, Media } from '@/payload-types' // Payload tiplerini ekledik

// BlogPage yerine Post kullanıyoruz
export const PostJsonLd = ({ page }: { page: Post }) => {
  if (!page) {
    return null
  }

  // Payload'da .url yoktur, manuel oluşturuyoruz
  const postUrl = new URL(`/posts/${page.slug}`, baseUrl.href).href
  
  // Resim URL'sini al
  const imageUrl = typeof page.meta?.image === 'object' 
    ? (page.meta.image as Media).url 
    : new URL(`/og/${page.slug}/image.webp`, baseUrl.href).href

  const post: BlogPosting = {
    '@type': 'BlogPosting',
    headline: page.title, // page.data.title -> page.title
    description: page.meta?.description || '',
    image: imageUrl || '',
    datePublished: new Date(page.publishedAt || page.createdAt).toISOString(),
    dateModified: page.updatedAt ? new Date(page.updatedAt).toISOString() : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    author: {
      '@type': 'Person',
      name: page.populatedAuthors?.[0]?.name || 'Unknown',
    },
    publisher: {
      '@type': 'Person',
      name: owner,
      url: baseUrl.href,
    },
  }

  const breadcrumbList: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeTitle,
        item: baseUrl.href,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${homeTitle} | Posts`,
        item: new URL('/posts', baseUrl.href).href,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.title,
        item: postUrl,
      },
    ],
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [post, breadcrumbList],
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      type='application/ld+json'
    />
  )
}

export const TagJsonLd = ({ tag }: { tag: string }) => {
  const breadcrumbList: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeTitle,
        item: baseUrl.href,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `${homeTitle} | Tags`,
        item: new URL('/tags', baseUrl.href).href,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${homeTitle} | Posts tagged with ${tag}`,
        item: new URL(`/tags/${tag}`, baseUrl.href).href,
      },
    ],
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [breadcrumbList],
  }

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires inline script content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      type='application/ld+json'
    />
  )
}
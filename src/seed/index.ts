import type { CollectionSlug, Payload, PayloadRequest, File } from 'payload'

// Veri dosyalarını import ediyoruz
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

// Sadece senin projende var olan koleksiyonları buraya yazıyoruz
const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'users',
]

// Kategoriler listesi
const categories = ['Teknoloji', 'Haberler', 'Yazılım', 'Tasarım', 'Mühendislik']

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Veritabanı seed işlemi başlatılıyor...')

  // 1. Mevcut verileri temizliyoruz (Sıfırdan başlamak için)
  payload.logger.info(`— Eski veriler temizleniyor...`)
  
  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  payload.logger.info(`— Kullanıcı ve Medya dosyaları oluşturuluyor...`)

  // Resim dosyalarını GitHub üzerinden çekiyoruz (Test için harika)
  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL('https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp'),
    fetchFileByURL('https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp'),
    fetchFileByURL('https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp'),
    fetchFileByURL('https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp'),
  ])

  // Admin Kullanıcısı, Resimler ve Kategorileri oluşturuyoruz
  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Admin Kullanıcı',
        email: 'demo-author@example.com',
        password: 'password',
      },
    }),
    payload.create({ collection: 'media', data: image1, file: image1Buffer }),
    payload.create({ collection: 'media', data: image2, file: image2Buffer }),
    payload.create({ collection: 'media', data: image2, file: image3Buffer }),
    payload.create({ collection: 'media', data: imageHero1, file: hero1Buffer }),
    // Kategorileri döngüyle oluştur
    ...categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: { title: category, slug: category.toLowerCase() },
      }),
    ),
  ])

  payload.logger.info(`— Blog yazıları (Posts) oluşturuluyor...`)

  // Yazıları sırayla oluşturuyoruz (Tarih sırası bozulmasın diye)
  const post1Doc = await payload.create({
    collection: 'posts',
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: demoAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: demoAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: demoAuthor }),
  })

  // Yazıları birbirine "İlgili Yazılar" olarak bağlıyoruz
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: { relatedPosts: [post2Doc.id, post3Doc.id] },
  })

  payload.logger.info(`— Sayfalar (Pages) oluşturuluyor...`)

  await payload.create({
    collection: 'pages',
    data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
  })

  payload.logger.info('Seed işlemi başarıyla tamamlandı! Artık admin paneline girebilirsin.')
}

// Resimleri URL'den Buffer'a çeviren yardımcı fonksiyon
async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url)
  const data = await res.arrayBuffer()
  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
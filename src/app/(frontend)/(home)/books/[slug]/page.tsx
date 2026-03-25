import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import {
  BookOpenIcon,
  CalendarIcon,
  EyeIcon,
  MessageCircleIcon,
  UserIcon,
  Barcode,
  FileTextIcon,
  GlobeIcon,
  ChevronLeftIcon,
} from "lucide-react";

import { Section } from "@/components/section";
import { Wrapper } from "@/components/wrapper";
import { BlurImage } from "@/components/blur-image";
import { createMetadata } from "@/lib/metadata";
// Kendi RichText render bileşeninin yolunu buraya eklemelisin:
// import { RichText } from "@/components/RichText";

import type { Doc } from "@/payload-types";
import { CommentsSection } from "@/components/Pages/Docs/comment-section";

// Next.js 15'te params await edilmelidir
export default async function BookDetailsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const payload = await getPayload({ config: configPromise });

  // 1. Kitabı Slug ile Veritabanından Çek
  const { docs } = await payload.find({
    collection: "docs",
    where: { slug: { equals: params.slug } },
    limit: 1,
    depth: 1, // Kategori ve Medya objelerini dolu getirmek için
  });

  const book = docs[0] as Doc | undefined;

  if (!book) {
    notFound();
  }

  // Görüntülenme Sayısını Artırma (Opsiyonel: Eğer sunucu tarafında her girişte artmasını istersen)
  // await payload.update({ collection: 'books', id: book.id, data: { viewCount: (book.viewCount ?? 0) + 1 } })

  // Verileri Düzenleme
  const coverImageUrl =
    typeof book.coverImage === "object" && book.coverImage?.url
      ? book.coverImage.url
      : null;

  const categories =
    book.category?.map((cat) =>
      typeof cat === "object" ? cat.title : "Kategori",
    ) || [];

  return (
    <Wrapper>
      <Section className="py-8 lg:py-12">
        {/* Geri Dönüş Butonu */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground mb-8"
        >
          <ChevronLeftIcon className="size-4" />
          Kitaplara Dön
        </Link>

        {/* 1. ÜST KISIM (KAPAK VE ANA BİLGİLER) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-16">
          {/* Sol: Kitap Kapağı */}
          <div className="md:col-span-4 lg:col-span-3">
            {coverImageUrl ? (
              <BlurImage
                src={coverImageUrl}
                alt={book.title}
                width={600}
                height={800}
                className="w-full rounded-xl object-cover shadow-2xl aspect-[3/4]"
              />
            ) : (
              <div className="flex w-full items-center justify-center rounded-xl bg-muted aspect-[3/4]">
                <BookOpenIcon className="size-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Sağ: Kitap Başlığı ve Özet Bilgiler */}
          <div className="flex flex-col justify-center md:col-span-8 lg:col-span-9 space-y-6">
            {/* Kategoriler */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              <Balancer>{book.title}</Balancer>
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground text-lg">
                <UserIcon className="size-5" />
                {book.author}
              </span>
              <span className="hidden sm:inline-block text-border">•</span>
              <span className="flex items-center gap-2" title="Yayın Tarihi">
                <CalendarIcon className="size-5" />
                {book.publishedDate
                  ? new Date(book.publishedDate).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Bilinmiyor"}
              </span>
            </div>

            <div className="flex items-center gap-6 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <EyeIcon className="size-5 text-muted-foreground" />
                <span className="font-medium">{book.viewCount ?? 0}</span>
                <span className="text-muted-foreground text-sm">
                  Görüntülenme
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircleIcon className="size-5 text-muted-foreground" />
                <span className="font-medium">{book.commentCount ?? 0}</span>
                <span className="text-muted-foreground text-sm">Yorum</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 2. ORTA KISIM (AÇIKLAMA VE KÜNYE) */}
      <Section className="border-t border-border/50 py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Sol: Geniş Açıklama (RichText) Alanı */}
          <div className="lg:col-span-8 prose prose-neutral dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mb-6">Kitap Hakkında</h2>

            {/* Payload'dan gelen RichText verisini burada kendi bileşeninle render etmelisin. 
                Örnek: <RichText content={book.description} /> 
                Aşağıdaki sadece fallback (geçici) bir metin gösterimidir: */}
            {book.description ? (
              <div className="text-muted-foreground leading-relaxed text-lg">
                {/* Burada Payload'un kendi Lexical veya Slate render'ı olmalı */}
                <p>Kitabın açıklaması buraya gelecek...</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Bu kitap için henüz bir açıklama girilmemiş.
              </p>
            )}
          </div>

          {/* Sağ: Kitap Künyesi (Sidebar) */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card/50 p-6 space-y-6 sticky top-24">
              <h3 className="font-semibold text-lg border-b border-border pb-4">
                Kitap Künyesi
              </h3>

              <ul className="space-y-4 text-sm">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Barcode className="size-4" /> ISBN
                  </span>
                  <span className="font-medium">
                    {book.isbn || "Belirtilmemiş"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileTextIcon className="size-4" /> Sayfa Sayısı
                  </span>
                  <span className="font-medium">
                    {book.pageCount
                      ? `${book.pageCount} Sayfa`
                      : "Belirtilmemiş"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <GlobeIcon className="size-4" /> Dil
                  </span>
                  <span className="font-medium uppercase">
                    {book.language === "en" ? "İngilizce" : "Türkçe"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. ALT KISIM (YORUMLAR) */}
      <Section className="border-t border-border/50 py-12 bg-dashed">
        {/* Yorumlar bileşenini ayrı bir dosyaya ayırıyoruz */}
        <CommentsSection
          bookId={book.id}
          initialCommentCount={book.commentCount ?? 0}
        />
      </Section>
    </Wrapper>
  );
}

// SEO ve Metadata
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const payload = await getPayload({ config: configPromise });

  const { docs } = await payload.find({
    collection: "docs",
    where: { slug: { equals: params.slug } },
    limit: 1,
  });

  const book = docs[0] as Doc | undefined;

  if (!book) return createMetadata({ title: "Bulunamadı" });

  const coverUrl =
    typeof book.coverImage === "object" && book.coverImage?.url
      ? book.coverImage.url
      : undefined;

  return createMetadata({
    title: `${book.title} - ${book.author}`,
    description: `Yazar: ${book.author}. Kitap hakkında detaylı bilgi, yorumlar ve incelemeler.`,
    openGraph: {
      url: `/books/${book.slug}`,
      images: coverUrl ? [{ url: coverUrl }] : [],
    },
  });
}

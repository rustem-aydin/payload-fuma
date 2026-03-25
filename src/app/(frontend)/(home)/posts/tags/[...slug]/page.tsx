import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import type { Post, Media, Category } from "@/payload-types";

import { PostCard } from "@/components/blog/post-card";
import { Icons } from "@/components/icons/icons";
import { TagJsonLd } from "@/components/json-ld";
import { NumberedPagination } from "@/components/numbered-pagination";
import { Section } from "@/components/section";
import { HeroSection } from "@/components/sections/hero";
import { ViewAnimation } from "@/components/view-animation";
import { postsPerPage } from "@/constants/config";
import { createMetadata } from "@/lib/metadata";

export const dynamicParams = true;

// --- BİLEŞENLER ---

const CurrentPostsCount = ({
  startIndex,
  endIndex,
  totalDocs,
}: {
  startIndex: number;
  endIndex: number;
  totalDocs: number;
}) => {
  const start = startIndex + 1;
  const end = endIndex < totalDocs ? endIndex : totalDocs;

  if (start === end) {
    return <span>({start})</span>;
  }
  return (
    <span>
      ({start}-{end})
    </span>
  );
};

const Header = ({
  tag,
  startIndex,
  endIndex,
  totalDocs,
}: {
  tag: string;
  startIndex: number;
  endIndex: number;
  totalDocs: number;
}) => (
  <HeroSection
    align="start"
    title={
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <Icons.tag
            className="text-muted-foreground transition-transform hover:rotate-12 hover:scale-125"
            size={20}
          />
          {tag} <span className="text-muted-foreground">Yazıları</span>{" "}
          <CurrentPostsCount
            endIndex={endIndex}
            startIndex={startIndex}
            totalDocs={totalDocs}
          />
        </span>
      </div>
    }
    variant="compact"
  />
);

const Pagination = ({
  pageIndex,
  tag,
  totalPages,
}: {
  pageIndex: number;
  tag: string;
  totalPages: number;
}) => {
  const handlePageChange = async (page: number) => {
    "use server";
    redirect(`/tags/${tag}?page=${page}`);
  };

  return (
    <Section className="bg-dashed">
      <NumberedPagination
        currentPage={pageIndex + 1}
        onPageChange={handlePageChange}
        paginationItemsToDisplay={5}
        totalPages={totalPages}
      />
    </Section>
  );
};

// --- SAYFA ---

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });

  // 1. Array index erişiminde undefined gelebilir, kontrol et.
  const tagSlug = params.slug?.[0];

  // Eğer tagSlug yoksa 404 dön (Bu satır sayesinde TS aşağıda tagSlug'ın string olduğundan emin olur)
  if (!tagSlug) {
    return notFound();
  }

  // 1. searchParams'dan gelen değeri ham olarak al
  const rawPage = searchParams.page;

  // 2. Array ise ilk elemanı, değilse kendisini al
  // (rawPage[0] undefined olabilir, bu yüzden '||' ile kontrol ediyoruz)
  const pageString = Array.isArray(rawPage) ? rawPage[0] : rawPage;

  // 3. Sayıya çevir (Eğer pageString undefined veya boş ise "1" varsay)
  const pageParam = Number.parseInt(pageString || "1", 10);
  const currentPage = pageParam > 0 ? pageParam : 1;

  const categoryQuery = await payload.find({
    collection: "categories",
    where: {
      slug: { equals: tagSlug },
    },
    limit: 1,
  });

  if (categoryQuery.totalDocs === 0) {
    return notFound();
  }

  const categoryData = categoryQuery.docs[0];
  // DÜZELTME 1: Başlığın string olmasını garanti et
  const displayTitle = categoryData?.title || tagSlug || "Etiket";

  const postsQuery = await payload.find({
    collection: "posts",
    where: {
      "categories.slug": { equals: tagSlug },
      _status: { equals: "published" },
    },
    limit: postsPerPage,
    page: currentPage,
    sort: "-publishedAt",
    depth: 1,
  });

  const { docs: posts, totalDocs, totalPages } = postsQuery;

  if (currentPage > totalPages && totalPages > 0) {
    return notFound();
  }

  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + posts.length;

  return (
    <>
      <Header
        endIndex={endIndex}
        startIndex={startIndex}
        tag={displayTitle}
        totalDocs={totalDocs}
      />
      <Section className="h-full" sectionClassName="flex flex-1">
        <div className="grid divide-y divide-dashed divide-border text-left">
          {posts.map((post, index) => {
            const date = new Date(
              post.publishedAt || post.createdAt,
            ).toDateString();

            const metaImage =
              post.meta?.image && typeof post.meta.image === "object"
                ? (post.meta.image as Media).url
                : null;
            const heroImage =
              post.heroImage && typeof post.heroImage === "object"
                ? (post.heroImage as Media).url
                : null;
            const finalImage = metaImage || heroImage || undefined;

            const authorName =
              post.populatedAuthors?.[0]?.name || "Unknown Author";

            const tagsList =
              post.categories
                ?.map((cat) => {
                  if (typeof cat === "object" && cat !== null) {
                    return (cat as Category).title;
                  }
                  return null;
                })
                .filter((t): t is string => t !== null) || [];

            return (
              <ViewAnimation
                delay={0.05 * index}
                initial={{ opacity: 0, translateY: -6 }}
                key={post.id}
                whileInView={{ opacity: 1, translateY: 0 }}
              >
                <PostCard
                  author={authorName}
                  date={date}
                  description={post.meta?.description ?? ""}
                  image={finalImage}
                  index={index}
                  // DÜZELTME 2: Slug'ın string olmasını garanti et
                  slugs={[post.slug || ""]}
                  tags={tagsList}
                  title={post.title}
                  // DÜZELTME 3: post.slug undefined ise boş string kullan
                  url={`/posts/${post.slug || ""}`}
                />
              </ViewAnimation>
            );
          })}
        </div>
      </Section>

      {totalPages > 1 && (
        <Pagination
          pageIndex={currentPage - 1}
          tag={tagSlug}
          totalPages={totalPages}
        />
      )}

      <TagJsonLd tag={tagSlug} />
    </>
  );
}

// --- STATIC PARAMS ---

export const generateStaticParams = async () => {
  const payload = await getPayload({ config: configPromise });

  const categories = await payload.find({
    collection: "categories",
    limit: 100,
  });

  const params: { slug: string[] }[] = [];

  for (const cat of categories.docs) {
    // Sadece slug'ı olan kategorileri işle
    if (!cat.slug) continue;

    params.push({ slug: [cat.slug] });
  }

  return params;
};

// --- METADATA ---

interface Props {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  props: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });

  const tagSlug = params.slug?.[0];

  // DÜZELTME 4: Metadata içinde de tagSlug kontrolü yap
  if (!tagSlug) return {};

  const pageIndex = searchParams.page
    ? Number.parseInt(searchParams.page.toString(), 10)
    : 1;

  const catQuery = await payload.find({
    collection: "categories",
    where: { slug: { equals: tagSlug } },
    limit: 1,
  });

  // DÜZELTME 5: Başlığın string olmasını garanti et
  const categoryTitle = catQuery.docs[0]?.title || tagSlug || "Kategori";

  const isFirstPage = pageIndex === 1 || !searchParams.page;
  const pageTitle = isFirstPage
    ? `${categoryTitle} Yazıları`
    : `${categoryTitle} Yazıları - Sayfa ${pageIndex}`;
  const canonicalUrl = isFirstPage
    ? `/tags/${tagSlug}`
    : `/tags/${tagSlug}?page=${pageIndex}`;

  return createMetadata({
    title: pageTitle,
    description: `${categoryTitle} ile etiketlenmiş yazılar.${
      isFirstPage ? "" : ` - Sayfa ${pageIndex}`
    }`,
    openGraph: {
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  });
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";

// Bileşenler
import { NumberedPagination } from "@/components/numbered-pagination";
import { Section } from "@/components/section";
import { Wrapper } from "@/components/wrapper";
import { postsPerPage } from "@/constants/config";
import { createMetadata } from "@/lib/metadata";
import { Hero } from "./_components/hero";
import Posts from "./_components/posts";
import { TagsAccordion, TagsSidebar } from "./_components/tags-sidebar";

import type { Post } from "@/payload-types";

export const dynamicParams = true;

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });

  const query =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const currentPage = searchParams.page
    ? Number.parseInt(searchParams.page as string, 10)
    : 1;

  let fetchedPosts: Post[] = [];
  let totalPages = 0;
  let totalDocs = 0;

  if (query) {
    const searchResults = await payload.find({
      collection: "search",
      depth: 0, // Depth 0 yapıyoruz, sadece ID'ler lazım
      limit: postsPerPage,
      page: currentPage,
      where: {
        or: [
          { title: { like: query } },
          { "meta.description": { like: query } },
          { "meta.title": { like: query } },
          { slug: { like: query } },
        ],
      },
    });

    // 2. ADIM: Sonuçlardan ID'leri ayıkla (Sağlam Mantık)
    const foundIds = searchResults.docs
      .map((item: any) => {
        // doc.value bazen obje { id: 3, ... }, bazen direkt ID (3) olabilir.
        // Her iki durumu da kapsıyoruz:
        if (
          item.doc?.value &&
          typeof item.doc.value === "object" &&
          "id" in item.doc.value
        ) {
          return item.doc.value.id;
        }
        return item.doc?.value; // Obje değilse direkt değer ID'dir
      })
      .filter((id) => id !== null && id !== undefined);

    if (foundIds.length > 0) {
      const postsQuery = await payload.find({
        collection: "posts",
        limit: postsPerPage,
        pagination: false, // Sayfalamayı zaten searchResults ile yaptık
        where: {
          id: { in: foundIds }, // Bulunan ID'leri ver
          _status: { equals: "published" }, // Sadece yayınlanmış olanlar
        },
      });

      // Sıralamayı korumak istersek (Opsiyonel):
      // Payload 'in' sorgusunda sıralamayı garanti etmez, searchResults sırasına göre dizebiliriz.
      fetchedPosts = postsQuery.docs as Post[];
    } else {
      fetchedPosts = [];
    }
    totalPages = searchResults.totalPages;
    totalDocs = searchResults.totalDocs;
  } else {
    const posts = await payload.find({
      collection: "posts",
      limit: postsPerPage,
      page: currentPage,
      sort: "-publishedAt",
      where: {
        _status: { equals: "published" },
      },
    });

    fetchedPosts = posts.docs;
    totalPages = posts.totalPages;
    totalDocs = posts.totalDocs;
  }

  if (totalDocs === 0 && currentPage > 1) {
    notFound();
  }

  const categories = await payload.find({
    collection: "categories",
    limit: 100,
  });

  const tags = categories.docs.map((cat) => ({
    name: cat.title,
    count: 0,
    slug: cat.slug,
  }));
  return (
    <Wrapper>
      <Hero
        endIndex={Math.min(currentPage * postsPerPage, totalDocs)}
        startIndex={totalDocs > 0 ? (currentPage - 1) * postsPerPage + 1 : 0}
        totalPosts={totalDocs}
      />

      <Section className="h-full" sectionClassName="flex flex-1">
        <div className="grid h-full lg:grid-cols-[1fr_280px]">
          <div className="min-w-0 lg:border-border lg:border-r lg:border-dashed">
            <div className="border-border border-b border-dashed px-4 py-2.5 lg:hidden">
              <TagsAccordion tags={tags} />
            </div>

            <Posts
              className="h-full border-none"
              posts={fetchedPosts}
              sectionClassName="flex flex-1"
            />
          </div>

          <aside className="hidden lg:block">
            <TagsSidebar tags={tags} />
          </aside>
        </div>
      </Section>

      {totalPages > 1 && (
        <Section className="bg-dashed">
          <NumberedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={async (page) => {
              "use server";
              // Mevcut arama terimini koruyarak sayfa değiştir
              const params = new URLSearchParams();
              if (query) params.set("search", query);
              params.set("page", page.toString());
              redirect(`/posts?${params.toString()}`);
            }}
            paginationItemsToDisplay={5}
          />
        </Section>
      )}
    </Wrapper>
  );
}

// Metadata (SEO)
export async function generateMetadata(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const pageIndex = searchParams.page
    ? Number.parseInt(searchParams.page as string, 10)
    : 1;
  const query =
    typeof searchParams.search === "string" ? searchParams.search : undefined;

  let title = "Blog Yazıları";
  if (query) title = `"${query}" için Arama Sonuçları`;
  if (pageIndex > 1) title += ` - Sayfa ${pageIndex}`;

  return createMetadata({
    title: title,
    description: "En güncel blog yazıları ve teknoloji haberleri.",
    openGraph: {
      url: `/posts`,
    },
  });
}

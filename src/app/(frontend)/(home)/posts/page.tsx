import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";

// Bileşenler
import { NumberedPagination } from "@/components/numbered-pagination";
import { Section } from "@/components/section";
import { Wrapper } from "@/components/wrapper";
import { createMetadata } from "@/lib/metadata";
import { Hero } from "./_components/hero";
import { FilterAccordion } from "./_components/filter-accordion";

import type { Post } from "@/payload-types";
import { getCachedCategoriesWithCount } from "./tags/action";
import Updates from "./_components/posts";

export const dynamicParams = true;

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });

  const query =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const selectedCategories = Array.isArray(searchParams.categories)
    ? searchParams.categories
    : searchParams.categories
      ? [searchParams.categories]
      : [];
  const currentPage = searchParams.page
    ? Number.parseInt(searchParams.page as string, 10)
    : 1;

  let fetchedPosts: Post[] = [];
  let totalPages = 0;
  let totalDocs = 0;

  if (query) {
    const searchResults = await payload.find({
      collection: "search",
      depth: 0,
      limit: 5,
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
        limit: 5,
        pagination: false, // Sayfalamayı zaten searchResults ile yaptık
        where: {
          id: { in: foundIds }, // Bulunan ID'leri ver
          _status: { equals: "published" }, // Sadece yayınlanmış olanlar
        },
      });

      fetchedPosts = postsQuery.docs as Post[];
    } else {
      fetchedPosts = [];
    }
    totalPages = searchResults.totalPages;
    totalDocs = searchResults.totalDocs;
  } else {
    const posts = await payload.find({
      collection: "posts",
      limit: 5,
      page: currentPage,
      sort: "-publishedAt",
      where: {
        _status: { equals: "published" },
        ...(selectedCategories.length > 0 && {
          "categories.slug": { in: selectedCategories },
        }),
      },
    });

    fetchedPosts = posts.docs;
    totalPages = posts.totalPages;
    totalDocs = posts.totalDocs;
  }

  if (totalDocs === 0 && currentPage > 1) {
    notFound();
  }

  const categoryList = await getCachedCategoriesWithCount();

  return (
    <Wrapper>
      <Hero
        endIndex={Math.min(currentPage * 5, totalDocs)}
        startIndex={totalDocs > 0 ? (currentPage - 1) * 5 + 1 : 0}
        totalPosts={totalDocs}
      />
      <Section className="h-full" sectionClassName="flex flex-1">
        <div className="min-w-0 lg:border-border lg:border-r lg:border-dashed">
          <div className="border-border border-b border-dashed px-4 py-2.5 ">
            <FilterAccordion categories={categoryList} />
          </div>

          <Updates posts={fetchedPosts} />
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

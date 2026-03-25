import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";

// Bileşenler
import { NumberedPagination } from "@/components/numbered-pagination";
import { Section } from "@/components/section";
import { Wrapper } from "@/components/wrapper";
import { createMetadata } from "@/lib/metadata";

// Tip ve Aksiyonlar
import type { Doc } from "@/payload-types"; // payload-types içinden Book'u çekiyoruz
import { Hero } from "../posts/_components/hero";
import BooksGrid from "@/components/Pages/Docs/docs-grid";
// import { getCachedCategoriesWithCount } from "./categories/action"; // Blogdaki tags yerine kitaplar için categories çektiğini varsayıyoruz

export const dynamicParams = true;

export default async function BooksPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const payload = await getPayload({ config: configPromise });

  const query =
    typeof searchParams.search === "string" ? searchParams.search : undefined;
  const currentPage = searchParams.page
    ? Number.parseInt(searchParams.page as string, 10)
    : 1;

  let fetchedBooks: Doc[] = [];
  let totalPages = 0;
  let totalDocs = 0;

  if (query) {
    // ARAMA YAPILDIYSA
    const searchResults = await payload.find({
      collection: "search",
      depth: 0,
      limit: 12, // Kitaplarda grid yapısı olacağı için 5 yerine 12 (3x4) veya 9 (3x3) daha şık durur
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

    // Sonuçlardan ID'leri ayıkla
    const foundIds = searchResults.docs
      .map((item: any) => {
        if (
          item.doc?.value &&
          typeof item.doc.value === "object" &&
          "id" in item.doc.value
        ) {
          return item.doc.value.id;
        }
        return item.doc?.value;
      })
      .filter((id) => id !== null && id !== undefined);

    if (foundIds.length > 0) {
      const booksQuery = await payload.find({
        collection: "docs",
        limit: 12,
        pagination: false,
        where: {
          id: { in: foundIds },
          // Eğer books koleksiyonunda drafts (taslaklar) aktifse burayı açabilirsin:
          // _status: { equals: "published" },
        },
      });

      fetchedBooks = booksQuery.docs as Doc[];
    } else {
      fetchedBooks = [];
    }
    totalPages = searchResults.totalPages;
    totalDocs = searchResults.totalDocs;
  } else {
    // ARAMA YOKSA DİREKT LİSTELE
    const booksQuery = await payload.find({
      collection: "docs",
      limit: 12, // Grid için 12 adet ideal
      page: currentPage,
      sort: "-publishedDate", // Bizim oluşturduğumuz 'publishedDate' veya '-createdAt' kullanabilirsin
      // where: { _status: { equals: "published" } }, // Draft aktifse kullan
    });

    fetchedBooks = booksQuery.docs as Doc[];
    totalPages = booksQuery.totalPages;
    totalDocs = booksQuery.totalDocs;
  }

  if (totalDocs === 0 && currentPage > 1) {
    notFound();
  }

  // Kitap kategorilerini getirdiğimiz varsayılan fonksiyon (Kendi yapına göre uyarla)
  // const categoriesList = await getCachedCategoriesWithCount();

  return (
    <Wrapper>
      <Hero
        endIndex={Math.min(currentPage * 12, totalDocs)}
        startIndex={totalDocs > 0 ? (currentPage - 1) * 12 + 1 : 0}
        totalPosts={totalDocs} // Hero bileşeni totalPosts prop'u alıyorsa böyle kalabilir
      />
      <Section className="h-full" sectionClassName="flex flex-1">
        <div className="min-w-0 flex-1 lg:border-border lg:border-r lg:border-dashed">
          {/* Mobilde Kategoriler / Filtreler */}
          {/* <div className="border-border border-b border-dashed px-4 py-2.5 lg:hidden">
            <TagsAccordion tags={categoriesList} />
          </div> */}

          {/* Kitaplar Listesi */}
          <div className="p-4 md:p-6 lg:p-8">
            <BooksGrid books={fetchedBooks} />
          </div>
        </div>
      </Section>

      {totalPages > 1 && (
        <Section className="bg-dashed border-t border-border">
          <NumberedPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={async (page) => {
              "use server";
              const params = new URLSearchParams();
              if (query) params.set("search", query);
              params.set("page", page.toString());
              redirect(`/docs?${params.toString()}`); // Yönlendirme /books sayfasına yapılıyor
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

  let title = "Kitaplar & Yayınlar";
  if (query) title = `"${query}" için Kitap Arama Sonuçları`;
  if (pageIndex > 1) title += ` - Sayfa ${pageIndex}`;

  return createMetadata({
    title: title,
    description: "Sitemizde yer alan tüm kitapları ve yayınları inceleyin.",
    openGraph: {
      url: `/books`,
    },
  });
}

import type React from "react";
import type { Doc } from "@/payload-types"; // Payload tipleri
import { BookCard } from "./DocsCard";

interface BooksGridProps {
  books: Doc[];
}

const BooksGrid: React.FC<BooksGridProps> = ({ books }) => {
  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-lg">Herhangi bir kitap bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => {
        // Payload'dan gelen Media objesinden URL'i ayıklıyoruz
        const imageUrl =
          typeof book.coverImage === "object" && book.coverImage?.url
            ? book.coverImage.url
            : null;

        // Kategorileri string array olarak ayıklıyoruz
        const categories =
          book.category?.map((cat: any) =>
            typeof cat === "object" ? cat.title : "Kategori",
          ) || [];

        return (
          <BookCard
            key={book.id}
            title={book.title}
            description={
              book.description ? "Kitap açıklaması..." : "Açıklama bulunmuyor."
            }
            coverImage={imageUrl}
            url={`/docs/${book.slug}`}
            publishedDate={
              book.publishedDate
                ? new Date(book.publishedDate).toLocaleDateString("tr-TR")
                : "Tarih Yok"
            }
            author={book.author}
            categories={categories}
            // ÇÖZÜM BURADA: ?? 0 ekleyerek null gelirse 0 olmasını sağlıyoruz
            viewCount={book.viewCount ?? 0}
            commentCount={book.commentCount ?? 0}
          />
        );
      })}
    </div>
  );
};

export default BooksGrid;

import {
  CalendarIcon,
  UserIcon,
  EyeIcon,
  MessageCircleIcon,
  BookOpenIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "@/components/blur-image";

// Payload'dan gelecek verilere uygun olarak Props'ları güncelledik
interface BookCardProps {
  title: string;
  description: string; // Payload'dan gelen richText'i frontend'de düz metne çevirip (excerpt) buraya yollamalısın
  coverImage?: string | null;
  url: string; // slug kullanılarak oluşturulan link (örn: `/books/hukuk-yargilamasi`)
  publishedDate: string;
  author: string;
  categories?: string[]; // Payload'daki relationTo: 'categories' alanından gelen kategori isimleri
  viewCount?: number;
  commentCount?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
  title,
  description,
  coverImage,
  url,
  publishedDate,
  author,
  categories,
  viewCount = 0,
  commentCount = 0,
}) => {
  return (
    <Link
      className="group flex flex-col gap-4 bg-card/50 p-6 transition-colors hover:bg-card/80 rounded-xl"
      href={url}
    >
      {coverImage && (
        // aspect-video yerine kitap kapaklarına uygun olan aspect-[3/4] kullanıldı.
        // object-cover ile görselin bozulmadan alana yayılması sağlandı.
        <BlurImage
          alt={title}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-background object-cover shadow-sm transition-transform group-hover:scale-102"
          height={600}
          width={450}
          src={coverImage}
        />
      )}

      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Kategoriler (Varsa) */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  <BookOpenIcon className="size-3" />
                  {category}
                </span>
              ))}
            </div>
          )}

          <h2 className="font-medium text-lg md:text-xl lg:text-2xl">
            <Balancer>{title}</Balancer>
          </h2>
          <p className="line-clamp-3 overflow-hidden text-ellipsis text-medium text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Alt Bilgi (Footer): Yazar, Tarih, İstatistikler */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-3">
            <span className="group/icon inline-flex items-center gap-1 capitalize">
              <UserIcon className="size-4 transition-transform group-hover/icon:scale-125" />
              <span className="line-clamp-1">{author}</span>
            </span>
            <span>•</span>
            <span className="group/icon inline-flex items-center gap-1">
              <CalendarIcon className="size-4 transition-transform group-hover/icon:scale-125" />
              {publishedDate}
            </span>
          </div>

          {/* Görüntülenme ve Yorum Sayısı */}
          <div className="flex items-center gap-3">
            {viewCount > 0 && (
              <span
                className="inline-flex items-center gap-1"
                title="Görüntülenme"
              >
                <EyeIcon className="size-4" />
                {viewCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1" title="Yorumlar">
                <MessageCircleIcon className="size-4" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

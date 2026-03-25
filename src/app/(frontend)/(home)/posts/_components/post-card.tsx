import { CalendarIcon, UserIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import type React from "react";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "@/components/blur-image";
import type { Media, Post } from "@/payload-types";

interface UpdateCardProps {
  post: Post;
}

function getImageUrl(image: Post["heroImage"]): string | null {
  if (!image || typeof image === "number") return null;
  return (image as Media).url ?? null;
}

function getImageAlt(image: Post["heroImage"], fallback: string): string {
  if (!image || typeof image === "number") return fallback;
  return (image as Media).alt ?? fallback;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getAuthorName(post: Post): string {
  // populatedAuthors öncelikli, yoksa authors alanından dene
  if (post.populatedAuthors?.length) {
    return post.populatedAuthors
      .map((a) => a.name)
      .filter(Boolean)
      .join(", ");
  }
  if (typeof post.authors === "object" && post.authors !== null) {
    return (post.authors as { name?: string }).name ?? "Bilinmeyen Yazar";
  }
  return "Bilinmeyen Yazar";
}

function getDescription(post: Post): string {
  return post.meta?.description ?? "";
}

function getCategories(post: Post): string[] {
  if (!post.categories?.length) return [];
  return post.categories
    .filter(
      (c: any): c is { id: number; title: string; slug: string } =>
        typeof c === "object",
    )
    .map((c: any) => c.title);
}

export const PostCard: React.FC<UpdateCardProps> = ({ post }) => {
  const imageUrl = getImageUrl(post.heroImage);
  const imageAlt = getImageAlt(post.heroImage, post.title);
  const author = getAuthorName(post);
  const date = formatDate(post.publishedAt ?? post.createdAt);
  const description = getDescription(post);
  const categories = getCategories(post);
  const url = `/posts/${post.slug}`;

  return (
    <Link
      className="group flex flex-col gap-4 bg-card/50 p-6 transition-colors hover:bg-card/80"
      href={url}
    >
      {imageUrl && (
        <BlurImage
          alt={imageAlt}
          className="relative aspect-video w-full overflow-hidden rounded-lg bg-background transition-transform group-hover:scale-102"
          height={554}
          src={imageUrl}
          width={853}
        />
      )}

      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="font-medium text-lg md:text-xl lg:text-2xl">
            <Balancer>{post.title}</Balancer>
          </h2>
          {description && (
            <p className="line-clamp-3 overflow-hidden text-ellipsis text-medium text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2">
          {/* Yazar & Tarih */}
          <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-1 capitalize">
              <UserIcon className="size-4 transition-transform hover:scale-125" />
              {author}
            </span>
            {date && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="size-4 transition-transform hover:scale-125" />
                  {date}
                </span>
              </>
            )}
          </div>

          {/* Kategoriler */}
          {categories.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-2">
              <TagIcon className="size-4 text-muted-foreground" />
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

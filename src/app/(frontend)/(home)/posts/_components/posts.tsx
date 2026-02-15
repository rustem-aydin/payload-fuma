import type { HTMLAttributes } from "react";
import { PostCard } from "@/components/blog/post-card";
import { SearchRedirectInput } from "@/components/search-redirect-input";
import { Section } from "@/components/section";
import { ViewAnimation } from "@/components/view-animation";
import { cn } from "@/lib/utils";
import type { Post, Media } from "@/payload-types";

interface PostsProps extends HTMLAttributes<HTMLDivElement> {
  posts: Post[]; 
  sectionClassName?: string;
}

export default function Posts({ posts, className, ...props }: PostsProps) {
  return (
    <Section
      {...props}
      className={cn(
        "flex flex-col divide-y divide-dashed divide-border",
        className,
      )}
    >
      <ViewAnimation
        delay={0.05}
        initial={{ opacity: 0, translateY: -6 }}
        whileInView={{ opacity: 1, translateY: 0 }}
      >
        <SearchRedirectInput
          className="min-w-full"
          placeholder="Yazılarda ara..."
        />
      </ViewAnimation>

      {posts.length > 0 ? (
        <div className="grid divide-y divide-dashed divide-border text-left">
          {posts.map((post, index) => {
            // Payload verilerini eşleştiriyoruz:
            const date = post.publishedAt
              ? new Date(post.publishedAt).toDateString()
              : new Date(post.createdAt).toDateString();

            // Yazarı al (populatedAuthors içinden)
            const authorName = post.populatedAuthors?.[0]?.name || "Anonim";

            // Resim URL'sini al (Payload Media objesinden)
            const imageUrl =
              typeof post.meta?.image === "object"
                ? (post.meta.image as Media).url
                : null;

            return (
              <ViewAnimation
                delay={0.05 * index}
                initial={{ opacity: 0, translateY: -6 }}
                key={post.id} // Payload her zaman 'id' verir
                whileInView={{ opacity: 1, translateY: 0 }}
              >
                <PostCard
                  author={authorName}
                  date={date}
                  description={post.meta?.description || ""}
                  image={imageUrl}
                  index={index}
                  slugs={[post.slug || ""]} // PostCard array beklediği için [slug] yapıyoruz
                  tags={
                    post.categories?.map((cat) =>
                      typeof cat === "object" ? cat.title : "",
                    ) as string[]
                  }
                  title={post.title}
                  url={`/posts/${post.slug}`} // Payload slug'ını URL'e çeviriyoruz
                />
              </ViewAnimation>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground">
          Henüz hiç yazı yok.
        </div>
      )}
    </Section>
  );
}

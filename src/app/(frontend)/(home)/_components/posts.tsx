import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { Icons } from "@/components/icons/icons";
import { Section } from "@/components/section";
import { buttonVariants } from "@/components/ui/button";
import { ViewAnimation } from "@/components/view-animation";

export default function Posts({ posts }: { posts: any[] }) {
  return (
    <Section>
      <div className="grid divide-y divide-dashed divide-border/70 text-left dark:divide-border">
        {posts.map((post, index) => {
          const date = new Date(post.createdAt).toDateString();
          return (
            <ViewAnimation
              delay={0.05 * index}
              initial={{ opacity: 0, translateY: -6 }}
              key={post.id}
              whileInView={{ opacity: 1, translateY: 0 }}
            >
              <PostCard
                author={post.author}
                date={date}
                description={post.description ?? ""}
                image={post.image}
                index={index}
                slugs={post.slugs}
                tags={post.tags}
                title={post.title}
                url={`/posts/${post.slug}`} // Payload slug'ını URL'e çeviriyoruz
              />
            </ViewAnimation>
          );
        })}
        <ViewAnimation
          delay={0.05 * posts.length}
          initial={{ opacity: 0, translateY: -6 }}
          whileInView={{ opacity: 1, translateY: 0 }}
        >
          <Link
            className={buttonVariants({
              variant: "default",
              className: "group min-w-full rounded-none py-4 sm:py-8",
            })}
            href="/posts"
          >
            Daha Fazla Gör
            <Icons.arrowRight className="ml-2 size-5 transition-transform group-hover:-rotate-45" />
          </Link>
        </ViewAnimation>
      </div>
    </Section>
  );
}

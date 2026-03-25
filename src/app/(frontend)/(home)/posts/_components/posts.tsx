import { Section } from "@/components/section";
import { ViewAnimation } from "@/components/view-animation";
import type { Post } from "@/payload-types";
import { PostCard } from "./post-card";

const Updates = ({ posts }: { posts: Post[] }) => {
  return (
    <Section className="relative w-full">
      <div className="w-full border-t border-dashed border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-dashed divide-border">
          {posts.map((post, index) => (
            <div className="min-h-full" key={post.slug}>
              <ViewAnimation
                delay={0.05 * index}
                initial={{ opacity: 0, translateY: -6 }}
                whileInView={{ opacity: 1, translateY: 0 }}
              >
                <PostCard post={post} />
              </ViewAnimation>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Updates;

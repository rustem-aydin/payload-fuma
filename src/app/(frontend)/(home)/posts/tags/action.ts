"use server";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { unstable_cache } from "next/cache";

export const getCachedCategoriesWithCount = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise });

    const categories = await payload.find({
      collection: "categories",
      limit: 100,
    });

    const categoriesWithCount = await Promise.all(
      categories.docs.map(async (category) => {
        const posts = await payload.find({
          collection: "posts",
          where: {
            categories: { equals: category.id },
            _status: { equals: "published" },
          },
          limit: 0,
        });

        return {
          id: category.id,
          name: category.title,
          slug: category.slug as string, // <-- eklendi
          count: posts.totalDocs,
        };
      }),
    );

    return categoriesWithCount
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  },
  ["categories-count-cache"],
  { revalidate: 3600 },
);

import type { Metadata } from "next";

import type { Media, Post, Config } from "../payload-types";

import { mergeOpenGraph } from "./mergeOpenGraph";
import { getServerSideURL } from "./getURL";

const getImageURL = (image?: Media | Config["db"]["defaultIDType"] | null) => {
  const serverUrl = getServerSideURL();

  let url = serverUrl + "/website-template-OG.webp";

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.sizes?.og?.url;

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url;
  }

  return url;
};

export const generateMeta = async (args: {
  doc: Partial<Post> | null;
}): Promise<Metadata> => {
  const { doc } = args;

  // 1. RESİM: Önce meta.image'a bak, yoksa heroImage'a (Kapak resmi) bak
  const ogImage = getImageURL(doc?.meta?.image) || getImageURL(doc?.heroImage);

  // 2. BAŞLIK: Önce meta.title'a bak, yoksa yazının kendi başlığını (doc.title) kullan
  const postTitle = doc?.meta?.title || doc?.title;

  const title = postTitle
    ? postTitle + " | Payload Website Template" // "Sitenizin Adı" olarak değiştirebilirsiniz
    : "Payload Website Template";

  // 3. AÇIKLAMA: meta.description varsa kullan, yoksa boş bırak
  const description = doc?.meta?.description || "";

  return {
    description,
    openGraph: mergeOpenGraph({
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      // Eğer slug bir dizi (array) olarak gelirse birleştir, yoksa direkt kullan (veya /posts/ ekle)
      url: doc?.slug
        ? Array.isArray(doc.slug)
          ? doc.slug.join("/")
          : `/posts/${doc.slug}`
        : "/",
    }),
    title,
  };
};

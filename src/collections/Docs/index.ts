import { formatSlug } from "@/lib/slug";
import type { CollectionConfig } from "payload";

export const Docs: CollectionConfig = {
  slug: "docs",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "category", "viewCount"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      label: "Dokümantasyon Adı",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Özet / Açıklama",
      type: "richText",
    },
    {
      type: "row",
      fields: [
        {
          name: "author",
          label: "Yazar",
          type: "text",
          required: true,
          admin: {
            width: "50%",
          },
        },
        {
          name: "category",
          label: "Kategori",
          type: "relationship",
          relationTo: "categories", // Kendi koleksiyonuna göre adını kontrol edersin
          hasMany: true,
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      name: "coverImage",
      label: "Kapak Görseli",
      type: "upload",
      relationTo: "media",
    },
    {
      type: "row",
      fields: [
        {
          name: "isbn",
          label: "ISBN",
          type: "text",
          admin: { width: "33%" },
        },
        {
          name: "pageCount",
          label: "Sayfa Sayısı",
          type: "number",
          admin: { width: "33%" },
        },
        {
          name: "publishedDate",
          label: "Yayın Tarihi",
          type: "date",
          admin: { width: "33%" },
        },
      ],
    },

    {
      name: "slug",
      label: "URL Slug",
      type: "text",
      index: true, // URL aramalarında performansı artırır
      unique: true,
      admin: {
        position: "sidebar",
        description:
          "Başlığa göre otomatik oluşur. Özel bir URL istiyorsanız manuel değiştirebilirsiniz.",
      },
      hooks: {
        beforeValidate: [formatSlug("title")],
      },
    },
    {
      name: "language",
      label: "Dil",
      type: "select",
      defaultValue: "tr",
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Türkçe", value: "tr" },
        { label: "İngilizce", value: "en" },
      ],
    },
    {
      name: "viewCount",
      label: "Görüntülenme Sayısı",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "commentCount",
      label: "Yorum Sayısı",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
};

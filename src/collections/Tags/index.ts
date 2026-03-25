import { isFieldAdmin } from "@/access";
import { formatSlug } from "@/lib/slug";
import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "usageCount", "createdAt"],
    // Sadece admin ve editor görebilir panelde
    hidden: ({ user }) => user?.roles === "user",
  },
  access: {
    // Herkes okuyabilir (soru formunda tag seçimi için)
    read: () => true,
    // Sadece admin ve editor oluşturabilir
    create: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin" || user.roles === "editor";
    },
    // Sadece admin ve editor güncelleyebilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin" || user.roles === "editor";
    },
    // Sadece admin silebilir
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin";
    },
  },
  fields: [
    // ─── TEMEL BİLGİLER ──────────────────────────────────────
    {
      name: "name",
      type: "text",
      label: "Tag Adı",
      required: true,
      unique: true,
    },
    {
      name: "slug",
      type: "text",
      label: "Slug",
      required: false,
      unique: true,
      admin: {
        position: "sidebar",
        description: "Otomatik oluşturulur. URL'de kullanılır.",
      },
      hooks: {
        beforeValidate: [formatSlug("name")],
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
      admin: {
        description: "Tag sayfasında gösterilecek kısa açıklama.",
      },
    },
    {
      name: "color",
      type: "text",
      label: "Renk (HEX)",
      admin: {
        description: "UI'da tag rozetinin rengi. Örn: #3B82F6",
        position: "sidebar",
      },
    },

    // ─── İSTATİSTİKLER (denormalized) ────────────────────────
    // Soru eklenince/silinince hook ile güncellenir.
    // Tag listesi sayfasında JOIN yapmadan hızlı gösterim sağlar.
    {
      name: "usageCount",
      type: "number",
      label: "Kullanım Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Kaç soruda kullanıldığı. Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "followerCount",
      type: "number",
      label: "Takipçi Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Kaç kullanıcının takip ettiği. Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── TAKİP ───────────────────────────────────────────────
    // Kullanıcılar bu tag'i takip edebilir.
    // Takip edilen tag'e yeni soru gelince bildirim gönderilir.
    // Bu alan Users tarafında da tutulabilir ama burada
    // "hangi userlar bu tag'i takip ediyor" sorgusu için tutuyoruz.
    {
      name: "followers",
      type: "relationship",
      label: "Takipçiler",
      relationTo: "users",
      hasMany: true,
      admin: {
        description: "Bu tag'i takip eden kullanıcılar.",
        // Admin panelde gösterilsin ama sadece okunabilir
        readOnly: true,
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      access: {
        // Takip işlemi API üzerinden yapılır,
        // direkt alan güncellemesi sadece admin
        update: isFieldAdmin,
      },
    },

    // ─── SEO ─────────────────────────────────────────────────
    // Tag sayfası için meta bilgileri.
    // /tags/[slug] sayfasında kullanılır.
    {
      name: "seo",
      type: "group",
      label: "SEO",
      admin: {
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin" || user?.roles === "editor";
        },
      },
      fields: [
        {
          name: "metaTitle",
          type: "text",
          label: "Meta Başlık",
          admin: {
            description: "Boş bırakılırsa tag adı kullanılır.",
          },
        },
        {
          name: "metaDescription",
          type: "textarea",
          label: "Meta Açıklama",
          admin: {
            description: "Boş bırakılırsa tag açıklaması kullanılır.",
          },
        },
      ],
    },
  ],

  hooks: {
    // Tag silinince ilgili soruların tag listesinden kaldırılması
    // ve usageCount sıfırlanması burada yapılacak.
    // Questions collection'ı yazılınca buraya hook eklenecek.
    afterDelete: [
      async ({ req, doc }) => {
        // İleride Questions collection'dan bu tag'i kaldır
        req.payload.logger.info(`Tag silindi: ${doc.name}`);
      },
    ],
  },
};

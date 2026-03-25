import { defaultLexical } from "@/fields/defaultLexical";
import { formatSlug } from "@/lib/slug";
import { isFieldAdmin } from "@/access";
import type { CollectionConfig, Where } from "payload";

export const Questions: CollectionConfig = {
  slug: "questions",
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "status",
      "author",
      "voteScore",
      "answerCount",
      "createdAt",
    ],
  },
  access: {
    // Onaylı sorular herkese açık, pending/closed sadece sahibi ve editor/admin görebilir
    read: ({ req: { user } }): boolean | Where => {
      // Editor ve admin her şeyi görebilir
      if (user && (user.roles === "admin" || user.roles === "editor"))
        return true;

      if (!user) {
        // Giriş yapmamış → sadece approved + public sorular
        return {
          and: [
            { status: { equals: "approved" } } as Where,
            { visibility: { equals: "public" } } as Where,
          ],
        } as Where;
      }

      // Normal kullanıcı → kendi soruları + approved + public olanlar
      return {
        or: [
          {
            and: [
              { status: { equals: "approved" } } as Where,
              { visibility: { equals: "public" } } as Where,
            ],
          } as Where,
          { author: { equals: user.id } } as Where,
        ],
      } as Where;
    },
    // Giriş yapmış herkes soru sorabilir
    create: ({ req: { user } }) => Boolean(user),
    // Kullanıcı sadece kendi sorusunu, editor/admin hepsini güncelleyebilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin" || user.roles === "editor") return true;
      return {
        author: { equals: user.id },
      };
    },
    // Sadece admin silebilir
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin";
    },
  },
  fields: [
    // ─── MEVCUT ALANLAR ──────────────────────────────────────
    {
      name: "title",
      type: "text",
      required: true,
      label: "Soru Başlığı",
    },
    {
      name: "slug",
      type: "text",
      required: false,
      unique: true,
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [formatSlug("title")],
      },
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: false,
      admin: { position: "sidebar" },
    },
    {
      name: "content",
      type: "richText",
      editor: defaultLexical,
      label: "Soru İçeriği",
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },

    // ─── TAGS ────────────────────────────────────────────────
    {
      name: "tags",
      type: "relationship",
      label: "Etiketler",
      relationTo: "tags",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "En fazla 5 etiket seçilebilir.",
      },
      // Max 5 tag kısıtı
      validate: (value: unknown) => {
        if (!value) return true;
        if (Array.isArray(value) && value.length > 5) {
          return "En fazla 5 etiket seçilebilir.";
        }
        return true;
      },
    },

    // ─── GİZLİLİK ────────────────────────────────────────────
    // Kullanıcı sorusunu herkese açık veya sadece editörlere görünür yapabilir.
    {
      name: "visibility",
      type: "select",
      label: "Görünürlük",
      defaultValue: "public",
      required: true,
      admin: {
        position: "sidebar",
        description: "Sorunun kimler tarafından görülebileceğini belirler.",
      },
      options: [
        { label: "🌍 Herkese Açık", value: "public" },
        { label: "🔒 Sadece Editörler", value: "editors_only" },
      ],
    },

    // ─── MODERASYON / STATUS ──────────────────────────────────
    {
      name: "status",
      type: "select",
      label: "Durum",
      defaultValue: "published",
      required: true,
      admin: {
        position: "sidebar",
        description: "Sadece 'approved' sorular Google'a indexlenir.",
      },
      options: [
        { label: "Yayında (İnceleme Bekliyor)", value: "published" },
        { label: "Onaylandı", value: "approved" },
        { label: "Düzenlendi", value: "edited" },
        { label: "Kapatıldı", value: "closed" },
        { label: "Silindi", value: "deleted" },
      ],
      // Sadece editor ve admin durumu değiştirebilir
      access: {
        update: ({ req: { user } }) => {
          if (!user) return false;
          return user.roles === "admin" || user.roles === "editor";
        },
      },
    },
    {
      name: "closedReason",
      type: "select",
      label: "Kapatma Sebebi",
      admin: {
        position: "sidebar",
        description: "Soru kapatılırsa sebep seçilmeli.",
        // Sadece status closed ise göster
        condition: (data) => data?.status === "closed",
      },
      options: [
        { label: "Spam / Reklam", value: "spam" },
        { label: "Uygunsuz İçerik", value: "inappropriate" },
        { label: "Mükerrer Soru", value: "duplicate" },
        { label: "Yetersiz Açıklama", value: "insufficient" },
        { label: "Konu Dışı", value: "off_topic" },
      ],
    },
    {
      name: "approvedBy",
      type: "relationship",
      label: "Onaylayan",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          data?.status === "approved" || data?.status === "edited",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "approvedAt",
      type: "date",
      label: "Onaylanma Tarihi",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          data?.status === "approved" || data?.status === "edited",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── KABUL EDİLEN CEVAP ───────────────────────────────────
    // Soru sahibi en iyi cevabı işaretleyebilir.
    {
      name: "acceptedAnswer",
      type: "relationship",
      label: "Kabul Edilen Cevap",
      relationTo: "answers",
      admin: {
        position: "sidebar",
        description: "Soru sahibi tarafından kabul edilen cevap.",
      },
    },

    // ─── DUPLICATE BAĞLANTISI ─────────────────────────────────
    // Bu soru başka bir sorunun tekrarıysa bağlantı kurulur.
    // SEO: duplicate soru, orijinaline yönlendirir.
    {
      name: "duplicateOf",
      type: "relationship",
      label: "Tekrar Olan Soru",
      relationTo: "questions",
      admin: {
        position: "sidebar",
        condition: (data) => data?.closedReason === "duplicate",
        description: "Bu soru hangi sorunun tekrarı?",
      },
    },

    // ─── İSTATİSTİKLER (denormalized) ────────────────────────
    // Her sorguda aggregate yapmamak için burada tutulur.
    // İlgili hook'lar Answers ve Votes collection'larında günceller.
    {
      name: "voteScore",
      type: "number",
      label: "Oy Skoru",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Toplam upvote - downvote. Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "answerCount",
      type: "number",
      label: "Cevap Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "viewCount",
      type: "number",
      label: "Görüntülenme",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Sayfa her açıldığında +1 artar.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "endorsedAnswerCount",
      type: "number",
      label: "Görüş Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Editor onaylı cevap sayısı. Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── SEO ─────────────────────────────────────────────────
    // approved → index, diğerleri → noindex
    // Bu alan frontend'de <meta name="robots"> için kullanılır.
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
            description: "Boş bırakılırsa soru başlığı kullanılır.",
          },
        },
        {
          name: "metaDescription",
          type: "textarea",
          label: "Meta Açıklama",
        },
        // approved dışındaki her durumda noindex otomatik uygulanır.
        // Bu alan sadece approved sorular için override istenirse kullanılır.
        {
          name: "noindex",
          type: "checkbox",
          label: "Arama Motorlarından Gizle (noindex)",
          defaultValue: false,
          admin: {
            description:
              "Onaylı sorular için manuel noindex gerekiyorsa işaretle.",
          },
        },
      ],
    },
  ],

  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        // Yazar otomatik atanır
        if (operation === "create" && req.user) {
          data.author = req.user.id;
        }
        // Editor/Admin onaylarsa approvedBy ve approvedAt otomatik atanır
        if (
          data.status === "approved" &&
          req.user &&
          (req.user.roles === "editor" || req.user.roles === "admin")
        ) {
          data.approvedBy = req.user.id;
          data.approvedAt = new Date().toISOString();
        }

        // Kapatılıyorsa closedReason zorunlu
        if (data.status === "closed" && !data.closedReason) {
          throw new Error("Soruyu kapatmak için bir sebep seçmelisiniz.");
        }

        return data;
      },
    ],

    // Tag usageCount güncelleme
    afterChange: [
      async ({ req, operation, doc, previousDoc }) => {
        // Yeni soru oluşturulunca tag usageCount artar
        if (operation === "create" && doc.tags?.length > 0) {
          for (const tagId of doc.tags) {
            const id = typeof tagId === "object" ? tagId.id : tagId;
            const tag = await req.payload.findByID({ collection: "tags", id });
            await req.payload.update({
              collection: "tags",
              id,
              data: { usageCount: (tag.usageCount || 0) + 1 },
            });
          }
        }

        // Tag değişince eski tag'lerin count'u azalır, yenilerin artar
        if (operation === "update" && doc.tags && previousDoc?.tags) {
          const oldTags: string[] = (previousDoc.tags || []).map((t: any) =>
            typeof t === "object" ? t.id : t,
          );
          const newTags: string[] = (doc.tags || []).map((t: any) =>
            typeof t === "object" ? t.id : t,
          );

          // Eklenen tag'ler
          const added = newTags.filter((t) => !oldTags.includes(t));
          // Çıkarılan tag'ler
          const removed = oldTags.filter((t) => !newTags.includes(t));

          for (const tagId of added) {
            const tag = await req.payload.findByID({
              collection: "tags",
              id: tagId,
            });
            await req.payload.update({
              collection: "tags",
              id: tagId,
              data: { usageCount: (tag.usageCount || 0) + 1 },
            });
          }

          for (const tagId of removed) {
            const tag = await req.payload.findByID({
              collection: "tags",
              id: tagId,
            });
            await req.payload.update({
              collection: "tags",
              id: tagId,
              data: { usageCount: Math.max(0, (tag.usageCount || 0) - 1) },
            });
          }
        }

        // Kullanıcının questionCount'u artar
        if (operation === "create" && doc.author) {
          const authorId =
            typeof doc.author === "object" ? doc.author.id : doc.author;
          const author = await req.payload.findByID({
            collection: "users",
            id: authorId,
          });
          await req.payload.update({
            collection: "users",
            id: authorId,
            data: { questionCount: (author.questionCount || 0) + 1 },
          });
        }
      },
    ],
  },
};

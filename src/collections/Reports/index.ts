import { isFieldAdmin } from "@/access";
import type { CollectionConfig, Where } from "payload";

export const Reports: CollectionConfig = {
  slug: "reports",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["reporter", "targetType", "reason", "status", "createdAt"],
    // Sadece editor ve admin görebilir
    hidden: ({ user }) => user?.roles === "user",
  },
  access: {
    // Sadece editor ve admin görebilir
    read: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin" || user.roles === "editor";
    },
    // Giriş yapmış herkes şikayet edebilir
    create: ({ req: { user } }) => Boolean(user),
    // Sadece admin ve editor güncelleyebilir (şikayeti işleme alır)
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
    // ─── ŞİKAYET BİLGİLERİ ───────────────────────────────────
    {
      name: "reporter",
      type: "relationship",
      label: "Şikayet Eden",
      relationTo: "users",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "targetType",
      type: "select",
      label: "Şikayet Edilen İçerik Tipi",
      required: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Soru", value: "question" },
        { label: "Cevap", value: "answer" },
        { label: "Yorum", value: "comment" },
      ],
      access: {
        update: isFieldAdmin,
      },
    },
    // Şikayet edilen içerik — tipine göre ilgili alan dolar
    {
      name: "question",
      type: "relationship",
      label: "Şikayet Edilen Soru",
      relationTo: "questions",
      admin: {
        position: "sidebar",
        condition: (data) => data?.targetType === "question",
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "answer",
      type: "relationship",
      label: "Şikayet Edilen Cevap",
      relationTo: "answers",
      admin: {
        position: "sidebar",
        condition: (data) => data?.targetType === "answer",
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "comment",
      type: "relationship",
      label: "Şikayet Edilen Yorum",
      relationTo: "comments",
      admin: {
        position: "sidebar",
        condition: (data) => data?.targetType === "comment",
      },
      access: {
        update: isFieldAdmin,
      },
    },

    // ─── ŞİKAYET SEBEBİ ──────────────────────────────────────
    {
      name: "reason",
      type: "select",
      label: "Şikayet Sebebi",
      required: true,
      options: [
        { label: "Spam / Reklam", value: "spam" },
        { label: "Uygunsuz İçerik", value: "inappropriate" },
        { label: "Mükerrer Soru", value: "duplicate" },
        { label: "Yetersiz Açıklama", value: "insufficient" },
        { label: "Konu Dışı", value: "off_topic" },
        { label: "Yanlış Bilgi", value: "misinformation" },
      ],
    },
    {
      name: "description",
      type: "textarea",
      label: "Açıklama",
      admin: {
        description: "Şikayetinizi detaylandırın (opsiyonel).",
      },
    },

    // ─── MODERASYON ───────────────────────────────────────────
    {
      name: "status",
      type: "select",
      label: "Durum",
      defaultValue: "pending",
      required: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "⏳ Bekliyor", value: "pending" },
        { label: "✅ İncelendi — Haklı Bulundu", value: "accepted" },
        { label: "❌ İncelendi — Reddedildi", value: "dismissed" },
      ],
    },
    {
      name: "reviewedBy",
      type: "relationship",
      label: "İnceleyen",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          data?.status === "accepted" || data?.status === "dismissed",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "reviewedAt",
      type: "date",
      label: "İncelenme Tarihi",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          data?.status === "accepted" || data?.status === "dismissed",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "reviewNote",
      type: "textarea",
      label: "Editor Notu",
      admin: {
        description: "İnceleme sonucu hakkında not (sadece editörler görür).",
        condition: (data) =>
          data?.status === "accepted" || data?.status === "dismissed",
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // Şikayetçiyi otomatik ata
        if (operation === "create" && req.user) {
          data.reporter = req.user.id;

          // ── Mükerrer şikayet kontrolü ──
          // Aynı kullanıcı aynı içeriği tekrar şikayet edemez
          let whereClause: Where;

          if (data.targetType === "question") {
            whereClause = {
              and: [
                { reporter: { equals: String(req.user.id) } } as Where,
                { targetType: { equals: "question" } } as Where,
                { question: { equals: data.question } } as Where,
              ],
            };
          } else if (data.targetType === "answer") {
            whereClause = {
              and: [
                { reporter: { equals: String(req.user.id) } } as Where,
                { targetType: { equals: "answer" } } as Where,
                { answer: { equals: data.answer } } as Where,
              ],
            };
          } else {
            whereClause = {
              and: [
                { reporter: { equals: String(req.user.id) } } as Where,
                { targetType: { equals: "comment" } } as Where,
                { comment: { equals: data.comment } } as Where,
              ],
            };
          }

          const existing = await req.payload.find({
            collection: "reports",
            where: whereClause,
          });

          if (existing.totalDocs > 0) {
            throw new Error("Bu içeriği zaten şikayet ettiniz.");
          }
        }

        // Editor şikayeti işleme alırken reviewedBy ve reviewedAt otomatik atanır
        if (
          operation === "update" &&
          (data.status === "accepted" || data.status === "dismissed") &&
          req.user
        ) {
          data.reviewedBy = req.user.id;
          data.reviewedAt = new Date().toISOString();
        }

        return data;
      },
    ],

    afterChange: [
      async ({ req, operation, doc }) => {
        // ── Şikayet kabul edilince içeriği otomatik kapat ──
        if (operation === "update" && doc.status === "accepted") {
          if (doc.targetType === "question" && doc.question) {
            const questionId =
              typeof doc.question === "object" ? doc.question.id : doc.question;

            await req.payload.update({
              collection: "questions",
              id: questionId,
              data: {
                status: "closed",
                closedReason: doc.reason,
              },
            });
          }

          if (doc.targetType === "answer" && doc.answer) {
            const answerId =
              typeof doc.answer === "object" ? doc.answer.id : doc.answer;

            // Cevap şikayeti kabul edilirse cevabı sil
            await req.payload.delete({
              collection: "answers",
              id: answerId,
            });
          }
        }
      },
    ],
  },
};

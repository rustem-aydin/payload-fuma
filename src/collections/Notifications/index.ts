import { isFieldAdmin } from "@/access";
import type { CollectionConfig } from "payload";

export const Notifications: CollectionConfig = {
  slug: "notifications",
  admin: {
    useAsTitle: "message",
    defaultColumns: ["user", "type", "isRead", "createdAt"],
    // Sadece admin görebilir panelde
    hidden: ({ user }) => user?.roles !== "admin",
  },
  access: {
    // Kullanıcı sadece kendi bildirimlerini görebilir
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin") return true;
      return {
        user: { equals: user.id },
      };
    },
    // Sadece sistem oluşturur (hook üzerinden)
    create: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin";
    },
    // Kullanıcı sadece kendi bildirimini okundu yapabilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin") return true;
      return {
        user: { equals: user.id },
      };
    },
    // Kullanıcı kendi bildirimini, admin hepsini silebilir
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin") return true;
      return {
        user: { equals: user.id },
      };
    },
  },
  fields: [
    // ─── TEMEL BİLGİLER ──────────────────────────────────────
    {
      name: "user",
      type: "relationship",
      label: "Kullanıcı",
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
      name: "type",
      type: "select",
      label: "Bildirim Tipi",
      required: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "💬 Yeni Cevap", value: "answer" },
        { label: "🗨️ Yeni Yorum", value: "comment" },
        { label: "📣 Mention", value: "mention" },
        { label: "✅ Cevabın Onaylandı", value: "endorsed" },
        { label: "🏆 Cevabın Kabul Edildi", value: "accepted" },
        { label: "👍 Upvote Aldın", value: "upvote" },
        { label: "👎 Downvote Aldın", value: "downvote" },
        { label: "🔒 Sorun Kapatıldı", value: "question_closed" },
        { label: "🏅 Rozet Kazandın", value: "badge" },
        { label: "🏷️ Takip Ettiğin Tag'e Soru Geldi", value: "tag_question" },
      ],
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "message",
      type: "text",
      label: "Mesaj",
      required: true,
      admin: {
        readOnly: true,
      },
      access: {
        update: isFieldAdmin,
      },
    },

    // ─── İLGİLİ İÇERİKLER ────────────────────────────────────
    // Bildirime tıklanınca ilgili sayfaya yönlendirmek için.
    // Bildirim tipine göre ilgili alan dolar, diğerleri boş kalır.
    {
      name: "relatedQuestion",
      type: "relationship",
      label: "İlgili Soru",
      relationTo: "questions",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          ["answer", "comment", "question_closed", "tag_question"].includes(
            data?.type,
          ),
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "relatedAnswer",
      type: "relationship",
      label: "İlgili Cevap",
      relationTo: "answers",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) =>
          ["comment", "endorsed", "accepted", "upvote", "downvote"].includes(
            data?.type,
          ),
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "relatedComment",
      type: "relationship",
      label: "İlgili Yorum",
      relationTo: "comments",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => ["comment", "mention"].includes(data?.type),
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "relatedTag",
      type: "relationship",
      label: "İlgili Tag",
      relationTo: "tags",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.type === "tag_question",
      },
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "relatedBadge",
      type: "text",
      label: "Kazanılan Rozet",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.type === "badge",
      },
      access: {
        update: isFieldAdmin,
      },
    },

    // ─── OKUNDU DURUMU ────────────────────────────────────────
    {
      name: "isRead",
      type: "checkbox",
      label: "Okundu",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "readAt",
      type: "date",
      label: "Okunma Tarihi",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => data?.isRead === true,
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Okundu işaretlenince readAt otomatik atanır
        if (operation === "update" && data.isRead && !data.readAt) {
          data.readAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
};

// ─── YARDIMCI FONKSİYON ──────────────────────────────────────
// Diğer collection hook'larından bildirim oluşturmak için kullanılır.
// Örn: Votes hook'u bu fonksiyonu çağırarak upvote bildirimi gönderir.
export async function createNotification(
  req: any,
  {
    userId,
    type,
    message,
    relatedQuestion,
    relatedAnswer,
    relatedComment,
    relatedTag,
    relatedBadge,
  }: {
    userId: string | number | undefined;
    type: string;
    message: string;
    relatedQuestion?: string | number;
    relatedAnswer?: string | number;
    relatedComment?: string | number;
    relatedTag?: string | number;
    relatedBadge?: string;
  },
) {
  // userId yoksa bildirim gönderme
  if (!userId) return;

  try {
    await req.payload.create({
      collection: "notifications",
      data: {
        user: String(userId),
        type,
        message,
        ...(relatedQuestion && { relatedQuestion: String(relatedQuestion) }),
        ...(relatedAnswer && { relatedAnswer: String(relatedAnswer) }),
        ...(relatedComment && { relatedComment: String(relatedComment) }),
        ...(relatedTag && { relatedTag: String(relatedTag) }),
        ...(relatedBadge && { relatedBadge }),
        isRead: false,
      },
    });
  } catch (err) {
    req.payload.logger.error(`Bildirim oluşturulamadı: ${err}`);
  }
}

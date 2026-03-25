import { isFieldAdmin } from "@/access";
import type { CollectionConfig } from "payload";
import { createNotification } from "../Notifications";

export const Comments: CollectionConfig = {
  slug: "comments",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["author", "targetType", "content", "createdAt"],
    hidden: ({ user }) => user?.roles === "user",
  },
  access: {
    // Herkes okuyabilir
    read: () => true,
    // Giriş yapmış herkes yorum yapabilir
    create: ({ req: { user } }) => Boolean(user),
    // Kullanıcı kendi yorumunu, editor/admin hepsini güncelleyebilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin" || user.roles === "editor") return true;
      return {
        author: { equals: user.id },
      };
    },
    // Kullanıcı kendi yorumunu, admin hepsini silebilir
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin") return true;
      return {
        author: { equals: user.id },
      };
    },
  },
  fields: [
    // ─── TEMEL BİLGİLER ──────────────────────────────────────
    {
      name: "author",
      type: "relationship",
      label: "Yazar",
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
      label: "Yorum Yapılan İçerik",
      required: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Soru", value: "question" },
        { label: "Cevap", value: "answer" },
      ],
      access: {
        update: isFieldAdmin,
      },
    },
    {
      name: "question",
      type: "relationship",
      label: "Soru",
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
      label: "Cevap",
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
      name: "content",
      type: "textarea",
      label: "Yorum",
      required: true,
      admin: {
        description: "Maksimum 600 karakter.",
      },
      validate: (value: unknown) => {
        if (typeof value === "string" && value.length > 600) {
          return "Yorum en fazla 600 karakter olabilir.";
        }
        return true;
      },
    },

    // ─── MENTION ─────────────────────────────────────────────
    // @username mention'ları burada tutulur.
    // Bildirim sistemi bu listeye bakarak mention bildirimi gönderir.
    {
      name: "mentions",
      type: "relationship",
      label: "Mention'lar",
      relationTo: "users",
      hasMany: true,
      admin: {
        readOnly: true,
        description: "Yorumda @mention edilen kullanıcılar. Otomatik dolar.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── UPVOTE ───────────────────────────────────────────────
    // Yorumlarda sadece upvote var, downvote yok.
    // Belirli bir eşiğin altındaki yorumlar frontend'de gizlenir.
    {
      name: "upvotes",
      type: "relationship",
      label: "Beğenenler",
      relationTo: "users",
      hasMany: true,
      admin: {
        readOnly: true,
        description: "Bu yorumu beğenen kullanıcılar.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "upvoteCount",
      type: "number",
      label: "Beğeni Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── DURUM ───────────────────────────────────────────────
    // Editor uygunsuz yorumu gizleyebilir.
    {
      name: "isHidden",
      type: "checkbox",
      label: "Gizli",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Editor tarafından gizlenen yorumlar frontend'de gösterilmez.",
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin" || user?.roles === "editor";
        },
      },
      access: {
        update: ({ req: { user } }) => {
          if (!user) return false;
          return user.roles === "admin" || user.roles === "editor";
        },
        create: isFieldAdmin,
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // Yazar otomatik atanır
        if (operation === "create" && req.user) {
          data.author = req.user.id;
        }

        // ── @mention tespiti ──
        // İçerikteki @username pattern'larını bul
        // Frontend mention'ları çözümleyip user id'lerini gönderir
        // Burada sadece validation yapılır
        if (data.content && typeof data.content === "string") {
          const mentionPattern = /@(\w+)/g;
          const mentionedUsernames = [
            ...data.content.matchAll(mentionPattern),
          ].map((m) => m[1]);

          if (mentionedUsernames.length > 0) {
            // Mention edilen kullanıcıları bul
            const mentionedUsers = await req.payload.find({
              collection: "users",
              where: {
                name: { in: mentionedUsernames },
              },
            });

            data.mentions = mentionedUsers.docs.map((u) => u.id);
          }
        }

        return data;
      },
    ],

    afterChange: [
      async ({ req, operation, doc }) => {
        if (operation !== "create") return;

        const authorId =
          typeof doc.author === "object" ? doc.author.id : doc.author;

        // ── Soru sahibine bildirim ──
        if (doc.targetType === "question" && doc.question) {
          const questionId =
            typeof doc.question === "object" ? doc.question.id : doc.question;

          const question = await req.payload.findByID({
            collection: "questions",
            id: questionId,
          });

          const questionAuthorId =
            typeof question.author === "object"
              ? question?.author?.id
              : question.author;

          // Kendi sorusuna yorum yapmışsa bildirim gönderme
          if (questionAuthorId !== authorId) {
            await createNotification(req, {
              userId: questionAuthorId,
              type: "comment",
              message: "Sorunuza yeni bir yorum yapıldı.",
              relatedQuestion: questionId,
              relatedComment: doc.id,
            });
          }
        }

        // ── Cevap sahibine bildirim ──
        if (doc.targetType === "answer" && doc.answer) {
          const answerId =
            typeof doc.answer === "object" ? doc.answer.id : doc.answer;

          const answer = await req.payload.findByID({
            collection: "answers",
            id: answerId,
          });

          const answerAuthorId =
            typeof answer.author === "object"
              ? answer.author.id
              : answer.author;

          if (answerAuthorId !== authorId) {
            await createNotification(req, {
              userId: answerAuthorId,
              type: "comment",
              message: "Cevabınıza yeni bir yorum yapıldı.",
              relatedAnswer: answerId,
              relatedComment: doc.id,
            });
          }
        }

        // ── Mention bildirimleri ──
        if (doc.mentions && doc.mentions.length > 0) {
          for (const mentionedUserId of doc.mentions) {
            const userId =
              typeof mentionedUserId === "object"
                ? mentionedUserId.id
                : mentionedUserId;

            // Kendini mention etmişse bildirim gönderme
            if (userId === authorId) continue;

            await createNotification(req, {
              userId,
              type: "mention",
              message: "Bir yorumda mention edildiniz.",
              relatedComment: doc.id,
            });
          }
        }
      },
    ],
  },
};

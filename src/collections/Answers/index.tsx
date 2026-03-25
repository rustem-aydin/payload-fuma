import { defaultLexical } from "@/fields/defaultLexical";
import { isFieldAdmin } from "@/access";
import type { CollectionConfig } from "payload";

export const Answers: CollectionConfig = {
  slug: "answers",
  admin: {
    useAsTitle: "id",
    defaultColumns: [
      "question",
      "author",
      "isEndorsed",
      "isEditorial",
      "viewOrder",
      "createdAt",
    ],
  },
  access: {
    // Herkes okuyabilir (soruyla birlikte gösterilir)
    read: () => true,
    // Giriş yapmış herkes cevap yazabilir
    create: ({ req: { user } }) => Boolean(user),
    // Kullanıcı kendi cevabını, editor/admin hepsini güncelleyebilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin" || user.roles === "editor") return true;
      return {
        author: { equals: user.id },
      };
    },
    // Kullanıcı kendi cevabını, admin hepsini silebilir
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
      name: "question",
      type: "relationship",
      label: "Soru",
      relationTo: "questions",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
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
    },
    {
      name: "content",
      type: "richText",
      label: "Cevap İçeriği",
      editor: defaultLexical,
      required: true,
    },

    // ─── GÖRÜŞ SİSTEMİ ────────────────────────────────────────
    // isEditorial: Editor kendi yazdıysa otomatik true olur.
    // isEndorsed:  En az 1 editor oyu aldıysa true olur.
    // viewOrder:   Sayfada kaçıncı görüş olduğunu belirtir.
    //              1 = 1. Görüş, 2 = 2. Görüş, null = sıradan cevap
    {
      name: "isEditorial",
      type: "checkbox",
      label: "Editorial Görüş",
      defaultValue: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Editor tarafından yazıldıysa otomatik işaretlenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "isEndorsed",
      type: "checkbox",
      label: "Editor Onaylı",
      defaultValue: false,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "En az 1 editor oyu aldıysa otomatik işaretlenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
    {
      name: "viewOrder",
      type: "number",
      label: "Görüş Sırası",
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "1. Görüş, 2. Görüş... Otomatik atanır. null = sıradan cevap.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── ENDORSEMENT LİSTESİ ─────────────────────────────────
    // Hangi editorların bu cevabı onayladığı.
    // Her editor oyu buraya eklenir.
    // Votes collection'daki hook bu listeyi günceller.
    {
      name: "endorsements",
      type: "array",
      label: "Editor Onayları",
      admin: {
        readOnly: true,
        description: "Bu cevabı onaylayan editorlar. Otomatik güncellenir.",
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin" || user?.roles === "editor";
        },
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
      fields: [
        {
          name: "editor",
          type: "relationship",
          label: "Editor",
          relationTo: "users",
          required: true,
        },
        {
          name: "endorsedAt",
          type: "date",
          label: "Onay Tarihi",
          required: true,
        },
      ],
    },

    // ─── İSTATİSTİKLER (denormalized) ────────────────────────
    {
      name: "endorseCount",
      type: "number",
      label: "Onay Sayısı",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Kaç editor onayladı. Otomatik güncellenir.",
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },
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
  ],

  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        // Yazar otomatik atanır
        if (operation === "create" && req.user) {
          data.author = req.user.id;

          // Editor kendi cevabını yazıyorsa otomatik editorial işaretlenir
          if (req.user.roles === "editor" || req.user.roles === "admin") {
            data.isEditorial = true;
          }
        }
        return data;
      },
    ],

    afterChange: [
      async ({ req, operation, doc }) => {
        const questionId =
          typeof doc.question === "object" ? doc.question.id : doc.question;

        // ── Soru answerCount güncelle ──
        if (operation === "create") {
          const question = await req.payload.findByID({
            collection: "questions",
            id: questionId,
          });
          await req.payload.update({
            collection: "questions",
            id: questionId,
            data: {
              answerCount: (question.answerCount || 0) + 1,
            },
          });

          // Kullanıcının answerCount'u artar
          const authorId =
            typeof doc.author === "object" ? doc.author.id : doc.author;
          const author = await req.payload.findByID({
            collection: "users",
            id: authorId,
          });
          await req.payload.update({
            collection: "users",
            id: authorId,
            data: {
              answerCount: (author.answerCount || 0) + 1,
            },
          });
        }

        // ── Editorial cevap otomatik görüş sırası alır ──
        if (operation === "create" && doc.isEditorial) {
          await assignViewOrder(req, questionId, doc.id);
        }
      },
    ],

    afterDelete: [
      async ({ req, doc }) => {
        const questionId =
          typeof doc.question === "object" ? doc.question.id : doc.question;

        // Soru answerCount azalır
        const question = await req.payload.findByID({
          collection: "questions",
          id: questionId,
        });
        await req.payload.update({
          collection: "questions",
          id: questionId,
          data: {
            answerCount: Math.max(0, (question.answerCount || 0) - 1),
          },
        });
      },
    ],
  },
};

// ─── YARDIMCI FONKSİYON ──────────────────────────────────────
// Bu sorudaki mevcut görüş sayısına göre sıra numarası atar.
// Örn: 2 görüş varsa yeni cevaba viewOrder: 3 atanır.
export async function assignViewOrder(
  req: any,
  questionId: string,
  answerId: string,
) {
  // Bu sorudaki endorsed/editorial cevapları say
  const existing = await req.payload.find({
    collection: "answers",
    where: {
      and: [
        { question: { equals: questionId } },
        {
          or: [
            { isEndorsed: { equals: true } },
            { isEditorial: { equals: true } },
          ],
        },
        // Kendisi hariç
        { id: { not_equals: answerId } },
      ],
    },
  });

  const nextOrder = (existing.totalDocs || 0) + 1;

  await req.payload.update({
    collection: "answers",
    id: answerId,
    data: { viewOrder: nextOrder },
  });
}

import { isFieldAdmin } from "@/access";
import { assignViewOrder } from "./Answers";
import type { CollectionConfig } from "payload";

export const Votes: CollectionConfig = {
  slug: "votes",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "targetType", "targetId", "value", "createdAt"],
    hidden: ({ user }) => user?.roles === "user",
  },
  access: {
    // Editor ve admin görebilir
    read: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin" || user.roles === "editor";
    },
    // Sadece editor ve admin oy verebilir
    create: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin" || user.roles === "editor";
    },
    // Oy değiştirilemez, sadece silinip yeniden verilebilir
    update: ({ req: { user } }) => {
      if (!user) return false;
      return user.roles === "admin";
    },
    // Editor kendi oyunu, admin hepsini silebilir
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles === "admin") return true;
      return {
        user: { equals: user.id },
      };
    },
  },
  fields: [
    // ─── OY BİLGİLERİ ────────────────────────────────────────
    {
      name: "user",
      type: "relationship",
      label: "Oylayan",
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
      label: "Hedef Tipi",
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
    // Hedef soru ise bu alan dolar
    {
      name: "question",
      type: "relationship",
      label: "Soru",
      relationTo: "questions",
      admin: {
        position: "sidebar",
        condition: (data) => data?.targetType === "question",
      },
    },
    // Hedef cevap ise bu alan dolar
    {
      name: "answer",
      type: "relationship",
      label: "Cevap",
      relationTo: "answers",
      admin: {
        position: "sidebar",
        condition: (data) => data?.targetType === "answer",
      },
    },
    {
      name: "value",
      type: "select",
      label: "Oy",
      required: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "👍 Upvote (+1)", value: "1" },
        { label: "👎 Downvote (-1)", value: "-1" },
      ],
      access: {
        update: isFieldAdmin,
      },
    },
  ],

  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        if (operation !== "create") return data;

        // Oylayan kişiyi otomatik ata
        if (req.user) {
          data.user = req.user.id;
        }

        // ── Mükerrer oy kontrolü ──
        // Aynı kullanıcı, aynı içeriğe sadece 1 kez oy verebilir
        const whereClause =
          data.targetType === "question"
            ? {
                and: [
                  { user: { equals: req.user?.id } },
                  { targetType: { equals: "question" } },
                  { question: { equals: data.question } },
                ],
              }
            : {
                and: [
                  { user: { equals: req.user?.id } },
                  { targetType: { equals: "answer" } },
                  { answer: { equals: data.answer } },
                ],
              };

        const existing = await req.payload.find({
          collection: "votes",
          where: whereClause,
        });

        if (existing.totalDocs > 0) {
          throw new Error("Bu içeriğe zaten oy verdiniz.");
        }

        // ── Kendi içeriğine oy verme kontrolü ──
        if (data.targetType === "question" && data.question) {
          const question = await req.payload.findByID({
            collection: "questions",
            id: data.question,
          });
          const authorId =
            typeof question.author === "object"
              ? question.author.id
              : question.author;
          if (authorId === req.user?.id) {
            throw new Error("Kendi sorunuza oy veremezsiniz.");
          }
        }

        if (data.targetType === "answer" && data.answer) {
          const answer = await req.payload.findByID({
            collection: "answers",
            id: data.answer,
          });
          const authorId =
            typeof answer.author === "object"
              ? answer.author.id
              : answer.author;
          if (authorId === req.user?.id) {
            throw new Error("Kendi cevabınıza oy veremezsiniz.");
          }
        }

        return data;
      },
    ],

    afterChange: [
      async ({ req, operation, doc }) => {
        if (operation !== "create") return;

        const voteValue = parseInt(doc.value, 10); // +1 veya -1

        // ── SORU OYLAMASI ──────────────────────────────────────
        if (doc.targetType === "question" && doc.question) {
          const questionId =
            typeof doc.question === "object" ? doc.question.id : doc.question;

          const question = await req.payload.findByID({
            collection: "questions",
            id: questionId,
          });

          // voteScore güncelle
          await req.payload.update({
            collection: "questions",
            id: questionId,
            data: {
              voteScore: (question.voteScore || 0) + voteValue,
            },
          });

          // Soru sahibinin reputation'ını güncelle
          // Upvote: +5, Downvote: -2
          const authorId =
            typeof question.author === "object"
              ? question.author.id
              : question.author;
          const repChange = voteValue === 1 ? 5 : -2;
          await updateReputation(req, authorId, repChange);
        }

        // ── CEVAP OYLAMASI ─────────────────────────────────────
        if (doc.targetType === "answer" && doc.answer) {
          const answerId =
            typeof doc.answer === "object" ? doc.answer.id : doc.answer;

          const answer = await req.payload.findByID({
            collection: "answers",
            id: answerId,
          });

          const questionId =
            typeof answer.question === "object"
              ? answer.question.id
              : answer.question;

          // voteScore güncelle
          await req.payload.update({
            collection: "answers",
            id: answerId,
            data: {
              voteScore: (answer.voteScore || 0) + voteValue,
            },
          });

          // ── ENDORSEMENT MANTIĞI ────────────────────────────
          // Sadece upvote (+1) endorsement sayılır
          // Downvote endorsement oluşturmaz
          if (voteValue === 1) {
            const newEndorsements = [
              ...(answer.endorsements || []),
              {
                editor: req.user?.id,
                endorsedAt: new Date().toISOString(),
              },
            ];

            await req.payload.update({
              collection: "answers",
              id: answerId,
              data: {
                isEndorsed: true,
                endorseCount: (answer.endorseCount || 0) + 1,
                endorsements: newEndorsements,
              },
            });

            // viewOrder ata (eğer ilk kez endorsed oluyorsa)
            if (!answer.isEndorsed) {
              await assignViewOrder(req, questionId, answerId);
            }

            // Questions endorsedAnswerCount güncelle (ilk endorsement ise)
            if (!answer.isEndorsed) {
              const question = await req.payload.findByID({
                collection: "questions",
                id: questionId,
              });
              await req.payload.update({
                collection: "questions",
                id: questionId,
                data: {
                  endorsedAnswerCount: (question.endorsedAnswerCount || 0) + 1,
                },
              });
            }
          }

          // Cevap sahibinin reputation'ını güncelle
          // Upvote: +10, Downvote: -2
          const authorId =
            typeof answer.author === "object"
              ? answer.author.id
              : answer.author;
          const repChange = voteValue === 1 ? 10 : -2;
          await updateReputation(req, authorId, repChange);
        }
      },
    ],

    // Oy silinince voteScore geri alınır
    afterDelete: [
      async ({ req, doc }) => {
        const voteValue = parseInt(doc.value, 10);

        if (doc.targetType === "question" && doc.question) {
          const questionId =
            typeof doc.question === "object" ? doc.question.id : doc.question;
          const question = await req.payload.findByID({
            collection: "questions",
            id: questionId,
          });
          await req.payload.update({
            collection: "questions",
            id: questionId,
            data: {
              voteScore: (question.voteScore || 0) - voteValue,
            },
          });

          // Reputation geri al
          const authorId =
            typeof question.author === "object"
              ? question.author.id
              : question.author;
          const repChange = voteValue === 1 ? -5 : 2;
          await updateReputation(req, authorId, repChange);
        }

        if (doc.targetType === "answer" && doc.answer) {
          const answerId =
            typeof doc.answer === "object" ? doc.answer.id : doc.answer;
          const answer = await req.payload.findByID({
            collection: "answers",
            id: answerId,
          });
          await req.payload.update({
            collection: "answers",
            id: answerId,
            data: {
              voteScore: (answer.voteScore || 0) - voteValue,
            },
          });

          // Reputation geri al
          const authorId =
            typeof answer.author === "object"
              ? answer.author.id
              : answer.author;
          const repChange = voteValue === 1 ? -10 : 2;
          await updateReputation(req, authorId, repChange);
        }
      },
    ],
  },
};

// ─── YARDIMCI FONKSİYON ──────────────────────────────────────
async function updateReputation(req: any, userId: string, change: number) {
  const user = await req.payload.findByID({
    collection: "users",
    id: userId,
  });
  await req.payload.update({
    collection: "users",
    id: userId,
    data: {
      reputation: Math.max(0, (user.reputation || 0) + change),
    },
  });
}

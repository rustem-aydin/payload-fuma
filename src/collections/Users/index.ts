import { isAdminOrGroupEditor, isFieldAdmin } from "@/access";
import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    hidden: ({ user }) => user?.roles !== "admin",
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles", "group", "reputation"],
  },
  access: {
    read: isAdminOrGroupEditor,
    create: ({ req: { user } }) => {
      if (!user) return false;
      const role = user.roles as string;
      return role === "admin" || role === "editor";
    },
    update: isAdminOrGroupEditor,
    delete: isAdminOrGroupEditor,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "roles",
      type: "select",
      hasMany: false,
      saveToJWT: true,
      defaultValue: "user",
      required: true,
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
      admin: {
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      options: [
        { label: "Yönetici (Admin)", value: "admin" },
        { label: "Editör", value: "editor" },
        { label: "Standart Kullanıcı", value: "user" },
      ],
    },
    {
      name: "group",
      type: "relationship",
      relationTo: "groups",
      admin: {
        position: "sidebar",
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      access: {
        update: isFieldAdmin,
      },
    },

    // ─── PROFİL ──────────────────────────────────────────────
    {
      name: "bio",
      type: "textarea",
      label: "Hakkımda",
      admin: {
        description: "Kendinizi kısaca tanıtın.",
      },
    },
    {
      name: "avatar",
      type: "upload",
      label: "Profil Fotoğrafı",
      relationTo: "media",
    },
    {
      name: "website",
      type: "text",
      label: "Web Sitesi",
    },

    // ─── REPUTATION ──────────────────────────────────────────
    // Kullanıcının toplam puanı.
    // Her oy/onay işleminde hook ile güncellenir, elle değiştirilemez.
    {
      name: "reputation",
      type: "number",
      label: "Reputation",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Otomatik hesaplanır, manuel değiştirmeyin.",
        readOnly: true,
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      access: {
        // Hiçbir kullanıcı bu alanı doğrudan değiştiremez.
        // Sadece sistem (hook) değiştirir.
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
    },

    // ─── BADGES ──────────────────────────────────────────────
    // Kullanıcının kazandığı rozetler.
    // Sistem tarafından otomatik eklenir.
    {
      name: "badges",
      type: "array",
      label: "Rozetler",
      admin: {
        readOnly: true,
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      access: {
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
      fields: [
        {
          name: "badge",
          type: "select",
          label: "Rozet",
          options: [
            // Aktivite rozetleri
            { label: "İlk Adım — İlk soruyu sordu", value: "first_question" },
            { label: "Katkıcı — İlk cevabı yazdı", value: "first_answer" },
            { label: "Aktif Üye — 10 soru sordu", value: "active_asker" },
            { label: "Üretken — 10 cevap yazdı", value: "productive" },
            // Kalite rozetleri
            {
              label: "Beğenilen — Cevabı editör onayı aldı",
              value: "endorsed",
            },
            { label: "Uzman — 5 farklı editör onayı aldı", value: "expert" },
            {
              label: "Popüler Soru — 100+ görüntülenme",
              value: "popular_question",
            },
            // Topluluk rozetleri
            { label: "Güvenilir — 100 reputation", value: "trusted" },
            { label: "Veteran — 500 reputation", value: "veteran" },
          ],
        },
        {
          name: "earnedAt",
          type: "date",
          label: "Kazanıldığı Tarih",
        },
      ],
    },

    // ─── İSTATİSTİKLER (denormalized) ────────────────────────
    // Profil sayfasında hızlı gösterim için.
    // Sorguda JOIN yapmamak adına burada tutulur.
    {
      name: "questionCount",
      type: "number",
      label: "Soru Sayısı",
      defaultValue: 0,
      admin: { readOnly: true, position: "sidebar" },
      access: { update: isFieldAdmin, create: isFieldAdmin },
    },
    {
      name: "answerCount",
      type: "number",
      label: "Cevap Sayısı",
      defaultValue: 0,
      admin: { readOnly: true, position: "sidebar" },
      access: { update: isFieldAdmin, create: isFieldAdmin },
    },
  ],

  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === "create" && req.user) {
          if (req.user.roles !== "admin") {
            if (req.user.group) {
              const groupID =
                typeof req.user.group === "object"
                  ? req.user.group.id
                  : req.user.group;
              data.group = groupID;
            }
            data.roles = "user";
          }
        }
        return data;
      },
    ],
  },
};

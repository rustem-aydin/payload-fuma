import { isAdminOrGroupEditor, isFieldAdmin } from "@/access";
import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    hidden: ({ user }) => user?.roles !== "admin",

    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles", "group"],
    // Editörler sadece Posts ve Users görebilir demiştiniz.
    // Users'ı görebilmeli ki kullanıcı ekleyebilsinler.
  },
  access: {
    read: isAdminOrGroupEditor,
    // Admin veya Editör yeni kullanıcı ekleyebilir
    create: ({ req: { user } }) => {
      if (!user) return false;
      // checkRole fonksiyonunu burada tekrar inline yazabilir veya import edebilirsiniz
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
      hasMany: false, // İSTEK 1: Her kullanıcıya tek rol
      saveToJWT: true,
      defaultValue: "user",
      required: true,
      access: {
        // Sadece Admin bu alanı UI üzerinden değiştirebilir
        update: isFieldAdmin,
        create: isFieldAdmin,
      },
      // İSTEK 3: Editörler rolleri göremez
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
      // İSTEK 3: Editörler grubu göremez
      admin: {
        position: "sidebar",
        condition: (_data, _siblingData, { user }) => {
          return user?.roles === "admin";
        },
      },
      access: {
        update: isFieldAdmin, // Grubu sadece admin değiştirebilir
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        // İSTEK 3 (Devamı): Otomatik atama
        if (operation === "create" && req.user) {
          // Eğer işlemi yapan kişi Admin DEĞİLSE (yani Editör ise)
          if (req.user.roles !== "admin") {
            // 1. Oluşturan editörün grubunu yeni kullanıcıya ata
            if (req.user.group) {
              // Group bazen obje bazen ID gelebilir, kontrol et
              const groupID =
                typeof req.user.group === "object"
                  ? req.user.group.id
                  : req.user.group;
              data.group = groupID;
            }

            // 2. Rolü otomatik olarak 'user' (veya isterseniz 'editor') ata
            // Editör kendi altına birini ekliyorsa genelde 'user' olur.
            // Ama "editör kullanıcısı oluşturabilecek" dediğiniz için 'editor' de yapabilirsiniz.
            // Burayı ihtiyacınıza göre değiştirin:
            data.roles = "user";
          }
        }
        return data;
      },
    ],
  },
};

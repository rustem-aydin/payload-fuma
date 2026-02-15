import type { CollectionConfig, Access } from "payload";

// Yardımcı Erişim Fonksiyonları
const isAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes("admin"));

const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  // Admin ise her şeye yetkisi var
  if (user?.roles?.includes("admin")) return true;

  // Değilse sadece kendi ID'si ile eşleşen veriye yetkisi var
  if (user) {
    return {
      id: {
        equals: user.id,
      },
    };
  }

  return false;
};

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // Token süresi vb. ayarlar buraya gelebilir
    tokenExpiration: 7200, // 2 saat
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles", "group"], // Listede rolleri ve grupları da görelim
  },
  access: {
    // Sadece adminler kullanıcı listesini tam görebilir, diğerleri sadece kendini
    read: isAdminOrSelf,
    // Yeni kullanıcı oluşturma (Proje yapınıza göre değişebilir, şimdilik sadece Admin)
    create: isAdmin,
    // Güncelleme: Admin herkesi, kullanıcı kendini
    update: isAdminOrSelf,
    // Silme: Sadece Admin
    delete: isAdmin,
  },
  fields: [
    {
      name: "name",
      label: "Ad Soyad",
      type: "text",
    },
    {
      name: "roles",
      label: "Roller",
      type: "select",
      hasMany: true,
      saveToJWT: true, // ÖNEMLİ: Rol bilgisini her istekte erişilebilir yapar
      defaultValue: ["user"],
      options: [
        { label: "Yönetici (Admin)", value: "admin" },
        { label: "Editör", value: "editor" },
        { label: "Standart Kullanıcı", value: "user" },
      ],
      access: {
        // Sadece adminler birinin rolünü değiştirebilir
        // (Kullanıcı kendi profilini güncellerken kendisini Admin yapamasın diye)
        update: ({ req: { user } }) => Boolean(user?.roles?.includes("admin")),
      },
    },
    {
      name: "group",
      label: "Bağlı Olduğu Grup/Ekip",
      type: "relationship",
      relationTo: "groups",
      hasMany: false,
      saveToJWT: true, // ÖNEMLİ: Posts koleksiyonunda `req.user.group` diyebilmek için gerekli
      admin: {
        position: "sidebar",
        // Bu alan sadece seçilen rol 'editor' içeriyorsa görünsün
        condition: (data, siblingData) =>
          siblingData?.roles?.includes("editor"),
      },
      access: {
        // Sadece adminler birini bir gruba atayabilir
        update: ({ req: { user } }) => Boolean(user?.roles?.includes("admin")),
      },
    },
  ],
  timestamps: true,
};

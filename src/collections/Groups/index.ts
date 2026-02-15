// collections/Groups.ts
import type { CollectionConfig } from "payload";

export const Groups: CollectionConfig = {
  slug: "groups",
  admin: {
    useAsTitle: "name",
  },
  access: {
    read: () => true, // Herkes grupları görebilsin (isterseniz kısıtlayabilirsiniz)
    create: ({ req: { user } }: any) => user?.roles?.includes("admin"), // Sadece admin grup oluşturabilir
    update: ({ req: { user } }: any) => user?.roles?.includes("admin"),
    delete: ({ req: { user } }: any) => user?.roles?.includes("admin"),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
  ],
};

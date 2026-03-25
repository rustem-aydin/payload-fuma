// src/payload.config.ts
import { postgresAdapter } from "@payloadcms/db-postgres";
import sharp from "sharp";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import { tr } from "@payloadcms/translations/languages/tr";

// Koleksiyonlar
import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

import { plugins } from "./plugins";
import { defaultLexical } from "@/fields/defaultLexical";
import { env } from "@/env";
import { Groups } from "./collections/Groups";
import { Questions } from "./collections/Questions";
import { Tags } from "./collections/Tags";
import { Answers } from "./collections/Answers";
import { Comments } from "./collections/Comments";
import { Notifications } from "./collections/Notifications";
import { Reports } from "./collections/Reports";
import { Docs } from "./collections/Docs";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    autoLogin:
      process.env.NODE_ENV === "development"
        ? {
            email: "admin@admin.com",
            password: "admin",
            prefillOnly: true,
          }
        : false,

    importMap: {
      baseDir: path.resolve(dirname),
    },

    user: Users.slug,

    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },

  editor: defaultLexical,
  i18n: {
    supportedLanguages: { tr },
  },
  onInit: async (payload) => {
    const existingUsers = await payload.find({
      collection: "users",
      limit: 1,
    });

    if (existingUsers.totalDocs === 0) {
      await payload.create({
        collection: "users",
        data: {
          email: "admin@admin.com",
          password: "admin",
          name: "Süper Admin",
          roles: "admin",
        },
      });

      payload.logger.info(
        "✅ Otomatik Admin oluşturuldu: admin@admin.com / admin",
      );
    }
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),

  collections: [
    Posts,
    Docs,
    Media,
    Categories,
    Tags,
    Users,
    Answers,
    Reports,
    Groups,
    Questions,
    Comments,
    Notifications,
  ],
  globals: [],
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"].filter(
    Boolean,
  ),
  plugins,
  secret: env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});

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
import { Pages } from "./collections/Pages";
import { env } from "@/env"; // Kendi env dosyanı import et

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
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

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),

  collections: [Pages, Posts, Media, Categories, Users],
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

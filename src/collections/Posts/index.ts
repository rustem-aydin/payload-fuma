import type { CollectionConfig } from "payload";

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

// Access importlarınızın doğru yolda olduğundan emin olun
import { isAdminOrEditor } from "../../access/isAdminOrEditor";
import { isGroupEditorOrPublished } from "../../access/isGroupEditorOrPublished";
import { isGroupEditor } from "../../access/isGroupEditor";

import { Banner } from "../../blocks/Banner/config";
import { Code } from "../../blocks/Code/config";
import { MediaBlock } from "../../blocks/MediaBlock/config";
import { generatePreviewPath } from "../../utilities/generatePreviewPath";
import { populateAuthors } from "./hooks/populateAuthors";
import { revalidateDelete, revalidatePost } from "./hooks/revalidatePost";

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from "@payloadcms/plugin-seo/fields";
import { slugField } from "payload";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: "Yazı",
    plural: "Yazılar",
  },
  access: {
    create: isAdminOrEditor,
    read: isGroupEditorOrPublished,
    update: isGroupEditor,
    delete: isGroupEditor,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt", "_status"],
    // Preview Ayarı (URL'in tam gitmesi için düzeltildi)
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "posts",
          req,
        });
        return `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}${path}`;
      },
    },
    preview: (data, { req }) => {
      const path = generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "posts",
        req,
      });
      return `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}${path}`;
    },
  },
  fields: [
    // --- GRUP ALANI (Gizli & Otomatik) ---
    {
      name: "group",
      type: "relationship",
      relationTo: "groups",
      hidden: true, // Admin panelde gizli
      hooks: {
        beforeChange: [
          ({ value, req, operation }) => {
            // Create işleminde, editörse ve grubu varsa ata
            // Not: User rolleri artık string olduğu için '===' kullanıyoruz
            if (
              operation === "create" &&
              req.user?.roles === "editor" &&
              req.user.group
            ) {
              return typeof req.user.group === "object"
                ? req.user.group.id
                : req.user.group;
            }
            return value;
          },
        ],
      },
    },

    {
      name: "title",
      label: "Başlık",
      type: "text",
      required: true,
    },

    {
      type: "tabs",
      tabs: [
        {
          label: "İçerik",
          fields: [
            {
              name: "heroImage",
              label: "Kapak Resmi",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "content",
              label: "Yazı İçeriği",
              type: "richText",
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({
                      enabledHeadingSizes: ["h1", "h2", "h3", "h4"],
                    }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ];
                },
              }),
              required: true,
            },
          ],
        },
        {
          name: "meta",
          label: "SEO Ayarları",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image",
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: "media" }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: "meta.title",
              descriptionPath: "meta.description",
            }),
          ],
        },
      ],
    },

    // --- PUBLISHED AT (Geri eklendi) ---
    {
      name: "publishedAt",
      label: "Yayınlanma Tarihi",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
        // Eğer editörlerin görmesini istemiyorsanız buraya 'hidden: true' ekleyebilirsiniz.
        // Ama genellikle yayın tarihi editörler için önemlidir, o yüzden açık bıraktım.
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === "published" && !value) {
              return new Date();
            }
            return value;
          },
        ],
      },
    },

    // --- AUTHORS (Gizli & Otomatik) ---
    {
      name: "authors",
      label: "Yazarlar",
      type: "relationship",
      relationTo: "users",
      // hasMany: true, // Eğer birden fazla yazar olacaksa bunu açın
      required: true,
      admin: {
        position: "sidebar",
        hidden: true, // İsteğiniz üzerine gizlendi
      },
      hooks: {
        beforeChange: [
          ({ value, req, operation }) => {
            // Oluşturulurken otomatik olarak mevcut kullanıcıyı ata
            if (operation === "create" && req.user) {
              return req.user.id;
              // Eğer hasMany: true kullanırsanız: return [req.user.id];
            }
            return value;
          },
        ],
      },
    },

    {
      name: "relatedPosts",
      label: "İlgili Yazılar",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "posts",
    },
    {
      name: "categories",
      label: "Kategoriler",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "categories",
    },
    {
      name: "populatedAuthors",
      type: "array",
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
        hidden: true, // Genelde frontend için populate edilir, panelde gizlenebilir
      },
      fields: [
        {
          name: "id",
          type: "text",
        },
        {
          name: "name",
          type: "text",
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};

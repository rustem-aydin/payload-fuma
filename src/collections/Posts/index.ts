import type { CollectionConfig } from "payload";

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

// Yeni access importları
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

export const Posts: CollectionConfig<"posts"> = {
  slug: "posts",
  labels: {
    singular: "Yazı",
    plural: "Yazılar",
  },
  access: {
    create: isAdminOrEditor, // Admin veya Editör
    read: isGroupEditorOrPublished, // Admin/Grup Editörü veya Yayınlanmış
    update: isGroupEditor, // Admin veya Kendi Grubundaki Editör
    delete: isGroupEditor, // Admin veya Kendi Grubundaki Editör
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
    defaultColumns: ["title", "slug", "updatedAt", "_status"],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: "posts",
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: "posts",
        req,
      }),
    useAsTitle: "title",
  },
  fields: [
    // GİZLİ GRUP ALANI (Veritabanı filtrelemesi için gerekli ama admin panelinde gizli)
    {
      name: "group",
      type: "relationship",
      relationTo: "groups",
      hidden: true,
      hooks: {
        beforeChange: [
          ({ value, req, operation }: any) => {
            // Yeni yazı oluşturulurken editörün grubunu otomatik damgala
            if (
              operation === "create" &&
              req.user?.roles?.includes("editor") &&
              req.user.group
            ) {
              return req.user.group.id || req.user.group;
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
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: "media",
            }),

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
    {
      name: "publishedAt",
      label: "Yayınlanma Tarihi",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
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
    {
      name: "authors",
      label: "Yazarlar",
      type: "relationship",
      relationTo: "users",
      required: true,
      defaultValue: ({ user }: { user: any }) => user?.id,
      admin: {
        position: "sidebar",
        readOnly: true,
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

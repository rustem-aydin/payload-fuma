// src/plugins/index.ts
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { searchPlugin } from "@payloadcms/plugin-search";
import type { Plugin } from "payload";
import type { GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/types";

import { searchFields } from "@/search/fieldOverrides";
import { beforeSyncWithSearch } from "@/search/beforeSync";

import type { Post } from "@/payload-types";
import { getServerSideURL } from "@/utilities/getURL";

const generateTitle: GenerateTitle<Post> = ({ doc }) => {
  return doc?.title
    ? `${doc.title} | Payload Website Template`
    : "Payload Website Template";
};

const generateURL: GenerateURL<Post> = ({ doc }) => {
  const url = getServerSideURL();
  return doc?.slug ? `${url}/${doc.slug}` : url;
};

export const plugins: Plugin[] = [
  nestedDocsPlugin({
    collections: ["categories"],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ""),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  // formBuilderPlugin({
  //   fields: {
  //     payment: false,
  //   },
  //   formOverrides: {
  //     fields: ({ defaultFields }) => {
  //       return defaultFields.map((field) => {
  //         if ("name" in field && field.name === "confirmationMessage") {
  //           return {
  //             ...field,
  //             editor: lexicalEditor({
  //               features: ({ rootFeatures }) => {
  //                 return [
  //                   ...rootFeatures,
  //                   FixedToolbarFeature(),
  //                   HeadingFeature({
  //                     enabledHeadingSizes: ["h1", "h2", "h3", "h4"],
  //                   }),
  //                 ];
  //               },
  //             }),
  //           };
  //         }
  //         return field;
  //       });
  //     },
  //   },
  // }),
  // --- ARAMA FİLTRESİ (Hata alırsan burayı komple yorum satırına al) ---
  searchPlugin({
    collections: ["posts"],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields];
      },
    },
  }),
];

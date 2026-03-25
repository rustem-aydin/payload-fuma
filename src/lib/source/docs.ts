import { docs } from "fumadocs-mdx:collections/server";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
export const { getPage, getPages, pageTree } = source;
export type Docs = ReturnType<typeof getPage>;
export type PageTree = typeof pageTree;
export type DocsPage = ReturnType<typeof getPages>[number];

const allDocs = getPages();
export const getSortedByDatePosts = () =>
  allDocs.toSorted((a, b) => a.data.title.localeCompare(b.data.title));
const dc = getSortedByDatePosts();
console.log(dc[0]?.data);

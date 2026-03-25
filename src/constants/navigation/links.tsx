import type { LinkItemType } from "fumadocs-ui/layouts/shared";
import { Icons } from "@/components/icons/icons";

export const linkItems: LinkItemType[] = [
  {
    text: "Hakkında",
    icon: <Icons.user />,
    url: "/about",
  },
  {
    text: "Dokümanlar",
    type: "menu",
    items: [
      {
        text: "Dokümanlar",
        description: "Tüm Dokümantasyonu Görüntüle",
        url: "/books",
        icon: <Icons.book />,
      },
      {
        text: "Etiketler",
        description: "Dokümantasyona Ait Etiketleri Görüntüle",
        url: "/posts/tags",
        icon: <Icons.tags />,
      },
    ],
  },

  {
    type: "menu",
    text: "Yazılar",
    items: [
      {
        text: "Yazılar",
        description: "View all blog posts",
        url: "/posts",
        icon: <Icons.posts />,
      },
      {
        text: "Etiketler",
        description: "View blog posts by tags",
        url: "/posts/tags",
        icon: <Icons.tags />,
      },
    ],
  },
];

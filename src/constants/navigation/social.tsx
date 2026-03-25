import { Icons } from "@/components/icons/icons";
import type { Social } from "@/types";

export const socials: Social[] = [
  {
    icon: <Icons.twitter />,
    name: "X (Twitter)",
    url: "https://x.com/yourusername",
    description: "Follow for updates",
  },
  {
    icon: <Icons.mail />,
    name: "Email",
    url: "mailto:your@email.com",
    description: "Get in touch",
  },
];

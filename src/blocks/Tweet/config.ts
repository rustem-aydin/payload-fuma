// blocks/Tweet/config.ts
import type { Block } from "payload";

export const Tweet: Block = {
  slug: "tweet",
  labels: { singular: "Tweet", plural: "Tweets" },
  fields: [
    {
      name: "tweetId",
      type: "text",
      required: true,
      label: "Tweet ID",
    },
  ],
};

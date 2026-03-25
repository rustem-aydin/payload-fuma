import { FeedbackBlock } from "@/components/feedback/client";
import {
  blockFeedback,
  type ActionResponse,
  type BlockFeedback,
} from "@/components/feedback/schema";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export async function onBlockFeedbackAction(
  feedback: BlockFeedback,
): Promise<any> {
  "use server";
  feedback = blockFeedback.parse(feedback);
  console.log(feedback);
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    FeedbackBlock: ({ children, ...rest }) => (
      <FeedbackBlock {...rest} onSendAction={onBlockFeedbackAction}>
        {children}
      </FeedbackBlock>
    ),
    ...components,
  };
}

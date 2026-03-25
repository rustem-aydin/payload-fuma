import React from "react";
import { useLivePreview } from "@payloadcms/live-preview-react"; // 2. Live Preview hook'unu çağırdık
import { MediaBlock } from "@/blocks/MediaBlock/Component";
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical";
import {
  LinkJSXConverter,
  RichText as ConvertRichText,
} from "@payloadcms/richtext-lexical/react";
import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import { CodeBlock } from "@/blocks/Code/Component";
import type { CodeBlockProps } from "@/blocks/Code/Component";

import type {
  BannerBlock as BannerBlockProps,
  MediaBlock as MediaBlockProps,
} from "@/payload-types";
import { BannerBlock } from "@/blocks/Banner/Component";
import { cn } from "@/utilities/ui";

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<MediaBlockProps | BannerBlockProps | CodeBlockProps>;

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!;
  if (typeof value !== "object") {
    throw new Error("Expected value to be an object");
  }
  const slug = value.slug;
  return relationTo === "posts" ? `/posts/${slug}` : `/${slug}`;
};

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  code: ({ node }) => {
    // node.getTextContent() metni verir, language ise dil bilgisini
    return (
      <CodeBlock
        className="col-start-2 my-4"
        language={node.language || "javascript"}
        code={node.getTextContent()}
        {...node.fields}
      />
    );
  },
  blocks: {
    banner: ({ node }) => (
      <BannerBlock className="col-start-2 mb-4" {...node.fields} />
    ),
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
  },
});

type Props = {
  data: DefaultTypedEditorState;
  enableGutter?: boolean;
  enableProse?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function RichText(props: Props) {
  const {
    className,
    enableProse = true,
    enableGutter = true,
    data: initialData,
    ...rest
  } = props;

  return (
    <ConvertRichText
      data={initialData} // 4. Artık ham datayı değil, canlı (live) datayı render ediyoruz
      converters={jsxConverters}
      className={cn(
        "payload-richtext",
        {
          container: enableGutter,
          "max-w-none": !enableGutter,
          "mx-auto prose md:prose-md dark:prose-invert": enableProse,
        },
        className,
      )}
      {...rest}
    />
  );
}

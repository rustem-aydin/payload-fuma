import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import {
  type Klass,
  type LexicalNode,
  type LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical";
import { YouTubeNode } from "../nodes/embeds/youtube-node";
import { TweetNode } from "../nodes/embeds/tweet-node";
import { ImageNode } from "../nodes/image-node";

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [
    HeadingNode,
    ParagraphNode,
    TextNode,
    QuoteNode,
    YouTubeNode,
    TweetNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    ImageNode,
    CodeNode,
    CodeHighlightNode,
  ];

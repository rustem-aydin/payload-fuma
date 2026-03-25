import { useState } from "react";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { ToolbarPlugin } from "../plugins/toolbar/toolbar-plugin";
import { YouTubePlugin } from "../plugins/embeds/youtube-plugin";
import { TwitterPlugin } from "../plugins/embeds/twitter-plugin"; // ✅ EKLENDİ
import { AutoEmbedPlugin } from "../plugins/embeds/auto-embed-plugin";
import { FontFormatToolbarPlugin } from "../plugins/toolbar/font-format-toolbar-plugin";
import { Separator } from "@/components/ui/separator";
import { EmbedToolbarPlugin } from "../plugins/embeds/embed-toolbar-plugin";
import { ActionsPlugin } from "../plugins/actions/actions-plugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";

import { ClearEditorActionPlugin } from "../plugins/actions/clear-editor-plugin";
import { MaxLengthPlugin } from "../plugins/actions/max-length-plugin";
import { CounterCharacterPlugin } from "../plugins/actions/counter-character-plugin";
import { ShareContentPlugin } from "../plugins/actions/share-content-plugin";
import { ImagesPlugin } from "../plugins/images-plugin";
import { BlockInsertPlugin } from "../plugins/toolbar/block-insert-plugin";
import { InsertImage } from "../plugins/toolbar/block-insert/insert-image";

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const maxLength = 100;
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="relative">
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <AutoEmbedPlugin />
      <YouTubePlugin />
      <TwitterPlugin />
      <ImagesPlugin />
      <ToolbarPlugin>
        {({ blockType }) => (
          <div className="sticky top-0 z-10 flex items-center gap-1 overflow-auto border-b p-1">
            <Separator orientation="vertical" className="!h-7" />
            <FontFormatToolbarPlugin />
            <BlockInsertPlugin>
              <InsertImage />
              <YouTubePlugin />
            </BlockInsertPlugin>
            <Separator orientation="vertical" className="!h-7" />
            <EmbedToolbarPlugin />
          </div>
        )}
      </ToolbarPlugin>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div>
              <div ref={onRef}>
                <ContentEditable placeholder={"Soru Sor ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <ActionsPlugin>
        <div className="clear-both flex items-center justify-between gap-2 overflow-auto border-t p-1">
          <div className="flex flex-1 justify-start">
            {/* left side action buttons */}
            {/* <MaxLengthPlugin maxLength={maxLength} /> */}
          </div>
          <div>
            {/* center action buttons */}
            <CounterCharacterPlugin charset="UTF-16" />
          </div>
          <div className="flex flex-1 justify-end">
            {/* right side action buttons */}
            <ClearEditorActionPlugin />
            <ClearEditorPlugin />
            <ShareContentPlugin />
          </div>
        </div>
      </ActionsPlugin>
    </div>
  );
}

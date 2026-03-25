// plugins/toolbar/embed-toolbar-plugin.tsx
"use client";

import { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { YoutubeIcon, TwitterIcon } from "lucide-react";

import { useEditorModal } from "@/components/editor/editor-hooks/use-modal";
import {
  AutoEmbedDialog,
  YoutubeEmbedConfig,
  TwitterEmbedConfig,
} from "../embeds/auto-embed-plugin";
import { Toggle } from "@/components/ui/toggle";

export function EmbedToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useEditorModal();

  const openYoutubeModal = () => {
    showModal("Embed Youtube Video", (onClose) => (
      <AutoEmbedDialog embedConfig={YoutubeEmbedConfig} onClose={onClose} />
    ));
  };

  const openTwitterModal = () => {
    showModal("Embed Tweet", (onClose) => (
      <AutoEmbedDialog embedConfig={TwitterEmbedConfig} onClose={onClose} />
    ));
  };

  return (
    <>
      {modal}
      <Toggle size="sm" aria-label="Embed YouTube" onClick={openYoutubeModal}>
        <YoutubeIcon className="size-4" />
      </Toggle>
      <Toggle size="sm" aria-label="Embed Tweet" onClick={openTwitterModal}>
        <TwitterIcon className="size-4" />
      </Toggle>
    </>
  );
}

"use client";

import { useState } from "react";
import { type SerializedEditorState } from "lexical";
import { Editor } from "./editor-00/editor";
import { Section } from "../section";

const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Hello World 🚀",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export default function QuestionEditor() {
  const [editorState, setEditorState] =
    useState<SerializedEditorState>(initialValue);

  return (
    <Section className="relative flex flex-col items-center justify-center gap-6   ">
      <Editor
        editorSerializedState={editorState}
        onSerializedChange={(value: any) => setEditorState(value)}
      />
    </Section>
  );
}

// src/hooks/useHtmlValidation.ts
import { useState } from "react";
import type { editor } from "monaco-editor";

export const useHtmlValidation = () => {
  const [decorations, setDecorations] = useState<string[]>([]);

  const validateHtml = (
    monaco: typeof import("monaco-editor"),
    editorInstance: editor.IStandaloneCodeEditor,
    html: string
  ) => {
    if (!monaco || !editorInstance) return;
    const model = editorInstance.getModel();
    if (!model) return;

    const newDecorations: editor.IModelDeltaDecoration[] = [];
    const stack: { tag: string; index: number }[] = [];
    const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const isClosing = match[0][1] === "/";
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);

      if (!isClosing) {
        stack.push({ tag, index: match.index });
      } else {
        const last = stack.pop();
        if (!last || last.tag !== tag) {
          newDecorations.push({
            range: new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column
            ),
            options: { inlineClassName: "underline-error" },
          });
        }
      }
    }

    // Незакриті теги
    stack.forEach((item) => {
      const startPos = model.getPositionAt(item.index);
      const endPos = model.getPositionAt(item.index + item.tag.length + 2);
      newDecorations.push({
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column
        ),
        options: { inlineClassName: "underline-error" },
      });
    });

    const newIds = editorInstance.deltaDecorations(decorations, newDecorations);
    setDecorations(newIds);
  };

  return { validateHtml };
};

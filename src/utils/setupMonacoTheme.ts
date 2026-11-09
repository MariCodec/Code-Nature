import * as monaco from "monaco-editor";

export const setupMonacoTheme = (monacoInstance: typeof monaco) => {
  const savedTheme = localStorage.getItem("editorTheme") || "myCustomTheme";

  monacoInstance.editor.defineTheme("myCustomTheme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "ff0000", fontStyle: "bold" },
      { token: "comment", foreground: "00ff00", fontStyle: "italic" },
    ],
    colors: {
      "editor.background": "#1e1e2e",
      "editor.foreground": "#ffffff",
      "editor.selectionBackground": "#264f78",
      "editorCursor.foreground": "#ffffff",
    },
  });

  monacoInstance.editor.setTheme(savedTheme);
};

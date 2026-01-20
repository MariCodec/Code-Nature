// utils/monacoSetup.ts
import * as monaco from "monaco-editor";

export function setupMonaco(monacoInstance: typeof monaco | null) {
  if (!monacoInstance) return;
  // HTML lint / validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (monacoInstance.languages.html as any).htmlDefaults.setOptions({
    validate: true,

    format: {
      tabSize: 2,
      insertSpaces: true,
      wrapLineLength: 120,
      unformatted: "b,em,strong,span",
      contentUnformatted: "pre,code,textarea",
      indentInnerHtml: true,
      preserveNewLines: false,
      maxPreserveNewLines: 2,
      indentHandlebars: false,
      endWithNewline: false,
      extraLiners: "head,body,/html",
      wrapAttributes: "auto",
    },

    suggest: {
      html5: true,
    },

    hover: true,
    data: {
      useDefaultDataProvider: true,
    },
  });

  // CSS lint / validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (monacoInstance.languages.css as any).cssDefaults.setOptions({
    validate: true,
    lint: {
      compatibleVendorPrefixes: "ignore",
      vendorPrefix: "warning",
      duplicateProperties: "warning",
      emptyRules: "warning",
      importStatement: "ignore",
      boxModel: "ignore",
      universalSelector: "warning",
      zeroUnits: "warning",
      fontFaceProperties: "warning",
      hexColorLength: "error",
    },
  });
}

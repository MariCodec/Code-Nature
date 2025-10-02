import * as monaco from "monaco-editor";

// HTML lint/validation

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(monaco.languages.html as any).htmlDefaults.setOptions({
  validate: true, // включає перевірку синтаксису

  format: {
    tabSize: 2,
    insertSpaces: true,
    wrapLineLength: 120,
    unformatted: "b,em,strong,span", // які теги не форматувати
    contentUnformatted: "pre,code,textarea",
    indentInnerHtml: true,
    preserveNewLines: false,
    maxPreserveNewLines: 2,
    indentHandlebars: false,
    endWithNewline: false,
    extraLiners: "head,body,/html",
    wrapAttributes: "auto", // "auto" | "force" | "force-aligned" | "force-expand-multiline"
  },

  suggest: {
    html5: true, // підказки HTML5 тегів
  },

  hover: true, // показує підказки при наведенні
  data: {
    useDefaultDataProvider: true,
  },
});

// CSS lint/validation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(monaco.languages.css as any).cssDefaults.setOptions({
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

export const normalizeCode = (code: string): string =>
  code
    .replace(/>\s+</g, "><") // Видаляє пробіли між тегами
    .replace(/\s+/g, " ") // Нормалізує інші пробіли
    .trim();

export const checkTaskCompletion = ({
  userHtml,
  userCss,
  correctHtml,
  correctCss,
}: {
  userHtml?: string;
  userCss?: string;
  correctHtml?: string;
  correctCss?: string;
}): boolean => {
  const isHtmlCorrect = correctHtml
    ? normalizeCode(userHtml || "") === normalizeCode(correctHtml)
    : true;

  const isCssCorrect = correctCss
    ? normalizeCode(userCss || "") === normalizeCode(correctCss)
    : true;
  console.log(isCssCorrect);

  console.log(`correct css ${normalizeCode(correctCss || "")}`);
  console.log(`user css ${normalizeCode(userCss || "")}`);
  return isHtmlCorrect && isCssCorrect;
};

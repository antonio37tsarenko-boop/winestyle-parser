export const getCleanText = (text: string): string => {
  if (!text) return "";

  return text
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s\s+/g, " ")
    .trim()
    .toLowerCase();
};

export function getCleanName(title: string): string {
  if (!title) return "";

  return title
    .replace(/[\n\r\t]/g, " ")
    .replace(/[,]?\s?\d+([.,]\d+)?\s?(л|мл|l|ml)\.?/gi, "")
    .replace(/[,]?\s?\d+([.,]\d+)?\s?%/g, "")
    .replace(/\s\s+/g, " ")
    .trim()
    .replace(/,$/, "");
}

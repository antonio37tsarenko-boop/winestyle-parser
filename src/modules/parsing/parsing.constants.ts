import { join } from "node:path";

export const RESTRICTED_FIELDS = ["Крепость", "Объем", "О производителе"];
export const HTML1_PATH = join(process.cwd(), "data-for-parsing/test.html.txt");
export const HTML2_PATH = join(
  process.cwd(),
  "data-for-parsing/test.html2.txt",
);
export const HTML3_PATH = join(
  process.cwd(),
  "data-for-parsing/test.html3.txt",
);

import { join } from "node:path";

export const OLD_TABLE_PATH = join(process.cwd(), "src/old.xlsx");
export const NEW_TABLE_PATH = join(
  process.cwd(),
  "src/excel-table-new.test.xlsx",
);
export const PARSED_IDS_PATH = join(process.cwd(), "src/parsed-drinks.json");

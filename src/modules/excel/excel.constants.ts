import { join } from "node:path";

export const OLD_TABLE_PATH = join(process.cwd(), "data-for-parsing/old.xlsx");
export const NEW_TABLE_PATH = join(process.cwd(), "data-for-parsing/new.xlsx");
export const PARSED_IDS_PATH = join(
  process.cwd(),
  "data-for-parsing/parsed-data.json",
);
export const TEMP_TABLE_PATH = join(
  process.cwd(),
  "data-for-parsing/temp.xlsx",
);

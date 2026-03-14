import { Injectable, NotFoundException } from "@nestjs/common";
import { Column, Worksheet } from "exceljs";
import path from "node:path";
import * as ExcelJs from "exceljs";
import { TABLE_PATH } from "./excel.constants";

@Injectable()
export class ExcelService {
  readUrls(worksheet: Worksheet) {
    const urls = worksheet.getColumn("J") as any;
    return urls.values
      .slice(2)
      .filter(Boolean)
      .map((el: { text: string; hyperlink: string }) => el.hyperlink);
  }
}

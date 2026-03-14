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

  async addDataWithDynamicColumns(
    data: Record<string, string>[],
    workbook: ExcelJs.Workbook,
  ) {
    await workbook.xlsx.readFile(TABLE_PATH);
    if (!workbook) {
      throw new NotFoundException("Excel workbook is not found");
    }
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    const existingColumns = new Set<string>();
    const newColumns = new Set<string>();
    const columnsNames = worksheet.getRow(1);
    columnsNames.eachCell((cell) => {
      if (cell.value) {
        existingColumns.add(cell.value.toString());
      }
    });
    data.forEach((el) => {
      Object.keys(el).forEach((key) => {
        if (!existingColumns.has(key)) {
          newColumns.add(key);
        }
      });
    });

    const currentColumns = Array.from(existingColumns).map((el) => ({
      header: el,
      key: el,
      width: 30,
    }));

    worksheet.columns = [
      ...currentColumns,
      ...Array.from(newColumns).map((column) => ({
        header: column,
        key: column,
        width: 30,
      })),
    ];
    worksheet.addRows(data);
    await workbook.xlsx.writeFile(TABLE_PATH);
    console.log("All columns in table: ", worksheet.getRow(1).values);
  }
}

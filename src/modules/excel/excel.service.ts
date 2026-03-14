import { Injectable, NotFoundException } from "@nestjs/common";
import { CellHyperlinkValue, Worksheet } from "exceljs";
import * as ExcelJs from "exceljs";
import { PARSED_URLS_PATH, TABLE_PATH } from "./excel.constants";
import { readFile } from "fs/promises";
import { getCleanText } from "../../utils/get-clean-text.util";

@Injectable()
export class ExcelService {
  async readDrinksInfo(worksheet: Worksheet) {
    const drinksInfo: { url: string; id: string }[] = [];
    const parsedDrinks: string[] = JSON.parse(
      await readFile(PARSED_URLS_PATH, "utf-8"),
    );
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1 || !rowNumber) {
        return;
      }
      const url: { text: string; hyperlink: string } = row.getCell(10)
        .value as CellHyperlinkValue;
      const id = row.getCell(1).value?.toString();
      if (url && id) {
        if (!parsedDrinks.includes(id)) {
          drinksInfo.push({ url: url.hyperlink, id: getCleanText(id) });
        }
      }
    });

    return drinksInfo.filter(Boolean);
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

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CellHyperlinkValue, Worksheet } from "exceljs";
import * as ExcelJs from "exceljs";
import { NEW_TABLE_PATH, PARSED_IDS_PATH } from "./excel.constants";
import { readFile } from "fs/promises";
import { getCleanText } from "../../utils/get-clean-text.util";

@Injectable()
export class ExcelService {
  logger: Logger = new Logger("ExcelService");
  async readDrinksInfo(worksheet: Worksheet) {
    const drinksInfo: { url: string; id: string }[] = [];
    const parsedDrinks = JSON.parse(await readFile(PARSED_IDS_PATH, "utf-8"));
    const parsedIds = parsedDrinks.parsedIds;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1 || !rowNumber) {
        return;
      }
      const url: { text: string; hyperlink: string } = row.getCell(10)
        .value as CellHyperlinkValue;
      const id = row.getCell(1).value?.toString();
      if (url && id) {
        if (!parsedIds.includes(id)) {
          drinksInfo.push({ url: url.hyperlink, id: getCleanText(id) });
        }
      }
    });

    return drinksInfo.filter(Boolean);
  }

  async addDataWithDynamicColumns(
    newData: Record<string, string>[],
    oldWorkbook: ExcelJs.Workbook,
    newWorkbook: ExcelJs.Workbook,
  ) {
    const oldWorksheet = oldWorkbook.getWorksheet(1);
    if (!oldWorksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    const newWorksheet = newWorkbook.getWorksheet(1);
    if (!newWorksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    const existingColumns = new Set<string>();
    const newColumns = new Set<string>();
    const columnsNames = newWorksheet.getRow(1);
    columnsNames.eachCell((cell) => {
      if (cell.value) {
        existingColumns.add(cell.value.toString());
      }
    });
    if (existingColumns.size <= 0) {
      oldWorksheet.getRow(1).eachCell((cell) => {
        if (cell.value) {
          existingColumns.add(String(cell.value));
        }
      });
    }
    newData.forEach((el) => {
      Object.keys(el).forEach((key) => {
        if (!existingColumns.has(key)) {
          newColumns.add(key);
        }
      });
    });

    const oldColumns = Array.from(existingColumns).map((el) => ({
      header: el,
      key: el,
      width: 30,
    }));

    newWorksheet.columns = [
      ...oldColumns,
      ...Array.from(newColumns).map((column) => ({
        header: column,
        key: column,
        width: 30,
      })),
    ];

    const oldData: Record<string, any>[] = [];
    oldWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const headerName = oldWorksheet.getRow(1).getCell(colNumber).text;
        rowData[headerName] = cell.value;
      });
      oldData.push(rowData);
    });

    const dataToWrite = newData.map((el) => {
      const oldDataEl = oldData.find((oldEl) => {
        return (
          getCleanText(String(oldEl["Артикул"])) ==
          getCleanText(String(el["Артикул"]))
        );
      });
      if (!oldDataEl) {
        this.logger.error(`Wrong id: ${el["Артикул"]}`);
      }
      return { ...oldDataEl, ...el };
    });

    newWorksheet.addRows(dataToWrite);
    await newWorkbook.xlsx.writeFile(NEW_TABLE_PATH);
    this.logger.log(
      `Amount of all rows after writing: ${newWorksheet.rowCount}`,
    );
  }
}

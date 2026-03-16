import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CellValue, Worksheet } from "exceljs";
import * as ExcelJs from "exceljs";
import { NEW_TABLE_PATH, PARSED_IDS_PATH } from "./excel.constants";
import { readFile } from "fs/promises";
import { getCleanText } from "../../utils/get-clean-text.util";
import { IDrinkInfo } from "./interfaces/drink-info.interface";
import { IParsedDataFile } from "./interfaces/parsed-data-file.interface";

@Injectable()
export class ExcelService {
  logger: Logger = new Logger("ExcelService");

  async readDrinksInfo(worksheet: Worksheet) {
    const drinksInfo: IDrinkInfo[] = [];
    const parsedDrinks: IParsedDataFile = JSON.parse(
      await readFile(PARSED_IDS_PATH, "utf-8"),
    );
    const parsedIds = parsedDrinks.parsedIds;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1 || !rowNumber) {
        return;
      }
      const url =
        //: { text: string; hyperlink: string }
        row.getCell(10).value;
      if (
        !url ||
        typeof url !== "object" ||
        !("hyperlink" in url) ||
        !("text" in url)
      ) {
        this.logger.error(
          "Url from table is not satisfying necessary requirements",
        );
        return;
      }
      const id = row.getCell(1).value?.toString();
      if (url && id && !parsedIds.includes(id)) {
        drinksInfo.push({ url: url.hyperlink, id: getCleanText(id) });
      }
    });

    return drinksInfo.filter(Boolean);
  }

  async addDataWithDynamicColumns(
    newData: Record<string, string>[],
    existingWorkbook: ExcelJs.Workbook,
    newWorkbook: ExcelJs.Workbook,
  ) {
    const existingWorksheet = existingWorkbook.getWorksheet(1);
    if (!existingWorksheet) {
      throw new NotFoundException("Excel list is not found");
    }

    const newWorksheet = newWorkbook.getWorksheet(1);
    if (!newWorksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    const existingColumns = new Set<string>();
    const newColumns = new Set<string>();

    newWorksheet.getRow(1).eachCell((cell) => {
      if (cell.value) {
        existingColumns.add(cell.value.toString());
      }
    });
    if (existingColumns.size <= 0) {
      existingWorksheet.getRow(1).eachCell((cell) => {
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

    newWorksheet.columns = [
      ...this.adjustColumns(existingColumns),
      ...this.adjustColumns(newColumns),
    ];

    const existingData: Record<string, CellValue>[] = [];
    existingWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: Record<string, CellValue> = {};
      row.eachCell((cell, colNumber) => {
        const headerName = existingWorksheet.getRow(1).getCell(colNumber).text;
        rowData[headerName] = cell.value;
      });
      existingData.push(rowData);
    });

    const dataToWrite = newData.map((el) => {
      const existingDataEl = existingData.find((existingEl) => {
        return (
          getCleanText(String(existingEl["Артикул"])) ==
          getCleanText(String(el["Артикул"]))
        );
      });
      if (!existingDataEl) this.logger.error(`Wrong id: ${el["Артикул"]}`);

      return { ...existingDataEl, ...el };
    });

    newWorksheet.addRows(dataToWrite);
    await newWorkbook.xlsx.writeFile(NEW_TABLE_PATH);
    this.logger.log(
      `Amount of all rows after writing: ${newWorksheet.rowCount}`,
    );
  }

  private adjustColumns(columns: Set<string>) {
    return Array.from(columns).map((column) => ({
      header: column,
      key: column,
      width: 30,
    }));
  }
}

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CellValue, Row, Worksheet } from "exceljs";
import * as ExcelJs from "exceljs";
import {
  NEW_TABLE_PATH,
  PARSED_IDS_PATH,
  TEMP_TABLE_PATH,
} from "./excel.constants";
import { readFile, rename } from "fs/promises";
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

    let headersRow: Row | undefined;
    for (const row of worksheet.getRows(0, 30) || []) {
      if (row.actualCellCount > 1) {
        headersRow = row;
        break;
      }
    }

    if (!headersRow) {
      this.logger.warn(`Headers row is not found in ${worksheet.name}`);
      throw new NotFoundException(
        `Headers row is not found in ${worksheet.name}`,
      );
    }

    const parsedIds = parsedDrinks.parsedIds;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == headersRow.number || !rowNumber) {
        return;
      }
      let urlColIndex = -1;

      headersRow.eachCell((cell, colNumber) => {
        if (
          getCleanText(cell.text) === getCleanText("Ссылка") ||
          getCleanText(cell.text) === getCleanText("ссылка")
        ) {
          urlColIndex = colNumber;
        }
      });
      if (urlColIndex === -1) {
        this.logger.error(`Column "Ссылка" is not found`);
        return [];
      }
      const url = row.getCell(urlColIndex).value;

      if (!url) {
        return;
      }
      if (
        typeof url !== "object" ||
        !("hyperlink" in url)
        // !("text" in url)
      ) {
        this.logger.error(
          "Url from table is not satisfying necessary requirements",
        );
        return;
      }
      const id = getCleanText(row.getCell(1).value?.toString() || "");
      if (url && id && !parsedIds.includes(id)) {
        drinksInfo.push({ url: url.hyperlink, id: getCleanText(id) });
      }
    });

    return drinksInfo.filter(Boolean);
  }

  async addDataWithDynamicColumns(
    newData: Record<string, string>[],
    existingWorkbook: ExcelJs.Workbook,
    newWorksheet: Worksheet,
    newWorkbook: ExcelJs.Workbook,
    worksheetCount: number,
  ) {
    const existingWorksheet = existingWorkbook.getWorksheet(worksheetCount);
    if (!existingWorksheet) {
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
    const currentCols = [...(newWorksheet.columns || [])];

    if (currentCols.length > 0) {
      newWorksheet.columns = this.reorderAndInsertDescription(
        currentCols,
        "Описание",
      );
    }

    const existingData: Record<string, CellValue>[] = [];
    existingWorksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: Record<string, CellValue> = {};
      row.eachCell((cell, colNumber) => {
        const headerName = existingWorksheet.getRow(1).getCell(colNumber).text;

        let rowDataValue = cell.value;
        if (
          rowDataValue &&
          typeof rowDataValue === "object" &&
          "hyperlink" in rowDataValue
        ) {
          rowDataValue = rowDataValue.hyperlink;
        } else rowDataValue = cell.value?.toString() || "";
        rowData[getCleanText(headerName)] = getCleanText(rowDataValue);
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

    await newWorkbook.xlsx.writeFile(TEMP_TABLE_PATH);
    await rename(TEMP_TABLE_PATH, NEW_TABLE_PATH);
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

  private reorderAndInsertDescription(
    columns: Partial<ExcelJs.Column>[],
    targetHeader: string,
  ): Partial<ExcelJs.Column>[] {
    const cleanTarget = getCleanText(targetHeader);
    const newHeaderName = "Новое описание";
    const cleanNewHeader = getCleanText(newHeaderName);

    const existingNewIdx = columns.findIndex(
      (col) =>
        col.header && getCleanText(col.header.toString()) === cleanNewHeader,
    );
    if (existingNewIdx !== -1) {
      columns.splice(existingNewIdx, 1);
    }

    const currentIndex = columns.findIndex(
      (col) =>
        col.header && getCleanText(col.header.toString()) === cleanTarget,
    );

    if (currentIndex === -1) {
      this.logger.warn(`Column ${targetHeader} is not found`);
      return columns;
    }

    const [targetColumn] = columns.splice(currentIndex, 1);

    if (!targetColumn) {
      this.logger.warn(`Column ${targetHeader} is not found`);
      return columns;
    }
    targetColumn.key = "Описание";

    const newDescriptionColumn: Partial<ExcelJs.Column> = {
      header: newHeaderName,
      key: "Новое Описание",
      width: 35,
    };

    columns.splice(10, 0, targetColumn || {});
    columns.splice(11, 0, newDescriptionColumn);

    return columns;
  }
}

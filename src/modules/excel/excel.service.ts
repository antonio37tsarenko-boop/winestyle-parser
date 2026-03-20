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
      let urlColIndex = -1;

      worksheet.getRow(1).eachCell((cell, colNumber) => {
        if (getCleanText(cell.text) === getCleanText("Ссылка")) {
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
    newWorksheet: Worksheet,
    newWorkbook: ExcelJs.Workbook,
  ) {
    const existingWorksheet = existingWorkbook.getWorksheet(1);
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

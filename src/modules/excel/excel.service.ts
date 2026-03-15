import { Injectable, NotFoundException } from "@nestjs/common";
import { CellHyperlinkValue, Worksheet } from "exceljs";
import * as ExcelJs from "exceljs";
import { NEW_TABLE_PATH, PARSED_IDS_PATH } from "./excel.constants";
import { readFile } from "fs/promises";
import { getCleanText } from "../../utils/get-clean-text.util";

@Injectable()
export class ExcelService {
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
      console.log("url", url);
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
    data: Record<string, string>[],
    oldWorksheet: Worksheet,
    newWorkbook: ExcelJs.Workbook,
  ) {
    const newWorksheet = newWorkbook.getWorksheet(1);
    if (!newWorksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    const existingColumns = new Set<string>();
    const newColumns = new Set<string>();
    const columnsNames = oldWorksheet.getRow(1);
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

    console.log(
      "new data",
      data.map((el) => el["Артикул"]),
    );
    console.log(
      "old data",
      oldData.map((el) => getCleanText(el["Артикул"])),
    );

    data.forEach((newItem) => {
      const index = oldData.findIndex((item) => {
        return (
          getCleanText(item["Артикул"]) === getCleanText(newItem["Артикул"])
        );
      });
      console.log(`CORRECT INDEX: ${index}`);
      if (index !== -1) {
        oldData[index] = { ...oldData[index], ...newItem };
        console.log(`UPDATEED OLD DATA: ${oldData[index]}`);
      } else {
        oldData.push(newItem);
      }
    });

    console.log(`ALL OLDDATA: ${oldData}`);
    newWorksheet.addRows(oldData);
    await newWorkbook.xlsx.writeFile(NEW_TABLE_PATH);
    console.log("All columns in table: ", newWorksheet.getRow(1).values);
  }
}

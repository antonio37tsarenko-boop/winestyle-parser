import * as ExcelJs from "exceljs";
import {
  NEW_TABLE_PATH,
  OLD_TABLE_PATH,
} from "./modules/excel/excel.constants";
async function s() {
  const oldWorkbook = new ExcelJs.Workbook();
  console.log("OLD_TABLE_PATH", OLD_TABLE_PATH);
  await oldWorkbook.xlsx.readFile(OLD_TABLE_PATH);
  const newWorkbook = new ExcelJs.Workbook();
  console.log("NEW_TABLE_PATH", NEW_TABLE_PATH);
  await newWorkbook.xlsx.readFile(NEW_TABLE_PATH);
  const oldWorksheet = oldWorkbook.getWorksheet(1);
  const newWorksheet = newWorkbook.getWorksheet(1);
  console.log("oldWorksheet", oldWorksheet?.getRow(1).values);
  console.log("newWorksheet", newWorksheet?.getRow(1).values);
}

s();

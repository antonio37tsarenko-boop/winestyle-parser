import { Controller, Get, NotFoundException, Post } from "@nestjs/common";
import { ExcelService } from "./excel.service";
import * as ExcelJs from "exceljs";
import * as path from "node:path";
import { NEW_TABLE_PATH, OLD_TABLE_PATH } from "./excel.constants";

@Controller("excel")
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}
  @Get("test/info")
  async readUrls() {
    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.readFile(
      path.join(process.cwd(), "src/excel-table.test.xlsx"),
    );
    if (!workbook) {
      throw new NotFoundException("Excel workbook is not found");
    }
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new NotFoundException("Excel list is not found");
    }
    return this.excelService.readDrinksInfo(worksheet);
  }

  @Post("test/rows")
  async createRows() {
    const x = new ExcelJs.Workbook();
    await x.xlsx.writeFile(OLD_TABLE_PATH);
    const oldWorksheet = x.getWorksheet(1);
    if (!oldWorksheet) {
      return "no old worksheet";
    }
    console.log(OLD_TABLE_PATH);
    const d = new ExcelJs.Workbook();
    await d.xlsx.writeFile(NEW_TABLE_PATH);
    console.log(NEW_TABLE_PATH);

    return this.excelService.addDataWithDynamicColumns(
      [{ row1: "1" }, { row1: "2", row2: "5" }],
      oldWorksheet,
      d,
    );
  }
}

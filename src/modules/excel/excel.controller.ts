import { Controller, Get, NotFoundException, Post } from "@nestjs/common";
import { ExcelService } from "./excel.service";
import * as ExcelJs from "exceljs";
import * as path from "node:path";

@Controller("excel")
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}
  @Get("test/urls")
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
    return this.excelService.readUrls(worksheet);
  }
}

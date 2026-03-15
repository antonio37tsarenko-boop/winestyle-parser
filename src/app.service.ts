import { Injectable, NotFoundException } from "@nestjs/common";
import { ExcelService } from "./modules/excel/excel.service";
import { ParsingService } from "./modules/parsing/parsing.service";
import { FetcherService } from "./modules/fetcher/fetcher.service";
import * as ExcelJs from "exceljs";
import {
  NEW_TABLE_PATH,
  OLD_TABLE_PATH,
  PARSED_IDS_PATH,
} from "./modules/excel/excel.constants";
import * as cheerio from "cheerio";
import { readFile, writeFile } from "fs/promises";

@Injectable()
export class AppService {
  constructor(
    private readonly excelService: ExcelService,
    private readonly fetcherService: FetcherService,
    private readonly parsingService: ParsingService,
  ) {}
  getHello(): string {
    return "Hello World!";
  }

  async startParsing(stopAt: number) {
    let stopAtCount = 0;
    const oldWorkbook = new ExcelJs.Workbook();
    await oldWorkbook.xlsx.readFile(OLD_TABLE_PATH);
    console.log("old workbook is initialized");
    const newWorkbook = new ExcelJs.Workbook();
    await newWorkbook.xlsx.readFile(NEW_TABLE_PATH);
    const oldWorksheet = oldWorkbook.getWorksheet(1);
    console.log("excel tables are initialized");
    let parsedDrinks = JSON.parse(await readFile(PARSED_IDS_PATH, "utf-8"));
    let parsedData: Record<string, string>[] = parsedDrinks.parsedData || [];
    let parsedIds = parsedDrinks.parsedIds;

    if (!oldWorkbook || !oldWorksheet) {
      throw new NotFoundException("Worksheet is not found.");
    }
    const drinks = (await this.excelService.readDrinksInfo(oldWorksheet)).slice(
      parsedIds.length,
    );
    console.log(drinks);
    for (const { url, id } of drinks) {
      console.log(`url for ${id}: ${url}`);
      if (stopAt == stopAtCount) {
        return {
          status: "done",
        };
      }
      const html = await this.fetcherService.fetchHtml(url, id);
      const $ = cheerio.load(html);
      parsedData.push(this.parsingService.parseCharacteristics($, id));
      const imagesUrls = this.parsingService.parsePhotosUrls($);
      await this.fetcherService.fetchAndWriteImages(imagesUrls, id);

      if (parsedData.length >= 40) {
        await this.excelService.addDataWithDynamicColumns(
          parsedData,
          oldWorksheet,
          newWorkbook,
        );
        parsedData = [];
      }

      parsedIds.push(id);
      await writeFile(
        PARSED_IDS_PATH,
        JSON.stringify({ parsedIds, parsedData }),
      );
      console.log(`Drink ${id} is handled.`);
      stopAtCount += 1;
    }
    await this.excelService.addDataWithDynamicColumns(
      parsedData,
      oldWorksheet,
      newWorkbook,
    );

    return {
      status: "done",
    };
  }
}

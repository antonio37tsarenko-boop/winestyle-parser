import { Injectable, Logger, NotFoundException } from "@nestjs/common";
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
  logger: Logger = new Logger("AppService");
  constructor(
    private readonly excelService: ExcelService,
    private readonly fetcherService: FetcherService,
    private readonly parsingService: ParsingService,
  ) {}
  getHello(): string {
    return "Hello World!";
  }

  async startParsing(stopAt: number = 10e10000) {
    let stopAtCount = 0;
    const oldWorkbook = new ExcelJs.Workbook();
    await oldWorkbook.xlsx.readFile(OLD_TABLE_PATH);
    const newWorkbook = new ExcelJs.Workbook();
    await newWorkbook.xlsx.readFile(NEW_TABLE_PATH);
    const oldWorksheet = oldWorkbook.getWorksheet(1);
    let parsedDrinks = JSON.parse(await readFile(PARSED_IDS_PATH, "utf-8"));
    let parsedData: Record<string, string>[] = parsedDrinks.parsedData || [];
    let parsedIds = parsedDrinks.parsedIds;

    if (!oldWorkbook || !oldWorksheet) {
      throw new NotFoundException("Worksheet is not found.");
    }
    const drinks = (await this.excelService.readDrinksInfo(oldWorksheet)).slice(
      parsedIds.length,
    );
    for (const { url, id } of drinks) {
      if (stopAt == stopAtCount) {
        break;
      }
      const html = await this.fetcherService.fetchHtml(url, id);
      const $ = cheerio.load(html);
      parsedData.push(this.parsingService.parseCharacteristics($, id));
      const imagesUrls = this.parsingService.parsePhotosUrls($);
      this.logger.log(`Links for drink ${id}: ${imagesUrls}`);
      await this.fetcherService.fetchAndWriteImages(imagesUrls, id);

      if (parsedData.length >= 40) {
        await this.excelService.addDataWithDynamicColumns(
          parsedData,
          oldWorkbook,
          newWorkbook,
        );
        parsedData = [];
      }

      parsedIds.push(id);
      stopAtCount += 1;
      this.logger.log(`Drink ${id} is handled.`);
    }
    await this.excelService.addDataWithDynamicColumns(
      parsedData,
      oldWorkbook,
      newWorkbook,
    );
    await writeFile(
      PARSED_IDS_PATH,
      JSON.stringify({ parsedIds, parsedData: [] }),
    );

    return {
      status: "done",
    };
  }
}

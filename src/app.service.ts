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
import { IParsedDataFile } from "./modules/excel/interfaces/parsed-data-file.interface";

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
    for (const oldWorksheet of oldWorkbook.worksheets) {
      if (stopAt == stopAtCount) {
        break;
      }
      let parsedDrinks: IParsedDataFile = JSON.parse(
        await readFile(PARSED_IDS_PATH, "utf-8"),
      );
      let parsedData: Record<string, string>[] = parsedDrinks.parsedData || [];
      let parsedIds = parsedDrinks.parsedIds;
      let parsedWorksheets = parsedDrinks.parsedWorksheets;
      let newWorksheet;
      try {
        newWorksheet = newWorkbook.addWorksheet(oldWorksheet.name);
      } catch (e) {
        if (parsedWorksheets.includes(oldWorksheet.name)) {
          continue;
        } else {
          newWorksheet = newWorkbook.getWorksheet(oldWorksheet.name);
          if (!newWorksheet) {
            continue;
          }
        }
      }
      this.logger.log(`Start handling worksheet ${oldWorksheet.name}`);

      if (!oldWorkbook || !oldWorksheet) {
        throw new NotFoundException("Worksheet is not found.");
      }
      const drinks = await this.excelService.readDrinksInfo(oldWorksheet);
      for (const { url, id } of drinks) {
        const html = await this.fetcherService.fetchHtml(url, id);
        if (!html) {
          this.logger.error("Failed to fetch html");
          continue;
        }
        const $ = cheerio.load(html);
        parsedData.push(this.parsingService.parseCharacteristics($, id));
        const imagesUrls = this.parsingService.parsePhotosUrls($);
        this.logger.log(`Links for drink ${id}: ${imagesUrls}`);
        await this.fetcherService.fetchAndWriteImages(imagesUrls, id);

        if (parsedData.length >= 40) {
          await this.excelService.addDataWithDynamicColumns(
            parsedData,
            oldWorkbook,
            newWorksheet,
            newWorkbook,
            oldWorksheet.id,
          );
          parsedData = [];
        }

        parsedIds.push(id);
        await writeFile(
          PARSED_IDS_PATH,
          JSON.stringify({ parsedIds, parsedData, parsedWorksheets }),
        );
        this.logger.log(`Drink ${id} is handled.`);
      }
      await this.excelService.addDataWithDynamicColumns(
        parsedData,
        oldWorkbook,
        newWorksheet,
        newWorkbook,
        oldWorksheet.id,
      );
      parsedWorksheets.push(newWorksheet.name);
      await writeFile(
        PARSED_IDS_PATH,
        JSON.stringify({ parsedIds, parsedData: [], parsedWorksheets }),
      );
      stopAtCount += 1;
    }
    return {
      status: "done",
    };
  }
}

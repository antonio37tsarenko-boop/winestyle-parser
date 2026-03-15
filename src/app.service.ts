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
}

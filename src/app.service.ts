import { Injectable } from "@nestjs/common";
import { ExcelService } from "./modules/excel/excel.service";
import { ParsingService } from "./modules/parsing/parsing.service";
import { FetcherService } from "./modules/fetcher/fetcher.service";

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

  startParsing() {}
}

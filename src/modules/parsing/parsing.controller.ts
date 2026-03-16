import { Controller, Get } from "@nestjs/common";
import { ParsingService } from "./parsing.service";
import { readFile } from "fs/promises";
import * as path from "node:path";
import * as cheerio from "cheerio";
import { HTML1_PATH } from "./parsing.constants";

@Controller("parsing")
export class ParsingController {
  constructor(private readonly parsingService: ParsingService) {}
  @Get("test/photos")
  async parsePhotosUrls() {
    return this.parsingService.parsePhotosUrls(
      cheerio.load(await readFile(HTML1_PATH, "utf-8")),
    );
  }

  @Get("test/characteristics")
  async parseCharacteristics() {
    const filePath = path.join(process.cwd(), "src", "test.html2.txt");
    return this.parsingService.parseCharacteristics(
      cheerio.load(await readFile(filePath, "utf-8")),
      "testId",
    );
  }
}

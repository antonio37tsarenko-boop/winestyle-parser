import { Controller, Get } from "@nestjs/common";
import { ParsingService } from "./parsing.service";
import { readFile } from "fs/promises";
import * as path from "node:path";
import * as cheerio from "cheerio";

@Controller("parsing")
export class ParsingController {
  constructor(private readonly parsingService: ParsingService) {}
  @Get("test/photos")
  async parsePhotosUrls() {
    const filePath = path.join(process.cwd(), "src", "test.html.txt");
    return this.parsingService.parsePhotosUrls(
      await readFile(filePath, "utf-8"),
    );
  }

  @Get("test/characteristics/table")
  async parseTableCharacteristics() {
    const filePath = path.join(process.cwd(), "src", "test.html2.txt");
    return this.parsingService.parseTableCharacteristics(
      cheerio.load(await readFile(filePath, "utf-8")),
    );
  }

  @Get("test/characteristics/blocks")
  async parseBlocksCharacteristics() {
    const filePath = path.join(process.cwd(), "src", "test.html.txt");
    return this.parsingService.parseBlocksCharacteristics(
      cheerio.load(await readFile(filePath, "utf-8")),
    );
  }
}

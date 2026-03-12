import { Controller, Get } from "@nestjs/common";
import { ParsingService } from "./parsing.service";
import { readFile } from "fs/promises";
import * as path from "node:path";

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
}

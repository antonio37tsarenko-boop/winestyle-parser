import { Controller, Get } from "@nestjs/common";
import { FetcherService } from "./fetcher.service";

@Controller("fetcher")
export class FetcherController {
  constructor(private readonly fetcherService: FetcherService) {}

  @Get("test/html")
  async fetchHtml() {
    return this.fetcherService.fetchHtml(
      "https://winestyle.ru/products/Badia-a-Coltibuono-Vin-Santo-del-Chianti-Classico-DOC-2006.html?ysclid=mmn7ekzhl3464715041",
      "testId-1",
    );
  }

  @Get("test/images")
  async fetchAndWriteImages() {
    return this.fetcherService.fetchAndWriteImages(
      [
        "https://s2.wine.style/images_gen/266/266624/0_0_991x600.webp",
        "https://s2.wine.style/images_gen/266/266624/0_1_991x600.webp",
      ],
      "testId",
    );
  }
}

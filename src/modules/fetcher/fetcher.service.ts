import { Injectable, Logger } from "@nestjs/common";
import { request } from "undici";
import {
  GET_IMAGES_PATH,
  httpConfig,
  httpImagesConfig,
  IMAGES_DIR_PATH,
} from "./fetcher.constants";
import { mkdir, writeFile } from "fs/promises";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

@Injectable()
export class FetcherService {
  logger: Logger = new Logger();
  async fetchHtml(url: string, id: string) {
    const { statusCode, body } = await request(url, httpConfig);

    this.logger.log(`status code for html of drink ${id}: ${statusCode}`);
    return body.text();
  }

  async fetchAndWriteImages(urls: string[], id: string) {
    let imageCount = 1;
    for (const url of urls) {
      const { statusCode, body } = await request(url, httpImagesConfig);
      const fullId = id + `-${imageCount}`;

      if (statusCode !== 200) {
        this.logger.error(`Status code for drink ${id}: ${statusCode}`);
      } else this.logger.log(`Status code for drink ${id}: ${statusCode}`);

      const buffer = Buffer.from(await body.arrayBuffer());
      await mkdir(IMAGES_DIR_PATH, { recursive: true });
      await writeFile(GET_IMAGES_PATH(fullId), buffer);
      imageCount += 1;
    }
  }
}

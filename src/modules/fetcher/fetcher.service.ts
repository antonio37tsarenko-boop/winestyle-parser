import { Injectable, Logger } from "@nestjs/common";
import { request } from "undici";
import {
  GET_IMAGES_PATH,
  httpConfig,
  httpImagesConfig,
} from "./fetcher.constants";
import { writeFile } from "fs/promises";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

@Injectable()
export class FetcherService {
  logger: Logger = new Logger();
  async fetchHtml(url: string, id: string) {
    const { statusCode, body, headers } = await request(url, httpConfig);
    this.logger.log(`status code for drink ${id}: ${statusCode}`);
    return body.text();
  }

  async fetchAndWriteImages(urls: string[], id: string) {
    let count = 1;
    for (const url of urls) {
      const { statusCode, body } = await request(url, httpImagesConfig);
      const fullId = id + `-${count}`;
      console.log(`status code for drink photo ${fullId}: ${statusCode}`);
      if (statusCode == 404) {
        console.error(`404 for link ${url}`);
      }
      const buffer = Buffer.from(await body.arrayBuffer());
      await writeFile(GET_IMAGES_PATH(fullId), buffer);
      count += 1;
    }
    console.log(`Images for drink ${id} are written`);
  }
}

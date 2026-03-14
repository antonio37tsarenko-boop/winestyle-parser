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
}

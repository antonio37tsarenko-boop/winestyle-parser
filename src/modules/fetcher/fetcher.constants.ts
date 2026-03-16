import { ProxyAgent } from "undici";
import { join } from "node:path";
import "dotenv/config";
import { mkdir } from "fs/promises";

const agent = new ProxyAgent({
  uri: process.env.BRIGHTDATA_PROXY_URL as string,
  connect: {
    rejectUnauthorized: false,
  },
});

export const httpConfig = {
  dispatcher: agent,
  headers: {
    "x-brightdata-country": process.env.BRIGHTDATA_COUNTRY || "ru",
    "x-brightdata-render": "true",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  },
};

export const httpImagesConfig = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

export const WEB_ACCESS_URL = "https://api.brightdata.com/request";

export const GET_IMAGES_PATH = (fullId: string) => {
  // const productId = fullId.split("-")[0];
  // await mkdir(`images/${productId}`, { recursive: true });
  return join(process.cwd(), "images", `${fullId}.jpg`);
};

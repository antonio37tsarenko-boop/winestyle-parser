import { Injectable } from "@nestjs/common";
import Root = cheerio.Root;
import { getCleanText } from "../../utils/get-clean-text.util";
import { getCleanName } from "../../utils/get-clean-name.util";
import { RESTRICTED_FIELDS } from "./parsing.constants";

@Injectable()
export class ParsingService {
  parsePhotosUrls($: Root) {
    const links: string[] = [];
    $("div.ws-carousel.ws-carousel__small-dots")
      .find("div.ws-carousel--wrapper")
      .find(".image")
      .find("source")
      .each((_, img) => {
        const srcset = $(img).attr("srcset");
        if (srcset) {
          const parts = srcset.split(",");
          const lastPart = parts[parts.length - 1];
          if (!lastPart) {
            this.getImageFromSrc($, img, links);
            return;
          }
          const cleanLink = lastPart.trim().split(" ")[0];

          if (cleanLink) {
            links.push(cleanLink);
          }
        } else {
          this.getImageFromSrc($, img, links);
        }
      });

    return [...new Set(links)];
  }

  private parseTableCharacteristics(
    $: Root,
    characteristics: Record<string, string>,
  ) {
    $(".m-params.dot").each((_, tr) => {
      const name = $(tr)
        .find('th [itemprop="name"], th[itemprop="name"]')
        .map((_, el) => $(el).attr("content"))
        .get()
        .join(", ");

      const value = $(tr)
        .find("td [itemprop=value], td[itemprop=value]")
        .map((_, el) => $(el).attr("content"))
        .get()
        .join(", ");

      if (!name || !value || RESTRICTED_FIELDS.includes(name.trim())) {
        return;
      }

      characteristics[name] = getCleanText(value);
    });

    return characteristics;
  }

  private parseDescription($: Root, characteristics: Record<string, string>) {
    $("div[class=o-productpage-details__item]").each((_, element) => {
      const name = $(element).find("h3").text().trim();
      const value = $(element)
        .find("div:not([class]) p")
        .map((_, el) => $(el).text().trim())
        .get()
        .join(" ");

      if (RESTRICTED_FIELDS.includes(name)) {
        return;
      }
      characteristics[name] = getCleanText(value);
    });

    return characteristics;
  }

  private parseName($: Root, characteristics: Record<string, string>) {
    characteristics["Название на сайте"] = getCleanName($("h1").text().trim());
    return characteristics;
  }

  parseCharacteristics($: Root, id: string) {
    let characteristics: Record<string, string> = {};
    characteristics = this.parseName($, characteristics);
    characteristics = this.parseTableCharacteristics($, characteristics);
    characteristics = this.parseDescription($, characteristics);
    characteristics["Артикул"] = id;
    return characteristics;
  }

  private getImageFromSrc($: Root, img: cheerio.Element, links: string[]) {
    const src = $(img).attr("src");
    if (src) links.push(src);
  }
}

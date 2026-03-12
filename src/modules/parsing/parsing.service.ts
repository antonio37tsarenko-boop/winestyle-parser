import { Injectable } from "@nestjs/common";
import Root = cheerio.Root;
import { getCleanText } from "../../utils/get-clean-text.util";

@Injectable()
export class ParsingService {
  parsePhotosUrls(rawHtml: string) {
    const allMatches = rawHtml.match(/images_gen&s;.*?\.webp/g) || [];

    const uniquePaths = Array.from(new Set(allMatches)).filter(
      (p) => !p.includes("boutiques") && p.includes("&s;"),
    );

    const finalImages = [];
    const seenIndexes = new Set();

    let productId: string = "";
    for (const path of uniquePaths) {
      const matchIndex = path.match(/\d+_\d+/);
      const index = matchIndex ? matchIndex[0] : null;

      if (index && !seenIndexes.has(index)) {
        seenIndexes.add(index);

        const cleanUrl = `https://s2.wine.style/${path
          .replace(/&s;/g, "/")
          .replace("%wx%h", "991x600")}`;

        finalImages.push(cleanUrl);
        productId = cleanUrl
          .split("https://s2.wine.style/images_gen/")[1]
          .slice(0, 10);
      }
    }
  }

  parseTableCharacteristics($: Root, characteristics: Record<string, string>) {
    $(".m-params.dot").each((index, tr) => {
      const name = $(tr)
        .find('th [itemprop="name"], th[itemprop="name"]')
        .map((i, el) => $(el).attr("content"))
        .get()
        .join(", ");

      const value = $(tr)
        .find("td [itemprop=value], td[itemprop=value]")
        .map((i, el) => $(el).attr("content"))
        .get()
        .join(", ");

      if (!name || !value) {
        return;
      }

      characteristics[name] = getCleanText(value);
    });

    console.log(
      "parsing results of parseTableCharacteristics:",
      characteristics,
    );
    return characteristics;
  }

  parseAboutProduct($: Root, characteristics: Record<string, string>) {
    $(".o-productpage-details.wrapper")
      .children("div.m-specification")
      .find(".m-specification__item")
      .each((index, element) => {
        const name = $(element).find("h3.heading.heading--xl").text().trim();
        const value = $(element).find("p").text().trim();

        if (!name || !value) {
          return;
        }

        characteristics[name] = getCleanText(value);
      });

    console.log("parsing results of parseAboutProduct:", characteristics);
    return characteristics;
  }

  parseDescription($: Root, characteristics: Record<string, string>) {
    $("div[class=o-productpage-details__item]").each((index, element) => {
      const name = $(element).find("h3").text().trim();
      const value = $(element)
        .find("div:not([class]) p")
        .map((i, el) => $(el).text().trim())
        .get()
        .join(" ");
      characteristics[name] = getCleanText(value);
    });

    console.log("parsing results of parseDescription:", characteristics);
    return characteristics;
  }

  parseName($: Root, characteristics: Record<string, string>) {
    characteristics["Название на сайте"] = $("h1").text().trim();
    console.log("parsing results of parseName:", characteristics);
    return characteristics;
  }

  parseCharacteristics($: Root) {
    let characteristics: Record<string, string> = {};
    characteristics = this.parseName($, characteristics);
    characteristics = this.parseTableCharacteristics($, characteristics);
    characteristics = this.parseAboutProduct($, characteristics);
    characteristics = this.parseDescription($, characteristics);
    return characteristics;
  }
}

import { Injectable } from "@nestjs/common";

@Injectable()
export class ParsingService {
  parsePhotosUrls(html: string) {
    const allMatches = html.match(/images_gen&s;.*?\.webp/g) || [];

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
    console.log(`RESULTS FOR DRINK ${productId}: `);
    console.log(finalImages);
  }

  parseCharacteristics(html: string) {}
}

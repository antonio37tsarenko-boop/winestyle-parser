import { Module } from "@nestjs/common";
import { FetcherController } from "./fetcher.controller";
import { FetcherService } from "./fetcher.service";

@Module({
  controllers: [FetcherController],
  providers: [FetcherService],
  exports: [FetcherService],
})
export class FetcherModule {}

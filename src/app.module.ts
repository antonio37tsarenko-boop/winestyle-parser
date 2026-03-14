import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingModule } from './modules/parsing/parsing.module';
import { ExcelModule } from './modules/excel/excel.module';
import { FetcherModule } from './modules/fetcher/fetcher.module';

@Module({
  imports: [ParsingModule, ExcelModule, FetcherModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

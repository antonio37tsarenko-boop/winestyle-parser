import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingModule } from './modules/parsing/parsing.module';
import { ExcelModule } from './modules/excel/excel.module';

@Module({
  imports: [ParsingModule, ExcelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

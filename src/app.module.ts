import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParsingModule } from './modules/parsing/parsing.module';

@Module({
  imports: [ParsingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

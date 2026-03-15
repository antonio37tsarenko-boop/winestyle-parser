import { Controller, Get, Param } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("start")
  startParsing() // @Param("stop") stopAt: string
  {
    return this.appService.startParsing(41);
  }
}

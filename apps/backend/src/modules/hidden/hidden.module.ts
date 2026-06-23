import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { SpaceModule } from '../space/space.module';
import { HiddenController } from './hidden.controller';
import { HiddenService } from './hidden.service';

@Module({
  imports: [ProjectModule, SpaceModule],
  controllers: [HiddenController],
  providers: [HiddenService],
})
export class HiddenModule {}

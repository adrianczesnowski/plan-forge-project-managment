import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { SpaceModule } from '../space/space.module';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';

@Module({
  imports: [ProjectModule, SpaceModule],
  controllers: [FavoriteController],
  providers: [FavoriteService],
})
export class FavoriteModule {}

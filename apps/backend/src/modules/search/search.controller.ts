import { Controller, Get, Query } from '@nestjs/common';
import type { SearchResults } from '@planforge/shared';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query('q') q = ''): Promise<SearchResults> {
    return this.searchService.search(user.id, q);
  }
}

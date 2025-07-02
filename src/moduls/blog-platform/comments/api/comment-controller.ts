import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../../user-accounts/decarators/current-user';
import { CommentOutputType } from '../dto/create-comment-dto';
import { CommentService } from '../application/comment-service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentsService: CommentService) {}
  @Get(':id')
  async getCommentById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<CommentOutputType> {
    return this.commentsService.getCommentById(id, userId);
  }
}

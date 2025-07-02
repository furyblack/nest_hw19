import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Post,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { PostViewDto } from '../dto/posts-view.dto';
import {
  CommentOutputType,
  CreateCommentDto,
} from '../../comments/dto/create-comment-dto';
import { CommentService } from '../../comments/application/comment-service';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CurrentUser } from '../../../user-accounts/decarators/current-user';

@Controller('posts')
export class PostsPublicController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentService,
  ) {}

  @Get()
  async getAllPosts(@Query() query: GetPostsQueryDto) {
    return await this.postsService.getAllPosts(query);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string): Promise<PostViewDto> {
    const post = await this.postsService.getPostById(id);
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('login') userLogin: string,
  ): Promise<CommentOutputType> {
    return this.commentsService.createComment(postId, userId, userLogin, dto);
  }
}

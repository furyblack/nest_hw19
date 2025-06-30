import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { PostViewDto } from '../dto/posts-view.dto';

@Controller('posts')
export class PostsPublicController {
  constructor(private readonly postsService: PostsService) {}

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
}

import { Module } from '@nestjs/common';
import { BlogsSaController } from './blogs/api/blogs.sa.controller';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsService } from './blogs/application/blogs.service';
import { PublicBlogsController } from './blogs/api/blogs.public.controller';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { PostsService } from './posts/application/posts.service';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsPublicController } from './posts/api/posts.public.controller';
import { CommentRepository } from './comments/infrastructure/comment-repository';
import { CommentService } from './comments/application/comment-service';
import { CommentController } from './comments/api/comment-controller';

@Module({
  imports: [],
  controllers: [
    BlogsSaController,
    PublicBlogsController,
    PostsPublicController,
    CommentController,
  ],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    PostsService,
    PostsRepository,
    CommentRepository,
    CommentService,
  ],
  exports: [],
})
export class BloggersPlatformModule {}

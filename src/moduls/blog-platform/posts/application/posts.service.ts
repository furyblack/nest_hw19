import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../../blogs/infrastructure/blogs.repository';
import { PostsRepository } from '../infrastructure/posts.repository';
import { CreatePostDto } from '../dto/create-post.dto';
import { GetPostsQueryDto } from '../dto/get-posts-query.dto';
import { PostViewDto } from '../dto/posts-view.dto';
import { Pagination } from '../dto/pagination.dto';
import { LikeStatus } from '../likes/like.enum';
import { UpdatePostDto } from '../dto/update.post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly blogsRepo: BlogsRepository,
    private readonly postsRepo: PostsRepository,
  ) {}

  async createPostForBlog(
    blogId: string,
    dto: CreatePostDto,
  ): Promise<PostViewDto> {
    const blog = await this.blogsRepo.findById(blogId);
    if (!blog) throw new NotFoundException();

    const post = await this.postsRepo.create({
      ...dto,
      blogId,
      blogName: blog.name,
    });

    return this.mapToView(post);
  }

  async getPostsByBlog(
    blogId: string,
    query: GetPostsQueryDto,
  ): Promise<Pagination<PostViewDto>> {
    return this.postsRepo.getPostsByBlogId(blogId, query);
  }

  private mapToView(post: any): PostViewDto {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.short_description,
      content: post.content,
      blogId: post.blog_id,
      blogName: post.blog_name,
      createdAt: post.created_at,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    };
  }

  async getAllPosts(query: GetPostsQueryDto) {
    return this.postsRepo.getAllPostsWithPagination(query);
  }

  async getPostById(id: string): Promise<PostViewDto | null> {
    return this.postsRepo.findPostById(id);
  }

  async updatePost(
    postId: string,
    blogId: string,
    dto: UpdatePostDto,
  ): Promise<boolean> {
    return await this.postsRepo.updatePost(postId, blogId, dto);
  }

  async deletePost(postId: string, blogId: string): Promise<void> {
    const isDeleted = await this.postsRepo.deletePost(postId, blogId);
    if (!isDeleted) {
      throw new NotFoundException(); // <-- проверка здесь
    }
  }
}

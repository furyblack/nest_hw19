import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CreateBlogDto, UpdateBlogDto } from '../dto/create-blog.dto';

@Injectable()
export class BlogsService {
  constructor(private blogsRepository: BlogsRepository) {}
  async createBlog(createBlogDto: CreateBlogDto) {
    const blog = await this.blogsRepository.createBlog(createBlogDto);
    return blog;
  }

  async getBlogById(id: number) {
    const blog = await this.blogsRepository.findBlogById(id);
    if (!blog) throw new NotFoundException(`Blog with id ${id} not found`);
    return blog;
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<string> {
    await this.blogsRepository.findOrNotFoundFail(id);
    await this.blogsRepository.update(id, dto);
    return id;
  }

  async deleteBlog(id: string): Promise<void> {
    const blog = await this.blogsRepository.findById(id);
    if (!blog) throw new NotFoundException(`Blog with id ${id} not found`);
    await this.blogsRepository.findOrNotFoundFail(id);
    await this.blogsRepository.softDelete(id);
  }
}

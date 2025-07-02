import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GetCommentsQueryDto } from '../dto/getCommentsDto';

@Injectable()
export class CommentRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(data: {
    content: string;
    postId: string;
    userId: string;
    userLogin: string;
  }) {
    const result = await this.dataSource.query(
      `
    INSERT INTO comments (id, content, post_id, user_id, user_login)
    VALUES (gen_random_uuid(), $1, $2, $3, $4)
    RETURNING *
    `,
      [data.content, data.postId, data.userId, data.userLogin],
    );

    return result[0];
  }

  async findById(id: string): Promise<any | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM comments WHERE id = $1 AND deletion_status = 'active'`,
      [id],
    );
    return result[0] || null;
  }

  async findUserReaction(
    entityId: string,
    userId: string,
    entityType: 'Post' | 'Comment',
  ) {
    const result = await this.dataSource.query(
      `SELECT status FROM likes WHERE entity_id = $1 AND user_id = $2 AND entity_type = $3`,
      [entityId, userId, entityType],
    );
    return result[0] || null;
  }

  async updateContent(commentId: string, content: string) {
    await this.dataSource.query(
      `UPDATE comments SET content = $1 WHERE id = $2`,
      [content, commentId],
    );
  }
  async delete(commentId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE comments SET deletion_status = 'deleted' WHERE id = $1`,
      [commentId],
    );
  }

  async getCommentsForPost(
    postId: string,
    query: GetCommentsQueryDto,
    currentUserId: string,
  ) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'created_at';
    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const comments = await this.dataSource.query(
      `
    SELECT * FROM comments
    WHERE post_id = $1 AND deletion_status = 'active'
    ORDER BY ${sortBy} ${sortDirection}
    LIMIT $2 OFFSET $3
    `,
      [postId, pageSize, skip],
    );

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM comments WHERE post_id = $1 AND deletion_status = 'active'`,
      [postId],
    );

    const totalCount = parseInt(countResult[0].count, 10);
    const pagesCount = Math.ceil(totalCount / pageSize);

    // 2. Посчитаем лайки и myStatus
    const items = await Promise.all(
      comments.map(async (c: any) => {
        const like = await this.dataSource.query(
          `
        SELECT status FROM likes
        WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Comment'
        `,
          [currentUserId, c.id],
        );

        return {
          id: c.id,
          content: c.content,
          commentatorInfo: {
            userId: c.user_id,
            userLogin: c.user_login,
          },
          createdAt: c.created_at,
          likesInfo: {
            likesCount: c.likes_count || 0,
            dislikesCount: c.dislikes_count || 0,
            myStatus: like[0]?.status || 'None',
          },
        };
      }),
    );

    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items,
    };
  }
}

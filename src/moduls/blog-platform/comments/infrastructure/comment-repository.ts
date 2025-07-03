import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GetCommentsQueryDto } from '../dto/getCommentsDto';
import { LikeStatusEnum } from '../../posts/dto/like-status.dto';

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

    // 🔐 Безопасный маппинг полей для сортировки
    const sortableFieldsMap: Record<string, string> = {
      content: 'content',
      createdAt: 'created_at', // клиент шлёт createdAt, в БД — created_at
    };

    const sortByRaw = query.sortBy || 'createdAt'; // что пришло от клиента
    const sortBy = sortableFieldsMap[sortByRaw] || 'created_at'; // что подставим в SQL
    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // ✅ SQL-запрос
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

    // 👇 Обработка лайков
    const items = await Promise.all(
      comments.map(async (c: any) => {
        let myStatus = 'None';

        if (currentUserId) {
          const like = await this.dataSource.query(
            `
          SELECT status FROM likes
          WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Comment'
          `,
            [currentUserId, c.id],
          );
          myStatus = like[0]?.status || 'None';
        }

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
            myStatus,
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

  async updateLikeForComment(
    commentId: string,
    userId: string,
    status: LikeStatusEnum,
  ): Promise<void> {
    if (status === LikeStatusEnum.None) {
      await this.dataSource.query(
        `DELETE FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Comment'`,
        [userId, commentId],
      );
      return;
    }

    const existing = await this.dataSource.query(
      `SELECT * FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = 'Comment'`,
      [userId, commentId],
    );

    if (existing.length > 0) {
      await this.dataSource.query(
        `UPDATE likes SET status = $1 WHERE user_id = $2 AND entity_id = $3 AND entity_type = 'Comment'`,
        [status, userId, commentId],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO likes (user_id, entity_id, entity_type, status) VALUES ($1, $2, 'Comment', $3)`,
        [userId, commentId, status],
      );
    }
  }
}

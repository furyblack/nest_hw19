import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

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
}

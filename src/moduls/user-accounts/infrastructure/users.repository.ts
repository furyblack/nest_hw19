import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetUsersQueryDto } from '../dto/getUserQueryDto';

@Injectable()
export class UsersRepository {
  constructor(private dataSource: DataSource) {}

  async findByLoginOrEmail(loginOrEmail: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE (login = $1 OR email = $1) AND deletion_status = 'active'`,
      [loginOrEmail],
    );
    return result[0] || null;
  }

  async createUser(userData: any) {
    const result = await this.dataSource.query(
      `INSERT INTO users (login, email, password_hash, confirmation_code, is_email_confirmed, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [
        userData.login,
        userData.email,
        userData.password_hash,
        userData.confirmation_code,
        userData.is_email_confirmed,
      ],
    );
    return result[0];
  }

  async findAllWithPagination(query: GetUsersQueryDto) {
    const page = query.pageNumber || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const sortBy = ['login', 'email', 'created_at'].includes(query.sortBy)
      ? query.sortBy
      : 'created_at';

    const sortDirection =
      query.sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const params: any[] = [];
    let whereClause = "WHERE deletion_status = 'active'";
    const searchConditions: string[] = [];

    if (query.searchLoginTerm) {
      params.push(`%${query.searchLoginTerm.toLowerCase()}%`);
      searchConditions.push(`LOWER(login) LIKE $${params.length}`);
    }

    if (query.searchEmailTerm) {
      params.push(`%${query.searchEmailTerm.toLowerCase()}%`);
      searchConditions.push(`LOWER(email) LIKE $${params.length}`);
    }

    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(' OR ')})`;
    }

    // Получаем пользователей
    const sql = `
        SELECT id, login, email, created_at
        FROM users
                 ${whereClause}
        ORDER BY ${sortBy} ${sortDirection}
        LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
    `;
    params.push(pageSize, skip);

    const users = await this.dataSource.query(sql, params);

    // Считаем общее количество
    const countSql = `
        SELECT COUNT(*)
        FROM users
                 ${whereClause}
    `;
    const countResult = await this.dataSource.query(
      countSql,
      params.slice(0, params.length - 2),
    );
    const totalCount = parseInt(countResult[0].count, 10);
    const pagesCount = Math.ceil(totalCount / pageSize);

    // Формируем ответ с camelCase полями
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: users.map((u: any) => ({
        id: u.id,
        login: u.login,
        email: u.email,
        createdAt: u.created_at, // переименовываем поле
      })),
    };
  }

  async findById(id: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE id = $1`,
      [id],
    );
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE email =$1 LIMIT 1;`,
      [email],
    );
    return result[0] || null;
  }

  async deleteById(id: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async findByConfirmationCode(code: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE confirmation_code = $1 LIMIT 1;`,
      [code],
    );
    return result[0] || null;
  }
  async confirmUserEmail(id: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users
     SET is_email_confirmed = TRUE,
         confirmation_code = NULL,
         confirmation_code_expiration = NULL
     WHERE id = $1;`,
      [id],
    );
  }

  async updateConfirmationCode(
    id: string,
    code: string,
    expiration: Date,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE users
      SET confirmation_code = $1,
        confirmation_code_expiration = $2
        WHERE id = $3; `,
      [code, expiration, id],
    );
  }
}

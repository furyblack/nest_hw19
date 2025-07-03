import { IsEnum } from 'class-validator';

export enum LikeStatusEnum {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class LikeStatusDto {
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}

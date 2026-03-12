import type { ZodHandler } from '@/types/handlers/root.handler';

import type {
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from '../../modules/categories/validations/categories.validation';

export type ListCategoriesHandler = ZodHandler;

export type GetCategoryBySlugHandler = ZodHandler<
  { slug: string }
>;

export type CreateCategoryHandler = ZodHandler<
  unknown,
  CreateCategoryInput
>;

export type UpdateCategoryHandler = ZodHandler<
  { id: string },
  UpdateCategoryInput
>;

export type DeactivateCategoryHandler = ZodHandler<
  { id: string }
>;

export type ReorderCategoriesHandler = ZodHandler<
  unknown,
  ReorderCategoriesInput
>;
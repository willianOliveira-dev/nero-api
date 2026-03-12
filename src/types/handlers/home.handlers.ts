import type {
    CreateHomeSectionInput,
    HomeSectionParams,
    UpdateHomeSectionInput,
} from '../../modules/home/validations/home.validation';
import type { ZodHandler } from './root.handler';

export type GetHomeHandler = ZodHandler;
export type GetHomeSectionHandler = ZodHandler<HomeSectionParams>;

export type ListHomeSectionsHandler = ZodHandler;

export type CreateHomeSectionHandler = ZodHandler<
    unknown,
    CreateHomeSectionInput
>;
export type UpdateHomeSectionHandler = ZodHandler<
    HomeSectionParams,
    UpdateHomeSectionInput
>;
export type DeleteHomeSectionHandler = ZodHandler<HomeSectionParams>;
export type ReorderHomeSectionsHandler = ZodHandler<
    unknown,
    { items: { id: string; sortOrder: number }[] }
>;

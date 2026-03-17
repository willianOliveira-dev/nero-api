import { StorageService } from '@/modules/storage/services/storage.service';
import { ConflictError, NotFoundError } from '@/shared/errors/app.error';
import { CategoriesRepository } from '../repositories/categories.repository';
import type {
    CreateCategoryInput,
    ReorderCategoriesInput,
    UpdateCategoryInput,
} from '../validations/categories.validation';

const categoriesRepository = new CategoriesRepository();
const storageService = new StorageService();

export class CategoriesService {
    async listActive() {
        return categoriesRepository.findAllActive();
    }

    async getBySlug(slug: string) {
        const category = await categoriesRepository.findBySlug(slug);

        if (!category) {
            throw new NotFoundError('Categoria não encontrada.');
        }

        return category;
    }

    async create(input: CreateCategoryInput) {
        if (input.parentId) {
            const parent = await categoriesRepository.findById(input.parentId);
            if (!parent) {
                throw new NotFoundError('Categoria pai não encontrada.');
            }
        }

        return categoriesRepository.create(input);
    }

    async update(id: string, input: UpdateCategoryInput) {
        const existing = await categoriesRepository.findById(id);

        if (!existing) {
            throw new NotFoundError('Categoria não encontrada.');
        }

        if (input.parentId === id) {
            throw new ConflictError(
                'Uma categoria não pode ser pai de si mesma.',
            );
        }

        const updated = await categoriesRepository.update(id, input);

        if (!updated) {
            throw new NotFoundError('Categoria não encontrada.');
        }

        return updated;
    }

    async deactivate(id: string) {
        const existing = await categoriesRepository.findById(id);

        if (!existing) {
            throw new NotFoundError('Categoria não encontrada.');
        }

        const updated = await categoriesRepository.deactivate(id);

        if (!updated) {
            throw new NotFoundError('Categoria não encontrada.');
        }

        return updated;
    }

    async reorder(input: ReorderCategoriesInput) {
        await categoriesRepository.reorder(input.items);
        return { reordered: true };
    }

    async presignImage() {
        return storageService.generateUploadSignature(
            'categories',
            `category_${Date.now()}`,
        );
    }
}

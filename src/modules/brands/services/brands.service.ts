import { StorageService } from '@/modules/storage/services/storage.service';
import { NotFoundError } from '@/shared/errors/app.error';
import { BrandsRepository } from '../repositories/brands.repository';
import type {
    CreateBrandInput,
    UpdateBrandInput,
} from '../validations/brands.validation';

const brandsRepository = new BrandsRepository();
const storageService = new StorageService();

export class BrandsService {
    async listAll() {
        return brandsRepository.findAll();
    }

    async getBySlug(slug: string) {
        const brand = await brandsRepository.findBySlug(slug);
        if (!brand) {
            throw new NotFoundError('Marca não encontrada.');
        }
        return brand;
    }

    async create(input: CreateBrandInput) {
        return brandsRepository.create(input);
    }

    async update(id: string, input: UpdateBrandInput) {
        await this.findOrFail(id);
        const updated = await brandsRepository.update(id, input);
        if (!updated) {
            throw new NotFoundError('Marca não encontrada.');
        }
        return updated;
    }

    async delete(id: string) {
        await this.findOrFail(id);
        const updated = await brandsRepository.delete(id);
        if (!updated) {
            throw new NotFoundError('Marca não encontrada.');
        }
        return updated;
    }

    async presignLogo() {
        return storageService.generateUploadSignature(
            'brands',
            `brand_logo_${Date.now()}`,
        );
    }

    private async findOrFail(id: string) {
        const brand = await brandsRepository.findById(id);
        if (!brand) {
            throw new NotFoundError('Marca não encontrada.');
        }
        return brand;
    }
}

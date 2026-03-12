import type { ZodHandler } from '@/types/handlers/root.handler';

import type {
  CreateAddressInput,
  UpdateAddressInput,
} from '../../modules/addresses/validations/addresses.validation';

export type ListAddressesHandler = ZodHandler;

export type GetDefaultAddressHandler = ZodHandler;

export type CreateAddressHandler = ZodHandler<
  unknown,
  CreateAddressInput
>;

export type UpdateAddressHandler = ZodHandler<
  { id: string },
  UpdateAddressInput
>;

export type SetDefaultAddressHandler = ZodHandler<
  { id: string }
>;

export type DeleteAddressHandler = ZodHandler<
  { id: string }
>;
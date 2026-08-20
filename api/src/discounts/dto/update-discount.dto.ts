import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDiscountDto } from './create-discount.dto';

// The code is immutable after creation — changing it would silently
// invalidate any link or printed material referencing the old code.
export class UpdateDiscountDto extends PartialType(
  OmitType(CreateDiscountDto, ['code'] as const),
) {}

import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Variants have their own dedicated endpoints (add/update/remove one at a
// time) — updating the whole product never touches them, so the array
// can't accidentally be replaced wholesale.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants'] as const),
) {}

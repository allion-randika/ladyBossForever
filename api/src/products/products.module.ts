import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [AuditLogModule, EmailModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}

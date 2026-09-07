import { Module } from '@nestjs/common';
import { StoreCreditController } from './store-credit.controller';
import { StoreCreditService } from './store-credit.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [StoreCreditController],
  providers: [StoreCreditService],
  exports: [StoreCreditService],
})
export class StoreCreditModule {}

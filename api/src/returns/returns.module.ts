import { Module } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { StoreCreditModule } from '../store-credit/store-credit.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [StoreCreditModule, AuditLogModule],
  providers: [ReturnsService],
  controllers: [ReturnsController],
})
export class ReturnsModule {}

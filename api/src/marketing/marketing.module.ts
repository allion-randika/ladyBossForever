import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { EmailModule } from '../email/email.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [EmailModule, AuditLogModule],
  providers: [MarketingService],
  controllers: [MarketingController],
})
export class MarketingModule {}

import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PaymentsModule } from '../payments/payments.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [PaymentsModule, AuditLogModule, DiscountsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}

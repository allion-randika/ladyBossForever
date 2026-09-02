import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './cart/cart.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DiscountsModule } from './discounts/discounts.module';
import { GiftCardsModule } from './gift-cards/gift-cards.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BlogModule } from './blog/blog.module';
import { BannersModule } from './banners/banners.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AccountsModule } from './accounts/accounts.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    PaymentsModule,
    OrdersModule,
    WishlistModule,
    CartModule,
    AuditLogModule,
    CustomersModule,
    DashboardModule,
    DiscountsModule,
    GiftCardsModule,
    ReviewsModule,
    BlogModule,
    BannersModule,
    ExpensesModule,
    AccountsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

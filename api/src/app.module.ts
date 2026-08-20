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
  ],
  controllers: [AppController],
})
export class AppModule {}

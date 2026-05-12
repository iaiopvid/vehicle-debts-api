import { Module } from '@nestjs/common';
import { DebtsModule } from './modules/debts/debts.module';

@Module({
  imports: [DebtsModule],
})
export class AppModule {}

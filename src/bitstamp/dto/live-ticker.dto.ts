import Decimal from 'decimal.js';

export class LiveTickerDto {
  id: number;
  amount: Decimal;
  amount_str: string;
  price: Decimal;
  price_strrepresented: string;
  type: number;
  timestamp: string;
  microtimestamp: string;
  buy_order_id: bigint;
  sell_order_id: bigint;
}

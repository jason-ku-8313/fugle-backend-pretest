import Decimal from 'decimal.js';

export interface StreamingTickerOhlc {
  currencyPair: string;
  lastPrice: Decimal;
  lastPriceStr: string;
  lastTradeTimestamp: string;
  open?: Decimal;
  openStr?: string;
  high?: Decimal;
  highStr?: string;
  low?: Decimal;
  lowStr?: string;
  close?: Decimal;
  closeStr?: string;
}

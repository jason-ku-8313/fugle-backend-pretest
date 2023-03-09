import { LiveTickerDto } from './live-ticker.dto';

export class LiveTickerResponseDto {
  channel: string;
  event: string;
  data: LiveTickerDto;
}

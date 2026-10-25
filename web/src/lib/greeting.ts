// Time-of-day greeting for the assistant (A3). Always Bangkok time, whatever the device or process time zone.
export type GreetingBucket = 'morning' | 'afternoon' | 'evening' | 'late';

export function bangkokHour(date: Date) {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Bangkok' }).format(date));
}

// 05-11 morning · 12-16 afternoon · 17-20 evening · 21-04 late (a neutral greeting).
export function greetingBucket(date: Date): GreetingBucket {
  const hour = bangkokHour(date);
  return hour >= 5 && hour <= 11 ? 'morning' : hour >= 12 && hour <= 16 ? 'afternoon' : hour >= 17 && hour <= 20 ? 'evening' : 'late';
}

// "วันเสาร์ที่ 24 ต.ค. 2569" / "Saturday 24 Oct 2026", in Bangkok.
export function bangkokDayLabel(date: Date, locale: 'th' | 'en') {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(date);
}

import type { OpeningPeriod, TimeOfWeek } from '@/types';

const WEEK = 7 * 1440;

function tow(t: TimeOfWeek): number {
  return t.day * 1440 + t.hour * 60 + t.minute;
}

export function isOpenNow(
  periods: OpeningPeriod[] | null | undefined,
  now: Date = new Date(),
): boolean | null {
  if (!periods || periods.length === 0) return null;
  // 24/7: single period, opens Sunday 00:00 with no close.
  const first = periods[0];
  if (
    periods.length === 1 &&
    first &&
    !first.close &&
    first.open.day === 0 &&
    first.open.hour === 0 &&
    first.open.minute === 0
  ) {
    return true;
  }
  const nowMin = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
  for (const p of periods) {
    if (!p.close) continue;
    const openM = tow(p.open);
    let closeM = tow(p.close);
    if (closeM <= openM) closeM += WEEK;
    if (nowMin >= openM && nowMin < closeM) return true;
    if (nowMin + WEEK >= openM && nowMin + WEEK < closeM) return true;
  }
  return false;
}

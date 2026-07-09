import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

export type Period = 'daily' | 'weekly' | 'monthly' | 'all' | 'custom'

// 使用者當地的今天（YYYY-MM-DD）
export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}

// 依期間回傳 [from, to]（含端點）。'all' 回傳 [null, null]。
// anchor 為基準日期（預設今天），用於前後切換日/週/月。
export function rangeFor(
  period: Period,
  custom?: { from: string; to: string; anchor?: string }
): [string | null, string | null] {
  const d = custom?.anchor ? dayjs(custom.anchor) : dayjs()
  switch (period) {
    case 'daily':
      return [d.format('YYYY-MM-DD'), d.format('YYYY-MM-DD')]
    case 'weekly':
      return [d.startOf('isoWeek').format('YYYY-MM-DD'), d.endOf('isoWeek').format('YYYY-MM-DD')]
    case 'monthly':
      return [d.startOf('month').format('YYYY-MM-DD'), d.endOf('month').format('YYYY-MM-DD')]
    case 'all':
      return [null, null]
    case 'custom':
      return [custom?.from || null, custom?.to || null]
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

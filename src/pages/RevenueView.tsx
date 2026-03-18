import { useEffect, useState } from 'react'
import type { RevenueStats, RevenueTransaction } from '@shared/types'
import { getRevenueStats } from '@/lib/ipc'
import { useTranslation } from '@/lib/i18n'

function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function formatConditionType(conditionType: string): string {
  const withSpaces = conditionType.replace(/_/g, ' ')
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}

interface StatCardProps {
  label: string
  value: string
  accentClass: string
}

function StatCard({ label, value, accentClass }: StatCardProps): JSX.Element {
  return (
    <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums truncate ${accentClass}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }): JSX.Element {
  const classes =
    status === 'completed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'planned'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}
    >
      {status}
    </span>
  )
}

function TransactionsTable({ transactions }: { transactions: RevenueTransaction[] }): JSX.Element {
  const t = useTranslation()

  if (transactions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {t.noTransactions}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex-1 min-h-0">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.date}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.patient}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.procedure}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.tooth}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.status}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t.price}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {transactions.map((tx) => (
            <tr
              key={tx.treatmentId}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {tx.datePerformed}
              </td>
              <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                {tx.patientName}
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                {formatConditionType(tx.conditionType)}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums">
                {tx.toothFdi}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={tx.status} />
              </td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 tabular-nums font-medium whitespace-nowrap">
                {formatCurrency(tx.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RevenueView(): JSX.Element {
  const t = useTranslation()
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load(): Promise<void> {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getRevenueStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.revenueLoading}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-hidden items-center justify-center px-6">
        <p
          className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3"
          role="alert"
        >
          {error}
        </p>
      </div>
    )
  }

  if (!stats) {
    return <div className="flex flex-col h-full overflow-hidden" />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header + stat cards */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.revenue}</h1>

        {/* Stat cards row */}
        <div className="flex gap-4">
          <StatCard
            label={t.totalEarned}
            value={formatCurrency(stats.totalEarned)}
            accentClass="text-green-600 dark:text-green-400"
          />
          <StatCard
            label={t.outstanding}
            value={formatCurrency(stats.totalOutstanding)}
            accentClass="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label={t.earnedThisMonth}
            value={formatCurrency(stats.earnedThisMonth)}
            accentClass="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label={t.outstandingThisMonth}
            value={formatCurrency(stats.outstandingThisMonth)}
            accentClass="text-orange-600 dark:text-orange-400"
          />
        </div>
      </div>

      {/* Transactions section */}
      <div className="flex flex-col flex-1 min-h-0 px-6 pb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex-shrink-0">
          {t.allTransactions}
        </h2>
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <TransactionsTable transactions={stats.transactions} />
        </div>
      </div>
    </div>
  )
}

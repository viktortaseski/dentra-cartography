import { DentalChart } from '@/components/chart/DentalChart'

interface ChartViewProps {
  patientId: number
}

export function ChartView({ patientId }: ChartViewProps): JSX.Element {
  return (
    <div className="h-full overflow-auto">
      <DentalChart patientId={patientId} />
    </div>
  )
}

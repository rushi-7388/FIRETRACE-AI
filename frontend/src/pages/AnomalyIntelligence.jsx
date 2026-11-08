import { useMemo } from 'react'
import useAppStore from '../store/useAppStore.js'
import { AlertTriangle, Zap, Activity, ShieldCheck, Flame, Info } from 'lucide-react'
import AnomalyChart from '../components/Charts/AnomalyChart.jsx'

export default function AnomalyIntelligence() {
  const { calendarData } = useAppStore()

  // Find top 10 historical anomalies ranked by Z-Score
  const rankedAnomalies = useMemo(() => {
    if (!calendarData || calendarData.length === 0) return []
    return [...calendarData]
      .filter((d) => d.is_anomaly || Math.abs(d.z_score || 0) >= 1.5)
      .sort((a, b) => Math.abs(b.z_score || 0) - Math.abs(a.z_score || 0))
      .slice(0, 8)
  }, [calendarData])

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border-muted pb-4">
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Zap className="text-ember" size={22} />
          Explainable Fire Anomaly Intelligence & Early Warning
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Detecting critical burning periods and unusual satellite-observed conditions against 25-year statistical baselines.
        </p>
      </div>

      {/* Scientific Disclaimer Alert */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
        <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Scientific Guidance:</strong> Anomaly detection indicates unusual satellite-observed thermal activity relative to the multi-year monthly baseline. It is not an unverified wildfire declaration or predictive forecasting model, but a trigger for enhanced ground surveillance.
        </div>
      </div>

      {/* Anomaly Bar Chart Component */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4">
        <AnomalyChart />
      </div>

      {/* Ranked Historical Anomalies Table */}
      <div className="bg-bg-card border border-border-muted rounded-xl p-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-ember" />
          Top Ranked Historical Anomalies (Ranked by Standardized Deviation Z-Score)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border-muted text-text-muted">
              <tr>
                <th className="py-2">Period</th>
                <th className="py-2">Observed HDI</th>
                <th className="py-2">Historical Median</th>
                <th className="py-2">Z-Score Deviation</th>
                <th className="py-2">Severity Classification</th>
                <th className="py-2">Explainable Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted/50 font-mono">
              {rankedAnomalies.map((item, idx) => {
                const z = item.z_score || 0
                const isPositive = z > 0
                return (
                  <tr key={idx} className="hover:bg-bg-hover">
                    <td className="py-2 font-sans font-medium text-text-primary">
                      {item.year}-{String(item.month).padStart(2, '0')}
                    </td>
                    <td className="py-2">{item.hdi}</td>
                    <td className="py-2">{item.historical_median || '—'}</td>
                    <td className="py-2 font-bold" style={{ color: isPositive ? '#FF4500' : '#38BDF8' }}>
                      {isPositive ? `+${z.toFixed(2)}σ` : `${z.toFixed(2)}σ`}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        Math.abs(z) >= 3 ? 'bg-red-500/20 text-red-400 font-bold' :
                        Math.abs(z) >= 2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {Math.abs(z) >= 3 ? 'Extreme Anomaly' : Math.abs(z) >= 2 ? 'High Anomaly' : 'Moderate'}
                      </span>
                    </td>
                    <td className="py-2 font-sans text-text-muted text-[11px]">
                      {isPositive
                        ? `Burning activity was ${(Math.abs(z) * 1.5).toFixed(1)}x greater than climatological expectation.`
                        : `Significantly suppressed burning activity due to wet or cloudy conditions.`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


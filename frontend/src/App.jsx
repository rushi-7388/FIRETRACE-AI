import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard.jsx'
import GlobalFireMap from './pages/GlobalFireMap.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import Compare from './pages/Compare.jsx'
import RegionalAnalytics from './pages/RegionalAnalytics.jsx'
import AnomalyIntelligence from './pages/AnomalyIntelligence.jsx'
import ReportsDownloads from './pages/ReportsDownloads.jsx'
import ScientificMethodology from './pages/ScientificMethodology.jsx'
import AIIntelligence from './pages/AIIntelligence.jsx'
import Logo from './components/Brand/Logo.jsx'
import {
  Flame, Globe, Calendar, BarChart2, MapPin, Zap, Download, BookOpen, Satellite, BrainCircuit
} from 'lucide-react'
import clsx from 'clsx'

const NAV_LINKS = [
  { to: '/',            label: 'Executive',        icon: Flame },
  { to: '/map',         label: 'Smart AOI Map',    icon: Globe },
  { to: '/calendar',    label: 'Season Calendar',  icon: Calendar },
  { to: '/compare',     label: 'Overlap Lab',      icon: BarChart2 },
  { to: '/analytics',   label: 'Regional & FRP',   icon: MapPin },
  { to: '/anomalies',   label: 'Anomaly Engine',   icon: Zap },
  { to: '/ai-intel',    label: 'AI Studio',        icon: BrainCircuit },
  { to: '/reports',     label: 'Reports & Quality',icon: Download },
  { to: '/methodology', label: 'Methodology',      icon: BookOpen },
]

function Navbar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-border-muted bg-bg-primary/95 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-3 h-14 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Logo size={32} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-text-primary">FIRETRACE AI</span>
          </div>
        </NavLink>

        {/* 8 Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-ember/15 text-ember border border-ember/30 font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                )
              }
            >
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Badge */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-text-muted font-mono">
          <Satellite size={13} className="text-ember" />
          <span>NASA FIRMS Core</span>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/map"         element={<GlobalFireMap />} />
          <Route path="/calendar"    element={<CalendarPage />} />
          <Route path="/compare"     element={<Compare />} />
          <Route path="/analytics"   element={<RegionalAnalytics />} />
          <Route path="/anomalies"   element={<AnomalyIntelligence />} />
          <Route path="/ai-intel"    element={<AIIntelligence />} />
          <Route path="/reports"     element={<ReportsDownloads />} />
          <Route path="/methodology" element={<ScientificMethodology />} />
        </Routes>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161B22',
            color: '#E6EDF3',
            border: '1px solid #30363D',
            borderRadius: '10px',
            fontSize: '12px',
          },
          success: { iconTheme: { primary: '#FF4500', secondary: '#0D1117' } },
        }}
      />
    </div>
  )
}

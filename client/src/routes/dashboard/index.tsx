import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Upload, Sparkles, ChevronRight, Plus, Loader2, Activity, FileText, File } from 'lucide-react'
import {
  User as UserIcon
} from 'lucide-react'
import { useRef, useState } from 'react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

function DashboardOverview() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const navigate = useNavigate()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true)
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false)
        // toast.success("Record uploaded successfully!") 
        // Using alert for simplicity if toast lib not setup, but better to use verify if existing libs
        alert("Record uploaded successfully! Analyzing...")
        navigate({ to: '/dashboard/records' })
      }, 2000)
    }
  }

  const timelineEvents = [
    {
      id: 1,
      date: 'Oct 24, 2024',
      title: 'Annual Physical Examination',
      type: 'Visit',
      summary: 'Routine checkup. Blood pressure normal (120/80). Recommended vitamin D supplement.',
      docType: 'Report',
    },
    {
      id: 2,
      date: 'Sep 15, 2024',
      title: 'Blood Test Results',
      type: 'Lab',
      summary: 'Lipid panel shows improved cholesterol levels. CDC complete blood count within normal range.',
      docType: 'Lab Result',
    },
    {
      id: 3,
      date: 'Aug 02, 2024',
      title: 'Dermatology Consultation',
      type: 'Specialist',
      summary: 'Consultation for skin rash. Prescribed topical cream. Follow-up in 2 weeks if not resolved.',
      docType: 'Prescription',
    },
  ]

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Hidden Input for Simulation */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.png,.dcm"
      />

      {/* Upload overlay if needed, or simple loader */}
      {isUploading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-medium">Processing your record with Gemini 3...</p>
        </div>
      )}

      <div className="flex flex-col gap-8">

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Health Narrative</h1>
            <p className="text-slate-500 mt-1">AI-generated summary based on 12 records.</p>
          </div>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm active:transform active:scale-95"
          >
            <Upload size={18} />
            <span>Upload Records</span>
          </button>
        </motion.div>

        {/* AI Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Sparkles size={16} />
              </div>
              <h2 className="font-semibold text-slate-800">Latest Health Insight</h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Based on your recent blood work from Sep 15, your cholesterol levels have improved significantly compared to last year. Vitamin D levels remain slightly low, which aligns with the recommendation from your Oct 24 physical. No concerning trends detected in recent dermatology screening.
            </p>
            <div className="mt-4 flex gap-3">
              <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Cholesterol Improving</div>
              <div className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">Vitamin D Watch</div>
            </div>
          </div>
        </motion.div>

        {/* Timeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Timeline</h3>
              <Link to="/dashboard/timeline" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
            </div>

            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <Link
                  to="/dashboard/records/$recordId"
                  params={{ recordId: event.id.toString() }}
                  key={event.id}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {getIconForType(event.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm md:text-base group-hover:text-blue-700 transition-colors">{event.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{event.date}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-600">{event.docType}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-slate-600 text-sm ml-13 pl-0.5 leading-relaxed">
                      {event.summary}
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Upload & Stats */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              onClick={handleUploadClick}
              className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all group active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-blue-600" />
              </div>
              <h4 className="font-medium text-slate-900 text-sm group-hover:text-blue-700">Add New Record</h4>
              <p className="text-xs text-slate-500 mt-1">Drag & drop PDF or Image</p>
            </div>

            {/* Stats Cards simulated link */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900 text-sm">Vital Trends</h4>
                <Link to="/dashboard/analysis" className="text-xs text-blue-600 hover:underline">See Analysis</Link>
              </div>
              <div className="space-y-4">
                <StatItem label="Next Checkup" value="Oct 2025" />
                <StatItem label="Documents" value="12 Files" />
                <StatItem label="Providers" value="3 Active" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-md transition-colors cursor-default">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function getIconForType(type: string) {
  switch (type) {
    case 'Visit': return <UserIcon size={18} />
    case 'Lab': return <Activity size={18} />
    case 'Specialist': return <FileText size={18} />
    default: return <File size={18} />
  }
}

import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { FileText, File, Image as ImageIcon, Filter, Search } from 'lucide-react'
import { getRecords } from '../../lib/api'
import { useState, useEffect } from 'react'
export const Route = createFileRoute('/dashboard/records')({
  component: RecordsPage,
})

function RecordsPage() {
  const [filter, setFilter] = useState('All')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecords()
      .then((data) => {
        setRecords(
          data.records.map((r: any) => ({
            id: r.id,
            title: r.file_name,
            date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: mapFileTypeToCategory(r.file_type), // Map backend type to UI category
            size: 'Unknown', // Backend doesn't return size yet
            fileType: r.file_type
          }))
        )
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredRecords = filter === 'All' ? records : records.filter(r => r.type === filter)

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        {loading && <div className="text-center text-slate-500 py-4">Loading records...</div>}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Records Library</h1>
            <p className="text-slate-500 mt-1">Manage and organize your medical files.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search records..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Lab', 'Imaging', 'Prescription', 'Clinical'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === type ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between h-48"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg ${getBgColorForType(record.type)}`}>
                  {getIconForType(record.type)}
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{record.title}</h3>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{record.date}</span>
                  <span>{record.size}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getIconForType(type: string) {
  switch (type) {
    case 'Lab': return <FileText size={24} className="text-blue-600" />
    case 'Imaging': return <ImageIcon size={24} className="text-purple-600" />
    case 'Prescription': return <File size={24} className="text-green-600" />
    default: return <FileText size={24} className="text-slate-600" />
  }
}
function mapFileTypeToCategory(fileType: string) {
  if (fileType === 'dicom' || fileType === 'image') return 'Imaging'
  if (fileType === 'pdf') return 'Lab' // Assuming most PDFs are labs/reports
  return 'Report'
}

function getBgColorForType(type: string) {
  switch (type) {
    case 'Lab': return 'bg-blue-50'
    case 'Imaging': return 'bg-purple-50'
    case 'Prescription': return 'bg-green-50'
    default: return 'bg-slate-100'
  }
}

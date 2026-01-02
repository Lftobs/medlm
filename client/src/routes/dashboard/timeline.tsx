import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Calendar, Syringe, FileText, Activity } from 'lucide-react'

export const Route = createFileRoute('/dashboard/timeline')({
  component: TimelinePage,
})

function TimelinePage() {
  const years = [
    {
      year: 2024,
      events: [
        { date: 'Oct 24', title: 'Annual Physical', type: 'Visit', desc: 'Routine checkup completed.' },
        { date: 'Sep 15', title: 'Blood Work', type: 'Lab', desc: 'Lipid panel results available.' },
        { date: 'Aug 02', title: 'Dermatology', type: 'Specialist', desc: 'Consultation for rash.' },
      ]
    },
    {
      year: 2023,
      events: [
        { date: 'Dec 12', title: 'Flu Shot', type: 'Immunization', desc: 'Seasonal influenza vaccine.' },
        { date: 'Jul 10', title: 'Dental Cleaning', type: 'Dental', desc: 'Regular hygiene appointment.' },
      ]
    }
  ]

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Health Timeline</h1>
        <p className="text-slate-500 mt-1">Chronological history of your medical journey.</p>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 md:ml-8 space-y-12 pb-12">
        {years.map((yearGroup, yIndex) => (
          <div key={yearGroup.year} className="relative">
            {/* Year Marker */}
            <div className="absolute -left-[45px] md:-left-[53px] top-0 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md border border-blue-200">
              {yearGroup.year}
            </div>

            <div className="space-y-8 pt-2">
              {yearGroup.events.map((event, index) => (
                <Link
                  to="/dashboard/records/$recordId"
                  params={{ recordId: '1' }} // Using hardcoded ID 1 for mock demo
                  key={`${yearGroup.year}-${index}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: (yIndex * 0.1) + (index * 0.1) }}
                    className="relative pl-8 md:pl-10 group"
                  >
                    {/* Node */}
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-white border-4 border-blue-500 rounded-full shadow-sm z-10 group-hover:scale-110 transition-transform"></div>

                    {/* Content Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-blue-300 transition-all relative">
                      {/* Connector Line */}
                      <div className="absolute top-3.5 left-[-32px] md:left-[-40px] w-8 h-[2px] bg-slate-200"></div>

                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {getIcon(event.type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{event.title}</h3>
                            <p className="text-sm text-slate-600 mt-0.5">{event.desc}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{event.date}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getIcon(type: string) {
  if (type === 'Immunization') return <Syringe size={18} />
  if (type === 'Lab') return <Activity size={18} />
  if (type === 'Dental') return <Calendar size={18} />
  return <FileText size={18} />
}

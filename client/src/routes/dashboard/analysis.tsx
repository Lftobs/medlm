import { createFileRoute } from '@tanstack/react-router'
import { Sparkles, Send, TrendingUp, Info, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export const Route = createFileRoute('/dashboard/analysis')({
  component: AnalysisPage,
})

function AnalysisPage() {
  const data = [
    { name: 'Jan', value: 180 },
    { name: 'Mar', value: 175 },
    { name: 'May', value: 168 },
    { name: 'Jul', value: 170 },
    { name: 'Sep', value: 162 },
    { name: 'Nov', value: 158 },
  ]

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles size={24} className="text-blue-600" />
          Health IQ
        </h1>
        <p className="text-slate-500 mt-1">Deep dive into your medical data with AI.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-blue-600" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-700 text-sm max-w-lg leading-relaxed">
                Hello! I've analyzed your 12 medical records. I noticed a positive trend in your cholesterol levels this year. What would you like to know?
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-600">YO</span>
              </div>
              <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none text-white text-sm max-w-lg">
                Show me my cholesterol trend specifically.
              </div>
            </div>

            {/* AI Response with Chart Context */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-blue-600" />
              </div>
              <div className="space-y-3 max-w-lg">
                <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed">
                  Here is the trend for your Total Cholesterol over the last 11 months. It has decreased from 180 mg/dL to 158 mg/dL, which is within the healthy range.
                </div>
                {/* Interactive Chart in Chat */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 h-64 shadow-sm">
                  <h4 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={14} /> Total Cholesterol (mg/dL)
                  </h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontSize: '13px', fontWeight: 500 }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask a follow-up question..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Analyzed Sources */}
        <div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">AI Disclaimer</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  MedLM provides summaries for informational purposes only. Always consult a healthcare professional.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider px-1">Sources Used</h3>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-blue-600">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate">Lab Results_Sep2024.pdf</h4>
                    <p className="text-xs text-slate-500">Page {i}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                  "Total Cholesterol: 162 mg/dL. LDL: 95 mg/dL. HDL: 45 mg/dL. Triglycerides: 110 mg/dL..."
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

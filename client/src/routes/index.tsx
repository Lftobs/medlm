import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  History,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Layers,
  ChevronDown,
  Mail,
  Twitter,
  Github,
  Linkedin
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

import Header from '../components/Header'

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <Sparkles size={14} />
              Powered by Gemini 3
            </span>
            <h1 className="text-5xl md:text-6xl font-semibold text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
              Your Medical History,{' '}
              <span className="text-blue-600">Narrated by AI</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              MedLM uses long-context AI to analyze years of medical records, identifying invisible trends and creating a clear narrative for you and your doctor.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group shadow-sm"
              >
                Get Started for Free
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                See How it Works
              </Link>
            </div>
          </motion.div>

          {/* Visual Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <div className="aspect-[16/9] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg
                  className="w-20 h-20 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-sm font-medium">Interactive Health Timeline Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Built for Clarity and Trust</h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              We combine state-of-the-art AI with medical-grade security to help you take control of your health data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<History className="text-blue-600" size={24} />}
              title="10-Year Context"
              description="Upload years of records. Gemini 3 reads them all at once to find patterns doctors might miss."
            />
            <FeatureCard
              icon={<Layers className="text-blue-600" size={24} />}
              title="Multimodal Intake"
              description="Support for PDFs, Lab results, X-rays, and even raw DICOM files from your imaging center."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-blue-600" size={24} />}
              title="Privacy First"
              description="Your data is encrypted and used only for your analysis. We never sell your medical information."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-base text-slate-600">
              Everything you need to know about MedLM
            </p>
          </div>

          <div className="space-y-4">
            <FAQItem
              question="Is my medical data secure?"
              answer="Yes. All data is encrypted end-to-end using industry-standard AES-256 encryption. Your medical records are stored securely and never shared with third parties. We're HIPAA compliant and follow strict data protection protocols."
            />
            <FAQItem
              question="How does the AI analysis work?"
              answer="MedLM uses Google's Gemini 3 long-context AI to analyze your medical records. The AI can process years of data at once, identifying patterns and trends that might be difficult to spot manually. It creates a clear narrative timeline of your health journey."
            />
            <FAQItem
              question="What file formats are supported?"
              answer="We support PDFs, images (JPG, PNG), lab results, DICOM files from imaging centers, and most common medical document formats. You can upload records from multiple sources and we'll process them all together."
            />
            <FAQItem
              question="Can I share results with my doctor?"
              answer="Absolutely. You can generate shareable reports in PDF format that include the AI-generated narrative and key insights. These reports are designed to be clear and actionable for healthcare professionals."
            />
            <FAQItem
              question="How much does it cost?"
              answer="We offer a free tier that allows you to analyze up to 50 pages of medical records. Premium plans start at $9.99/month for unlimited analysis and additional features like priority processing and advanced export options."
            />
            <FAQItem
              question="Do I need technical knowledge to use MedLM?"
              answer="Not at all. MedLM is designed to be simple and intuitive. Just upload your medical records, and our AI does the rest. The interface is user-friendly and guides you through each step of the process."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">MedLM</h3>
              <p className="text-sm text-slate-600 mb-4">
                Your medical history, narrated by AI.
              </p>
              <div className="flex gap-3">
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="mailto:hello@medlm.app" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Mail size={20} />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Security</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Roadmap</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Documentation</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">API Reference</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Blog</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">About</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Careers</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</Link></li>
                <li><Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Partners</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © 2025 MedLM. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Terms of Service</Link>
              <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">HIPAA Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">
        {description}
      </p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-900">{question}</span>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 pt-0">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

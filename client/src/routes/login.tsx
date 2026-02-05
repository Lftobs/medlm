import { createFileRoute } from '@tanstack/react-router'
import { signIn, signUp } from '../lib/auth-client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const [isDemoLoading, setIsDemoLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleSignIn = async () => {
        try {
            await signIn.social({
                provider: 'google',
                callbackURL: '/dashboard',
            })
        } catch (err) {
            console.error('Google sign in error:', err)
            setError('Failed to sign in with Google')
        }
    }

    const handleDemoLogin = async () => {
        setIsDemoLoading(true)
        setError(null)
        try {
            const { data, error: authError } = await signIn.email({
                email: 'demo@medlm.app',
                password: 'demopassword123',
                callbackURL: '/dashboard'
            })

            if (authError) {
                if (authError.status === 401 || authError.code === "INVALID_EMAIL_OR_PASSWORD") {

                    const { error: signUpError } = await signUp.email({
                        email: 'demo@medlm.app',
                        password: 'demopassword123',
                        name: 'Demo User',
                        callbackURL: '/dashboard'
                    })
                    if (signUpError) {
                        setError(signUpError.message || 'Demo account creation failed')
                    } else {
                        window.location.href = '/dashboard'
                    }
                } else {
                    setError(authError.message || 'Demo login failed')
                }
            } else {
                window.location.href = '/dashboard'
            }
        } catch (err) {
            console.error('Demo login error:', err)
            setError('An error occurred during demo login')
        } finally {
            setIsDemoLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100">
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <img
                                src="/medlm-icon.svg"
                                className="relative w-20 h-20 mx-auto rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300"
                                alt="MedLM"
                            />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-slate-900 mt-8 mb-2 tracking-tight"
                    >
                        Welcome to MedLM
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-500 font-medium"
                    >
                        Your medical history, narrated by AI.
                    </motion.p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium flex items-center gap-3"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full h-14 flex items-center justify-center gap-3 px-6 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all duration-300 group active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-400">
                            <span className="px-4 bg-white">or</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDemoLogin}
                        disabled={isDemoLoading}
                        className="w-full h-14 relative flex items-center justify-center gap-3 px-6 bg-slate-900 border border-slate-900 rounded-2xl text-white font-semibold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden active:scale-[0.98]"
                    >
                        {isDemoLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Starting Experience...</span>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Try the Demo</span>
                                </div>
                            </>
                        )}
                    </button>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Experience our AI-powered medical insights <br />
                            <span className="text-slate-600">without sharing your data.</span>
                        </p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <p className="text-xs text-slate-500">
                        By continuing, you agree to our{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Terms</a>
                        {' '}and{' '}
                        <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Privacy Policy</a>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    )
}

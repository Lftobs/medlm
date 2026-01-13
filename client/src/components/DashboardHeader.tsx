import { useState } from "react";
import { Search, Bell, User as UserIcon, LogOut, Settings, User } from "lucide-react";
import { useSession, authClient } from "../lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardHeader() {
    const { data: session } = useSession();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50 w-full">
            <div className="relative w-full max-w-md hidden md:block">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                />
                <input
                    type="text"
                    placeholder="Ask about your health history..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm border border-blue-200 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                    >
                        {session?.user?.name?.[0] || <UserIcon size={16} />}
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden z-50 origin-top-right"
                            >
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                        {session?.user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {session?.user?.email}
                                    </p>
                                </div>

                                <div className="p-1">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left"
                                    >
                                        <User size={16} />
                                        Profile
                                    </button>
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left"
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </button>
                                </div>

                                <div className="h-px bg-slate-50 my-1" />

                                <div className="p-1">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await authClient.signOut();
                                            window.location.href = "/login";
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface AlertDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children?: ReactNode;
    actionLabel?: string;
    cancelLabel?: string;
    onAction?: () => void;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export function AlertDialog({
    open,
    onOpenChange,
    title,
    description,
    actionLabel = "Continue",
    cancelLabel = "Cancel",
    onAction,
    variant = "default",
    loading = false,
}: AlertDialogProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Dialog Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white w-full max-w-md rounded-xl shadow-lg border border-slate-200 pointer-events-auto overflow-hidden"
                        >
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-2">
                                    {title}
                                </h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            <div className="p-6 pt-0 flex justify-end gap-3">
                                <button
                                    disabled={loading}
                                    onClick={() => onOpenChange(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={onAction}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center gap-2",
                                        variant === "destructive"
                                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
                                        loading && "opacity-70 cursor-not-allowed"
                                    )}
                                >
                                    {loading && (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    )}
                                    {actionLabel}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

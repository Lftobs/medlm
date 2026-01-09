import { createFileRoute } from "@tanstack/react-router";
import { FileText, Send, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { simplifyText } from "../../lib/api";

export const Route = createFileRoute("/dashboard/simplify")({
  component: SimplifyPage,
});

function SimplifyPage() {
  const [inputText, setInputText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSimplify = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setSimplifiedText("");

    try {
      const response = await simplifyText(inputText);
      setSimplifiedText(response.simplified);
    } catch (error) {
      console.error("Simplification error:", error);
      setSimplifiedText(
        "Sorry, I encountered an error while simplifying the text. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(simplifiedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" />
          Text Simplifier
        </h1>
        <p className="text-slate-500 mt-1">
          Simplify complex medical text so it's easy for anyone to understand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Complex Medical Text
          </h3>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your complex medical text here... For example: 'The patient presented with acute myocardial infarction characterized by ST-elevation in leads II, III, and aVF, with elevated cardiac biomarkers including troponin I levels of 15.2 ng/mL...'"
            className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400 resize-none"
          />
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              {inputText.length} characters
            </span>
            <button
              onClick={handleSimplify}
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isLoading ? "Simplifying..." : "Simplify Text"}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Simplified Version
            </h3>
            {simplifiedText && (
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            )}
          </div>
          <div className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Loader2 size={20} className="animate-spin mr-2" />
                Simplifying your text...
              </div>
            ) : simplifiedText ? (
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {simplifiedText}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <FileText size={24} className="mr-2" />
                Simplified text will appear here
              </div>
            )}
          </div>
          {simplifiedText && (
            <div className="mt-4 text-sm text-slate-500">
              {simplifiedText.length} characters
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm mb-2">
              How it works
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Paste complex medical terminology or reports</li>
              <li>
                • Our AI simplifies the language while keeping medical accuracy
              </li>
              <li>
                • Perfect for explaining conditions to family members or
                understanding reports
              </li>
              <li>
                • Always consult healthcare professionals for medical decisions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

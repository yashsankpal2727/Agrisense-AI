import React from 'react';
import { AlertCircle, Globe, LoaderCircle, RotateCcw } from 'lucide-react';

export function LanguageSelect({ language, onChange, status = 'ready', errorMessage = '', onRetry }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
      <Globe className="w-4 h-4 text-emerald-700" />
      <span className="sr-only">Display language</span>
      <select
        aria-label="Display language"
        title={status === 'error' ? errorMessage : 'Change display language'}
        value={language}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-32 px-2.5 py-2 rounded-lg border border-emerald-200 bg-white text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none cursor-pointer"
      >
        <option value="English">English</option>
        <option value="Hindi">हिंदी</option>
        <option value="Marathi">मराठी</option>
      </select>
      {status === 'loading' && <LoaderCircle className="w-4 h-4 text-emerald-700 animate-spin" aria-label="Translating page" role="status" />}
      {(status === 'error' || status === 'quota') && (
        <>
          <AlertCircle className="w-4 h-4 text-rose-600" aria-label={errorMessage || 'Translation failed'} role="alert" />
          {(status === 'error' || status === 'quota') && (
            <button
              type="button"
              onClick={onRetry}
              title={status === 'quota' ? 'Check translation quota again' : 'Retry translation'}
              aria-label={status === 'quota' ? 'Check translation quota again' : 'Retry translation'}
              className="p-1 text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </label>
  );
}
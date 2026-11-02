'use client';

import React, { useState, useMemo } from 'react';
import taxonomyData from '../../../lib/taxonomy/preference-matrix.json';

export interface OffLimitsManagerProps {
  offLimits: string[];
  onChange: (updated: string[]) => void;
  onSave?: (updated?: string[]) => Promise<void>;
  isSaving?: boolean;
  saveSuccess?: boolean;
  errorMessage?: string | null;
}

interface TaxonomyCategory {
  category: string;
  weight: number;
  description: string;
  items: Array<{
    label: string;
    category: string;
    weight: number;
  }>;
}

export default function OffLimitsManager({
  offLimits,
  onChange,
  onSave,
  isSaving = false,
  saveSuccess = false,
  errorMessage = null,
}: OffLimitsManagerProps) {
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const categories = useMemo<TaxonomyCategory[]>(() => {
    const rawCategories = (taxonomyData as any)?.categories || [];
    return rawCategories.map((cat: any) => ({
      category: cat.category,
      weight: cat.weight,
      description: cat.description,
      items: (cat.items || []).filter((item: any) => 
        item.label && !item.label.toLowerCase().startsWith('placeholder')
      ),
    }));
  }, []);

  const isSelected = (label: string) => {
    const lower = label.trim().toLowerCase();
    return offLimits.some((item) => item.trim().toLowerCase() === lower);
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = customTagInput.trim();
    if (!cleanTag) return;

    if (isSelected(cleanTag)) {
      setInputError(`"${cleanTag}" is already in your off-limits list.`);
      setTimeout(() => setInputError(null), 3000);
      return;
    }

    const updated = [...offLimits, cleanTag];
    onChange(updated);
    setCustomTagInput('');
    setInputError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const lower = tagToRemove.trim().toLowerCase();
    const updated = offLimits.filter((item) => item.trim().toLowerCase() !== lower);
    onChange(updated);
  };

  const handleToggleTopic = (label: string) => {
    if (isSelected(label)) {
      handleRemoveTag(label);
    } else {
      const updated = [...offLimits, label.trim()];
      onChange(updated);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all off-limits topics?')) {
      onChange([]);
    }
  };

  // Filter categories and items based on search input
  const filteredCategories = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.label.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchFilter]);

  return (
    <div className="border border-zinc-800 bg-zinc-950/60 p-6 rounded-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">🚫</span>
            <h3 className="text-xl font-medium text-zinc-100">Off-Limits &amp; Boundaries</h3>
          </div>
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
            Excluded Topics: The AI Game Master and content engines will strictly avoid any topics listed here.
          </p>
        </div>

        {offLimits.length > 0 && (
          <span className="self-start sm:self-center bg-red-950/40 text-red-300 border border-red-900/40 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
            {offLimits.length} {offLimits.length === 1 ? 'Topic' : 'Topics'} Excluded
          </span>
        )}
      </div>

      {/* Type-in Input for Custom Exclusion Tags */}
      <div className="space-y-2">
        <label htmlFor="custom-exclusion-input" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Add Custom Exclusion Tag
        </label>
        <form onSubmit={handleAddCustomTag} className="flex gap-2">
          <input
            id="custom-exclusion-input"
            type="text"
            value={customTagInput}
            onChange={(e) => {
              setCustomTagInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder="Type a topic, trope, or trigger (e.g., Clowns, Needles, Infidelity)..."
            className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
          />
          <button
            type="submit"
            disabled={!customTagInput.trim()}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 px-5 py-2.5 rounded-lg text-sm font-medium border border-zinc-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            Add Tag
          </button>
        </form>
        {inputError && (
          <p className="text-red-400 text-xs mt-1 animate-in fade-in">{inputError}</p>
        )}
      </div>

      {/* Active Off-Limits Badges */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Active Off-Limits Items
          </span>
          {offLimits.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>

        {offLimits.length === 0 ? (
          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-center">
            <p className="text-xs text-zinc-500">
              No off-limits topics configured. Type custom tags above or select from the standard topics list below to exclude unwanted themes.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {offLimits.map((item) => (
              <span
                key={item}
                className="bg-red-950/40 text-red-300 border border-red-900/40 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(item)}
                  aria-label={`Remove ${item}`}
                  className="hover:text-red-100 text-red-400 focus:outline-none transition-colors ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Curated List Selector (Accordion) */}
      <div className="border border-zinc-800/90 rounded-xl overflow-hidden bg-zinc-900/30">
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-900/60 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">📋</span>
            <span>Choose from standard topics list</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              {isAccordionOpen ? 'Hide taxonomy' : 'Browse matrix'}
            </span>
            <span className={`transform transition-transform duration-200 text-xs text-zinc-400 ${isAccordionOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {isAccordionOpen && (
          <div className="p-4 border-t border-zinc-800/80 space-y-5 bg-zinc-950/40 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Quick search inside accordion */}
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter standard topics (e.g. Anal, Bondage, Massage)..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Render Category Sections */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredCategories.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No standard topics matched &quot;{searchFilter}&quot;.
                </p>
              ) : (
                filteredCategories.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-300">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          Tier {cat.weight}
                        </span>
                      </div>
                      {cat.description && (
                        <span className="text-[11px] text-zinc-500 truncate max-w-[260px] hidden sm:inline">
                          {cat.description}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((item) => {
                        const active = isSelected(item.label);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleToggleTopic(item.label)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 border ${
                              active
                                ? 'bg-red-950/80 text-red-200 border-red-800/80 font-medium shadow-sm'
                                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className={active ? 'text-red-400' : 'text-zinc-600 text-[10px]'}>
                              {active ? '✓' : '+'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button and Status Feedback */}
      {onSave && (
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <p className="text-green-400 text-xs font-medium flex items-center gap-1.5 animate-in fade-in">
                <span>✓</span> Off-limits rules updated
              </p>
            )}
            {errorMessage && (
              <p className="text-red-400 text-xs font-medium animate-in fade-in">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSave()}
            disabled={isSaving}
            className="py-2.5 px-6 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-950 flex items-center justify-center gap-2 whitespace-nowrap self-end sm:self-auto"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Boundary Rules</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

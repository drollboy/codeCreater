
import React, { useState, useEffect, useRef } from 'react';
import { CodeSnippet } from '../types';
import { FileCode, Database, FileJson, Copy, Check, Terminal, Layers, Edit2, Save, X } from 'lucide-react';

// Access global Prism
declare const Prism: any;

interface CodeExplorerProps {
  snippets: CodeSnippet[];
  onUpdateSnippet: (index: number, newCode: string) => void;
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ snippets, onUpdateSnippet }) => {
  const safeSnippets = Array.isArray(snippets) ? snippets : [];
  
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  const codeRef = useRef<HTMLElement>(null);

  // Set initial selected snippet
  useEffect(() => {
    if (safeSnippets.length > 0) {
        // If nothing selected, or selected item no longer exists in the list (e.g. after list update)
        // match by title if possible to keep selection stable, otherwise pick first
        if (!selectedSnippet) {
            setSelectedSnippet(safeSnippets[0]);
            setIsEditing(false);
        } else {
            const updated = safeSnippets.find(s => s && s.title === selectedSnippet.title);
            if (updated) {
                setSelectedSnippet(updated);
            } else {
                // If current selection is gone, fallback to first
                setSelectedSnippet(safeSnippets[0]);
                setIsEditing(false);
            }
        }
    } else {
        setSelectedSnippet(null);
    }
  }, [safeSnippets, selectedSnippet]);

  // Apply Syntax Highlighting when selection changes or editing stops
  useEffect(() => {
    if (codeRef.current && selectedSnippet && !isEditing) {
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(codeRef.current);
        }
    }
  }, [selectedSnippet, isEditing]);

  const handleCopy = () => {
    if (selectedSnippet) {
      navigator.clipboard.writeText(selectedSnippet.code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startEditing = () => {
    if (selectedSnippet) {
      setEditValue(selectedSnippet.code || '');
      setIsEditing(true);
    }
  };

  const saveEditing = () => {
    if (selectedSnippet) {
        // Find index
        const idx = safeSnippets.indexOf(selectedSnippet);
        if (idx !== -1) {
            onUpdateSnippet(idx, editValue);
        }
        setIsEditing(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const getIconForType = (title: string = '', lang: string = '') => {
    // Safety checks to prevent toLowerCase() on undefined
    const t = (title || '').toLowerCase();
    const l = (lang || '').toLowerCase();
    
    if (l === 'sql' || t.includes('sql') || t.includes('ddl')) return <Database className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
    if (l === 'prisma' || t.includes('schema') || t.includes('model')) return <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    if (t.includes('interface') || t.includes('type') || t.includes('dto')) return <FileJson className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    if (t.includes('controller') || t.includes('route') || t.includes('api')) return <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    return <FileCode className="w-4 h-4 text-slate-400" />;
  };

  if (safeSnippets.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FileCode className="w-16 h-16 mb-4 opacity-20" />
            <p>代码生成后将显示在此处</p>
        </div>
    )
  }

  return (
    <div className="flex h-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Sidebar - Snippet List */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col bg-gray-50 dark:bg-slate-900/50">
        <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          生成片段 ({safeSnippets.length})
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {safeSnippets.map((snippet, idx) => {
            if (!snippet) return null; // Safety check for null items in array
            return (
              <button
                key={idx}
                onClick={() => { setSelectedSnippet(snippet); setIsEditing(false); }}
                title={`${snippet.title || 'Untitled'}\n${snippet.description || ''}`}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2
                  ${selectedSnippet === snippet 
                    ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm' 
                    : 'border-transparent hover:bg-slate-200 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }
                `}
              >
                <div className="mt-0.5 shrink-0">
                  {getIconForType(snippet.title, snippet.language)}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${selectedSnippet === snippet ? 'text-blue-600 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                    {snippet.title || '无标题片段'}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {snippet.description || '暂无描述'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0d1117] transition-colors duration-300">
        {selectedSnippet ? (
          <>
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedSnippet.title || 'Untitled'}</span>
                <span className="text-xs text-slate-500 font-mono mt-0.5">{selectedSnippet.language || 'text'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                     <button 
                        onClick={startEditing}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 rounded transition-colors"
                     >
                        <Edit2 className="w-3.5 h-3.5" />
                        编辑
                     </button>
                     <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 rounded transition-colors"
                     >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? '已复制' : '复制'}
                     </button>
                  </>
                ) : (
                   <>
                      <button 
                         onClick={saveEditing}
                         className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors shadow-sm"
                      >
                         <Save className="w-3.5 h-3.5" />
                         保存
                      </button>
                      <button 
                         onClick={cancelEditing}
                         className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors"
                      >
                         <X className="w-3.5 h-3.5" />
                         取消
                      </button>
                   </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto relative custom-scrollbar">
              {isEditing ? (
                <textarea 
                    className="w-full h-full p-6 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 outline-none resize-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    spellCheck={false}
                />
              ) : (
                <div className="p-6">
                    <pre className="!m-0 !bg-transparent text-sm font-mono leading-relaxed whitespace-pre-wrap">
                        <code ref={codeRef} className={`language-${selectedSnippet.language || 'text'}`}>
                            {selectedSnippet.code || ''}
                        </code>
                    </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
            请选择左侧片段查看代码
          </div>
        )}
      </div>
    </div>
  );
};

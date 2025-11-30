
import React, { useState } from 'react';
import { STATIC_DOCS, DocSection } from '../data/staticDocs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { BookOpen, ChevronRight, Hash } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>(STATIC_DOCS[0].id);

  // Group docs by category
  const categories = STATIC_DOCS.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocSection[]>);

  const selectedDoc = STATIC_DOCS.find(d => d.id === selectedDocId);

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
            <h2 className="font-bold text-lg">快速入门</h2>
          </div>
          <p className="text-xs text-slate-500 mt-2">环境配置与常用命令速查</p>
        </div>
        
        <div className="p-4 space-y-6">
          {Object.entries(categories).map(([category, docs]) => (
            <div key={category}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                {category}
              </h3>
              <div className="space-y-1">
                {docs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group
                      ${selectedDocId === doc.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <span>{doc.title}</span>
                    {selectedDocId === doc.id && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {selectedDoc ? (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
             <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                 <Hash className="w-3 h-3" />
                 <span>{selectedDoc.category}</span>
               </div>
               <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedDoc.title}</h1>
             </div>
             
             {/* Reuse MarkdownRenderer but we might need to style code blocks manually if the renderer is too simple */}
             <div className="prose dark:prose-invert max-w-none">
                 {/* 
                    Injecting a slightly more complex structure for Code Blocks if MarkdownRenderer 
                    doesn't handle it perfectly. For now, assuming standard usage.
                  */}
                 <MarkdownRenderer content={selectedDoc.content} />
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            请选择左侧文档查看
          </div>
        )}
      </div>
    </div>
  );
};

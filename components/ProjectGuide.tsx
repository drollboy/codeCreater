
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, CheckCircle2, Copy, Check, Terminal, Edit2, Save, X } from 'lucide-react';

// Access global Prism
declare const Prism: any;

interface ProjectGuideProps {
  guideContent: string;
  onUpdateGuide: (newContent: string) => void;
}

const CodeBlock: React.FC<{ content: string }> = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const codeContent = content.replace(/^```[a-z]*\n/, '').replace(/```$/, '').trim();
  // Extract language if present
  const match = content.match(/^```([a-z]*)/);
  const language = match ? match[1] : 'bash';

  useEffect(() => {
    if (codeRef.current && typeof Prism !== 'undefined') {
        Prism.highlightElement(codeRef.current);
    }
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden shadow-sm group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f172a] border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-mono">{language || 'shell'}</span>
        </div>
        <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-blue-600 px-2 py-1 rounded transition-all opacity-0 group-hover:opacity-100"
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="!m-0 !p-0 !bg-transparent text-sm font-mono leading-relaxed">
            <code ref={codeRef} className={`language-${language}`}>
                {codeContent}
            </code>
        </pre>
      </div>
    </div>
  );
};

export const ProjectGuide: React.FC<ProjectGuideProps> = ({ guideContent, onUpdateGuide }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(guideContent);

  const handleSave = () => {
    onUpdateGuide(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(guideContent);
    setIsEditing(false);
  };

  if (!guideContent && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <BookOpen className="w-16 h-16 mb-4 opacity-20" />
        <p>暂无项目指南。</p>
      </div>
    );
  }

  // Improved parser logic: Split by code blocks first
  const renderContent = (content: string) => {
    // Regex to capture code blocks (greedy)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, partIndex) => {
      // If it's a code block
      if (part.startsWith('```')) {
        return <CodeBlock key={`block-${partIndex}`} content={part} />;
      }

      // If it's text, process line by line
      return (
        <div key={`text-${partIndex}`}>
            {part.split('\n').map((line, lineIndex) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('### ')) {
                    return (
                        <h3 key={lineIndex} className="text-lg font-bold text-slate-800 dark:text-blue-200 mt-6 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            {trimmed.replace('### ', '')}
                        </h3>
                    );
                }
                if (trimmed.startsWith('## ')) {
                    return (
                        <h2 key={lineIndex} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                            {trimmed.replace('## ', '')}
                        </h2>
                    );
                }
                if (trimmed.startsWith('# ')) {
                     return (
                        <h1 key={lineIndex} className="text-2xl font-bold text-slate-900 dark:text-white mt-4 mb-6">
                            {trimmed.replace('# ', '')}
                        </h1>
                    );
                }
                if (trimmed.startsWith('- ')) {
                    // Make lists look nicer
                    return (
                        <div key={lineIndex} className="flex items-start gap-3 ml-1 mb-2">
                             <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                             <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {trimmed.replace('- ', '')}
                             </p>
                        </div>
                    );
                }
                 // Bold text parsing (**text**) simplified
                 const parts = line.split(/(\*\*.*?\*\*)/g);
                 return (
                    <p key={lineIndex} className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed my-2 pl-1">
                        {parts.map((p, i) => {
                            if (p.startsWith('**') && p.endsWith('**')) {
                                return <strong key={i} className="text-slate-800 dark:text-slate-200 font-semibold">{p.slice(2, -2)}</strong>;
                            }
                            return p;
                        })}
                    </p>
                 );
            })}
        </div>
      );
    });
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl transition-colors duration-300">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">项目搭建指南</h2>
                    <p className="text-sm text-slate-500">按照以下步骤初始化您的后端项目</p>
                </div>
             </div>
             
             {!isEditing ? (
                 <button 
                   onClick={() => { setEditValue(guideContent); setIsEditing(true); }}
                   className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 rounded transition-colors"
                 >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑指南
                 </button>
             ) : (
                <div className="flex items-center gap-2">
                  <button 
                     onClick={handleSave}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors shadow-sm"
                  >
                     <Save className="w-3.5 h-3.5" />
                     保存
                  </button>
                  <button 
                     onClick={handleCancel}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors"
                  >
                     <X className="w-3.5 h-3.5" />
                     取消
                  </button>
               </div>
             )}
          </div>
          
          <div className="prose-container">
             {isEditing ? (
                <textarea 
                    className="w-full h-[600px] p-4 font-mono text-sm leading-relaxed bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                />
             ) : (
                renderContent(guideContent)
             )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Terminal, ExternalLink } from 'lucide-react';

declare const Prism: any;

const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && typeof Prism !== 'undefined') {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden shadow-sm group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f172a] border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <Terminal className="w-3 h-3" />
            <span className="font-mono">{language || 'text'}</span>
        </div>
        <button 
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-blue-600 px-2 py-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
        >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <pre className="!m-0 !p-0 !bg-transparent text-sm font-mono leading-relaxed">
            <code ref={codeRef} className={`language-${language}`}>
                {code}
            </code>
        </pre>
      </div>
    </div>
  );
};

const InlineParser: React.FC<{ text: string }> = ({ text }) => {
  // Split by links first: [text](url)
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        // Handle Links
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a 
              key={i} 
              href={linkMatch[2]} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              {linkMatch[1]}
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }

        // Handle Bold within text: **bold**
        const subParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={i}>
            {subParts.map((sub, j) => {
              if (sub.startsWith('**') && sub.endsWith('**')) {
                return <strong key={j} className="font-semibold text-slate-900 dark:text-slate-100">{sub.slice(2, -2)}</strong>;
              }
              // Handle Inline Code: `code`
              const codeParts = sub.split(/(`[^`]+`)/g);
              return (
                 <span key={j}>
                    {codeParts.map((cp, k) => {
                        if (cp.startsWith('`') && cp.endsWith('`')) {
                            return <code key={k} className="bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1 py-0.5 rounded text-xs font-mono border border-slate-200 dark:border-slate-700">{cp.slice(1, -1)}</code>
                        }
                        return cp;
                    })}
                 </span>
              )
            })}
          </span>
        );
      })}
    </>
  );
};

export const MarkdownRenderer: React.FC<{ content: string, className?: string }> = ({ content, className = "" }) => {
  if (!content) return null;

  // Split content by Code Blocks
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${className}`}>
      {blocks.map((block, index) => {
        // 1. Render Code Block
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          const language = lines[0].replace('```', '').trim();
          const code = lines.slice(1, -1).join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        }

        // 2. Render Text Content (Headers, Lists, Paragraphs)
        return (
          <div key={index}>
            {block.split('\n').map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-2" />;

              // Headers
              if (trimmed.startsWith('# ')) {
                return <h1 key={lineIdx} className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800"><InlineParser text={trimmed.slice(2)} /></h1>;
              }
              if (trimmed.startsWith('## ')) {
                return <h2 key={lineIdx} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-5 mb-3"><InlineParser text={trimmed.slice(3)} /></h2>;
              }
              if (trimmed.startsWith('### ')) {
                return <h3 key={lineIdx} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2"><InlineParser text={trimmed.slice(4)} /></h3>;
              }

              // Lists
              if (trimmed.startsWith('- ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 ml-2 mb-1.5">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span className="leading-relaxed"><InlineParser text={trimmed.slice(2)} /></span>
                  </div>
                );
              }
              
              // Numbered Lists (Simple support)
              const numMatch = trimmed.match(/^(\d+)\.\s/);
              if (numMatch) {
                  return (
                      <div key={lineIdx} className="flex items-start gap-2 ml-2 mb-1.5">
                          <span className="font-mono text-slate-500 font-bold min-w-[20px]">{numMatch[1]}.</span>
                          <span className="leading-relaxed"><InlineParser text={trimmed.replace(numMatch[0], '')} /></span>
                      </div>
                  )
              }

              // Paragraph
              return <p key={lineIdx} className="mb-2"><InlineParser text={trimmed} /></p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

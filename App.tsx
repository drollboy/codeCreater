

import React, { useState, useEffect, useRef } from 'react';
import { generateBackend } from './services/geminiService';
import { GeneratedResult, ViewMode, HistoryItem, Theme, Message, TechStack, AIConfig, ProviderConfigs } from './types';
import { SchemaVisualizer } from './components/SchemaVisualizer';
import { CodeExplorer } from './components/CodeExplorer';
import { ProjectGuide } from './components/ProjectGuide';
import { TechStackSelector } from './components/TechStackSelector';
import { ModelSettings } from './components/ModelSettings';
import { KnowledgeBase } from './components/KnowledgeBase';
import { 
  Terminal, Code2, Database, Send, Sparkles, Loader2, PlayCircle, Download, 
  BookOpen, Clock, Trash2, Sun, Moon, Monitor, X, Upload, MessageSquare, Plus,
  Settings, Library
} from 'lucide-react';
import { MarkdownRenderer } from './components/MarkdownRenderer';

const DEFAULT_STACK: TechStack = {
  name: "Node.js 轻量级",
  language: 'JavaScript',
  framework: 'Express',
  database: 'SQLite',
  orm: 'TypeORM'
};

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'google',
  apiKey: process.env.API_KEY || '',
  modelName: 'gemini-2.5-flash'
};

const App: React.FC = () => {
  // State
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [techStack, setTechStack] = useState<TechStack>(DEFAULT_STACK);
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.PROMPT);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // Load configuration and history
  useEffect(() => {
    // History
    const savedHistory = localStorage.getItem('backendforge_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("Failed to parse history"); }
    }

    // AI Config
    const savedConfig = localStorage.getItem('backendforge_ai_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Ensure default key exists if present in env but not in local storage initially
        if (!parsed.apiKey && process.env.API_KEY && parsed.provider === 'google') {
           parsed.apiKey = process.env.API_KEY;
        }
        setAiConfig(parsed);
      } catch (e) { console.error("Failed to parse AI config"); }
    } else {
        // If no saved config, use env var for Google default
        if (process.env.API_KEY) {
            setAiConfig(prev => ({ ...prev, apiKey: process.env.API_KEY }));
        }
    }
  }, []);

  const saveAiConfig = (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    localStorage.setItem('backendforge_ai_config', JSON.stringify(newConfig));
  };

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: Theme) => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    // 直接重置，移除 window.confirm 以防止被浏览器拦截导致无反应
    setMessages([]);
    setResult(null);
    setPrompt('');
    setTechStack(DEFAULT_STACK); 
    setViewMode(ViewMode.PROMPT);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (!aiConfig.apiKey) {
        setIsSettingsOpen(true);
        setError("请先配置 API Key");
        return;
    }

    // Add user message to chat immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt(''); // Clear input
    setIsGenerating(true);
    setError(null);

    try {
      // Pass current result as context and the AI config
      const data = await generateBackend(userMsg.content, techStack, result || undefined, aiConfig);
      
      const newHistoryItem: HistoryItem = {
        ...data,
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: userMsg.content,
        techStack: techStack
      };
      
      setResult(data);
      
      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.chatResponse || "代码已生成，请查看右侧面板。",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Update History
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('backendforge_history', JSON.stringify(updatedHistory));

    } catch (err: any) {
      console.error(err);
      setError(err.message || "生成失败，请检查设置或网络。");
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ 生成失败: ${err.message || '未知错误，请检查 API Key 设置。'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item);
    if (item.techStack) setTechStack(item.techStack);
    
    setMessages([
      { id: '1', role: 'user', content: item.prompt, timestamp: item.timestamp },
      { id: '2', role: 'assistant', content: item.chatResponse || "已加载历史版本。", timestamp: item.timestamp + 1 }
    ]);
    
    setViewMode(ViewMode.PROMPT);
    setShowHistory(false);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('backendforge_history', JSON.stringify(updated));
  };

  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `backend-snippets.json`;
    document.body.appendChild(element);
    element.click();
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const data = JSON.parse(content) as GeneratedResult;
            
            if (!data.snippets || !data.schema) throw new Error("Invalid format");

            setResult(data);
            setMessages([{ 
                id: 'import', 
                role: 'assistant', 
                content: "项目已成功导入。", 
                timestamp: Date.now() 
            }]);
            setViewMode(ViewMode.CODE);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
        } catch (err) {
            alert("导入失败：文件格式不正确");
        }
    };
    reader.readAsText(file);
  };

  // State Updates from Child Components
  const handleUpdateSnippet = (index: number, newCode: string) => {
    if (!result) return;
    const newSnippets = [...result.snippets];
    newSnippets[index] = { ...newSnippets[index], code: newCode };
    setResult({ ...result, snippets: newSnippets });
  };

  const handleUpdateExplanation = (newExpl: string) => {
    if (!result) return;
    setResult({ ...result, explanation: newExpl });
  };

  const handleUpdateGuide = (newGuide: string) => {
    if (!result) return;
    setResult({ ...result, projectSetupGuide: newGuide });
  };

  const NavButton = ({ mode, icon: Icon, label, disabled = false }: any) => (
    <button 
      onClick={() => !disabled && setViewMode(mode)}
      disabled={disabled}
      className={`p-3 rounded-xl transition-all relative group
        ${viewMode === mode 
          ? 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' 
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'} 
        ${disabled && 'opacity-30 cursor-not-allowed'}
      `}
      title={label}
    >
      <Icon className="w-6 h-6" />
      {!disabled && viewMode !== mode && (
         <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {label}
         </div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Settings Modal */}
      <ModelSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={aiConfig}
        onSave={saveAiConfig}
      />

      {/* Hidden File Input for Import */}
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />

      {/* Sidebar / Navigation */}
      <div className="w-16 md:w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 gap-6 z-40 shadow-sm relative">
        <button 
          onClick={handleNewChat}
          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 hover:scale-105 transition-transform cursor-pointer"
          title="新项目 / 重置"
        >
          <Terminal className="text-white w-6 h-6" />
        </button>

        <NavButton mode={ViewMode.PROMPT} icon={MessageSquare} label="AI 对话" />
        <NavButton mode={ViewMode.CODE} icon={Code2} label="代码片段" disabled={!result} />
        <NavButton mode={ViewMode.SCHEMA} icon={Database} label="架构视图" disabled={!result} />
        <NavButton mode={ViewMode.GUIDE} icon={BookOpen} label="项目指南" disabled={!result} />
        
        {/* Divider */}
        <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-1"></div>
        
        {/* Knowledge Base Button */}
        <NavButton mode={ViewMode.DOCS} icon={Library} label="知识库" disabled={false} />

        <div className="mt-auto flex flex-col gap-4 items-center w-full border-t border-slate-200 dark:border-slate-800 pt-6">
             <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-xl transition-all ${showHistory ? 'text-blue-500 bg-blue-50 dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              title="历史记录"
            >
              <Clock className="w-6 h-6" />
            </button>
            <button onClick={triggerImport} className="p-3 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="导入项目">
              <Upload className="w-6 h-6" />
            </button>
             <button onClick={handleDownload} disabled={!result} className={`p-3 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ${!result && 'opacity-30 cursor-not-allowed'}`} title="下载结果">
              <Download className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* History Sidebar Panel */}
      <div className={`fixed left-16 md:left-20 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 transition-transform duration-300 transform ${showHistory ? 'translate-x-0 shadow-[10px_0_30px_-10px_rgba(0,0,0,0.1)]' : '-translate-x-full'}`}>
         <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center h-16">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">生成历史</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
         </div>
         <div className="overflow-y-auto h-[calc(100%-4rem)] p-2">
            {history.length === 0 ? <div className="text-center text-slate-400 py-10 text-sm">暂无历史记录</div> : history.map(item => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} className={`group p-3 mb-2 rounded-lg cursor-pointer border border-transparent hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all ${result?.schema === item.schema ? 'bg-blue-50 dark:bg-slate-800 border-blue-500/50' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <button onClick={(e) => deleteHistoryItem(e, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{item.prompt}</p>
                    {item.techStack && (
                      <span className="text-[10px] text-slate-500 mt-1 block">{item.techStack.language} / {item.techStack.framework}</span>
                    )}
                </div>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center px-6 justify-between sticky top-0 z-30">
            <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">BackendForge</h1>
                <p className="text-xs text-slate-500">智能后端代码生成工作台</p>
            </div>
            <div className="flex items-center gap-4">
                {/* Model Settings Button */}
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                    <Settings className="w-4 h-4" />
                    <span>{aiConfig.modelName || '模型设置'}</span>
                </button>

                {/* New Project Button */}
                {messages.length > 0 && (
                   <button 
                     onClick={handleNewChat}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                     title="开始新项目 (将会清除当前会话)"
                   >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">新项目</span>
                   </button>
                )}

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setTheme('light')} className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-600 shadow text-yellow-500' : 'text-slate-400'}`}><Sun className="w-4 h-4" /></button>
                    <button onClick={() => setTheme('system')} className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow text-blue-500' : 'text-slate-400'}`}><Monitor className="w-4 h-4" /></button>
                    <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-600 shadow text-purple-400' : 'text-slate-400'}`}><Moon className="w-4 h-4" /></button>
                </div>
            </div>
        </header>

        {/* View Areas */}
        <main className="flex-1 overflow-hidden relative">
          
          {/* Chat / Prompt View */}
          <div className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${viewMode === ViewMode.PROMPT ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
             
             {/* Chat History or Initial State */}
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-950">
                {messages.length === 0 ? (
                  // Initial Welcome Screen
                  <div className="max-w-3xl mx-auto mt-10">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">从需求到代码，仅需一瞬</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                            配置您的技术栈，描述业务逻辑，AI 将为您构建全套后端脚手架。
                        </p>
                        {/* Config Check Alert */}
                        {!aiConfig.apiKey && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm border border-amber-200 dark:border-amber-800/50 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors" onClick={() => setIsSettingsOpen(true)}>
                                <Settings className="w-4 h-4" />
                                <span>请先配置 API Key 以开始使用</span>
                            </div>
                        )}
                    </div>
                    {/* Tech Stack Selector */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 mb-8">
                       <TechStackSelector selectedStack={techStack} onChange={setTechStack} />
                    </div>
                  </div>
                ) : (
                  // Chat Messages
                  <div className="max-w-3xl mx-auto space-y-6 pb-20">
                    
                    {/* Tech Stack Indicator */}
                    <div className="flex items-center justify-center gap-3 mb-8 opacity-80">
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Stack</span>
                         <div className="flex items-center gap-2">
                             <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">{techStack.language}</span>
                             <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">{techStack.framework}</span>
                             <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">{techStack.database}</span>
                             <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">{techStack.orm}</span>
                         </div>
                    </div>

                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-600'}`}>
                            {msg.role === 'user' ? <div className="text-xs font-bold">You</div> : <Sparkles className="w-4 h-4 text-white" />}
                         </div>
                         <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[80%] shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                                : 'bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-blue-100 dark:border-blue-800/30'
                            }
                         `}>
                            {msg.role === 'assistant' ? <MarkdownRenderer content={msg.content} /> : msg.content}
                         </div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                           <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="text-slate-500 text-sm py-2">
                            {aiConfig.provider === 'deepseek' ? 'DeepSeek 正在思考...' : 'AI 正在生成代码...'}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
             </div>

             {/* Input Area */}
             <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-3xl mx-auto relative">
                    <textarea 
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-4 pr-24 rounded-xl min-h-[60px] max-h-[150px] outline-none resize-none focus:ring-2 focus:ring-blue-500/50 border border-slate-200 dark:border-slate-700 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                        placeholder={messages.length === 0 ? "例如：我需要一个用户订单系统，包含商品、购物车和订单接口..." : "继续描述修改需求，例如：给 User 表添加一个 phone 字段..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all
                            ${!prompt.trim() || isGenerating 
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                            }
                        `}
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                {messages.length === 0 && (
                   <div className="text-center mt-2 text-xs text-slate-400 dark:text-slate-600">
                      按 Enter 发送 • Shift + Enter 换行
                   </div>
                )}
             </div>
          </div>

          {/* Other Views */}
          <div className={`absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-opacity duration-300 ${viewMode === ViewMode.SCHEMA ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
             {result && <div className="h-full flex flex-col"><div className="flex-1 overflow-hidden relative"><SchemaVisualizer schema={result.schema} explanation={result.explanation} onUpdateExplanation={handleUpdateExplanation}/></div></div>}
          </div>
          <div className={`absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-opacity duration-300 ${viewMode === ViewMode.CODE ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
             {result && <CodeExplorer snippets={result.snippets} onUpdateSnippet={handleUpdateSnippet}/>}
          </div>
          <div className={`absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-opacity duration-300 ${viewMode === ViewMode.GUIDE ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
             {result && <ProjectGuide guideContent={result.projectSetupGuide} onUpdateGuide={handleUpdateGuide}/>}
          </div>
          <div className={`absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-opacity duration-300 ${viewMode === ViewMode.DOCS ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
             <KnowledgeBase />
          </div>

        </main>
      </div>
    </div>
  );
};

export default App;
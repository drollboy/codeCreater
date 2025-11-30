
import React, { useState } from 'react';
import { FileText, Edit2, Save, X, Webhook } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ApiDocViewerProps {
  apiDoc: string;
  onUpdateApiDoc: (newContent: string) => void;
}

export const ApiDocViewer: React.FC<ApiDocViewerProps> = ({ apiDoc, onUpdateApiDoc }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(apiDoc);

  const handleSave = () => {
    onUpdateApiDoc(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(apiDoc);
    setIsEditing(false);
  };

  if (!apiDoc && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Webhook className="w-16 h-16 mb-4 opacity-20" />
        <p>暂无 API 接口文档。</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar transition-colors duration-300">
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-xl transition-colors duration-300">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                    <Webhook className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">API 接口文档</h2>
                    <p className="text-sm text-slate-500">供前端开发使用的接口定义与规范</p>
                </div>
             </div>
             
             {!isEditing ? (
                 <button 
                   onClick={() => { setEditValue(apiDoc); setIsEditing(true); }}
                   className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-white bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 rounded transition-colors"
                 >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑文档
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
                <div className="prose dark:prose-invert max-w-none">
                  <MarkdownRenderer content={apiDoc} />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

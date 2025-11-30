
import React, { useState } from 'react';
import { TableSchema } from '../types';
import { Database, Key, GitCommit, Link, Edit2, Check, X } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SchemaVisualizerProps {
  schema: TableSchema[];
  explanation: string;
  onUpdateExplanation: (newExplanation: string) => void;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ schema, explanation, onUpdateExplanation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(explanation);

  const handleSave = () => {
    onUpdateExplanation(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(explanation);
    setIsEditing(false);
  };

  // Safe check for array
  const safeSchema = Array.isArray(schema) ? schema : [];

  if (safeSchema.length === 0 && !explanation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Database className="w-16 h-16 mb-4 opacity-20" />
        <p>暂无数据库架构。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Visualizer Area */}
      <div className="flex-1 p-8 overflow-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {safeSchema.map((table, tableIdx) => (
            <div key={table.tableName || tableIdx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]">
              <div className="bg-gray-50 dark:bg-slate-700/50 p-3 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{table.tableName || 'Unnamed Table'}</h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate max-w-[150px]">{table.description}</span>
              </div>
              
              <div className="p-4 flex-1">
                <ul className="space-y-3">
                  {/* Safe check for columns array */}
                  {Array.isArray(table.columns) && table.columns.length > 0 ? (
                    table.columns.map((col, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-2">
                          {col.isPrimary ? (
                            <Key className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                          ) : col.relation ? (
                            <Link className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                          ) : (
                            <GitCommit className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                          )}
                          <span className={`font-mono ${col.isPrimary ? 'text-yellow-700 dark:text-yellow-100 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {col.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          {col.relation && (
                            <span className="text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                              FK: {col.relation}
                            </span>
                          )}
                          <span className="text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {col.type}
                          </span>
                          {col.isNullable && (
                            <span className="text-slate-400 dark:text-slate-500">NULL</span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 text-xs italic text-center py-2">暂无字段定义</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation Panel */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 min-h-[120px] max-h-[300px] overflow-y-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-start justify-between mb-2">
           <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">架构说明</span>
           {!isEditing ? (
             <button 
               onClick={() => { setEditValue(explanation); setIsEditing(true); }}
               className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
               title="编辑说明"
             >
               <Edit2 className="w-4 h-4" />
             </button>
           ) : (
             <div className="flex items-center gap-2">
                <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4"/></button>
                <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1"><Check className="w-4 h-4"/></button>
             </div>
           )}
        </div>

        {isEditing ? (
          <textarea 
            className="w-full h-24 p-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 dark:text-slate-200"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        ) : (
          <div className="text-slate-600 dark:text-slate-300">
             <MarkdownRenderer content={explanation} />
          </div>
        )}
      </div>
    </div>
  );
};

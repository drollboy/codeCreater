

import React from 'react';
import { TechStack, Language, Framework, Database, ORM } from '../types';
import { Layers, Server, Database as DbIcon, Code2 } from 'lucide-react';

interface TechStackSelectorProps {
  selectedStack: TechStack;
  onChange: (stack: TechStack) => void;
  disabled?: boolean;
}

const PRESETS: TechStack[] = [
  {
    name: "Node.js 轻量级 (默认)",
    language: 'JavaScript',
    framework: 'Express',
    database: 'SQLite',
    orm: 'TypeORM'
  },
  {
    name: "TypeScript 企业级",
    language: 'TypeScript',
    framework: 'NestJS',
    database: 'PostgreSQL',
    orm: 'Prisma'
  },
  {
    name: "Python 数据栈",
    language: 'Python',
    framework: 'FastAPI',
    database: 'PostgreSQL',
    orm: 'SQLAlchemy'
  },
  {
    name: "Java Spring Boot",
    language: 'Java',
    framework: 'Spring Boot',
    database: 'MySQL',
    orm: 'Hibernate'
  }
];

export const TechStackSelector: React.FC<TechStackSelectorProps> = ({ selectedStack, onChange, disabled }) => {
  
  const handlePresetClick = (preset: TechStack) => {
    if (disabled) return;
    onChange(preset);
  };

  const updateField = (field: keyof TechStack, value: string) => {
    if (disabled) return;
    onChange({ ...selectedStack, [field]: value, name: undefined }); // Clear preset name if custom modified
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">快速预设</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left
                ${selectedStack.name === preset.name 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className={`text-sm font-bold ${selectedStack.name === preset.name ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                {preset.name}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {preset.language} + {preset.framework}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Selection */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">自定义配置</label>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Language */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Code2 className="w-4 h-4" /> 语言
              </div>
              <select 
                value={selectedStack.language}
                disabled={disabled}
                onChange={(e) => updateField('language', e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Go">Go</option>
                <option value="Java">Java</option>
                <option value="PHP">PHP</option>
                <option value="Rust">Rust</option>
              </select>
            </div>

            {/* Framework */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Layers className="w-4 h-4" /> 框架
              </div>
              <select 
                value={selectedStack.framework}
                disabled={disabled}
                onChange={(e) => updateField('framework', e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                 {(selectedStack.language === 'TypeScript' || selectedStack.language === 'JavaScript') && (
                   <>
                     <option value="Express">Express</option>
                     <option value="NestJS">NestJS</option>
                     <option value="Koa">Koa</option>
                   </>
                 )}
                 {selectedStack.language === 'Python' && (
                   <>
                     <option value="FastAPI">FastAPI</option>
                     <option value="Django">Django</option>
                     <option value="Flask">Flask</option>
                   </>
                 )}
                 {selectedStack.language === 'Go' && (
                   <>
                     <option value="Gin">Gin</option>
                     <option value="Echo">Echo</option>
                   </>
                 )}
                 {selectedStack.language === 'Java' && (
                   <option value="Spring Boot">Spring Boot</option>
                 )}
                 {selectedStack.language === 'PHP' && (
                   <option value="Laravel">Laravel</option>
                 )}
                 {selectedStack.language === 'Rust' && (
                   <option value="Actix Web">Actix Web</option>
                 )}
              </select>
            </div>

            {/* Database */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <DbIcon className="w-4 h-4" /> 数据库
              </div>
              <select 
                value={selectedStack.database}
                disabled={disabled}
                onChange={(e) => updateField('database', e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="SQLite">SQLite (本地)</option>
                <option value="MySQL">MySQL</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MariaDB">MariaDB</option>
                <option value="SQL Server">SQL Server</option>
                <option value="MongoDB">MongoDB</option>
              </select>
            </div>

            {/* ORM */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Server className="w-4 h-4" /> ORM/库
              </div>
              <select 
                value={selectedStack.orm}
                disabled={disabled}
                onChange={(e) => updateField('orm', e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {/* Node */}
                {(selectedStack.language === 'TypeScript' || selectedStack.language === 'JavaScript') && (
                  <>
                    <option value="TypeORM">TypeORM</option>
                    <option value="Prisma">Prisma</option>
                    <option value="Sequelize">Sequelize</option>
                    <option value="MikroORM">MikroORM</option>
                    <option value="Mongoose">Mongoose (Mongo)</option>
                  </>
                )}
                
                {/* Python */}
                {selectedStack.language === 'Python' && (
                   <option value="SQLAlchemy">SQLAlchemy</option>
                )}
                
                {/* Go */}
                {selectedStack.language === 'Go' && (
                   <option value="GORM">GORM</option>
                )}

                {/* Java */}
                {selectedStack.language === 'Java' && (
                   <option value="Hibernate">Hibernate</option>
                )}

                {/* PHP */}
                {selectedStack.language === 'PHP' && (
                   <option value="Eloquent">Eloquent</option>
                )}

                 {/* Rust */}
                 {selectedStack.language === 'Rust' && (
                   <option value="Diesel">Diesel</option>
                )}

                <option value="None">无 (Raw SQL)</option>
              </select>
            </div>
         </div>
      </div>
    </div>
  );
};

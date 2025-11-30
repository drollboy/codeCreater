
import React, { useState, useEffect } from 'react';
import { Settings, Save, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AIConfig, AIProvider, ProviderConfigs } from '../types';

interface ModelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

const PROVIDERS: { id: AIProvider; name: string; defaultBaseUrl: string; defaultModel: string }[] = [
  { 
    id: 'google', 
    name: 'Google Gemini (需翻墙)', 
    defaultBaseUrl: '', 
    defaultModel: 'gemini-2.5-flash' 
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek (深度求索)', 
    defaultBaseUrl: 'https://api.deepseek.com', 
    defaultModel: 'deepseek-chat' 
  },
  { 
    id: 'qwen', 
    name: '通义千问 (阿里云)', 
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    defaultModel: 'qwen-plus' 
  },
  {
    id: 'doubao',
    name: '豆包 (火山引擎)',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1-5-pro-32k-250115' 
  },
  { 
    id: 'custom', 
    name: '自定义 (OpenAI 格式)', 
    defaultBaseUrl: '', 
    defaultModel: '' 
  }
];

const DEFAULT_CONFIGS: ProviderConfigs = PROVIDERS.reduce((acc, p) => {
  acc[p.id] = {
    provider: p.id,
    apiKey: '',
    baseUrl: p.defaultBaseUrl,
    modelName: p.defaultModel
  };
  return acc;
}, {} as ProviderConfigs);

export const ModelSettings: React.FC<ModelSettingsProps> = ({ isOpen, onClose, config, onSave }) => {
  const [activeProvider, setActiveProvider] = useState<AIProvider>(config.provider);
  const [localConfigs, setLocalConfigs] = useState<ProviderConfigs>(DEFAULT_CONFIGS);
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize from LocalStorage or Defaults when opening
  useEffect(() => {
    if (isOpen) {
      setActiveProvider(config.provider);
      setShowApiKey(false); // Reset visibility on open
      
      const savedConfigsStr = localStorage.getItem('backendforge_provider_configs');
      let mergedConfigs = { ...DEFAULT_CONFIGS };

      if (savedConfigsStr) {
        try {
            const saved = JSON.parse(savedConfigsStr);
            mergedConfigs = { ...mergedConfigs, ...saved };
        } catch (e) { console.error("Failed to parse provider configs", e); }
      }

      // Ensure the currently passed active config overrides the stored one (to keep sync)
      mergedConfigs[config.provider] = { ...mergedConfigs[config.provider], ...config };
      
      setLocalConfigs(mergedConfigs);
    }
  }, [isOpen, config]);

  const handleProviderChange = (provider: AIProvider) => {
    setActiveProvider(provider);
  };

  const updateCurrentConfig = (field: keyof AIConfig, value: string) => {
    setLocalConfigs(prev => ({
        ...prev,
        [activeProvider]: {
            ...prev[activeProvider],
            [field]: value
        }
    }));
  };

  const handleSave = () => {
    // 1. Save all configs map to local storage
    localStorage.setItem('backendforge_provider_configs', JSON.stringify(localConfigs));
    
    // 2. Return the currently active provider's config to the app
    onSave(localConfigs[activeProvider]);
    onClose();
  };

  const currentConfig = localConfigs[activeProvider];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">模型设置</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">模型提供商</label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all
                    ${activeProvider === p.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500 text-blue-700 dark:text-blue-300' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                    }
                  `}
                >
                  <span className="font-medium">{p.name}</span>
                  {activeProvider === p.id && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Fields */}
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">API Key</label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"}
                    value={currentConfig.apiKey}
                    onChange={(e) => updateCurrentConfig('apiKey', e.target.value)}
                    placeholder="sk-..."
                    className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    title={showApiKey ? "隐藏" : "显示"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
             </div>

             {activeProvider !== 'google' && (
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Base URL</label>
                  <input 
                    type="text"
                    value={currentConfig.baseUrl}
                    onChange={(e) => updateCurrentConfig('baseUrl', e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">请填写对应服务商的兼容 OpenAI 的 API 地址</p>
               </div>
             )}

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Model Name</label>
                <input 
                  type="text"
                  value={currentConfig.modelName}
                  onChange={(e) => updateCurrentConfig('modelName', e.target.value)}
                  placeholder="model-name"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
             <p>您的 API Key 仅存储在本地浏览器中，不同模型的 Key 会独立保存。</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
           >
             取消
           </button>
           <button 
             onClick={handleSave}
             className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
           >
             <Save className="w-4 h-4" />
             保存配置
           </button>
        </div>
      </div>
    </div>
  );
};

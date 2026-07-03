import { useState, useEffect } from 'react';
import { X, Brain, Key, Globe, Cpu, Save, Sparkles } from 'lucide-react';
import { api } from '@/utils/api';
import type { AIConfig } from '@/types';

interface AIConfigSettingsProps {
  onClose: () => void;
}

const AIConfigSettings = ({ onClose }: AIConfigSettingsProps) => {
  const [config, setConfig] = useState<AIConfig>({
    apiEndpoint: '',
    apiKey: '',
    model: 'gpt-4o-mini',
    siteUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.getAIConfig();
        if (res.success && res.config) {
          setConfig(res.config);
        }
      } catch (error) {
        console.error('加载AI配置失败:', error);
        setSaveMessage('加载配置失败');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await api.saveAIConfig(config);
      if (res.success) {
        setConfig(res.config);
        setSaveMessage('保存成功！');
        setTimeout(() => {
          setSaveMessage('');
          onClose();
        }, 1500);
      } else {
        setSaveMessage('保存失败');
      }
    } catch (error) {
      console.error('保存AI配置失败:', error);
      setSaveMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card p-6 max-w-lg w-full">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="text-primary-500" size={24} />
          <h3 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
            AI 识别配置
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-5">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="text-primary-500 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              配置 AI API 后，上传投注截图即可自动识别比赛信息和预测比分。
              支持 DeepSeek、OpenAI 等兼容 OpenAI API 格式的服务。
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            <div className="flex items-center gap-1.5">
              <Globe size={14} />
              API 地址
            </div>
          </label>
          <input
            type="text"
            value={config.apiEndpoint}
            onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
            placeholder="https://api.deepseek.com/v1/chat/completions"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1">
            支持 OpenAI API 格式的任意 endpoint
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            <div className="flex items-center gap-1.5">
              <Key size={14} />
              API 密钥
            </div>
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu size={14} />
              模型名称
            </div>
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            placeholder="gpt-4o-mini"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1">
            例如：gpt-4o-mini、gpt-4o、claude-3-sonnet 等
          </p>
        </div>

        {saveMessage && (
          <div className={`text-sm text-center py-2 rounded-lg ${saveMessage.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {saveMessage}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving || !config.apiKey}
          className="w-full btn-gold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {isSaving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
};

export default AIConfigSettings;

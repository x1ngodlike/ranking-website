import { useState, useEffect } from 'react';
import { X, Brain, Key, Globe, Cpu, Save, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';
import type { AIConfig } from '@/types';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigModal = ({ isOpen, onClose }: AIConfigModalProps) => {
  const [config, setConfig] = useState<AIConfig>({
    apiEndpoint: '',
    apiKey: '',
    model: 'gpt-4o-mini',
    siteUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (isOpen) loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    setSaveMessage('');
    try {
      const res = await api.getAIConfig();
      if (res.success && res.config) setConfig(res.config);
    } catch (error) {
      console.error('加载AI配置失败:', error);
      setSaveMessage('加载配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await api.saveAIConfig(config);
      if (res.success) {
        setConfig(res.config);
        setSaveMessage('保存成功！');
        setTimeout(() => { setSaveMessage(''); onClose(); }, 1200);
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

  const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Brain className="text-primary-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">AI 识别配置</h2>
                  <p className="text-xs text-neutral-500">配置后可自动识别投注截图</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">加载中...</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30">
                    <div className="flex items-start gap-2">
                      <Sparkles className="text-primary-500 flex-shrink-0 mt-0.5" size={14} />
                      <p className="text-xs text-primary-700 dark:text-primary-300">
                        支持 DeepSeek、OpenAI 等兼容 OpenAI API 格式的服务
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      <Globe size={14} /> API 地址
                    </label>
                    <input
                      type="text"
                      value={config.apiEndpoint}
                      onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                      placeholder="https://api.deepseek.com/v1/chat/completions"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      <Key size={14} /> API 密钥
                    </label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      <Cpu size={14} /> 模型名称
                    </label>
                    <input
                      type="text"
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      placeholder="gpt-4o-mini"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      <Globe size={14} /> 官网地址 <span className="text-neutral-400 font-normal">(可选)</span>
                    </label>
                    <input
                      type="text"
                      value={config.siteUrl}
                      onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                      placeholder="https://your-domain.com"
                      className={inputClass}
                    />
                    <p className="text-xs text-neutral-400 mt-1">配置后AI识别将直接通过URL访问图片</p>
                  </div>

                  {saveMessage && (
                    <div className={`text-sm text-center py-2 rounded-xl flex items-center justify-center gap-1.5 ${saveMessage.includes('成功') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                      {saveMessage.includes('成功') && <Check size={14} />}
                      {saveMessage}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading || !config.apiKey}
                className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {isSaving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIConfigModal;
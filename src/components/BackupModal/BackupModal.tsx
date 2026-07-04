import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Database, RotateCcw, Trash2, Download, Save, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackupInfo } from '@/utils/api';
import { api } from '@/utils/api';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
};

const BackupModal = ({ isOpen, onClose }: BackupModalProps) => {
  const environment = useAppStore((state) => state.environment);
  const listBackups = useAppStore((state) => state.listBackups);
  const createBackup = useAppStore((state) => state.createBackup);
  const restoreBackup = useAppStore((state) => state.restoreBackup);
  const deleteBackup = useAppStore((state) => state.deleteBackup);

  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadBackups = async () => {
    setLoading(true);
    setError('');
    const list = await listBackups(environment);
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) loadBackups();
  }, [isOpen, environment]);

  const handleCreate = async () => {
    if (operating) return;
    setOperating('create');
    setError('');
    const success = await createBackup(environment, 'manual');
    setOperating(null);
    if (success) await loadBackups();
    else setError('创建备份失败');
  };

  const handleRestore = async (filename: string) => {
    if (operating) return;
    if (!confirm('确定要还原此备份吗？当前数据将被覆盖！')) return;
    setOperating(filename);
    setError('');
    const success = await restoreBackup(environment, filename);
    setOperating(null);
    if (success) {
      alert('还原成功，页面将自动刷新');
      window.location.reload();
    } else {
      setError('还原失败');
    }
  };

  const handleDelete = async (filename: string) => {
    if (operating) return;
    if (!confirm('确定要删除此备份吗？')) return;
    setOperating(filename);
    setError('');
    const success = await deleteBackup(environment, filename);
    setOperating(null);
    if (success) await loadBackups();
    else setError('删除失败');
  };

  const handleDownload = async (filename: string) => {
    try {
      setError('');
      const result = await api.downloadBackup(environment, filename);
      if (result.success && result.data) {
        const content = JSON.stringify(result.data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError('下载失败');
      }
    } catch (e) {
      console.error('Download failed:', e);
      setError('下载失败');
    }
  };

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
                  <Database className="text-primary-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">备份与还原</h2>
                  <p className="text-xs text-neutral-500">
                    {environment === 'production' ? '正式环境' : '测试环境'} · 自动备份每15分钟
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Clock size={14} />
                  <span>共 {backups.length} 个备份</span>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!!operating}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {operating === 'create' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  立即备份
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 mb-3">{error}</p>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12 text-neutral-500">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  加载中...
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <Database size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无备份</p>
                  <p className="text-xs mt-1">点击「立即备份」创建第一个备份</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.filename}
                      className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:border-primary-500/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {backup.filename}
                          </span>
                          {backup.label === 'auto' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                              自动
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {formatDate(backup.createdAt)} · {formatFileSize(backup.size)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                          title="下载"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleRestore(backup.filename)}
                          disabled={!!operating}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors disabled:opacity-50"
                          title="还原"
                        >
                          {operating === backup.filename ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RotateCcw size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(backup.filename)}
                          disabled={!!operating}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-400">
                备份存储于服务器 <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">/app/data/backups</code> 目录
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackupModal;
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Database, RotateCcw, Trash2, Download, Save, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BackupInfo } from '@/utils/api';

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
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen, environment]);

  const handleCreate = async () => {
    if (operating) return;
    setOperating('create');
    setError('');
    const success = await createBackup(environment, 'manual');
    setOperating(null);
    if (success) {
      await loadBackups();
    } else {
      setError('创建备份失败');
    }
  };

  const handleRestore = async (filename: string) => {
    if (operating) return;
    if (!confirm('确定要还原此备份吗？当前数据将被覆盖，此操作不可恢复！')) {
      return;
    }
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
    if (!confirm('确定要删除此备份吗？此操作不可恢复！')) {
      return;
    }
    setOperating(filename);
    setError('');
    const success = await deleteBackup(environment, filename);
    setOperating(null);
    if (success) {
      await loadBackups();
    } else {
      setError('删除失败');
    }
  };

  const handleDownload = (backup: BackupInfo) => {
    try {
      const content = JSON.stringify(backup, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Database className="text-primary-500" size={24} />
                <div>
                  <h2 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
                    备份与还原
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {environment === 'production' ? '正式环境' : '测试环境'} · 自动备份每小时执行一次，最多保留30份
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Clock size={16} />
                  <span>共 {backups.length} 个备份</span>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!!operating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {operating === 'create' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
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
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                  <Database size={40} className="mx-auto mb-3 opacity-50" />
                  <p>暂无备份</p>
                  <p className="text-xs mt-1">点击「立即备份」创建第一个备份</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.filename}
                      className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-500/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {backup.filename}
                          </span>
                          {backup.label === 'auto' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500">
                              自动
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {formatDate(backup.createdAt)} · {formatFileSize(backup.size)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleDownload(backup)}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-500 transition-colors"
                          title="下载备份信息"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleRestore(backup.filename)}
                          disabled={!!operating}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-primary-500 transition-colors disabled:opacity-50"
                          title="还原"
                        >
                          {operating === backup.filename ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(backup.filename)}
                          disabled={!!operating}
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                备份文件存储于服务器 <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">/app/data/backups</code> 目录
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BackupModal;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Clock, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  team?: string;
}

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setError('');
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success) {
        setNews(data.news || []);
      } else {
        if (data.message === '未授权，请先登录') {
          setError('新闻服务需要管理员权限，请联系管理员配置');
        } else {
          setError(data.message || '获取新闻失败');
        }
      }
    } catch (e) {
      setError('网络错误，无法获取新闻');
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNews(data.news || []);
      } else {
        setError(data.message || '刷新失败');
      }
    } catch (e) {
      setError('刷新失败');
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-4xl text-gradient-gold mb-2 flex items-center gap-3">
            <Newspaper className="text-primary-500" />
            热点新闻
          </h1>
          <p className="text-neutral-500 dark:text-neutral-500">
            世界杯最新资讯，AI评价的灵感来源
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
            <Clock size={16} />
            {news.length} 条新闻
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? '刷新中' : '刷新'}
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 flex items-center gap-3"
        >
          <AlertCircle className="text-red-500 flex-shrink-0" />
          <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {news.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-12 text-center"
        >
          <Newspaper className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-500">暂无世界杯相关新闻</p>
          <p className="text-sm text-neutral-400 dark:text-neutral-600 mt-2">
            新闻每30分钟自动更新，或点击上方刷新按钮手动获取
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        {news.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="card p-4 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    {item.source}
                  </span>
                  {item.team && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      {item.team}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400 dark:text-neutral-600 flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(item.pubDate)}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-primary-500 transition-colors"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {news.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            新闻来源：懂球帝 | 自动更新频率：每30分钟 | 仅显示近3天世界杯相关新闻
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default NewsPage;

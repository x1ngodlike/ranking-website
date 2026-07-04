import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const CALCULATOR_URL = 'https://m.sporttery.cn/mjc/jsq/zqspf/';

const CalculatorPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-3 mb-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-4xl text-gradient-gold mb-1">奖金计算器</h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">竞彩足球胜平负奖金计算</p>
        </div>
        <a
          href={CALCULATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 px-3 py-2"
        >
          <ExternalLink size={14} />
          <span className="sm:inline">新窗口打开</span>
          <span className="sm:hidden">打开</span>
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center"
      >
        <div
          className="w-full max-w-md border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-lg"
          style={{ height: 'calc(100vh - 180px)', maxHeight: '600px' }}
        >
          <iframe
            src={CALCULATOR_URL}
            title="竞彩足球胜平负奖金计算器"
            className="w-full h-full"
            style={{ border: 'none', width: 'calc(100% + 17px)' }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CalculatorPage;

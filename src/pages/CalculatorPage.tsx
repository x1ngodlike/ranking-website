import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const CALCULATOR_URL = 'https://m.sporttery.cn/mjc/jsq/zqspf/';

const CalculatorPage = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="font-display text-4xl text-gradient-gold mb-2">奖金计算器</h1>
          <p className="text-neutral-500 dark:text-neutral-500">竞彩足球胜平负奖金计算（数据来源：中国体彩官方）</p>
        </div>
        <a
          href={CALCULATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex items-center gap-2 self-start md:self-auto"
        >
          <ExternalLink size={18} />
          新窗口打开
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="w-full max-w-md border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-lg" style={{ height: '750px' }}>
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

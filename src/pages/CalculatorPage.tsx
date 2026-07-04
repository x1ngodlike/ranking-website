import { motion } from 'framer-motion';
import { ExternalLink, Calculator } from 'lucide-react';

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
          <h1 className="font-display text-4xl text-gradient-gold mb-2 flex items-center gap-3">
            <Calculator size={32} />
            奖金计算器
          </h1>
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
        className="card overflow-hidden p-0"
      >
        <iframe
          src={CALCULATOR_URL}
          title="竞彩足球胜平负奖金计算器"
          className="w-full"
          style={{ height: 'calc(100vh - 220px)', minHeight: '500px', border: 'none' }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </motion.div>
    </div>
  );
};

export default CalculatorPage;

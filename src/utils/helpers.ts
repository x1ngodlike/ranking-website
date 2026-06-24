export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const formatCurrency = (amount: number): string => {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}¥${amount.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'short',
    day: 'numeric',
  });
};

export const getBetTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    '1x2': '胜平负',
    'over_under': '大小球',
    'handicap': '让球',
  };
  return labels[type] || type;
};

export const getSelectionLabel = (selection: string, betType: string): string => {
  if (betType === '1x2') {
    const labels: Record<string, string> = {
      home: '主胜',
      draw: '平局',
      away: '客胜',
    };
    return labels[selection] || selection;
  }
  return selection;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待结算',
    won: '已赢',
    lost: '已输',
    upcoming: '未开始',
    live: '进行中',
    finished: '已结束',
  };
  return labels[status] || status;
};

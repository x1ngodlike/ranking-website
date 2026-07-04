const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');

const NEWS_SOURCES = [
  {
    name: '懂球帝',
    url: 'https://api.dongqiudi.com/app/tabs/iphone/1.json',
    type: 'dqd_api',
  },
];

const WORLD_CUP_KEYWORDS = [
  '世界杯', 'World Cup', 'world cup', '2026世界杯', '美加墨世界杯',
  '阿根廷', '法国', '英格兰', '巴西', '德国', '西班牙', '葡萄牙',
  '荷兰', '意大利', '比利时', '克罗地亚', '乌拉圭', '哥伦比亚',
  '墨西哥', '美国', '加拿大', '日本', '韩国', '澳大利亚',
  '摩洛哥', '塞内加尔', '加纳', '埃及', '尼日利亚', '喀麦隆',
  '梅西', 'Messi', '姆巴佩', 'Mbappé', 'Mbappe', 'C罗', 'Ronaldo',
  '内马尔', 'Neymar', '哈兰德', 'Haaland', '福登', 'Foden',
  '贝林厄姆', 'Bellingham', '凯恩', 'Kane', '德布劳内', 'De Bruyne',
  '16强', '8强', '4强', '半决赛', '决赛', '淘汰赛', '小组赛',
];

const TEAM_KEYWORDS = {
  '阿根廷': ['阿根廷', 'Argentina', '梅西', 'Messi', '斯卡洛尼'],
  '法国': ['法国', 'France', '姆巴佩', 'Mbappé', 'Mbappe', '格列兹曼'],
  '英格兰': ['英格兰', 'England', '凯恩', 'Kane', '福登', 'Foden', '贝林厄姆', 'Bellingham'],
  '巴西': ['巴西', 'Brazil', '内马尔', 'Neymar', '维尼修斯'],
  '德国': ['德国', 'Germany', '穆勒', '穆西亚拉', '纳格尔斯曼'],
  '西班牙': ['西班牙', 'Spain', '亚马尔', '莫拉塔'],
  '葡萄牙': ['葡萄牙', 'Portugal', 'C罗', 'Ronaldo', 'B费', '贝尔纳多'],
  '荷兰': ['荷兰', 'Netherlands', 'Holland', '范戴克', '德佩'],
  '意大利': ['意大利', 'Italy'],
  '比利时': ['比利时', 'Belgium', '德布劳内', 'De Bruyne', '卢卡库'],
  '克罗地亚': ['克罗地亚', 'Croatia', '莫德里奇', 'Modric'],
  '乌拉圭': ['乌拉圭', 'Uruguay', '努涅斯', '苏亚雷斯'],
  '哥伦比亚': ['哥伦比亚', 'Colombia', 'J罗', '迪亚斯'],
  '墨西哥': ['墨西哥', 'Mexico'],
  '美国': ['美国', 'USA', '美国队', '普利西奇'],
  '加拿大': ['加拿大', 'Canada', '阿方索戴维斯', '阿方索·戴维斯'],
  '日本': ['日本', 'Japan', '三笘薫', '久保建英', '富安健洋'],
  '韩国': ['韩国', 'Korea', '孙兴慜', '孙兴民', '金玟哉'],
  '澳大利亚': ['澳大利亚', 'Australia', '袋鼠', '苏塔'],
  '摩洛哥': ['摩洛哥', 'Morocco', '阿什拉夫', '齐耶赫'],
  '塞内加尔': ['塞内加尔', 'Senegal', '马内', 'Mane'],
  '加纳': ['加纳', 'Ghana'],
  '埃及': ['埃及', 'Egypt', '萨拉赫', 'Salah'],
  '尼日利亚': ['尼日利亚', 'Nigeria', '奥斯梅恩'],
  '喀麦隆': ['喀麦隆', 'Cameroon'],
};

let newsCache = [];
let updateTimer = null;

const readNews = () => {
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('[News] 读取新闻缓存失败:', e.message);
  }
  return [];
};

const writeNews = (news) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2), 'utf-8');
  } catch (e) {
    console.error('[News] 写入新闻缓存失败:', e.message);
  }
};

const parseDQDNews = (data) => {
  const items = [];
  const articles = data?.articles || [];
  if (!Array.isArray(articles)) return items;

  for (const article of articles) {
    if (!article.title) continue;
    const pubTime = article.display_time || article.published_at || article.created_at;
    let pubDate;
    if (typeof pubTime === 'number') {
      pubDate = new Date(pubTime * 1000).toISOString();
    } else if (typeof pubTime === 'string') {
      pubDate = new Date(pubTime).toISOString();
    } else {
      pubDate = new Date().toISOString();
    }

    items.push({
      title: article.title || '',
      link: article.share?.url || article.web_uri || `https://www.dongqiudi.com/articles/${article.id}.html`,
      pubDate,
      description: (article.description || article.b_description || '').replace(/<[^>]+>/g, '').slice(0, 200),
    });
  }

  return items;
};

const isWorldCupRelated = (item) => {
  const text = (item.title + item.description).toLowerCase();
  return WORLD_CUP_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
};

const filterRecentNews = (items, days = 3) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter(item => new Date(item.pubDate).getTime() >= cutoff);
};

const fetchSource = async (source) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Dongqiudi/6.8.0 (iPhone; iOS 15.0; Scale/3.00)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[News] 请求失败 ${source.name}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (source.type === 'dqd_api') {
      return parseDQDNews(data);
    }

    return [];
  } catch (error) {
    console.warn(`[News] 拉取失败 ${source.name}:`, error.message);
    return [];
  }
};

const fetchAllNews = async () => {
  console.log('[News] 开始拉取新闻...');

  const allItems = [];
  for (const source of NEWS_SOURCES) {
    const items = await fetchSource(source);
    items.forEach(item => {
      item.source = source.name;
    });
    allItems.push(...items);
  }

  const worldCupNews = allItems.filter(isWorldCupRelated);
  const recentNews = filterRecentNews(worldCupNews, 3);

  const uniqueMap = new Map();
  recentNews.forEach(item => {
    if (!uniqueMap.has(item.title)) {
      uniqueMap.set(item.title, item);
    }
  });
  const uniqueNews = Array.from(uniqueMap.values());

  uniqueNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  newsCache = uniqueNews;
  writeNews(uniqueNews);

  console.log(`[News] 拉取完成，共 ${uniqueNews.length} 条世界杯相关新闻`);
  return uniqueNews;
};

const getNewsForTeams = (teamNames) => {
  if (!teamNames || teamNames.length === 0 || newsCache.length === 0) {
    return [];
  }

  const matched = [];
  const matchedIds = new Set();

  for (const teamName of teamNames) {
    const keywords = TEAM_KEYWORDS[teamName] || [teamName];
    const kwLower = keywords.map(k => k.toLowerCase());

    for (const news of newsCache) {
      if (matchedIds.has(news.title)) continue;
      const text = (news.title + news.description).toLowerCase();
      if (kwLower.some(kw => text.includes(kw))) {
        matched.push({ ...news, team: teamName });
        matchedIds.add(news.title);
      }
    }
  }

  return matched.slice(0, 10);
};

const getAllNews = () => {
  return newsCache;
};

const initNewsService = () => {
  newsCache = readNews();
  console.log(`[News] 初始化，缓存中有 ${newsCache.length} 条新闻`);

  fetchAllNews().catch(e => console.error('[News] 首次拉取失败:', e));

  updateTimer = setInterval(() => {
    fetchAllNews().catch(e => console.error('[News] 定时更新失败:', e));
  }, 30 * 60 * 1000);
};

const stopNewsService = () => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
};

module.exports = {
  initNewsService,
  stopNewsService,
  fetchAllNews,
  getAllNews,
  getNewsForTeams,
};

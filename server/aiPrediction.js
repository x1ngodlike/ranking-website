const fs = require('fs');
const path = require('path');
const { getAIConfig } = require('./aiConfig');
const { getNewsForTeams } = require('./footballNews');

const DATA_DIR = path.join(__dirname, 'data');
const PREDICTIONS_FILE = path.join(DATA_DIR, 'predictions.json');
const MAX_HISTORY_DAYS = 30;

const readPredictions = () => {
  try {
    if (fs.existsSync(PREDICTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PREDICTIONS_FILE, 'utf-8'));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error('[Predict] 读取预测历史失败:', e.message);
  }
  return [];
};

const writePredictions = (records) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Predict] 写入预测历史失败:', e.message);
  }
};

const getDateString = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const savePrediction = (predictions, matches) => {
  const records = readPredictions();
  const today = getDateString(new Date());

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'timed');
  const matchMap = new Map();
  upcomingMatches.forEach(m => {
    if (m.matchNumber) matchMap.set(m.matchNumber, m);
  });

  const record = {
    date: today,
    createdAt: new Date().toISOString(),
    predictions: predictions.map(p => {
      const match = matchMap.get(p.matchNumber) || {};
      return {
        ...p,
        matchTime: match.matchTime || null,
        stage: match.stage || '',
        group: match.group || '',
        actualHomeScore: null,
        actualAwayScore: null,
        actualResult: null,
        isCorrect: null,
      };
    }),
  };

  const existingIndex = records.findIndex(r => r.date === today);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.unshift(record);
  }

  const cutoff = Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const filtered = records.filter(r => new Date(r.createdAt).getTime() >= cutoff);
  writePredictions(filtered);

  console.log(`[Predict] 保存预测记录 ${today}，共 ${predictions.length} 场`);
  return record;
};

const getPredictionHistory = () => {
  return readPredictions();
};

const getLatestPrediction = () => {
  const records = readPredictions();
  return records.length > 0 ? records[0] : null;
};

const updatePredictionResults = (matches) => {
  const records = readPredictions();
  if (records.length === 0) return;

  const finishedMatches = matches.filter(m => m.status === 'finished' && m.regularTimeHomeScore !== null && m.regularTimeHomeScore !== undefined);
  if (finishedMatches.length === 0) return;

  let updated = false;
  for (const record of records) {
    for (const pred of record.predictions) {
      if (pred.isCorrect !== null) continue;
      const match = finishedMatches.find(m => m.matchNumber === pred.matchNumber);
      if (!match) continue;

      pred.actualHomeScore = match.regularTimeHomeScore;
      pred.actualAwayScore = match.regularTimeAwayScore;
      let actualResult;
      if (match.regularTimeHomeScore > match.regularTimeAwayScore) actualResult = '胜';
      else if (match.regularTimeHomeScore < match.regularTimeAwayScore) actualResult = '负';
      else actualResult = '平';
      pred.actualResult = actualResult;
      pred.isCorrect = pred.result === actualResult;
      updated = true;
    }
  }

  if (updated) {
    writePredictions(records);
    console.log('[Predict] 更新预测结果完成');
  }
};

const buildPredictionPrompt = (matches, news) => {
  let matchList = '';
  let finishedScores = '';
  let newsSection = '';

  if (matches && matches.length > 0) {
    const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'timed');
    const finishedMatches = matches.filter(m => m.status === 'finished' && m.regularTimeHomeScore !== null && m.regularTimeHomeScore !== undefined);

    if (upcomingMatches.length > 0) {
      const lines = upcomingMatches.map(m => {
        const num = m.matchNumber || '';
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const time = m.matchTime ? new Date(m.matchTime).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const stage = m.stage || '';
        const group = m.group ? `(${m.group})` : '';
        return `- 第${num}场 ${home} vs ${away} ${group} [${time}] [${stage}]`;
      });
      matchList = `\n\n## 待预测比赛（共${upcomingMatches.length}场）\n${lines.join('\n')}`;
    }

    if (finishedMatches.length > 0) {
      const recentFinished = finishedMatches.slice(-20);
      const scoreLines = recentFinished.map(m => {
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const rtScore = `${m.regularTimeHomeScore}-${m.regularTimeAwayScore}`;
        let rtResult;
        if (m.regularTimeHomeScore > m.regularTimeAwayScore) rtResult = '主队胜';
        else if (m.regularTimeHomeScore < m.regularTimeAwayScore) rtResult = '客队胜';
        else rtResult = '平局';
        return `- ${home} vs ${away}：${rtScore}（${rtResult}，90分钟）`;
      });
      finishedScores = `\n\n## 近期已结束比赛比分参考（按90分钟常规时间算）\n${scoreLines.join('\n')}`;
    }
  }

  if (news && news.length > 0) {
    const newsLines = news.map(n => `- [${n.source}] ${n.title}`);
    newsSection = `\n\n## 相关球队近期新闻动态\n${newsLines.join('\n')}`;
  }

  return `你是一位专业的足球赛事分析师和足彩预测专家。请根据以下信息，对即将进行的2026世界杯比赛进行比分预测分析。

## 预测要求
1. 仅预测**90分钟常规时间（含伤停补时）**的比分，不考虑加时赛和点球大战
2. 综合考虑球队实力、近期状态、历史交锋、伤病情况、战术打法等因素
3. 风格要求：专业严谨但不失幽默，可以适当玩梗、吐槽，要有画面感
4. 每场比赛给出：
   - 预测比分（90分钟）
   - 胜平负预测
   - 简要分析理由（50字以内，风趣幽默）
   - 信心指数（1-5星，5星最高）
5. 比分要合理，符合足球比赛的常规比分范围
6. 重点关注进攻火力强的球队和防守稳固的球队之间的对决特点${matchList}${finishedScores}${newsSection}

## 返回格式
严格返回以下JSON格式，不要任何其他内容：
{
  "predictions": [
    {
      "matchNumber": 场次编号,
      "homeTeam": "主队名称",
      "awayTeam": "客队名称",
      "homeScore": 主队预测进球数(数字),
      "awayScore": 客队预测进球数(数字),
      "result": "胜/平/负（从主队角度）",
      "analysis": "分析理由，风趣幽默，50字以内",
      "confidence": 信心指数(1-5)
    }
  ]
}`;
};

const predictMatches = async (matches) => {
  const aiConfig = getAIConfig();

  if (!aiConfig || !aiConfig.apiKey) {
    throw new Error('AI API密钥未配置，请先在设置中配置');
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'timed');
  if (upcomingMatches.length === 0) {
    return { predictions: [] };
  }

  const teamNames = new Set();
  upcomingMatches.forEach(m => {
    if (m.homeTeam) teamNames.add(m.homeTeam);
    if (m.awayTeam) teamNames.add(m.awayTeam);
  });
  const relatedNews = getNewsForTeams(Array.from(teamNames));

  const prompt = buildPredictionPrompt(matches, relatedNews);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(aiConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `AI预测失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) return { predictions: [] };

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { predictions: [] };
      result = JSON.parse(jsonMatch[0]);
    }

    if (!result.predictions || !Array.isArray(result.predictions)) {
      return { predictions: [] };
    }

    const formatted = {
      predictions: result.predictions.map(p => ({
        matchNumber: p.matchNumber || 0,
        homeTeam: p.homeTeam || '',
        awayTeam: p.awayTeam || '',
        homeScore: typeof p.homeScore === 'number' ? p.homeScore : parseInt(p.homeScore) || 0,
        awayScore: typeof p.awayScore === 'number' ? p.awayScore : parseInt(p.awayScore) || 0,
        result: p.result || '平',
        analysis: p.analysis || '',
        confidence: p.confidence || 3,
      })),
    };

    try {
      savePrediction(formatted.predictions, matches);
    } catch (e) {
      console.error('[Predict] 保存预测历史失败:', e.message);
    }

    return formatted;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI预测超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  predictMatches,
  savePrediction,
  getPredictionHistory,
  getLatestPrediction,
  updatePredictionResults,
};

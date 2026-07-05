const fs = require('fs');
const path = require('path');
const { getAIConfig } = require('./aiConfig');
const { getNewsForTeams } = require('./footballNews');

const DATA_DIR = path.join(__dirname, 'data');
const PREDICTIONS_FILE = path.join(DATA_DIR, 'predictions.json');

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

const getBeijingDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const beijingTime = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = beijingTime.getUTCFullYear();
  const m = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getBeijingDateTimeStr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const beijingTime = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const month = beijingTime.getUTCMonth() + 1;
  const day = beijingTime.getUTCDate();
  const hour = String(beijingTime.getUTCHours()).padStart(2, '0');
  const minute = String(beijingTime.getUTCMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
};

const getTomorrowBeijingDate = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return getBeijingDate(tomorrow);
};

const getTomorrowMatches = (matches) => {
  const tomorrowDate = getTomorrowBeijingDate();
  return matches
    .filter(m => m.status === 'scheduled' || m.status === 'timed' || m.status === 'upcoming')
    .filter(m => {
      if (!m.matchTime) return false;
      return getBeijingDate(m.matchTime) === tomorrowDate;
    })
    .sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
};

const findMatchByTeams = (matches, homeTeam, awayTeam) => {
  return matches.find(m => 
    m.homeTeam === homeTeam && m.awayTeam === awayTeam
  );
};

const savePrediction = (predictions, matches) => {
  const records = readPredictions();
  const today = getBeijingDate(new Date());

  const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'timed' || m.status === 'upcoming');
  const matchMap = new Map();
  upcomingMatches.forEach(m => {
    if (m.matchNumber) matchMap.set(m.matchNumber, m);
  });

  const record = {
    date: today,
    createdAt: new Date().toISOString(),
    predictions: predictions.map(p => {
      let match = matchMap.get(p.matchNumber);
      if (!match) {
        match = findMatchByTeams(upcomingMatches, p.homeTeam, p.awayTeam) || {};
      }
      return {
        ...p,
        matchTime: match.matchTime || null,
        stage: match.stage || '',
        group: match.groupName || match.group || '',
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

  writePredictions(records);

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
      let match = finishedMatches.find(m => m.matchNumber === pred.matchNumber);
      if (!match) {
        match = findMatchByTeams(finishedMatches, pred.homeTeam, pred.awayTeam);
      }
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
    const upcomingMatches = getTomorrowMatches(matches);
    const finishedMatches = matches.filter(m => m.status === 'finished' && m.regularTimeHomeScore !== null && m.regularTimeHomeScore !== undefined);

    if (upcomingMatches.length > 0) {
      const lines = upcomingMatches.map((m, index) => {
        const num = index + 1;
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const time = m.matchTime ? getBeijingDateTimeStr(m.matchTime) : '';
        const stage = m.stage || '';
        const group = m.groupName ? `(${m.groupName})` : '';
        return `- 第${num}场 ${home} vs ${away} ${group} [${time} 北京时间] [${stage}]`;
      });
      matchList = `\n\n## 明日比赛（共${upcomingMatches.length}场，北京时间）\n${lines.join('\n')}`;
    }

    if (finishedMatches.length > 0) {
      const recentFinished = finishedMatches.slice(-10);
      const scoreLines = recentFinished.map(m => {
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const rtScore = `${m.regularTimeHomeScore}-${m.regularTimeAwayScore}`;
        return `- ${home} ${rtScore} ${away}`;
      });
      finishedScores = `\n\n## 近期赛果参考(90分钟)\n${scoreLines.join('\n')}`;
    }
  }

  if (news && news.length > 0) {
    const limitedNews = news.slice(0, 8);
    const newsLines = limitedNews.map(n => `- [${n.source}] ${n.title}`);
    newsSection = `\n\n## 相关球队新闻\n${newsLines.join('\n')}`;
  }

  return `你是足球赛事预测专家。根据以下信息预测2026世界杯比赛比分（仅90分钟常规时间）。

## 要求
1. 仅预测90分钟常规时间比分
2. 风格：专业严谨带点幽默
3. 每场给出：预测比分、胜平负、简短分析(30字内)、信心指数(1-5星)
4. 比分合理，符合足球常规范围${matchList}${finishedScores}${newsSection}

## 返回格式
严格返回JSON，不要其他内容：
{
  "predictions": [
    {
      "matchNumber": 场次编号,
      "homeTeam": "主队",
      "awayTeam": "客队",
      "homeScore": 数字,
      "awayScore": 数字,
      "result": "胜/平/负",
      "analysis": "分析，30字内",
      "confidence": 1-5
    }
  ]
}`;
};

const predictMatches = async (matches) => {
  const aiConfig = getAIConfig();

  if (!aiConfig || !aiConfig.apiKey) {
    throw new Error('AI API密钥未配置，请先在设置中配置');
  }

  const upcomingMatches = getTomorrowMatches(matches);
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
  const timeoutId = setTimeout(() => controller.abort(), 90000);

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
        max_tokens: 1200,
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

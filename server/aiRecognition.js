const fs = require('fs');
const path = require('path');

const buildPrompt = (matches, winAmount) => {
  // 构建赛程参考列表，包含已结束比赛的比分
  let matchList = '';
  let finishedScores = '';
  if (matches && matches.length > 0) {
    const lines = matches
      .filter(m => m.stage === 'knockout')
      .map(m => {
        const num = m.matchNumber || '';
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const time = m.matchTime ? new Date(m.matchTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '';
        return `- 第${num}场 ${home} vs ${away} (${time})`;
      });
    if (lines.length > 0) {
      matchList = `\n\n## 2026世界杯赛程参考（请对照此列表识别球队名称）\n${lines.join('\n')}`;
    }

    // 已结束比赛比分
    const finishedMatches = matches.filter(m => m.status === 'finished' && m.homeScore !== null);
    if (finishedMatches.length > 0) {
      const scoreLines = finishedMatches.map(m => {
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const score = `${m.homeScore}${m.homePenaltyScore !== null ? `[${m.homePenaltyScore}]` : ''}-${m.awayScore}${m.awayPenaltyScore !== null ? `[${m.awayPenaltyScore}]` : ''}`;
        let result;
        if (m.homeScore > m.awayScore) result = '主队胜';
        else if (m.homeScore < m.awayScore) result = '客队胜';
        else if (m.homePenaltyScore !== null && m.awayPenaltyScore !== null) {
          result = m.homePenaltyScore > m.awayPenaltyScore ? '主队胜(点球)' : '客队胜(点球)';
        } else result = '平局';
        return `- ${home} vs ${away}：${score} → ${result}`;
      });
      finishedScores = `\n\n## 已结束比赛比分（判断投注对错的依据）\n${scoreLines.join('\n')}`;
    }
  }

  return `你是一个嘴碎但专业的体育彩票评论员，风格毒舌又搞笑。分析这张2026世界杯竞彩足球彩票截图，用200字以内中文写出简述。
${matchList}${finishedScores}

## 竞彩术语说明（必须严格遵守）
- "胜@X元" = 买主队赢（主队胜）
- "平@X元" = 买平局
- "负@X元" = 买主队输（即客队赢/客胜）
- 例如"比利时 vs 塞内加尔 负@3.470元" = 用户买比利时输，即买塞内加尔赢

## 过关方式说明
- "n场-m关"表示从n场比赛中选m场串关
- 例如"5场-4,5关" = 4串1（5注）+ 5串1（1注），共6注
- 只要有一场错，包含该场的串关就作废；不包含该场的串关仍可能中奖

## 中奖金额信息
${winAmount ? `用户已确认实际中奖金额为：¥${winAmount}元（请以该金额为准，不要以图片上的"最高可能奖金"为准）` : '图片上如有"已兑奖"印章金额，以印章金额为准；否则请勿猜测中奖金额'}

## 简述要求
1. 识别票面信息：彩种、期号、过关方式、总金额
2. 列出各场对阵和投注选项（注意"负"表示买客队赢，不是主队输的结果）
3. **关键：对照上方"已结束比赛比分"，逐场判断投注对错（中/错），不要预设中奖**
4. 根据过关方式计算实际中奖情况（区分"最高可能奖金"和"实际兑奖金额"）
5. 风格要求：风趣幽默、抽象搞笑，可以玩梗、吐槽、阴阳怪气，但信息必须准确
6. 严格控制在200字以内

## 返回格式
严格返回以下JSON格式，不要任何其他内容：
{
  "comment": "200字以内的中文简述"
}`;
};

const recognizeBetImage = async (imagePath, imageUrl, aiConfig, matches, winAmount) => {
  if (!aiConfig || !aiConfig.apiKey) {
    throw new Error('AI API密钥未配置');
  }

  // 优先使用官网URL方式（更高效，请求体更小）
  let imageSource;
  if (aiConfig.siteUrl && imageUrl) {
    const baseUrl = aiConfig.siteUrl.replace(/\/+$/, '');
    imageSource = { url: `${baseUrl}${imageUrl}` };
  } else {
    // fallback: 读取文件转base64
    const imageBuffer = fs.readFileSync(imagePath);
    imageSource = { url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` };
  }

  const prompt = buildPrompt(matches, winAmount);

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
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                ...imageSource,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI识别失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  if (!content) return null;

  let result;
  try {
    result = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    result = JSON.parse(jsonMatch[0]);
  }

  if (!result.comment) return null;

  return {
    comment: result.comment.trim(),
  };
};

module.exports = {
  recognizeBetImage,
};

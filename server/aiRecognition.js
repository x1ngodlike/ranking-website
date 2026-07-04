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

    // 已结束比赛比分（体彩竞彩按90分钟常规时间结算）
    const finishedMatches = matches.filter(m => m.status === 'finished' && m.regularTimeHomeScore !== null && m.regularTimeHomeScore !== undefined);
    if (finishedMatches.length > 0) {
      const scoreLines = finishedMatches.map(m => {
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '待定';
        const rtScore = `${m.regularTimeHomeScore}-${m.regularTimeAwayScore}`;
        // 90分钟赛果（体彩结算依据）
        let rtResult;
        if (m.regularTimeHomeScore > m.regularTimeAwayScore) rtResult = '主队胜(90分钟)';
        else if (m.regularTimeHomeScore < m.regularTimeAwayScore) rtResult = '客队胜(90分钟)';
        else rtResult = '平局(90分钟)';
        // 显示完整比分（含加时/点球，便于参考）
        let fullScore = rtScore;
        if (m.homePenaltyScore !== null && m.homePenaltyScore !== undefined) {
          // 有点球决胜
          fullScore = `${m.homeScore}[${m.homePenaltyScore}]-${m.awayScore}[${m.awayPenaltyScore}]`;
          const penaltyWinner = m.homePenaltyScore > m.awayPenaltyScore ? '主队胜(点球)' : '客队胜(点球)';
          return `- ${home} vs ${away}：90分钟 ${rtScore}(${rtResult})，最终 ${fullScore}(${penaltyWinner}) → 体彩按90分钟算`;
        } else if (m.homeScore !== m.regularTimeHomeScore || m.awayScore !== m.regularTimeAwayScore) {
          // 有加时赛（比分不同）
          fullScore = `${m.homeScore}-${m.awayScore}`;
          return `- ${home} vs ${away}：90分钟 ${rtScore}(${rtResult})，加时后 ${fullScore} → 体彩按90分钟算`;
        }
        return `- ${home} vs ${away}：${rtScore} → ${rtResult}`;
      });
      finishedScores = `\n\n## 已结束比赛比分（体彩竞彩按90分钟常规时间结算，加时赛/点球不算！）\n${scoreLines.join('\n')}`;
    }
  }

  return `你是一个嘴碎但专业的体育彩票评论员，风格毒舌又搞笑。分析这张2026世界杯竞彩足球彩票截图，用150字以内中文写出简述。
${matchList}${finishedScores}

## 竞彩足球玩法说明（必须严格遵守）
中国体彩竞彩足球包含多种玩法，一张彩票可能包含不同玩法的混合投注。
**重要：所有玩法均按90分钟常规时间（含伤停补时）的比分结算，加时赛和点球大战不算！**

### 1. 胜平负 / 让球胜平负
- "胜@X元" = 买主队赢（90分钟主队胜）
- "平@X元" = 买平局（90分钟打平）
- "负@X元" = 买主队输（即90分钟客队赢/客胜）
- 让球胜平负会在对阵中标注让球数，如"法国(-1) vs 瑞典"

### 2. 比分玩法（31个选项，主队比分在前）
- 主胜比分：1:0、2:0、2:1、3:0、3:1、3:2、4:0、4:1、4:2、5:0、5:1、5:2、胜其他
- 平局比分：0:0、1:1、2:2、3:3、平其他
- 客胜比分：0:1、0:2、1:2、0:3、1:3、2:3、0:4、1:4、2:4、0:5、1:5、2:5、负其他
- **一场可以买多个比分**（复式投注），多个比分之间用"+"号连接
- 比分玩法示例格式：(1:0)@6.800元+(2:0)@4.900元

### 3. 总进球数玩法（8种选项）
- 选项：0球、1球、2球、3球、4球、5球、6球、7+（7球及以上）
- **一场可以买多个进球数**，多个选项之间用"+"号连接

### 4. 半全场胜平负玩法（9种选项）
- 格式："上半场结果+全场结果"
- 选项：胜胜、胜平、胜负、平胜、平平、平负、负胜、负平、负负

## 过关方式说明
- "n场-m关"表示从n场比赛中选m场串关
- 例如"5场-4,5关" = 4串1（5注）+ 5串1（1注），共6注
- 只要有一场错，包含该场的串关就作废；不包含该场的串关仍可能中奖

## 中奖金额信息
${winAmount ? `用户已确认实际中奖金额为：¥${winAmount}元（请以该金额为准，不要以图片上的"最高可能奖金"为准）` : '图片上如有"已兑奖"印章金额，以印章金额为准；否则请勿猜测中奖金额'}

## 简述要求
1. 仔细识别图片中的**每一行投注选项**，一场比赛可能同时购买多个选项（复式投注），**多个选项之间用"+"号连接，不要遗漏任何一项**
2. 列出各场对阵和投注选项，注意识别"+"号分隔的所有选项（如比分玩法"(2:1)@5.600元+(1:1)@4.700元"、胜平负玩法"胜@4.180元+平@3.430元"）
3. **关键：对照上方"已结束比赛比分"中90分钟的比分，逐场判断投注对错（中/错），加时赛/点球不算，不要预设中奖**
4. 根据过关方式计算实际中奖情况（区分"最高可能奖金"和"实际兑奖金额"）
5. 风格要求：风趣幽默、抽象搞笑，可以玩梗、吐槽、阴阳怪气，但信息必须准确
6. 严格控制在150字以内

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

  let imageSource;
  if (aiConfig.siteUrl && imageUrl) {
    const baseUrl = aiConfig.siteUrl.replace(/\/+$/, '');
    imageSource = { url: `${baseUrl}${imageUrl}` };
  } else {
    const imageBuffer = fs.readFileSync(imagePath);
    imageSource = { url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}` };
  }

  const prompt = buildPrompt(matches, winAmount);

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
      signal: controller.signal,
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
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI识别超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  recognizeBetImage,
};

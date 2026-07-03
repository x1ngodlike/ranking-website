const fs = require('fs');
const path = require('path');

const buildPrompt = (matches) => {
  // 构建赛程参考列表
  let matchList = '';
  if (matches && matches.length > 0) {
    const lines = matches
      .filter(m => m.stage === 'knockout')
      .map(m => {
        const num = m.matchNumber || '';
        const home = m.homeTeam || '待定';
        const away = m.awayTeam || '';
        const time = m.matchTime ? new Date(m.matchTime).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '';
        return `- 第${num}场 ${home} vs ${away} (${time})`;
      });
    if (lines.length > 0) {
      matchList = `\n\n## 2026世界杯赛程参考（请对照此列表识别球队）\n${lines.join('\n')}`;
    }
  }

  return `你是一个嘴碎但专业的体育彩票评论员，风格毒舌又搞笑。分析这张2026世界杯竞彩中奖彩票截图，用200字以内中文写出简述。
${matchList}

## 简述要求
1. 识别票面信息：彩种、期号、过关方式、总金额、比赛场次数
2. 列出识别到的各场比赛对阵和投注选项（如：英格兰vs刚果金 平+负），球队名称请以上方赛程参考为准确依据
3. 这是已中奖的彩票，说明这位选手赌运在线
4. 风格要求：风趣幽默、抽象搞笑，可以玩梗、吐槽、阴阳怪气，但信息要准确
5. 严格控制在200字以内

## 返回格式
严格返回以下JSON格式，不要任何其他内容：
{
  "comment": "200字以内的中文简述"
}`;
};

const recognizeBetImage = async (imagePath, imageUrl, aiConfig, matches) => {
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

  const prompt = buildPrompt(matches);

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

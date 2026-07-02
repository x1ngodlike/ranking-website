const fs = require('fs');
const path = require('path');

const buildPrompt = () => {
  return `分析这张体育彩票截图，识别以下信息并以JSON格式返回：

要求：
1. 必须识别主队名称和客队名称（中文）
2. 必须判断投注结果：胜=主队赢，负=客队赢，平=平局
3. 根据投注结果预测比分（主队在前）

示例：
- 如果投注"胜"，预测主队>客队（如1-0, 2-1）
- 如果投注"负"，预测主队<客队（如0-1, 1-2）
- 如果投注"平"，预测主队=客队（如1-1, 2-2）

返回格式：
{
  "homeTeam": "中文主队名",
  "awayTeam": "中文客队名",
  "betType": "胜/负/平",
  "predictedHomeScore": 整数,
  "predictedAwayScore": 整数
}

只返回JSON，不要其他内容。`;
};

const recognizeBetImage = async (imagePath, imageUrl, aiConfig) => {
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

  const prompt = buildPrompt();

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
      max_tokens: 1000,
      temperature: 0.1,
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

  if (!result.homeTeam || !result.awayTeam) return null;

  let { predictedHomeScore, predictedAwayScore } = result;

  if (!predictedHomeScore || !predictedAwayScore) {
    const betType = result.betType || '';
    if (betType === '胜') {
      predictedHomeScore = 2;
      predictedAwayScore = 1;
    } else if (betType === '负') {
      predictedHomeScore = 1;
      predictedAwayScore = 2;
    } else {
      predictedHomeScore = 1;
      predictedAwayScore = 1;
    }
  }

  return {
    homeTeam: result.homeTeam.trim(),
    awayTeam: result.awayTeam.trim(),
    predictedHomeScore: Number(predictedHomeScore) || 0,
    predictedAwayScore: Number(predictedAwayScore) || 0,
    confidence: Number(result.confidence) || 0.7,
  };
};

module.exports = {
  recognizeBetImage,
};

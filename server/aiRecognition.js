const fs = require('fs');
const path = require('path');

const buildPrompt = () => {
  return `你是一个专业的体育彩票识别助手。请仔细分析这张中国体育彩票（竞彩足球）的图片，识别第一场比赛的信息。

## 重要说明
- 这是中国体育彩票的竞彩足球票，通常包含多场比赛
- 只识别**第1场比赛**（排在最上面的那场）
- 票面格式通常为："第N场 编号 主队:队名 Vs 客队:队名"
- 投注选项在对阵下方，格式如"胜@4.180元+平@3.430元"

## 识别要求
1. 主队名称和客队名称必须用中文
2. 仔细辨认球队名称，注意不要被印章、水印遮挡影响
3. 常见国家队名称：英格兰、比利时、美国、塞内加尔、波黑、刚果(金)、法国、德国、巴西、阿根廷、西班牙、葡萄牙、荷兰、意大利、克罗地亚、摩洛哥、日本、韩国、中国等
4. 判断投注的比赛结果：胜=主队赢，负=客队赢，平=平局
5. 如果有多个投注选项（如"胜+平"），选择第一个出现的选项
6. 根据投注结果预测比分（主队在前）

## 比分预测规则
- 如果投注"胜"，预测主队胜（如2-1, 1-0, 3-1）
- 如果投注"负"，预测客队胜（如1-2, 0-1, 1-3）
- 如果投注"平"，预测平局（如1-1, 2-2, 0-0）

## 返回格式
严格返回以下JSON格式，不要任何其他内容：
{
  "homeTeam": "中文主队名",
  "awayTeam": "中文客队名",
  "betType": "胜/负/平",
  "predictedHomeScore": 整数,
  "predictedAwayScore": 整数
}`;
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

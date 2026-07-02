import type { AIConfig } from '@/types';

export interface AIRecognitionResult {
  homeTeam: string;
  awayTeam: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  confidence: number;
}

const DEFAULT_CONFIG: AIConfig = {
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: '',
  model: 'deepseek-v4-flash',
  siteUrl: '',
};

function getStoredConfig(): AIConfig {
  try {
    const stored = localStorage.getItem('ai_config');
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

function buildPrompt(base64Image: string): string {
  return `这是一张体育彩票/投注截图，请仔细分析图片内容。

任务：识别截图中投注的足球比赛信息。

体育彩票截图通常包含以下内容：
- 比赛编号、日期、时间
- 主队名称和客队名称（可能有国旗图标）
- 投注选项：胜、负、平（或让球胜/负）
- 赔率数值

请识别以下信息并以JSON格式返回：
{
  "homeTeam": "主队中文名称",
  "awayTeam": "客队中文名称",
  "predictedHomeScore": 预测主队得分(整数),
  "predictedAwayScore": 预测客队得分(整数),
  "confidence": 置信度(0-1之间的小数)
}

识别规则：
1. 主队在前，客队在后，按照截图中的顺序
2. 如果投注的是"胜"，说明用户预测主队赢，预测比分为主队>客队（如1-0, 2-1）
3. 如果投注的是"负"，说明用户预测客队赢，预测比分为主队<客队（如0-1, 1-2）
4. 如果投注的是"平"，说明用户预测平局，预测比分为主队=客队（如1-1, 2-2）
5. 比分预测值可以根据赔率或直觉估算，只要胜负方向正确即可
6. 球队名称必须用中文，如果截图中只有英文，翻译成中文
7. 如果图片中没有明显的比分信息，可以根据投注选项推断
8. 如果无法识别任何比赛信息，返回空对象 {}

只返回JSON，不要包含任何解释或其他文字。`;
}

export async function recognizeBetImage(
  base64Image: string,
  customConfig?: Partial<AIConfig>
): Promise<AIRecognitionResult | null> {
  const config = { ...getStoredConfig(), ...customConfig };

  if (!config.apiKey) {
    throw new Error('请先配置AI API密钥');
  }

  const prompt = buildPrompt(base64Image);

  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `AI识别失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试从返回内容中提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    if (!result.homeTeam || !result.awayTeam) return null;

    return {
      homeTeam: result.homeTeam,
      awayTeam: result.awayTeam,
      predictedHomeScore: Number(result.predictedHomeScore) || 0,
      predictedAwayScore: Number(result.predictedAwayScore) || 0,
      confidence: Number(result.confidence) || 0.5,
    };
  } catch (error) {
    console.error('AI识别错误:', error);
    throw error;
  }
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem('ai_config', JSON.stringify(config));
}

export function getAIConfig(): AIConfig {
  return getStoredConfig();
}

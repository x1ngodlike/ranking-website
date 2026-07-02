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
  return `请识别这张体育投注截图中的比赛信息。

请分析图片内容，识别以下信息并以JSON格式返回：
{
  "homeTeam": "主队名称",
  "awayTeam": "客队名称", 
  "predictedHomeScore": 主队预测比分,
  "predictedAwayScore": 客队预测比分,
  "confidence": 置信度(0-1)
}

注意：
1. 只返回JSON，不要其他文字
2. 如果无法识别，返回空对象 {}
3. 比分预测是根据投注内容推断的用户预测结果
4. 球队名称用中文或常见英文名称`;
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

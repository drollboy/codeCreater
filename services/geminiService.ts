

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedResult, TechStack, AIConfig } from "../types";

// --- System Instruction Builder ---
const getSystemInstruction = (stack: TechStack) => `
你是一位高效的后端架构师和代码生成助手。
当前用户的技术栈选择如下：
- **语言**: ${stack.language}
- **框架**: ${stack.framework}
- **数据库**: ${stack.database}
- **ORM/库**: ${stack.orm}

你的任务是：
1. **设计/修改** 数据库结构。
2. 生成**核心**代码片段。
3. 提供简要项目指南。
4. **生成详细的 API 接口文档** (Markdown格式)，这是给前端开发人员看的，必须清晰。

**核心交互逻辑（非常重要）：**
你需要判断用户的意图是 **[需求修改]** 还是 **[纯咨询]**。

**场景 A：需求修改**（例如："添加一个字段"、"生成代码"、"把 ID 改成 UUID"、"帮我写一个..."）
- **Schema & Snippets**：必须返回更新后的完整结构或增量修改。对于**未修改**的代码片段，请在 \`code\` 字段中仅返回字符串 \`__KEEP__\`，系统会自动保留原代码。不要省略该对象。
- **Explanation, Guide, ApiDoc**：根据修改内容更新。

**场景 B：纯咨询**（例如："这个 User 表是干嘛的？"、"如何部署项目？"、"解释一下这段代码"、"PostgreSQL 和 MySQL 区别？"）
- **ChatResponse**：详细回答用户的问题。
- **Schema**：**必须返回空数组 []**（表示不修改）。
- **Snippets**：**必须返回空数组 []**（表示不修改）。
- **Explanation**：返回字符串 \`__KEEP__\`。
- **ProjectSetupGuide**：返回字符串 \`__KEEP__\`。
- **ApiDoc**：返回字符串 \`__KEEP__\`。

**关键约束（务必遵守）：**
- **JSON 格式**：必须返回纯粹的 JSON，严禁使用 Markdown 代码块（\`\`\`json）。
- **语言**：所有注释和说明必须是中文。
- **结构完整**：在需求修改模式下，Schema 必须完整返回，不要省略。

**API 文档格式要求 (Markdown)：**
必须包含：接口 URL、请求方法 (GET/POST/PUT/DELETE)、请求参数/Body 示例、返回参数示例。

**Schema 格式严格要求示例：**
"schema": [
  {
    "tableName": "User",
    "description": "用户表",
    "columns": [
      {
        "name": "id",
        "type": "String",
        "isPrimary": true,
        "isUnique": false,
        "isNullable": false
      }
    ]
  }
]

**输出 JSON 结构：**
{
  "chatResponse": "简短回复",
  "explanation": "架构说明",
  "projectSetupGuide": "项目搭建指南(Markdown)",
  "apiDoc": "API接口文档(Markdown)",
  "schema": [ ... ],
  "snippets": [ { "title": "...", "language": "...", "code": "...", "description": "..." } ]
}
`;

// --- Google Schema Definition ---
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    chatResponse: { type: Type.STRING, description: "给用户的简短回复" },
    explanation: { type: Type.STRING, description: "中文技术总结" },
    projectSetupGuide: { type: Type.STRING, description: "项目搭建指南(Markdown)" },
    apiDoc: { type: Type.STRING, description: "API接口文档(Markdown)" },
    schema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tableName: { type: Type.STRING },
          description: { type: Type.STRING },
          columns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                isPrimary: { type: Type.BOOLEAN },
                isNullable: { type: Type.BOOLEAN },
                isUnique: { type: Type.BOOLEAN },
                relation: { type: Type.STRING }
              }
            }
          }
        }
      }
    },
    snippets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          language: { type: Type.STRING },
          code: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    }
  },
  required: ["snippets", "schema", "explanation", "projectSetupGuide", "apiDoc", "chatResponse"]
};

// --- Helper: Clean JSON Output ---
const cleanJsonOutput = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '');
  }
  return cleaned.trim();
};

// --- Helper: Try Repair Truncated JSON ---
// 简单的 JSON 修复逻辑，用于处理 finish_reason="length" 的情况
const tryRepairJson = (jsonStr: string): string => {
  let repaired = jsonStr.trim();
  
  // 1. 如果结尾是逗号，去掉
  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1);
  }

  // 2. 检查引号是否闭合
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"'; // 补全字符串引号
  }

  // 3. 补全括号
  const stack: string[] = [];
  for (let char of repaired) {
     if (char === '{') stack.push('}');
     else if (char === '[') stack.push(']');
     else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
           stack.pop();
        }
     }
  }

  // 逆序补全
  while (stack.length > 0) {
    const char = stack.pop();
    if (char) repaired += char;
  }

  return repaired;
};

// --- Helper: Normalize Schema ---
// 适配不同模型（如 DeepSeek）返回的非标准 Schema 格式
const normalizeSchema = (rawSchema: any[]): any[] => {
  if (!Array.isArray(rawSchema)) return [];
  
  return rawSchema.map(table => {
    // 1. Table Name: DeepSeek 可能会返回 'name'
    const tableName = table.tableName || table.name || "Unnamed Table";
    const description = table.description || "";
    
    // 2. Columns: DeepSeek 可能会返回 'fields'
    let rawColumns = table.columns || table.fields || [];
    if (!Array.isArray(rawColumns)) rawColumns = [];

    const columns = rawColumns.map((col: any) => {
      // 3. Attributes: 处理 Prisma 风格的 attributes 数组 (["@id", "@unique"])
      const attributes = Array.isArray(col.attributes) ? col.attributes : [];
      
      const isPrimary = col.isPrimary === true || attributes.some((attr: string) => attr.includes('@id'));
      const isUnique = col.isUnique === true || attributes.some((attr: string) => attr.includes('@unique'));
      
      // 处理 optional/nullable
      // DeepSeek 示例: "optional": true
      let isNullable = col.isNullable === true || col.optional === true;
      if (!isNullable && typeof col.type === 'string' && col.type.endsWith('?')) {
        isNullable = true;
      }

      // 处理 relation
      // DeepSeek 示例: "relation": ["userId"] 或 "relation": true
      let relation = col.relation;
      if (Array.isArray(relation)) {
        relation = relation.join(', ');
      } else if (relation === true) {
        relation = "Relation"; 
      }

      return {
        name: col.name || "unknown",
        type: col.type || "String",
        isPrimary: !!isPrimary,
        isNullable: !!isNullable,
        isUnique: !!isUnique,
        relation: typeof relation === 'string' ? relation : undefined
      };
    });

    return {
      tableName,
      description,
      columns
    };
  });
};

// --- Helper: Merge Results ---
// 用于将新生成的结果与旧上下文合并，防止 AI 偷懒导致数据丢失
const mergeResults = (newRes: GeneratedResult, oldContext?: GeneratedResult): GeneratedResult => {
  if (!oldContext) return newRes;

  const merged = { ...newRes };

  // 1. Schema 保护
  // 如果新结果中 schema 为空，且旧上下文中有值，说明是 AI 处于“咨询模式”，予以保留
  if ((!merged.schema || merged.schema.length === 0) && oldContext.schema && oldContext.schema.length > 0) {
    merged.schema = oldContext.schema;
  }

  // 2. Snippets 智能合并
  // 情况 A: AI 返回空数组 (可能是咨询模式) -> 全部恢复
  if ((!merged.snippets || merged.snippets.length === 0) && oldContext.snippets && oldContext.snippets.length > 0) {
    merged.snippets = oldContext.snippets;
  } 
  // 情况 B: AI 返回了 snippets，但部分代码用了 "__KEEP__" 占位符 (增量修改模式)
  else if (merged.snippets && merged.snippets.length > 0) {
    merged.snippets = merged.snippets.map(newSnippet => {
      // 尝试在旧上下文中找到同名片段
      const oldSnippet = oldContext.snippets.find(s => s.title === newSnippet.title);
      
      // 如果新代码是占位符，或者为空且有旧代码 -> 使用旧代码
      if (newSnippet.code === '__KEEP__' || newSnippet.code === '// __KEEP__' || (!newSnippet.code && oldSnippet)) {
        return oldSnippet || newSnippet;
      }
      return newSnippet;
    });
  }

  // 3. Guide 保护 (支持 __KEEP__ 标记)
  if ((!merged.projectSetupGuide || merged.projectSetupGuide === '__KEEP__') && oldContext.projectSetupGuide) {
    merged.projectSetupGuide = oldContext.projectSetupGuide;
  }

  // 4. Explanation 保护 (支持 __KEEP__ 标记)
  if ((!merged.explanation || merged.explanation === '__KEEP__') && oldContext.explanation) {
    merged.explanation = oldContext.explanation;
  }
  
  // 5. ApiDoc 保护 (支持 __KEEP__ 标记)
  if ((!merged.apiDoc || merged.apiDoc === '__KEEP__') && oldContext.apiDoc) {
    merged.apiDoc = oldContext.apiDoc;
  }

  return merged;
};

// --- Service: Google Gemini ---
const callGoogleGemini = async (prompt: string, config: AIConfig, systemInstruction: string): Promise<GeneratedResult> => {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: config.modelName || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Google Gemini returned empty response");
    
    const res = JSON.parse(text) as GeneratedResult;
    if (res.schema) {
      res.schema = normalizeSchema(res.schema);
    }
    return res;
  } catch (error: any) {
    const errMsg = error.message || error.toString();
    if (errMsg.includes('xhr error') || errMsg.includes('error code: 6') || errMsg.includes('NetworkError')) {
      throw new Error("连接 Google 服务失败（网络错误）。如果您在中国大陆，请点击右上角「设置」切换为 DeepSeek 或通义千问等国内可用的模型。");
    }
    throw error;
  }
};

// --- Service: OpenAI Compatible (DeepSeek, Qwen, etc.) ---
const callOpenAICompatible = async (prompt: string, config: AIConfig, systemInstruction: string): Promise<GeneratedResult> => {
  if (!config.baseUrl) throw new Error("Base URL is required for custom providers");

  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/chat/completions`;

  const payload = {
    model: config.modelName,
    messages: [
      { role: "system", content: systemInstruction + "\n\n请务必返回合法的 JSON 格式。如果内容过长，请优先保证 JSON 闭合。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.2, 
    stream: false,
    max_tokens: 4096 
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    const finishReason = choice?.finish_reason;

    if (!content) throw new Error("Provider returned empty content");

    let cleanedJson = cleanJsonOutput(content);

    try {
      const res = JSON.parse(cleanedJson) as GeneratedResult;
      // Normalize schema immediately after parsing
      if (res.schema) {
        res.schema = normalizeSchema(res.schema);
      }
      return res;
    } catch (e) {
      console.warn("Initial JSON Parse Failed. Finish Reason:", finishReason);
      
      if (finishReason === 'length' || e instanceof SyntaxError) {
          console.log("Attempting to repair truncated JSON...");
          const repairedJson = tryRepairJson(cleanedJson);
          try {
              const res = JSON.parse(repairedJson) as GeneratedResult;
              if (!res.snippets && !res.schema) throw new Error("Repaired JSON is missing core data");
              
              if (!res.chatResponse) res.chatResponse = "（注：由于模型输出长度限制，部分结果可能被截断，已尝试自动修复。）";
              else res.chatResponse += "\n\n（注：由于模型输出长度限制，部分结果可能被截断，已尝试自动修复。）";
              
              // Normalize repaired schema too
              if (res.schema) {
                res.schema = normalizeSchema(res.schema);
              }

              return res;
          } catch (repairError) {
              console.error("Repair failed:", repairError);
              throw new Error(`生成内容过长导致 JSON 截断，且自动修复失败。请尝试减少需求范围。（Raw: ${content.slice(-50)}...）`);
          }
      }
      
      throw new Error("模型返回的格式不是有效的 JSON，请重试。");
    }
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(`无法连接到 AI 服务 (${config.provider})。请检查 Base URL 是否正确，或网络是否通畅。`);
    }
    throw error;
  }
};

// --- Main Entry Point ---
export const generateBackend = async (
  prompt: string, 
  techStack: TechStack,
  context: GeneratedResult | undefined,
  aiConfig: AIConfig
): Promise<GeneratedResult> => {
  
  if (!aiConfig.apiKey) {
    throw new Error("请先点击右上角设置图标，配置 API Key。");
  }

  const systemInstruction = getSystemInstruction(techStack);
  
  let finalPrompt = prompt;
  if (context) {
    // 缩减 context 大小，避免输入也过长
    const contextStr = JSON.stringify({
        schema: context.schema,
        snippets: context.snippets.map(s => ({ title: s.title, description: s.description })) // 只传标题，节省 token
    });
    finalPrompt = `
    [CURRENT EXISTING CODEBASE SUMMARY]:
    ${contextStr}

    [USER REQUEST]:
    ${prompt}

    请基于现有的架构进行修改或补充。
    必须返回更新后的完整 JSON 对象（包含完整的 snippets 和 schema）。
    `;
  }

  try {
    let res: GeneratedResult;
    if (aiConfig.provider === 'google') {
      res = await callGoogleGemini(finalPrompt, aiConfig, systemInstruction);
    } else {
      res = await callOpenAICompatible(finalPrompt, aiConfig, systemInstruction);
    }

    // Merge results to prevent data loss
    return mergeResults(res, context);

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};


export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  relation?: string; // e.g., "User.id"
}

export interface TableSchema {
  tableName: string;
  description: string;
  columns: ColumnSchema[];
}

export interface GeneratedResult {
  chatResponse?: string; // AI 对用户的自然语言回复
  snippets: CodeSnippet[];
  schema: TableSchema[];
  explanation: string;
  projectSetupGuide: string; // Markdown formatted guide
}

// 扩展用于历史记录存储的类型
export interface HistoryItem extends GeneratedResult {
  id: string;
  prompt: string; // 初始 prompt
  timestamp: number;
  techStack?: TechStack;
}

export enum ViewMode {
  PROMPT = 'PROMPT',
  SCHEMA = 'SCHEMA',
  CODE = 'CODE',
  GUIDE = 'GUIDE',
  DOCS = 'DOCS',
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type Theme = 'light' | 'dark' | 'system';

// --- Tech Stack Definitions ---

export type Language = 'TypeScript' | 'JavaScript' | 'Python' | 'Go' | 'Java' | 'PHP' | 'Rust';
export type Database = 'PostgreSQL' | 'MySQL' | 'SQLite' | 'MongoDB' | 'MariaDB' | 'SQL Server';
export type Framework = 'Express' | 'NestJS' | 'FastAPI' | 'Gin' | 'Django' | 'Flask' | 'Echo' | 'Spring Boot' | 'Laravel' | 'Koa' | 'Actix Web';
export type ORM = 'Prisma' | 'TypeORM' | 'Sequelize' | 'SQLAlchemy' | 'GORM' | 'Mongoose' | 'None' | 'Hibernate' | 'Eloquent' | 'MikroORM' | 'Diesel';

export interface TechStack {
  name?: string; // For presets like "Node Fullstack"
  language: Language;
  framework: Framework;
  database: Database;
  orm: ORM;
}

// --- AI Model Definitions ---

export type AIProvider = 'google' | 'deepseek' | 'qwen' | 'doubao' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string; // Optional for Google, Required for others
  modelName: string;
}

export type ProviderConfigs = Record<AIProvider, AIConfig>;

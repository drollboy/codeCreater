

export interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
}

export const STATIC_DOCS: DocSection[] = [
  {
    id: 'node-setup',
    title: 'Node.js 环境配置',
    category: '语言环境',
    content: `
# Node.js 开发环境配置

## 1. 安装 Node.js
推荐使用 **nvm** (Node Version Manager) 来管理 Node.js 版本，这样可以方便地切换版本。

### Windows
下载并安装 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)。

### macOS / Linux
\`\`\`bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
\`\`\`

安装最新 LTS 版本：
\`\`\`bash
nvm install --lts
nvm use --lts
\`\`\`

## 2. 配置国内镜像源 (npm)
国内用户下载依赖可能会很慢，建议切换到淘宝镜像源。

**旧版淘宝镜像已过期，请使用新域名：**

\`\`\`bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
\`\`\`

或者使用 \`cnpm\`：
\`\`\`bash
npm install -g cnpm --registry=https://registry.npmmirror.com
\`\`\`

## 3. TypeScript 环境
如果您的项目使用 TypeScript，建议全局安装：
\`\`\`bash
npm install -g typescript ts-node
\`\`\`
`
  },
  {
    id: 'python-setup',
    title: 'Python 环境配置',
    category: '语言环境',
    content: `
# Python 开发环境配置

## 1. 安装 Python
请访问 [Python 官网](https://www.python.org/downloads/) 下载对应操作系统的安装包。建议安装 Python 3.10 或更高版本。

## 2. 配置 Pip 镜像源
为了加速包的下载，建议使用阿里云或清华大学的镜像源。

### 临时使用
\`\`\`bash
pip install flask -i https://mirrors.aliyun.com/pypi/simple/
\`\`\`

### 永久配置 (推荐)
**Linux / macOS**: 创建或修改 \`~/.pip/pip.conf\`
**Windows**: 创建或修改 \`%APPDATA%\\pip\\pip.ini\`

内容如下：
\`\`\`ini
[global]
index-url = https://mirrors.aliyun.com/pypi/simple/

[install]
trusted-host = mirrors.aliyun.com
\`\`\`

## 3. 虚拟环境 (Virtualenv)
项目开发建议使用虚拟环境隔离依赖：

\`\`\`bash
# 创建虚拟环境
python -m venv venv

# 激活环境 (Windows)
.\\venv\\Scripts\\activate

# 激活环境 (macOS/Linux)
source venv/bin/activate
\`\`\`
`
  },
  {
    id: 'go-setup',
    title: 'Go 语言配置',
    category: '语言环境',
    content: `
# Go 语言环境配置

## 1. 安装 Go
访问 [Go 官网下载页面](https://go.dev/dl/)。

## 2. 配置 GOPROXY
国内环境必须配置代理才能快速下载依赖包。七牛云或阿里云都提供了很好的代理服务。

\`\`\`bash
# 启用 Go Modules 功能
go env -w GO111MODULE=on

# 配置 GOPROXY (推荐七牛云)
go env -w GOPROXY=https://goproxy.cn,direct

# 或者使用阿里云
# go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
\`\`\`

## 3. 验证
\`\`\`bash
go env | grep GOPROXY
\`\`\`
`
  },
  {
    id: 'docker-setup',
    title: 'Docker 加速配置',
    category: '容器化',
    content: `
# Docker 安装与镜像加速

## 1. 安装 Docker Desktop
访问 [Docker Desktop 官网](https://www.docker.com/products/docker-desktop/) 下载安装。

## 2. 配置镜像加速器
Docker Hub 在国内访问不稳定，必须配置镜像加速。

打开 Docker Dashboard -> Settings -> Docker Engine，修改 JSON 配置：

\`\`\`json
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://noohub.ru"
  ]
}
\`\`\`
*注：镜像源地址可能会随时间失效，建议搜索最新的可用源。*

应用并重启 Docker。
`
  },
  {
    id: 'db-docker',
    title: '常用数据库启动 (Docker)',
    category: '数据库',
    content: `
# 使用 Docker 快速启动数据库

使用 Docker 是本地开发启动数据库最快的方式，无需安装繁琐的本地服务。

## PostgreSQL
\`\`\`bash
docker run -d \\
  --name my-postgres \\
  -e POSTGRES_USER=postgres \\
  -e POSTGRES_PASSWORD=mysecretpassword \\
  -e POSTGRES_DB=mydb \\
  -p 5432:5432 \\
  postgres:15
\`\`\`
*连接串: \`postgresql://postgres:mysecretpassword@localhost:5432/mydb\`*

## MySQL
\`\`\`bash
docker run -d \\
  --name my-mysql \\
  -e MYSQL_ROOT_PASSWORD=mysecretpassword \\
  -e MYSQL_DATABASE=mydb \\
  -p 3306:3306 \\
  mysql:8.0
\`\`\`
*注意：MySQL 8.0 可能需要配置认证插件。*

## MongoDB
\`\`\`bash
docker run -d \\
  --name my-mongo \\
  -p 27017:27017 \\
  mongo:6.0
\`\`\`

## Redis
\`\`\`bash
docker run -d \\
  --name my-redis \\
  -p 6379:6379 \\
  redis:alpine
\`\`\`
`
  },
  {
    id: 'mysql-native',
    title: 'MySQL 本地安装 (非Docker)',
    category: '数据库',
    content: `
# MySQL 本地安装指南

如果不使用 Docker，您可以直接在宿主机安装 MySQL。

## Windows
1. 访问 [MySQL Community Downloads](https://dev.mysql.com/downloads/installer/)。
2. 下载 **MySQL Installer for Windows**。
3. 运行安装程序，选择 "Server only" 或 "Developer Default"。
4. 按照向导设置 Root 密码（请务必记住）。
5. 配置 Windows Service 以便开机自启。

## macOS
推荐使用 Homebrew 安装：
\`\`\`bash
# 安装
brew install mysql

# 启动服务
brew services start mysql

# 初始化安全配置 (设置密码等)
mysql_secure_installation
\`\`\`

## Linux (Ubuntu/Debian)
\`\`\`bash
# 更新源
sudo apt update

# 安装 Server
sudo apt install mysql-server

# 启动服务
sudo systemctl start mysql.service

# 安全配置
sudo mysql_secure_installation
\`\`\`

## 验证安装
\`\`\`bash
mysql -u root -p
\`\`\`
输入密码后进入 MySQL 命令行即成功。
`
  },
  {
    id: 'postgres-native',
    title: 'PostgreSQL 本地安装 (非Docker)',
    category: '数据库',
    content: `
# PostgreSQL 本地安装指南

## Windows
1. 访问 [EnterpriseDB 下载页](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)。
2. 下载对应版本的安装包。
3. 运行安装程序。
4. **重要**：设置 Superuser (postgres) 的密码。
5. 保持默认端口 5432。

## macOS
**方法一：使用 Postgres.app (最简单)**
1. 访问 [Postgres.app](https://postgresapp.com/) 下载并拖入应用程序文件夹。
2. 打开应用，点击 "Initialize" 即可启动。
3. 点击 "Open psql" 即可进入命令行。

**方法二：使用 Homebrew**
\`\`\`bash
brew install postgresql@14
brew services start postgresql@14
\`\`\`

## Linux (Ubuntu/Debian)
\`\`\`bash
# 安装
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql

# 切换到 postgres 用户
sudo -i -u postgres
psql
\`\`\`

## 常用命令
\`\`\`bash
# 创建新用户
createuser --interactive

# 创建数据库
createdb mydb
\`\`\`
`
  },
  {
    id: 'git-ssh',
    title: 'Git SSH 配置',
    category: '工具',
    content: `
# Git SSH Key 配置

## 1. 生成 SSH Key
\`\`\`bash
ssh-keygen -t ed25519 -C "your_email@example.com"
\`\`\`
一直回车即可。

## 2. 启动 ssh-agent
\`\`\`bash
# 后台启动 ssh-agent
eval "$(ssh-agent -s)"
\`\`\`

## 3. 添加 Key
\`\`\`bash
ssh-add ~/.ssh/id_ed25519
\`\`\`

## 4. 复制公钥
**Windows (PowerShell):**
\`\`\`powershell
cat ~/.ssh/id_ed25519.pub | clip
\`\`\`

**macOS:**
\`\`\`bash
pbcopy < ~/.ssh/id_ed25519.pub
\`\`\`

**Linux:**
\`\`\`bash
cat ~/.ssh/id_ed25519.pub
\`\`\`
将内容复制到 GitHub/GitLab 的 Settings -> SSH Keys 中。
`
  }
];

# ScriptX 部署指南

## 方式一：Docker 部署（推荐）

### 前置条件
- 云服务器（2核4G以上，推荐 Ubuntu 22.04）
- 已安装 Docker + Docker Compose

### 部署步骤

**1. 上传代码到服务器**
```bash
# 在本地打包（排除 node_modules 和 data）
tar --exclude='node_modules' --exclude='.next' --exclude='data' --exclude='uploads' \
  -czf scriptx.tar.gz -C /path/to scriptx

# 上传到服务器
scp scriptx.tar.gz user@your-server:/opt/

# 在服务器解压
ssh user@your-server
cd /opt && tar xzf scriptx.tar.gz
```

**2. 配置环境变量**
```bash
cd /opt/scriptx
cp .env.example .env.local

# 编辑 .env.local，填入你的 AI API Key
vim .env.local
```

**3. 启动服务**
```bash
docker compose up -d --build
```

**4. 访问**
```
http://your-server-ip:3000
```

### 常用命令
```bash
# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 更新代码后重新构建
docker compose up -d --build
```

### 数据持久化
Docker Compose 会自动创建两个 volume：
- `scriptx-data` → 历史记录、分享数据（`data/` 目录）
- `scriptx-uploads` → 上传的视频文件（`uploads/` 目录）

---

## 方式二：Node.js 直接部署

### 前置条件
```bash
# 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 ffmpeg
sudo apt-get install -y ffmpeg

# 安装 Python3 + whisper（可选，语音转文字）
sudo apt-get install -y python3 python3-pip
pip3 install openai-whisper
```

### 部署步骤
```bash
cd /opt/scriptx

# 安装依赖
npm ci

# 构建
npm run build

# 配置环境变量
cp .env.example .env.local
vim .env.local

# 启动（生产模式）
npm start

# 或用 PM2 守护进程
npm install -g pm2
pm2 start npm --name scriptx -- start
pm2 save
pm2 startup
```

---

## Nginx 反向代理（可选）

如需域名访问 + HTTPS：

```nginx
server {
    listen 80;
    server_name scriptx.yourdomain.com;

    client_max_body_size 200M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

HTTPS 用 certbot 自动配置：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d scriptx.yourdomain.com
```

---

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `AI_API_BASE_URL` | ✅ | AI API 地址（Anthropic兼容接口） |
| `AI_API_KEY` | ✅ | AI API Key |
| `AI_MODEL` | ✅ | 模型名称 |
| `FFMPEG_PATH` | ❌ | ffmpeg 路径，默认 `ffmpeg` |
| `FFPROBE_PATH` | ❌ | ffprobe 路径，默认 `ffprobe` |

---

## 注意事项

1. **视频大小限制**：默认 200MB，可在 `UploadArea.tsx` 中修改
2. **存储上限**：历史记录 50 条、分享 200 条，可在对应 service 文件中调整
3. **首次语音转文字**：whisper 模型首次使用需下载（约 500MB），之后缓存在本地
4. **API 费用**：每次视频分析约消耗 5-15k tokens，注意 API 用量

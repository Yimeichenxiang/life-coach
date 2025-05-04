import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API 配置
const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的生活教练，你的目标是通过对话帮助用户成长。
在回答时请遵循以下原则：
1. 以同理心倾听用户的问题
2. 提供具体、可行的建议
3. 鼓励用户思考和行动
4. 保持积极正面的态度
5. 注重长期发展和持续进步`;

// 创建对话记录目录
const CHAT_DIR = './chats';
await fs.mkdir(CHAT_DIR, { recursive: true });

// 获取当前日期作为文件名
function getDateFileName() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.md`;
}

// 格式化时间
function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 保存对话记录
async function saveChat(userMessage, aiMessage) {
    const fileName = getDateFileName();
    const filePath = path.join(CHAT_DIR, fileName);
    const timestamp = formatTime(new Date());
    
    let chatContent = '';
    try {
        chatContent = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        // 如果文件不存在，添加标题
        chatContent = `# ${fileName.replace('.md', '')} 对话记录\n\n`;
    }

    // 添加新的对话记录
    chatContent += `## ${timestamp}\n\n`;
    chatContent += `### 用户\n${userMessage}\n\n`;
    chatContent += `### AI助手\n${aiMessage}\n\n`;
    chatContent += `---\n\n`;

    await fs.writeFile(filePath, chatContent, 'utf-8');
}

app.post('/chat', async (req, res) => {
    console.log('收到请求:', req.body);

    try {
        if (!req.body.message) {
            return res.status(400).json({ error: '消息不能为空' });
        }

        const apiRequestBody = {
            model: 'deepseek-r1-250120',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: req.body.message }
            ],
            temperature: 0.6,
            stream: false
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(apiRequestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 错误响应:', errorText);
            return res.status(response.status).json({
                error: 'API请求失败',
                details: errorText
            });
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('无效的 API 响应:', data);
            return res.status(500).json({
                error: 'API返回格式错误',
                details: data
            });
        }

        const aiMessage = data.choices[0].message.content;
        
        // 保存对话记录
        await saveChat(req.body.message, aiMessage);

        res.json({
            message: aiMessage
        });

    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({
            error: '服务器错误',
            message: error.message
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请先终止占用该端口的进程，或者使用其他端口`);
        process.exit(1);
    } else {
        console.error('服务器启动错误:', error);
        process.exit(1);
    }
});
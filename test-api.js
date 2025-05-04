import fetch from 'node-fetch';

// API 配置
const API_KEY = 'b29cb385-ec42-41cd-b898-fced712781b5';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 测试消息
const testMessage = "你好";

async function testAPI() {
    try {
        console.log('开始测试 API...');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-r1-250120',
                messages: [
                    { role: 'user', content: testMessage }
                ],
                temperature: 0.6
            })
        });

        console.log('API 响应状态码:', response.status);
        console.log('API 响应头:', [...response.headers.entries()]);

        const data = await response.text();
        console.log('API 响应内容:', data);

    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
testAPI();
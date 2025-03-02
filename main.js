const RequestManager = require('./request-lib');
const uuid = require('uuid');

async function main() {
    const requestManager = new RequestManager();

    const requests = [
        {
            url: 'https://httpbin.org/post',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'Hello JSON' },
        },
        {
            url: 'https://httpbin.org/get',
            method: 'GET',
            headers: {},
        },
        {
            url: 'https://httpbin.org/post',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: { key1: 'value1', key2: 'value2' },
        },
    ];
    for (let i = 0; i < 100; i++) {
        requests.push({
            url: 'https://httpbin.org/anything',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { uuid: uuid.v4() },
        })
    }

    const maxWorkers = 8;
    const startTimestamp = Date.now()

    // 实时监听每个请求的结果
    requestManager.on('result', result => {
        console.log('Request completed:', result);
    });

    // 实时更新进度
    requestManager.on('progress', ({ completed, total }) => {
        console.log(`Progress: ${completed}/${total}`);
    });

    // 所有请求完成的事件
    requestManager.on('finished', ({ completed }) => {
        console.log(`All requests completed. Total: ${completed}`, Date.now() - startTimestamp);
    });

    // 开始发送请求
    try {
        await requestManager.sendRequests(requests, maxWorkers);
    } catch (err) {
        console.error('Error:', err);
    }
}

main();

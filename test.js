const RequestManager = require('./request-lib');
const uuid = require('uuid');
const os = require('os');
const _ = require('lodash');

async function main() {
    const requestManager = new RequestManager();

    const requests = [
        {
            target_id:uuid.v4(),
            url: 'https://httpbin.org/anything?id=1&message=2&title=哈哈👌',
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            query: { message: 'Hello JSON' },
        },
        // {
        //     target_id:uuid.v4(),
        //     url: 'https://httpbin.org/anything',
        //     method: 'GET',
        //     headers: {},
        // },
        // {
        //     url: 'https://httpbin.org/image/jpeg',
        //     method: 'GET',
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //     body: { key1: 'value1', key2: 'value2' },
        // },
    ];

    // for (let i = 0; i < 200; i++) {
    //     requests.push({
    //         url: 'https://www.baidu.com',
    //         method: 'GET',
    //         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //         body: { message: uuid.v4() },
    //     })
    // }

    // 获取 CPU 信息
    let cpuCores = 32;
    try {
        cpuCores = _.size(os.cpus()) || 4
    } catch (e) { }

    const maxWorkers = _.min([cpuCores, 8]);
    const startTimestamp = Date.now()

    // 实时监听每个请求的结果
    requestManager.on('result', result => {
        console.log('Request completed:', JSON.stringify(result, null, "\t"));
    });

    // 实时更新进度
    requestManager.on('progress', ({ completed, total }) => {
        console.log(`Progress: ${completed}/${total}`);
    });

    // 所有请求完成的事件
    requestManager.on('finished', ({ completed }) => {
        console.log(`All requests completed. Total: ${completed}`, Date.now() - startTimestamp);
    });

    // 取消请求
    requestManager.on('cancel', message => {
        console.log(`Cancellation message: ${message.message}`);
    });

    // // 启动请求
    // setTimeout(() => {
    //     console.log('Cancelling all requests...');
    //     requestManager.cancel();
    // }, 2000); // 2秒后中断请求

    // 开始发送请求
    try {
        await requestManager.sendRequests(requests, maxWorkers);
    } catch (err) {
        console.error('Error:', err);
    }
}

main();

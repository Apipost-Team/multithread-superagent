const { parentPort, workerData } = require('worker_threads');
const superagent = require('superagent');
const fs = require('fs');

/**
 * 执行单个请求任务
 * @param {Object} config 请求配置
 * @returns {Promise<Object>} 请求的结果
 */
async function processRequest(config) {
    const { url, method = 'GET', headers = {}, body = null } = config;
    const start = Date.now();

    try {
        const request = superagent(method, url).set(headers);

        // 根据 Content-Type 处理不同的 body
        if (body) {
            if (headers['Content-Type'] === 'application/json') {
                request.send(body); // JSON 请求
            } else if (headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                request.type('form').send(body); // 表单请求
            } else if (headers['Content-Type'] === 'multipart/form-data') {
                // 处理文件上传
                Object.entries(body).forEach(([key, value]) => {
                    if (fs.existsSync(value) && fs.statSync(value).isFile()) {
                        request.attach(key, value); // 上传文件
                    } else {
                        request.field(key, value); // 普通字段
                    }
                });
            } else {
                request.send(body); // 其他请求体类型
            }
        }

        const response = await request;
        // console.log(response?.request?._data)
        return {
            success: true,
            statusCode: response.status,
            duration: Date.now() - start,
            body: response.body,
        };
    } catch (error) {
        return {
            success: false,
            statusCode: error.status,
            error: error.message,
            body: error?.response?.text,
            duration: Date.now() - start,
        };
    }
}

/**
 * 逐个执行传入的请求任务集
 * @param {Array} requestConfigs 请求配置数组
 */
async function executeRequests(requestConfigs) {
    for (const config of requestConfigs) {
        const result = await processRequest(config);

        // 每个请求完成后实时发送结果到主线程
        parentPort.postMessage({ progress: true, result });
    }
}

// 开始执行任务
executeRequests(workerData).catch(error => {
    parentPort.postMessage({ success: false, error: error.message });
});

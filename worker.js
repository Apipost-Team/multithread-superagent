const { parentPort, workerData } = require('worker_threads');
const superagent = require('superagent');
const fs = require('fs');
const _ = require('lodash');
const { getObjFromRawHeaders } = require("rawheaders2obj")

/**
 * 从HTTP请求字符串中提取header对象。
 * @param {string} rawString - 原始HTTP请求字符串。
 * @returns {Object} - 提取出的headers对象。
 */
function extractHeaders(rawString) {
    // 按双换行符分割字符串，头部信息和请求体分开
    try {
        const [headerString] = rawString.split('\r\n\r\n');

        // 按行分割，忽略第一行（请求行）
        const lines = _.tail(headerString.split('\r\n'));

        // 构建headers对象
        const headers = _.fromPairs(
            lines.map(line => {
                const [key, ...valueParts] = line.split(':');
                return [key.trim(), valueParts.join(':').trim()]; // 处理冒号后值可能包含冒号的情况
            })
        );

        return headers || {};
    } catch (e) {
        return {}
    }

}

(async () => {
    const { url, method = 'GET', headers = {}, body = null,target_id=''} = workerData;

    const startTime = Date.now();
    try {
        //timeout(0).
        const request = superagent(method, url).redirects(0).set(headers);

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

        parentPort.postMessage({
            success: true,
            target_id,
            response: {
                headers: getObjFromRawHeaders(response?.res?.rawHeaders || ''),
                httpVersion: response?.res?.httpVersion,
                statusCode: response.status,
                statusMessage: response.res?.statusMessage,
                duration: Date.now() - startTime,
                body: response.body,
            },
            request: _.assign({ url, method, headers, body }, {
                rawHeaders: extractHeaders(response?.req?._header || '')
            })
        });
    } catch (error) {
        // 请求失败
        parentPort.postMessage({
            success: false,
            target_id,
            request: _.assign({ url, method, headers, body }, {
                rawHeaders: extractHeaders(error?.response?.req?._header || '')
            }),
            response: {
                headers: getObjFromRawHeaders(error?.response?.res?.rawHeaders || ''),
                httpVersion: error?.response?.res?.httpVersion,
                statusCode: error?.status,
                statusMessage: error?.message,
                body: error?.response?.text,
                duration: Date.now() - startTime,
            },
            error: error.message
        });
    }
})();

const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const path = require('path');

class RequestManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            maxWorkers: 5, // 最大并发线程数
            ...config,
        };
        this.totalRequests = 0; // 请求总数
        this.completedRequests = 0; // 已完成的请求数
    }

    /**
     * 发起多个请求
     * @param {Array} requestConfigs 请求配置数组
     * @param {Number} [maxWorkers=this.config.maxWorkers] 最大同时运行的线程数
     * @returns {Promise<void>} 不返回结果（使用事件监听单个结果和进度）
     */
    async sendRequests(requestConfigs, maxWorkers = this.config.maxWorkers) {
        if (!Array.isArray(requestConfigs)) {
            throw new Error('Request configurations must be an array.');
        }

        this.totalRequests = requestConfigs.length;
        this.completedRequests = 0;

        const chunks = this._chunkRequests(requestConfigs, maxWorkers); // 按线程数分块
        const workerPromises = chunks.map(chunk =>
            this._runWorker(path.resolve(__dirname, 'worker.js'), chunk)
        );

        await Promise.all(workerPromises);
        this.emit('finished', { completed: this.completedRequests });
    }

    /**
     * 对请求数组进行分块
     * @param {Array} requests 请求数组
     * @param {Number} chunkSize 每个线程分配的请求数
     * @returns {Array<Array>} 分块后的请求配置
     */
    _chunkRequests(requests, chunkSize) {
        const chunks = [];
        for (let i = 0; i < requests.length; i += chunkSize) {
            chunks.push(requests.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * 启动一个 Worker 线程
     * @param {String} workerPath Worker 文件路径
     * @param {Array} data 数据分块
     * @returns {Promise<void>}
     */
    _runWorker(workerPath, data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(workerPath, { workerData: data });

            // 监听 Worker 发送的单个请求结果
            worker.on('message', message => {
                if (message.progress) {
                    const { result } = message;
                    this.completedRequests++;

                    // 每次完成一个请求触发 `result` 和 `progress` 事件
                    this.emit('result', result);
                    this.emit('progress', {
                        completed: this.completedRequests,
                        total: this.totalRequests,
                    });
                }
            });

            worker.on('error', error => reject(error));
            worker.on('exit', code => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
                resolve();
            });
        });
    }
}

module.exports = RequestManager;

const { Worker } = require('worker_threads');
const EventEmitter = require('events');
const path = require('path');

class RequestManager extends EventEmitter {
    constructor(config = {}) {
        super();
        // 默认最大并行工作线程数
        this.maxWorkers = config.maxWorkers || 4;
        this.isCancelled = false; // 标记请求是否被取消
        this.workerPool = []; // 保存活跃的工作线程
    }

    /**
     * 中断所有请求
     */
    cancel() {
        this.isCancelled = true;

        // 中断所有活跃的 Worker
        this.workerPool.forEach(worker => {
            worker.terminate(); // 强制终止 Worker 线程
        });

        // 清空 Worker 池
        this.workerPool = [];
        this.emit('cancel', { message: 'All requests have been cancelled.' });
    }

    /**
     * 执行 HTTP 请求数组
     * @param {Array} requestConfigs 请求配置数组
     * @param {Number} maxWorkers 最大并行线程数
     */
    async sendRequests(requestConfigs, maxWorkers) {
        if (!Array.isArray(requestConfigs) || requestConfigs?.length === 0) {
            throw new Error('Invalid request configs: must be a non-empty array.');
        }

        // 确定最大并行数
        const totalRequests = requestConfigs?.length;
        let workers = maxWorkers || this.maxWorkers;
        if(workers > totalRequests){
            workers = 1
        }
        let completedRequests = 0;

        // 分批次处理请求配置
        const chunks = this.chunkArray(requestConfigs, workers);

        try {
            for (let i = 0; i < chunks?.length; i++) {
                if (this.isCancelled) {
                    // 检查中断状态，立即退出
                    this.emit('cancel', { message: 'Requests cancelled.', completed: completedRequests });
                    return;
                }

                // 每批请求分配给子线程处理
                const chunk = chunks[i];
                const promises = chunk.map(config => this.processRequest(config));
                const results = await Promise.all(promises);

                // 处理每个子线程的结果
                results.forEach(result => {
                    completedRequests++;
                    this.emit('result', result); // 触发 result 事件
                });

                // 更新进度
                this.emit('progress', {
                    completed: completedRequests,
                    total: totalRequests,
                });
            }
        } finally {
            this.emit('finished', { completed: completedRequests, total: totalRequests });
        }
    }

    /**
     * 用子线程处理单个请求
     * @param {Object} config 请求配置
     */
    async processRequest(config) {
        return new Promise((resolve, reject) => {
            if (this.isCancelled) {
                resolve({ success: false, message: 'Cancelled by user.' });
                return;
            }

            const worker = new Worker(path.resolve(__dirname, './worker.js'), {
                workerData: config,
            });

            this.workerPool.push(worker);

            worker.on('message', result => {
                resolve(result);
            });

            worker.on('error', error => {
                console.log(error,11111)
                reject({ success: false, message: error.message });
            });

            worker.on('exit', () => {
                // 从 Worker 池中移除已退出的线程
                const index = this.workerPool.indexOf(worker);
                if (index > -1) this.workerPool.splice(index, 1);
            });
        });
    }

    /**
     * 将一个数组分块（按指定大小分组）
     * @param {Array} array 原始数组
     * @param {Number} chunkSize 分块大小
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array?.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

module.exports = RequestManager;

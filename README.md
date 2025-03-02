# multithread-superagent

A Node.js library for executing and managing concurrent HTTP requests with real-time feedback on progress and results.

## Features

- **Real-time Progress Updates**: Get immediate feedback for each request as it's completed.
- **Concurrent Request Handling**: Control the maximum number of requests processed simultaneously using worker threads.
- **Customizable Requests**: Supports GET, POST with JSON, form-encoded, and file uploads.
- **Error Handling**: Gracefully handles request errors and provides detailed feedback.
  
## How It Works

The `multithread-superagent` uses Node.js `worker_threads` to handle concurrent HTTP requests efficiently. Each worker processes a chunk of requests, sending individual results and progress updates back to the main thread.

---

## Installation

```bash
# Clone this repository
git clone https://github.com/Apipost-Team/multithread-superagent.git

# Navigate into the project directory
cd multithread-superagent

# Install dependencies
npm install
```

---

## Usage

Here is an example of using the `multithread-superagent` to perform multiple HTTP requests with real-time progress feedback.

### Example

1. **Prepare request configurations**: Define the URLs, methods, headers, and bodies for your requests.
2. **Initialize the `multithread-superagent`**: Create an instance of the library and define the maximum number of concurrent workers.
3. **Listen for events**: Use event listeners for progress updates (`progress`), individual results (`result`), and when all requests are completed (`finished`).

```javascript
const RequestManager = require('./request-lib');

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

    const maxWorkers = 2;

    // Listen for individual request results
    requestManager.on('result', result => {
        console.log('Request completed:', result);
    });

    // Listen for progress updates
    requestManager.on('progress', ({ completed, total }) => {
        console.log(`Progress: ${completed}/${total}`);
    });

    // Listen for when all requests are finished
    requestManager.on('finished', ({ completed }) => {
        console.log(`All requests completed. Total: ${completed}`);
    });

    // Start sending requests
    try {
        await requestManager.sendRequests(requests, maxWorkers);
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
```

### Output

The above script will produce the following output:

```plaintext
Request completed: { success: true, statusCode: 200, duration: 123, body: {...} }
Progress: 1/3
Request completed: { success: true, statusCode: 200, duration: 456, body: {...} }
Progress: 2/3
Request completed: { success: true, statusCode: 200, duration: 312, body: {...} }
Progress: 3/3
All requests completed. Total: 3
```

---

## API Documentation

### **Class: `RequestManager`**

Manages and executes concurrent HTTP requests.

#### Constructor

```javascript
new RequestManager(config)
```

- `config` *(Object)*:
  - `maxWorkers` *(Number)*: Maximum number of concurrent worker threads (default: `5`).

---

#### **Method: `sendRequests(requestConfigs, maxWorkers)`**

Executes a list of HTTP requests concurrently.

- **Parameters**:
  - `requestConfigs` *(Array)*: Array of request configuration objects. See the *Request Configuration* section below for details.
  - `maxWorkers` *(Number)*: Maximum number of concurrent workers (default: value in `config`).
  
- **Returns**:  
  A promise that resolves when all requests are completed.

---

### **Supported Events**

#### `result`

Emitted when an individual request is completed.

- **Data** *(Object)*:  
  - `success` *(Boolean)*: Whether the request was successful.
  - `statusCode` *(Number)*: HTTP status code of the response (if successful).
  - `duration` *(Number)*: Time taken for the request to complete (in milliseconds).
  - `body` *(Object)*: Parsed body of the HTTP response, if applicable.
  - `error` *(String)*: Error message, if the request failed.

#### `progress`

Emitted when a request is completed, providing the overall progress.

- **Data** *(Object)*:  
  - `completed` *(Number)*: Number of requests completed so far.
  - `total` *(Number)*: Total number of requests.

#### `finished`

Emitted when all requests are completed.

- **Data** *(Object)*:  
  - `completed` *(Number)*: Total number of requests completed.

---

## Request Configuration

Each request configuration object should include the following properties:

- `url` *(String)*: The URL to send the request to (required).
- `method` *(String)*: HTTP method (e.g., `GET`, `POST`). Default: `GET`.
- `headers` *(Object)*: Key-value pairs of request headers (optional).
- `body` *(Object|String)*: Request body, applicable for `POST`/`PUT` requests (optional).

### Examples:

1. **GET Request**:
   ```javascript
   {
       url: 'https://httpbin.org/get',
       method: 'GET',
       headers: { Authorization: 'Bearer token' }
   }
   ```

2. **POST Request with JSON**:
   ```javascript
   {
       url: 'https://httpbin.org/post',
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: { key1: 'value1', key2: 'value2' }
   }
   ```

3. **POST Request with Form Data**:
   ```javascript
   {
       url: 'https://httpbin.org/post',
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: { key1: 'value1', key2: 'value2' }
   }
   ```

---

## Dependencies

- **[superagent](https://github.com/visionmedia/superagent)**: HTTP request library for handling requests and responses.
- **[worker_threads](https://nodejs.org/api/worker_threads.html)**: Native Node.js module for multithreading.

To install dependencies:

```bash
npm install
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Apipost-Team/multithread-superagent/issues).

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [`LICENSE`](LICENSE) file for details.

---

## Acknowledgments

- Inspired by real-world scenarios where real-time feedback and concurrency are critical.
- Special thanks to OpenAI's ChatGPT for assistance with documentation and implementation guidance. 
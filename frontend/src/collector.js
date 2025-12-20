export class BugCollector {
  constructor() {
    this.logs = [];
    this.network = [];
    this.startInterceptors();
  }

  startInterceptors() {
    // 1. Capture Console Errors
    const originalError = console.error;
    console.error = (...args) => {
      this.logs.push({
        type: 'error',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      });
      originalError.apply(console, args);
    };

    // 2. Capture Network Requests (Fetch)
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        this.network.push({
          url: args[0],
          status: response.status,
          duration: Date.now() - startTime,
          timestamp: startTime
        });
        return response;
      } catch (err) {
        this.network.push({ url: args[0], status: 'FAILED', timestamp: startTime });
        throw err;
      }
    };
  }

  getBundle() {
    return {
      logs: this.logs,
      network: this.network,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }
}
type LogListener = () => void;

class LogManagerService {
  private logs: string[] = [];
  private listeners: LogListener[] = [];

  constructor() {
    this.addLog('[SISTEMA] Motor de diagnóstico y logs Sam Services iniciado.');
  }

  addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
    this.notify();
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getAllAsText(): string {
    return this.logs.join('\n');
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const LogManager = new LogManagerService();


// Mock real-time service for notifications and events

class RealtimeService {
  constructor() {
    this.listeners = new Map();
    this.intervals = [];
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event).delete(callback);
    };
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  startMocking() {
    // Stop existing if any
    this.stopMocking();

    // Mocking disabled per user request

  }

  stopMocking() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }
}

export const realtimeService = new RealtimeService();

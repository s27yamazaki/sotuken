export function createLogger() {
  const events = [];

  return {
    record(event) {
      events.push({
        ...event,
        timestamp: Date.now(),
      });
    },
    getEvents() {
      return [...events];
    },
  };
}

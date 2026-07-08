export function createRouter() {
  let currentScreen = null;

  return {
    getCurrentScreen() {
      return currentScreen;
    },
    navigate(screenId) {
      currentScreen = screenId;
    },
  };
}

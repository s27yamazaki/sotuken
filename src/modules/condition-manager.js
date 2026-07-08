export function createConditionManager(initialCondition) {
  let currentCondition = initialCondition;

  return {
    getCurrentCondition() {
      return currentCondition;
    },
    setCondition(nextCondition) {
      currentCondition = nextCondition;
    },
  };
}

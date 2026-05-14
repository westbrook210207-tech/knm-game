export const ROUND1_PHASES = {
  BETTING: 'betting',
  ANSWERING: 'answering',
  REVEAL: 'reveal',
};

export function getInitialRound1State() {
  return {
    tokens: 10,
    score: 0,
    currentQuestion: 0,
  };
}

export function getNextQuestionIndex(currentQuestion) {
  return currentQuestion + 1;
}

const ACTIVE_PHASES = new Set(['playback', 'input', 'success']);

export function createGame() {
  return { phase: 'idle', sequence: [], inputIndex: 0, score: 0, lastInput: null, expected: null, suspendedPhase: null };
}

export function appendPad(sequence, random = Math.random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random value must be in [0, 1).');
  return [...sequence, Math.floor(value * 4)];
}

export function startGame(random = Math.random) {
  return { ...createGame(), phase: 'playback', sequence: appendPad([], random) };
}

export function finishPlayback(state) {
  return state.phase === 'playback' ? { ...state, phase: 'input', inputIndex: 0, lastInput: null } : state;
}

export function pressPad(state, pad) {
  if (state.phase !== 'input' || !Number.isInteger(pad) || pad < 0 || pad > 3) return state;
  const expected = state.sequence[state.inputIndex];
  if (pad !== expected) return { ...state, phase: 'over', lastInput: pad, expected };
  const inputIndex = state.inputIndex + 1;
  if (inputIndex === state.sequence.length) {
    return { ...state, phase: 'success', inputIndex, score: state.sequence.length, lastInput: pad };
  }
  return { ...state, inputIndex, lastInput: pad };
}

export function nextRound(state, random = Math.random) {
  if (state.phase !== 'success') return state;
  return { ...state, phase: 'playback', sequence: appendPad(state.sequence, random), inputIndex: 0, lastInput: null, expected: null };
}

export function pauseGame(state) {
  return ACTIVE_PHASES.has(state.phase) ? { ...state, phase: 'paused', suspendedPhase: state.phase, lastInput: null } : state;
}

export function resumeGame(state, random = Math.random) {
  if (state.phase !== 'paused') return state;
  if (state.suspendedPhase === 'success') return nextRound({ ...state, phase: 'success', suspendedPhase: null }, random);
  return { ...state, phase: 'playback', inputIndex: 0, suspendedPhase: null, lastInput: null };
}

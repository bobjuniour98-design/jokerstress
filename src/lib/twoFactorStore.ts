type TwoFactorState = {
  enabledSecret?: string;
  pendingSecret?: string;
};

const twoFactorStore = new Map<number, TwoFactorState>();

export function getTwoFactorState(userId: number): TwoFactorState {
  return twoFactorStore.get(userId) ?? {};
}

export function setPendingTwoFactorSecret(userId: number, secret: string): void {
  const state = getTwoFactorState(userId);
  state.pendingSecret = secret;
  twoFactorStore.set(userId, state);
}

export function enableTwoFactor(userId: number, secret: string): void {
  const state = getTwoFactorState(userId);
  state.enabledSecret = secret;
  state.pendingSecret = undefined;
  twoFactorStore.set(userId, state);
}

export function disableTwoFactor(userId: number): void {
  const state = getTwoFactorState(userId);
  state.enabledSecret = undefined;
  state.pendingSecret = undefined;
  twoFactorStore.set(userId, state);
}

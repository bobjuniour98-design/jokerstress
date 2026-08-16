type TwoFactorState = {
  enabledSecret?: string;
  pendingSecret?: string;
};

const twoFactorStore = new Map<string, TwoFactorState>();

export function getTwoFactorState(userId: string): TwoFactorState {
  return twoFactorStore.get(userId) ?? {};
}

export function setPendingTwoFactorSecret(userId: string, secret: string): void {
  const state = getTwoFactorState(userId);
  state.pendingSecret = secret;
  twoFactorStore.set(userId, state);
}

export function enableTwoFactor(userId: string, secret: string): void {
  const state = getTwoFactorState(userId);
  state.enabledSecret = secret;
  state.pendingSecret = undefined;
  twoFactorStore.set(userId, state);
}

export function disableTwoFactor(userId: string): void {
  const state = getTwoFactorState(userId);
  state.enabledSecret = undefined;
  state.pendingSecret = undefined;
  twoFactorStore.set(userId, state);
}
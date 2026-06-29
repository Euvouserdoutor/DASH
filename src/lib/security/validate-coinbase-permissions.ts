export type PermissionFlags = {
  canRead: boolean;
  canTrade: boolean;
  canTransfer: boolean;
};

export type PermissionValidation = {
  allowed: boolean;
  blockedReason?: string;
};

export function validateCoinbasePermissions(flags: PermissionFlags): PermissionValidation {
  if (flags.canTrade) {
    return { allowed: false, blockedReason: "trade_permission_detected" };
  }

  if (flags.canTransfer) {
    return { allowed: false, blockedReason: "transfer_permission_detected" };
  }

  if (!flags.canRead) {
    return { allowed: false, blockedReason: "read_permission_missing" };
  }

  return { allowed: true };
}

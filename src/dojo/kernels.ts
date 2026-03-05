import type { AvatarId } from "../services/avatarService";

const AVATAR_TO_KERNEL: Record<AvatarId, number> = {
  default_sentinel: 0,
  swift_interceptor: 1,
  artillery_unit: 2,
  guardian_core: 3,
  sniper_kernel: 4,
  assault_nexus: 5,
  neon_guardian: 6,
  void_sentinel: 7,
  plasma_core: 8,
  prime_sentinel: 9,
  transcendent_form: 10,
};

export function avatarToKernel(avatarId: AvatarId): number {
  return AVATAR_TO_KERNEL[avatarId] ?? 0;
}


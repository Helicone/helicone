export function normalizeTier(tier: string): string {
    const [baseTier] = tier.split("-", 1);
    return baseTier;
}
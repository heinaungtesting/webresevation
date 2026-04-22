export function sportIdToSessionKey(sport: string): string {
  return sport.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

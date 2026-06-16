export const qk = {
  teams: ["teams"] as const,
  team: (id: number) => ["team", id] as const,
  matches: (f: object) => ["matches", f] as const,
  match: (id: number) => ["match", id] as const,
  user: ["user"] as const,
};

export const staleMs = {
  teams: 86_400_000,
  teamIdle: 300_000,
  live: 30_000,
  user: 300_000,
};

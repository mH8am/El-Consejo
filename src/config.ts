export const XP_CONFIG = {
  perMessage: parseInt(process.env.XP_PER_MESSAGE ?? '15', 10),
  cooldownMs: parseInt(process.env.XP_COOLDOWN_SECONDS ?? '60', 10) * 1000,
  perLevel: parseInt(process.env.XP_PER_LEVEL ?? '100', 10),
  triviaReward: parseInt(process.env.XP_TRIVIA_REWARD ?? '25', 10),
};

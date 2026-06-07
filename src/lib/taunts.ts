const TAUNTS = [
  "Min blinda kusin skulle göra en bättre gissning 🙈",
  "Tycker du verkligen det är ett klokt val? 🤔",
  "Med det där valet spelar du skjortan av folk 😏",
  "Seriöst? Det är din gissning? 😂",
  "Modigt... eller bara desperat?",
  "Har du ens kollat statistiken? 📊",
  "Det ska bli kul att se hur det går med det där...",
  "Hmmm, intressant strategi. Väldigt... intressant.",
  "Vegas säger 1 på 100 — du säger varför inte! 🎰",
  "Antingen genialt eller en katastrof. 50/50.",
  "Klassisk move. Helt klassisk.",
  "Jag dömer inte. Men lite grann.",
  "Okej, men det är ditt konto...",
  "Säker på det? Riktigt säker?",
  "Det där kan faktiskt funka! Förmodligen inte, men ändå.",
  "Med den gissningen visar du verkligen vad du går för 💀",
  "Djärvt. Väldigt, väldigt djärvt.",
  "Inte vad jag hade gjort, men respekt för tron 🤷",
];

export function getRandomTaunt(): string {
  return TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
}

// Maps Swedish team names → flag emoji
const FLAG_MAP: Record<string, string> = {
  // CONMEBOL
  Argentina: "🇦🇷", Brasilien: "🇧🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴",
  Ecuador: "🇪🇨", Venezuela: "🇻🇪", Chile: "🇨🇱", Paraguay: "🇵🇾",
  Peru: "🇵🇪", Bolivia: "🇧🇴",
  // CONCACAF
  USA: "🇺🇸", Mexiko: "🇲🇽", Kanada: "🇨🇦", Costa: "🇨🇷",
  "Costa Rica": "🇨🇷", Panama: "🇵🇦", Jamaica: "🇯🇲", Jamaika: "🇯🇲",
  Honduras: "🇭🇳", "El Salvador": "🇸🇻", Guatemala: "🇬🇹",
  "Trinidad och Tobago": "🇹🇹", Kuba: "🇨🇺",
  // UEFA
  Frankrike: "🇫🇷", Spanien: "🇪🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Tyskland: "🇩🇪",
  Portugal: "🇵🇹", Nederländerna: "🇳🇱", Holland: "🇳🇱", Belgien: "🇧🇪",
  Italien: "🇮🇹", Sverige: "🇸🇪", Danmark: "🇩🇰", Norge: "🇳🇴",
  Schweiz: "🇨🇭", Österrike: "🇦🇹", Polen: "🇵🇱", Kroatien: "🇭🇷",
  Serbien: "🇷🇸", Rumänien: "🇷🇴", Ungern: "🇭🇺", Slovakien: "🇸🇰",
  Slovenien: "🇸🇮", Ukraina: "🇺🇦", Skottland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Irland: "🇮🇪", Turkiet: "🇹🇷", Tjeckien: "🇨🇿", Albanien: "🇦🇱",
  Grekland: "🇬🇷", Finland: "🇫🇮", Israel: "🇮🇱",
  // AFC
  Japan: "🇯🇵", Sydkorea: "🇰🇷", Australien: "🇦🇺", Iran: "🇮🇷",
  Saudiarabien: "🇸🇦", Qatar: "🇶🇦", Irak: "🇮🇶", Jordanien: "🇯🇴",
  Uzbekistan: "🇺🇿", Oman: "🇴🇲", Bahrain: "🇧🇭",
  // CAF
  Marocko: "🇲🇦", Senegal: "🇸🇳", Nigeria: "🇳🇬", Egypten: "🇪🇬",
  Kamerun: "🇨🇲", Ghana: "🇬🇭", Elfenbenskusten: "🇨🇮", Mali: "🇲🇱",
  Tunisien: "🇹🇳", Algeriet: "🇩🇿", Sydafrika: "🇿🇦", Kenya: "🇰🇪",
  Tanzania: "🇹🇿", Kongo: "🇨🇩", Angola: "🇦🇴",
};

export function getFlag(team: string): string {
  return FLAG_MAP[team] ?? "🏳️";
}

export function teamWithFlag(team: string): string {
  const flag = FLAG_MAP[team];
  return flag ? `${flag} ${team}` : team;
}

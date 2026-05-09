// WC 2026 — 48 participating nations (confirmed hosts + expected qualifiers)
export const WC_TEAMS = [
  // Hosts (confirmed)
  "USA", "Mexiko", "Kanada",
  // South America (CONMEBOL – 6 platser)
  "Argentina", "Brasilien", "Colombia", "Ecuador", "Uruguay", "Venezuela",
  // Europe (UEFA – 16 platser)
  "Frankrike", "England", "Spanien", "Tyskland", "Portugal", "Nederländerna",
  "Belgien", "Italien", "Kroatien", "Danmark", "Schweiz", "Österrike",
  "Polen", "Turkiet", "Serbien", "Skottland",
  // Africa (CAF – 9 platser)
  "Marocko", "Senegal", "Nigeria", "Elfenbenskusten", "Egypten",
  "Ghana", "Kamerun", "Tunisien", "Algeriet",
  // Asia (AFC – 8 platser)
  "Japan", "Sydkorea", "Saudiarabien", "Australien", "Iran",
  "Qatar", "Irak", "Uzbekistan",
  // CONCACAF (excl. hosts – 3 platser)
  "Honduras", "Panama", "Costa Rica",
  // Oceania (OFC – 1 plats)
  "Nya Zeeland",
  // Sverige — särskild gissning i Kaos-kategorin
  "Sverige",
].sort((a, b) => a.localeCompare(b, "sv"));

// FIFA API integration point: replace this static list with squad data from /v3/players when squads are announced (~June 2026)
export const FAMOUS_PLAYERS = [
  // France
  "Kylian Mbappé",
  "Antoine Griezmann",
  "Eduardo Camavinga",
  "Aurélien Tchouaméni",
  "Ousmane Dembélé",
  "Théo Hernández",
  "Mike Maignan",
  "Randal Kolo Muani",
  "Marcus Thuram",
  // England
  "Bukayo Saka",
  "Jude Bellingham",
  "Phil Foden",
  "Harry Kane",
  "Cole Palmer",
  "Trent Alexander-Arnold",
  "Kieran Trippier",
  "Declan Rice",
  // Spain
  "Lamine Yamal",
  "Pedri",
  "Gavi",
  "Nico Williams",
  "Ferran Torres",
  "Dani Olmo",
  "Álvaro Morata",
  "Unai Simón",
  "Rodri",
  // Germany
  "Florian Wirtz",
  "Jamal Musiala",
  "Kai Havertz",
  "Joshua Kimmich",
  "Serge Gnabry",
  "İlkay Gündoğan",
  "Marc-André ter Stegen",
  "Leroy Sané",
  // Portugal
  "Cristiano Ronaldo",
  "Bernardo Silva",
  "Bruno Fernandes",
  "Rafael Leão",
  "Rúben Dias",
  "Diogo Costa",
  "Vitinha",
  "João Félix",
  // Netherlands
  "Virgil van Dijk",
  "Frenkie de Jong",
  "Cody Gakpo",
  "Xavi Simons",
  "Joshua Zirkzee",
  "Bart Verbruggen",
  "Donyell Malen",
  // Belgium
  "Kevin De Bruyne",
  "Romelu Lukaku",
  "Leandro Trossard",
  "Jérémy Doku",
  "Arthur Theate",
  // Italy
  "Gianluigi Donnarumma",
  "Nicolò Barella",
  "Sandro Tonali",
  "Giacomo Raspadori",
  "Davide Frattesi",
  "Gianluca Scamacca",
  "Lorenzo Pellegrini",
  // Croatia
  "Luka Modrić",
  "Mateo Kovačić",
  "Joško Gvardiol",
  "Marcelo Brozović",
  "Ante Budimir",
  // Argentina
  "Lautaro Martínez",
  "Julián Álvarez",
  "Alexis Mac Allister",
  "Rodrigo De Paul",
  "Nahuel Molina",
  "Emiliano Martínez",
  "Lionel Messi",
  // Brazil
  "Vinicius Jr.",
  "Rodrygo",
  "Endrick",
  "Raphinha",
  "Bruno Guimarães",
  "Marquinhos",
  "Alisson",
  "Éder Militão",
  // Colombia
  "James Rodríguez",
  "Luis Díaz",
  "Richard Ríos",
  "Jhon Córdoba",
  "Dávinson Sánchez",
  "Juan Cuadrado",
  // Uruguay
  "Darwin Núñez",
  "Federico Valverde",
  "Rodrigo Bentancur",
  "Mathías Olivera",
  "José María Giménez",
  // Ecuador
  "Moisés Caicedo",
  "Énner Valencia",
  "Jeremy Sarmiento",
  // Morocco
  "Achraf Hakimi",
  "Youssef En-Nesyri",
  "Sofyan Amrabat",
  "Azzedine Ounahi",
  "Sofiane Boufal",
  "Nayef Dari",
  // Senegal
  "Sadio Mané",
  "Ismaïla Sarr",
  "Pape Gueye",
  "Famara Diédhiou",
  "Édouard Mendy",
  // Nigeria
  "Victor Osimhen",
  "Ademola Lookman",
  "Wilfred Ndidi",
  "Alex Iwobi",
  "Samuel Chukwueze",
  // Ivory Coast
  "Sébastien Haller",
  "Ibrahim Sangaré",
  "Nicolas Pépé",
  "Simon Adingra",
  // Egypt
  "Mohamed Salah",
  "Omar Marmoush",
  "Mostafa Mohamed",
  // Japan
  "Kaoru Mitoma",
  "Ritsu Doan",
  "Wataru Endō",
  "Takefusa Kubo",
  "Daichi Kamada",
  "Yukinari Sugawara",
  // South Korea
  "Son Heung-min",
  "Hwang Hee-chan",
  "Lee Kang-in",
  "Cho Gue-sung",
  // Saudi Arabia
  "Salem Al-Dawsari",
  "Mohammed Al-Owais",
  "Firas Al-Buraikan",
  // Australia
  "Mathew Ryan",
  "Mitch Duke",
  "Ajdin Hrustic",
  "Riley McGree",
  // USA
  "Christian Pulisic",
  "Tyler Adams",
  "Giovanni Reyna",
  "Josh Sargent",
  "Ricardo Pepi",
  "Antonee Robinson",
  "Weston McKennie",
  // Mexico
  "Hirving Lozano",
  "Alexis Vega",
  "Edson Álvarez",
  "Santiago Giménez",
  "Raúl Jiménez",
  "Guillermo Ochoa",
  // Canada
  "Alphonso Davies",
  "Jonathan David",
  "Tajon Buchanan",
  "Stephen Eustáquio",
  "Cyle Larin",
  // Other notable players
  "Robert Lewandowski",
  "Erling Haaland",
].sort((a, b) => a.localeCompare(b, "sv"));

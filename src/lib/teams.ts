// WC 2026 — exact 48-nation, 12-group confirmed roster

export interface GroupTeam {
  name: string; // Swedish name — matches WC_TEAMS and flags.ts
  players: string[]; // 5 key players
}

export interface GroupData {
  group: string;
  teams: GroupTeam[];
}

export const WC_GROUPS_DATA: GroupData[] = [
  {
    group: "A",
    teams: [
      { name: "Mexiko",    players: ["Santiago Giménez", "Edson Álvarez", "Hirving Lozano", "Luis Chávez", "César Montes"] },
      { name: "Sydkorea",  players: ["Son Heung-min", "Kim Min-jae", "Lee Kang-in", "Hwang Hee-chan", "Cho Gue-sung"] },
      { name: "Sydafrika", players: ["Percy Tau", "Teboho Mokoena", "Ronwen Williams", "Themba Zwane", "Mothobi Mvala"] },
      { name: "Tjeckien",  players: ["Patrik Schick", "Tomáš Souček", "Vladimír Coufal", "Adam Hložek", "Jindřich Staněk"] },
    ],
  },
  {
    group: "B",
    teams: [
      { name: "Kanada",               players: ["Alphonso Davies", "Jonathan David", "Tajon Buchanan", "Stephen Eustáquio", "Alistair Johnston"] },
      { name: "Schweiz",              players: ["Granit Xhaka", "Manuel Akanji", "Gregor Kobel", "Remo Freuler", "Breel Embolo"] },
      { name: "Qatar",                players: ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos", "Boualem Khoukhi", "Meshaal Barsham"] },
      { name: "Bosnien-Hercegovina",  players: ["Ermedin Demirović", "Amar Dedić", "Anel Ahmedhodžić", "Benjamin Tahirović", "Rade Krunić"] },
    ],
  },
  {
    group: "C",
    teams: [
      { name: "Brasilien", players: ["Vinícius Júnior", "Rodrygo", "Bruno Guimarães", "Marquinhos", "Lucas Paquetá"] },
      { name: "Marocko",   players: ["Achraf Hakimi", "Brahim Díaz", "Yassine Bounou", "Sofyan Amrabat", "Azzedine Ounahi"] },
      { name: "Skottland", players: ["Andrew Robertson", "Scott McTominay", "John McGinn", "Billy Gilmour", "Ché Adams"] },
      { name: "Haiti",     players: ["Duckens Nazon", "Frantzdy Pierrot", "Louicius Don Deedson", "Danley Jean Jacques", "Carlens Arcus"] },
    ],
  },
  {
    group: "D",
    teams: [
      { name: "USA",       players: ["Christian Pulisic", "Weston McKennie", "Folarin Balogun", "Antonee Robinson", "Timothy Weah"] },
      { name: "Australien",players: ["Harry Souttar", "Jackson Irvine", "Mathew Ryan", "Craig Goodwin", "Nestory Irankunda"] },
      { name: "Paraguay",  players: ["Miguel Almirón", "Julio Enciso", "Gustavo Gómez", "Omar Alderete", "Antonio Sanabria"] },
      { name: "Turkiet",   players: ["Arda Güler", "Hakan Çalhanoğlu", "Kenan Yıldız", "Kerem Aktürkoğlu", "Merih Demiral"] },
    ],
  },
  {
    group: "E",
    teams: [
      { name: "Tyskland",         players: ["Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Antonio Rüdiger", "Joshua Kimmich"] },
      { name: "Ecuador",          players: ["Moisés Caicedo", "Piero Hincapié", "Enner Valencia", "Pervis Estupiñán", "Kendry Páez"] },
      { name: "Elfenbenskusten",  players: ["Sébastien Haller", "Simon Adingra", "Franck Kessié", "Ousmane Diomande", "Odilon Kossounou"] },
      { name: "Curaçao",          players: ["Juninho Bacuna", "Leandro Bacuna", "Kenji Gorré", "Vurnon Anita", "Roly Bonevacia"] },
    ],
  },
  {
    group: "F",
    teams: [
      { name: "Nederländerna", players: ["Virgil van Dijk", "Frenkie de Jong", "Cody Gakpo", "Xavi Simons", "Jeremie Frimpong"] },
      { name: "Japan",         players: ["Takefusa Kubo", "Kaoru Mitoma", "Wataru Endo", "Takumi Minamino", "Hiroki Ito"] },
      { name: "Sverige",       players: ["Viktor Gyökeres", "Alexander Isak", "Anthony Elanga", "Victor Nilsson Lindelöf", "Isak Hien"] },
      { name: "Tunisien",      players: ["Ellyes Skhiri", "Aïssa Laïdouni", "Montassir Talbi", "Hannibal Mejbri", "Elias Achouri"] },
    ],
  },
  {
    group: "G",
    teams: [
      { name: "Belgien",    players: ["Kevin De Bruyne", "Jérémy Doku", "Romelu Lukaku", "Lois Openda", "Amadou Onana"] },
      { name: "Iran",       players: ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Saman Ghoddos", "Majid Hosseini"] },
      { name: "Egypten",    players: ["Mohamed Salah", "Omar Marmoush", "Mostafa Mohamed", "Trézéguet", "Mohamed Elneny"] },
      { name: "Nya Zeeland",players: ["Chris Wood", "Liberato Cacace", "Sarpreet Singh", "Marko Stamenic", "Joe Bell"] },
    ],
  },
  {
    group: "H",
    teams: [
      { name: "Spanien",      players: ["Lamine Yamal", "Rodri", "Pedri", "Nico Williams", "Dani Carvajal"] },
      { name: "Uruguay",      players: ["Federico Valverde", "Darwin Núñez", "Ronald Araújo", "Rodrigo Bentancur", "Manuel Ugarte"] },
      { name: "Saudiarabien", players: ["Salem Al-Dawsari", "Firas Al-Buraikan", "Saud Abdulhamid", "Mohamed Kanno", "Sultan Al-Ghannam"] },
      { name: "Kap Verde",    players: ["Ryan Mendes", "Bebé", "Garry Rodrigues", "Logan Costa", "Jovane Cabral"] },
    ],
  },
  {
    group: "I",
    teams: [
      { name: "Frankrike", players: ["Kylian Mbappé", "Antoine Griezmann", "Aurélien Tchouaméni", "William Saliba", "Mike Maignan"] },
      { name: "Senegal",   players: ["Sadio Mané", "Nicolas Jackson", "Kalidou Koulibaly", "Pape Matar Sarr", "Idrissa Gueye"] },
      { name: "Norge",     players: ["Erling Haaland", "Martin Ødegaard", "Alexander Sørloth", "Antonio Nusa", "Julian Ryerson"] },
      { name: "Irak",      players: ["Aymen Hussein", "Ali Jasim", "Zidane Iqbal", "Ibrahim Bayesh", "Rebin Sulaka"] },
    ],
  },
  {
    group: "J",
    teams: [
      { name: "Argentina", players: ["Lionel Messi", "Julian Álvarez", "Lautaro Martínez", "Alexis Mac Allister", "Emiliano Martínez"] },
      { name: "Österrike", players: ["Marcel Sabitzer", "Konrad Laimer", "Christoph Baumgartner", "Kevin Danso", "Michael Gregoritsch"] },
      { name: "Algeriet",  players: ["Amine Gouiri", "Rayan Aït-Nouri", "Ismaël Bennacer", "Said Benrahma", "Riyad Mahrez"] },
      { name: "Jordanien", players: ["Mousa Al-Tamari", "Yazan Al-Naimat", "Ali Olwan", "Noor Al-Rawabdeh", "Yazan Al-Arab"] },
    ],
  },
  {
    group: "K",
    teams: [
      { name: "Portugal",   players: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão", "Rúben Dias"] },
      { name: "Colombia",   players: ["Luis Díaz", "James Rodríguez", "Jhon Durán", "Daniel Muñoz", "Jefferson Lerma"] },
      { name: "Uzbekistan", players: ["Eldor Shomurodov", "Abbosbek Fayzullaev", "Otabek Shukurov", "Jaloliddin Masharipov", "Abdukodir Khusanov"] },
      { name: "DR Kongo",   players: ["Yoane Wissa", "Chancel Mbemba", "Meschack Elia", "Samuel Moutoussamy", "Arthur Masuaku"] },
    ],
  },
  {
    group: "L",
    teams: [
      { name: "England",  players: ["Jude Bellingham", "Harry Kane", "Bukayo Saka", "Declan Rice", "Phil Foden"] },
      { name: "Kroatien", players: ["Luka Modrić", "Joško Gvardiol", "Mateo Kovačić", "Andrej Kramarić", "Josip Šutalo"] },
      { name: "Panama",   players: ["Adalberto Carrasquilla", "Ismael Díaz", "José Fajardo", "Michael Amir Murillo", "Édgar Bárcenas"] },
      { name: "Ghana",    players: ["Mohammed Kudus", "Inaki Williams", "Thomas Partey", "Antoine Semenyo", "Jordan Ayew"] },
    ],
  },
];

// Flat 48-team list (Swedish names, alphabetical) derived from group data
export const WC_TEAMS: string[] = WC_GROUPS_DATA
  .flatMap((g) => g.teams.map((t) => t.name))
  .sort((a, b) => a.localeCompare(b, "sv"));

// All key players (unique, sorted) for PlayerSelect dropdowns
export const FAMOUS_PLAYERS: string[] = Array.from(
  new Set(
    WC_GROUPS_DATA.flatMap((g) =>
      g.teams.flatMap((t) => t.players)
    )
  )
).sort((a, b) => a.localeCompare(b, "sv"));

// Quick lookup: Swedish team name → group letter
export const TEAM_TO_GROUP: Record<string, string> = Object.fromEntries(
  WC_GROUPS_DATA.flatMap((g) => g.teams.map((t) => [t.name, g.group]))
);

// Quick lookup: group letter → array of team names
export const GROUP_TO_TEAMS: Record<string, string[]> = Object.fromEntries(
  WC_GROUPS_DATA.map((g) => [g.group, g.teams.map((t) => t.name)])
);

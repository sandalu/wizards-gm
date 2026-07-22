// Real NBA data — transcribed VERBATIM from the original wizards-gm.jsx artifact
// (reference/wizards-gm.jsx). Names / positions / overalls are the real curated
// values and must never be regenerated. See CLAUDE hard rule: every player is real.

export const BASE_SEASON = 2026;
export const ROSTER_SIZE = 15;

export type Conference = "E" | "W";
export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type Tag = "Legend" | "Star" | "Veteran";

export interface TeamSeed {
  id: string; // abbreviation
  name: string;
  conf: Conference;
  color: string;
}

export const TEAMS: TeamSeed[] = [
  { id: "ATL", name: "Atlanta Hawks", conf: "E", color: "#E03A3E" },
  { id: "BOS", name: "Boston Celtics", conf: "E", color: "#007A33" },
  { id: "BKN", name: "Brooklyn Nets", conf: "E", color: "#3F3F3F" },
  { id: "CHA", name: "Charlotte Hornets", conf: "E", color: "#1D1160" },
  { id: "CHI", name: "Chicago Bulls", conf: "E", color: "#CE1141" },
  { id: "CLE", name: "Cleveland Cavaliers", conf: "E", color: "#860038" },
  { id: "DET", name: "Detroit Pistons", conf: "E", color: "#C8102E" },
  { id: "IND", name: "Indiana Pacers", conf: "E", color: "#002D62" },
  { id: "MIA", name: "Miami Heat", conf: "E", color: "#98002E" },
  { id: "MIL", name: "Milwaukee Bucks", conf: "E", color: "#00471B" },
  { id: "NYK", name: "New York Knicks", conf: "E", color: "#006BB6" },
  { id: "ORL", name: "Orlando Magic", conf: "E", color: "#0077C0" },
  { id: "PHI", name: "Philadelphia 76ers", conf: "E", color: "#ED174C" },
  { id: "TOR", name: "Toronto Raptors", conf: "E", color: "#CE1141" },
  { id: "WAS", name: "Washington Wizards", conf: "E", color: "#E31837" },
  { id: "DAL", name: "Dallas Mavericks", conf: "W", color: "#00538C" },
  { id: "DEN", name: "Denver Nuggets", conf: "W", color: "#0E2240" },
  { id: "GSW", name: "Golden State Warriors", conf: "W", color: "#1D428A" },
  { id: "HOU", name: "Houston Rockets", conf: "W", color: "#CE1141" },
  { id: "LAC", name: "LA Clippers", conf: "W", color: "#C8102E" },
  { id: "LAL", name: "LA Lakers", conf: "W", color: "#552583" },
  { id: "MEM", name: "Memphis Grizzlies", conf: "W", color: "#5D76A9" },
  { id: "MIN", name: "Minnesota Timberwolves", conf: "W", color: "#236192" },
  { id: "NOP", name: "New Orleans Pelicans", conf: "W", color: "#0C2340" },
  { id: "OKC", name: "Oklahoma City Thunder", conf: "W", color: "#007AC1" },
  { id: "PHX", name: "Phoenix Suns", conf: "W", color: "#1D1160" },
  { id: "POR", name: "Portland Trail Blazers", conf: "W", color: "#E03A3E" },
  { id: "SAC", name: "Sacramento Kings", conf: "W", color: "#5A2D81" },
  { id: "SAS", name: "San Antonio Spurs", conf: "W", color: "#8A8D8F" },
  { id: "UTA", name: "Utah Jazz", conf: "W", color: "#002B5C" },
];

export const WIZ = "WAS";
export const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];
export const TOTAL_PLAYERS = TEAMS.length * ROSTER_SIZE; // 450

// [name, position, overall, tag]
type Row = [string, Position, number, Tag];

export const CURATED: Row[] = [
  ["Michael Jordan", "SG", 99, "Legend"], ["Kareem Abdul-Jabbar", "C", 97, "Legend"], ["LeBron James", "SF", 97, "Legend"],
  ["Wilt Chamberlain", "C", 96, "Legend"], ["Magic Johnson", "PG", 96, "Legend"], ["Kobe Bryant", "SG", 96, "Legend"],
  ["Larry Bird", "SF", 95, "Legend"], ["Shaquille O'Neal", "C", 95, "Legend"], ["Tim Duncan", "PF", 95, "Legend"],
  ["Bill Russell", "C", 94, "Legend"], ["Hakeem Olajuwon", "C", 94, "Legend"], ["Oscar Robertson", "PG", 93, "Legend"],
  ["Dirk Nowitzki", "PF", 93, "Legend"], ["Julius Erving", "SF", 92, "Legend"], ["Karl Malone", "PF", 92, "Legend"],
  ["Charles Barkley", "PF", 92, "Legend"], ["Jerry West", "SG", 92, "Legend"], ["David Robinson", "C", 92, "Legend"],
  ["Kevin Garnett", "PF", 92, "Legend"], ["Dwyane Wade", "SG", 92, "Legend"], ["John Stockton", "PG", 91, "Legend"],
  ["Scottie Pippen", "SF", 91, "Legend"], ["Kawhi Leonard", "SF", 91, "Legend"], ["Allen Iverson", "PG", 90, "Legend"],
  ["Moses Malone", "C", 90, "Legend"], ["Elgin Baylor", "SF", 90, "Legend"], ["Isiah Thomas", "PG", 90, "Legend"],
  ["Chris Paul", "PG", 90, "Legend"], ["Patrick Ewing", "C", 89, "Legend"], ["Clyde Drexler", "SG", 89, "Legend"],
  ["Steve Nash", "PG", 89, "Legend"], ["Grant Hill", "SF", 85, "Legend"], ["James Worthy", "SF", 87, "Legend"],
  ["Reggie Miller", "SG", 87, "Legend"], ["Gary Payton", "PG", 88, "Legend"], ["Tracy McGrady", "SG", 88, "Legend"],
  ["Dwight Howard", "C", 88, "Legend"], ["George Mikan", "C", 88, "Legend"], ["Dominique Wilkins", "SF", 88, "Legend"],
  ["Jason Kidd", "PG", 87, "Legend"], ["Manu Ginobili", "SG", 86, "Legend"], ["Tony Parker", "PG", 87, "Legend"],
  ["Pau Gasol", "PF", 87, "Legend"], ["Paul Pierce", "SF", 87, "Legend"], ["Ray Allen", "SG", 88, "Legend"],
  ["Chris Bosh", "PF", 87, "Legend"], ["Carmelo Anthony", "SF", 87, "Legend"], ["Bob Cousy", "PG", 87, "Legend"],
  ["Willis Reed", "C", 86, "Legend"], ["Vince Carter", "SG", 86, "Legend"], ["Chris Webber", "PF", 86, "Legend"],
  ["Yao Ming", "C", 85, "Legend"], ["Amar'e Stoudemire", "PF", 85, "Legend"], ["Ben Wallace", "C", 83, "Legend"],
  ["Rasheed Wallace", "PF", 83, "Legend"], ["Chauncey Billups", "PG", 84, "Legend"], ["Deron Williams", "PG", 84, "Legend"],
  ["Nikola Jokic", "C", 98, "Star"], ["Giannis Antetokounmpo", "PF", 97, "Star"], ["Luka Doncic", "PG", 96, "Star"],
  ["Shai Gilgeous-Alexander", "PG", 96, "Star"], ["Stephen Curry", "PG", 95, "Star"], ["Kevin Durant", "SF", 95, "Star"],
  ["Jayson Tatum", "SF", 94, "Star"], ["Victor Wembanyama", "C", 94, "Star"], ["Joel Embiid", "C", 93, "Star"],
  ["Anthony Davis", "PF", 92, "Star"], ["Anthony Edwards", "SG", 92, "Star"], ["Devin Booker", "SG", 91, "Star"],
  ["Damian Lillard", "PG", 91, "Star"], ["Kyrie Irving", "PG", 90, "Star"], ["Jimmy Butler", "SF", 90, "Star"],
  ["James Harden", "PG", 90, "Star"], ["Donovan Mitchell", "SG", 90, "Star"], ["Jalen Brunson", "PG", 89, "Star"],
  ["Tyrese Haliburton", "PG", 89, "Star"], ["Ja Morant", "PG", 89, "Star"], ["Jaylen Brown", "SF", 89, "Star"],
  ["Domantas Sabonis", "C", 88, "Star"], ["Karl-Anthony Towns", "C", 88, "Star"], ["De'Aaron Fox", "PG", 88, "Star"],
  ["Paolo Banchero", "PF", 88, "Star"], ["Cade Cunningham", "PG", 88, "Star"], ["Trae Young", "PG", 88, "Star"],
  ["Alperen Sengun", "C", 87, "Star"], ["Chet Holmgren", "C", 87, "Star"], ["Evan Mobley", "PF", 87, "Star"],
  ["Bam Adebayo", "C", 87, "Star"], ["Zion Williamson", "PF", 87, "Star"], ["Pascal Siakam", "PF", 87, "Star"],
  ["LaMelo Ball", "PG", 87, "Star"], ["Scottie Barnes", "SF", 86, "Star"], ["Franz Wagner", "SF", 86, "Star"],
  ["Desmond Bane", "SG", 86, "Star"], ["Brandon Ingram", "SF", 86, "Star"], ["Rudy Gobert", "C", 86, "Star"],
  ["Jaren Jackson Jr.", "PF", 85, "Star"], ["Kristaps Porzingis", "PF", 85, "Star"], ["Zach LaVine", "SG", 85, "Star"],
  ["DeMar DeRozan", "SF", 85, "Star"], ["Julius Randle", "PF", 84, "Star"], ["Mikal Bridges", "SF", 84, "Star"],
  ["OG Anunoby", "SF", 84, "Star"], ["Jrue Holiday", "PG", 84, "Star"], ["Klay Thompson", "SG", 83, "Star"],
  ["Draymond Green", "PF", 82, "Star"], ["Fred VanVleet", "PG", 83, "Star"], ["Amen Thompson", "SF", 83, "Star"],
  ["Jalen Williams", "SF", 86, "Star"], ["Tyrese Maxey", "PG", 86, "Star"], ["Deni Avdija", "SF", 82, "Star"],
  ["Bradley Beal", "SG", 84, "Star"], ["Kyle Kuzma", "SF", 80, "Star"], ["Jordan Poole", "SG", 79, "Star"],
  ["Alex Sarr", "C", 78, "Star"], ["Bilal Coulibaly", "SF", 78, "Star"], ["Tyus Jones", "PG", 78, "Star"],
  ["Cam Whitmore", "SF", 80, "Star"], ["Jalen Duren", "C", 81, "Star"], ["Keegan Murray", "SF", 80, "Star"],
];

// Second wave: real role players, veterans, retro stars and recent draftees.
export const CURATED_2: Row[] = [
  ["Kevin Love", "PF", 82, "Veteran"], ["DeMarcus Cousins", "C", 84, "Veteran"], ["Marcus Smart", "PG", 80, "Veteran"],
  ["J.R. Smith", "SG", 78, "Veteran"], ["Seth Curry", "SG", 78, "Veteran"], ["Al Horford", "C", 83, "Veteran"],
  ["Nikola Vucevic", "C", 83, "Veteran"], ["Clint Capela", "C", 80, "Veteran"], ["Jonas Valanciunas", "C", 79, "Veteran"],
  ["Myles Turner", "C", 82, "Veteran"], ["Brook Lopez", "C", 81, "Veteran"], ["Robin Lopez", "C", 73, "Veteran"],
  ["Andre Drummond", "C", 79, "Veteran"], ["Steven Adams", "C", 79, "Veteran"], ["Mason Plumlee", "C", 74, "Veteran"],
  ["Serge Ibaka", "PF", 79, "Veteran"], ["Marc Gasol", "C", 85, "Veteran"], ["Nikola Mirotic", "PF", 77, "Veteran"],
  ["Danilo Gallinari", "PF", 80, "Veteran"], ["Aaron Gordon", "PF", 83, "Veteran"], ["Harrison Barnes", "SF", 79, "Veteran"],
  ["Otto Porter Jr.", "SF", 78, "Veteran"], ["Jerami Grant", "PF", 82, "Veteran"], ["Tobias Harris", "PF", 82, "Veteran"],
  ["P.J. Tucker", "PF", 75, "Veteran"], ["Marcus Morris", "PF", 77, "Veteran"], ["Markieff Morris", "PF", 75, "Veteran"],
  ["Taj Gibson", "PF", 73, "Veteran"], ["Thaddeus Young", "PF", 76, "Veteran"], ["Nerlens Noel", "C", 73, "Veteran"],
  ["JaVale McGee", "C", 75, "Veteran"], ["Montrezl Harrell", "C", 78, "Veteran"], ["Christian Wood", "PF", 79, "Veteran"],
  ["Kelly Olynyk", "C", 76, "Veteran"], ["Nikola Jovic", "PF", 76, "Veteran"], ["Bobby Portis", "PF", 80, "Veteran"],
  ["John Collins", "PF", 80, "Veteran"], ["De'Andre Hunter", "SF", 78, "Veteran"], ["Cam Johnson", "SF", 80, "Veteran"],
  ["Grayson Allen", "SG", 79, "Veteran"], ["Duncan Robinson", "SG", 78, "Veteran"], ["Max Strus", "SG", 76, "Veteran"],
  ["Caleb Martin", "SF", 77, "Veteran"], ["Naz Reid", "C", 79, "Veteran"], ["Jaden McDaniels", "SF", 80, "Veteran"],
  ["Malcolm Brogdon", "PG", 81, "Veteran"], ["Spencer Dinwiddie", "PG", 79, "Veteran"], ["Cameron Payne", "PG", 75, "Veteran"],
  ["Dennis Schroder", "PG", 80, "Veteran"], ["Kemba Walker", "PG", 82, "Veteran"], ["D'Angelo Russell", "PG", 82, "Veteran"],
  ["Buddy Hield", "SG", 80, "Veteran"], ["C.J. McCollum", "SG", 84, "Veteran"], ["Norman Powell", "SG", 80, "Veteran"],
  ["Terry Rozier", "PG", 80, "Veteran"], ["Eric Gordon", "SG", 79, "Veteran"], ["Lou Williams", "SG", 80, "Veteran"],
  ["Jamal Crawford", "SG", 79, "Veteran"], ["Nick Young", "SG", 75, "Veteran"], ["J.J. Redick", "SG", 78, "Veteran"],
  ["Kyle Korver", "SG", 78, "Veteran"], ["Danny Green", "SG", 78, "Veteran"], ["P.J. Washington", "PF", 79, "Veteran"],
  ["Bogdan Bogdanovic", "SG", 80, "Veteran"], ["Bojan Bogdanovic", "SF", 80, "Veteran"], ["Josh Hart", "SG", 80, "Veteran"],
  ["Immanuel Quickley", "PG", 80, "Veteran"], ["R.J. Barrett", "SG", 81, "Veteran"], ["Jordan Clarkson", "SG", 79, "Veteran"],
  ["Collin Sexton", "PG", 78, "Veteran"], ["Malik Monk", "SG", 79, "Veteran"], ["Josh Giddey", "PG", 80, "Veteran"],
  ["Anfernee Simons", "SG", 81, "Veteran"], ["Coby White", "PG", 80, "Veteran"], ["Ayo Dosunmu", "SG", 76, "Veteran"],
  ["Jose Alvarado", "PG", 74, "Veteran"], ["Payton Pritchard", "PG", 78, "Veteran"], ["Derrick White", "PG", 82, "Veteran"],
  ["Marcus Sasser", "PG", 73, "Veteran"], ["Tre Jones", "PG", 75, "Veteran"], ["Monte Morris", "PG", 76, "Veteran"],
  ["Delon Wright", "PG", 75, "Veteran"], ["Patrick Beverley", "PG", 76, "Veteran"], ["Avery Bradley", "SG", 75, "Veteran"],
  ["Dennis Smith Jr.", "PG", 73, "Veteran"], ["Frank Ntilikina", "PG", 70, "Veteran"], ["Elfrid Payton", "PG", 73, "Veteran"],
  ["D.J. Augustin", "PG", 75, "Veteran"], ["Goran Dragic", "PG", 82, "Veteran"], ["Ricky Rubio", "PG", 79, "Veteran"],
  ["George Hill", "PG", 77, "Veteran"], ["Jose Calderon", "PG", 75, "Veteran"], ["Rajon Rondo", "PG", 82, "Veteran"],
  ["Kyle Lowry", "PG", 85, "Veteran"], ["Mike Conley", "PG", 85, "Veteran"], ["Ish Smith", "PG", 72, "Veteran"],
  ["Cory Joseph", "PG", 73, "Veteran"], ["Raul Neto", "PG", 68, "Veteran"],
  ["Michael Porter Jr.", "SF", 81, "Veteran"], ["Miles Bridges", "SF", 80, "Veteran"], ["Terrence Ross", "SG", 77, "Veteran"],
  ["Rui Hachimura", "PF", 78, "Veteran"], ["Herbert Jones", "SF", 78, "Veteran"], ["Trey Murphy III", "SF", 79, "Veteran"],
  ["Dillon Brooks", "SF", 78, "Veteran"], ["Luguentz Dort", "SG", 78, "Veteran"], ["Robert Covington", "PF", 76, "Veteran"],
  ["Torrey Craig", "SF", 72, "Veteran"], ["Kyle Anderson", "SF", 76, "Veteran"], ["Nicolas Batum", "SF", 78, "Veteran"],
  ["Trevor Ariza", "SF", 77, "Veteran"], ["Andre Iguodala", "SF", 82, "Veteran"], ["Shane Battier", "SF", 78, "Veteran"],
  ["Bruce Bowen", "SF", 76, "Veteran"], ["Josh Smith", "PF", 80, "Veteran"], ["Rashard Lewis", "SF", 81, "Veteran"],
  ["Al Harrington", "PF", 77, "Veteran"], ["Antawn Jamison", "PF", 82, "Veteran"], ["Shawn Marion", "SF", 85, "Veteran"],
  ["Boris Diaw", "PF", 77, "Veteran"], ["Luol Deng", "SF", 80, "Veteran"], ["Josh Childress", "SF", 74, "Veteran"],
  ["Metta World Peace", "SF", 80, "Veteran"], ["Lamar Odom", "PF", 83, "Veteran"], ["Jared Dudley", "SF", 73, "Veteran"],
  ["Kenneth Faried", "PF", 76, "Veteran"], ["Ed Davis", "PF", 73, "Veteran"],
  ["Enes Kanter", "C", 77, "Veteran"], ["Deandre Ayton", "C", 81, "Veteran"], ["Wendell Carter Jr.", "C", 78, "Veteran"],
  ["Daniel Gafford", "C", 77, "Veteran"], ["Jusuf Nurkic", "C", 79, "Veteran"], ["Ivica Zubac", "C", 80, "Veteran"],
  ["Walker Kessler", "C", 79, "Veteran"], ["Isaiah Hartenstein", "C", 79, "Veteran"], ["Mitchell Robinson", "C", 78, "Veteran"],
  ["Jarrett Allen", "C", 82, "Veteran"], ["Jakob Poeltl", "C", 79, "Veteran"], ["Onyeka Okongwu", "C", 79, "Veteran"],
  ["Nick Richards", "C", 74, "Veteran"], ["Dwight Powell", "C", 72, "Veteran"], ["Mo Bamba", "C", 73, "Veteran"],
  ["Moses Brown", "C", 70, "Veteran"], ["Dewayne Dedmon", "C", 71, "Veteran"], ["Meyers Leonard", "C", 70, "Veteran"],
  ["Baron Davis", "PG", 85, "Veteran"], ["Stephon Marbury", "PG", 84, "Veteran"], ["Jason Terry", "SG", 80, "Veteran"],
  ["Antoine Walker", "PF", 82, "Veteran"], ["Glen Rice", "SF", 83, "Veteran"], ["Mitch Richmond", "SG", 85, "Veteran"],
  ["Latrell Sprewell", "SG", 84, "Veteran"], ["Nick Van Exel", "PG", 81, "Veteran"], ["Sam Cassell", "PG", 82, "Veteran"],
  ["Doug Christie", "SG", 76, "Veteran"], ["Michael Finley", "SG", 82, "Veteran"], ["Peja Stojakovic", "SF", 83, "Veteran"],
  ["Andrei Kirilenko", "PF", 82, "Veteran"], ["Zydrunas Ilgauskas", "C", 79, "Veteran"], ["Eddy Curry", "C", 75, "Veteran"],
  ["Tyson Chandler", "C", 81, "Veteran"], ["Elton Brand", "PF", 82, "Veteran"], ["Corey Maggette", "SF", 76, "Veteran"],
  ["Steve Francis", "PG", 83, "Veteran"], ["Cuttino Mobley", "SG", 78, "Veteran"], ["Jermaine O'Neal", "PF", 84, "Veteran"],
  ["Antonio Davis", "PF", 76, "Veteran"], ["Theo Ratliff", "C", 74, "Veteran"], ["Anfernee Hardaway", "SG", 87, "Veteran"],
  ["Horace Grant", "PF", 80, "Veteran"], ["Toni Kukoc", "SF", 82, "Veteran"], ["Dennis Rodman", "PF", 87, "Veteran"],
  ["Robert Horry", "PF", 78, "Veteran"], ["Derek Fisher", "PG", 76, "Veteran"], ["Rick Fox", "SF", 75, "Veteran"],
  ["Brian Shaw", "PG", 73, "Veteran"], ["Byron Scott", "SG", 76, "Veteran"], ["A.C. Green", "PF", 77, "Veteran"],
  ["Vlade Divac", "C", 83, "Veteran"], ["Sam Perkins", "PF", 78, "Veteran"], ["Dale Ellis", "SG", 79, "Veteran"],
  ["Terry Cummings", "PF", 81, "Veteran"], ["Xavier McDaniel", "SF", 80, "Veteran"], ["Alex English", "SF", 86, "Veteran"],
  ["Bernard King", "SF", 86, "Veteran"], ["Adrian Dantley", "SF", 86, "Veteran"], ["World B. Free", "SG", 80, "Veteran"],
  ["George Gervin", "SG", 89, "Veteran"], ["Artis Gilmore", "C", 85, "Veteran"], ["Dan Issel", "C", 83, "Veteran"],
  ["Bob McAdoo", "PF", 85, "Veteran"], ["Nate Archibald", "PG", 84, "Veteran"], ["Walt Frazier", "PG", 87, "Veteran"],
  ["Earl Monroe", "SG", 85, "Veteran"], ["Pete Maravich", "PG", 86, "Veteran"], ["Rick Barry", "SF", 88, "Veteran"],
  ["Connie Hawkins", "SF", 82, "Veteran"], ["Dave Cowens", "C", 85, "Veteran"], ["Wes Unseld", "C", 83, "Veteran"],
  ["Elvin Hayes", "PF", 85, "Veteran"], ["Nate Thurmond", "C", 83, "Veteran"], ["Dave DeBusschere", "PF", 82, "Veteran"],
  ["Jo Jo White", "SG", 80, "Veteran"], ["Gus Williams", "PG", 80, "Veteran"], ["Marques Johnson", "SF", 81, "Veteran"],
  ["Sidney Moncrief", "SG", 82, "Veteran"],
  ["Malik Beasley", "SG", 77, "Veteran"], ["Gary Trent Jr.", "SG", 78, "Veteran"], ["Kevon Looney", "C", 73, "Veteran"],
  ["Andrew Wiggins", "SF", 80, "Veteran"], ["Jonathan Kuminga", "PF", 79, "Veteran"], ["Moses Moody", "SG", 75, "Veteran"],
  ["Trayce Jackson-Davis", "C", 75, "Veteran"], ["Jaime Jaquez Jr.", "SF", 77, "Veteran"], ["Ochai Agbaji", "SG", 73, "Veteran"],
  ["Dyson Daniels", "SG", 79, "Veteran"], ["Jabari Smith Jr.", "PF", 78, "Veteran"], ["Keyonte George", "PG", 76, "Veteran"],
  ["Taylor Hendricks", "PF", 73, "Veteran"], ["Brandin Podziemski", "SG", 78, "Veteran"], ["Toumani Camara", "PF", 76, "Veteran"],
  ["G.G. Jackson", "PF", 74, "Veteran"],
  ["Marvin Bagley III", "PF", 75, "Veteran"], ["Cole Anthony", "PG", 76, "Veteran"], ["Jalen Suggs", "PG", 79, "Veteran"],
  ["Killian Hayes", "PG", 68, "Veteran"], ["Ziaire Williams", "SF", 73, "Veteran"], ["Isaiah Jackson", "C", 73, "Veteran"],
  ["Kai Jones", "C", 68, "Veteran"], ["Davion Mitchell", "PG", 75, "Veteran"], ["Chris Duarte", "SG", 73, "Veteran"],
  ["Corey Kispert", "SF", 76, "Veteran"], ["Josh Christopher", "SG", 68, "Veteran"], ["Jalen Johnson", "PF", 81, "Veteran"],
  ["Jaden Springer", "SG", 68, "Veteran"], ["Usman Garuba", "PF", 66, "Veteran"], ["Jared Butler", "PG", 68, "Veteran"],
  ["Neemias Queta", "C", 73, "Veteran"], ["Sandro Mamukelashvili", "PF", 68, "Veteran"], ["Day'Ron Sharpe", "C", 70, "Veteran"],
  ["Yves Missi", "C", 75, "Veteran"], ["Zaccharie Risacher", "SF", 76, "Veteran"], ["Reed Sheppard", "PG", 75, "Veteran"],
  ["Stephon Castle", "SG", 78, "Veteran"], ["Ron Holland", "SF", 75, "Veteran"], ["Matas Buzelis", "PF", 76, "Veteran"],
  ["Zach Edey", "C", 77, "Veteran"], ["Donovan Clingan", "C", 77, "Veteran"], ["Rob Dillingham", "PG", 73, "Veteran"],
  ["Bub Carrington", "PG", 72, "Veteran"], ["Kel'el Ware", "C", 75, "Veteran"], ["Dalton Knecht", "SG", 76, "Veteran"],
  ["Tristan Da Silva", "SF", 73, "Veteran"], ["Jaylen Wells", "SF", 74, "Veteran"], ["Isaiah Collier", "PG", 72, "Veteran"],
  ["Dejounte Murray", "PG", 82, "Veteran"], ["Kentavious Caldwell-Pope", "SG", 78, "Veteran"], ["Kris Dunn", "PG", 75, "Veteran"],
  ["Lonzo Ball", "PG", 78, "Veteran"], ["Josh Okogie", "SG", 72, "Veteran"], ["Wendell Moore Jr.", "SG", 68, "Veteran"],
  ["Jaden Ivey", "SG", 78, "Veteran"], ["Bennedict Mathurin", "SG", 79, "Veteran"], ["Andrew Nembhard", "PG", 77, "Veteran"],
  ["Aaron Nesmith", "SF", 77, "Veteran"], ["Isaiah Stewart", "C", 78, "Veteran"], ["Saddiq Bey", "SF", 77, "Veteran"],
  ["Precious Achiuwa", "PF", 75, "Veteran"], ["Obi Toppin", "PF", 77, "Veteran"], ["Tyrese Martin", "SG", 68, "Veteran"],
  ["Jalen Wilson", "SF", 70, "Veteran"], ["Jaylin Williams", "PF", 70, "Veteran"], ["Kenneth Lofton Jr.", "PF", 69, "Veteran"],
  ["Ausar Thompson", "SF", 80, "Veteran"], ["Cason Wallace", "PG", 77, "Veteran"], ["Gradey Dick", "SG", 76, "Veteran"],
  ["Jett Howard", "SG", 68, "Veteran"], ["Brice Sensabaugh", "SF", 68, "Veteran"], ["Kobe Bufkin", "PG", 67, "Veteran"],
  ["Jarace Walker", "PF", 73, "Veteran"], ["Anthony Black", "PG", 73, "Veteran"],
  ["Nate Robinson", "PG", 77, "Veteran"], ["Earl Boykins", "PG", 72, "Veteran"], ["Jameer Nelson", "PG", 77, "Veteran"],
  ["Devin Harris", "PG", 78, "Veteran"], ["Jarrett Jack", "PG", 75, "Veteran"], ["Aaron Brooks", "PG", 73, "Veteran"],
  ["Ramon Sessions", "PG", 74, "Veteran"], ["Darren Collison", "PG", 76, "Veteran"], ["Brandon Jennings", "PG", 77, "Veteran"],
  ["Isaiah Thomas", "PG", 85, "Veteran"], ["Evan Turner", "SG", 75, "Veteran"], ["Michael Carter-Williams", "PG", 73, "Veteran"],
  ["Dion Waiters", "SG", 75, "Veteran"], ["Iman Shumpert", "SG", 74, "Veteran"], ["Jimmer Fredette", "PG", 72, "Veteran"],
  ["Solomon Hill", "SF", 70, "Veteran"], ["Justise Winslow", "SF", 75, "Veteran"], ["Stanley Johnson", "SF", 72, "Veteran"],
  ["Kelly Oubre Jr.", "SF", 78, "Veteran"], ["Skal Labissiere", "C", 70, "Veteran"], ["Thon Maker", "C", 68, "Veteran"],
  ["Jarrett Culver", "SG", 70, "Veteran"], ["Cam Reddish", "SF", 72, "Veteran"], ["Tyler Herro", "SG", 83, "Veteran"],
  ["Nickeil Alexander-Walker", "SG", 76, "Veteran"], ["Jalen McDaniels", "PF", 74, "Veteran"],
  ["Rudy Gay", "SF", 82, "Veteran"], ["Danny Granger", "SF", 81, "Veteran"], ["Josh Howard", "SF", 79, "Veteran"],
  ["Caron Butler", "SF", 81, "Veteran"], ["Andre Miller", "PG", 80, "Veteran"], ["Jason Richardson", "SG", 80, "Veteran"],
  ["Richard Jefferson", "SF", 78, "Veteran"], ["Kirk Hinrich", "PG", 76, "Veteran"], ["Ben Gordon", "SG", 79, "Veteran"],
  ["Joakim Noah", "C", 81, "Veteran"], ["Carlos Boozer", "PF", 82, "Veteran"], ["Zach Randolph", "PF", 83, "Veteran"],
  ["Emeka Okafor", "C", 77, "Veteran"], ["Chris Kaman", "C", 77, "Veteran"], ["David Lee", "PF", 80, "Veteran"],
  ["Al Jefferson", "C", 81, "Veteran"], ["LaMarcus Aldridge", "PF", 87, "Veteran"], ["Blake Griffin", "PF", 87, "Veteran"],
  ["DeAndre Jordan", "C", 82, "Veteran"], ["Paul Millsap", "PF", 85, "Veteran"], ["Nikola Pekovic", "C", 75, "Veteran"],
  ["Roy Hibbert", "C", 80, "Veteran"], ["David West", "PF", 81, "Veteran"], ["Paul George", "SF", 90, "Veteran"],
  ["Victor Oladipo", "SG", 82, "Veteran"], ["Ben Simmons", "PG", 80, "Veteran"], ["Markelle Fultz", "PG", 73, "Veteran"],
  ["Marvin Williams", "PF", 75, "Veteran"], ["Gordon Hayward", "SF", 82, "Veteran"], ["Andre Roberson", "SF", 73, "Veteran"],
  ["Derrick Rose", "PG", 88, "Veteran"],
];

// ---------------------------------------------------------------------------
// Deterministic pool builder + player derivation
// ---------------------------------------------------------------------------

/** Small seeded PRNG (mulberry32) so derived ages/potentials are reproducible. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DerivedPlayer {
  name: string;
  position: Position;
  baseOverall: number;
  currentOverall: number;
  potential: number;
  careerStage: "rookie" | "prime" | "veteran" | "legend";
  age: number;
  birthYear: number;
  tag: Tag;
}

/**
 * Combine + de-duplicate the curated arrays exactly like the original artifact:
 * concat, drop later duplicates by lowercased name, slice to TOTAL_PLAYERS.
 */
export function buildPool(): Row[] {
  const combined = [...CURATED, ...CURATED_2];
  const seen = new Set<string>();
  const deduped: Row[] = [];
  for (const row of combined) {
    const key = row[0].toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(row);
    }
  }
  return deduped.slice(0, TOTAL_PLAYERS);
}

/**
 * Derive an approximate age / career stage / potential from a curated row.
 * The source only distinguishes Legend / Star / Veteran, so this is heuristic
 * (per the spec: "derive an approximate age/career stage per player").
 *  - Legend  -> older, "retired-adjacent" age, no further growth.
 *  - Star    -> athletic prime, small upside.
 *  - Veteran -> spread of ages; lower-rated ones treated as younger with upside
 *               to stand in for recent draftees.
 */
export function derivePlayer(row: Row, rand: () => number): DerivedPlayer {
  const [name, position, ovr, tag] = row;
  let careerStage: DerivedPlayer["careerStage"];
  let age: number;
  let potential: number;

  if (tag === "Legend") {
    careerStage = "legend";
    age = 34 + Math.floor(rand() * 7); // 34–40
    potential = ovr;
  } else if (tag === "Star") {
    careerStage = "prime";
    age = 25 + Math.floor(rand() * 5); // 25–29
    potential = Math.min(99, ovr + Math.floor(rand() * 3)); // +0..2
  } else {
    // Veteran: low-rated ones read as young prospects, high-rated as older vets.
    if (ovr <= 76) {
      careerStage = "rookie";
      age = 20 + Math.floor(rand() * 4); // 20–23
      potential = Math.min(99, ovr + 4 + Math.floor(rand() * 8)); // real upside
    } else {
      careerStage = "veteran";
      age = 30 + Math.floor(rand() * 7); // 30–36
      potential = ovr;
    }
  }

  return {
    name,
    position,
    baseOverall: ovr,
    currentOverall: ovr,
    potential,
    careerStage,
    age,
    birthYear: BASE_SEASON - age,
    tag,
  };
}

/** Full derived initial player pool (deterministic). */
export function derivedPool(seed = 20260722): DerivedPlayer[] {
  const rand = mulberry32(seed);
  return buildPool().map((row) => derivePlayer(row, rand));
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, Star, Users, Search, Award, ChevronRight, Shield } from 'lucide-react';

/* ============================== DATA ============================== */

const TEAMS = [
  { id: 'ATL', name: 'Atlanta Hawks', conf: 'E', color: '#E03A3E' },
  { id: 'BOS', name: 'Boston Celtics', conf: 'E', color: '#007A33' },
  { id: 'BKN', name: 'Brooklyn Nets', conf: 'E', color: '#3F3F3F' },
  { id: 'CHA', name: 'Charlotte Hornets', conf: 'E', color: '#1D1160' },
  { id: 'CHI', name: 'Chicago Bulls', conf: 'E', color: '#CE1141' },
  { id: 'CLE', name: 'Cleveland Cavaliers', conf: 'E', color: '#860038' },
  { id: 'DET', name: 'Detroit Pistons', conf: 'E', color: '#C8102E' },
  { id: 'IND', name: 'Indiana Pacers', conf: 'E', color: '#002D62' },
  { id: 'MIA', name: 'Miami Heat', conf: 'E', color: '#98002E' },
  { id: 'MIL', name: 'Milwaukee Bucks', conf: 'E', color: '#00471B' },
  { id: 'NYK', name: 'New York Knicks', conf: 'E', color: '#006BB6' },
  { id: 'ORL', name: 'Orlando Magic', conf: 'E', color: '#0077C0' },
  { id: 'PHI', name: 'Philadelphia 76ers', conf: 'E', color: '#ED174C' },
  { id: 'TOR', name: 'Toronto Raptors', conf: 'E', color: '#CE1141' },
  { id: 'WAS', name: 'Washington Wizards', conf: 'E', color: '#E31837' },
  { id: 'DAL', name: 'Dallas Mavericks', conf: 'W', color: '#00538C' },
  { id: 'DEN', name: 'Denver Nuggets', conf: 'W', color: '#0E2240' },
  { id: 'GSW', name: 'Golden State Warriors', conf: 'W', color: '#1D428A' },
  { id: 'HOU', name: 'Houston Rockets', conf: 'W', color: '#CE1141' },
  { id: 'LAC', name: 'LA Clippers', conf: 'W', color: '#C8102E' },
  { id: 'LAL', name: 'LA Lakers', conf: 'W', color: '#552583' },
  { id: 'MEM', name: 'Memphis Grizzlies', conf: 'W', color: '#5D76A9' },
  { id: 'MIN', name: 'Minnesota Timberwolves', conf: 'W', color: '#236192' },
  { id: 'NOP', name: 'New Orleans Pelicans', conf: 'W', color: '#0C2340' },
  { id: 'OKC', name: 'Oklahoma City Thunder', conf: 'W', color: '#007AC1' },
  { id: 'PHX', name: 'Phoenix Suns', conf: 'W', color: '#1D1160' },
  { id: 'POR', name: 'Portland Trail Blazers', conf: 'W', color: '#E03A3E' },
  { id: 'SAC', name: 'Sacramento Kings', conf: 'W', color: '#5A2D81' },
  { id: 'SAS', name: 'San Antonio Spurs', conf: 'W', color: '#8A8D8F' },
  { id: 'UTA', name: 'Utah Jazz', conf: 'W', color: '#002B5C' },
];

const WIZ = 'WAS';
const ROSTER_SIZE = 15;
const TOTAL_PLAYERS = TEAMS.length * ROSTER_SIZE;

const CURATED = [
  ['Michael Jordan','SG',99,'Legend'],['Kareem Abdul-Jabbar','C',97,'Legend'],['LeBron James','SF',97,'Legend'],
  ['Wilt Chamberlain','C',96,'Legend'],['Magic Johnson','PG',96,'Legend'],['Kobe Bryant','SG',96,'Legend'],
  ['Larry Bird','SF',95,'Legend'],['Shaquille O\'Neal','C',95,'Legend'],['Tim Duncan','PF',95,'Legend'],
  ['Bill Russell','C',94,'Legend'],['Hakeem Olajuwon','C',94,'Legend'],['Oscar Robertson','PG',93,'Legend'],
  ['Dirk Nowitzki','PF',93,'Legend'],['Julius Erving','SF',92,'Legend'],['Karl Malone','PF',92,'Legend'],
  ['Charles Barkley','PF',92,'Legend'],['Jerry West','SG',92,'Legend'],['David Robinson','C',92,'Legend'],
  ['Kevin Garnett','PF',92,'Legend'],['Dwyane Wade','SG',92,'Legend'],['John Stockton','PG',91,'Legend'],
  ['Scottie Pippen','SF',91,'Legend'],['Kawhi Leonard','SF',91,'Legend'],['Allen Iverson','PG',90,'Legend'],
  ['Moses Malone','C',90,'Legend'],['Elgin Baylor','SF',90,'Legend'],['Isiah Thomas','PG',90,'Legend'],
  ['Chris Paul','PG',90,'Legend'],['Patrick Ewing','C',89,'Legend'],['Clyde Drexler','SG',89,'Legend'],
  ['Steve Nash','PG',89,'Legend'],['Grant Hill','SF',85,'Legend'],['James Worthy','SF',87,'Legend'],
  ['Reggie Miller','SG',87,'Legend'],['Gary Payton','PG',88,'Legend'],['Tracy McGrady','SG',88,'Legend'],
  ['Dwight Howard','C',88,'Legend'],['George Mikan','C',88,'Legend'],['Dominique Wilkins','SF',88,'Legend'],
  ['Jason Kidd','PG',87,'Legend'],['Manu Ginobili','SG',86,'Legend'],['Tony Parker','PG',87,'Legend'],
  ['Pau Gasol','PF',87,'Legend'],['Paul Pierce','SF',87,'Legend'],['Ray Allen','SG',88,'Legend'],
  ['Chris Bosh','PF',87,'Legend'],['Carmelo Anthony','SF',87,'Legend'],['Bob Cousy','PG',87,'Legend'],
  ['Willis Reed','C',86,'Legend'],['Vince Carter','SG',86,'Legend'],['Chris Webber','PF',86,'Legend'],
  ['Yao Ming','C',85,'Legend'],['Amar\'e Stoudemire','PF',85,'Legend'],['Ben Wallace','C',83,'Legend'],
  ['Rasheed Wallace','PF',83,'Legend'],['Chauncey Billups','PG',84,'Legend'],['Deron Williams','PG',84,'Legend'],
  ['Nikola Jokic','C',98,'Star'],['Giannis Antetokounmpo','PF',97,'Star'],['Luka Doncic','PG',96,'Star'],
  ['Shai Gilgeous-Alexander','PG',96,'Star'],['Stephen Curry','PG',95,'Star'],['Kevin Durant','SF',95,'Star'],
  ['Jayson Tatum','SF',94,'Star'],['Victor Wembanyama','C',94,'Star'],['Joel Embiid','C',93,'Star'],
  ['Anthony Davis','PF',92,'Star'],['Anthony Edwards','SG',92,'Star'],['Devin Booker','SG',91,'Star'],
  ['Damian Lillard','PG',91,'Star'],['Kyrie Irving','PG',90,'Star'],['Jimmy Butler','SF',90,'Star'],
  ['James Harden','PG',90,'Star'],['Donovan Mitchell','SG',90,'Star'],['Jalen Brunson','PG',89,'Star'],
  ['Tyrese Haliburton','PG',89,'Star'],['Ja Morant','PG',89,'Star'],['Jaylen Brown','SF',89,'Star'],
  ['Domantas Sabonis','C',88,'Star'],['Karl-Anthony Towns','C',88,'Star'],['De\'Aaron Fox','PG',88,'Star'],
  ['Paolo Banchero','PF',88,'Star'],['Cade Cunningham','PG',88,'Star'],['Trae Young','PG',88,'Star'],
  ['Alperen Sengun','C',87,'Star'],['Chet Holmgren','C',87,'Star'],['Evan Mobley','PF',87,'Star'],
  ['Bam Adebayo','C',87,'Star'],['Zion Williamson','PF',87,'Star'],['Pascal Siakam','PF',87,'Star'],
  ['LaMelo Ball','PG',87,'Star'],['Scottie Barnes','SF',86,'Star'],['Franz Wagner','SF',86,'Star'],
  ['Desmond Bane','SG',86,'Star'],['Brandon Ingram','SF',86,'Star'],['Rudy Gobert','C',86,'Star'],
  ['Jaren Jackson Jr.','PF',85,'Star'],['Kristaps Porzingis','PF',85,'Star'],['Zach LaVine','SG',85,'Star'],
  ['DeMar DeRozan','SF',85,'Star'],['Julius Randle','PF',84,'Star'],['Mikal Bridges','SF',84,'Star'],
  ['OG Anunoby','SF',84,'Star'],['Jrue Holiday','PG',84,'Star'],['Klay Thompson','SG',83,'Star'],
  ['Draymond Green','PF',82,'Star'],['Fred VanVleet','PG',83,'Star'],['Amen Thompson','SF',83,'Star'],
  ['Jalen Williams','SF',86,'Star'],['Tyrese Maxey','PG',86,'Star'],['Deni Avdija','SF',82,'Star'],
  ['Bradley Beal','SG',84,'Star'],['Kyle Kuzma','SF',80,'Star'],['Jordan Poole','SG',79,'Star'],
  ['Alex Sarr','C',78,'Star'],['Bilal Coulibaly','SF',78,'Star'],['Tyus Jones','PG',78,'Star'],
  ['Cam Whitmore','SF',80,'Star'],['Jalen Duren','C',81,'Star'],['Keegan Murray','SF',80,'Star'],
];

const POSITIONS = ['PG','SG','SF','PF','C'];

// Second wave: real role players, veterans, retro stars and recent draftees.
// Tagged "Veteran" — these fill out the back of every roster with real, recognizable names.
const CURATED_2 = [
  ['Kevin Love','PF',82,'Veteran'],['DeMarcus Cousins','C',84,'Veteran'],['Marcus Smart','PG',80,'Veteran'],
  ['J.R. Smith','SG',78,'Veteran'],['Seth Curry','SG',78,'Veteran'],['Al Horford','C',83,'Veteran'],
  ['Nikola Vucevic','C',83,'Veteran'],['Clint Capela','C',80,'Veteran'],['Jonas Valanciunas','C',79,'Veteran'],
  ['Myles Turner','C',82,'Veteran'],['Brook Lopez','C',81,'Veteran'],['Robin Lopez','C',73,'Veteran'],
  ['Andre Drummond','C',79,'Veteran'],['Steven Adams','C',79,'Veteran'],['Mason Plumlee','C',74,'Veteran'],
  ['Serge Ibaka','PF',79,'Veteran'],['Marc Gasol','C',85,'Veteran'],['Nikola Mirotic','PF',77,'Veteran'],
  ['Danilo Gallinari','PF',80,'Veteran'],['Aaron Gordon','PF',83,'Veteran'],['Harrison Barnes','SF',79,'Veteran'],
  ['Otto Porter Jr.','SF',78,'Veteran'],['Jerami Grant','PF',82,'Veteran'],['Tobias Harris','PF',82,'Veteran'],
  ['P.J. Tucker','PF',75,'Veteran'],['Marcus Morris','PF',77,'Veteran'],['Markieff Morris','PF',75,'Veteran'],
  ['Taj Gibson','PF',73,'Veteran'],['Thaddeus Young','PF',76,'Veteran'],['Nerlens Noel','C',73,'Veteran'],
  ['JaVale McGee','C',75,'Veteran'],['Montrezl Harrell','C',78,'Veteran'],['Christian Wood','PF',79,'Veteran'],
  ['Kelly Olynyk','C',76,'Veteran'],['Nikola Jovic','PF',76,'Veteran'],['Bobby Portis','PF',80,'Veteran'],
  ['John Collins','PF',80,'Veteran'],['De\'Andre Hunter','SF',78,'Veteran'],['Cam Johnson','SF',80,'Veteran'],
  ['Grayson Allen','SG',79,'Veteran'],['Duncan Robinson','SG',78,'Veteran'],['Max Strus','SG',76,'Veteran'],
  ['Caleb Martin','SF',77,'Veteran'],['Naz Reid','C',79,'Veteran'],['Jaden McDaniels','SF',80,'Veteran'],
  ['Malcolm Brogdon','PG',81,'Veteran'],['Spencer Dinwiddie','PG',79,'Veteran'],['Cameron Payne','PG',75,'Veteran'],
  ['Dennis Schroder','PG',80,'Veteran'],['Kemba Walker','PG',82,'Veteran'],['D\'Angelo Russell','PG',82,'Veteran'],
  ['Buddy Hield','SG',80,'Veteran'],['C.J. McCollum','SG',84,'Veteran'],['Norman Powell','SG',80,'Veteran'],
  ['Terry Rozier','PG',80,'Veteran'],['Eric Gordon','SG',79,'Veteran'],['Lou Williams','SG',80,'Veteran'],
  ['Jamal Crawford','SG',79,'Veteran'],['Nick Young','SG',75,'Veteran'],['J.J. Redick','SG',78,'Veteran'],
  ['Kyle Korver','SG',78,'Veteran'],['Danny Green','SG',78,'Veteran'],['P.J. Washington','PF',79,'Veteran'],
  ['Bogdan Bogdanovic','SG',80,'Veteran'],['Bojan Bogdanovic','SF',80,'Veteran'],['Josh Hart','SG',80,'Veteran'],
  ['Immanuel Quickley','PG',80,'Veteran'],['R.J. Barrett','SG',81,'Veteran'],['Jordan Clarkson','SG',79,'Veteran'],
  ['Collin Sexton','PG',78,'Veteran'],['Malik Monk','SG',79,'Veteran'],['Josh Giddey','PG',80,'Veteran'],
  ['Anfernee Simons','SG',81,'Veteran'],['Coby White','PG',80,'Veteran'],['Ayo Dosunmu','SG',76,'Veteran'],
  ['Jose Alvarado','PG',74,'Veteran'],['Payton Pritchard','PG',78,'Veteran'],['Derrick White','PG',82,'Veteran'],
  ['Marcus Sasser','PG',73,'Veteran'],['Tre Jones','PG',75,'Veteran'],['Monte Morris','PG',76,'Veteran'],
  ['Delon Wright','PG',75,'Veteran'],['Patrick Beverley','PG',76,'Veteran'],['Avery Bradley','SG',75,'Veteran'],
  ['Dennis Smith Jr.','PG',73,'Veteran'],['Frank Ntilikina','PG',70,'Veteran'],['Elfrid Payton','PG',73,'Veteran'],
  ['D.J. Augustin','PG',75,'Veteran'],['Goran Dragic','PG',82,'Veteran'],['Ricky Rubio','PG',79,'Veteran'],
  ['George Hill','PG',77,'Veteran'],['Jose Calderon','PG',75,'Veteran'],['Rajon Rondo','PG',82,'Veteran'],
  ['Kyle Lowry','PG',85,'Veteran'],['Mike Conley','PG',85,'Veteran'],['Ish Smith','PG',72,'Veteran'],
  ['Cory Joseph','PG',73,'Veteran'],['Raul Neto','PG',68,'Veteran'],
  ['Michael Porter Jr.','SF',81,'Veteran'],['Miles Bridges','SF',80,'Veteran'],['Terrence Ross','SG',77,'Veteran'],
  ['Rui Hachimura','PF',78,'Veteran'],['Herbert Jones','SF',78,'Veteran'],['Trey Murphy III','SF',79,'Veteran'],
  ['Dillon Brooks','SF',78,'Veteran'],['Luguentz Dort','SG',78,'Veteran'],['Robert Covington','PF',76,'Veteran'],
  ['Torrey Craig','SF',72,'Veteran'],['Kyle Anderson','SF',76,'Veteran'],['Nicolas Batum','SF',78,'Veteran'],
  ['Trevor Ariza','SF',77,'Veteran'],['Andre Iguodala','SF',82,'Veteran'],['Shane Battier','SF',78,'Veteran'],
  ['Bruce Bowen','SF',76,'Veteran'],['Josh Smith','PF',80,'Veteran'],['Rashard Lewis','SF',81,'Veteran'],
  ['Al Harrington','PF',77,'Veteran'],['Antawn Jamison','PF',82,'Veteran'],['Shawn Marion','SF',85,'Veteran'],
  ['Boris Diaw','PF',77,'Veteran'],['Luol Deng','SF',80,'Veteran'],['Josh Childress','SF',74,'Veteran'],
  ['Metta World Peace','SF',80,'Veteran'],['Lamar Odom','PF',83,'Veteran'],['Jared Dudley','SF',73,'Veteran'],
  ['Kenneth Faried','PF',76,'Veteran'],['Ed Davis','PF',73,'Veteran'],
  ['Enes Kanter','C',77,'Veteran'],['Deandre Ayton','C',81,'Veteran'],['Wendell Carter Jr.','C',78,'Veteran'],
  ['Daniel Gafford','C',77,'Veteran'],['Jusuf Nurkic','C',79,'Veteran'],['Ivica Zubac','C',80,'Veteran'],
  ['Walker Kessler','C',79,'Veteran'],['Isaiah Hartenstein','C',79,'Veteran'],['Mitchell Robinson','C',78,'Veteran'],
  ['Jarrett Allen','C',82,'Veteran'],['Jakob Poeltl','C',79,'Veteran'],['Onyeka Okongwu','C',79,'Veteran'],
  ['Nick Richards','C',74,'Veteran'],['Dwight Powell','C',72,'Veteran'],['Mo Bamba','C',73,'Veteran'],
  ['Moses Brown','C',70,'Veteran'],['Dewayne Dedmon','C',71,'Veteran'],['Meyers Leonard','C',70,'Veteran'],
  ['Baron Davis','PG',85,'Veteran'],['Stephon Marbury','PG',84,'Veteran'],['Jason Terry','SG',80,'Veteran'],
  ['Antoine Walker','PF',82,'Veteran'],['Glen Rice','SF',83,'Veteran'],['Mitch Richmond','SG',85,'Veteran'],
  ['Latrell Sprewell','SG',84,'Veteran'],['Nick Van Exel','PG',81,'Veteran'],['Sam Cassell','PG',82,'Veteran'],
  ['Doug Christie','SG',76,'Veteran'],['Michael Finley','SG',82,'Veteran'],['Peja Stojakovic','SF',83,'Veteran'],
  ['Andrei Kirilenko','PF',82,'Veteran'],['Zydrunas Ilgauskas','C',79,'Veteran'],['Eddy Curry','C',75,'Veteran'],
  ['Tyson Chandler','C',81,'Veteran'],['Elton Brand','PF',82,'Veteran'],['Corey Maggette','SF',76,'Veteran'],
  ['Steve Francis','PG',83,'Veteran'],['Cuttino Mobley','SG',78,'Veteran'],['Jermaine O\'Neal','PF',84,'Veteran'],
  ['Antonio Davis','PF',76,'Veteran'],['Theo Ratliff','C',74,'Veteran'],['Anfernee Hardaway','SG',87,'Veteran'],
  ['Horace Grant','PF',80,'Veteran'],['Toni Kukoc','SF',82,'Veteran'],['Dennis Rodman','PF',87,'Veteran'],
  ['Robert Horry','PF',78,'Veteran'],['Derek Fisher','PG',76,'Veteran'],['Rick Fox','SF',75,'Veteran'],
  ['Brian Shaw','PG',73,'Veteran'],['Byron Scott','SG',76,'Veteran'],['A.C. Green','PF',77,'Veteran'],
  ['Vlade Divac','C',83,'Veteran'],['Sam Perkins','PF',78,'Veteran'],['Dale Ellis','SG',79,'Veteran'],
  ['Terry Cummings','PF',81,'Veteran'],['Xavier McDaniel','SF',80,'Veteran'],['Alex English','SF',86,'Veteran'],
  ['Bernard King','SF',86,'Veteran'],['Adrian Dantley','SF',86,'Veteran'],['World B. Free','SG',80,'Veteran'],
  ['George Gervin','SG',89,'Veteran'],['Artis Gilmore','C',85,'Veteran'],['Dan Issel','C',83,'Veteran'],
  ['Bob McAdoo','PF',85,'Veteran'],['Nate Archibald','PG',84,'Veteran'],['Walt Frazier','PG',87,'Veteran'],
  ['Earl Monroe','SG',85,'Veteran'],['Pete Maravich','PG',86,'Veteran'],['Rick Barry','SF',88,'Veteran'],
  ['Connie Hawkins','SF',82,'Veteran'],['Dave Cowens','C',85,'Veteran'],['Wes Unseld','C',83,'Veteran'],
  ['Elvin Hayes','PF',85,'Veteran'],['Nate Thurmond','C',83,'Veteran'],['Dave DeBusschere','PF',82,'Veteran'],
  ['Jo Jo White','SG',80,'Veteran'],['Gus Williams','PG',80,'Veteran'],['Marques Johnson','SF',81,'Veteran'],
  ['Sidney Moncrief','SG',82,'Veteran'],
  ['Malik Beasley','SG',77,'Veteran'],['Gary Trent Jr.','SG',78,'Veteran'],['Kevon Looney','C',73,'Veteran'],
  ['Andrew Wiggins','SF',80,'Veteran'],['Jonathan Kuminga','PF',79,'Veteran'],['Moses Moody','SG',75,'Veteran'],
  ['Trayce Jackson-Davis','C',75,'Veteran'],['Jaime Jaquez Jr.','SF',77,'Veteran'],['Ochai Agbaji','SG',73,'Veteran'],
  ['Dyson Daniels','SG',79,'Veteran'],['Jabari Smith Jr.','PF',78,'Veteran'],['Keyonte George','PG',76,'Veteran'],
  ['Taylor Hendricks','PF',73,'Veteran'],['Brandin Podziemski','SG',78,'Veteran'],['Toumani Camara','PF',76,'Veteran'],
  ['G.G. Jackson','PF',74,'Veteran'],
  ['Marvin Bagley III','PF',75,'Veteran'],['Cole Anthony','PG',76,'Veteran'],['Jalen Suggs','PG',79,'Veteran'],
  ['Killian Hayes','PG',68,'Veteran'],['Ziaire Williams','SF',73,'Veteran'],['Isaiah Jackson','C',73,'Veteran'],
  ['Kai Jones','C',68,'Veteran'],['Davion Mitchell','PG',75,'Veteran'],['Chris Duarte','SG',73,'Veteran'],
  ['Corey Kispert','SF',76,'Veteran'],['Josh Christopher','SG',68,'Veteran'],['Jalen Johnson','PF',81,'Veteran'],
  ['Jaden Springer','SG',68,'Veteran'],['Usman Garuba','PF',66,'Veteran'],['Jared Butler','PG',68,'Veteran'],
  ['Neemias Queta','C',73,'Veteran'],['Sandro Mamukelashvili','PF',68,'Veteran'],['Day\'Ron Sharpe','C',70,'Veteran'],
  ['Yves Missi','C',75,'Veteran'],['Zaccharie Risacher','SF',76,'Veteran'],['Reed Sheppard','PG',75,'Veteran'],
  ['Stephon Castle','SG',78,'Veteran'],['Ron Holland','SF',75,'Veteran'],['Matas Buzelis','PF',76,'Veteran'],
  ['Zach Edey','C',77,'Veteran'],['Donovan Clingan','C',77,'Veteran'],['Rob Dillingham','PG',73,'Veteran'],
  ['Bub Carrington','PG',72,'Veteran'],['Kel\'el Ware','C',75,'Veteran'],['Dalton Knecht','SG',76,'Veteran'],
  ['Tristan Da Silva','SF',73,'Veteran'],['Jaylen Wells','SF',74,'Veteran'],['Isaiah Collier','PG',72,'Veteran'],
  ['Dejounte Murray','PG',82,'Veteran'],['Kentavious Caldwell-Pope','SG',78,'Veteran'],['Kris Dunn','PG',75,'Veteran'],
  ['Lonzo Ball','PG',78,'Veteran'],['Josh Okogie','SG',72,'Veteran'],['Wendell Moore Jr.','SG',68,'Veteran'],
  ['Jaden Ivey','SG',78,'Veteran'],['Bennedict Mathurin','SG',79,'Veteran'],['Andrew Nembhard','PG',77,'Veteran'],
  ['Aaron Nesmith','SF',77,'Veteran'],['Isaiah Stewart','C',78,'Veteran'],['Saddiq Bey','SF',77,'Veteran'],
  ['Precious Achiuwa','PF',75,'Veteran'],['Obi Toppin','PF',77,'Veteran'],['Tyrese Martin','SG',68,'Veteran'],
  ['Jalen Wilson','SF',70,'Veteran'],['Jaylin Williams','PF',70,'Veteran'],['Kenneth Lofton Jr.','PF',69,'Veteran'],
  ['Ausar Thompson','SF',80,'Veteran'],['Cason Wallace','PG',77,'Veteran'],['Gradey Dick','SG',76,'Veteran'],
  ['Jett Howard','SG',68,'Veteran'],['Brice Sensabaugh','SF',68,'Veteran'],['Kobe Bufkin','PG',67,'Veteran'],
  ['Jarace Walker','PF',73,'Veteran'],['Anthony Black','PG',73,'Veteran'],
  ['Nate Robinson','PG',77,'Veteran'],['Earl Boykins','PG',72,'Veteran'],['Jameer Nelson','PG',77,'Veteran'],
  ['Devin Harris','PG',78,'Veteran'],['Jarrett Jack','PG',75,'Veteran'],['Aaron Brooks','PG',73,'Veteran'],
  ['Ramon Sessions','PG',74,'Veteran'],['Darren Collison','PG',76,'Veteran'],['Brandon Jennings','PG',77,'Veteran'],
  ['Isaiah Thomas','PG',85,'Veteran'],['Evan Turner','SG',75,'Veteran'],['Michael Carter-Williams','PG',73,'Veteran'],
  ['Dion Waiters','SG',75,'Veteran'],['Iman Shumpert','SG',74,'Veteran'],['Jimmer Fredette','PG',72,'Veteran'],
  ['Solomon Hill','SF',70,'Veteran'],['Justise Winslow','SF',75,'Veteran'],['Stanley Johnson','SF',72,'Veteran'],
  ['Kelly Oubre Jr.','SF',78,'Veteran'],['Skal Labissiere','C',70,'Veteran'],['Thon Maker','C',68,'Veteran'],
  ['Jarrett Culver','SG',70,'Veteran'],['Cam Reddish','SF',72,'Veteran'],['Tyler Herro','SG',83,'Veteran'],
  ['Nickeil Alexander-Walker','SG',76,'Veteran'],['Jalen McDaniels','PF',74,'Veteran'],
  ['Rudy Gay','SF',82,'Veteran'],['Danny Granger','SF',81,'Veteran'],['Josh Howard','SF',79,'Veteran'],
  ['Caron Butler','SF',81,'Veteran'],['Andre Miller','PG',80,'Veteran'],['Jason Richardson','SG',80,'Veteran'],
  ['Richard Jefferson','SF',78,'Veteran'],['Kirk Hinrich','PG',76,'Veteran'],['Ben Gordon','SG',79,'Veteran'],
  ['Joakim Noah','C',81,'Veteran'],['Carlos Boozer','PF',82,'Veteran'],['Zach Randolph','PF',83,'Veteran'],
  ['Emeka Okafor','C',77,'Veteran'],['Chris Kaman','C',77,'Veteran'],['David Lee','PF',80,'Veteran'],
  ['Al Jefferson','C',81,'Veteran'],['LaMarcus Aldridge','PF',87,'Veteran'],['Blake Griffin','PF',87,'Veteran'],
  ['DeAndre Jordan','C',82,'Veteran'],['Paul Millsap','PF',85,'Veteran'],['Nikola Pekovic','C',75,'Veteran'],
  ['Roy Hibbert','C',80,'Veteran'],['David West','PF',81,'Veteran'],['Paul George','SF',90,'Veteran'],
  ['Victor Oladipo','SG',82,'Veteran'],['Ben Simmons','PG',80,'Veteran'],['Markelle Fultz','PG',73,'Veteran'],
  ['Marvin Williams','PF',75,'Veteran'],['Gordon Hayward','SF',82,'Veteran'],['Andre Roberson','SF',73,'Veteran'],
  ['Derrick Rose','PG',88,'Veteran'],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePool() {
  const combined = [
    ...CURATED.map(c => ({ name: c[0], pos: c[1], ovr: c[2], tag: c[3] })),
    ...CURATED_2.map(c => ({ name: c[0], pos: c[1], ovr: c[2], tag: c[3] })),
  ];
  const seen = new Set();
  const deduped = [];
  combined.forEach(p => {
    const key = p.name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deduped.push(p); }
  });
  const pool = deduped.slice(0, TOTAL_PLAYERS).map((p, i) => ({ id: 'p' + i, ...p }));
  return pool;
}

function randomContract() {
  const r = Math.random();
  if (r < 0.12) return 1;
  if (r < 0.42) return 2;
  if (r < 0.76) return 3;
  return 4;
}

function buildSnakeOrder(teamIds, rounds) {
  const order = [];
  for (let r = 0; r < rounds; r++) {
    order.push(...(r % 2 === 0 ? teamIds : [...teamIds].reverse()));
  }
  return order;
}

function weightedPickFromTop(list, n = 6) {
  const top = list.slice(0, n);
  const weights = top.map((_, idx) => n - idx);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i];
  }
  return top[top.length - 1];
}

function teamRating(roster) {
  if (!roster.length) return 50;
  const sorted = [...roster].sort((a, b) => b.ovr - a.ovr);
  const top9 = sorted.slice(0, 9);
  const weights = [1.3, 1.25, 1.2, 1.1, 1.0, 0.8, 0.7, 0.6, 0.5];
  let sum = 0, wsum = 0;
  top9.forEach((p, i) => { sum += p.ovr * (weights[i] || 0.4); wsum += (weights[i] || 0.4); });
  return sum / wsum;
}

function simGame(ratingHome, ratingAway) {
  const h = ratingHome + 2 + (Math.random() - 0.5) * 12;
  const a = ratingAway + (Math.random() - 0.5) * 12;
  const probHome = 1 / (1 + Math.pow(10, (a - h) / 12));
  return Math.random() < probHome;
}

function simSeries(teamA, teamB, ratings) {
  let winsA = 0, winsB = 0, g = 0;
  while (winsA < 4 && winsB < 4) {
    const homeA = g % 2 === 0;
    const aWin = simGame(ratings[teamA.teamId] + (homeA ? 1.5 : 0), ratings[teamB.teamId] + (!homeA ? 1.5 : 0));
    if (aWin) winsA++; else winsB++;
    g++;
  }
  return winsA > winsB ? teamA : teamB;
}

function teamById(id) { return TEAMS.find(t => t.id === id); }

function ovrTier(ovr) {
  if (ovr >= 92) return { color: '#D4AF37', label: 'Elite' };
  if (ovr >= 84) return { color: '#C4CED4', label: 'Star' };
  if (ovr >= 75) return { color: '#7FB3D5', label: 'Solid' };
  return { color: '#6B7280', label: 'Depth' };
}

/* ============================== UI PIECES ============================== */

const displayFont = { fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' };
const monoFont = { fontFamily: "'SF Mono', Consolas, monospace" };

function OvrBadge({ ovr, size = 34 }) {
  const tier = ovrTier(ovr);
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, background: tier.color, color: '#0B1220',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42,
      ...monoFont, fontWeight: 700, flexShrink: 0,
    }}>{ovr}</div>
  );
}

function PlayerRow({ player, right, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}`}
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <OvrBadge ovr={player.ovr} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{player.name}</div>
        <div className="text-xs text-slate-400" style={monoFont}>{player.pos} {player.tag ? `· ${player.tag}` : ''}</div>
      </div>
      {right}
    </div>
  );
}

function TeamBadge({ team, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, background: team.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      fontSize: size * 0.32, flexShrink: 0, ...monoFont, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)',
    }}>{team.id}</div>
  );
}

/* ============================== SCREENS ============================== */

function IntroScreen({ onStart }) {
  return (
    <div className="max-w-md mx-auto px-5 py-10 text-center">
      <div className="mx-auto mb-6 flex items-center justify-center" style={{ width: 84, height: 84, borderRadius: 12, background: '#E31837' }}>
        <Shield color="#fff" size={44} />
      </div>
      <h1 style={{ ...displayFont, fontSize: 28, color: '#fff' }}>Wizards GM</h1>
      <p className="text-slate-400 mt-2 text-sm">All-time draft. 30 teams. 15-man rosters. You run Washington — I run the league.</p>
      <div className="mt-8 text-left space-y-3">
        {[
          ['1', 'All-time draft', `${TOTAL_PLAYERS} players, legends and current stars, snake-drafted across 15 rounds.`],
          ['2', 'You pick for Washington', 'Every other GM auto-drafts based on player rating.'],
          ['3', 'Simulate the season', 'Ratings drive every game, seeding the playoffs and crowning an MVP.'],
          ['4', 'Contracts expire', 'When a deal runs out, that player re-enters the draft the next offseason.'],
        ].map(([n, t, d]) => (
          <div key={n} className="flex gap-3 items-start">
            <div style={{ ...monoFont }} className="text-xs text-red-400 mt-1">{n}</div>
            <div>
              <div className="text-white text-sm font-semibold">{t}</div>
              <div className="text-slate-500 text-xs">{d}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onStart} className="mt-9 w-full py-3 rounded-lg text-white font-bold" style={{ background: '#E31837', ...displayFont, letterSpacing: '0.08em' }}>
        Start Draft
      </button>
    </div>
  );
}

function DraftScreen({ draftOrder, picks, availablePlayers, rostersByTeam, onDraft, seasonYear }) {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const currentTeamId = draftOrder[picks.length];
  const currentTeam = currentTeamId ? teamById(currentTeamId) : null;
  const isUserTurn = currentTeamId === WIZ;
  const total = draftOrder.length;

  const filtered = useMemo(() => {
    return availablePlayers.filter(p =>
      (posFilter === 'ALL' || p.pos === posFilter) &&
      (search.trim() === '' || p.name.toLowerCase().includes(search.trim().toLowerCase()))
    ).slice(0, 60);
  }, [availablePlayers, search, posFilter]);

  const recentPicks = picks.slice(-6).reverse();
  const wizRoster = rostersByTeam[WIZ] || [];

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <div style={{ ...displayFont, fontSize: 18, color: '#fff' }}>Draft — {seasonYear}</div>
        <div className="text-xs text-slate-400" style={monoFont}>{picks.length}/{total}</div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/10 mb-5 overflow-hidden">
        <div className="h-full" style={{ width: `${(picks.length / total) * 100}%`, background: '#E31837', transition: 'width 0.2s' }} />
      </div>

      {currentTeam && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ background: isUserTurn ? 'rgba(227,24,55,0.18)' : 'rgba(255,255,255,0.05)', border: isUserTurn ? '1px solid #E31837' : '1px solid rgba(255,255,255,0.08)' }}>
          <TeamBadge team={currentTeam} size={36} />
          <div className="flex-1">
            <div className="text-xs text-slate-400" style={monoFont}>ON THE CLOCK</div>
            <div className="text-white font-bold text-sm">{currentTeam.name}</div>
          </div>
          {isUserTurn && <div className="text-xs text-red-300 font-bold animate-pulse" style={displayFont}>Your Pick</div>}
        </div>
      )}

      {isUserTurn ? (
        <div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <Search size={14} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players"
                className="bg-transparent outline-none text-sm text-white flex-1 placeholder:text-slate-500" />
            </div>
          </div>
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {['ALL', ...POSITIONS].map(p => (
              <button key={p} onClick={() => setPosFilter(p)}
                className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ background: posFilter === p ? '#E31837' : 'rgba(255,255,255,0.06)', color: '#fff', ...monoFont }}>
                {p}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filtered.map(p => (
              <PlayerRow key={p.id} player={p} onClick={() => onDraft(p.id)}
                right={<ChevronRight size={16} className="text-slate-500" />} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-slate-500 mb-2" style={displayFont}>Recent Picks</div>
          <div className="space-y-1.5">
            <RecentPicksList picks={recentPicks} />
          </div>
          <div className="text-xs text-slate-500 mt-6 mb-2" style={displayFont}>Your Roster So Far ({wizRoster.length}/{ROSTER_SIZE})</div>
          <div className="space-y-1.5">
            {wizRoster.map(p => <PlayerRow key={p.id} player={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentPicksList({ picks }) {
  // picks here already contain playerId/teamId; we need player objects -- resolved by parent via context is overkill,
  // so this component expects picks enriched already.
  return picks.map((pk, i) => (
    <div key={i} className="flex items-center gap-2 text-xs text-slate-400 px-1">
      <TeamBadge team={teamById(pk.teamId)} size={20} />
      <span className="text-white">{pk.playerName}</span>
      <span style={monoFont}>{pk.playerOvr}</span>
    </div>
  ));
}

function RostersScreen({ rostersByTeam, onSimulate }) {
  const [openTeam, setOpenTeam] = useState(WIZ);
  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div style={{ ...displayFont, fontSize: 18, color: '#fff' }} className="mb-1">Rosters Set</div>
      <p className="text-slate-500 text-xs mb-4">Tap a team to view its 15-man roster.</p>
      <div className="grid grid-cols-6 gap-1.5 mb-4">
        {TEAMS.map(t => (
          <button key={t.id} onClick={() => setOpenTeam(t.id)}>
            <TeamBadge team={t} size={t.id === openTeam ? 34 : 28} />
          </button>
        ))}
      </div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 mb-6">
        {(rostersByTeam[openTeam] || []).map(p => (
          <PlayerRow key={p.id} player={p} right={<span className="text-xs text-slate-500" style={monoFont}>{p.contractYears}yr</span>} />
        ))}
      </div>
      <button onClick={onSimulate} className="w-full py-3 rounded-lg text-white font-bold" style={{ background: '#E31837', ...displayFont, letterSpacing: '0.08em' }}>
        Simulate Season
      </button>
    </div>
  );
}

function SeasonScreen({ standings, awards, rostersByTeam, seasonYear, history, onAdvance }) {
  const east = standings.filter(s => s.conf === 'E').sort((a, b) => b.winPct - a.winPct);
  const west = standings.filter(s => s.conf === 'W').sort((a, b) => b.winPct - a.winPct);
  const wiz = standings.find(s => s.teamId === WIZ);
  const wizSeedE = east.findIndex(s => s.teamId === WIZ) + 1;

  const ConfTable = ({ list, label }) => (
    <div className="mb-5">
      <div className="text-xs text-slate-500 mb-2" style={displayFont}>{label}</div>
      <div className="space-y-1">
        {list.map((s, i) => {
          const t = teamById(s.teamId);
          return (
            <div key={s.teamId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: s.teamId === WIZ ? 'rgba(227,24,55,0.15)' : i < 8 ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
              <span className="text-xs w-4 text-slate-500" style={monoFont}>{i + 1}</span>
              <TeamBadge team={t} size={22} />
              <span className="text-white text-xs flex-1 truncate">{t.name}</span>
              <span className="text-xs text-slate-400" style={monoFont}>{s.wins}-{s.losses}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <div style={{ ...displayFont, fontSize: 18, color: '#fff' }} className="mb-4">{seasonYear} Season Results</div>

      <div className="rounded-xl p-4 mb-5 text-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)' }}>
        <Trophy className="mx-auto mb-2" color="#D4AF37" size={28} />
        <div className="text-xs text-slate-400" style={displayFont}>NBA Champion</div>
        <div className="text-white font-bold text-lg">{teamById(awards.champion).name}</div>
        <div className="text-xs text-slate-400 mt-1">Finals MVP: {awards.finalsMVP?.name}</div>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Star size={16} color="#D4AF37" />
          <span className="text-xs text-slate-400" style={displayFont}>Most Valuable Player</span>
        </div>
        <div className="flex items-center gap-3">
          <OvrBadge ovr={awards.mvp.player.ovr} size={40} />
          <div>
            <div className="text-white font-bold text-sm">{awards.mvp.player.name}</div>
            <div className="text-xs text-slate-400" style={monoFont}>{teamById(awards.mvp.teamId).name}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} color="#C4CED4" />
          <span className="text-xs text-slate-400" style={displayFont}>All-NBA First Team</span>
        </div>
        <div className="space-y-1.5">
          {awards.allNBA.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <OvrBadge ovr={a.player.ovr} size={26} />
              <span className="text-white text-xs flex-1">{a.player.name}</span>
              <span className="text-xs text-slate-500" style={monoFont}>{teamById(a.teamId).id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: wiz && wiz.wins > wiz.losses ? 'rgba(227,24,55,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(227,24,55,0.3)' }}>
        <div className="text-xs text-slate-400 mb-1" style={displayFont}>Washington Wizards Recap</div>
        <div className="text-white text-sm">
          Finished <span style={monoFont}>{wiz.wins}-{wiz.losses}</span>, {wizSeedE > 0 && wizSeedE <= 8 ? `${wizSeedE} seed in the East — made the playoffs.` : `${wizSeedE > 8 ? wizSeedE + ' seed, missed the playoffs.' : ''}`}
        </div>
      </div>

      <ConfTable list={east} label="Eastern Conference" />
      <ConfTable list={west} label="Western Conference" />

      {history.length > 1 && (
        <div className="mb-5">
          <div className="text-xs text-slate-500 mb-2" style={displayFont}>Franchise History</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="text-xs text-slate-400 flex justify-between">
                <span style={monoFont}>{h.year}</span>
                <span>{teamById(h.champion).name} · MVP {h.mvp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onAdvance} className="w-full py-3 rounded-lg text-white font-bold" style={{ background: '#E31837', ...displayFont, letterSpacing: '0.08em' }}>
        Advance to Next Season
      </button>
    </div>
  );
}

/* ============================== APP ============================== */

export default function App() {
  const [players] = useState(() => generatePool());
  const [screen, setScreen] = useState('intro');
  const [draftOrder, setDraftOrder] = useState([]);
  const [picks, setPicks] = useState([]); // {playerId, teamId, contractYears}
  const [seasonYear, setSeasonYear] = useState(2026);
  const [standings, setStandings] = useState(null);
  const [awards, setAwards] = useState(null);
  const [history, setHistory] = useState([]);

  const availablePlayers = useMemo(() => {
    const draftedIds = new Set(picks.map(p => p.playerId));
    return players.filter(p => !draftedIds.has(p.id)).sort((a, b) => b.ovr - a.ovr);
  }, [players, picks]);

  const rostersByTeam = useMemo(() => {
    const map = {};
    TEAMS.forEach(t => map[t.id] = []);
    picks.forEach(p => {
      const pl = players.find(x => x.id === p.playerId);
      if (pl) map[p.teamId].push({ ...pl, contractYears: p.contractYears });
    });
    Object.values(map).forEach(list => list.sort((a, b) => b.ovr - a.ovr));
    return map;
  }, [picks, players]);

  const enrichedPicks = useMemo(() => {
    return picks.map(p => {
      const pl = players.find(x => x.id === p.playerId);
      return { ...p, playerName: pl ? pl.name : '', playerOvr: pl ? pl.ovr : 0 };
    });
  }, [picks, players]);

  const makeCpuPick = useCallback(() => {
    setPicks(prev => {
      const draftedIds = new Set(prev.map(p => p.playerId));
      const avail = players.filter(p => !draftedIds.has(p.id)).sort((a, b) => b.ovr - a.ovr);
      if (avail.length === 0 || prev.length >= draftOrder.length) return prev;
      const teamId = draftOrder[prev.length];
      const chosen = weightedPickFromTop(avail, 6);
      return [...prev, { playerId: chosen.id, teamId, contractYears: randomContract() }];
    });
  }, [players, draftOrder]);

  const draftPlayer = (playerId) => {
    setPicks(prev => {
      if (draftOrder[prev.length] !== WIZ) return prev;
      return [...prev, { playerId, teamId: WIZ, contractYears: randomContract() }];
    });
  };

  useEffect(() => {
    if (screen !== 'draft' || draftOrder.length === 0) return;
    if (picks.length >= draftOrder.length) {
      const t = setTimeout(() => setScreen('rosters'), 500);
      return () => clearTimeout(t);
    }
    const currentTeam = draftOrder[picks.length];
    if (currentTeam === WIZ) return;
    const t = setTimeout(makeCpuPick, 35);
    return () => clearTimeout(t);
  }, [screen, picks, draftOrder, makeCpuPick]);

  const startDraft = () => {
    const order = buildSnakeOrder(shuffle(TEAMS.map(t => t.id)), ROSTER_SIZE);
    setDraftOrder(order);
    setPicks([]);
    setScreen('draft');
  };

  const simulateSeason = () => {
    const ratings = {};
    TEAMS.forEach(t => ratings[t.id] = teamRating(rostersByTeam[t.id]));
    const wins = {}, losses = {};
    TEAMS.forEach(t => { wins[t.id] = 0; losses[t.id] = 0; });
    const ids = TEAMS.map(t => t.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (simGame(ratings[ids[i]], ratings[ids[j]])) { wins[ids[i]]++; losses[ids[j]]++; }
        else { wins[ids[j]]++; losses[ids[i]]++; }
        if (simGame(ratings[ids[j]], ratings[ids[i]])) { wins[ids[j]]++; losses[ids[i]]++; }
        else { wins[ids[i]]++; losses[ids[j]]++; }
      }
    }
    const standingsArr = TEAMS.map(t => ({
      teamId: t.id, wins: wins[t.id], losses: losses[t.id],
      winPct: wins[t.id] / (wins[t.id] + losses[t.id]), conf: t.conf,
    }));

    const playoffs = (conf) => {
      const seeds = standingsArr.filter(s => s.conf === conf).sort((a, b) => b.winPct - a.winPct).slice(0, 8);
      const pairs = [[0, 7], [3, 4], [2, 5], [1, 6]];
      const round1 = pairs.map(([a, b]) => simSeries(seeds[a], seeds[b], ratings));
      const round2 = [simSeries(round1[0], round1[1], ratings), simSeries(round1[2], round1[3], ratings)];
      const confChamp = simSeries(round2[0], round2[1], ratings);
      return { seeds, confChamp };
    };

    const east = playoffs('E'), west = playoffs('W');
    const champion = simSeries(east.confChamp, west.confChamp, ratings);

    let best = null;
    const allValues = [];
    TEAMS.forEach(t => {
      const top9 = [...rostersByTeam[t.id]].sort((a, b) => b.ovr - a.ovr).slice(0, 9);
      const wp = wins[t.id] / (wins[t.id] + losses[t.id]);
      top9.forEach(pl => {
        const val = pl.ovr + wp * 15 + Math.random() * 3;
        allValues.push({ player: pl, val, teamId: t.id });
        if (!best || val > best.val) best = { player: pl, val, teamId: t.id };
      });
    });
    allValues.sort((a, b) => b.val - a.val);
    const allNBA = allValues.slice(0, 5);
    const champRoster = [...rostersByTeam[champion.teamId]].sort((a, b) => b.ovr - a.ovr);
    const finalsMVP = champRoster[0];

    setStandings(standingsArr);
    const awardsObj = { champion: champion.teamId, mvp: best, allNBA, finalsMVP, east, west };
    setAwards(awardsObj);
    setHistory(h => [...h, { year: seasonYear, champion: champion.teamId, mvp: best.player.name }]);
    setScreen('season');
  };

  const advanceOffseason = () => {
    const expiring = picks.filter(p => p.contractYears <= 1);
    const remaining = picks.filter(p => p.contractYears > 1).map(p => ({ ...p, contractYears: p.contractYears - 1 }));
    const vacancies = {};
    TEAMS.forEach(t => vacancies[t.id] = 0);
    expiring.forEach(p => vacancies[p.teamId]++);
    const reverseOrder = [...standings].sort((a, b) => a.wins - b.wins).map(s => s.teamId);
    const maxVac = Math.max(0, ...Object.values(vacancies));
    const order = [];
    for (let r = 0; r < maxVac; r++) {
      reverseOrder.forEach(teamId => { if (vacancies[teamId] > r) order.push(teamId); });
    }
    setPicks(remaining);
    setDraftOrder(order);
    setSeasonYear(y => y + 1);
    setStandings(null);
    setAwards(null);
    setScreen(order.length ? 'draft' : 'rosters');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B1220' }}>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
      `}</style>
      {screen === 'intro' && <IntroScreen onStart={startDraft} />}
      {screen === 'draft' && (
        <DraftScreen
          draftOrder={draftOrder}
          picks={enrichedPicks}
          availablePlayers={availablePlayers}
          rostersByTeam={rostersByTeam}
          onDraft={draftPlayer}
          seasonYear={seasonYear}
        />
      )}
      {screen === 'rosters' && <RostersScreen rostersByTeam={rostersByTeam} onSimulate={simulateSeason} />}
      {screen === 'season' && standings && awards && (
        <SeasonScreen
          standings={standings}
          awards={awards}
          rostersByTeam={rostersByTeam}
          seasonYear={seasonYear}
          history={history}
          onAdvance={advanceOffseason}
        />
      )}
    </div>
  );
}

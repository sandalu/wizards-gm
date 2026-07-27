// Reserve pool of additional REAL NBA players (historical + recent), drawn on as
// future "rookie" classes each offseason. Every name here is a real NBA player.
// Deduplicated by name against players already in the DB at draw time, so any
// accidental overlap with the original 450 is simply skipped.
//
// Only if this reserve is fully exhausted does the offseason fall back to clearly
// labelled "Fictional Prospect" names (see offseasonEngine).

import type { Position } from "@/lib/data/nba";

// [name, position, baseOverall] — treated as young prospects (potential added later).
export const RESERVE: [string, Position, number][] = [
  // Recent draftees / young role players
  ["Scoot Henderson", "PG", 76], ["Jeremy Sochan", "PF", 76], ["Peyton Watson", "SF", 75],
  ["Christian Braun", "SG", 77], ["Jabari Walker", "PF", 72], ["Max Christie", "SG", 74],
  ["Cam Thomas", "SG", 78], ["Quentin Grimes", "SG", 75], ["Jordan Hawkins", "SG", 73],
  ["Julian Strawther", "SF", 72], ["Dariq Whitehead", "SF", 70], ["Nick Smith Jr.", "SG", 71],
  ["Jordan Walsh", "SF", 69], ["Leonard Miller", "PF", 72], ["Jalen Pickett", "PG", 70],
  ["Emoni Bates", "SF", 70], ["Terquavion Smith", "SG", 69], ["Adama Sanogo", "C", 71],
  ["Tristan Vukcevic", "PF", 70], ["Oscar Tshiebwe", "C", 71], ["Colby Jones", "SG", 70],
  ["Keyonte Johnson", "SF", 68], ["GG Jackson II", "PF", 73], ["Craig Porter Jr.", "PG", 71],
  ["Trayce Jackson", "C", 70], ["Vince Williams Jr.", "SG", 74], ["Toumani Camara", "PF", 75],
  ["Jaylen Clark", "SG", 70], ["Isaiah Wong", "SG", 69], ["Keyontae George", "PG", 70],
  ["Bilal Brown", "SF", 68], ["Ricky Council IV", "SG", 71],
  // Modern rotation names
  ["Alec Burks", "SG", 74], ["Patty Mills", "PG", 74], ["Bruce Brown", "SG", 78],
  ["Reggie Jackson", "PG", 75], ["Cory Joseph", "PG", 72], ["Garrett Temple", "SG", 70],
  ["Wesley Matthews", "SG", 73], ["Jae Crowder", "PF", 75], ["Taurean Prince", "SF", 75],
  ["Kevin Huerter", "SG", 78], ["Josh Green", "SG", 74], ["Landry Shamet", "SG", 73],
  ["Gary Payton II", "SG", 74], ["Jevon Carter", "PG", 72], ["T.J. McConnell", "PG", 76],
  ["Kevin Porter Jr.", "SG", 76], ["Talen Horton-Tucker", "SG", 73], ["Jaylen Nowell", "SG", 71],
  ["Dalen Terry", "SF", 70], ["Christian Koloko", "C", 70], ["Xavier Tillman", "C", 72],
  ["Santi Aldama", "PF", 76], ["Jock Landale", "C", 72], ["Drew Eubanks", "C", 72],
  ["Goga Bitadze", "C", 73], ["Chimezie Metu", "PF", 71], ["Bismack Biyombo", "C", 71],
  ["Thomas Bryant", "C", 73], ["Damian Jones", "C", 69], ["Jericho Sims", "C", 70],
  // Veteran wings / guards
  ["Gary Harris", "SG", 74], ["Will Barton", "SG", 74], ["Evan Fournier", "SG", 76],
  ["Joe Harris", "SG", 74], ["Doug McDermott", "SF", 74], ["Davis Bertans", "PF", 72],
  ["Georges Niang", "PF", 74], ["Kevin Knox", "SF", 70], ["Cedi Osman", "SF", 73],
  ["Justin Holiday", "SF", 72], ["Wesley Iwundu", "SF", 68], ["Furkan Korkmaz", "SG", 70],
  ["Damion Lee", "SG", 71], ["Svi Mykhailiuk", "SG", 69], ["Isaiah Joe", "SG", 73],
  ["Aaron Holiday", "PG", 72], ["Cameron Payne", "PG", 74], ["Shake Milton", "SG", 74],
  ["Facundo Campazzo", "PG", 71], ["Frank Jackson", "SG", 69], ["Quinn Cook", "PG", 70],
  // Historical greats + role players
  ["Bob Pettit", "PF", 88], ["Bill Walton", "C", 86], ["Bob Lanier", "C", 85],
  ["Dave Bing", "PG", 84], ["Lenny Wilkens", "PG", 82], ["Hal Greer", "SG", 83],
  ["Sam Jones", "SG", 84], ["Paul Arizin", "SF", 84], ["Dolph Schayes", "PF", 83],
  ["Jerry Lucas", "PF", 83], ["Bill Sharman", "SG", 82], ["Kevin McHale", "PF", 88],
  ["Robert Parish", "C", 85], ["Bill Laimbeer", "C", 80], ["Joe Dumars", "SG", 84],
  ["Dennis Johnson", "SG", 82], ["Alex Caruso", "SG", 76], ["Tim Hardaway", "PG", 85],
  ["Mark Price", "PG", 83], ["Kevin Johnson", "PG", 85], ["Larry Nance", "PF", 82],
  ["Shawn Kemp", "PF", 87], ["Detlef Schrempf", "SF", 82], ["Chris Mullin", "SF", 86],
  ["Tom Chambers", "PF", 82], ["Dan Majerle", "SG", 79], ["Mark Aguirre", "SF", 82],
  ["Rolando Blackman", "SG", 81], ["Kevin Willis", "PF", 79], ["Otis Thorpe", "PF", 79],
  ["Buck Williams", "PF", 80], ["Kevin Duckworth", "C", 75], ["Terry Porter", "PG", 80],
  ["Jeff Hornacek", "SG", 81], ["Dale Davis", "PF", 76], ["Mookie Blaylock", "PG", 80],
  ["Ron Harper", "SG", 79], ["Vin Baker", "PF", 80], ["Tom Gugliotta", "PF", 79],
  ["Jamal Mashburn", "SF", 82], ["Kendall Gill", "SG", 77], ["Larry Johnson", "PF", 84],
  ["Alonzo Mourning", "C", 87], ["Dikembe Mutombo", "C", 84], ["Mookie Wilkins", "SF", 72],
  ["Shareef Abdur-Rahim", "PF", 82], ["Michael Redd", "SG", 82], ["Ben Gordon", "SG", 78],
  ["Richard Hamilton", "SG", 82], ["Tayshaun Prince", "SF", 79], ["Bonzi Wells", "SG", 77],
  ["Bobby Jackson", "PG", 74], ["Wally Szczerbiak", "SF", 77], ["Brad Miller", "C", 79],
  ["Mehmet Okur", "C", 78], ["Zach Randolph", "PF", 82], ["Al Thornton", "SF", 72],
];

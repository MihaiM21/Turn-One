// The F1 API identifies drivers by three-letter code. Search traffic is for
// names ("Russell pole Silverstone"), so the server-rendered tables spell them
// out. Unknown codes fall back to the code itself — never a guess.

const NAMES: Record<string, string> = {
  VER: "Max Verstappen",
  TSU: "Yuki Tsunoda",
  HAD: "Isack Hadjar",
  HAM: "Lewis Hamilton",
  LEC: "Charles Leclerc",
  NOR: "Lando Norris",
  PIA: "Oscar Piastri",
  RUS: "George Russell",
  ANT: "Andrea Kimi Antonelli",
  ALB: "Alexander Albon",
  SAI: "Carlos Sainz",
  LAW: "Liam Lawson",
  LIN: "Arvid Lindblad",
  STR: "Lance Stroll",
  ALO: "Fernando Alonso",
  HUL: "Nico Hülkenberg",
  BOR: "Gabriel Bortoleto",
  OCO: "Esteban Ocon",
  BEA: "Oliver Bearman",
  GAS: "Pierre Gasly",
  COL: "Franco Colapinto",
  DOO: "Jack Doohan",
  BOT: "Valtteri Bottas",
  PER: "Sergio Pérez",
}

export function driverName(code: string): string {
  return NAMES[code] ?? code
}

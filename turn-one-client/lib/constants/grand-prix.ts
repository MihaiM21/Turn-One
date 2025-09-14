export interface GrandPrix {
  id: string
  name: string
  shortName: string
  country: string
  circuit: string
}

export const grandPrixCalendar: Record<string, Record<string, GrandPrix[]>> = {
  "2025": {
    races: [
      { id: "1", name: "Australian Grand Prix", shortName: "AUS", country: "Australia", circuit: "Albert Park Circuit" },
      { id: "2", name: "Chinese Grand Prix", shortName: "CHN", country: "China", circuit: "Shanghai International Circuit" },
      { id: "3", name: "Japanese Grand Prix", shortName: "JPN", country: "Japan", circuit: "Suzuka International Racing Course" },
      { id: "4", name: "Bahrain Grand Prix", shortName: "BHR", country: "Bahrain", circuit: "Bahrain International Circuit" },
      { id: "5", name: "Saudi Arabian Grand Prix", shortName: "SAU", country: "Saudi Arabia", circuit: "Jeddah Corniche Circuit" },
      { id: "6", name: "Miami Grand Prix", shortName: "MIA", country: "United States", circuit: "Miami International Autodrome" },
      { id: "7", name: "Emilia Romagna Grand Prix", shortName: "EMI", country: "Italy", circuit: "Autodromo Enzo e Dino Ferrari" },
      { id: "8", name: "Monaco Grand Prix", shortName: "MON", country: "Monaco", circuit: "Circuit de Monaco" },
      { id: "9", name: "Spanish Grand Prix", shortName: "ESP", country: "Spain", circuit: "Circuit de Barcelona-Catalunya" },
      { id: "10", name: "Canadian Grand Prix", shortName: "CAN", country: "Canada", circuit: "Circuit Gilles Villeneuve" },
      { id: "11", name: "Austrian Grand Prix", shortName: "AUT", country: "Austria", circuit: "Red Bull Ring" },
      { id: "12", name: "British Grand Prix", shortName: "GBR", country: "United Kingdom", circuit: "Silverstone Circuit" },
      { id: "13", name: "Belgian Grand Prix", shortName: "BEL", country: "Belgium", circuit: "Circuit de Spa-Francorchamps" },
      { id: "14", name: "Hungarian Grand Prix", shortName: "HUN", country: "Hungary", circuit: "Hungaroring" },
      { id: "15", name: "Dutch Grand Prix", shortName: "NED", country: "Netherlands", circuit: "Circuit Zandvoort" },
      { id: "16", name: "Monza Grand Prix", shortName: "ITA", country: "Italy", circuit: "Autodromo Nazionale Monza" },
      { id: "17", name: "Azerbaijan Grand Prix", shortName: "AZE", country: "Azerbaijan", circuit: "Baku City Circuit" },
      { id: "18", name: "Singapore Grand Prix", shortName: "SGP", country: "Singapore", circuit: "Marina Bay Street Circuit" },
      { id: "19", name: "United States Grand Prix", shortName: "USA", country: "United States", circuit: "Circuit of The Americas" },
      { id: "20", name: "Mexico Grand Prix", shortName: "MEX", country: "Mexico", circuit: "Autódromo Hermanos Rodríguez" },
      { id: "21", name: "Brazil Grand Prix", shortName: "BRA", country: "Brazil", circuit: "Interlagos Circuit" },
      { id: "22", name: "Las Vegas Grand Prix", shortName: "LAS", country: "United States", circuit: "Las Vegas Street Circuit" },
      { id: "23", name: "Qatar Grand Prix", shortName: "QAT", country: "Qatar", circuit: "Lusail International Circuit" },
      { id: "24", name: "Abu Dhabi Grand Prix", shortName: "ABU", country: "UAE", circuit: "Yas Marina Circuit" }
    ]
  },
  "2026": {
    races: [
      { id: "1", name: "Bahrain Grand Prix", shortName: "BHR", country: "Bahrain", circuit: "Bahrain International Circuit" },
      { id: "2", name: "Saudi Arabian Grand Prix", shortName: "SAU", country: "Saudi Arabia", circuit: "Jeddah Corniche Circuit" },
      { id: "3", name: "Australian Grand Prix", shortName: "AUS", country: "Australia", circuit: "Albert Park Circuit" },
      { id: "4", name: "Chinese Grand Prix", shortName: "CHN", country: "China", circuit: "Shanghai International Circuit" },
      { id: "5", name: "Miami Grand Prix", shortName: "MIA", country: "United States", circuit: "Miami International Autodrome" },
      { id: "6", name: "Emilia Romagna Grand Prix", shortName: "EMI", country: "Italy", circuit: "Autodromo Enzo e Dino Ferrari" },
      { id: "7", name: "Monaco Grand Prix", shortName: "MON", country: "Monaco", circuit: "Circuit de Monaco" },
      { id: "8", name: "Spanish Grand Prix", shortName: "ESP", country: "Spain", circuit: "Circuit de Barcelona-Catalunya" },
      { id: "9", name: "Canadian Grand Prix", shortName: "CAN", country: "Canada", circuit: "Circuit Gilles Villeneuve" },
      { id: "10", name: "Austrian Grand Prix", shortName: "AUT", country: "Austria", circuit: "Red Bull Ring" },
      { id: "11", name: "British Grand Prix", shortName: "GBR", country: "United Kingdom", circuit: "Silverstone Circuit" },
      { id: "12", name: "Hungarian Grand Prix", shortName: "HUN", country: "Hungary", circuit: "Hungaroring" },
      { id: "13", name: "Belgian Grand Prix", shortName: "BEL", country: "Belgium", circuit: "Circuit de Spa-Francorchamps" },
      { id: "14", name: "Dutch Grand Prix", shortName: "NED", country: "Netherlands", circuit: "Circuit Zandvoort" },
      { id: "15", name: "Italian Grand Prix", shortName: "ITA", country: "Italy", circuit: "Autodromo Nazionale Monza" },
      { id: "16", name: "Azerbaijan Grand Prix", shortName: "AZE", country: "Azerbaijan", circuit: "Baku City Circuit" },
      { id: "17", name: "Singapore Grand Prix", shortName: "SGP", country: "Singapore", circuit: "Marina Bay Street Circuit" },
      { id: "18", name: "United States Grand Prix", shortName: "USA", country: "United States", circuit: "Circuit of The Americas" },
      { id: "19", name: "Mexico City Grand Prix", shortName: "MEX", country: "Mexico", circuit: "Autódromo Hermanos Rodríguez" },
      { id: "20", name: "São Paulo Grand Prix", shortName: "BRA", country: "Brazil", circuit: "Interlagos Circuit" },
      { id: "21", name: "Las Vegas Grand Prix", shortName: "LAS", country: "United States", circuit: "Las Vegas Street Circuit" },
      { id: "22", name: "Qatar Grand Prix", shortName: "QAT", country: "Qatar", circuit: "Lusail International Circuit" },
      { id: "23", name: "Abu Dhabi Grand Prix", shortName: "ABU", country: "UAE", circuit: "Yas Marina Circuit" }
    ]
  }
}

export function getGrandPrixByNumber(year: string, number: string): GrandPrix | undefined {
  return grandPrixCalendar[year]?.races.find(gp => gp.id === number)
}

export function getGrandPrixList(year: string): GrandPrix[] {
  return grandPrixCalendar[year]?.races || []
}
export interface F1Team {
    name: string;
    color: string;
    shortName: string;
}

export const F1_TEAMS: Record<string, F1Team> = {
    'Red Bull Racing': { name: 'Red Bull Racing', color: '#3671C6', shortName: 'RBR' },
    'Mercedes': { name: 'Mercedes', color: '#27F4D2', shortName: 'MER' },
    'Ferrari': { name: 'Ferrari', color: '#E8002D', shortName: 'FER' },
    'McLaren': { name: 'McLaren', color: '#FF8000', shortName: 'MCL' },
    'Aston Martin': { name: 'Aston Martin', color: '#229971', shortName: 'AMR' },
    'Alpine': { name: 'Alpine', color: '#0093CC', shortName: 'ALP' },
    'Williams': { name: 'Williams', color: '#64C4FF', shortName: 'WIL' },
    'RB': { name: 'RB', color: '#6692FF', shortName: 'VCARB' },
    'Kick Sauber': { name: 'Kick Sauber', color: '#52E252', shortName: 'SAU' },
    'Haas F1 Team': { name: 'Haas F1 Team', color: '#B6BABD', shortName: 'HAAS' },
    // Fallback / Historical names just in case
    'Alfa Romeo': { name: 'Alfa Romeo', color: '#C92D4B', shortName: 'ALF' },
    'AlphaTauri': { name: 'AlphaTauri', color: '#5E8FAA', shortName: 'AT' },
    'Racing Point': { name: 'Racing Point', color: '#F596C8', shortName: 'RP' },
    'Renault': { name: 'Renault', color: '#FFF500', shortName: 'REN' },
};

export const getTeamColor = (teamName: string): string => {
    // Try direct match
    if (F1_TEAMS[teamName]) {
        return F1_TEAMS[teamName].color;
    }

    // Try partial match
    const foundTeam = Object.values(F1_TEAMS).find(team =>
        teamName.toLowerCase().includes(team.name.toLowerCase()) ||
        team.name.toLowerCase().includes(teamName.toLowerCase())
    );

    return foundTeam ? foundTeam.color : '#808080'; // Default gray
};

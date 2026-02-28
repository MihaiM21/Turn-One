/**
 * Full driver names for the 2026 F1 season.
 * Used in both the prediction form and the admin validation page
 * to ensure consistent driver name matching.
 */
export const f1_2026_drivers = [
  'Max Verstappen',
  'Isack Hadjar',
  'Lewis Hamilton',
  'Charles Leclerc',
  'Lando Norris',
  'Oscar Piastri',
  'George Russell',
  'Andrea Kimi Antonelli',
  'Alexander Albon',
  'Carlos Sainz',
  'Liam Lawson',
  'Arvid Lindblad',
  'Lance Stroll',
  'Fernando Alonso',
  'Nico Hulkenberg',
  'Gabriel Bortoleto',
  'Esteban Ocon',
  'Oliver Bearman',
  'Pierre Gasly',
  'Franco Colapinto',
  'Valtteri Bottas',
  'Sergio Perez',
] as const;

export type F1Driver2026 = (typeof f1_2026_drivers)[number];

-- F1 Trivia Questions Seeding Script
-- Run this script to populate the Trivias table with questions
-- Delete existing trivia if any
DELETE FROM Trivias;

-- Easy Questions (10-15 coins, 20-30 XP)
INSERT INTO Trivias (Id, Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Category, Difficulty, CoinsReward, ExperienceReward, CreatedAt, IsActive)
VALUES
-- Easy History
(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), 'Which country hosts the Monaco Grand Prix?', 'France', 'Monaco', 'Italy', 'Switzerland', 'B', 'History', 'Easy', 10, 20, datetime('now'), 1),
('a2222222-2222-2222-2222-222222222222', 'What color flag signals the end of a Formula 1 race?', 'Red', 'Yellow', 'Checkered', 'Green', 'C', 'Rules', 'Easy', 10, 20, datetime('now'), 1),
('a3333333-3333-3333-3333-333333333333', 'How many points does the race winner receive?', '20', '25', '30', '15', 'B', 'Rules', 'Easy', 10, 20, datetime('now'), 1),
('a4444444-4444-4444-4444-444444444444', 'Which team is known as the "Prancing Horse"?', 'Mercedes', 'Red Bull', 'Ferrari', 'McLaren', 'C', 'Teams', 'Easy', 10, 20, datetime('now'), 1),
('a5555555-5555-5555-5555-555555555555', 'What does DRS stand for?', 'Direct Racing System', 'Drag Reduction System', 'Driver Response System', 'Dual Racing Setup', 'B', 'Technology', 'Easy', 15, 25, datetime('now'), 1),
('a6666666-6666-6666-6666-666666666666', 'Which circuit is known as the "Temple of Speed"?', 'Silverstone', 'Spa', 'Monza', 'Monaco', 'C', 'Circuits', 'Easy', 10, 20, datetime('now'), 1),
('a7777777-7777-7777-7777-777777777777', 'What year did Lewis Hamilton win his first World Championship?', '2006', '2007', '2008', '2009', 'C', 'History', 'Easy', 15, 25, datetime('now'), 1),
('a8888888-8888-8888-8888-888888888888', 'Which team did Michael Schumacher win most of his championships with?', 'Benetton', 'Ferrari', 'Mercedes', 'Jordan', 'B', 'Drivers', 'Easy', 10, 20, datetime('now'), 1),
('a9999999-9999-9999-9999-999999999999', 'What does a yellow flag indicate?', 'Race finished', 'Caution/Hazard', 'Safety Car', 'Free practice', 'B', 'Rules', 'Easy', 10, 20, datetime('now'), 1),
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'How many drivers compete in a typical F1 race?', '18', '20', '22', '24', 'B', 'Rules', 'Easy', 10, 20, datetime('now'), 1),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Which country is Red Bull Racing based in?', 'Austria', 'United Kingdom', 'Germany', 'Netherlands', 'B', 'Teams', 'Easy', 15, 25, datetime('now'), 1),
('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What is the minimum weight limit for F1 cars in 2025?', '698kg', '752kg', '798kg', '850kg', 'C', 'Technology', 'Easy', 15, 30, datetime('now'), 1),

-- Medium Questions (20-30 coins, 40-60 XP)
('b1111111-1111-1111-1111-111111111111', 'Who holds the record for most consecutive race wins?', 'Sebastian Vettel', 'Max Verstappen', 'Michael Schumacher', 'Lewis Hamilton', 'B', 'History', 'Medium', 25, 50, datetime('now'), 1),
('b2222222-2222-2222-2222-222222222222', 'Which driver won the first ever F1 World Championship in 1950?', 'Juan Manuel Fangio', 'Giuseppe Farina', 'Alberto Ascari', 'Stirling Moss', 'B', 'History', 'Medium', 30, 60, datetime('now'), 1),
('b3333333-3333-3333-3333-333333333333', 'What is the nickname of the Eau Rouge corner at Spa-Francorchamps?', 'The Senna S', 'The Raidillon', 'The Parabolica', 'The Variante', 'B', 'Circuits', 'Medium', 25, 50, datetime('now'), 1),
('b4444444-4444-4444-4444-444444444444', 'How many points are awarded for fastest lap if you finish in the top 10?', '1', '2', '3', '5', 'A', 'Rules', 'Medium', 20, 40, datetime('now'), 1),
('b5555555-5555-5555-5555-555555555555', 'Which team holds the record for most consecutive Constructors Championships?', 'Ferrari', 'Red Bull', 'Mercedes', 'McLaren', 'C', 'Teams', 'Medium', 25, 50, datetime('now'), 1),
('b6666666-6666-6666-6666-666666666666', 'What year did Ayrton Senna tragically die?', '1992', '1993', '1994', '1995', 'C', 'History', 'Medium', 25, 50, datetime('now'), 1),
('b7777777-7777-7777-7777-777777777777', 'Which circuit has the longest lap distance in F1?', 'Spa-Francorchamps', 'Silverstone', 'Jeddah', 'Suzuka', 'A', 'Circuits', 'Medium', 30, 60, datetime('now'), 1),
('b8888888-8888-8888-8888-888888888888', 'What does the black flag with an orange circle mean?', 'Disqualification', 'Mechanical problem', 'Penalty', 'Pit lane closed', 'B', 'Rules', 'Medium', 25, 50, datetime('now'), 1),
('b9999999-9999-9999-9999-999999999999', 'Which driver holds the record for most pole positions?', 'Michael Schumacher', 'Ayrton Senna', 'Lewis Hamilton', 'Sebastian Vettel', 'C', 'History', 'Medium', 25, 50, datetime('now'), 1),
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What is the power output of current F1 hybrid power units?', 'Around 800 HP', 'Around 900 HP', 'Around 1000 HP', 'Around 1100 HP', 'C', 'Technology', 'Medium', 30, 60, datetime('now'), 1),
('baaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Which team won the first Constructors Championship in 1958?', 'Ferrari', 'Vanwall', 'Cooper', 'Lotus', 'B', 'History', 'Medium', 30, 60, datetime('now'), 1),
('baaaaaac-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'How many races did Fernando Alonso win in his career before 2025?', '28', '30', '32', '34', 'C', 'Drivers', 'Medium', 25, 50, datetime('now'), 1),

-- Hard Questions (35-50 coins, 80-100 XP)
('c1111111-1111-1111-1111-111111111111', 'What is the maximum amount of fuel allowed in an F1 race (in kilograms)?', '100kg', '105kg', '110kg', '115kg', 'C', 'Technology', 'Hard', 40, 90, datetime('now'), 1),
('c2222222-2222-2222-2222-222222222222', 'Which driver won a race with all four wheels off the track at the final corner?', 'Max Verstappen', 'Sebastian Vettel', 'Kimi Räikkönen', 'Lewis Hamilton', 'C', 'History', 'Hard', 45, 100, datetime('now'), 1),
('c3333333-3333-3333-3333-333333333333', 'In what year was the halo device made mandatory in F1?', '2016', '2017', '2018', '2019', 'C', 'Technology', 'Hard', 35, 80, datetime('now'), 1),
('c4444444-4444-4444-4444-444444444444', 'What is the minimum tire pressure allowed for F1 tires (in PSI)?', '17', '19', '21', '23', 'D', 'Technology', 'Hard', 50, 100, datetime('now'), 1),
('c5555555-5555-5555-5555-555555555555', 'Which driver has the most Grand Prix starts without a win?', 'Nico Hulkenberg', 'Nick Heidfeld', 'Andrea de Cesaris', 'Martin Brundle', 'C', 'History', 'Hard', 45, 100, datetime('now'), 1),
('c6666666-6666-6666-6666-666666666666', 'What year was ground effect first introduced in F1?', '1975', '1977', '1979', '1981', 'B', 'Technology', 'Hard', 40, 90, datetime('now'), 1),
('c7777777-7777-7777-7777-777777777777', 'How many different engine regulations have been used since 1950?', '8', '10', '12', '14', 'C', 'Technology', 'Hard', 50, 100, datetime('now'), 1),
('c8888888-8888-8888-8888-888888888888', 'Which circuit held the shortest F1 race ever (by time)?', 'Monaco 1984', 'Belgium 2021', 'Malaysia 2009', 'Brazil 2003', 'B', 'History', 'Hard', 45, 100, datetime('now'), 1),
('c9999999-9999-9999-9999-999999999999', 'What is the maximum RPM limit for F1 engines?', '12,000', '13,000', '15,000', '18,000', 'C', 'Technology', 'Hard', 40, 90, datetime('now'), 1),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Which team introduced the first six-wheel F1 car?', 'Williams', 'Tyrrell', 'March', 'Lotus', 'B', 'History', 'Hard', 45, 100, datetime('now'), 1),
('caaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What year did F1 introduce the 107% qualifying rule?', '1994', '1996', '1999', '2002', 'B', 'Rules', 'Hard', 40, 90, datetime('now'), 1),
('caaaaaac-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'How many laps is the Monaco Grand Prix?', '71', '74', '78', '81', 'C', 'Circuits', 'Hard', 35, 80, datetime('now'), 1),

-- Very Hard / Expert Questions (50+ coins, 100-150 XP)
('d1111111-1111-1111-1111-111111111111', 'What was the original name of the Mercedes F1 team when it first competed?', 'Brawn GP', 'Tyrrell', 'BAR', 'Jordan', 'B', 'History', 'Hard', 50, 120, datetime('now'), 1),
('d2222222-2222-2222-2222-222222222222', 'Which driver scored a podium in their debut race at the 2007 Australian GP?', 'Lewis Hamilton', 'Robert Kubica', 'Sebastian Vettel', 'Nico Rosberg', 'A', 'History', 'Hard', 45, 100, datetime('now'), 1),
('d3333333-3333-3333-3333-333333333333', 'What is the maximum number of power unit components allowed per season?', '2', '3', '4', '5', 'B', 'Rules', 'Hard', 50, 120, datetime('now'), 1),
('d4444444-4444-4444-4444-444444444444', 'Which year did F1 introduce the current points system (25 for win)?', '2008', '2009', '2010', '2011', 'C', 'Rules', 'Hard', 40, 90, datetime('now'), 1),
('d5555555-5555-5555-5555-555555555555', 'What is the total distance of an F1 race?', 'At least 305 km', 'Exactly 300 km', 'At least 310 km', 'Maximum 305 km', 'A', 'Rules', 'Hard', 45, 100, datetime('now'), 1),
('d6666666-6666-6666-6666-666666666666', 'Which circuit has been on the F1 calendar every year since 1950?', 'Monaco', 'Silverstone', 'Monza', 'Spa-Francorchamps', 'C', 'Circuits', 'Hard', 50, 120, datetime('now'), 1);

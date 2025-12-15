using Domain.Entities;
using Infrastructure;

namespace Infrastructure.Services
{
    public static class TriviaSeeder
    {
        public static async Task SeedTriviaQuestions(TurnOneDbContext context)
        {
            // Check if trivia already exists
            if (context.Trivias.Any())
            {
                return; // Database already seeded
            }

            var now = DateTime.UtcNow;
            var triviaQuestions = new List<Trivia>
            {
                // Easy Questions (10-15 coins, 20-30 XP)
                new Trivia { Id = Guid.NewGuid(), Question = "Which country hosts the Monaco Grand Prix?", OptionA = "France", OptionB = "Monaco", OptionC = "Italy", OptionD = "Switzerland", CorrectAnswer = "B", Category = "History", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20, IsActive = true, CreatedAt = now },
                new Trivia { Id = Guid.NewGuid(), Question = "What color flag signals the end of a Formula 1 race?", OptionA = "Red", OptionB = "Yellow", OptionC = "Checkered", OptionD = "Green", CorrectAnswer = "C", Category = "Rules", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20, IsActive = true, CreatedAt = now },
                new Trivia { Question = "How many points does the race winner receive?", OptionA = "20", OptionB = "25", OptionC = "30", OptionD = "15", CorrectAnswer = "B", Category = "Rules", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "Which team is known as the \"Prancing Horse\"?", OptionA = "Mercedes", OptionB = "Red Bull", OptionC = "Ferrari", OptionD = "McLaren", CorrectAnswer = "C", Category = "Teams", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "What does DRS stand for?", OptionA = "Direct Racing System", OptionB = "Drag Reduction System", OptionC = "Driver Response System", OptionD = "Dual Racing Setup", CorrectAnswer = "B", Category = "Technology", Difficulty = "Easy", CoinsReward = 15, ExperienceReward = 25 },
                new Trivia { Question = "Which circuit is known as the \"Temple of Speed\"?", OptionA = "Silverstone", OptionB = "Spa", OptionC = "Monza", OptionD = "Monaco", CorrectAnswer = "C", Category = "Circuits", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "What year did Lewis Hamilton win his first World Championship?", OptionA = "2006", OptionB = "2007", OptionC = "2008", OptionD = "2009", CorrectAnswer = "C", Category = "History", Difficulty = "Easy", CoinsReward = 15, ExperienceReward = 25 },
                new Trivia { Question = "Which team did Michael Schumacher win most of his championships with?", OptionA = "Benetton", OptionB = "Ferrari", OptionC = "Mercedes", OptionD = "Jordan", CorrectAnswer = "B", Category = "Drivers", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "What does a yellow flag indicate?", OptionA = "Race finished", OptionB = "Caution/Hazard", OptionC = "Safety Car", OptionD = "Free practice", CorrectAnswer = "B", Category = "Rules", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "How many drivers compete in a typical F1 race?", OptionA = "18", OptionB = "20", OptionC = "22", OptionD = "24", CorrectAnswer = "B", Category = "Rules", Difficulty = "Easy", CoinsReward = 10, ExperienceReward = 20 },
                new Trivia { Question = "Which country is Red Bull Racing based in?", OptionA = "Austria", OptionB = "United Kingdom", OptionC = "Germany", OptionD = "Netherlands", CorrectAnswer = "B", Category = "Teams", Difficulty = "Easy", CoinsReward = 15, ExperienceReward = 25 },
                new Trivia { Question = "What is the minimum weight limit for F1 cars in 2025?", OptionA = "698kg", OptionB = "752kg", OptionC = "798kg", OptionD = "850kg", CorrectAnswer = "C", Category = "Technology", Difficulty = "Easy", CoinsReward = 15, ExperienceReward = 30 },

                // Medium Questions (20-30 coins, 40-60 XP)
                new Trivia { Question = "Who holds the record for most consecutive race wins?", OptionA = "Sebastian Vettel", OptionB = "Max Verstappen", OptionC = "Michael Schumacher", OptionD = "Lewis Hamilton", CorrectAnswer = "B", Category = "History", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "Which driver won the first ever F1 World Championship in 1950?", OptionA = "Juan Manuel Fangio", OptionB = "Giuseppe Farina", OptionC = "Alberto Ascari", OptionD = "Stirling Moss", CorrectAnswer = "B", Category = "History", Difficulty = "Medium", CoinsReward = 30, ExperienceReward = 60 },
                new Trivia { Question = "What is the nickname of the Eau Rouge corner at Spa-Francorchamps?", OptionA = "The Senna S", OptionB = "The Raidillon", OptionC = "The Parabolica", OptionD = "The Variante", CorrectAnswer = "B", Category = "Circuits", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "How many points are awarded for fastest lap if you finish in the top 10?", OptionA = "1", OptionB = "2", OptionC = "3", OptionD = "5", CorrectAnswer = "A", Category = "Rules", Difficulty = "Medium", CoinsReward = 20, ExperienceReward = 40 },
                new Trivia { Question = "Which team holds the record for most consecutive Constructors Championships?", OptionA = "Ferrari", OptionB = "Red Bull", OptionC = "Mercedes", OptionD = "McLaren", CorrectAnswer = "C", Category = "Teams", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "What year did Ayrton Senna tragically die?", OptionA = "1992", OptionB = "1993", OptionC = "1994", OptionD = "1995", CorrectAnswer = "C", Category = "History", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "Which circuit has the longest lap distance in F1?", OptionA = "Spa-Francorchamps", OptionB = "Silverstone", OptionC = "Jeddah", OptionD = "Suzuka", CorrectAnswer = "A", Category = "Circuits", Difficulty = "Medium", CoinsReward = 30, ExperienceReward = 60 },
                new Trivia { Question = "What does the black flag with an orange circle mean?", OptionA = "Disqualification", OptionB = "Mechanical problem", OptionC = "Penalty", OptionD = "Pit lane closed", CorrectAnswer = "B", Category = "Rules", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "Which driver holds the record for most pole positions?", OptionA = "Michael Schumacher", OptionB = "Ayrton Senna", OptionC = "Lewis Hamilton", OptionD = "Sebastian Vettel", CorrectAnswer = "C", Category = "History", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },
                new Trivia { Question = "What is the power output of current F1 hybrid power units?", OptionA = "Around 800 HP", OptionB = "Around 900 HP", OptionC = "Around 1000 HP", OptionD = "Around 1100 HP", CorrectAnswer = "C", Category = "Technology", Difficulty = "Medium", CoinsReward = 30, ExperienceReward = 60 },
                new Trivia { Question = "Which team won the first Constructors Championship in 1958?", OptionA = "Ferrari", OptionB = "Vanwall", OptionC = "Cooper", OptionD = "Lotus", CorrectAnswer = "B", Category = "History", Difficulty = "Medium", CoinsReward = 30, ExperienceReward = 60 },
                new Trivia { Question = "How many races did Fernando Alonso win in his career before 2025?", OptionA = "28", OptionB = "30", OptionC = "32", OptionD = "34", CorrectAnswer = "C", Category = "Drivers", Difficulty = "Medium", CoinsReward = 25, ExperienceReward = 50 },

                // Hard Questions (35-50 coins, 80-100 XP)
                new Trivia { Question = "What is the maximum amount of fuel allowed in an F1 race (in kilograms)?", OptionA = "100kg", OptionB = "105kg", OptionC = "110kg", OptionD = "115kg", CorrectAnswer = "C", Category = "Technology", Difficulty = "Hard", CoinsReward = 40, ExperienceReward = 90 },
                new Trivia { Question = "Which driver won a race with all four wheels off the track at the final corner?", OptionA = "Max Verstappen", OptionB = "Sebastian Vettel", OptionC = "Kimi Räikkönen", OptionD = "Lewis Hamilton", CorrectAnswer = "C", Category = "History", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "In what year was the halo device made mandatory in F1?", OptionA = "2016", OptionB = "2017", OptionC = "2018", OptionD = "2019", CorrectAnswer = "C", Category = "Technology", Difficulty = "Hard", CoinsReward = 35, ExperienceReward = 80 },
                new Trivia { Question = "What is the minimum tire pressure allowed for F1 tires (in PSI)?", OptionA = "17", OptionB = "19", OptionC = "21", OptionD = "23", CorrectAnswer = "D", Category = "Technology", Difficulty = "Hard", CoinsReward = 50, ExperienceReward = 100 },
                new Trivia { Question = "Which driver has the most Grand Prix starts without a win?", OptionA = "Nico Hulkenberg", OptionB = "Nick Heidfeld", OptionC = "Andrea de Cesaris", OptionD = "Martin Brundle", CorrectAnswer = "C", Category = "History", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "What year was ground effect first introduced in F1?", OptionA = "1975", OptionB = "1977", OptionC = "1979", OptionD = "1981", CorrectAnswer = "B", Category = "Technology", Difficulty = "Hard", CoinsReward = 40, ExperienceReward = 90 },
                new Trivia { Question = "How many different engine regulations have been used since 1950?", OptionA = "8", OptionB = "10", OptionC = "12", OptionD = "14", CorrectAnswer = "C", Category = "Technology", Difficulty = "Hard", CoinsReward = 50, ExperienceReward = 100 },
                new Trivia { Question = "Which circuit held the shortest F1 race ever (by time)?", OptionA = "Monaco 1984", OptionB = "Belgium 2021", OptionC = "Malaysia 2009", OptionD = "Brazil 2003", CorrectAnswer = "B", Category = "History", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "What is the maximum RPM limit for F1 engines?", OptionA = "12,000", OptionB = "13,000", OptionC = "15,000", OptionD = "18,000", CorrectAnswer = "C", Category = "Technology", Difficulty = "Hard", CoinsReward = 40, ExperienceReward = 90 },
                new Trivia { Question = "Which team introduced the first six-wheel F1 car?", OptionA = "Williams", OptionB = "Tyrrell", OptionC = "March", OptionD = "Lotus", CorrectAnswer = "B", Category = "History", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "What year did F1 introduce the 107% qualifying rule?", OptionA = "1994", OptionB = "1996", OptionC = "1999", OptionD = "2002", CorrectAnswer = "B", Category = "Rules", Difficulty = "Hard", CoinsReward = 40, ExperienceReward = 90 },
                new Trivia { Question = "How many laps is the Monaco Grand Prix?", OptionA = "71", OptionB = "74", OptionC = "78", OptionD = "81", CorrectAnswer = "C", Category = "Circuits", Difficulty = "Hard", CoinsReward = 35, ExperienceReward = 80 },

                // Very Hard / Expert Questions (45-50 coins, 90-120 XP)
                new Trivia { Question = "What was the original name of the Mercedes F1 team when it first competed?", OptionA = "Brawn GP", OptionB = "Tyrrell", OptionC = "BAR", OptionD = "Jordan", CorrectAnswer = "B", Category = "History", Difficulty = "Hard", CoinsReward = 50, ExperienceReward = 120 },
                new Trivia { Question = "Which driver scored a podium in their debut race at the 2007 Australian GP?", OptionA = "Lewis Hamilton", OptionB = "Robert Kubica", OptionC = "Sebastian Vettel", OptionD = "Nico Rosberg", CorrectAnswer = "A", Category = "History", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "What is the maximum number of power unit components allowed per season?", OptionA = "2", OptionB = "3", OptionC = "4", OptionD = "5", CorrectAnswer = "B", Category = "Rules", Difficulty = "Hard", CoinsReward = 50, ExperienceReward = 120 },
                new Trivia { Question = "Which year did F1 introduce the current points system (25 for win)?", OptionA = "2008", OptionB = "2009", OptionC = "2010", OptionD = "2011", CorrectAnswer = "C", Category = "Rules", Difficulty = "Hard", CoinsReward = 40, ExperienceReward = 90 },
                new Trivia { Question = "What is the total distance of an F1 race?", OptionA = "At least 305 km", OptionB = "Exactly 300 km", OptionC = "At least 310 km", OptionD = "Maximum 305 km", CorrectAnswer = "A", Category = "Rules", Difficulty = "Hard", CoinsReward = 45, ExperienceReward = 100 },
                new Trivia { Question = "Which circuit has been on the F1 calendar every year since 1950?", OptionA = "Monaco", OptionB = "Silverstone", OptionC = "Monza", OptionD = "Spa-Francorchamps", CorrectAnswer = "C", Category = "Circuits", Difficulty = "Hard", CoinsReward = 50, ExperienceReward = 120 }
            };

            // Set required fields for all questions
            foreach (var trivia in triviaQuestions)
            {
                if (trivia.Id == Guid.Empty) trivia.Id = Guid.NewGuid();
                trivia.IsActive = true;
                trivia.CreatedAt = now;
            }

            await context.Trivias.AddRangeAsync(triviaQuestions);
            await context.SaveChangesAsync();
        }
    }
}

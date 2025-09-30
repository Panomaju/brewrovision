// Time crunch hit: This shit is just chatgpt'd. Let's see how it fares

type Country = {
  id: number;
  name: string;
  flag: string;
};

type Score = {
  countryId: number;
  score: number;
  published: boolean;
};

type ScoresByCategory = {
  [category: string]: Score[];
};

type Participant = {
  country: Country;
  scores: ScoresByCategory;
};

type DataModel = {
  participants: Participant[];
};

type StandingEntry = {
  countryId: number;
  countryName: string;
  flag: string;
  score: number;
};

type Standings = {
  [category: string]: StandingEntry[];
};

/**
 * Computes standings for each beer category.
 */
export function computeStandings(data: DataModel): Standings {
  const standings: { [category: string]: Map<number, StandingEntry> } = {};

  for (const participant of data.participants) {
    for (const [category, scores] of Object.entries(participant.scores)) {
      if (!standings[category]) {
        standings[category] = new Map();
      }

      for (const { countryId, score } of scores) {
        const recipient = data.participants.find(
          (p) => p.country.id === countryId,
        );
        if (!recipient) continue;

        const current = standings[category].get(countryId);
        if (current) {
          current.score += score;
        } else {
          standings[category].set(countryId, {
            countryId,
            countryName: recipient.country.name,
            flag: recipient.country.flag,
            score,
          });
        }
      }
    }
  }

  // Convert maps to sorted arrays
  const result: Standings = {};
  for (const [category, map] of Object.entries(standings)) {
    result[category] = Array.from(map.values()).sort(
      (a, b) => b.score - a.score,
    );
  }

  return result;
}

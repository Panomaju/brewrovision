// Domain types shared between server and client.

export interface Country {
    id: number;
    name: string;
    flagImg: string;
    sortOrder: number;
}

export interface Category {
    id: number;
    name: string;
    focus: string;
    sortOrder: number;
}

// A single point award: `fromCountry` gave `points` to `toCountry` in `category`.
export interface Vote {
    fromCountryId: number;
    categoryId: number;
    toCountryId: number;
    points: number;
    revealed: boolean;
}

// The full set of reference data the client needs to render forms.
export interface Bootstrap {
    countries: Country[];
    categories: Category[];
    ladder: number[];
}

// A running total for one country, used by the overlay and standings.
export interface StandingEntry {
    countryId: number;
    name: string;
    flagImg: string;
    points: number;
}

export interface CategoryStandings {
    categoryId: number;
    categoryName: string;
    entries: StandingEntry[];
}

// The Eurovision-style point ladder for ranks 1..6 (7 countries, each ranks
// the other 6). Index 0 = best rank.
export const POINT_LADDER = [12, 10, 8, 6, 4, 2];

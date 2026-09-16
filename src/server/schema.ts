// Kysely database type definitions. These describe the shape of the tables so
// that queries are fully typed. Column names are snake_case to match SQL.

import type { Generated } from "kysely";

export interface CountryTable {
    id: Generated<number>;
    name: string;
    flag_img: string;
    sort_order: number;
}

export interface CategoryTable {
    id: Generated<number>;
    name: string;
    focus: string;
    sort_order: number;
}

export interface VoteTable {
    id: Generated<number>;
    from_country_id: number;
    category_id: number;
    to_country_id: number;
    points: number;
    revealed: boolean;
}

export interface Database {
    country: CountryTable;
    category: CategoryTable;
    vote: VoteTable;
}

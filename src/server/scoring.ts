// Standings are always computed from *revealed* votes only, so the overlay and
// the standings page reflect exactly what has been shown on stream.

import { sql } from "kysely";
import { db } from "./db.js";
import type { CategoryStandings, StandingEntry } from "../shared/types.js";

// Overall standings: total revealed points each country has received, summed
// across all categories, sorted high to low.
export async function getOverallStandings(): Promise<StandingEntry[]> {
    const rows = await db
        .selectFrom("country")
        .leftJoin("vote", (join) =>
            join
                .onRef("vote.to_country_id", "=", "country.id")
                .on("vote.revealed", "=", 1),
        )
        .select([
            "country.id as countryId",
            "country.name as name",
            "country.flag_img as flagImg",
            sql<number>`coalesce(sum(vote.points), 0)`.as("points"),
        ])
        .groupBy(["country.id", "country.name", "country.flag_img"])
        .execute();

    return rows
        .map((r) => ({ ...r, points: Number(r.points) }))
        .sort((a, b) => b.points - a.points);
}

// Per-category standings, each sorted high to low.
export async function getCategoryStandings(): Promise<CategoryStandings[]> {
    const categories = await db
        .selectFrom("category")
        .select(["id", "name"])
        .orderBy("sort_order")
        .execute();

    const rows = await db
        .selectFrom("vote")
        .innerJoin("country", "country.id", "vote.to_country_id")
        .where("vote.revealed", "=", 1)
        .select([
            "vote.category_id as categoryId",
            "country.id as countryId",
            "country.name as name",
            "country.flag_img as flagImg",
            sql<number>`sum(vote.points)`.as("points"),
        ])
        .groupBy([
            "vote.category_id",
            "country.id",
            "country.name",
            "country.flag_img",
        ])
        .execute();

    return categories.map((cat) => {
        const entries: StandingEntry[] = rows
            .filter((r) => r.categoryId === cat.id)
            .map((r) => ({
                countryId: r.countryId,
                name: r.name,
                flagImg: r.flagImg,
                points: Number(r.points),
            }))
            .sort((a, b) => b.points - a.points);
        return { categoryId: cat.id, categoryName: cat.name, entries };
    });
}

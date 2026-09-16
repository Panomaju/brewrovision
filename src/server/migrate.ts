// Idempotent schema + seed. Safe to run on every deploy.

import { sql } from "kysely";
import { db } from "./db.js";

const FLAG_BASE = "https://flags.restcountries.com/v5/w640";

const COUNTRIES = [
    { name: "Finland", code: "fi", sort_order: 1 },
    { name: "England", code: "gb-eng", sort_order: 2 },
    { name: "Scotland", code: "gb-sct", sort_order: 3 },
    { name: "Ireland", code: "ie", sort_order: 4 },
    { name: "Denmark", code: "dk", sort_order: 5 },
    { name: "Croatia", code: "hr", sort_order: 6 },
    { name: "Poland", code: "pl", sort_order: 7 },
];

const CATEGORIES = [
    { name: "Pale Lager", focus: "Clean fermentation, precision, and a crisp profile.", sort_order: 1 },
    { name: "Pale Belgian Beer", focus: "Yeast-driven complexity and phenolic balance.", sort_order: 2 },
    { name: "IPA", focus: "Hop expression, bitterness, and aromatic intensity.", sort_order: 3 },
    { name: "Dark Strong Ales", focus: "Malt depth, alcohol integration, and oxidative complexity.", sort_order: 4 },
    { name: "Sour Beers", focus: "Acidification, fermentation complexity, and adjunct integration.", sort_order: 5 },
];

async function createTables() {
    await db.schema
        .createTable("country")
        .ifNotExists()
        .addColumn("id", "serial", (c) => c.primaryKey())
        .addColumn("name", "text", (c) => c.notNull().unique())
        .addColumn("flag_img", "text", (c) => c.notNull())
        .addColumn("sort_order", "integer", (c) => c.notNull())
        .execute();

    await db.schema
        .createTable("category")
        .ifNotExists()
        .addColumn("id", "serial", (c) => c.primaryKey())
        .addColumn("name", "text", (c) => c.notNull().unique())
        .addColumn("focus", "text", (c) => c.notNull())
        .addColumn("sort_order", "integer", (c) => c.notNull())
        .execute();

    await db.schema
        .createTable("vote")
        .ifNotExists()
        .addColumn("id", "serial", (c) => c.primaryKey())
        .addColumn("from_country_id", "integer", (c) => c.notNull().references("country.id"))
        .addColumn("category_id", "integer", (c) => c.notNull().references("category.id"))
        .addColumn("to_country_id", "integer", (c) => c.notNull().references("country.id"))
        .addColumn("points", "integer", (c) => c.notNull().defaultTo(0))
        .addColumn("revealed", "boolean", (c) => c.notNull().defaultTo(false))
        .addUniqueConstraint("vote_ballot_unique", ["from_country_id", "category_id", "to_country_id"])
        .addCheckConstraint("vote_not_self", sql`from_country_id <> to_country_id`)
        .execute();
}

async function seed() {
    for (const c of COUNTRIES) {
        await db
            .insertInto("country")
            .values({
                name: c.name,
                flag_img: `${FLAG_BASE}/${c.code}.png`,
                sort_order: c.sort_order,
            })
            .onConflict((oc) => oc.column("name").doNothing())
            .execute();
    }

    for (const c of CATEGORIES) {
        await db
            .insertInto("category")
            .values(c)
            .onConflict((oc) => oc.column("name").doNothing())
            .execute();
    }

    // Pre-create an empty vote row for every (from, category, to != from) so the
    // admin UI always has rows to edit and totals are well-defined.
    const countries = await db.selectFrom("country").select(["id"]).execute();
    const categories = await db.selectFrom("category").select(["id"]).execute();

    const rows: {
        from_country_id: number;
        category_id: number;
        to_country_id: number;
        points: number;
        revealed: boolean;
    }[] = [];
    for (const from of countries) {
        for (const cat of categories) {
            for (const to of countries) {
                if (from.id === to.id) continue;
                rows.push({
                    from_country_id: from.id,
                    category_id: cat.id,
                    to_country_id: to.id,
                    points: 0,
                    revealed: false,
                });
            }
        }
    }

    if (rows.length > 0) {
        await db
            .insertInto("vote")
            .values(rows)
            .onConflict((oc) =>
                oc.columns(["from_country_id", "category_id", "to_country_id"]).doNothing(),
            )
            .execute();
    }
}

async function main() {
    await createTables();
    await seed();
    console.log("Migration + seed complete.");
    await db.destroy();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

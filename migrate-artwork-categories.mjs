/**
 * Migrates artwork categories from works/archive to medium-based categories.
 * The works/archive distinction is handled by the isArchive boolean field.
 *
 * Usage:
 *   $env:CONTENTFUL_SPACE_ID="your_space_id"
 *   $env:CONTENTFUL_MANAGEMENT_TOKEN="your_cma_token"
 *   node migrate-artwork-categories.mjs
 */

import { createClient } from "contentful-management";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !TOKEN) {
  console.error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN.");
  process.exit(1);
}

const client = createClient(
  { accessToken: TOKEN },
  { defaults: { spaceId: SPACE_ID, environmentId: "master" } }
);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const NEW_CATEGORIES = [
  { slug: "paintings", en: "Paintings", fi: "Maalaukset", sortOrder: 1 },
  { slug: "sculptures", en: "Sculptures", fi: "Veistokset", sortOrder: 2 },
  { slug: "poems", en: "Poems", fi: "Runot", sortOrder: 3 },
  { slug: "sound-installations", en: "Sound installations", fi: "Ääni-installaatiot", sortOrder: 4 },
  { slug: "other", en: "Other", fi: "Muu", sortOrder: 5 },
];

async function main() {
  // Step 1: Create new categories
  console.log("── Creating new artwork categories ──");
  for (const cat of NEW_CATEGORIES) {
    // Check if exists
    const existing = await client.entry.getMany({
      query: { content_type: "artworkCategory", "fields.slug": cat.slug, limit: 1 },
    });

    if (existing.items.length > 0) {
      console.log(`  ✓ "${cat.en}" already exists`);
      continue;
    }

    const entry = await client.entry.create(
      { contentTypeId: "artworkCategory" },
      {
        fields: {
          name: { "en-US": cat.en, fi: cat.fi },
          slug: { "en-US": cat.slug },
          sortOrder: { "en-US": cat.sortOrder },
        },
      }
    );
    // Publish
    await client.entry.publish(
      { entryId: entry.sys.id },
      { sys: { version: entry.sys.version } }
    );
    console.log(`  + "${cat.en}" created and published`);
    await delay(300);
  }

  // Step 2: Unlink old categories from artworks
  console.log("\n── Unlinking old 'works'/'archive' categories from artworks ──");
  const artworks = await client.entry.getMany({
    query: { content_type: "artwork", limit: 500 },
  });

  // Find old category IDs
  const oldCategories = await client.entry.getMany({
    query: { content_type: "artworkCategory", limit: 10 },
  });
  const oldSlugs = new Set(["works", "archive"]);
  const oldCategoryIds = new Set(
    oldCategories.items
      .filter((c) => oldSlugs.has(c.fields.slug?.["en-US"]))
      .map((c) => c.sys.id)
  );

  let unlinked = 0;
  for (const artwork of artworks.items) {
    const catRef = artwork.fields.category?.["en-US"];
    if (catRef && oldCategoryIds.has(catRef.sys.id)) {
      // Remove the old category reference
      delete artwork.fields.category;
      const updated = await client.entry.update(
        { entryId: artwork.sys.id },
        artwork
      );
      await client.entry.publish(
        { entryId: artwork.sys.id },
        { sys: { version: updated.sys.version } }
      );
      unlinked++;
      await delay(200);
    }
  }
  console.log(`  ✓ Unlinked ${unlinked} artworks from old categories`);

  // Step 3: Delete old categories
  console.log("\n── Removing old 'works'/'archive' categories ──");
  for (const old of oldCategories.items) {
    const slug = old.fields.slug?.["en-US"];
    if (oldSlugs.has(slug)) {
      try {
        // Unpublish then delete
        await client.entry.unpublish({ entryId: old.sys.id });
        await delay(200);
        await client.entry.delete({ entryId: old.sys.id });
        console.log(`  - Deleted "${slug}"`);
      } catch (err) {
        console.warn(`  ⚠ Could not delete "${slug}": ${err.message}`);
      }
      await delay(200);
    }
  }

  console.log("\n✅ Done! New categories available:");
  NEW_CATEGORIES.forEach((c) => console.log(`  • ${c.en} (${c.fi})`));
  console.log(
    "\nArtworks now have no category assigned — assign them via the Contentful web app."
  );
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
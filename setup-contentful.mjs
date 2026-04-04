/**
 * Contentful Content Model Setup Script for laurakarki.com (lk4)
 *
 * Uses the modern flat API (contentful-management v12+)
 *
 * Prerequisites:
 *   npm install contentful-management
 *
 * Usage (PowerShell):
 *   $env:CONTENTFUL_SPACE_ID="your_space_id"
 *   $env:CONTENTFUL_MANAGEMENT_TOKEN="your_cma_token"
 *   node setup-contentful.mjs
 *
 * Usage (CMD):
 *   set CONTENTFUL_SPACE_ID=your_space_id
 *   set CONTENTFUL_MANAGEMENT_TOKEN=your_cma_token
 *   node setup-contentful.mjs
 *
 * To get your management token:
 *   Contentful web app → Settings → CMA tokens → Generate personal token
 *
 * To get your space ID:
 *   Contentful web app → Settings → General settings → Space ID
 */

import { createClient } from "contentful-management";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const ENVIRONMENT_ID = "master";

if (!SPACE_ID || !TOKEN) {
  console.error(
    "Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN environment variables."
  );
  process.exit(1);
}

const client = createClient(
  { accessToken: TOKEN },
  { defaults: { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID } }
);

async function main() {
  // ── Step 1: Ensure Finnish locale exists ──────────────────────────
  console.log("Setting up locales...");
  const locales = await client.locale.getMany({});
  const hasFinnish = locales.items.some((l) => l.code === "fi");
  if (!hasFinnish) {
    await client.locale.create(
      {},
      {
        name: "Finnish",
        code: "fi",
        fallbackCode: "en-US",
        optional: true,
      }
    );
    console.log("  ✓ Finnish locale created");
  } else {
    console.log("  ✓ Finnish locale already exists");
  }

  // ── Step 2: Create content types ──────────────────────────────────
  async function createAndPublish(contentTypeId, data) {
    try {
      // Try to get existing content type
      const existing = await client.contentType.get({ contentTypeId });
      // Update it
      const updated = await client.contentType.update(
        { contentTypeId },
        {
          ...data,
          sys: { version: existing.sys.version },
        }
      );
      console.log(`  ⟳ "${contentTypeId}" updated`);
      await client.contentType.publish(
        { contentTypeId },
        { sys: { version: updated.sys.version } }
      );
    } catch (e) {
      // Doesn't exist yet — create it
      const created = await client.contentType.createWithId(
        { contentTypeId },
        data
      );
      console.log(`  ✓ "${contentTypeId}" created`);
      await client.contentType.publish(
        { contentTypeId },
        { sys: { version: created.sys.version } }
      );
    }
    console.log(`  ✓ "${contentTypeId}" published`);
  }

  // ── Artwork Category ──────────────────────────────────────────────
  await createAndPublish("artworkCategory", {
    name: "Artwork Category",
    description:
      "Categories for artworks (e.g. paintings, sculptures, installations)",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ unique: true }],
      },
      {
        id: "sortOrder",
        name: "Sort Order",
        type: "Integer",
        required: false,
        localized: false,
      },
    ],
  });

  // ── CV Section ────────────────────────────────────────────────────
  await createAndPublish("cvSection", {
    name: "CV Section",
    description:
      "Top-level CV groupings (Education, Artistic Activity, Job Experience)",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ unique: true }],
      },
      {
        id: "sortOrder",
        name: "Sort Order",
        type: "Integer",
        required: false,
        localized: false,
      },
    ],
  });

  // ── CV Category ───────────────────────────────────────────────────
  await createAndPublish("cvCategory", {
    name: "CV Category",
    description:
      "Sub-categories under Artistic Activity (exhibitions, grants, etc.)",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "slug",
        name: "Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ unique: true }],
      },
      {
        id: "sortOrder",
        name: "Sort Order",
        type: "Integer",
        required: false,
        localized: false,
      },
      {
        id: "section",
        name: "Section",
        type: "Link",
        linkType: "Entry",
        required: true,
        localized: false,
        validations: [{ linkContentType: ["cvSection"] }],
      },
    ],
  });

  // ── Social Link ───────────────────────────────────────────────────
  await createAndPublish("socialLink", {
    name: "Social Link",
    description: "External social media / portfolio links",
    displayField: "name",
    fields: [
      {
        id: "name",
        name: "Name",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "url",
        name: "URL",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [
          { regexp: { pattern: "^https?://", flags: null } },
        ],
      },
      {
        id: "icon",
        name: "Icon",
        type: "Symbol",
        required: false,
        localized: false,
      },
    ],
  });

  // ── Artwork ───────────────────────────────────────────────────────
  await createAndPublish("artwork", {
    name: "Artwork",
    description: "Individual artwork with image and metadata",
    displayField: "title",
    fields: [
      {
        id: "title",
        name: "Title",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "year",
        name: "Year",
        type: "Integer",
        required: false,
        localized: false,
      },
      {
        id: "dimensions",
        name: "Dimensions",
        type: "Symbol",
        required: false,
        localized: true,
      },
      {
        id: "image",
        name: "Image",
        type: "Link",
        linkType: "Asset",
        required: false,
        localized: false,
        validations: [{ linkMimetypeGroup: ["image"] }],
      },
      {
        id: "category",
        name: "Category",
        type: "Link",
        linkType: "Entry",
        required: false,
        localized: false,
        validations: [{ linkContentType: ["artworkCategory"] }],
      },
      {
        id: "isArchive",
        name: "Is Archive",
        type: "Boolean",
        required: false,
        localized: false,
      },
    ],
  });

  // ── News Entry ────────────────────────────────────────────────────
  await createAndPublish("newsEntry", {
    name: "News Entry",
    description: "News items displayed on the landing page",
    displayField: "title",
    fields: [
      {
        id: "title",
        name: "Title",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "date",
        name: "Date",
        type: "Date",
        required: true,
        localized: false,
      },
      {
        id: "body",
        name: "Body",
        type: "RichText",
        required: false,
        localized: true,
        validations: [
          {
            enabledNodeTypes: [
              "heading-3",
              "heading-4",
              "ordered-list",
              "unordered-list",
              "hr",
              "blockquote",
              "hyperlink",
              "entry-hyperlink",
              "asset-hyperlink",
            ],
          },
          { enabledMarks: ["bold", "italic", "underline"] },
        ],
      },
      {
        id: "link",
        name: "Link",
        type: "Symbol",
        required: false,
        localized: false,
        validations: [
          { regexp: { pattern: "^https?://", flags: null } },
        ],
      },
    ],
  });

  // ── CV Entry ──────────────────────────────────────────────────────
  await createAndPublish("cvEntry", {
    name: "CV Entry",
    description: "Individual CV line item (education, exhibition, job, etc.)",
    displayField: "content",
    fields: [
      {
        id: "time",
        name: "Time",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "content",
        name: "Content",
        type: "Symbol",
        required: true,
        localized: true,
      },
      {
        id: "section",
        name: "Section",
        type: "Link",
        linkType: "Entry",
        required: true,
        localized: false,
        validations: [{ linkContentType: ["cvSection"] }],
      },
      {
        id: "category",
        name: "Category",
        type: "Link",
        linkType: "Entry",
        required: false,
        localized: false,
        validations: [{ linkContentType: ["cvCategory"] }],
      },
      {
        id: "sortOrder",
        name: "Sort Order",
        type: "Integer",
        required: false,
        localized: false,
      },
    ],
  });

  // ── Page Content ──────────────────────────────────────────────────
  await createAndPublish("pageContent", {
    name: "Page Content",
    description:
      "Fixed text content for pages (intro/biography, other page, etc.)",
    displayField: "pageSlug",
    fields: [
      {
        id: "pageSlug",
        name: "Page Slug",
        type: "Symbol",
        required: true,
        localized: false,
        validations: [{ unique: true }],
      },
      {
        id: "body",
        name: "Body",
        type: "RichText",
        required: false,
        localized: true,
        validations: [
          {
            enabledNodeTypes: [
              "heading-2",
              "heading-3",
              "heading-4",
              "ordered-list",
              "unordered-list",
              "hr",
              "blockquote",
              "hyperlink",
              "entry-hyperlink",
              "asset-hyperlink",
              "embedded-asset-block",
            ],
          },
          { enabledMarks: ["bold", "italic", "underline"] },
        ],
      },
    ],
  });

  // ── Site Settings ─────────────────────────────────────────────────
  await createAndPublish("siteSettings", {
    name: "Site Settings",
    description: "Global site configuration (singleton — create one entry)",
    displayField: "profession",
    fields: [
      {
        id: "profession",
        name: "Profession",
        type: "Symbol",
        required: false,
        localized: true,
      },
      {
        id: "email",
        name: "Email",
        type: "Symbol",
        required: false,
        localized: false,
      },
      {
        id: "heroImage",
        name: "Hero Image",
        type: "Link",
        linkType: "Asset",
        required: false,
        localized: false,
        validations: [{ linkMimetypeGroup: ["image"] }],
      },
      {
        id: "socialLinks",
        name: "Social Links",
        type: "Array",
        required: false,
        localized: false,
        items: {
          type: "Link",
          linkType: "Entry",
          validations: [{ linkContentType: ["socialLink"] }],
        },
      },
    ],
  });

  console.log("\n✅ All content types created and published!");
  console.log("\nNext steps:");
  console.log(
    "  1. Go to Settings → API keys in Contentful to create a Content Delivery API key"
  );
  console.log("  2. Start creating entries in the Content tab");
  console.log(
    "  3. Wire up the Angular app with the 'contentful' SDK using the delivery token"
  );
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  if (err.details?.errors) {
    console.error("Details:", JSON.stringify(err.details.errors, null, 2));
  }
  process.exit(1);
});

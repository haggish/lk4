/**
 * Contentful Content Population Script for laurakarki.com (lk4)
 *
 * Reads hardcoded content from the Angular source and creates
 * corresponding entries in Contentful via the Content Management API.
 *
 * Prerequisites:
 *   - Content model already created (via setup-contentful.mjs)
 *   - npm install contentful-management
 *   - Environment variables CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN
 *
 * Usage (PowerShell):
 *   $env:CONTENTFUL_SPACE_ID="your_space_id"
 *   $env:CONTENTFUL_MANAGEMENT_TOKEN="your_cma_token"
 *   node populate-contentful.mjs
 */

import { createClient } from "contentful-management";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const ENVIRONMENT_ID = "master";
const SITE_BASE_URL = "https://laurakarki.com";

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

// ── Helpers ────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function entryRef(id) {
  return { sys: { type: "Link", linkType: "Entry", id } };
}

function assetRef(id) {
  return { sys: { type: "Link", linkType: "Asset", id } };
}

function loc(enValue, fiValue) {
  const result = { "en-US": enValue };
  if (fiValue !== undefined) result["fi"] = fiValue;
  return result;
}

function locEn(value) {
  return { "en-US": value };
}

/** Convert plain text to Contentful Rich Text document */
function richTextFromPlain(text) {
  if (!text) {
    return {
      nodeType: "document",
      data: {},
      content: [
        {
          nodeType: "paragraph",
          data: {},
          content: [{ nodeType: "text", value: "", marks: [], data: {} }],
        },
      ],
    };
  }
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return {
    nodeType: "document",
    data: {},
    content: paragraphs.map((p) => ({
      nodeType: "paragraph",
      data: {},
      content: [{ nodeType: "text", value: p.trim(), marks: [], data: {} }],
    })),
  };
}

/**
 * Convert HTML string to Contentful Rich Text document.
 * Supports: <p>, <h3>, <h4>, <strong>, <em>, <a>, <br>, <blockquote>, <small>
 */
function richTextFromHtml(html) {
  if (!html) return richTextFromPlain("");

  const content = [];

  // Split by block-level elements
  // First, normalize: replace <br /> and <br> with newlines for inline handling
  let normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r\n/g, "\n");

  // Extract block elements
  const blockRegex =
    /<(h[2-4]|p|blockquote)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  const blocks = [];
  let match;
  let lastIndex = 0;

  while ((match = blockRegex.exec(normalized)) !== null) {
    // Text between blocks
    const between = normalized.slice(lastIndex, match.index).trim();
    if (between) {
      blocks.push({ type: "text", content: between });
    }
    blocks.push({ type: "block", tag: match[1].toLowerCase(), content: match[0] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  const remaining = normalized.slice(lastIndex).trim();
  if (remaining) {
    blocks.push({ type: "text", content: remaining });
  }

  if (blocks.length === 0) {
    blocks.push({ type: "text", content: normalized });
  }

  for (const block of blocks) {
    if (block.type === "block") {
      const tag = block.tag;
      const inner = block.content
        .replace(new RegExp(`^<${tag}[^>]*>`, "i"), "")
        .replace(new RegExp(`</${tag}>$`, "i"), "")
        .trim();

      if (tag === "blockquote") {
        content.push({
          nodeType: "blockquote",
          data: {},
          content: [
            {
              nodeType: "paragraph",
              data: {},
              content: parseInlineNodes(stripTags(inner)),
            },
          ],
        });
      } else if (tag.startsWith("h")) {
        const level = parseInt(tag[1]);
        content.push({
          nodeType: `heading-${level}`,
          data: {},
          content: parseInlineNodes(stripTags(inner)),
        });
      } else {
        // <p>
        content.push({
          nodeType: "paragraph",
          data: {},
          content: parseInlineNodes(inner),
        });
      }
    } else {
      // Plain text paragraph
      const lines = block.content.split(/\n+/).filter(Boolean);
      for (const line of lines) {
        content.push({
          nodeType: "paragraph",
          data: {},
          content: parseInlineNodes(line.trim()),
        });
      }
    }
  }

  if (content.length === 0) {
    content.push({
      nodeType: "paragraph",
      data: {},
      content: [{ nodeType: "text", value: "", marks: [], data: {} }],
    });
  }

  return { nodeType: "document", data: {}, content };
}

/** Parse inline HTML to Rich Text inline nodes (text, hyperlink, bold, italic) */
function parseInlineNodes(html) {
  if (!html) return [{ nodeType: "text", value: "", marks: [], data: {} }];

  const nodes = [];
  // Match <a>, <strong>, <b>, <em>, <i>, <small> tags
  const inlineRegex =
    /<(a)\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>|<(strong|b)>([\s\S]*?)<\/\4>|<(em|i)>([\s\S]*?)<\/\6>|<(small)>([\s\S]*?)<\/small>/gi;

  let lastIdx = 0;
  let m;

  while ((m = inlineRegex.exec(html)) !== null) {
    // Text before this match
    if (m.index > lastIdx) {
      const text = decodeEntities(html.slice(lastIdx, m.index));
      if (text) nodes.push({ nodeType: "text", value: text, marks: [], data: {} });
    }

    if (m[1] === "a") {
      // Hyperlink
      const href = m[2];
      const linkText = stripTags(m[3]);
      nodes.push({
        nodeType: "hyperlink",
        data: { uri: href },
        content: [
          { nodeType: "text", value: decodeEntities(linkText), marks: [], data: {} },
        ],
      });
    } else if (m[4]) {
      // <strong> or <b>
      nodes.push({
        nodeType: "text",
        value: decodeEntities(stripTags(m[5])),
        marks: [{ type: "bold" }],
        data: {},
      });
    } else if (m[6]) {
      // <em> or <i>
      nodes.push({
        nodeType: "text",
        value: decodeEntities(stripTags(m[7])),
        marks: [{ type: "italic" }],
        data: {},
      });
    } else if (m[8] === "small") {
      nodes.push({
        nodeType: "text",
        value: decodeEntities(stripTags(m[9])),
        marks: [],
        data: {},
      });
    }

    lastIdx = m.index + m[0].length;
  }

  // Remaining text
  if (lastIdx < html.length) {
    const text = decodeEntities(html.slice(lastIdx));
    if (text) nodes.push({ nodeType: "text", value: text, marks: [], data: {} });
  }

  if (nodes.length === 0) {
    nodes.push({ nodeType: "text", value: decodeEntities(stripTags(html)), marks: [], data: {} });
  }

  return nodes;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Check if entry with given content type and field value exists */
async function findEntry(contentTypeId, fieldName, fieldValue) {
  try {
    const entries = await client.entry.getMany({
      query: {
        content_type: contentTypeId,
        [`fields.${fieldName}`]: fieldValue,
        limit: 1,
      },
    });
    return entries.items.length > 0 ? entries.items[0] : null;
  } catch {
    return null;
  }
}

/** Create entry if it doesn't exist, return its ID */
async function createEntryIfNotExists(
  contentTypeId,
  fields,
  uniqueField,
  uniqueValue,
  label
) {
  const existing = await findEntry(contentTypeId, uniqueField, uniqueValue);
  if (existing) {
    console.log(`  ✓ ${label} already exists (${existing.sys.id})`);
    return existing.sys.id;
  }

  const entry = await client.entry.create({ contentTypeId }, { fields });
  console.log(`  + ${label} created (${entry.sys.id})`);
  await delay(200);
  return entry.sys.id;
}

/** Create an image asset from the live site URL and return the asset ID */
async function uploadImageAsset(localPath, title, description) {
  const fileName = localPath.split("/").pop();
  const contentType = "image/jpeg";
  const imageUrl = `${SITE_BASE_URL}/${localPath}`;

  // Check if asset already exists by title
  try {
    const existing = await client.asset.getMany({
      query: { "fields.title": title, limit: 1 },
    });
    if (existing.items.length > 0) {
      console.log(`  ✓ Asset "${title}" already exists (${existing.items[0].sys.id})`);
      return existing.items[0].sys.id;
    }
  } catch {
    // continue
  }

  // Create asset with external URL
  const asset = await client.asset.create(
    {},
    {
      fields: {
        title: locEn(title),
        description: locEn(description || ""),
        file: {
          "en-US": {
            contentType,
            fileName,
            upload: imageUrl,
          },
        },
      },
    }
  );
  await delay(300);

  // Process for all locales (needs full asset data including fields.file)
  await client.asset.processForAllLocales(
    { assetId: asset.sys.id },
    asset
  );
  await delay(2000);

  // Poll until processed
  let processed;
  for (let i = 0; i < 15; i++) {
    processed = await client.asset.get({ assetId: asset.sys.id });
    if (processed.fields.file?.["en-US"]?.url) break;
    await delay(1000);
  }

  await client.asset.publish({ assetId: asset.sys.id }, { sys: { version: processed.sys.version } });
  console.log(`  + Asset "${title}" created and published (${asset.sys.id})`);
  await delay(200);
  return asset.sys.id;
}

/** Publish an entry by ID */
async function publishEntry(entryId) {
  try {
    const entry = await client.entry.get({ entryId });
    await client.entry.publish({ entryId }, { sys: { version: entry.sys.version } });
    await delay(200);
  } catch (err) {
    console.warn(`  ⚠ Could not publish entry ${entryId}: ${err.message}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const createdIds = {
    cvSections: {},
    cvCategories: {},
    artworkCategories: {},
    socialLinks: {},
    cvEntries: [],
    artworks: [],
    archiveWorks: [],
    newsEntries: [],
    pageContents: [],
    siteSettings: null,
  };

  // ════════════════════════════════════════════════════════════════════════
  // 3a. LOOKUP ENTRIES (no references to other entries)
  // ════════════════════════════════════════════════════════════════════════

  console.log("\n── CV Sections ──");
  const cvSectionsData = [
    { slug: "education", en: "Education", fi: "Koulutus", sortOrder: 1 },
    {
      slug: "artistic-activity",
      en: "Artistic activity",
      fi: "Taiteellinen toiminta",
      sortOrder: 2,
    },
    { slug: "job-experience", en: "Job experience", fi: "Työkokemus", sortOrder: 3 },
  ];

  for (const s of cvSectionsData) {
    const id = await createEntryIfNotExists(
      "cvSection",
      {
        name: loc(s.en, s.fi),
        slug: locEn(s.slug),
        sortOrder: locEn(s.sortOrder),
      },
      "slug",
      s.slug,
      `CV Section: ${s.en}`
    );
    createdIds.cvSections[s.slug] = id;
  }

  console.log("\n── CV Categories ──");
  const cvCategoriesData = [
    { slug: "select-private-exhibitions", en: "Select private exhibitions", fi: "Valikoidut yksityisnäyttelyt", sortOrder: 1 },
    { slug: "group-exhibitions", en: "Group exhibitions", fi: "Yhteisnäyttelyt", sortOrder: 2 },
    { slug: "poem-performances", en: "Poem performances", fi: "Runoesitykset", sortOrder: 3 },
    { slug: "works-in-collections", en: "Works in collections", fi: "Teoksia kokoelmissa", sortOrder: 4 },
    { slug: "commissioned-works-public-art", en: "Commissioned works, public art", fi: "Tilaustyöt, julkinen taide", sortOrder: 5 },
    { slug: "grants", en: "Grants", fi: "Apurahat", sortOrder: 6 },
    { slug: "prizes", en: "Prizes", fi: "Palkinnot", sortOrder: 7 },
    { slug: "memberships", en: "Memberships", fi: "Jäsenyydet", sortOrder: 8 },
    { slug: "residences", en: "Residences", fi: "Residenssit", sortOrder: 9 },
    { slug: "other", en: "Other", fi: "Muut", sortOrder: 10 },
  ];

  const artisticActivitySectionId = createdIds.cvSections["artistic-activity"];
  for (const c of cvCategoriesData) {
    const id = await createEntryIfNotExists(
      "cvCategory",
      {
        name: loc(c.en, c.fi),
        slug: locEn(c.slug),
        sortOrder: locEn(c.sortOrder),
        section: locEn(entryRef(artisticActivitySectionId)),
      },
      "slug",
      c.slug,
      `CV Category: ${c.en}`
    );
    createdIds.cvCategories[c.slug] = id;
  }

  console.log("\n── Artwork Categories ──");
  const artworkCategoriesData = [
    { slug: "works", en: "Works", fi: "Teokset", sortOrder: 1 },
    { slug: "archive", en: "Archive", fi: "Arkisto", sortOrder: 2 },
  ];

  for (const ac of artworkCategoriesData) {
    const id = await createEntryIfNotExists(
      "artworkCategory",
      {
        name: loc(ac.en, ac.fi),
        slug: locEn(ac.slug),
        sortOrder: locEn(ac.sortOrder),
      },
      "slug",
      ac.slug,
      `Artwork Category: ${ac.en}`
    );
    createdIds.artworkCategories[ac.slug] = id;
  }

  console.log("\n── Social Links ──");
  const socialLinksData = [
    { name: { en: "Instagram", fi: "Instagram" }, url: "https://www.instagram.com/laurakarki/", icon: "instagram" },
    { name: { en: "Blog", fi: "Blogi" }, url: "http://laurakarki.blogspot.com", icon: "blog" },
    { name: { en: "Facebook", fi: "Facebook" }, url: "https://www.facebook.com/pages/Laura-K%C3%A4rki/651199511588351", icon: "facebook" },
    { name: { en: "Artists' Association of Finland", fi: "Kuvataitelijamatrikkeli" }, url: "http://www.kuvataiteilijamatrikkeli.fi/fi/taiteilijat/3084", icon: "aaf" },
    { name: { en: "Finnish Designers", fi: "Finnish Designers" }, url: "http://www.finnishdesigners.fi/portfolio/laura.karki", icon: "finnishdesigners" },
  ];

  for (const sl of socialLinksData) {
    const id = await createEntryIfNotExists(
      "socialLink",
      {
        name: loc(sl.name.en, sl.name.fi),
        url: locEn(sl.url),
        icon: locEn(sl.icon),
      },
      "url",
      sl.url,
      `Social Link: ${sl.name.en}`
    );
    createdIds.socialLinks[sl.icon] = id;
  }

  // Publish all lookup entries
  console.log("\n── Publishing lookup entries ──");
  const lookupIds = [
    ...Object.values(createdIds.cvSections),
    ...Object.values(createdIds.cvCategories),
    ...Object.values(createdIds.artworkCategories),
    ...Object.values(createdIds.socialLinks),
  ];
  for (const id of lookupIds) {
    await publishEntry(id);
  }
  console.log(`  ✓ Published ${lookupIds.length} lookup entries`);

  // ════════════════════════════════════════════════════════════════════════
  // 3b. CONTENT ENTRIES
  // ════════════════════════════════════════════════════════════════════════

  // ── CV Entries: Education ──────────────────────────────────────────────
  console.log("\n── CV Entries: Education ──");
  const educationSectionId = createdIds.cvSections["education"];
  const educationEntries = [
    { time: "2006", fi: "Taiteen maisteri, Taideteollinen korkeakoulu, Helsinki", en: "Master of Arts, UIAH, Helsinki" },
    { time: "2002", fi: "Tekstiilisuunnitteluartenomi, EVTEK Muotoiluinstituutti, Vantaa", en: "Textile design Bachelor of Culture and Arts, EVTEK Institute of Design, Vantaa" },
    { time: "1998", fi: "Keramiikka-alan artesaani, Tammelan käsi- ja taideteollisuusoppilaitos, Tammela", en: "Artesan of Ceramics, Tammela Institute of Arts and Crafts" },
    { time: "2018–", fi: "Kuvataideopettajan pedagogiset opinnot AmO, HAMK", en: "Art teacher's pedagogical studies, Häme University of Applied Sciences (HAMK), Hämeenlinna, Finland" },
    { time: "2011–2013", fi: "Lyriikan verkkokurssi, Etäopisto, Orivesi", en: "Lyrics remote course, Etäopisto, Orivesi" },
    { time: "2011", fi: "Suomen Taiteilijaseuran managerointihanke (Kira Sjöberg)", en: "Finnish Artists Association management project by Kira Sjöberg" },
  ];

  let sortOrder = 1;
  for (const entry of educationEntries) {
    const id = await createEntryIfNotExists(
      "cvEntry",
      {
        time: locEn(entry.time),
        content: loc(entry.en, entry.fi),
        section: locEn(entryRef(educationSectionId)),
        sortOrder: locEn(sortOrder),
      },
      "sortOrder",
      String(sortOrder),
      `Education: ${entry.en.substring(0, 50)}`
    );
    createdIds.cvEntries.push(id);
    sortOrder++;
  }

  // ── CV Entries: Artistic Activity subsections ─────────────────────────
  const subsectionMap = {
    selectPrivateExhibitions: "select-private-exhibitions",
    groupExhibitions: "group-exhibitions",
    poemPerformances: "poem-performances",
    worksInCollections: "works-in-collections",
    commissionedWorksPublicArt: "commissioned-works-public-art",
    grants: "grants",
    prizes: "prizes",
    memberships: "memberships",
    residences: "residences",
    other: "other",
  };

  const subsectionEntries = {
    selectPrivateExhibitions: [
      { time: "2026", fi: "Orimattilan taidemuseo", en: "Orimattila Art Museum" },
      { time: "2025", fi: "Galleria Halmetoja, Helsinki (Toukokuu)", en: "Galleria Halmetoja, Helsinki (May)" },
      { time: "2025", fi: "Galleria Halmetoja, Helsinki", en: "Gallery Halmetoja, Helsinki" },
      { time: "2023", fi: "Galleria Halmetoja Mänttä, window exhibition, Mänttä", en: "Gallery Halmetoja Mänttä, window exhibition, Mänttä" },
      { time: "2021–2022", fi: "Kulturhaus Karlshorst, Berliini", en: "Kulturhaus Karlshorst, curator Dr. Sylvia Metz (with Niina Lehtonen-Braun), Berlin" },
      { time: "2019", fi: "ARTag Gallery, Helsinki", en: "ARTag Gallery, Helsinki" },
      { time: "2018", fi: "AGK, Tommyknocker Craft Beer Bar, Berliini", en: "AGK, Tommyknocker Craft Beer Bar, Helsinki" },
      { time: "2014", fi: "Galleria Katariina, Helsinki", en: "Gallery Katariina, Helsinki" },
      { time: "2014", fi: "Showroom Berliini, Berliini", en: "Showroom Berliini, Berlin" },
      { time: "2014", fi: "Galleria Katariina, Helsinki", en: "Gallery Katariina, Helsinki" },
      { time: "2012", fi: "Vuotalon galleria, Helsinki (kutsuttuna)", en: "Vuotalon galleria (invited)" },
      { time: "2011", fi: "Galleria Jangva, Helsinki", en: "Jangva Gallery, Helsinki" },
      { time: "2011", fi: "Taidekeskus Mältinrannan Galleria, Tampere", en: "Art Centre Mältinranta Gallery, Tampere" },
      { time: "2009", fi: "Galleria Kajava, Helsinki", en: "Gallery Kajava, Helsinki" },
      { time: "2009", fi: "Galleria Uusi Kipinä, Lahti", en: "Gallery Uusi Kipinä, Lahti" },
      { time: "2009", fi: "Taidekeskus Ahjo, Joensuu", en: "Art Centre Ahjo, Joensuu" },
      { time: "2008", fi: "00130Gallery, Helsinki", en: "00130Gallery, Helsinki" },
      { time: "2008", fi: "Galleria Rajatila, Tampere", en: "Gallery Rajatila, Tampere" },
      { time: "2007", fi: "Kanneltalon Galleria, Helsinki", en: "Kanneltalo Gallery, Helsinki" },
    ],
    groupExhibitions: [
      { time: "2025", fi: "Verein Berliner Künstler: 11th EMOP Berlin 2025 - The NEW YOU-WE-ME, Berliini, Saksa", en: "Verein Berliner Künstler: 11th EMOP Berlin 2025 - The NEW YOU-WE-ME, Berliini, Saksa" },
      { time: "2024", fi: "Finnland-Institut Berlin: Visiting Art/ists exhibition, Berliini, Saksa", en: "Finnland-Institut Berlin: Visiting Art/ists exhibition, Berlin, Germany" },
      { time: "2024", fi: "Verein Berliner Künstler: Das Gesicht, ein Portrait, Berliini, Saksa", en: "Verein Berliner Künstler: Das Gesicht, ein Portrait, Berlin, Germany" },
      { time: "2024", fi: "Hilbertraum: Hanging a thread, Berliini, Saksa", en: "Hilbertraum: Hanging a thread, Berlin, Germany" },
      { time: "2024", fi: "Lappeenrannan taidemuseo: Normaalit ruokajuomat ja jokapäiväinen leipämme, Lappeenranta", en: "Lappeenranta Art Museum: Normaalit ruokajuomat ja jokapäiväinen leipämme, Lappeenranta" },
      { time: "2024", fi: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 60, Heimat und vertraute Orte, Berliini, Saksa", en: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 60, Heimat und vertraute Orte, Berlin, Germany" },
      { time: "2024", fi: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 58, Entfremdung durch Willkur in Medium Fotografie, Berliini, Saksa", en: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 58, Entfremdung durch Willkur in Medium Fotografie, Berlin, Germany" },
      { time: "2024", fi: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 55, Kinetische Kunst und andere Variationen, Berliini, Saksa", en: "Atelierhof Kreuzberg: MONDAY ART SALON, Kapitel 55, Kinetische Kunst und andere Variationen, Berlin, Germany" },
      { time: "2024", fi: "Verein Berliner Künstler: UPDATE 2024, Berliini, Saksa", en: "Verein Berliner Künstler: UPDATE 2024, Berlin, Germany" },
      { time: "2023", fi: "Gallery Halmetoja: Jouluglögit, Helsinki", en: "Gallery Halmetoja: Jouluglögit, Helsinki" },
      { time: "2023", fi: "SNOW Winter Salon, Snow Gallery, Berliini, Saksa", en: "SNOW Winter Salon, Snow Gallery, Berlin, Germany" },
      { time: "2023", fi: "Verein Berliner Künstler: Die poetische Seite, Berliini, Saksa", en: "Verein Berliner Künstler: Die poetische Seite, Berlin, Germany" },
      { time: "2023", fi: "Blummen Marsano: ART and Nature II, Natur in der zeitgenössichen Kunst, Berliini, Saksa", en: "Blummen Marsano: ART and Nature II, Natur in der zeitgenössichen Kunst, Berlin, Germany" },
      { time: "2023", fi: "Verein Berliner Künstler: UPDATE 2023, Berliini, Saksa", en: "Verein Berliner Künstler: UPDATE 2023, Berlin, Germany" },
      { time: "2023", fi: "Verein Berliner Künstler: DIE NEUEN 2023, Berliini, Saksa", en: "Verein Berliner Künstler: DIE NEUEN 2023, Berlin, Germany" },
      { time: "2022", fi: "Gallery Halmetoja, Helsinki", en: "Gallery Halmetoja, Helsinki" },
      { time: "2022", fi: "Riihisaari - Savonlinnan museo: H20 Veden Henki, Savonlinna", en: "Riihisaari - Savonlinna art museum: H20 Spirit of Water, Savonlinna" },
      { time: "2021–2022", fi: "Aineen taidemuseo: Unta ja aikaa - Uusia hankintoja Aineen taidemuseon kokoelmasta, Tornio", en: "Aine Art Museum: Dream and Time, New Acquisitions from Aine Art Museum Collections, Tornio" },
      { time: "2021", fi: "Nastolan kesänäyttely: Luontoretki, Nastola", en: "Nastola Summer Exhibition: Nature Trip, Nastola" },
      { time: "2020–2021", fi: "Aineen taidemuseo: Eila - nainen kokoelman takana, Tornio", en: "Aine Art Museum: Eila - the Woman behind the Collection, Tornio" },
      { time: "2020", fi: "Gangneung Art Centre, Gangneung, Etelä-Korea", en: "Gangneung Art Centre, Gangneung, South Korea" },
      { time: "2020", fi: "Gallery MHK, Seoul, Etelä-Korea", en: "Gallery MHK, Seoul, South Korea" },
      { time: "2019", fi: "Nastolan kesänäyttely: Kuvakirja, Nastola", en: "Nastola Summer Exhibition: Picture Book, Nastola" },
      { time: "2018", fi: "Taidekeskus Antares: Päästä meidät pahasta, Sippola", en: "Art Centre Antares: Deliver Us From Evil, Sippola" },
      { time: "2018", fi: "GEDOK Galerie: Fragmentierte Realität, Berliini, Saksa", en: "GEDOK Galerie: Fragmentierte Realität, Berlin, Germany" },
      { time: "2018", fi: "Soft Within/Straße 55 Gallery: Soft Spaces, Berliini, Saksa", en: "Soft Within/Straße 55 Gallery: Soft Spaces, Berlin, Germany" },
      { time: "2018", fi: "GEDOK Galerie: Neuaufnahmen, Berliini, Saksa", en: "GEDOK Galerie: Neuaufnahmen, Berlin, Germany" },
      { time: "2017", fi: "Prenzlauer Studio/Kunst-Kollektiv: Soft Within presents Leftovers, Berliini, Saksa", en: "Prenzlauer Studio/Kunst-Kollektiv: Soft Within presents Leftovers, Berlin, Germany" },
      { time: "2017", fi: "Kunstverein K41: Kunst & Religion, Köln, Saksa", en: "Kunstverein K41: Kunst & Religion, Cologne, Germany" },
      { time: "2017", fi: "Heinolan taidemuseo: Vielä hetki lapsena, Heinola", en: "Heinola Museum of Art: Vielä hetki lapsena, Heinola" },
      { time: "2017", fi: "Wiurilan kesänäyttely: Näkymättömät reitit", en: "Wiurila summer: Näkymättömät reitit, Salo" },
      { time: "2017", fi: "Was der Himmel erlaubt, GEDOK-galleria, Berliini, Saksa", en: "Was der Himmel erlaubt, GEDOK Galerie, Berlin, Germany" },
      { time: "2017", fi: "Feelings don't last forever, with Soft Within, Berliini, Saksa", en: "Feelings don't last forever, with Soft Within, Berlin, Germany" },
      { time: "2017", fi: "Art Fair Suomi, Helsinki", en: "Art Fair Finland, Helsinki" },
      { time: "2017", fi: "Äänitaiteen Sauna, Tempo Dokumentärfestival in Stockholm, Finlandsinsitutet, Tukholma", en: "Sound Sauna, Tempo Documentary Festival in Stockholm, Finlandsinsitutet, Sweden" },
      { time: "2017", fi: "Varkauden taidemuseo, Varkaus", en: "Varkaus Museum of Art, Varkaus" },
      { time: "2016", fi: "Kuka kuuntelee köyhää? Lapinlahden lähteen käytävägalleria, Helsinki (kutsuttuna)", en: "Kuka kuuntelee köyhää? (Who listens to the poor?) Lapinlahti spring corridor gallery, Helsinki (invited)" },
      { time: "2016", fi: "Helsingin taiteilijaseuran joulunäyttely, Helsinki", en: "Christmas Exhibition of the Helsinki Artists' Association, Helsinki" },
      { time: "2016", fi: "Särö-näyttely, Suomen Pohjoismainen taideliitto, Almintalon galleria, Loviisa", en: "Särö, Nordic Art Association in Finland, Almintalo gallery, Loviisa" },
      { time: "2016", fi: "Toolbox gallery, Menagerie, Berliini, Saksa", en: "Toolbox gallery, Menagerie, Berlin, Germany" },
      { time: "2016", fi: "Arteground Festival Baltic 2010-2016, Alltogether, Viljandi, Viro", en: "Arteground Festival Baltic 2010-2016, Alltogether, Viljandi, Estonia" },
      { time: "2015", fi: "Galleria K, Vantaa", en: "Galleria K, Vantaa" },
      { time: "2014", fi: "Kuusiston kesä, kesänäyttely, Kaarina", en: "Kuusisto Summer, summer exhibition, Kaarina" },
      { time: "2014", fi: "Frankfurtin Suomi-asema, Westhafenpier-näyttelytila, Frankfurt, Saksa", en: "Frankfurt Finland-Centrum, Westhafenpier exhibition space, Frankfurt, Germany" },
      { time: "2014", fi: "Out and About, Vanha Kappalaisentalu, Porvoo", en: "Out and About, Vanha Kappalaisentalu, Porvoo" },
      { time: "2013", fi: "Import Shop Berlin, Marimekon kattauksessa installaatio Kuokkavieraat, Berliini, Saksa", en: "Import Shop Berlin, Marimekko department installation Gatecrashers, Berlin, Germany" },
      { time: "2013", fi: "Galleria Katariina, YLLÄTYS, Helsingin taiteilijaseuran jyrytetty joulunäyttely", en: "Gallery Katariina, SURPRISE, Helsinki Artists' Association Jury-based Christmas Exhibition" },
      { time: "2013", fi: "Out and About - ryhmä Taiteilijat O Ry:n taiteilijoita, Estonian Museum of Applied Art and Design (ETOM), Viro", en: "Out and About - a group of Taiteilijat O Ry artists, Estonian Museum of Applied Art and Design (ETOM), Estonia" },
      { time: "2012", fi: "Ars Auttoisten kesänäyttely, Auttoinen (kutsuttuna)", en: "Ars Auttoinen summer exhibition, Auttoinen (invited)" },
      { time: "2012", fi: "Atelierhof Kreuzberg, Berliini, Saksa", en: "Atelierhof Kreuzberg, Berlin, Germany" },
      { time: "2011", fi: "Vesi - tunteita ja aistimuksia, Wäinö Aaltosen taidemuseo, Turku", en: "Water - feelings and senses, Wäinö Aaltonen art museum, Turku" },
      { time: "2011", fi: "NYT2011 - Together, Raision Taidemuseo Harkko, Raisio", en: "NYT2011 - Together, Harkko Art museum of Raisio, Raisio" },
      { time: "2011", fi: "ArteGround Art Festival, Viljandi, Viro", en: "ArteGround Art Festival, Viljandi, Estonia" },
      { time: "2011", fi: "Oon kaupungissa, Ornamon 100v-kaupunkitaidetapahtuma, Helsinki", en: "Oon Kaupungissa, Ornamo 100 years city art event, Helsinki" },
      { time: "2011", fi: "Factory Superstars, Helsingin Kaapelitehdas", en: "Factory Superstars, Cable Factory, Helsinki" },
      { time: "2010", fi: "Mennään metsään, Helsingin Taiteilijaseuran kesänäyttely, Galleria Rantakasarmi", en: "To The Woods, Helsinki Artists' Association summer exhibition, Gallery Rantakasarmi" },
      { time: "2010", fi: "ArtHelsinki2010, Helsingin Messukeskus", en: "ArtHelsinki2010, Helsinki Fair Centre" },
      { time: "2010", fi: "Art Fair Suomi 2010, Helsingin Kaapelitehdas", en: "Art Fair Suomi 2010, Cable Factory, Helsinki" },
      { time: "2010", fi: "Cable Fair 2010, Kaapelitehtaan Valssaamo", en: "Cable Fair 2010, Rolling Mill of Cable Factory, Helsinki" },
      { time: "2010", fi: "Ornamon teosmyynti, Helsingin Kaapelitehdas", en: "Ornamo Work Sales, Cable Factory, Helsinki" },
      { time: "2009", fi: "Art Helsinki 2009, Wanha Satama, Helsinki", en: "Art Helsinki 2009, Wanha Satama, Helsinki" },
      { time: "2009", fi: "OTTO-näyttely, Circulo de Bellas Artes, Madrid, Espanja", en: "OTTO exhibition, Circulo de Bellas Artes, Madrid, Spain" },
      { time: "2009", fi: "Art Fair Suomi, Helsingin Kaapelitehdas", en: "Art Fair Suomi, Cable Factory, Helsinki" },
      { time: "2009", fi: "Vihdin taideraitti, Takaisin luontoon, Vihti", en: "Vihdin Art Route, Back to the nature, Vihti" },
      { time: "2009", fi: "Money, money, money, Raision taidemuseo Harkko", en: "Money, money, money, Raisio Art Museum Harkko" },
      { time: "2008", fi: "OTTO Taiteilijat O ry:n esittäytymisnäyttely, Vantaan taidemuseo", en: "OTTO Artists O ry Introduction Exhibition, Vantaan Art Museum" },
      { time: "2008", fi: "Rytmiä! NYT08 Naantalin ja Raision nykytaiteen kesä, Raision museo Harkko", en: "Rhythm! NYT08 Naantali and Raisio Contemporary Summer, Raisio Art Museum Harkko" },
      { time: "2007", fi: "Papru - Valtakunnallinen paperitaidenäyttely, G.A. Serlachius-museo, Mäntän kuvataideviikot", en: "Papru - National paper art exhibition, G.A. Serlachius Museum, Mänttä visual arts weeks" },
      { time: "2006", fi: "Masters of Arts, Mediakeskus Lume, Helsinki", en: "Masters of Arts, Media Centre Lume, Helsinki" },
      { time: "2006", fi: "UUsiks, Käsi- ja taideteollisuuskeskus Verkaranta, Tampere", en: "Again, Arts and crafts centre Verkaranta, Tampere" },
      { time: "2005", fi: "Kuvan äärellä, Mediakeskus Lumeen galleria, Helsinki", en: "By the picture, Media Centre Lume Gallery, Helsinki" },
      { time: "2005", fi: "INFORM - TR1 Finnlayson, Tampere", en: "INFORM - TR1 Finnlayson, Tampere" },
      { time: "2005", fi: "VOIMAT - Fiskarsin kesänäyttely, Pohja", en: "VOIMAT - Fiskars summer exhibition, Pohja" },
      { time: "2005", fi: "Art of Analyste, Sanomatalo, Helsinki", en: "Art of Analyste, Sanomatalo, Helsinki" },
      { time: "2005", fi: "Hiusmurtumia, Taitemia-galleria, Kuopio; Wetterhoff-galleria, Hämeenlinna; Atski-galleria, Helsinki; Lahden taidepanimon pullopesulan galleria, Lahti", en: "Microruptures, Taitemia Gallery, Kuopio; Wetterhoff Gallery, Hämeenlinna; Atski Gallery, Helsinki; Lahti Art Brewery's Bottle Washery's Gallery, Lahti" },
      { time: "2005", fi: "INFORM - Design Forum, Helsinki", en: "INFORM - Design Forum, Helsinki" },
      { time: "2004", fi: "Ceramega 04, Voipaalan taidekeskus, Valkeakoski", en: "Ceramega 04, Voipaala Art Centre, Valkeakoski" },
      { time: "2004", fi: "Taidetta julkiseen tilaan, Nordiska Investment Bank, Helsinki", en: "Art for public space, Nordiska Investment Bank, Helsinki" },
      { time: "2004", fi: "Kuvan äärellä, Mediakeskus Lumeen galleria, Helsinki", en: "By the picture, Media Centre Lumee Gallery, Helsinki" },
      { time: "2003", fi: "Tahto & Taito-kilpailun parhaimmisto, Sanomatalo, Helsinki", en: "The best of Will & Skill competition, Sanomatalo, Helsinki" },
      { time: "2003", fi: "Déjà-vu -kierrätystaidetta Mediakeskus Lumeen galleria, Helsinki", en: "Déjà-vu - recycling art, Media Centre Lume Gallery, Helsinki" },
    ],
    poemPerformances: [
      { time: "2021", fi: "Pieni runofestivaali, Aska, Sodankylä", en: "Small poem festival, Aska, Sodankylä" },
      { time: "2018", fi: "Soft Within, Spoken Word Night, On Growth, Berliini, Saksa", en: "Soft Within, Spoken Word Night, On Growth, Berlin, Germany" },
    ],
    worksInCollections: [
      { time: "2025", fi: "Miettinen Collection", en: "Miettinen Collection" },
      { time: "2024", fi: "Suomen valtion taidekokoelmat", en: "Finnish State Art Commission" },
      { time: "2024", fi: "Mari Mannisen kokoelmat", en: "Mari Manninen Art Collection" },
      { time: "2019", fi: "Lahden visuaalisten taiteiden museo Malva, Lahti", en: "Lahti Museum of Visual Arts Malva, Lahti" },
      { time: "2019", fi: "Aineen taidemuseo, Tornio", en: "Aine Art Museum, Tornio" },
      { time: "2019", fi: "Yksityiset kokoelmat", en: "Private collections" },
      { time: "2016", fi: "Yksityiset kokoelmat", en: "Private collections" },
      { time: "2013", fi: "Yksityiset kokoelmat", en: "Private collections" },
      { time: "2012", fi: "Suomen valtion taidekokoelmat", en: "Finnish State Art collections" },
      { time: "2008", fi: "Suomen käsityön museo, Yksin - matkalaukkulamput, Jyväskylä", en: "Finnish arts & crafts museum, Alone - luggage lamps, Jyväskylä" },
      { time: "2004", fi: "Borenius & Kemppisen taidekokoelmat, 'New Story', Helsinki", en: "Borenius & Kemppinen collection, 'New Story', Helsinki" },
    ],
    commissionedWorksPublicArt: [
      { time: "2004", fi: "Hotelli Hilton, keramiikkatyö 'Ei valmis koskaan', Helsinki", en: "Hotel Hilton, ceramics work 'Never Finished', Helsinki" },
      { time: "2001", fi: "Helsingin messukeskus, Kipinä ja Ponnistus", en: "Helsinki Fair Centre, Spark and Effort" },
      { time: "2000", fi: "Helsingin Messukeskus, Mahdollisuuksia", en: "Helsinki Fair Centre, Possibilities" },
    ],
    grants: [
      { time: "2024", fi: "Taiteen edistämiskeskus, 6 kk:n näyttöapuraha", en: "Taike Arts Promotion Centre, Public display for 6 months of artistic work" },
      { time: "2022", fi: "Taiteen edistämiskeskus, Corona-apuraha", en: "Taike Arts Promotion Centre, Corona grant" },
      { time: "2021", fi: "Taiteen edistämiskeskus, Corona-apuraha", en: "Taike Arts Promotion Centre, Corona grant" },
      { time: "2021", fi: "Frame, taidekirjalle", en: "Frame Contemporary Art Finland, for art book" },
      { time: "2020", fi: "Taiteen edistämiskeskus, Corona-apuraha", en: "Taike Arts Promotion Centre, Corona grant" },
      { time: "2020", fi: "Ornamo Ry, 3D-keramiikkaan", en: "Ornamo Ry, for 3D ceramics" },
      { time: "2014", fi: "Taiteen edistämiskeskus, apuraha kansainvälisiin hankkeisiin, henkilökohtainen", en: "Taike Arts Promotion Centre, personal grant for international projects" },
      { time: "2008", fi: "Oskar Öflunds Stiftelse", en: "Oskar Öflunds Stiftelse" },
      { time: "2006", fi: "Valtion muotoilutoimikunta", en: "National Design Committee" },
    ],
    prizes: [
      { time: "2005", fi: "1. sija, Life Science Center-taideteoskilpailu", en: "1st place, Life Science Center artwork competition" },
    ],
    memberships: [
      { time: "", fi: "Verein Berliner Künstler", en: "Verein Berliner Künstler" },
      { time: "", fi: "Suomen kuvanveistäjäliitto", en: "The Association of Finnish Sculptors" },
      { time: "", fi: "BBK Berlin", en: "BBK Berlin" },
      { time: "", fi: "Taiteilijat O Ry, varsinainen jäsen", en: "Artists O Ry (full member)" },
      { time: "", fi: "Kuvasto Ry", en: "Kuvasto Ry" },
      { time: "", fi: "Helsingin taiteilijaseura", en: "Artist Society of Helsinki" },
    ],
    residences: [
      { time: "04/2014", fi: "Sfakiotes-residenssi, Lefkada, Kreikka", en: "Sfakiotes residency programme, Lefkada, Greece" },
      { time: "09/2013", fi: "Suomen ateljeesäätiö, Marbella, Espanja", en: "Finnish Atelier Foundation, Marbella, Spain" },
      { time: "08/2011", fi: "Suomen ateljeesäätiö, Firenze, Italia", en: "Finnish Atelier Foundation, Italy, Florence" },
      { time: "01–02/2010", fi: "Suomen ateljeesäätiö, Firenze, Italia", en: "Finnish Atelier Foundation, Italy, Florence" },
      { time: "03/2009", fi: "Pohjois-Karjalan taidetoimikunta, Intia, Kochi", en: "North Carelian art foundation, India, Kochi" },
      { time: "2008", fi: "Uudenmaan taidetoimikunta, Saksa, Berliini", en: "Uusimaa art foundation, Germany, Berlin" },
      { time: "2007", fi: "Taiteilijat O, Meksiko, Oaxaca", en: "Artists O, Mexico, Oaxaca" },
    ],
    other: [
      { time: "2007", fi: "Taiteilijat O, marraskuun kuukauden taiteilija", en: "Artists O, November artist of the month" },
      { time: "2005", fi: "YLE1, Lauantaivekkari, viikon taiteilija", en: "YLE1, Lauantaivekkari, artist of the week" },
    ],
  };

  for (const [subsectionKey, slug] of Object.entries(subsectionMap)) {
    const entries = subsectionEntries[subsectionKey];
    if (!entries || entries.length === 0) continue;

    console.log(`\n── CV Entries: ${slug} ──`);
    const categoryId = createdIds.cvCategories[slug];

    for (const entry of entries) {
      const fields = {
        content: loc(entry.en, entry.fi),
        section: locEn(entryRef(artisticActivitySectionId)),
        category: locEn(entryRef(categoryId)),
        sortOrder: locEn(sortOrder),
      };
      if (entry.time) {
        fields.time = locEn(entry.time);
      }

      const id = await createEntryIfNotExists(
        "cvEntry",
        fields,
        "sortOrder",
        String(sortOrder),
        `${entry.en.substring(0, 60)}`
      );
      createdIds.cvEntries.push(id);
      sortOrder++;
    }
  }

  // ── CV Entries: Job Experience ──────────────────────────────────────────
  console.log("\n── CV Entries: Job Experience ──");
  const jobSectionId = createdIds.cvSections["job-experience"];
  const jobEntries = [
    { time: "2014–", fi: "Showroom Berliini, perustajajäsen Hanna Ojamon ja Tero Puhan kanssa", en: "Showroom Berliini, founder together with Hanna Ojamo and Tero Puha" },
    { time: "2012–", fi: "Berliinin Suomi-koulu, taidetyöpajoja", en: "Finnish school of Berlin, art workshops" },
    { time: "2007–", fi: "Freelancer-kuvataideopettaja, mm. Espoon kuvataidekoulu, Tuusulan kunnan lasten kulttuurin taidepajoja, Helsingin kaupungin opetusvirasto Sininen verstas, Vantaan taidemuseon työpajoja", en: "Freelancer visual arts teacher, Espoo school of visual arts, Tuusula county art workshops for children, Helsinki education bureau Sininen Verstas, Vantaa art museum workshops, and others" },
    { time: "2007–2008", fi: "Kurssisihteeri, Espoon kuvataidekoulu", en: "Course secretary, Espoo school of visual arts" },
    { time: "2004–2006", fi: "Iltapäiväkerhon ohjaaja, Kaisaniemen ala-aste, Helsinki", en: "Afternoon kids club counsellor, Kaisaniemi Grade School, Helsinki" },
    { time: "2002–2007", fi: "Marimekko Oyj, Helsinki", en: "Marimekko Oyj, Helsinki" },
    { time: "2001–2002", fi: "Kuvataideopettaja, Soukan taideseura, kuvataidekoulu Tatavuu, Espoo", en: "Visual arts teacher, Soukka art society, visual arts school Tatavuu, Espoo" },
  ];

  for (const entry of jobEntries) {
    const id = await createEntryIfNotExists(
      "cvEntry",
      {
        time: locEn(entry.time),
        content: loc(entry.en, entry.fi),
        section: locEn(entryRef(jobSectionId)),
        sortOrder: locEn(sortOrder),
      },
      "sortOrder",
      String(sortOrder),
      `Job: ${entry.en.substring(0, 50)}`
    );
    createdIds.cvEntries.push(id);
    sortOrder++;
  }

  // ── Artwork Images & Entries ──────────────────────────────────────────
  console.log("\n── Artworks (Works) ──");
  const worksCategoryId = createdIds.artworkCategories["works"];
  const worksData = [
    { fi: { name: "Villisika Grunewaldin metsässä", desc: "2022, tuftattu erilaisilla langoilla, 29 x 29 x 3 cm, valokuva Daniel Poller" }, en: { name: "A wild boar in Grunewald forest", desc: "2022, Tufted different yarns, 29 x 29 x 3 cm, photo Daniel Poller" } },
    { fi: { name: "Vapaa karhu", desc: "2022, käsintuftattu minimatto, 45 x 45 x 2 cm" }, en: { name: "Bear free", desc: "2022, Hand-tufted mini rug, 45 x 45 x 2 cm" } },
    { fi: { name: "Laiska berliiniläinen koira", desc: "2022, 45 x 45 x 2 cm" }, en: { name: "Lazy Berlin dog", desc: "2022, 45 x 45 x 2 cm" } },
    { fi: { name: "Iloinen berliiniläinen sammakko", desc: "2022, käsintuftattu minimatto, 43 x 43 x 2 cm" }, en: { name: "Happy Berlin frog", desc: "2022, Hand-tufted mini rug, 43 x 43 x 2 cm" } },
    { fi: { name: "Seepra-aasi jäällä", desc: "2023, tuftattu erilaisilla langoilla, 28 x 29 x 2,5 cm" }, en: { name: "Zebra-donkey on ice", desc: "2023, Tufted different yarns, 28 x 29 x 2,5 cm" } },
    { fi: { name: "Naakan ensilento pesästä", desc: "2023, tuftattu erilaisilla langoilla, 29 x 26 x 2,5 cm" }, en: { name: "Jackdaw's maiden flight from nest", desc: "2023, Tufted different yarns, 29 x 26 x 2,5 cm" } },
    { fi: { name: "Hevonen ylensyö heinää", desc: "2023, tuftattu erilaisilla langoilla, 25 x 26 x 2,5 cm" }, en: { name: "Horse overeating hay", desc: "2023, Tufted different yarns, 25 x 26 x 2,5 cm" } },
    { fi: { name: "Yllätetty pupu", desc: "2023, tuftattu erilaisilla langoilla, 29 x 30 x 2,5 cm" }, en: { name: "Surprised bunny", desc: "2023, Tufted different yarns, 29 x 30 x 2,5 cm" } },
    { fi: { name: "Big mouth bitch", desc: "2020, Öljypastellit MDF:lle, 60 x 80 cm" }, en: { name: "Big mouth bitch", desc: "2020, Oil pastels on MDF, 60 x 80 cm" } },
    { fi: { name: "Bad mouth", desc: "2020, Öljypastellit MDF:lle, 60 x 80 cm" }, en: { name: "Bad mouth", desc: "2020, Oil pastels on MDF, 60 x 80 cm" } },
    { fi: { name: "Matti", desc: "2020, Öljypastellit MDF:lle, 60 x 80 cm" }, en: { name: "Matti", desc: "2020, Oil pastels on MDF, 60 x 80 cm" } },
    { fi: { name: "Jotain mitä en olisi ikinä halunnut kuulla", desc: "2020, Öljypastellit MDF:lle, 60 x 80 cm" }, en: { name: "Something what I never wanted to hear", desc: "2020, Oil pastels on MDF, 60 x 80 cm" } },
    { fi: { name: "Rajanylittäjä", desc: "2020, Öljypastellit MDF:lle, 45 x 35 cm" }, en: { name: "Border crosser", desc: "2020, Oil pastels on MDF, 45 x 35 cm" } },
    { fi: { name: "What if I drop you", desc: "2020, Öljypastellit kankaalle, 52 x 43 cm" }, en: { name: "What if I drop you", desc: "2020, Oil pastels on canvas, 52 x 43 cm" } },
    { fi: { name: "Who are you", desc: "2020, Öljypastellit puulle, 60 x 80 cm" }, en: { name: "Who are you", desc: "2020, Oil pastels on wood, 60 x 80 cm" } },
    { fi: { name: "Moving out of childhood home", desc: "2015, Gouache, vesivärit, akryyli pahville, 105,5 x 75 x 3,5 cm" }, en: { name: "Moving out of childhood home", desc: "2015, Gouache, watercolor, acrylic on cardboard, 105,5 x 75 x 3,5 cm" } },
    { fi: { name: "Looking for the childhood", desc: "2015, Gouache, vesivärit, akryyli pahville, 105 x 75 x 4 cm" }, en: { name: "Looking for the childhood", desc: "2015, Gouache, watercolor, acrylic on cardboard, 105 x 75 x 4 cm" } },
    { fi: { name: "Under the rainbow", desc: "2015, Gouache, vesivärit, akryyli pahville, 34,6 x 33,6 cm" }, en: { name: "Under the rainbow", desc: "2015, Gouache, watercolor, acrylic on cardboard, 34,6 x 33,6 cm" } },
    { fi: { name: "Dachshund fish", desc: "2023, mixed media, 27 x 71 x 24 cm, valokuva Daniel Poller" }, en: { name: "Dachshund fish", desc: "2023, mixed media, 27 x 71 x 24 cm, photo by Daniel Poller" } },
    { fi: { name: "Family Butterfly", desc: "2022, sekatekniikka, valokuva Daniel Poller" }, en: { name: "Family Butterfly", desc: "2022, mixed media, photo by Daniel Poller" } },
    { fi: { name: "Family Snake", desc: "2023, sekatekniikka, valokuva Daniel Poller" }, en: { name: "Family Snake", desc: "2023, mixed media, photo by Daniel Poller" } },
    { fi: { name: "Tucked away", desc: "2020, Ommellut ja täytetyt tekstiiliprintit, 70 x 80 cm" }, en: { name: "Tucked away", desc: "2020, Sewn and stuffed fabrics with textile prints, 70 x 80 cm" } },
    { fi: { name: "Cleaning (installaatio)", desc: "2021, Nastolan kesänäyttely, valokuva Sami Funke" }, en: { name: "Cleaning (installation)", desc: "2021, Nastola summer exhibition, photo by Sami Funke" } },
    { fi: { name: "Harjus 1 ja 2", desc: "2020, 3D-keramiikka, lasitteet ja tekstiiliprintit, 16 x 8,5 x 7 cm ja 18 x 7,5 x 5 cm" }, en: { name: "Grayling 1 and 2", desc: "2020, 3D ceramics, glazes and textile prints, 16 x 8,5 x 7 cm and 18 x 7,5 x 5 cm" } },
    { fi: { name: "Kuutti", desc: "2020, 3D-keramiikka, lasitteet ja tekstiiliprintit, 32 x 25 x 10 cm" }, en: { name: "Seal pup", desc: "2020, 3D ceramics, glazes and textile prints, 32 x 25 x 10 cm" } },
    { fi: { name: "Saimaannorppa", desc: "2020, 3D-keramiikka, lasitteet ja tekstiiliprintit, 47 x 42 x 13 cm" }, en: { name: "Saimaa ringed seal", desc: "2020, 3D ceramics, glazes and textile prints, 47 x 42 x 13 cm" } },
    { fi: { name: "Pullasorsa", desc: "2017" }, en: { name: "The Duck", desc: "2017" } },
    { fi: { name: "Cleaning", desc: "2020, 3D-printattu keramiikka, käsintehty keramiikka, lasite, eri kokoja" }, en: { name: "Cleaning", desc: "2020, 3D-printed ceramics, handmade ceramics, glaze, different sizes" } },
    { fi: { name: "Deep frozen has been opened, deep frozen has been closed", desc: "2016, 50 x 50cm" }, en: { name: "Deep frozen has been opened, deep frozen has been closed", desc: "2016, 50 x 50cm" } },
    { fi: { name: "Mulgara", desc: "2016, sarjasta Uhanalaiset eläimet" }, en: { name: "Mulgara", desc: "2016, series: Endangered Animals" } },
  ];

  // Extract year from desc string
  function extractYear(desc) {
    const match = desc.match(/^(\d{4})/);
    return match ? parseInt(match[1]) : null;
  }

  for (let i = 0; i < worksData.length; i++) {
    const work = worksData[i];
    const imageNum = i + 1;
    const year = extractYear(work.en.desc);

    // Upload image
    const assetId = await uploadImageAsset(
      `images/${imageNum}.jpg`,
      `${work.en.name}`,
      work.en.desc
    );

    const fields = {
      title: loc(work.en.name, work.fi.name),
      dimensions: loc(work.en.desc, work.fi.desc),
      category: locEn(entryRef(worksCategoryId)),
      isArchive: locEn(false),
    };
    if (year) fields.year = locEn(year);
    if (assetId) fields.image = locEn(assetRef(assetId));

    const id = await createEntryIfNotExists(
      "artwork",
      fields,
      "title[en-US]",
      work.en.name,
      `Artwork: ${work.en.name}`
    );
    createdIds.artworks.push(id);
  }

  // ── Archive Artworks ──────────────────────────────────────────────────
  console.log("\n── Artworks (Archive) ──");
  const archiveCategoryId = createdIds.artworkCategories["archive"];
  const archiveData = [
    { fi: { name: "Yhtä juhlaa (osa)", desc: "2012. Ääni-installaatio. Äänimaailma Bileet mahassa 3:34 min yhdessä Mika Salmisen kanssa. Sekatekniikka." }, en: { name: "Party all the time (part)", desc: "2012. Sound installation - soundscape Party in the Belly 3:34 min together with Mika Salminen. Mixed media." } },
    { fi: { name: "Älä tule paha päivä, tule hyvä päivä", desc: "2012. 1/4" }, en: { name: "Don't come bad day, come good day", desc: "2012. 1/4" } },
    { fi: { name: "Maksa, napanuora ja Suomi", desc: "2010" }, en: { name: "Liver, Umbilical Cord and Finland", desc: "2010" } },
    { fi: { name: "Pilleripäivät", desc: "2010. Teoksen materiaalina ovat keramiikasta valetut e-pillerirasiat, jotka ovat raakapolton jälkeen savustettu mustasavustusmenetelmällä" }, en: { name: "Pill Days", desc: "2010. Material is ceramics cast from contraceptive pill packagings, smoked after raw burning with black smoking technique" } },
    { fi: { name: "Torkkuvat mustatorvisienet", desc: "2010-2011. Esillä kesän 2011 Kumpulan kasvitieteellisessä puutarhassa." }, en: { name: "Snoring Black Trumpet Mushrooms", desc: "2010-2011. Exhibited in 2011 in Kumpula Botanical Garden." } },
    { fi: { name: "Hetken helpotuksia", desc: "2003-2011. Runotollojen sisällä on kirjoittamiani runoja vuosien 2003-2011 väliseltä ajalta." }, en: { name: "Momentary Reliefs", desc: "2003-2011. In the crumbled papers there are poems I have written between years 2003 and 2011." } },
    { fi: { name: "Miksei kukaan leiki mun kanssa?", desc: "2011. Ääniveistos. Materiaalina sublimaatiotuloste, ompelu ja vanu." }, en: { name: "Why Won't Anyone Play With Me?", desc: "2011. Sound sculpture. Materials sublimation print, stitching and cottonwool." } },
    { fi: { name: "A Prisoner of Your Own Eye", desc: "2010. Sublimaatiotuloste, ompelu ja täytemateriaali" }, en: { name: "A Prisoner of Your Own Eye", desc: "2010. Sublimation print, stitching and stuffing material" } },
    { fi: { name: "Kostealla sienellä, karhealla puolella vaivasin ihoani liasta eroon", desc: "2008." }, en: { name: "With A Moist Sponge, Rough Side I Rubbed My Skin From The Grime", desc: "2008." } },
    { fi: { name: "Hiiliperhonen on nimesi, kaipaat kiinnitettä siipiisi", desc: "2009. Sarjassa kuvasin lapsuudessa koettuja hetkiä." }, en: { name: "Coal Butterfly Is Your Name, You Need Fixative To Your Wings", desc: "2009. In this fabric print sculpture series I depicted moments experienced in childhood." } },
    { fi: { name: "Ruokahetkiä", desc: "2009. Art Helsingissä esittelin Ruokahetkiä-nimisen teossarjan." }, en: { name: "Culinary Moments", desc: "At Art Helsinki, I presented Culinary Moments series." } },
    { fi: { name: "Kiire kosketuksien välissä", desc: "2007" }, en: { name: "Haste Between Touches", desc: "2007" } },
    { fi: { name: "Ennustus", desc: "2010. Installaatio koostuu valetuista uudenvuodentinoista ja niiden varjokuvajaisista." }, en: { name: "Omen", desc: "2010. The installation consists of cast new year's tins and their shadows." } },
    { fi: { name: "Täydellinen paketti 3", desc: "2010" }, en: { name: "A Perfect Package 3", desc: "2010" } },
    { fi: { name: "Täydellinen paketti 2", desc: "2010" }, en: { name: "A Perfect Package 2", desc: "2010" } },
    { fi: { name: "Huhuu oot sä unohtanu mut?", desc: "2008." }, en: { name: "Hello Have You Forgotten About Me?", desc: "2008." } },
    { fi: { name: "Muhkukoira", desc: "2012." }, en: { name: "Muhku Dog", desc: "2012." } },
    { fi: { name: "Stressipallot", desc: "2010. Materiaalina kangas ja täytemateriaali" }, en: { name: "Stress balls", desc: "2010. Fabric and stuffing material" } },
    { fi: { name: "Yhtä juhlaa", desc: "2012. Ääni-installaatio." }, en: { name: "Party all the time", desc: "2012. Sound installation." } },
    { fi: { name: "Yhtä juhlaa", desc: "2012. Ääni-installaatio (2)." }, en: { name: "Party all the time", desc: "2012. Sound installation (2)." } },
    { fi: { name: "Who is she?", desc: "tekstiiliprintti, täytemateriaali 32cm x 39cm x 10cm" }, en: { name: "Who is she?", desc: "textile prints, filling materials 32cm x 39cm x 10cm" } },
    { fi: { name: "Who is she? II", desc: "tekstiiliprintti, täytemateriaali 80cm x 30cm x 15cm" }, en: { name: "Who is she? II", desc: "textile prints, filling materials 80cm x 30cm x 15cm" } },
    { fi: { name: "Tahdon", desc: "2014, digitaalisesti käsitelty lehtikuva, kehykset, 3 x 20 x 15 cm" }, en: { name: "I do", desc: "2014, digitally processed press photo, frame, 3 x 20 x 15 cm" } },
    { fi: { name: "Tahdon (2)", desc: "2014, digitaalisesti käsitelty lehtikuva, kehykset, 3 x 20 x 15 cm" }, en: { name: "I do (2)", desc: "2014, digitally processed press photo, frame, 3 x 20 x 15 cm" } },
    { fi: { name: "Äidin tupakkatauko", desc: "2014, Kangasprintti, täytemateriaali, 6x pituus noin 25 cm" }, en: { name: "Mother's cigarette break", desc: "2014, textile print, filling material, 6 pieces, length ~25 cm" } },
    { fi: { name: "Looking for Childhood", desc: "2015, Akryyli, vesiväri pahville" }, en: { name: "Looking for Childhood", desc: "2015, Acryl, water colour on cardboard" } },
    { fi: { name: "Markku Seinäjoelta", desc: "2016, sekatekniikka" }, en: { name: "Markku from Seinäjoki", desc: "2016, mixed media" } },
    { fi: { name: "Isä ja tytär", desc: "2015, akryyli pahville" }, en: { name: "Father and daughter", desc: "2015, acryl on cardboard" } },
    { fi: { name: "Showroom Berliini, 2014 Wie geht's -solo show", desc: "Photo: Kris Braun" }, en: { name: "Showroom Berliini, 2014 Wie geht's -solo show", desc: "Photo: Kris Braun" } },
    { fi: { name: "Viinan himo", desc: "2015, 50 x 70 cm, akryyli pahville" }, en: { name: "Dipsomania", desc: "2015, 50 x 70 cm, acryl on cardboard" } },
    { fi: { name: "Anteeksi kulta tänään meni myöhään töissä", desc: "2014" }, en: { name: "Sorry Honey I Ran Late At Work", desc: "2014" } },
    { fi: { name: "Leijuvat tytöt, Kuokkavieraat", desc: "2014" }, en: { name: "Levitating Girls, Gatecrashers", desc: "2014" } },
    { fi: { name: "Circulation", desc: "2018" }, en: { name: "Circulation", desc: "2018" } },
  ];

  for (let i = 0; i < archiveData.length; i++) {
    const work = archiveData[i];
    const imageNum = i + 1;
    const year = extractYear(work.en.desc);

    const assetId = await uploadImageAsset(
      `archive/${imageNum}.jpg`,
      `Archive: ${work.en.name}`,
      work.en.desc
    );

    const fields = {
      title: loc(work.en.name, work.fi.name),
      dimensions: loc(work.en.desc, work.fi.desc),
      category: locEn(entryRef(archiveCategoryId)),
      isArchive: locEn(true),
    };
    if (year) fields.year = locEn(year);
    if (assetId) fields.image = locEn(assetRef(assetId));

    const id = await createEntryIfNotExists(
      "artwork",
      fields,
      "title[en-US]",
      work.en.name,
      `Archive: ${work.en.name}`
    );
    createdIds.archiveWorks.push(id);
  }

  // ── News Entries ──────────────────────────────────────────────────────
  console.log("\n── News Entries ──");

  // Parse title and link from titleHtml
  function parseTitleAndLink(html) {
    const match = html.match(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/);
    if (match) return { title: match[2], link: match[1] };
    return { title: stripTags(html), link: null };
  }

  const newsDataFi = [
    { titleHtml: '<a target="_blank" href="https://galleryhalmetoja.com/exhibitions/3786/">Furry Darlings</a>', descHtml: "Yksityisnäyttely Gallery Halmetojassa 25.4.-18.5.2025. Näyttelyn avajaiset 24.4.2025 klo 17-19", date: "2025-04-25" },
    { titleHtml: '<a target="_blank" href="http://subjectobject.de/index.html">Künstler=innen</a>', descHtml: "Ryhmänäyttely Galerie subjectobjectissa 8.3.-5.4.2025. Näyttelyn avajaiset 7.3.2025 klo 19-22", date: "2025-03-08" },
    { titleHtml: '<a target="_blank" href="https://vbk-art.de/the-new-you-we-me/">The new you-we-me</a>', descHtml: "Osa EMOP Berliniä (European Month of Photography). Ryhmänäyttely Verein Berliner Künstler-galleriassa 15.3.-6.4.2025. Avajaiset 14.3. klo 19", date: "2025-03-15" },
    { titleHtml: '<a target="_blank" href="https://vbk-art.de/">UPDATE 2025</a>', descHtml: "Group exhibition at Verein Berliner Künstler gallery 11.4.-11.5.2025. Exhibition opening 11.4. at 19", date: "2025-04-11" },
    { titleHtml: '<a target="_blank" href="https://finnland-institut.de/events/visiting-artists-2024-goman-jaeaeskelaeinen-kaerki-pussinen-raesaenen-salonen/?lang=en">Visiting Art/ists 2024: Ich finde dich in allen diesen Dingen</a>', descHtml: "Ryhmänäyttely Suomi-instituutissa 8.2.-14.11.2024. Avajaiset 8.2. klo 18-21.", date: "2024-02-08" },
  ];

  const newsDataEn = [
    { descHtml: "Solo exhibition at Gallery Halmetoja 25.4.-18.5.2025. Exhibition opening 24.4.2025 at 17-19" },
    { descHtml: "Group exhibition at Galerie subjectobject 8.3.-5.4.2025. Exhibition opening 7.3.2025 at 19-22" },
    { descHtml: "Part of EMOP Berlin (European Month of Photography). Group exhibition at Verein Berliner Künstler gallery 15.3.-6.4.2025. Exhibition opening 14.3. at 19" },
    { descHtml: "Group exhibition at Verein Berliner Künstler gallery 11.4.-11.5.2025. Exhibition opening 11.4. at 19" },
    { descHtml: "Group exhibition in Finnland-Institut 8.2.-14.11.2024. Opening 8.2. 18-21." },
  ];

  for (let i = 0; i < newsDataFi.length; i++) {
    const fi = newsDataFi[i];
    const en = newsDataEn[i];
    const { title, link } = parseTitleAndLink(fi.titleHtml);

    const fields = {
      title: loc(title, title), // Title is same in both languages for these
      date: locEn(fi.date),
      body: {
        "en-US": richTextFromPlain(en.descHtml),
        fi: richTextFromPlain(fi.descHtml),
      },
    };
    if (link) fields.link = locEn(link);

    const id = await createEntryIfNotExists(
      "newsEntry",
      fields,
      "title[en-US]",
      title,
      `News: ${title}`
    );
    createdIds.newsEntries.push(id);
  }

  // ── Page Content ──────────────────────────────────────────────────────
  console.log("\n── Page Content ──");

  // Intro page - English
  const introEn = `Laura Kärki (b.1978) is a Finnish visual artist living and working in Germany, Finland and artist residencies abroad. Laura Kärki is M.A. Master of Arts graduate 2006 of the Aalto University School of Art and Design Helsinki. She has Bachelor's degree in textile design from Metropolia Vantaa and ceramics artisan from Tammela Art and Crafts school.

Kärki is working with poems, installation, sculpture and sound. Her artworks deal with themes of alienation and being an outsider. Loneliness, relatives and friends forgotten in a hurry and incapability for empathy are all connected to the social problems of the contemporary society.

Her work has been exhibited in Finland and abroad such as Circulo de Bellas Artes in Madrid, Mänttä Art Festival, Museum of Wäinö Aaltonen and Museum of Vantaa. Her works are in as Finnish State Art Collections and Borenius & Kemppinen Art Collections.`;

  const introFi = `Laura Kärki tunnetaan kuvataiteen monitaiteilijana, joka tekee teoksia laajasti eri materiaaleja, tekniikoita monipuolisesti ja ennakkoluulottomasti hyödyntäen. Viimeaikaisissa teoksissaan vuonna 2020 hän on pohtinut mm. perhesuhteita ja ulkosuomalaisuutta öljypastellimaalausten, tekstiiliprinttien, keramiikan ja valokuvan keinoin. Kärki myös kirjoittaa runoja ja lisää teoksiin äänimaailmoja.

Kärki on asunut viimeiset kymmenen vuotta Berliinissä. Asuttuaan pitkään Saksassa, hän uskaltaa tarttua henkilökohtaisiin aiheisiin, jotka koskettavat laajemmin yleisöä ja joissa näkyy suomalaisen identiteetin peilautumista. Kärki kirjoittaa työskentelystään: Olen jatkuvasti taiteessani, ehkä elämässäni kuin nuorallatanssija, mutta en koskaan tipu – se tekee työstäni rohkeaa. Se tekee siitä syvää, niin toivon, rohkeutta haluan välittää katsojalle.

Kärki on valmistunut vuonna 2006 Aalto-yliopistosta taiteen maisteriksi. Hänen teoksiaan on hankittu viimeisten vuosien aikana taidemuseoiden kokoelmiin, kuten Aineen Taidemuseoon ja Lahden taidemuseoon, sekä hänen töitään kuuluu yksityisiin kokoelmiin. Suomen Valtion taidekokoelmiin kuuluu Kärjen ääni-installaatio. Hänen julkiset teoksensa ovat esillä Suomen Messukeskuksessa, Hotelli Hiltonissa Hakaniemessä, Helsingissä ja Borenius & Kemppisen asianajotoimistossa.

Kärkeä edustaa Suomessa Veikko Halmetoja johtamassaan Gallery Halmetojassa. Kärjen teoksia nähtiin Koreassa kahdessa eri näyttelyssä vuonna 2020. Hänen viimeisin näyttelynsä Suomessa, Punnittu esitys, oli Galleria Halmetojassa tammikuussa 2019. Family Affairs näyttely avautuu Berliinin Kulturhaus Karlshorstissa vuoden 2021 tammikuussa. Näyttely toteutetaan duona Niina Lehtonen-Braunin kanssa. Näyttelyn kuraattori on Dr. Sylvia Metz ja näyttelyä tukee Suomen-Saksan instituutti.`;

  const introId = await createEntryIfNotExists(
    "pageContent",
    {
      pageSlug: locEn("intro"),
      body: {
        "en-US": richTextFromPlain(introEn),
        fi: richTextFromPlain(introFi),
      },
    },
    "pageSlug",
    "intro",
    "Page: Intro/Biography"
  );
  createdIds.pageContents.push(introId);

  // Other page
  const otherEn = `Download my poem collection (in Finnish): Hiiliperhonen on nimesi, kaipaat kiinnitettä siipiisi

Hiiliperhonen is Laura Kärki's first poem collection, whose poems have been born between a long period of time. The work is indeed a result of a long process, it describes the struggle between inner and outer world: dreams and real life, household work and making art.

I am currently looking for a grant to translate the collection to English and German.`;

  const otherFi = `Lataa runokokoelmani: Hiiliperhonen on nimesi, kaipaat kiinnitettä siipiisi

Hiiliperhonen on Laura Kärjen ensimmäinen kokoelma, jonka runot ovat syntyneet pitkän ajan kuluessa. Teos onkin pitkällisen prosessin tulos, se kuvaa sisä- ja ulkomaailman välistä kamppailua ja vuoropuhelua: haaveita ja elämää, kotitaloutta ja taiteen tekemistä.

Etsin parhaillaan kokoelmalle käännösrahoitusta suomi-englanti ja suomi-saksa.`;

  const otherId = await createEntryIfNotExists(
    "pageContent",
    {
      pageSlug: locEn("other"),
      body: {
        "en-US": richTextFromPlain(otherEn),
        fi: richTextFromPlain(otherFi),
      },
    },
    "pageSlug",
    "other",
    "Page: Other/Resources"
  );
  createdIds.pageContents.push(otherId);

  // ── Site Settings ─────────────────────────────────────────────────────
  console.log("\n── Site Settings ──");

  // Upload hero image
  const heroAssetId = await uploadImageAsset(
    "images/a_dog_enjoys_the_fresh_air.jpg",
    "A dog enjoys the fresh air",
    "Hero image for landing page"
  );

  const siteSettingsFields = {
    profession: loc("Visual artist", "Kuvataiteilija"),
    email: locEn("laura.karki@gmail.com"),
    socialLinks: locEn(
      Object.values(createdIds.socialLinks).map((id) => entryRef(id))
    ),
  };
  if (heroAssetId) {
    siteSettingsFields.heroImage = locEn(assetRef(heroAssetId));
  }

  const siteSettingsId = await createEntryIfNotExists(
    "siteSettings",
    siteSettingsFields,
    "profession[en-US]",
    "Visual artist",
    "Site Settings"
  );
  createdIds.siteSettings = siteSettingsId;

  // ════════════════════════════════════════════════════════════════════════
  // 3c. PUBLISH ALL CONTENT ENTRIES
  // ════════════════════════════════════════════════════════════════════════

  console.log("\n── Publishing all content entries ──");
  const allContentIds = [
    ...createdIds.cvEntries,
    ...createdIds.artworks,
    ...createdIds.archiveWorks,
    ...createdIds.newsEntries,
    ...createdIds.pageContents,
    createdIds.siteSettings,
  ].filter(Boolean);

  let published = 0;
  for (const id of allContentIds) {
    await publishEntry(id);
    published++;
    if (published % 20 === 0) {
      console.log(`  Published ${published}/${allContentIds.length}...`);
    }
  }
  console.log(`  ✓ Published ${published} content entries`);

  console.log("\n✅ All content populated and published!");
  console.log(`  CV Entries: ${createdIds.cvEntries.length}`);
  console.log(`  Artworks (Works): ${createdIds.artworks.length}`);
  console.log(`  Artworks (Archive): ${createdIds.archiveWorks.length}`);
  console.log(`  News Entries: ${createdIds.newsEntries.length}`);
  console.log(`  Page Contents: ${createdIds.pageContents.length}`);
  console.log(`  Site Settings: 1`);
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  if (err.details?.errors) {
    console.error("Details:", JSON.stringify(err.details.errors, null, 2));
  }
  process.exit(1);
});
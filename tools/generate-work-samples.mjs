import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIRS = [
  { key: "work-samples", dir: path.join(ROOT, "assets", "work-samples", "pdf") },
  { key: "writing", dir: path.join(ROOT, "assets", "writing", "pdf") }
];

const CATEGORY_RULES = [
  {
    key: "modeling",
    label: "Real Estate Financial Modeling",
    keywords: ["modeling assessment"]
  },
  {
    key: "marketing",
    label: "Marketing / GTM",
    keywords: ["marketing proposal", "duolingo", "marriott", "retail media"]
  },
  {
    key: "governance",
    label: "Governance / Ethics",
    keywords: ["volkswagen", "governance", "emissions", "scandal"]
  },
  {
    key: "finance",
    label: "Finance / Investing",
    keywords: ["avid", "radiopharmaceutical", "case write-up_avid", "sovereign wealth", "wealth fund"]
  },
  {
    key: "writing",
    label: "Writing / Essays",
    keywords: ["parenting magazine", "future role of the collector"]
  },
  {
    key: "strategy",
    label: "Strategy / Operations / Analytics",
    keywords: [
      "business analytics",
      "aurora",
      "autonomous",
      "applied analytics",
      "technology product catalog",
      "product catalog",
      "tata group",
      "west bengal",
      "memo_tata",
      "jll_fs"
    ]
  }
];

const toTitleCase = (value) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const titleFromFilename = (filename) => {
  const base = filename.replace(/\.[^/.]+$/, "");
  return toTitleCase(base.replace(/[-_]+/g, " ").trim());
};

const categoryFromFilename = (filename) => {
  const lower = filename.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.label;
    }
  }
  return "Other";
};

const readAssetFiles = async (dir) => {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch (error) {
    return [];
  }
};

const main = async () => {
  const fileMap = new Map();

  for (const source of SOURCE_DIRS) {
    const files = await readAssetFiles(source.dir);
    files.forEach((filename) => {
      const key = filename.toLowerCase();
      if (!fileMap.has(key)) {
        const url =
          source.key === "writing"
            ? `./assets/writing/pdf/${filename}`
            : `./assets/work-samples/pdf/${filename}`;
        fileMap.set(key, { filename, url });
      }
    });
  }

  const items = Array.from(fileMap.values()).map((entry) => {
    const title = titleFromFilename(entry.filename);
    const category = categoryFromFilename(entry.filename);
    return {
      id: entry.filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      filename: entry.filename,
      extension: path.extname(entry.filename).toLowerCase(),
      title,
      category,
      url: entry.url
    };
  });

  items.sort((a, b) => {
    if (a.category === b.category) {
      return a.title.localeCompare(b.title);
    }
    return a.category.localeCompare(b.category);
  });

  const outputPath = path.join(ROOT, "data", "work-samples.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(items, null, 2));
  console.log(`Generated ${items.length} items → ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

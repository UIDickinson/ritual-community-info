#!/usr/bin/env node
/**
 * Scrape all Ritual documentation pages and save as a static JSON cache.
 * Run this whenever the docs are updated: node scripts/scrape-docs.mjs
 *
 * Output: src/data/docs-cache.json
 */

const DOCS_BASE = "https://www.ritualfoundation.org/docs";

const DOCS_INDEX = [
  { slug: "overview/what-is-ritual", title: "What is Ritual?" },
  { slug: "overview/crypto-x-ai", title: "Crypto × AI" },
  { slug: "overview/quickstart", title: "Quickstart" },
  { slug: "overview/early-to-everything", title: "Early to Everything" },
  { slug: "architecture/evm++", title: "EVM++" },
  { slug: "architecture/execution-sidecars", title: "Execution Sidecars" },
  { slug: "architecture/infernet-to-chain", title: "Infernet to Chain" },
  { slug: "architecture/resonance", title: "Resonance" },
  { slug: "architecture/ritual-to-world", title: "Ritual to World" },
  { slug: "architecture/scheduled-transactions", title: "Scheduled Transactions" },
  { slug: "architecture/symphony", title: "Symphony" },
  { slug: "whats-new/agents", title: "Agents" },
  { slug: "whats-new/guardians", title: "Guardians" },
  { slug: "whats-new/resonance", title: "Resonance (What's New)" },
  { slug: "whats-new/symphony", title: "Symphony (What's New)" },
  { slug: "whats-new/modular-storage", title: "Modular Storage" },
  { slug: "whats-new/node-specialization", title: "Node Specialization" },
  { slug: "whats-new/ai-primitives/enshrined-ai-models", title: "Enshrined AI Models" },
  { slug: "whats-new/ai-primitives/modular-computational-integrity", title: "Modular Computational Integrity" },
  { slug: "whats-new/ai-primitives/verifiable-provenance", title: "Verifiable Provenance" },
  { slug: "whats-new/evm++/account-abstraction", title: "Account Abstraction" },
  { slug: "whats-new/evm++/overview", title: "EVM++ Overview" },
  { slug: "whats-new/evm++/scheduled-transactions", title: "EVM++ Scheduled Transactions" },
  { slug: "whats-new/evm++-sidecars/overview", title: "Sidecars Overview" },
  { slug: "whats-new/evm++-sidecars/ai-inference/classical-ml-inference", title: "Classical ML Inference" },
  { slug: "whats-new/evm++-sidecars/ai-inference/llm-inference", title: "LLM Inference" },
  { slug: "whats-new/evm++-sidecars/chain-abstraction", title: "Chain Abstraction" },
  { slug: "whats-new/evm++-sidecars/tee-execution", title: "TEE Execution" },
  { slug: "whats-new/evm++-sidecars/zk-proving-and-verification", title: "ZK Proving & Verification" },
  { slug: "whats-new/evm++/eip-extensions/overview", title: "EIP Extensions Overview" },
  { slug: "whats-new/evm++/eip-extensions/eip-5027", title: "EIP-5027" },
  { slug: "whats-new/evm++/eip-extensions/eip-5920", title: "EIP-5920" },
  { slug: "whats-new/evm++/eip-extensions/eip-665", title: "EIP-665" },
  { slug: "whats-new/evm++/eip-extensions/eip-7212", title: "EIP-7212" },
  { slug: "whats-new/enshrined-oracles/infernet-to-world", title: "Infernet to World" },
  { slug: "whats-new/enshrined-oracles/scheduled-transactions", title: "Enshrined Oracle Scheduled Transactions" },
  { slug: "using-ritual/ritual-for-users", title: "Ritual for Users" },
  { slug: "using-ritual/ritual-for-node-runners", title: "Ritual for Node Runners" },
  { slug: "build-on-ritual/tutorials/automated-prediction-markets", title: "Automated Prediction Markets" },
  { slug: "build-on-ritual/tutorials/cross-chain-yield-aggregator", title: "Cross-Chain Yield Aggregator" },
  { slug: "build-on-ritual/tutorials/lending-protocols", title: "Lending Protocols" },
  { slug: "build-on-ritual/tutorials/smart-agents", title: "Smart Agents Tutorial" },
  { slug: "build-on-ritual/case-studies/ai-stablecoin", title: "AI Stablecoin Case Study" },
  { slug: "build-on-ritual/case-studies/basis-trading", title: "Basis Trading Case Study" },
  { slug: "build-on-ritual/case-studies/borrow-lend", title: "Borrow/Lend Case Study" },
  { slug: "build-on-ritual/case-studies/prediction-markets", title: "Prediction Markets Case Study" },
  { slug: "build-on-ritual/case-studies/smart-agents", title: "Smart Agents Case Study" },
  { slug: "landscape/ritual-vs-other-chains", title: "Ritual vs Other Chains" },
  { slug: "landscape/ritual-vs-other-crypto-x-ai", title: "Ritual vs Other Crypto×AI" },
  { slug: "beyond-crypto-x-ai/expressive-blockchains", title: "Expressive Blockchains" },
  { slug: "beyond-crypto-x-ai/l2-raas", title: "L2 RaaS" },
  { slug: "beyond-crypto-x-ai/model-marketplace", title: "Model Marketplace" },
  { slug: "beyond-crypto-x-ai/prover-networks", title: "Prover Networks" },
  { slug: "roadmap/going", title: "Roadmap — Going" },
  { slug: "roadmap/not-going", title: "Roadmap — Not Going" },
  { slug: "reference/faq", title: "FAQ" },
  { slug: "reference/glossary", title: "Glossary" },
];

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTextFromHTML(html) {
  // Strip nav/footer
  const contentHtml = html
    .replace(/<nav[\s\S]*?<\/nav>/g, "")
    .replace(/<footer[\s\S]*?<\/footer>/g, "");

  const parts = [];

  // Page title
  const titleMatch = contentHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (titleMatch) {
    parts.push(`# ${stripTags(titleMatch[1]).trim()}`);
  }

  // Meta description
  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  if (metaDesc) {
    parts.push(decodeHtmlEntities(metaDesc[1]).trim());
  }

  // Body text from <span data-as="p">
  const spanPRegex = /<span data-as="p">([\s\S]*?)<\/span>/g;
  let m;
  while ((m = spanPRegex.exec(contentHtml)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text && text.length > 15) parts.push(text);
  }

  // <p> paragraphs
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/g;
  while ((m = pRegex.exec(contentHtml)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text && text.length > 15) parts.push(text);
  }

  // h2 headings
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  while ((m = h2Regex.exec(contentHtml)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text && text.length > 1 && text.length < 200) parts.push(`\n## ${text}`);
  }

  // h3 headings
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
  while ((m = h3Regex.exec(contentHtml)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text && text.length > 1 && text.length < 200) parts.push(`### ${text}`);
  }

  // Content-area list items (skip nav/sidebar)
  const liRegex = /<li\b([^>]*)>([\s\S]*?)<\/li>/g;
  while ((m = liRegex.exec(contentHtml)) !== null) {
    const attrs = m[1];
    const inner = m[2];
    if (attrs.includes("data-title") || inner.includes('href="/docs/')) continue;
    if (inner.includes('href="#')) continue;
    const text = stripTags(inner).trim();
    if (text && text.length > 20 && text.length < 500) parts.push(`• ${text}`);
  }

  // Deduplicate
  const seen = new Set();
  const unique = parts.filter((p) => {
    const key = p.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.join("\n").substring(0, 8000); // Generous cap for static cache
}

async function fetchPage(slug) {
  const url = `${DOCS_BASE}/${slug}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SiggyBot/1.0 (Ritual Docs Scraper)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${slug}`);
  return res.text();
}

async function main() {
  const { writeFileSync, mkdirSync } = await import("fs");
  const { dirname, join } = await import("path");
  const { fileURLToPath } = await import("url");
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const outDir = join(__dirname, "..", "src", "data");
  mkdirSync(outDir, { recursive: true });

  const cache = {};
  let success = 0;
  let failed = 0;

  console.log(`Scraping ${DOCS_INDEX.length} Ritual docs pages...\n`);

  // Process in batches of 5 to avoid hammering the server
  for (let i = 0; i < DOCS_INDEX.length; i += 5) {
    const batch = DOCS_INDEX.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(async (page) => {
        const html = await fetchPage(page.slug);
        const text = extractTextFromHTML(html);
        return { slug: page.slug, title: page.title, text };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { slug, title, text } = result.value;
        cache[slug] = { title, content: text };
        success++;
        const preview = text.substring(0, 60).replace(/\n/g, " ");
        console.log(`  ✓ ${slug} (${text.length} chars) — ${preview}...`);
      } else {
        failed++;
        console.log(`  ✗ FAILED: ${result.reason.message}`);
      }
    }

    // Small delay between batches
    if (i + 5 < DOCS_INDEX.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const outPath = join(outDir, "docs-cache.json");
  writeFileSync(outPath, JSON.stringify(cache, null, 2));

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Done! ${success} pages cached, ${failed} failed.`);
  console.log(`Output: ${outPath}`);
  console.log(`File size: ${(JSON.stringify(cache).length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});

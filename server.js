#!/usr/bin/env node
/**
 * HiveTrade MCP Server
 * Cross-border SMB invoice settlement on USDT/USDC rails — $0 wire fee, same-block
 *
 * Backend: https://hivemorph.onrender.com
 * Spec   : MCP 2024-11-05 / Streamable-HTTP / JSON-RPC 2.0
 * Brand  : Hive Civilization gold #C08D23 (Pantone 1245 C)
 */

import express from 'express';
import { HIVE_EARN_TOOLS, executeHiveEarnTool, isHiveEarnTool } from './hive-earn-tools.js';
import { buildAgentCard, buildOacJsonLd, renderRootHtml } from './hive-agent-card.js';
import { renderLanding, renderRobots, renderSitemap, renderSecurity, renderOgImage, seoJson, BRAND_GOLD } from './meta.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────

// ─── Agent-native config (A2A AgentCard + OAC JSON-LD + earn rails) ───────
const HIVE_AGENT_CFG = {
  name: 'HiveTrade MCP',
  description: "Cross-border SMB invoice settlement MCP server. Real Base USDC and USDT, $0 wire fee, same-block settlement on Base / Ethereum / Solana.",
  url: 'https://hive-mcp-gateway.onrender.com/trade',
  version: '1.0.3',
  repoUrl: 'https://github.com/srotzin/hive-mcp-trade',
  did: 'did:hive:trade',
  gatewayUrl: 'https://hive-mcp-gateway.onrender.com',
  // Tools attached at runtime (after merging earn tools in)
  tools: [],
};

const TOOLS = [
{
  name: 'trade_get_fees',
  description: 'Get the cross-border invoice fee schedule and SWIFT wire comparison (Hive vs. typical SMB wire fees, FX spreads, settlement times).',
  inputSchema: {
    type: 'object',
    properties: {

    },
  },
},{
  name: 'trade_get_listing',
  description: 'Get the public listing metadata (target user, fee schedule, settlement currencies/chains, cumulative volume, council origin).',
  inputSchema: {
    type: 'object',
    properties: {

    },
  },
},    {
      name: 'trade_create_invoice',
      description: 'Create a cross-border invoice. Buyer (SMB) and supplier exchange DIDs; invoice amount + currency + chain selected at creation. Fee auto-computed from tier.',
      inputSchema: {
type: 'object',
required: ["buyer_did", "supplier_did", "amount_usd", "settle_currency", "settle_chain", "supplier_payout_address"],
properties: {
  buyer_did: { type: 'string', description: 'DID of the SMB buyer' },
  supplier_did: { type: 'string', description: 'DID of the overseas supplier' },
  amount_usd: { type: 'number', description: 'Invoice amount in USD (max $250,000 for MVP)' },
  settle_currency: { type: 'string', description: 'USDT or USDC' },
  settle_chain: { type: 'string', description: 'base, ethereum, or solana' },
  supplier_payout_address: { type: 'string', description: 'Supplier\'s receiving address on the chosen chain' },
  memo: { type: 'string', description: 'Free-form invoice memo (PO number, goods description)' }
},
      },
    },    {
      name: 'trade_get_invoice',
      description: 'Retrieve invoice status, settlement transaction hash, and dispute history.',
      inputSchema: {
type: 'object',
required: ["invoice_id"],
properties: {
  invoice_id: { type: 'string', description: 'Invoice ID returned from trade_create_invoice' }
},
      },
    },    {
      name: 'trade_dispute_invoice',
      description: 'Open a dispute on an invoice. Routes to HiveLaw arbitration if buyer and supplier cannot resolve. Settlement is held in escrow until resolution.',
      inputSchema: {
type: 'object',
required: ["invoice_id", "claimant_did", "reason"],
properties: {
  invoice_id: { type: 'string', description: 'Invoice ID' },
  claimant_did: { type: 'string', description: 'DID of the disputing party (buyer or supplier)' },
  reason: { type: 'string', description: 'Dispute reason' },
  evidence_url: { type: 'string', description: 'Optional URL to supporting documents' }
},
      },
    }
];


const SERVICE_CFG = {
  service: "hive-mcp-trade",
  shortName: "HiveTrade",
  title: "HiveTrade \u00b7 Cross-Border SMB Invoice Settlement MCP",
  tagline: "Same-block USDT/USDC settlement for SMB cross-border invoices. $0 wire fee.",
  description: "MCP server for HiveTrade \u2014 cross-border SMB invoice settlement. SMB manufacturers paying $5K-$250K invoices to overseas suppliers (Vietnam, Mexico, Bangladesh, India) settle in USDT/USDC on Base, Ethereum, or Solana. 0.30% / 0.20% all-in vs 1-3% wire+FX. Real rails, real chains.",
  keywords: ["mcp", "model-context-protocol", "x402", "agentic", "ai-agent", "ai-agents", "llm", "hive", "hive-civilization", "trade-finance", "cross-border", "smb", "usdt", "usdc", "base", "base-l2", "ethereum", "solana", "invoice", "supply-chain"],
  externalUrl: "https://hive-mcp-trade.onrender.com",
  gatewayMount: "/trade",
  version: "1.0.2",
  pricing: [
    { name: "trade_create_invoice", priceUsd: 0, label: "Create invoice \u2014 free" },
    { name: "trade_get_invoice", priceUsd: 0, label: "Get invoice \u2014 free" },
    { name: "trade_get_fees", priceUsd: 0, label: "Fee schedule \u2014 free" },
    { name: "trade_dispute", priceUsd: 0.05, label: "Open dispute (Tier 3)" }
  ],
};
SERVICE_CFG.tools = (typeof TOOLS !== 'undefined' ? TOOLS : (typeof MCP_TOOLS !== 'undefined' ? MCP_TOOLS : [])).map(t => ({ name: t.name, description: t.description }));

// HIVE_AGENT_NATIVE_v1 — earn tools + AgentCard wiring
for (const t of HIVE_EARN_TOOLS) {
  if (!TOOLS.find(x => x.name === t.name)) TOOLS.push(t);
}
HIVE_AGENT_CFG.tools = TOOLS;
// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function hiveGet(path, params = {}) {
  const url = new URL(`${HIVE_BASE}${path.startsWith('/') ? path : '/' + path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  return res.json();
}
async function hivePost(path, body) {
  const res = await fetch(`${HIVE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  let data; try { data = await res.json(); } catch { data = { raw: await res.text() }; }
  return { data, status: res.status };
}

// ─── Tool execution ──────────────────────────────────────────────────────────
async function executeTool(name, args) {
  // HIVE_AGENT_DISPATCH_v1 — earn tools first, then native dispatch
  if (isHiveEarnTool(name)) {
    const out = await executeHiveEarnTool(name, args);
    if (out) return out;
  }
  switch (name) {
      case 'trade_get_fees': {
const data = await hiveGet('/v1/trade/fees');
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'trade_get_listing': {
const data = await hiveGet('/v1/trade/listing');
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'trade_create_invoice': {
const { data, status } = await hivePost('/v1/trade/invoice', {
  buyer_did: args.buyer_did,
  supplier_did: args.supplier_did,
  amount_usd: args.amount_usd,
  settle_currency: args.settle_currency,
  settle_chain: args.settle_chain,
  supplier_payout_address: args.supplier_payout_address,
  memo: args.memo
});
return { type: 'text', text: JSON.stringify({ status, ...data }, null, 2) };
      }
      case 'trade_get_invoice': {
const data = await hiveGet(`/v1/trade/invoice/${args.invoice_id}`);
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'trade_dispute_invoice': {
const { data, status } = await hivePost(`/v1/trade/invoice/${args.invoice_id}/dispute`, {
  claimant_did: args.claimant_did,
  reason: args.reason,
  evidence_url: args.evidence_url
});
return { type: 'text', text: JSON.stringify({ status, ...data }, null, 2) };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP JSON-RPC handler ────────────────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};
  if (jsonrpc !== '2.0') return res.json({ jsonrpc:'2.0', id, error: { code:-32600, message:'Invalid JSON-RPC' } });
  try {
    switch (method) {
      case 'initialize':
        return res.json({ jsonrpc:'2.0', id, result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'hive-mcp-trade', version: '1.0.0', description: 'Cross-border SMB invoice settlement on USDT/USDC rails — $0 wire fee, same-block' },
        } });
      case 'tools/list':
        return res.json({ jsonrpc:'2.0', id, result: { tools: TOOLS } });
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const out = await executeTool(name, args || {});
        return res.json({ jsonrpc:'2.0', id, result: { content: [out] } });
      }
      case 'ping':
        return res.json({ jsonrpc:'2.0', id, result: {} });
      default:
        return res.json({ jsonrpc:'2.0', id, error: { code:-32601, message:`Method not found: ${method}` } });
    }
  } catch (err) {
    return res.json({ jsonrpc:'2.0', id, error: { code:-32000, message: err.message } });
  }
});

// ─── Discovery + health ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status:'ok', service:'hive-mcp-trade', version:'1.0.0', backend: HIVE_BASE }));
app.get('/.well-known/mcp.json', (req, res) => res.json({
  name: 'hive-mcp-trade',
  endpoint: '/mcp',
  transport: 'streamable-http',
  protocol: '2024-11-05',
  tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
}));


// HIVE_META_BLOCK_v1 — comprehensive meta tags + JSON-LD + crawler discovery
app.get('/', (req, res) => {
  // HIVE_AGENT_INJECT_LD_v1 — inject OAC JSON-LD into the meta-tags landing
  const __landing = renderLanding(SERVICE_CFG);
  const __oacLd = JSON.stringify(buildOacJsonLd(HIVE_AGENT_CFG)).replace(/</g, '\\u003c');
  const __ldTag = '\n<script type="application/ld+json">' + __oacLd + '</script>\n';
  const __out = __landing.replace('</head>', __ldTag + '</head>');
  res.type('text/html; charset=utf-8').send(__out);
});
app.get('/og.svg', (req, res) => {
  res.type('image/svg+xml').send(renderOgImage(SERVICE_CFG));
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(renderRobots(SERVICE_CFG));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(renderSitemap(SERVICE_CFG));
});
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').send(renderSecurity());
});
app.get('/seo.json', (req, res) => res.json(seoJson(SERVICE_CFG)));
// HIVE_AGENT_ROUTES_v1 — A2A AgentCard + OAC JSON-LD
app.get('/.well-known/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/.well-known/oac.json', (req, res) => {
  res.json(buildOacJsonLd(HIVE_AGENT_CFG));
});
app.get('/agent.html', (req, res) => {
  res.type('text/html; charset=utf-8').send(renderRootHtml(HIVE_AGENT_CFG));
});


app.get('/.well-known/agent-card.json', (req, res) => res.json({
  protocolVersion: '0.3.0',
  name: 'hive-mcp-trade',
  description: "Hive Civilization trade MCP — cross-border invoice settlement with x402 USDC settlement.",
  url: 'https://hive-mcp-trade.onrender.com',
  version: '1.0.3',
  provider: { organization: 'Hive Civilization', url: 'https://hiveagentiq.com' },
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  authentication: { schemes: ['x402', 'api-key'] },
  payment: {
    protocol: 'x402', currency: 'USDC', network: 'base',
    address: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e'
  },
  extensions: {
    hive_pricing: {
      currency: 'USDC', network: 'base', model: 'per_call',
      first_call_free: true, loyalty_threshold: 6,
      loyalty_message: 'Every 6th paid call is free'
    }
  },
  bogo: {
    first_call_free: true, loyalty_threshold: 6,
    pitch: "Pay this once, your 6th paid call is on the house. New here? Add header 'x-hive-did' to claim your first call free.",
    claim_with: 'x-hive-did header'
  }
}));

app.get('/.well-known/ap2.json', (req, res) => res.json({
  ap2_version: '1.0',
  agent: 'hive-mcp-trade',
  payment_methods: ['x402-usdc-base'],
  treasury: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e',
  bogo: { first_call_free: true, loyalty_threshold: 6, claim_with: 'x-hive-did header' }
}));

app.listen(PORT, () => {
  console.log(`HiveTrade MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});

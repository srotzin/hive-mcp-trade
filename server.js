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

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────
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

app.listen(PORT, () => {
  console.log(`HiveTrade MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});

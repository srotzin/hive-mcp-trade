<!-- HIVE_BANNER_V1 -->
<p align="center">
  <a href="https://mcp-trade.thehiveryiq.com/health">
    <img src="https://mcp-trade.thehiveryiq.com/og.svg" alt="Hive Civilization MCP Gateway · Cross-venue spread + yield drivers · ROI radar telemetry" width="100%"/>
  </a>
</p>

<h1 align="center">hive-mcp-trade</h1>

<p align="center"><strong>Cross-venue spread + yield drivers · ROI radar telemetry</strong></p>

<p align="center">
  <a href="https://smithery.ai/server/hivecivilization/hive-mcp-trade"><img alt="Smithery" src="https://img.shields.io/badge/Smithery-hivecivilization%2Fhive-mcp-trade-C08D23?style=flat-square"/></a>
  <a href="https://glama.ai/mcp/servers"><img alt="Glama" src="https://img.shields.io/badge/Glama-pending-C08D23?style=flat-square"/></a>
  <a href="https://mcp-trade.thehiveryiq.com/health"><img alt="Live" src="https://img.shields.io/badge/gateway-live-C08D23?style=flat-square"/></a>
  <a href="https://github.com/srotzin/hive-mcp-trade/releases"><img alt="Release" src="https://img.shields.io/github/v/release/srotzin/hive-mcp-trade?style=flat-square&color=C08D23"/></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-C08D23?style=flat-square"/></a>
</p>

<p align="center">
  <code>https://mcp-trade.thehiveryiq.com/mcp</code>
</p>

---

# HiveTrade

**Cross-border SMB invoice settlement on USDT/USDC rails — $0 wire fee, same-block**

MCP server for the Hive Cross-Border Trade Finance platform. SMB manufacturers paying $5K-$250K invoices to overseas suppliers (Vietnam, Mexico, Bangladesh, India) settle in USDT/USDC on Base, Ethereum, or Solana. 0.30% on invoices <= $50K, 0.20% on invoices $50K-$250K. Same-block settlement vs. 2-5 business days for SWIFT. $0 wire fee vs. $25-$50 + 1-3% FX spread.

> Council R3 #1 miss — productized as MVP

---

## What this is

`hive-mcp-trade` is a Model Context Protocol (MCP) server that exposes the HiveTrade platform on the Hive Civilization to any MCP-compatible client (Claude Desktop, Cursor, Manus, etc.). The server proxies to the live production backend at `https://receipts.thehiveryiq.com`.

- **Protocol:** MCP 2024-11-05 over Streamable-HTTP / JSON-RPC 2.0
- **Transport:** `POST /mcp`
- **Discovery:** `GET /.well-known/mcp.json`
- **Health:** `GET /health`
- **Settlement:** Real rails. USDC / USDT on Base, Ethereum, Solana. No mock. No simulated.
- **Brand gold:** Pantone 1245 C / `#C08D23`

## Tools

| Tool | Description |
|---|---|
| `trade_get_fees` | Get the cross-border invoice fee schedule and SWIFT wire comparison (Hive vs. typical SMB wire fees, FX spreads, settlement times). |
| `trade_get_listing` | Get the public listing metadata (target user, fee schedule, settlement currencies/chains, cumulative volume, council origin). |
| `trade_create_invoice` | Create a cross-border invoice. Buyer (SMB) and supplier exchange DIDs; invoice amount + currency + chain selected at creation. Fee auto-computed from tier. |
| `trade_get_invoice` | Retrieve invoice status, settlement transaction hash, and dispute history. |
| `trade_dispute_invoice` | Open a dispute on an invoice. Routes to HiveLaw arbitration if buyer and supplier cannot resolve. Settlement is held in escrow until resolution. |


## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/trade/fees` | Fee schedule + SWIFT comparison |
| `GET` | `/v1/trade/listing` | Public listing metadata |
| `POST` | `/v1/trade/invoice` | Create cross-border invoice |
| `GET` | `/v1/trade/invoice/{id}` | Invoice status + settlement |
| `POST` | `/v1/trade/invoice/{id}/dispute` | Open dispute (HiveLaw arbitration) |


## Run locally

```bash
git clone https://github.com/srotzin/hive-mcp-trade.git
cd hive-mcp-trade
npm install
npm start
# server up on http://localhost:3000/mcp
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/mcp.json
```

## Connect from an MCP client

**Claude Desktop / Cursor / Manus** — add to your `mcp.json`:

```json
{
  "mcpServers": {
    "hive_mcp_trade": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-deployed-host/mcp"]
    }
  }
}
```

## Hive Civilization

Part of the [Hive Civilization](https://www.thehiveryiq.com) — sovereign DID, USDC settlement, HAHS legal contracts, agent-to-agent rails.

Categories: finance, trade-finance, cross-border, smb, web3, agent-to-agent.

## License

MIT (c) Steve Rotzin / Hive Civilization


## Agent-native (v1.0.3)

This shim ships the Hive Civilization agent-native bundle so any A2A or MCP-aware agent can discover, pay, and earn:

- **A2A AgentCard** — \`GET /.well-known/agent.json\` (also at \`/agent.json\`).
- **Open Agent Card (OAC) JSON-LD** — embedded inline at \`/\` and \`/agent.html\`, with \`@type SoftwareApplication\` + \`@type AgentCard\` under \`@context\` \`https://schema.org\` + \`https://a2a-protocol.org/v1\`.
- **Earn rails** — every shim exposes \`hive_earn_register\`, \`hive_earn_me\`, \`hive_earn_leaderboard\` against \`https://receipts.thehiveryiq.com/v1/earn/*\`.
  Resilient to upstream cold-start: returns a structured "earn rails not yet live" body if upstream isn't yet deployed.
- **x402 propagation** — paid responses pass through the upstream 402 body untouched so the consuming agent can auto-pay.
- **Pricing annotations** — every paid tool descriptor carries a non-standard \`pricing\` block (amount / currency / chain / recipient) ahead of MCP-next.
- Brand: Hive Civilization gold \`#C08D23\`. Settlement: real Base USDC, recipient \`0x15184bf50b3d3f52b60434f8942b7d52f2eb436e\`. No mock, no testnet.

<!-- HIVE-GAMIFICATION-META-START -->
## Hive Gamification

This MCP server is part of the Hive Civilization gamification surface (10-mechanic capability taxonomy).

- Capability taxonomy: https://hive-gamification.onrender.com/.well-known/hive-gamification.json
- Centrifuge dashboard: https://hive-gamification.onrender.com/.well-known/hive-centrifuge.json
- Consolidated OpenAPI: https://hive-gamification.onrender.com/.well-known/openapi.json

**Surface tags:** `gamification.spec.v1` · `gamification.surface.public` · `gamification.signal.read-only` · `gamification.settlement.real-rails`

Real rails on Base L2 (USDC `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`). Read-only signal layer. Brand gold `#C08D23`.
<!-- HIVE-GAMIFICATION-META-END -->

## Hive Civilization Directory

Part of the Hive Civilization — agent-native financial infrastructure.

- Endpoint Directory: https://thehiveryiq.com
- Live Leaderboard: https://hive-a2amev.onrender.com/leaderboard
- Revenue Dashboard: https://hivemine-dashboard.onrender.com
- Other MCP Servers: https://github.com/srotzin?tab=repositories&q=hive-mcp

Brand: #C08D23
<!-- /hive-footer -->

---

## About Hive Civilization

This MCP server is part of the [Hive Civilization](https://thehiveryiq.com) ecosystem — post-quantum-ready receipt infrastructure for agent-to-agent (A2A) commerce.

Each transaction can be receipted with [post-quantum receipts](https://thehiveryiq.com/post-quantum-receipts.html) using [ML-DSA-65 (NIST FIPS 204)](https://thehiveryiq.com/ml-dsa-receipts.html) dual signatures and [ML-KEM-768 (NIST FIPS 203)](https://thehiveryiq.com/post-quantum-receipts.html) key encapsulation. Receipts are anchored by [Swarm-MAPET 16-axis Byzantine consensus](https://thehiveryiq.com/swarm-mapet.html) and settled in USDC on Base 8453.

**Pricing:** per-call profiles from Nano $0.0001 to Swarm $0.0096. See [pricing](https://thehiveryiq.com/pricing.html).

**Learn more:**
- [How agent-to-agent commerce works (A2A / AP2 / MCP primer)](https://thehiveryiq.com/agent-to-agent-commerce.html)
- [Hive platform architecture](https://thehiveryiq.com/platform.html)
- [Developer SDKs (Node, Python, Go)](https://thehiveryiq.com/developers.html)
- [Compliance & EU AI Act alignment](https://thehiveryiq.com/compliance.html)

<!-- HIVE_FOOTER_END -->

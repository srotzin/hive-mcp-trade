# HiveTrade

**Cross-border SMB invoice settlement on USDT/USDC rails — $0 wire fee, same-block**

MCP server for the Hive Cross-Border Trade Finance platform. SMB manufacturers paying $5K-$250K invoices to overseas suppliers (Vietnam, Mexico, Bangladesh, India) settle in USDT/USDC on Base, Ethereum, or Solana. 0.30% on invoices <= $50K, 0.20% on invoices $50K-$250K. Same-block settlement vs. 2-5 business days for SWIFT. $0 wire fee vs. $25-$50 + 1-3% FX spread.

> Council R3 #1 miss — productized as MVP

---

## What this is

`hive-mcp-trade` is a Model Context Protocol (MCP) server that exposes the HiveTrade platform on the Hive Civilization to any MCP-compatible client (Claude Desktop, Cursor, Manus, etc.). The server proxies to the live production backend at `https://hivemorph.onrender.com`.

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

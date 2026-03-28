<p align="center">
  <img src="https://raw.githubusercontent.com/bhayanak/worldbank-mcp-server/main/packages/world-bank-vscode-extension/logo.png" alt="World Bank MCP Server" width="128" height="128" />
</p>

<h1 align="center">world-bank-mcp-server</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/world-bank-mcp-server"><img src="https://img.shields.io/npm/v/world-bank-mcp-server?style=flat-square&color=red" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/world-bank-mcp-server"><img src="https://img.shields.io/npm/dm/world-bank-mcp-server?style=flat-square&color=green" alt="Downloads"/></a>
  <a href="https://github.com/bhayanak/worldbank-mcp-server/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT"/></a>
  <a href="https://github.com/bhayanak/worldbank-mcp-server/actions"><img src="https://img.shields.io/github/actions/workflow/status/bhayanak/worldbank-mcp-server/ci.yml?style=flat-square" alt="CI"/></a>
</p>

<p align="center">
  A <strong>Model Context Protocol (MCP)</strong> server for the <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392">World Bank Open Data API v2</a>.<br/>
  10 tools · Zero authentication · LRU caching · Sparkline trends
</p>

---

## Quick Start

### With `npx` (recommended)

```bash
npx world-bank-mcp-server
```

### MCP Client Configuration

Add to your MCP client config (Claude Desktop, VS Code, etc.):

```json
{
  "mcpServers": {
    "world-bank": {
      "command": "npx",
      "args": ["-y", "world-bank-mcp-server"]
    }
  }
}
```

### VS Code Extension

For an integrated experience with automatic start/stop/restart, install the companion **[World Bank MCP Server extension](../world-bank-vscode-extension/README.md)**.

### Global Install

```bash
npm install -g world-bank-mcp-server
world-bank-mcp-server
```

## Tools

| Tool | Description |
|------|-------------|
| `wb_get_indicator` | Get indicator metadata (description, source, topics) |
| `wb_search_indicators` | Search indicators by keyword |
| `wb_get_country` | Get country profile with quick stats (GDP, population, etc.) |
| `wb_list_countries` | List countries filtered by region/income level |
| `wb_get_data` | Get indicator data for a country (year range or most recent) |
| `wb_get_timeseries` | Long-range time-series data with sparkline trends |
| `wb_compare_countries` | Compare 2–6 countries side-by-side on any indicator |
| `wb_list_topics` | List all data topics (health, education, economy, …) |
| `wb_get_topic_indicators` | Get indicators under a specific topic |
| `wb_get_regional_data` | Regional/income-group aggregate data |

## Example Queries

```
"What is India's GDP growth over the last 10 years?"
→ wb_get_timeseries { country: "IN", indicator: "NY.GDP.MKTP.KD.ZG" }

"Compare life expectancy between Japan, Brazil, and Nigeria"
→ wb_compare_countries { countries: ["JP", "BR", "NG"], indicator: "SP.DYN.LE00.IN" }

"Show me education spending indicators"
→ wb_search_indicators { query: "education expenditure" }
```

## Configuration

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `WORLDBANK_MCP_BASE_URL` | `https://api.worldbank.org/v2` | API base URL |
| `WORLDBANK_MCP_CACHE_TTL_MS` | `3600000` | Cache TTL in ms (1 hour) |
| `WORLDBANK_MCP_CACHE_MAX_SIZE` | `200` | Max cached entries |
| `WORLDBANK_MCP_TIMEOUT_MS` | `15000` | Request timeout in ms |
| `WORLDBANK_MCP_PER_PAGE` | `100` | Results per API page |
| `WORLDBANK_MCP_MRV` | `5` | Most recent values count |

Example:

```bash
WORLDBANK_MCP_TIMEOUT_MS=30000 WORLDBANK_MCP_CACHE_TTL_MS=7200000 npx world-bank-mcp-server
```

## License

[MIT](https://github.com/bhayanak/worldbank-mcp-server/blob/main/LICENSE)

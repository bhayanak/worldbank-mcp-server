<p align="center">
  <img src="logo.png" alt="World Bank MCP Server" width="128" height="128" />
</p>

<h1 align="center">World Bank MCP Server — VS Code Extension</h1>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=bhayanak.world-bank-vscode-extension"><img src="https://img.shields.io/visual-studio-marketplace/v/bhayanak.world-bank-vscode-extension?style=flat-square&color=blue" alt="Marketplace Version"/></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=bhayanak.world-bank-vscode-extension"><img src="https://img.shields.io/visual-studio-marketplace/i/bhayanak.world-bank-vscode-extension?style=flat-square&color=green" alt="Installs"/></a>
  <a href="https://github.com/bhayanak/worldbank-mcp-server/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT"/></a>
</p>

<p align="center">
  Access World Bank Open Data directly in VS Code through the <strong>Model Context Protocol (MCP)</strong>.<br/>
  Development indicators · Country profiles · Time-series analysis · Cross-country comparisons
</p>

---

## Features

- **Automatic MCP registration** — appears in VS Code's MCP servers list with start/stop/restart controls
- **10 data tools** powered by the [World Bank API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392)
- **Zero authentication** — the World Bank API is free and open
- **Configurable** — cache TTL, timeout, page size, and more via VS Code settings

## Installation

### From Marketplace

Search for **"World Bank MCP Server"** in the VS Code Extensions view, or:

### From VSIX

```bash
code --install-extension world-bank-vscode-extension-<version>.vsix
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

## Configuration

Open **Settings** → search `worldBankMcp`:

| Setting | Default | Description |
|---------|---------|-------------|
| `worldBankMcp.baseUrl` | `https://api.worldbank.org/v2` | API base URL |
| `worldBankMcp.cacheTtlMs` | `3600000` | Cache TTL in ms (1 hour) |
| `worldBankMcp.cacheMaxSize` | `200` | Max cached entries |
| `worldBankMcp.timeoutMs` | `15000` | Request timeout in ms |
| `worldBankMcp.perPage` | `100` | Results per API page |
| `worldBankMcp.mrv` | `5` | Most recent values count |

## Requirements

- VS Code **1.99.0+**

## License

[MIT](https://github.com/bhayanak/worldbank-mcp-server/blob/main/LICENSE)
- GitHub Copilot extension (for MCP tool usage)

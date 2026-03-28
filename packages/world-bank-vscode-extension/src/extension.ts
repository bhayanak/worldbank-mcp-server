import * as vscode from 'vscode'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext): void {
  const serverPath = path.join(context.extensionPath, 'dist', 'server.js')
  const outputChannel = vscode.window.createOutputChannel('World Bank MCP')
  context.subscriptions.push(outputChannel)

  // Register MCP server definition provider
  const provider: vscode.McpServerDefinitionProvider = {
    provideMcpServerDefinitions(_token: vscode.CancellationToken) {
      const env = buildEnvFromConfig(vscode.workspace.getConfiguration('worldBankMcp'))
      return [
        new vscode.McpStdioServerDefinition(
          'World Bank MCP Server',
          process.execPath,
          [serverPath],
          env,
          context.extension.packageJSON.version,
        ),
      ]
    },
  }

  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider('world-bank-mcp', provider),
  )

  // Watch for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('worldBankMcp')) {
        vscode.window.showInformationMessage(
          'World Bank MCP configuration changed. Restart the MCP server for changes to take effect.',
        )
      }
    }),
  )

  outputChannel.appendLine('World Bank MCP extension activated')
}

export function deactivate(): void {}

function buildEnvFromConfig(config: vscode.WorkspaceConfiguration): Record<string, string> {
  const env: Record<string, string> = {}

  const baseUrl = config.get<string>('baseUrl')
  if (baseUrl) env.WORLDBANK_MCP_BASE_URL = baseUrl

  const cacheTtlMs = config.get<number>('cacheTtlMs')
  if (cacheTtlMs !== undefined) env.WORLDBANK_MCP_CACHE_TTL_MS = String(cacheTtlMs)

  const cacheMaxSize = config.get<number>('cacheMaxSize')
  if (cacheMaxSize !== undefined) env.WORLDBANK_MCP_CACHE_MAX_SIZE = String(cacheMaxSize)

  const timeoutMs = config.get<number>('timeoutMs')
  if (timeoutMs !== undefined) env.WORLDBANK_MCP_TIMEOUT_MS = String(timeoutMs)

  const perPage = config.get<number>('perPage')
  if (perPage !== undefined) env.WORLDBANK_MCP_PER_PAGE = String(perPage)

  const mrv = config.get<number>('mrv')
  if (mrv !== undefined) env.WORLDBANK_MCP_MRV = String(mrv)

  return env
}

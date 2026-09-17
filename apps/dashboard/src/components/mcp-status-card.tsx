import { CircleCheckBig, CircleX } from 'lucide-react';
import type { McpConnectionStatus } from '@/lib/api';

export function McpStatusCard({ status }: { status: McpConnectionStatus }) {
  if (status.status === 'connected') {
    return (
      <section className="mcp-status-card connected" aria-label="MCP connection status">
        <CircleCheckBig aria-hidden="true" size={19} />
        <div>
          <p>MCP status</p>
          <strong>Connected to {status.mcp.service}</strong>
        </div>
        <span className="mcp-status-meta">stdio · browser lifecycle available</span>
      </section>
    );
  }

  return (
    <section className="mcp-status-card unavailable" aria-label="MCP connection status">
      <CircleX aria-hidden="true" size={19} />
      <div>
        <p>MCP status</p>
        <strong>Unavailable</strong>
      </div>
      <span className="mcp-status-meta">{status.error.safeMessage}</span>
    </section>
  );
}

import { z } from 'zod';

export const statusInputSchema = z.strictObject({});

export const statusOutputSchema = z.strictObject({
  schemaVersion: z.literal(1),
  service: z.literal('reprosift-mcp'),
  version: z.literal('0.0.0'),
  status: z.literal('ok'),
  transport: z.literal('stdio'),
  capabilities: z.strictObject({ browserExecution: z.literal(true) }),
});

export type ServerStatus = z.infer<typeof statusOutputSchema>;

export function getServerStatus(): ServerStatus {
  return statusOutputSchema.parse({
    schemaVersion: 1,
    service: 'reprosift-mcp',
    version: '0.0.0',
    status: 'ok',
    transport: 'stdio',
    capabilities: { browserExecution: true },
  });
}

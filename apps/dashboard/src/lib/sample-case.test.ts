import { describe, expect, it } from 'vitest';

import { sampleCase, sampleResultPath, sampleWorkspacePath } from './sample-case';

describe('sample case links', () => {
  it('keeps preview routes tied to the sample identifier', () => {
    expect(sampleWorkspacePath).toBe(`/investigations/${sampleCase.id}`);
    expect(sampleResultPath).toBe(`${sampleWorkspacePath}/result`);
  });

  it('keeps the authored expected result separate from the reported defect', () => {
    expect(sampleCase.requirementId).toBe('REQ-CART-001');
    expect(sampleCase.expectedBehavior).toContain('total is $90');
    expect(sampleCase.expectedBehavior).not.toContain('$85');
  });
});

import { describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import { run } from '../../src/index';

describe('evaluate-policy-action', () => {
  it('mock BLOCK', async () => {
    vi.spyOn(core, 'setOutput').mockImplementation(() => {});
    vi.spyOn(core, 'info').mockImplementation(() => {});
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      const m: Record<string, string> = {
        tenant: 't',
        'artifact-digest': 'sha256:' + 'c'.repeat(64),
        policy: 'demo:BLOCK',
        environment: 'prod',
        'evidence-bundle-id': '',
        mode: 'mock',
      };
      return m[name] ?? '';
    });
    await run();
    const calls = (core.setOutput as unknown as { mock: { calls: [string, string][] } }).mock.calls;
    const decision = calls.find((x) => x[0] === 'decision')?.[1];
    expect(decision).toBe('BLOCK');
  });
});

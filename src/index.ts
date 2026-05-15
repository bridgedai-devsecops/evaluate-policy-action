import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { fail, getOptionalInput, getRequiredInput, maskSecret } from './lib/action-core';
import { setOutputs } from './lib/outputs';
import { appendJobSummary } from './lib/summary';
import { ConfigurationError } from './lib/errors';
import { normalizeApiBaseUrl, parseEnum } from './lib/validation';
import { postJsonWithRetries } from './lib/bridgedai-client';

function mockDecisionFromPolicy(policy: string): { decision: 'ALLOW' | 'WARN' | 'BLOCK'; score: number; reason: string } {
  const p = policy.toUpperCase();
  if (p.includes(':BLOCK')) return { decision: 'BLOCK', score: 0, reason: 'MOCK: policy contains :BLOCK' };
  if (p.includes(':WARN')) return { decision: 'WARN', score: 70, reason: 'MOCK: policy contains :WARN' };
  return { decision: 'ALLOW', score: 100, reason: 'MOCK: default ALLOW' };
}

export async function run(): Promise<void> {
  const tenant = getRequiredInput('tenant');
  const artifactDigest = getRequiredInput('artifact-digest');
  const policy = getRequiredInput('policy');
  const environment = getOptionalInput('environment');
  const evidenceBundleId = getOptionalInput('evidence-bundle-id');
  const mode = parseEnum('mode', getOptionalInput('mode') || 'production', ['production', 'mock'] as const);

  const resultPath = path.resolve('.bridgedai/policy-result.json');

  if (mode === 'mock') {
    core.info('MOCK MODE ENABLED');
    const md = mockDecisionFromPolicy(policy);
    const body = {
      bridgedaiMock: true,
      tenant,
      artifactDigest,
      policy,
      environment,
      evidenceBundleId,
      ...md,
    };
    await fs.promises.mkdir(path.dirname(resultPath), { recursive: true });
    await fs.promises.writeFile(resultPath, `${JSON.stringify(body, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });

    setOutputs({
      decision: md.decision,
      score: String(md.score),
      reason: md.reason,
      'policy-result-id': 'mock-policy-result-id',
      'policy-result-file': resultPath,
      'trust-graph-url': 'https://mock.invalid/trust-graph',
    });
    await appendJobSummary('## BridgedAI policy evaluation\n\n**MOCK MODE ENABLED**\n');
    return;
  }

  const apiUrl = normalizeApiBaseUrl(getRequiredInput('api-url'), 'api-url');
  const accessToken = getRequiredInput('access-token');
  maskSecret(accessToken);

  const url = `${apiUrl}/api/v1/release-gates/evaluate`;
  const res = await postJsonWithRetries<Record<string, unknown>>(
    url,
    { tenant, artifactDigest, policy, environment, evidenceBundleId },
    { Authorization: `Bearer ${accessToken}` },
  );

  const decision = String(res.decision ?? '').trim().toUpperCase();
  if (!['ALLOW', 'WARN', 'BLOCK'].includes(decision)) {
    throw new ConfigurationError(`Unexpected decision from BridgedAI: ${String(res.decision)}`);
  }

  await fs.promises.mkdir(path.dirname(resultPath), { recursive: true });
  await fs.promises.writeFile(resultPath, `${JSON.stringify(res, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });

  setOutputs({
    decision,
    score: String(res.score ?? ''),
    reason: String(res.reason ?? ''),
    'policy-result-id': String(res.policy_result_id ?? res.policyResultId ?? ''),
    'policy-result-file': resultPath,
    'trust-graph-url': String(res.trust_graph_url ?? res.trustGraphUrl ?? ''),
  });
  await appendJobSummary(`## BridgedAI policy evaluation\n\n- **decision**: \`${decision}\`\n`);
}

if (process.env.VITEST !== 'true') {
  void run().catch((e) => {
    fail(e instanceof Error ? e : new Error(String(e)));
  });
}

export type TestStatus = 'PASSED' | 'FAILED' | 'ESCALATED';

export interface TestCaseResult {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  status: TestStatus;
  durationMs: number;
  error?: string;
  escalation?: {
    featureId: string;
    targetMilestone: string;
    description: string;
    observed: string;
    expected: string;
  };
}

export interface TierResult {
  tier: 1 | 2 | 3 | 4;
  name: string;
  total: number;
  passed: number;
  failed: number;
  escalated: number;
  durationMs: number;
  cases: TestCaseResult[];
}

export interface RunnerOptions {
  baseUrl: string;
  strict: boolean;
  tier?: 1 | 2 | 3 | 4;
  verbose?: boolean;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Headers;
  data: T;
  rawText: string;
  durationMs: number;
}

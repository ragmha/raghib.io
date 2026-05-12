import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HealthPage } from '@/components/health/health-page'
import {
  parseStepsFile,
  parseInsightsFile,
} from '@/lib/health/schema'

export const metadata: Metadata = {
  title: 'Steps — Raghib Hasan',
  description:
    'Daily step counts from Apple Health, refreshed automatically via a privacy-preserving pipeline.',
}

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(process.cwd(), rel), 'utf-8'))
}

export default function Page() {
  const steps = parseStepsFile(loadJson('src/data/steps.json'))
  const insights = parseInsightsFile(loadJson('src/data/insights.json'))
  return <HealthPage steps={steps} insights={insights} />
}

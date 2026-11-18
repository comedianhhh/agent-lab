import type { ComponentType } from 'react'
import type { LabId } from '../data/lessons'
import { AwsLab } from './AwsLab'
import { DurableLab } from './DurableLab'
import { EvalsLab } from './EvalsLab'
import { GraphLab } from './GraphLab'
import { HybridLab } from './HybridLab'
import { InjectionLab } from './InjectionLab'
import { LoopLab } from './LoopLab'
import { LruLab } from './LruLab'
import { McpLab } from './McpLab'
import { RlsLab } from './RlsLab'
import { ReachLab } from './ReachLab'
import { SseLab } from './SseLab'
import { VoiceLab } from './VoiceLab'

export const LABS: Record<LabId, ComponentType> = {
  lru: LruLab, loop: LoopLab, graph: GraphLab, hybrid: HybridLab, rls: RlsLab, sse: SseLab,
  evals: EvalsLab, mcp: McpLab, voice: VoiceLab, durable: DurableLab, injection: InjectionLab, aws: AwsLab, reach: ReachLab,
}

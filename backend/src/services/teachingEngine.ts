/** Generates kid-friendly explanations of engineering concepts. */

import {
  getCurriculumMoment,
  TEACHING_SYSTEM_PROMPT,
  teachingUserPrompt,
  type TeachingMomentData,
} from '../prompts/teaching.js';
import { getLLMProvider } from '../providers/index.js';
import { getChatModel } from '../providers/models.js';

const TRIGGER_MAP: Record<string, [string, string]> = {
  plan_ready: ['decomposition', 'task_breakdown'],
  first_commit: ['source_control', 'first_commit'],
  subsequent_commit: ['source_control', 'multiple_commits'],
  test_result_pass: ['testing', 'test_pass'],
  test_result_fail: ['testing', 'test_fail'],
  coverage_update: ['testing', 'coverage'],
  tester_task_completed: ['testing', 'first_test_run'],
  reviewer_task_completed: ['code_review', 'first_review'],
  hardware_compile: ['hardware', 'compilation'],
  hardware_flash: ['hardware', 'flashing'],
  hardware_led: ['hardware', 'gpio'],
  hardware_lora: ['hardware', 'lora'],
  skill_used: ['prompt_engineering', 'first_skill'],
  rule_used: ['prompt_engineering', 'first_rule'],
  composite_skill_created: ['prompt_engineering', 'composite_skill'],
  context_variable_used: ['prompt_engineering', 'context_variables'],
};

export class TeachingEngine {
  private shownConcepts = new Set<string>();
  private commitCount = 0;

  async getMoment(
    eventType: string,
    eventDetails = '',
    nuggetType = '',
  ): Promise<TeachingMomentData | null> {
    let actualEvent = eventType;
    if (eventType === 'commit_created') {
      this.commitCount++;
      actualEvent = this.commitCount === 1 ? 'first_commit' : 'subsequent_commit';
    }

    const mapping = TRIGGER_MAP[actualEvent];
    if (!mapping) return null;

    const [concept, subConcept] = mapping;
    const dedupKey = `${concept}:${subConcept}`;
    if (this.shownConcepts.has(dedupKey)) return null;

    // Try curriculum first (fast path)
    const moment = getCurriculumMoment(concept, subConcept);
    if (moment) {
      this.shownConcepts.add(dedupKey);
      return { ...moment };
    }

    // API fallback
    try {
      const result = await this.apiFallback(eventType, eventDetails, nuggetType);
      if (result) {
        this.shownConcepts.add(dedupKey);
        return result;
      }
    } catch {
      // silent fallback failure
    }

    return null;
  }

  markShown(concept: string): void {
    this.shownConcepts.add(concept);
  }

  getShownConcepts(): string[] {
    return [...this.shownConcepts];
  }

  private async apiFallback(
    eventType: string,
    eventDetails: string,
    nuggetType: string,
  ): Promise<TeachingMomentData | null> {
    const prompt = teachingUserPrompt(eventType, eventDetails, nuggetType || 'software');
    const model = getChatModel();

    const provider = getLLMProvider();
    const response = await provider.chat({
      model,
      messages: [
        { role: 'system', content: TEACHING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      maxTokens: 300,
    });

    try {
      return JSON.parse(response.text) as TeachingMomentData;
    } catch {
      return null;
    }
  }
}

# Mission Starters Gallery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the existing ExamplePickerModal into a visual mission starters gallery with difficulty ratings, preview images, and kid-friendly presentation, triggered via a "New Project" button.

**Architecture:** Extend the existing `ExampleNugget` interface with `difficulty` and `previewImage` fields. Replace the current `ExamplePickerModal` card design with richer visual cards. Add 2 new web-only starter missions (Joke Machine, Pet Name Picker) to complement the existing 6. Wire a "New Project" sidebar button to the modal.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Blockly workspace JSON

---

### Task 1: Extend ExampleNugget interface with difficulty and preview fields

**Files:**
- Modify: `frontend/src/lib/examples/index.ts`

**Step 1: Update the interface**

Add `difficulty` and `previewImage` to `ExampleNugget`:

```typescript
export interface ExampleNugget {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'hardware' | 'multi-agent' | 'game';
  difficulty: 1 | 2 | 3;
  color: string;
  accentColor: string;
  previewImage?: string;
  workspace: Record<string, unknown>;
  skills: Skill[];
  rules: Rule[];
  portals: Portal[];
}
```

**Step 2: Add difficulty to existing examples**

Add `difficulty` field to each example import file:
- `simpleWebApp.ts` → `difficulty: 1`
- `hardwareBlink.ts` → `difficulty: 1`
- `teamBuild.ts` → `difficulty: 2`
- `spaceDodge.ts` → `difficulty: 2`
- `skillShowcase.ts` → `difficulty: 2`
- `rulesShowcase.ts` → `difficulty: 2`

**Step 3: Verify no type errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/lib/examples/
git commit -m "feat: add difficulty and previewImage fields to ExampleNugget"
```

---

### Task 2: Add Joke Machine starter mission

**Files:**
- Create: `frontend/src/lib/examples/jokeMachine.ts`
- Modify: `frontend/src/lib/examples/index.ts`

**Step 1: Create the example file**

```typescript
import type { ExampleNugget } from './index';

export const jokeMachine: ExampleNugget = {
  id: 'joke-machine',
  name: 'Joke Machine',
  description: 'A website that tells random jokes — click for a new one!',
  category: 'web',
  difficulty: 1,
  color: 'bg-yellow-100',
  accentColor: 'text-yellow-700',
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'nugget_goal',
          x: 30,
          y: 30,
          fields: { GOAL_TEXT: 'A website that tells random jokes' },
          next: {
            block: {
              type: 'nugget_template',
              fields: { TEMPLATE_TYPE: 'website' },
              next: {
                block: {
                  type: 'feature',
                  fields: { FEATURE_TEXT: 'show a random joke on the page' },
                  next: {
                    block: {
                      type: 'feature',
                      fields: { FEATURE_TEXT: 'a button that shows a new random joke when clicked' },
                      next: {
                        block: {
                          type: 'look_like',
                          fields: { STYLE_TEXT: 'fun and playful with big text and bright colors' },
                          next: {
                            block: {
                              type: 'deploy_web',
                              fields: {},
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  skills: [],
  rules: [],
  portals: [],
};
```

**Step 2: Register in index.ts**

Add import and add to `EXAMPLE_NUGGETS` array.

**Step 3: Verify no type errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/lib/examples/jokeMachine.ts frontend/src/lib/examples/index.ts
git commit -m "feat: add Joke Machine starter mission"
```

---

### Task 3: Add Pet Name Picker starter mission

**Files:**
- Create: `frontend/src/lib/examples/petNamePicker.ts`
- Modify: `frontend/src/lib/examples/index.ts`

**Step 1: Create the example file**

```typescript
import type { ExampleNugget } from './index';

export const petNamePicker: ExampleNugget = {
  id: 'pet-name-picker',
  name: 'Pet Name Picker',
  description: 'Generate the perfect name for your pet — pick a species and get fun name ideas!',
  category: 'web',
  difficulty: 2,
  color: 'bg-green-100',
  accentColor: 'text-green-700',
  workspace: {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'nugget_goal',
          x: 30,
          y: 30,
          fields: { GOAL_TEXT: 'A pet name generator website' },
          next: {
            block: {
              type: 'nugget_template',
              fields: { TEMPLATE_TYPE: 'website' },
              next: {
                block: {
                  type: 'feature',
                  fields: { FEATURE_TEXT: 'let the user pick a pet type: dog, cat, hamster, or fish' },
                  next: {
                    block: {
                      type: 'feature',
                      fields: { FEATURE_TEXT: 'generate 5 creative name suggestions when a pet type is selected' },
                      next: {
                        block: {
                          type: 'feature',
                          fields: { FEATURE_TEXT: 'a button to get 5 more names' },
                          next: {
                            block: {
                              type: 'look_like',
                              fields: { STYLE_TEXT: 'cute and colorful with animal emojis and rounded cards' },
                              next: {
                                block: {
                                  type: 'deploy_web',
                                  fields: {},
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  },
  skills: [],
  rules: [],
  portals: [],
};
```

**Step 2: Register in index.ts**

Add import and add to `EXAMPLE_NUGGETS` array.

**Step 3: Verify no type errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/lib/examples/petNamePicker.ts frontend/src/lib/examples/index.ts
git commit -m "feat: add Pet Name Picker starter mission"
```

---

### Task 4: Enhance ExamplePickerModal with difficulty stars and richer cards

**Files:**
- Modify: `frontend/src/components/shared/ExamplePickerModal.tsx`

**Step 1: Add difficulty star rendering**

Add a helper function at the top of the file:

```typescript
function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-0.5" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          className={`text-xs ${star <= level ? 'text-accent-gold' : 'text-atelier-text-muted/30'}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}
```

**Step 2: Update card layout**

Replace the card button contents to include difficulty stars and a more prominent tagline:

```typescript
<button
  key={example.id}
  data-testid={`example-card-${example.id}`}
  onClick={() => onSelect(example)}
  className="bg-atelier-surface/70 rounded-xl p-5 text-left hover:bg-atelier-elevated border border-border-subtle hover:border-border-medium transition-all cursor-pointer group"
>
  {example.previewImage && (
    <div className="w-full h-24 rounded-lg mb-3 overflow-hidden bg-atelier-base/50">
      <img src={example.previewImage} alt={example.name} className="w-full h-full object-cover" />
    </div>
  )}
  <div className="flex items-center justify-between mb-1">
    <h3 className="font-display font-semibold text-atelier-text group-hover:text-accent-gold transition-colors">
      {example.name}
    </h3>
    <DifficultyStars level={example.difficulty} />
  </div>
  <div className="flex items-center gap-2 mb-2">
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[example.category]}`}>
      {CATEGORY_LABELS[example.category]}
    </span>
  </div>
  <p className="text-sm text-atelier-text-secondary">{example.description}</p>
</button>
```

**Step 3: Update modal title to be kid-friendly**

Change the title from "Choose a Nugget to Explore" to "Pick a Mission!" and subtitle to "Choose a project to build — you can customize it before launching!".

**Step 4: Verify no type errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/components/shared/ExamplePickerModal.tsx
git commit -m "feat: enhance ExamplePickerModal with difficulty stars and richer cards"
```

---

### Task 5: Write tests for the enhanced ExamplePickerModal

**Files:**
- Create: `frontend/src/components/shared/ExamplePickerModal.test.tsx`

**Step 1: Write the test file**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ExamplePickerModal from './ExamplePickerModal';
import type { ExampleNugget } from '../../lib/examples';

const mockExample: ExampleNugget = {
  id: 'test-mission',
  name: 'Test Mission',
  description: 'A test mission description',
  category: 'web',
  difficulty: 2,
  color: 'bg-blue-100',
  accentColor: 'text-blue-700',
  workspace: { blocks: {} },
  skills: [],
  rules: [],
  portals: [],
};

const mockExampleWithExtras: ExampleNugget = {
  ...mockExample,
  id: 'test-mission-2',
  name: 'Mission With Extras',
  difficulty: 3,
  skills: [{ id: 's1', name: 'Skill 1', prompt: 'do something', category: 'feature' }],
  rules: [{ id: 'r1', name: 'Rule 1', prompt: 'check something', trigger: 'on_task_complete' }],
};

describe('ExamplePickerModal', () => {
  it('renders mission cards with names and descriptions', () => {
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Test Mission')).toBeInTheDocument();
    expect(screen.getByText('A test mission description')).toBeInTheDocument();
  });

  it('renders difficulty stars', () => {
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const stars = screen.getByLabelText('Difficulty 2 of 3');
    expect(stars).toBeInTheDocument();
  });

  it('calls onSelect when a card is clicked', async () => {
    const onSelect = vi.fn();
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );
    await userEvent.click(screen.getByTestId('example-card-test-mission'));
    expect(onSelect).toHaveBeenCalledWith(mockExample);
  });

  it('calls onClose when blank canvas link is clicked', async () => {
    const onClose = vi.fn();
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={vi.fn()}
        onClose={onClose}
      />
    );
    await userEvent.click(screen.getByText(/blank canvas/i));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows category badge', () => {
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Web')).toBeInTheDocument();
  });

  it('shows skill and rule counts when present', () => {
    render(
      <ExamplePickerModal
        examples={[mockExampleWithExtras]}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/1 skill/)).toBeInTheDocument();
    expect(screen.getByText(/1 rule/)).toBeInTheDocument();
  });
});
```

**Step 2: Run the tests**

Run: `cd frontend && npx vitest run src/components/shared/ExamplePickerModal.test.tsx`
Expected: All 6 tests pass

**Step 3: Commit**

```bash
git add frontend/src/components/shared/ExamplePickerModal.test.tsx
git commit -m "test: add tests for enhanced ExamplePickerModal"
```

---

### Task 6: Sort examples by difficulty in the modal

**Files:**
- Modify: `frontend/src/components/shared/ExamplePickerModal.tsx`

**Step 1: Sort examples before rendering**

Inside the component, sort the examples array so easier missions appear first:

```typescript
const sortedExamples = [...examples].sort((a, b) => a.difficulty - b.difficulty);
```

Use `sortedExamples` instead of `examples` in the `.map()` call.

**Step 2: Verify no type errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Run tests**

Run: `cd frontend && npx vitest run src/components/shared/ExamplePickerModal.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add frontend/src/components/shared/ExamplePickerModal.tsx
git commit -m "feat: sort mission cards by difficulty (easiest first)"
```

---

## Summary

| Task | What | Files touched |
|------|------|---------------|
| 1 | Add `difficulty` + `previewImage` to ExampleNugget | `examples/index.ts` + 6 example files |
| 2 | Joke Machine starter mission | `examples/jokeMachine.ts`, `examples/index.ts` |
| 3 | Pet Name Picker starter mission | `examples/petNamePicker.ts`, `examples/index.ts` |
| 4 | Richer cards with difficulty stars | `ExamplePickerModal.tsx` |
| 5 | Tests for modal | `ExamplePickerModal.test.tsx` |
| 6 | Sort by difficulty | `ExamplePickerModal.tsx` |

No backend changes. No new dependencies. Builds on existing patterns entirely.

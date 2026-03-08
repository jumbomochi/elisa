import { render, screen, fireEvent } from '@testing-library/react';
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

  it('calls onSelect when a card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('example-card-test-mission'));
    expect(onSelect).toHaveBeenCalledWith(mockExample);
  });

  it('calls onClose when blank canvas link is clicked', () => {
    const onClose = vi.fn();
    render(
      <ExamplePickerModal
        examples={[mockExample]}
        onSelect={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText(/blank canvas/i));
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

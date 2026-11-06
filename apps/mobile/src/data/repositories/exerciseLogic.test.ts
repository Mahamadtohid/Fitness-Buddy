import { buildCreateCustomExerciseChange, type CustomExerciseInput } from './exerciseLogic';

const input: CustomExerciseInput = {
  name: 'Cable Crunch',
  muscleGroup: 'core',
  equipment: 'cable',
  isLowerBody: false,
  repMin: 12,
  repMax: 20,
  restSeconds: 60,
};

describe('buildCreateCustomExerciseChange', () => {
  it('creates a custom exercise row and one upsert outbox op', () => {
    const { entry, outboxRow } = buildCreateCustomExerciseChange({
      input,
      now: '2026-11-06T06:00:00.000Z',
      newId: 'exercise-1',
      newOpId: 'op-1',
    });

    expect(entry).toMatchObject({ id: 'exercise-1', name: 'Cable Crunch', isCustom: 1, isLowerBody: 0, version: 0 });
    expect(outboxRow).toMatchObject({ opId: 'op-1', entity: 'custom_exercise', recordId: 'exercise-1', op: 'upsert', baseVersion: null });
    expect(JSON.parse(outboxRow.payload)).toEqual({
      name: 'Cable Crunch',
      muscleGroup: 'core',
      equipment: 'cable',
      isLowerBody: false,
      repMin: 12,
      repMax: 20,
      restSeconds: 60,
      clientUpdatedAt: '2026-11-06T06:00:00.000Z',
    });
  });
});

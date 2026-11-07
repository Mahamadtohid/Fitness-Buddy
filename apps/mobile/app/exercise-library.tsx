import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  KeyboardAwareScreen,
  spacing,
  TextField,
  Typography,
  type TextFieldHandle,
} from '../src/design';
import {
  createCustomExercise,
  listExercisesByMuscleGroup,
} from '../src/data/repositories/exerciseRepository';
import type { ExerciseRow } from '../src/data/db/schema';

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ExerciseLibraryScreen() {
  const [grouped, setGrouped] = useState<Record<string, ExerciseRow[]>>(() => listExercisesByMuscleGroup());
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [repMin, setRepMin] = useState('8');
  const [repMax, setRepMax] = useState('12');
  const [restSeconds, setRestSeconds] = useState('90');
  const [isLowerBody, setIsLowerBody] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const muscleGroupRef = useRef<TextFieldHandle>(null);
  const equipmentRef = useRef<TextFieldHandle>(null);
  const repMinRef = useRef<TextFieldHandle>(null);
  const repMaxRef = useRef<TextFieldHandle>(null);
  const restSecondsRef = useRef<TextFieldHandle>(null);

  function resetForm() {
    setName('');
    setMuscleGroup('');
    setEquipment('');
    setRepMin('8');
    setRepMax('12');
    setRestSeconds('90');
    setIsLowerBody(false);
  }

  function onAddExercise() {
    setFormError(null);
    const parsedRepMin = Number(repMin);
    const parsedRepMax = Number(repMax);
    const parsedRest = Number(restSeconds);
    if (!name.trim() || !muscleGroup.trim()) {
      setFormError('Name and muscle group are required.');
      return;
    }
    if (!Number.isFinite(parsedRepMin) || !Number.isFinite(parsedRepMax) || !Number.isFinite(parsedRest)) {
      setFormError('Rep range and rest seconds must be numbers.');
      return;
    }

    createCustomExercise({
      name: name.trim(),
      muscleGroup: muscleGroup.trim().toLowerCase(),
      equipment: equipment.trim() || null,
      isLowerBody,
      repMin: parsedRepMin,
      repMax: parsedRepMax,
      restSeconds: parsedRest,
    });

    setGrouped(listExercisesByMuscleGroup());
    resetForm();
    setShowForm(false);
  }

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <Typography variant="headline">Exercises</Typography>

      <Button
        variant="secondary"
        label={showForm ? 'Cancel' : 'Add custom exercise'}
        onPress={() => setShowForm((v) => !v)}
      />

      {showForm ? (
        <Card style={styles.form}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => muscleGroupRef.current?.focus()}
          />
          <TextField
            ref={muscleGroupRef}
            label="Muscle group"
            value={muscleGroup}
            onChangeText={setMuscleGroup}
            autoCapitalize="none"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => equipmentRef.current?.focus()}
          />
          <TextField
            ref={equipmentRef}
            label="Equipment (optional)"
            value={equipment}
            onChangeText={setEquipment}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => repMinRef.current?.focus()}
          />
          <View style={styles.formRow}>
            <View style={styles.formInput}>
              <TextField
                ref={repMinRef}
                label="Rep min"
                value={repMin}
                onChangeText={setRepMin}
                keyboardType="number-pad"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => repMaxRef.current?.focus()}
              />
            </View>
            <View style={styles.formInput}>
              <TextField
                ref={repMaxRef}
                label="Rep max"
                value={repMax}
                onChangeText={setRepMax}
                keyboardType="number-pad"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => restSecondsRef.current?.focus()}
              />
            </View>
            <View style={styles.formInput}>
              <TextField
                ref={restSecondsRef}
                label="Rest (s)"
                value={restSeconds}
                onChangeText={setRestSeconds}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>
          <Button
            variant="secondary"
            label={isLowerBody ? 'Lower body: yes' : 'Lower body: no'}
            onPress={() => setIsLowerBody((v) => !v)}
          />
          {formError ? (
            <Typography variant="body" color="danger">
              {formError}
            </Typography>
          ) : null}
          <Button label="Save exercise" onPress={onAddExercise} />
        </Card>
      ) : null}

      {Object.keys(grouped).length === 0 ? (
        <Typography variant="body" color="secondary">
          No exercises yet — add a custom one above.
        </Typography>
      ) : null}

      {Object.entries(grouped).map(([group, exercises]) => (
        <View key={group} style={styles.section}>
          <Typography variant="title">{titleCase(group)}</Typography>
          {exercises.map((exercise) => (
            <Pressable
              key={exercise.id}
              onPress={() => router.push({ pathname: '/exercise/[exerciseId]', params: { exerciseId: exercise.id } })}
            >
              <Card style={styles.exerciseRow}>
                <Typography variant="bodyStrong">{exercise.name}</Typography>
                <Typography variant="caption" color="secondary">
                  {exercise.equipment ? `${exercise.equipment} · ` : ''}
                  {exercise.repMin}-{exercise.repMax} reps · rest {exercise.restSeconds}s
                  {exercise.isCustom ? ' · custom' : ''}
                </Typography>
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  // KeyboardAwareScreen already supplies `padding: spacing.lg` / `gap: spacing.md`; this screen only
  // needs the extra bottom breathing room its long list had before.
  content: {
    paddingBottom: spacing.xxl,
  },
  form: {
    gap: spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formInput: {
    flex: 1,
  },
  section: {
    gap: spacing.xs,
  },
  exerciseRow: {
    gap: spacing.xs / 2,
  },
});

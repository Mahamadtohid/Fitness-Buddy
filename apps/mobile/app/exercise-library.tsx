import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  spacing,
  TextField,
  Typography,
  useTheme,
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

/** Name, equipment or muscle group — searching "cable", "chest" or "row" should all work. */
function matches(exercise: ExerciseRow, needle: string): boolean {
  return (
    exercise.name.toLowerCase().includes(needle) ||
    exercise.muscleGroup.toLowerCase().includes(needle) ||
    (exercise.equipment ?? '').toLowerCase().includes(needle)
  );
}

export default function ExerciseLibraryScreen() {
  const { colors } = useTheme();
  const [grouped, setGrouped] = useState<Record<string, ExerciseRow[]>>(() => listExercisesByMuscleGroup());
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');

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

  // Memoised rather than filtered in the render body: this screen ships ~80 catalog exercises and
  // the search field re-renders on every keystroke.
  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return Object.entries(grouped)
      .map(([group, exercises]) => ({
        title: group,
        data: needle.length === 0 ? exercises : exercises.filter((e) => matches(e, needle)),
      }))
      .filter((section) => section.data.length > 0);
  }, [grouped, query]);

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
    <SectionList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      // Guidelines §9/§14: ~80 catalog exercises used to render as one tall stack of Cards inside a
      // plain ScrollView with no way to find anything. A SectionList virtualises them and the
      // search field above filters them. `keyboardShouldPersistTaps="handled"` keeps tapping a
      // result working on the first press while the search keyboard is open.
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      ListHeaderComponent={
        <View style={styles.header}>
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

          <TextField
            label="Search"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, muscle group or equipment"
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Typography variant="title" style={styles.sectionHeader}>
          {titleCase(section.title)}
        </Typography>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/exercise/[exerciseId]', params: { exerciseId: item.id } })}
        >
          <Card style={styles.exerciseRow}>
            <Typography variant="bodyStrong">{item.name}</Typography>
            <Typography variant="caption" color="secondary">
              {item.equipment ? `${item.equipment} · ` : ''}
              {item.repMin}-{item.repMax} reps · rest {item.restSeconds}s
              {item.isCustom ? ' · custom' : ''}
            </Typography>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <Typography variant="body" color="secondary">
          {query.trim().length > 0
            ? `No exercises match “${query.trim()}”.`
            : 'No exercises yet — add a custom one above.'}
        </Typography>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.md,
    marginBottom: spacing.sm,
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
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  exerciseRow: {
    gap: spacing.xs / 2,
  },
});

/**
 * WorkoutNavigator - Workout Flow Stack
 * TrynerApp - Navigation
 *
 * Stack navigator for workout flow:
 * Setup → PreWorkout → ActiveWorkout → Summary
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WorkoutStackParamList } from './types';
import WorkoutSetupScreen from '@/features/workout/screens/WorkoutSetupScreen';
import PreWorkoutScreen from '@/features/workout/screens/PreWorkoutScreen';
import ActiveWorkoutScreen from '@/features/workout/screens/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '@/features/workout/screens/WorkoutSummaryScreen';

const Stack = createStackNavigator<WorkoutStackParamList>();

export const WorkoutNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="WorkoutSetup"
    >
      <Stack.Screen name="WorkoutSetup" component={WorkoutSetupScreen} />
      <Stack.Screen name="PreWorkout" component={PreWorkoutScreen} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
    </Stack.Navigator>
  );
};

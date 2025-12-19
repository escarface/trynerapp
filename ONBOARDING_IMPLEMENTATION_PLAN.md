# Onboarding Implementation Plan

## 📋 Overview

This plan guides you through implementing the "Kinetic Performance Tech" onboarding experience for TrynerApp.

**Timeline:** 2-3 hours
**Complexity:** Medium
**Dependencies:** expo-linear-gradient, expo-blur
**Files to Modify:** 5 files
**New Files:** 1 file (OnboardingScreen.tsx - already created)

---

## ✅ Pre-Implementation Checklist

- [x] OnboardingScreen.tsx created
- [x] Design documentation created (ONBOARDING_DESIGN.md)
- [ ] Dependencies installed
- [ ] Database schema verified
- [ ] Navigation configured
- [ ] AuthStore updated
- [ ] Testing completed

---

## 🚀 Implementation Steps

### STEP 1: Install Dependencies (5 min)

**Required packages:**
```bash
cd trynerapp
npx expo install expo-linear-gradient expo-blur
```

**Verify installation:**
```bash
# Check package.json
cat package.json | grep -A 2 "expo-linear-gradient\|expo-blur"
```

Expected output:
```json
"expo-linear-gradient": "~14.0.0",
"expo-blur": "~14.0.0"
```

---

### STEP 2: Update Database Types (10 min)

**File:** `src/core/database/types.ts`

**Verify these fields exist in User interface:**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;           // ✓ Check exists
  weight?: number;        // ✓ Check exists
  height?: number;        // ✓ Check exists
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';  // ✓ Check exists
  goal?: 'strength' | 'hypertrophy' | 'endurance';          // ✓ Check exists
  createdAt: number;
  updatedAt: number;
}
```

**Action:** If fields exist, skip. If not, add them.

**Verify database schema:**
```bash
# Check src/core/database/schema.ts
cat src/core/database/schema.ts | grep -E "age|weight|height|fitness_level|goal"
```

Expected: All fields should be in schema.

---

### STEP 3: Update AuthStore (10 min)

**File:** `src/features/auth/store/authStore.ts`

**Current state:**
```typescript
updateUser: (updates: Partial<User>) =>
  set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
```

**Action:** Verify `updateUser` function exists. It already does! ✓

**Test updateUser:**
No changes needed. The existing implementation supports all onboarding fields.

---

### STEP 4: Add Database Update Function (15 min)

**File:** `src/core/database/index.ts`

**Add this function** (insert after `getUserByEmail` function):

```typescript
/**
 * Update user profile data
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    age?: number;
    weight?: number;
    height?: number;
    fitnessLevel?: string;
    goal?: string;
  }
): Promise<void> => {
  const db = await getDatabase();

  const fieldsToUpdate: string[] = [];
  const values: any[] = [];

  if (updates.age !== undefined) {
    fieldsToUpdate.push('age = ?');
    values.push(updates.age);
  }
  if (updates.weight !== undefined) {
    fieldsToUpdate.push('weight = ?');
    values.push(updates.weight);
  }
  if (updates.height !== undefined) {
    fieldsToUpdate.push('height = ?');
    values.push(updates.height);
  }
  if (updates.fitnessLevel !== undefined) {
    fieldsToUpdate.push('fitness_level = ?');
    values.push(updates.fitnessLevel);
  }
  if (updates.goal !== undefined) {
    fieldsToUpdate.push('goal = ?');
    values.push(updates.goal);
  }

  if (fieldsToUpdate.length === 0) {
    return;
  }

  fieldsToUpdate.push('updated_at = ?');
  values.push(Date.now());
  values.push(userId);

  const query = `
    UPDATE users
    SET ${fieldsToUpdate.join(', ')}
    WHERE id = ?
  `;

  await db.runAsync(query, values);
};
```

**Export the function:**
```typescript
// At the end of index.ts exports
export { updateUserProfile };
```

---

### STEP 5: Update Navigation Structure (20 min)

**File:** `src/core/navigation/types.ts`

**Update AuthStackParamList:**
```typescript
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;  // ✓ Verify this exists
};
```

**File:** `src/core/navigation/AuthNavigator.tsx`

**Add OnboardingScreen to navigator:**

```typescript
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';

// Inside AuthNavigator component, add:
<Stack.Screen
  name="Onboarding"
  component={OnboardingScreen}
  options={{ headerShown: false }}
/>
```

Full navigator should look like:
```typescript
<Stack.Navigator
  screenOptions={{
    headerShown: false,
  }}
>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Register" component={RegisterScreen} />
  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
</Stack.Navigator>
```

---

### STEP 6: Update RegisterScreen Navigation (15 min)

**File:** `src/features/auth/screens/RegisterScreen.tsx`

**Find the registration success handler** (around line 113-127):

```typescript
// Auto-login after registration
login(user);

Alert.alert(
  '¡Cuenta creada!',
  'Tu cuenta ha sido creada exitosamente',
  [
    {
      text: 'Continuar',
      onPress: () => {
        // Navigate to onboarding or main app
        // TODO: Implement onboarding flow
      },
    },
  ]
);
```

**Replace with:**

```typescript
// Auto-login after registration
login(user);

// Navigate to onboarding
navigation.navigate('Onboarding' as never);
```

**Remove the Alert** completely since we're navigating immediately.

---

### STEP 7: Update OnboardingScreen Navigation (10 min)

**File:** `src/features/onboarding/screens/OnboardingScreen.tsx`

**Update the imports section** to add database function:

```typescript
import { updateUserProfile } from '@/core/database';
```

**Update `handleComplete` function** (around line 120):

```typescript
const handleComplete = async () => {
  if (!user) return;

  try {
    // Update database
    await updateUserProfile(user.id, {
      age: age ? parseInt(age) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseInt(height) : undefined,
      fitnessLevel: fitnessLevel || undefined,
      goal: goal || undefined,
    });

    // Update local store
    await updateUser({
      age: age ? parseInt(age) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseInt(height) : undefined,
      fitnessLevel: fitnessLevel || undefined,
      goal: goal || undefined,
    });

    // Navigation will happen automatically via RootNavigator
    // Since isAuthenticated is true and onboarding is complete
  } catch (error) {
    console.error('Onboarding completion error:', error);
    Alert.alert('Error', 'No pudimos guardar tu información. Intenta de nuevo.');
  }
};
```

**Update `handleSkip` function:**

```typescript
const handleSkip = () => {
  // User skipped onboarding, will navigate to main app
  // RootNavigator handles this automatically
};
```

---

### STEP 8: Update RootNavigator Logic (Optional Enhancement)

**File:** `src/core/navigation/RootNavigator.tsx`

**Current logic:**
```typescript
{isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
```

**Optional enhancement** (to prevent re-showing onboarding):

```typescript
const { isAuthenticated, user } = useAuthStore();
const needsOnboarding = user && (!user.age || !user.fitnessLevel || !user.goal);

{isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
```

**Note:** This is optional. The current logic works since:
- User completes onboarding → data saved → navigates to Home
- User never sees onboarding again (data persists in SQLite)

---

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Fresh Registration Flow:**
   ```
   ✓ Register new account
   ✓ Should navigate to Onboarding Step 1
   ✓ Enter age, weight, height
   ✓ Click "Continue"
   ✓ Should animate to Step 2
   ```

2. **Step 2 - Fitness Level:**
   ```
   ✓ Cards should appear with stagger animation
   ✓ Select a fitness level
   ✓ Card should glow and scale
   ✓ Haptic feedback should trigger (on iOS)
   ✓ Click "Continue"
   ✓ Should animate to Step 3
   ```

3. **Step 3 - Goal:**
   ```
   ✓ Cards should appear with stagger animation
   ✓ Select a goal
   ✓ Card should glow and scale
   ✓ Button should say "Start Training"
   ✓ Click "Start Training"
   ✓ Should save data and navigate to Home
   ```

4. **Progress Indicator:**
   ```
   ✓ Should show 1 of 3 on Step 1
   ✓ Progress bar should animate
   ✓ Dots should change color
   ✓ Should update to 2 of 3, then 3 of 3
   ```

5. **Skip Functionality:**
   ```
   ✓ Click "Skip" button (top right)
   ✓ Should navigate to Home
   ✓ User profile should remain incomplete
   ```

6. **Animations:**
   ```
   ✓ Card entrance: smooth spring animation
   ✓ Card selection: scale + glow effect
   ✓ Step transitions: slide left/right smoothly
   ✓ Progress bar: spring animation
   ```

7. **Data Persistence:**
   ```
   ✓ Complete onboarding
   ✓ Force quit app
   ✓ Relaunch app
   ✓ Login
   ✓ Should go directly to Home (not onboarding)
   ```

---

## 🐛 Troubleshooting

### Issue: "expo-linear-gradient not found"
**Solution:**
```bash
npx expo install expo-linear-gradient
npm start -- --clear
```

### Issue: "expo-blur not found"
**Solution:**
```bash
npx expo install expo-blur
npm start -- --clear
```

### Issue: Animations are janky
**Solution:**
- Ensure you're testing on a physical device (simulator can be slow)
- Check that `useNativeDriver: true` is set in all animations
- Verify Reanimated is properly configured in babel.config.js

### Issue: Haptic feedback not working
**Solution:**
- Haptic only works on iOS
- Test on physical iPhone (not simulator)
- Check that Vibration is imported from 'react-native'

### Issue: Navigation doesn't work after onboarding
**Solution:**
1. Check RootNavigator is watching `isAuthenticated`
2. Verify `login(user)` was called in RegisterScreen
3. Check authStore state with console.log

### Issue: Data not saving to database
**Solution:**
1. Check `updateUserProfile` function is exported
2. Verify SQLite database has the columns (age, weight, height, fitness_level, goal)
3. Add console.log in handleComplete to debug

---

## 📊 Implementation Checklist

### Phase 1: Setup (15 min)
- [ ] Install expo-linear-gradient
- [ ] Install expo-blur
- [ ] Verify dependencies in package.json
- [ ] Restart Expo dev server

### Phase 2: Database (15 min)
- [ ] Verify User type has all fields
- [ ] Add updateUserProfile function to database/index.ts
- [ ] Export updateUserProfile
- [ ] Test database update with console.log

### Phase 3: Navigation (25 min)
- [ ] Add Onboarding to AuthStackParamList
- [ ] Add OnboardingScreen to AuthNavigator
- [ ] Update RegisterScreen to navigate to Onboarding
- [ ] Update OnboardingScreen navigation handlers
- [ ] Test navigation flow end-to-end

### Phase 4: Testing (30 min)
- [ ] Test registration → onboarding flow
- [ ] Test all 3 steps
- [ ] Test animations and interactions
- [ ] Test skip functionality
- [ ] Test data persistence
- [ ] Test on iOS device (haptics)
- [ ] Test on Android device

### Phase 5: Refinement (30 min)
- [ ] Add error handling
- [ ] Add loading states
- [ ] Improve validation feedback
- [ ] Test edge cases
- [ ] Performance check
- [ ] Final polish

---

## 🎯 Success Criteria

✅ **Functional:**
- [ ] User can complete all 3 onboarding steps
- [ ] Data saves correctly to SQLite
- [ ] Navigation flows work seamlessly
- [ ] Skip functionality works
- [ ] No crashes or errors

✅ **Visual:**
- [ ] Animations are smooth (60fps)
- [ ] Gradients render correctly
- [ ] Cards respond to selection
- [ ] Progress indicator updates
- [ ] Typography matches design system

✅ **Performance:**
- [ ] No lag during animations
- [ ] Smooth transitions between steps
- [ ] Fast database saves
- [ ] Haptic feedback is immediate (iOS)

---

## 🚢 Next Steps After Implementation

1. **User Testing:**
   - Have 3-5 people test the onboarding flow
   - Gather feedback on clarity and motivation
   - Identify friction points

2. **Analytics (Future):**
   - Track completion rates per step
   - Identify where users drop off
   - A/B test different copy/visuals

3. **Enhancements (Future):**
   - Add "Back" button to navigate between steps
   - Save partial progress on each step
   - Add illustrations or animations
   - Implement smart defaults based on age/goal

4. **Accessibility (Future):**
   - Add screen reader support
   - Ensure sufficient color contrast
   - Add keyboard navigation (web)
   - Test with VoiceOver/TalkBack

---

## 📁 Files Changed Summary

### New Files (1):
- `src/features/onboarding/screens/OnboardingScreen.tsx`

### Modified Files (5):
- `src/core/database/index.ts` - Added updateUserProfile function
- `src/core/navigation/AuthNavigator.tsx` - Added Onboarding screen
- `src/core/navigation/types.ts` - Added Onboarding to types
- `src/features/auth/screens/RegisterScreen.tsx` - Navigate to onboarding
- `package.json` - Added expo-linear-gradient, expo-blur

### Documentation (2):
- `ONBOARDING_DESIGN.md` - Complete design specification
- `ONBOARDING_IMPLEMENTATION_PLAN.md` - This file

---

## 💡 Tips & Best Practices

1. **Test on Device:** Always test animations on a physical device for accurate performance
2. **Git Commits:** Commit after each phase for easy rollback
3. **Console Logging:** Add logs to debug navigation and data flow
4. **Gradual Implementation:** Implement one step at a time, test, then move to next
5. **Design Fidelity:** Stick to the design spec - the gradients and animations are key differentiators

---

## 🎓 Learning Resources

- **Reanimated 3 Docs:** https://docs.swmansion.com/react-native-reanimated/
- **Expo Linear Gradient:** https://docs.expo.dev/versions/latest/sdk/linear-gradient/
- **Spring Physics:** Understanding damping and stiffness for natural motion
- **React Native Gestures:** For future enhancement of card interactions

---

**Implementation Status:** Ready to Begin
**Estimated Time:** 2-3 hours
**Difficulty:** Medium
**Priority:** High (Blocks FASE 4-7)

Good luck! 🚀

# Onboarding Screen - Design Specification

## 🎨 Design Concept: "Kinetic Performance Tech"

### Aesthetic Direction
**Energy in Motion** - A premium onboarding experience that combines athletic performance data with human energy visualization. Think high-end sports technology (Whoop, Apple Fitness+) meets motivational coaching.

### Core Principles
1. **Performance Data Meets Energy**: Precision metrics wrapped in flowing, kinetic gradients
2. **Athletic Spring Physics**: Every interaction feels like muscle movement - powerful, precise, responsive
3. **Energy Visualization**: Progress and selections pulse with life force
4. **Motivational Precision**: Medical-grade data collection with soul

---

## 🎯 User Experience Flow

### Step 1: Physical Data (Medical Precision)
**Visual Theme:** Clean, data-driven, scientific

**Layout:**
- Large, confident headline: "Let's start with **the basics**"
- Gradient accent on "the basics" (Blue to Blue-dark)
- 3 inputs: Age, Weight (kg), Height (cm)
- Live data preview card with gradient background showing entered values

**Interactions:**
- Inputs with clean, minimal style
- Real-time validation
- Data preview updates instantly
- Smooth spring transitions

**Color Palette:**
- Primary Blue gradient (#2D4EFF → darker blue)
- Clean white backgrounds
- Subtle blue tints on data card

---

### Step 2: Fitness Level Selection (Energy Choice)
**Visual Theme:** Interactive energy cards with gradient flows

**Layout:**
- Headline: "Your fitness **level**"
- Gradient accent on "level" (Success Green gradient)
- 3 selection cards stacked vertically:
  - 🌱 Beginner - Success Green gradient
  - 💪 Intermediate - Primary Blue gradient
  - 🔥 Advanced - Orange-Red gradient

**Card States:**
- **Unselected**: White background, gray border, subtle shadow
- **Selected**: Full gradient background, white text, glow effect, scale 1.02
- **Interaction**: Scale to 0.96 on press, spring back with haptic feedback

**Animations:**
- Cards enter with staggered spring animation (delay: 0ms, 100ms, 200ms)
- Glow pulses when selected
- Smooth gradient transitions

**Color Gradients:**
- Beginner: `[#00C76C, #00D97E, #00EA8A]`
- Intermediate: `[#2D4EFF, #2D4EFF, #4D6AFF]`
- Advanced: `[#FF6B35, #FF8C42, #FFA94D]`

---

### Step 3: Goal Selection (Purpose Energy)
**Visual Theme:** Aspirational energy signatures

**Layout:**
- Headline: "Your training **goal**"
- Gradient accent on "goal" (Orange gradient)
- 3 selection cards:
  - 🏋️ Strength - Blue-Purple gradient
  - 💪 Hypertrophy - Purple-Pink gradient
  - 🏃 Endurance - Orange-Yellow gradient

**Card Design:**
- Same interactive pattern as Step 2
- Each goal has unique energy signature (gradient)
- Micro-interactions: scale, glow, haptic

**Color Gradients:**
- Strength: `[#2D4EFF, #4D6AFF, #5A3FFF]` (Blue to Purple)
- Hypertrophy: `[#9D4EDD, #C77DFF, #E0AAFF]` (Purple to Pink)
- Endurance: `[#FF6B35, #FF8C42, #FFA94D]` (Orange to Yellow)

---

## 🎭 Component Anatomy

### ProgressIndicator
**Visual:**
- Top-aligned, full-width
- 3 dots indicator (inactive: gray, active: blue, extended width)
- Progress bar with gradient fill (Blue → Green)
- "1 of 3" text below

**Animation:**
- Spring physics on progress bar fill
- Dot expand/contract with spring
- Gradient shifts as progress increases

**Specs:**
```
- Dots: 8x8px, gap 8px, active: 24x8px
- Bar: 4px height, rounded
- Gradient: Primary Blue → Success Green
- Spring config: damping 20, stiffness 90
```

---

### SelectionCard
**Structure:**
```
┌─────────────────────────────────────┐
│  ┌──┐                              │
│  │🌱│  Beginner              ○     │
│  └──┘  New to fitness              │
│        training                     │
└─────────────────────────────────────┘
```

**Anatomy:**
- Glow layer (absolute positioned, -4px offset, opacity 0.4)
- Card layer (gradient or white)
- Icon container (56x56px circle, semi-transparent white)
- Title (h3 variant)
- Subtitle (bodySmall, positioned below)
- Selection indicator (24x24px radio button)

**States:**
- Unselected: White bg, gray border, gray radio
- Selected: Gradient bg, white text, white radio with colored dot, glow effect

**Interaction:**
- Press: Scale 0.96 → spring back
- Selection: Scale to 1.02, glow appears
- Haptic feedback on iOS

---

### AnimatedInput
Uses existing `Input` component with clean styling.

**Enhancements:**
- Focus state with border color animation
- Numeric keyboard for age/height
- Decimal pad for weight
- Max length validation

---

## 🌈 Color Strategy

### Gradient Flows
**Purpose:** Create energy and movement, avoid flat colors

**Primary Energy:**
- Blue Flow: `[#2D4EFF, #4D6AFF, #5A3FFF]`
- Success Flow: `[#00C76C, #00D97E, #00EA8A]`
- Energy Flow: `[#FF6B35, #FF8C42, #FFA94D]`

**Title Accents:**
- Step 1: Primary Blue gradient
- Step 2: Success Green gradient
- Step 3: Energy Orange gradient

**Selection Gradients:**
Each card has unique signature for memorability.

---

## ⚡ Animation Specifications

### Global Spring Config
```typescript
{
  damping: 20,
  stiffness: 90,
  mass: 1
}
```

### Entrance Animations
**Cards:**
- Initial scale: 0.9
- Animate to: 1.0
- Stagger delay: 0ms, 100ms, 200ms
- Duration: ~600ms (spring)

**Steps:**
- Slide out: translateX to -SCREEN_WIDTH
- Fade out: opacity 0
- Slide in: translateX from SCREEN_WIDTH to 0
- Fade in: opacity 1

### Micro-interactions
**Card Press:**
1. Scale to 0.96 (fast spring: damping 15, stiffness 300)
2. Spring back to 1.0 or 1.02 if selected
3. Haptic feedback (10ms vibration on iOS)

**Selection:**
- Glow opacity: 0 → 0.6
- Glow scale: 0.95 → 1.05
- Card scale: 1.0 → 1.02
- Radio dot: scale 0 → 1

### Progress Transitions
- Bar width: Spring animation
- Gradient shift: Linear interpolation
- Dots expand: Spring with bounce

---

## 🎨 Typography Usage

### Headlines
- `display` variant (48px, 800 weight) for main titles
- Gradient backgrounds on accent words
- White text on gradients

### Body Text
- `bodyLarge` (17px) for descriptions
- `bodySmall` (14px) for card subtitles
- `caption` (12px) for progress text

### Data Display
- `h2` (28px) for data preview values
- Tabular numbers for metrics

---

## 📐 Spacing & Layout

### Container Padding
- Horizontal: 24px (spacing.lg)
- Top: 48px iOS, 32px Android
- Bottom: Safe area + 24px

### Card Spacing
- Gap between cards: 16px (spacing.md)
- Card padding: 24px (spacing.lg)
- Card border radius: 16px

### Input Spacing
- Gap between inputs: 24px (spacing.lg)
- Input row gap: 16px (spacing.md)

---

## 🔧 Technical Implementation

### Dependencies Required
```json
{
  "expo-linear-gradient": "~14.0.0",
  "expo-blur": "~14.0.0",
  "react-native-reanimated": "~3.17.2"
}
```

### Reanimated Patterns
- `useSharedValue` for animated state
- `useAnimatedStyle` for style animations
- `withSpring` for physics-based animations
- `withTiming` for linear animations
- `runOnJS` for callbacks from worklets

### Performance Optimizations
- Native driver for all transform animations
- Worklets for smooth 60fps animations
- Memoized card components
- Debounced input validation

---

## 🎯 Key Differentiators

1. **Energy Orbs**: Glow effects that respond to selections
2. **Gradient Flows**: Every step has unique gradient signature
3. **Spring Physics**: Athletic, responsive feel on all interactions
4. **Progress Momentum**: Progress bar builds like workout intensity
5. **Haptic Feedback**: Physical response to selections (iOS)
6. **Staggered Reveals**: Cards enter with choreographed timing
7. **Live Data Preview**: Step 1 shows formatted data in real-time
8. **Contextual Colors**: Each fitness level and goal has unique energy color

---

## 🚀 Next Steps for Implementation

1. **Install Dependencies:**
   ```bash
   npx expo install expo-linear-gradient expo-blur
   ```

2. **Update Navigation:**
   - Add OnboardingScreen to AuthNavigator
   - Update navigation flow: Register → Onboarding → Home

3. **Database Integration:**
   - Update user schema (already has fields)
   - Implement updateUser mutation

4. **Testing:**
   - Test on physical device for haptics
   - Verify spring animations performance
   - Test keyboard handling on Step 1

5. **Refinements:**
   - Add skip logic (save partial data)
   - Implement back button for step navigation
   - Add error states for validation

---

## 📱 Platform Considerations

### iOS
- Haptic feedback on selection (Vibration.vibrate(10))
- Higher quality shadows
- Safe area handling for notch/island

### Android
- Elevation instead of shadows
- Material-style ripple effects (future enhancement)
- Navigation bar color matching

### Performance
- All animations use native driver
- Gradient rendering optimized
- No re-renders on animation frames
- Worklets for 60fps smoothness

---

**Design Status:** ✅ Complete and Ready for Implementation
**Created:** 2025-12-20
**Designer:** Claude Code with frontend-design skill

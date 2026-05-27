# Audio Controls UI Reference

## Visual Layout & Components

### Full Message with Audio Controls

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         AI Message Bubble                                  ║
╟───────────────────────────────────────────────────────────────────────────╢
║                                                                            ║
║  "नमस्ते! आपके सवाल का जवाब है..."                                        ║
║  "Hello! Here's the answer to your question..."                           ║
║                                                                            ║
║ ╭─────────────────────────────────────────────────────────────────────╮  ║
║ │                    AUDIO CONTROLS                                  │  ║
║ │                                                                    │  ║
║ │  [▶] 0:00 / 2:45  [███░░░░] 🔊 [=======]  Speed  [1x] [⬇]      │  ║
║ │ Play  Time   Progress  Vol        Buttons Down                   │  ║
║ │                                                                    │  ║
║ ╰─────────────────────────────────────────────────────────────────────╯  ║
║                                                                            ║
║  AI • Now                                                                 ║
║                                                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## Individual Components

### 1. Play/Pause Button
```
┌─────────┐
│   ▶    │  Not Playing (Default)
│ (Green)│
└─────────┘

┌─────────┐
│   ⏸    │  Playing (Animated Pulse)
│(Accent)│
└─────────┘

Hover: Slight scale increase
Active: Button dimmed feedback
```

### 2. Time Display
```
┌──────────────┐
│ 1:23 / 2:45 │  Format: MM:SS / MM:SS
│  (Muted)    │  Updates every ~100ms
└──────────────┘
```

### 3. Progress Bar
```
Complete:     [████████░░░░░░] 60% progress
             Draggable    Current position
             indicator
            
Click: Seeks to that position
Drag: Smooth seeking
Width: ~150-200px
```

### 4. Volume Control
```
┌─────────────────────┐
│ 🔊 [═════════]     │
│         100%        │
│  (Interactive slider)
│                     │
│ 🔊 [══════░░]      │
│         50%         │
│                     │
│ 🔊 [═░░░░░░]       │
│   Muted (0%)        │
└─────────────────────┘
```

### 5. Speed Control Buttons
```
┌─────────────────────────────────────┐
│ [0.75x] [1x*] [1.25x] [1.5x]       │
│                 ↑                    │
│           * = Active                │
│        (Highlighted)                │
└─────────────────────────────────────┘

Inactive Button Style:    Active Button Style:
┌─────────┐              ┌─────────┐
│ 0.75x   │   ────→     │ 1x      │
│(Light)  │              │(Green)  │
└─────────┘              └─────────┘
```

### 6. Download Button
```
┌─────────┐
│    ⬇    │  Download
│ (Accent)│  Timestamp filename
└─────────┘  kisan_audio_1715154300000.mp3
```

## Responsive Breakpoints

### Desktop (>1024px)
```
[▶] Time [Progress....] 🔊 [Vol] Speed [Buttons] [⬇]
    ↑      Long progress bar means lots of space
```

### Tablet (768px - 1024px)
```
[▶] Time [Progress.] 🔊 [Vol]
Speed [0.75x 1x 1.25x 1.5x] [⬇]
    ↑ Wraps to second line if needed
```

### Mobile (<768px)
```
[▶] [0:00/2:45]
[████░░] 🔊[==]
[0.75x] [1x] [1.25x]
[1.5x]  [⬇]
    ↑ Stacked layout
```

## Color Scheme

### Primary Colors
```
Primary Button:   #2D5A27 (Dark Green)
  Hover:         #1E3D1A (Darker)
  Active:        Pulse animation

Accent Color:     #D4A373 (Beige/Gold)
  Hover:         #C9925E (Darker gold)
  
Background:       #E9D5C3 (Light accent)
```

### State Indicators
```
Playing:     Green (#2D5A27) + Pulse animation
Paused:      Grey (var(--text-muted))
Hovered:     Slight scale + subtle shadow
Downloading: No visual change (just link)
```

## Animation Sequences

### Play Button Press
```
1. User clicks ▶
2. Button changes to ⏸
3. Background color changes to accent
4. Pulse animation starts (0.6s loop)
5. Audio starts playing

[▶] ──→ [⏸] ──→ [⏸ with pulse] ──→ [Audio Playing]
```

### Progress Bar During Playback
```
Timeline: 0:00 ────► 1:23 ────► 2:45
       [░░░░] ──→ [███░░░░] ──→ [████████]
         0%              60%         100%
```

### Speed Change
```
Current: [1x*]
User clicks [1.5x]
[1x] ──→ [1.5x*]  (Both update simultaneously)
Audio playbackRate changes instantly
```

### Volume Change
```
Volume slider at 50: 🔊 [═════░░░░░]
User drags to 100:   🔊 [══════════]
Audio.volume updates from 0.5 to 1.0 in real-time
```

## Interaction Chains

### Complete Playback Workflow
```
1. User sees AI response
2. Audio controls appear below text
3. User clicks ▶ button
   - Button becomes ⏸ with pulse
   - Audio starts playing
   - Progress bar fills in real-time
   - Time display updates: 0:00 → 1:23 → 2:45
4. While playing, user can:
   - Click progress bar to seek
   - Adjust volume slider
   - Change speed (0.75x, 1x, 1.25x, 1.5x)
5. Audio ends automatically
   - Button returns to ▶
   - Progress bar resets to 0%
   - Time shows 0:00
```

### Download Workflow
```
1. User clicks ⬇ button
2. Browser determines download location
3. File saved as: kisan_audio_[timestamp].mp3
4. File available in Downloads folder
5. User can play offline or share
```

## Accessibility Features

### Keyboard Navigation
```
Tab → Focus on play button → Space/Enter to play
Tab → Focus on volume slider → Arrow keys to adjust
Tab → Focus on speed buttons → Space/Enter to select
Tab → Focus on download button → Enter to download
```

### Visual Indicators
```
All interactive elements have:
- Visible focus ring (for keyboard users)
- Hover states (for mouse users)
- Active/pressed states (clear feedback)
- Color contrast according to WCAG
```

## Error States

### Audio Load Error
```
╭─────────────────────────────────────╮
│ Alert: "Failed to play audio"       │
│ [▶] Button shows error state        │
│ [OK] Dismiss alert                  │
╰─────────────────────────────────────╯
```

### Playback Error
```
Same as load error + console error logged
User can retry by clicking play again
```

## Loading States (Future Enhancement)

```
While fetching audio URL:
┌─────────────────────────────────────┐
│ 🔄 Loading audio...                │
│ [████░░░░░░░░░░░░]                 │
│ 50% loaded                          │
└─────────────────────────────────────┘

Once ready:
[▶] Controls appear
User can now click play
```

## Mobile-Specific Features

### Touch Interactions
```
Tap ▶ button:     Plays/pauses
Tap progress bar: Seeks to position
Slide volume:     Adjusts in real-time
Tap speed:        Changes immediately
Tap ⬇:            Initiates download
```

### Gesture Support
```
Long press:       (Reserved for future)
Swipe left/right: (Not implemented)
Pinch zoom:       Standard browser zoom
```

---

## Summary Table

| Component | Direction | Width | Height | Interactive |
|-----------|-----------|-------|--------|-------------|
| Play Button | Horizontal | 32px | 32px | Yes (Click) |
| Time Display | Horizontal | 60px | Auto | No (Read-only) |
| Progress Bar | Horizontal | 150-200px | 4px | Yes (Click/Drag) |
| Volume Slider | Horizontal | 60px | 4px | Yes (Drag) |
| Speed Buttons | Horizontal | 4 × 50px | 24px | Yes (Click) |
| Download Button | Horizontal | 32px | 32px | Yes (Click) |
| Full Container | Horizontal | 100% | 50px | (Auto-wrap) |

---

## Implementation Status

✅ All components implemented
✅ Animations working
✅ Touch/Mobile support
✅ Keyboard accessibility (partial)
✅ Error handling
✅ Color scheme integrated
✅ Responsive design complete

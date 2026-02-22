# Dblock Mobile Application — UX/UI Design Specification
> **For Claude Code** — Complete implementation reference
> Source: Figma file DB-UX/UI (hAGUWLHQYa00n0VYqIWzPY)
> Primary Platform: iOS | Secondary: Android
> Generated: February 2026

---

## 1. Global Design Tokens

### 1.1 Screen Dimensions
| Property | Value |
|---|---|
| Screen Width | 376 px |
| Screen Height | 812 px |
| Screen Corner Radius | 16 px |
| Canvas Layout | mobile-grid |

### 1.2 Color Palette
| Token Name | Hex Value | Usage |
|---|---|---|
| bg/highest | #000000 / #1E1E1E | Splash background, dark surfaces |
| bg/neutral/lowest | #FFFDFA | Welcome Screen, light surfaces |
| linear-top | Gradient (warm orange top) | Headers, hero sections |
| linear-gradient | Dark gradient overlay | Overlays, card backgrounds |
| #4B4F55 @ 10% | Semi-transparent grey | Section separators |
| #FFFFFF | Pure white | Text on dark, borders |
| #007AFF | iOS blue | Toggle ON, focus ring |
| #E5E5EA | Light grey | Toggle OFF, disabled |
| #8E8E93 | Medium grey | Inactive tabs, helper text |
| #FF3B30 | iOS red | Destructive actions, errors |
| #34C759 | iOS green | Success, available status |
| #FFD60A | Yellow | Premium badge |
| #F2F2F7 | Off-white | Search field bg, skeleton |
| #F7F7F7 | Near white | Card backgrounds |
| #C7C7CC | Light border | Checkbox border, dividers |

### 1.3 Typography
| Token | Size | Weight | Usage |
|---|---|---|---|
| Display Hero | 36px | 700 Bold | Welcome screen headline |
| Title Large | 28px | 700 Bold | Screen titles |
| Title Medium | 22px | 700 Bold | OTP title, event title |
| Title Small | 20px | 600 SemiBold | Section headings, sheet title |
| Body Large | 17px | 600 SemiBold | Button text, primary nav |
| Body | 15px | 600 SemiBold | Card titles |
| Body Regular | 15px | 400 Regular | Card body, list items |
| Caption | 13px | 400 Regular | Form body text, metadata |
| Label | 12px | 400 Regular | Helper text, timestamps |
| Micro | 11px | 600 SemiBold | Badges, tab labels |
| Input Label | 10px | 400 Regular | UPPERCASE input labels |
| Font family iOS | SF Pro (system) | — | — |
| Font family Android | Roboto | — | — |

### 1.4 Spacing Scale
| Token | Value |
|---|---|
| 4px | Icon inner gap, dot size |
| 8px | OTP box gap, input label-to-field |
| 12px | Card inner padding, item gap |
| 16px | Standard horizontal margin, section padding |
| 24px | Section gaps, hero padding |
| 32px | Large section gaps |
| 48px | Screen top padding, hero bottom |

### 1.5 Border Radii
| Element | Radius |
|---|---|
| Screen frame | 16px |
| Primary/Pill button | 26px (fully rounded h=52) |
| Input field | 10px |
| Card (standard) | 12-16px |
| Country code pill | 20px |
| OTP digit box | 8px |
| Plan/membership card | 16px |
| System banner | 10px |
| Modal/sheet top | 20px |
| Badge | 10px |
| Availability badge | 12px |
| Checkbox | 4px |
| Avatar | 50% (circle) |

### 1.6 Shadows / Effects
| Token | Value |
|---|---|
| lg | box-shadow: 0 8px 32px rgba(0,0,0,0.12) |
| bg (blur) | backdrop-filter: blur(12px) |
| tab-bar | border-top: 0.5px rgba(0,0,0,0.2) + blur(20px) |

### 1.7 Animation Tokens
| Property | Value |
|---|---|
| Splash delay | 401ms |
| Transition type | Spring (smart animate) |
| Spring mass | 1 |
| Spring stiffness | 35.6 |
| Spring damping | 13.33 |
| Default tap | Instant |
| Sheet present | Slide from bottom |
| Screen push | Slide from right |
| Toggle | 0.2s spring |

---

## 2. Page & Screen Inventory

### Figma Pages
- Thumbnail
- Terms Cases
- Appstore Screens
- iOS – Ready for Dev (PRIMARY)
- Android
- Upsell Screens
- Administrator Old iOS & Android
- Copyright
- APP ICON
- For Motion
- UI (component library)
- UX (flow diagrams)
- Assets
- Moodboards
- Archive Landings / Unused Flows / Local Components / Archive

### Screen Groups in iOS – Ready for Dev
| Group | Contents |
|---|---|
| User – iOS | All user-facing screens |
| Administrator – iOS | Admin-role screens |
| disabled screens | Error/disabled state variants |
| Legan updated | Legal pages |
| Tour | Onboarding slides |

### User – iOS Sub-sections
- Upsell
- Radio-City Concept
- Loading Examples
- Notifications
- Community
- Additional Pages
- Delete account
- Burger Menu
- Profile
- Payment methods
- Meetings Rooms (x6)
- Home
- Invite visitor
- Become Member
- Booking
- Book a Locker
- Plans (x4)
- Paid Event (x3)
- PHS-8... (mid-tier flow)
- Day Pass
- Plans Ch... (Plans Choose)
- Annotation Sticky Notes
- Sing-up (Sign-up):
  - personal-id-01 (x3)
  - country-search
  - loader
  - OTP (x5 states)
  - too-many-failed-attempts
  - Continue
  - Welcome Screen
  - Splash

---

## 3. Screen Specifications

### SCREEN: Splash
- Size: 376 x 812px | Radius: 16px
- Background: #000000
- Content: Dblock logo, centered (horizontal + vertical)
- No user interaction
- Auto-advance after 401ms -> Welcome Screen
- Animation: Spring (stiffness:35.6, damping:13.33, mass:1)

---

### SCREEN: Welcome Screen
- Size: 376 x 812px | Radius: 16px
- Background base: #FFFDFA
- Full-screen photo (startup/co-working community scene, dark atmospheric)
- Gradient overlay: linear dark from bottom 60% -> transparent top
- Headline (white, bottom-left, 24px left / 120px from bottom):
  - "A growing community of" — 36px Regular
  - "Startups" — 36px Bold
- Button "Get started":
  - Width: 328px (16px margins each side)
  - Height: 52px | Radius: 26px
  - Background: #FFFFFF | Text: #1E1E1E 17px SemiBold
  - Position: pinned bottom, 48px above home indicator
- Home indicator: centered, white, bottom safe area
- Tap "Get started" -> Sign-up Screen (push)

---

### SCREEN: Sign-up at Dblock
- Size: 376 x 812px | Background: #FFFFFF
- Status bar (9:41 style)
- Close button x: 44x44px, top-left, 16px from edge
- Title "Sign-up at Dblock": 28px Bold, top-left, mt:24px

SECTION — Personal Information (mt:32px):
- Label: "Personal Information" 13px SemiBold #1E1E1E
- Input FIRST NAME: label 10px uppercase #8E8E93 / value 16px #1E1E1E
  - Height:52px | Radius:10px | Border:1px #E5E5EA | Padding:12px 16px
- Input LAST NAME: same style
- Helper: "Enter as it appears on your ID" 12px #8E8E93

SECTION — Contact Information (mt:24px):
- Label: "Contact Information" same style
- Phone row (flex horizontal, gap:8px):
  - Country code button: "+995 v" | w:100px h:52px r:10px border:1px #E5E5EA
    - Tap -> Country Search sheet
  - Mobile input: MOBILE NUMBER label / "(555) 315 631" value | flex:1 h:52px
- Helper: "We will only use this to contact you" 12px #8E8E93

SECTION — Newsletter Card (mt:24px):
- Card: bg:#F7F7F7 r:12px p:16px
- Title: "Be up to date with D Block." 15px SemiBold
- Body: "Receive discounts, offers, promotions, upcoming events, recommendations. Unsubscribe anytime." 13px #4B4F55
- Link: "Read More" 13px underlined brand color
- Toggle: ON state (#007AFF), right-aligned

SECTION — Consents (mt:16px):
- Checkbox 1: 20x20px r:4px border:1.5px #C7C7CC
  - Label: "By checking you agree App Terms of Use & Privacy policy"
  - Terms/Privacy underlined, tappable
- Checkbox 2: "I agree to..." (additional)
- Gap between: 12px

FOOTER — Button Continue:
- Width: 328px (16px margins) | Height: 52px | Radius: 26px
- Background: #1E1E1E | Text: #FFFFFF 17px SemiBold
- Pinned bottom + safe area

---

### SCREEN: Country Search Sheet
- Presentation: Bottom sheet, full-height
- Drag handle: 4x36px pill, #C7C7CC, centered top, mt:8px
- Title: "Choose" 20px SemiBold centered
- Search field: h:44px r:10px bg:#F2F2F7 border:none
  - Icon: magnifier 20px, 8px from left
  - Placeholder: country name
- Country list: scrollable rows
  - Row: flag emoji + country name (15px) + dial code (15px #8E8E93) + right chevron
  - Height per row: 52px | Divider: 0.5px #E5E5EA
- Empty state: "Couldn't find..." heading + "Try searching again with a country keyword" body

---

### SCREEN: OTP Verification (5 states)
- Size: 376 x 812px | Background: #FFFFFF
- Back arrow: top-left, 44x44px
- Title: "+995 555 315 631" 22px Bold
- Subtitle: "Enter the 6-digit code..." 14px #8E8E93
- OTP input row:
  - 6 boxes | each: 44x56px | r:8px | centered
  - Gap between boxes: 8px | Total row width: ~312px
  - Default border: 1.5px #E5E5EA
  - Active/focused: 2px #007AFF
  - Error: 2px #FF3B30
  - Digit: 24px SemiBold centered
- Resend: "Didn't receive? Resend" 13px, link underlined
- Button Continue: same style as sign-up, pinned bottom

States:
1. Default — all empty, first box active
2. Filled — all boxes have digits
3. Error — red borders + error message
4. too-many-failed-attempts — lockout screen, contact support
5. Success — green confirmation, auto-advance -> Home

---

### SCREEN: Loader
- Full-screen white
- Centered spinner or skeleton loader
- No user interaction

---

### SCREEN: Continue
- Transition/loading between auth steps

---

### SCREEN: Home
- Size: 376 x 812px
- Status bar (top)
- Header (h:60px):
  - Left: user avatar 32px circle + "Good morning, [Name]" 17px SemiBold
  - Right: bell icon 25px, 44x44 tap target, unread dot 8px #FF3B30
- Content (scrollable, padding 16px):
  - "Upcoming Events" section: horizontal scroll, event cards
  - "Available Spaces" section: grid 2-col or list
  - "Your Plan" card: membership status
  - "Community Highlights" preview feed
- Bottom Tab Bar (see component spec)

---

### SCREEN: Meetings Rooms (6 states)
- Nav: back arrow + "Meetings Rooms" title 17px SemiBold + filter icon
- Filter bar: horizontal chips (capacity, price, availability)
  - Chip: h:32px r:16px border:1px / active: bg:#1E1E1E text:#FFFFFF

Room Card:
- Image: full-width, h:180px, r:12px
- Room name: 17px SemiBold mt:12px
- Row: capacity icon + "Up to X people" 13px #8E8E93
- Row: price "from $XX/hour" 15px brand color
- Availability badge (see component spec)
- Book button: secondary style, right-aligned

States: Default list / Filtered / Room Detail / Time picker / Confirmation / Unavailable

---

### SCREEN: Book a Locker
- Title: "Book a Locker"
- Locker grid: 3 columns
  - Each cell: square ~100px, locker number label, color by status
    - Available: #34C759 bg | Occupied: #FF3B30 bg | Selected: #1E1E1E bg
- Selected locker: detail card below grid
- Duration: picker (hours/half-days)
- Total price: large display
- CTA: "Reserve Locker" primary button

---

### SCREEN: Day Pass
- Title: "Day Pass"
- Calendar: month view, selectable dates
  - Selected date: #1E1E1E circle highlight
  - Today: underline
- Price display: 32px Bold, centered
- Includes list: checkmarks + 13px text
- CTA: "Purchase Day Pass" primary button

---

### SCREEN: Plans (4 variants)
Plan card:
- Icon/illustration top
- Plan name: 20px Bold
- Price: 28px Bold + "/month" 14px #8E8E93
- Feature list: checkmark icon + 14px text, 8px row gap
- CTA: "Choose Plan" / "Current Plan" (disabled)

Tiers: Free / Starter(PHS) / Premium / Day Pass

---

### SCREEN: Plans Choose
- Title: "Choose Your Plan"
- Billing toggle: Monthly | Annual (pill selector)
- Horizontal scroll or stacked cards
- Recommended card: elevated shadow + 2px #007AFF border + "Recommended" badge
- Feature comparison visible

---

### SCREEN: Become Member (sub-flow)
1. Intro: value prop, hero image, "Become a Member" CTA
2. Plan Selection: Plans Choose screen
3. Payment: card number/expiry/CVV fields + billing address
4. Confirmation: success illustration + "Welcome to Dblock!" + "Explore" CTA

---

### SCREEN: Paid Events (3 states)
1. Event List:
   - Horizontal scroll featured / vertical list all
   - Event card: image + name + date + price badge

2. Event Detail:
   - Hero image: 376 x 220px
   - Title: 22px Bold
   - Date: calendar icon + formatted date
   - Location: pin icon + address
   - Price: "Tickets from $XX" 17px SemiBold brand
   - Description: body text, expandable
   - Host: avatar 32px + name
   - CTA: "Get Tickets" primary button

3. Purchase:
   - Ticket quantity selector (- N +)
   - Total price
   - Payment method selector
   - CTA: "Confirm Purchase"
   - Confirmation: ticket/QR screen

---

### SCREEN: Community
- Tabs: Feed | Members | Events
- Feed post:
  - Header: avatar + name + timestamp
  - Body text: 15px
  - Media: optional image, r:12px
  - Actions: heart + count | comment + count | share
  - Divider: 0.5px #E5E5EA
- Members: grid 3-col, avatar + name + role
- Events: same as event list

---

### SCREEN: Profile
- Header: avatar 72px circle + 2px shadow border + Edit icon
- Name: 20px Bold | Membership badge
- Settings list sections:
  ACCOUNT: Edit Profile / Payment Methods / Invite Visitor
  PREFERENCES: Notifications / Language
  LEGAL: Terms of Use / Privacy Policy
  DANGER: Delete Account (red text #FF3B30)
  BOTTOM: Sign Out

Section header: 13px uppercase tracking-wider #8E8E93, 16px h-padding
Row: 52px height | 16px h-padding | chevron right #C7C7CC | divider 0.5px

---

### SCREEN: Payment Methods
- Title: "Payment Methods"
- Card row: card brand icon (32px) + "•••• 4242" 15px + expiry 13px #8E8E93
- Default badge: "Default" 11px badge
- Add new card: + icon + "Add card" primary color row
- Delete: swipe-to-reveal or edit mode

---

### SCREEN: Invite Visitor
- Title: "Invite a Visitor"
- Field: Visitor Name
- Field: Email or Phone
- Date/time picker: date + time slot
- Note: optional text area, h:80px
- CTA: "Send Invitation" primary button

---

### SCREEN: Notifications
- Title: "Notifications"
- Empty state: illustration + "No notifications yet" + subtitle
- Notification row:
  - Left dot: 8x8px #007AFF (unread) / transparent (read)
  - Icon: category icon 32px circle bg:#F2F2F7
  - Title: 15px SemiBold | Body: 13px #4B4F55
  - Timestamp: 11px #8E8E93 right
  - Height: 72px | Divider: 0.5px #E5E5EA
- Swipe left: delete action (red)

---

### SCREEN: Burger Menu
- Full-screen or drawer from left/top
- Header: logo + wordmark "D Block"
- User card: avatar + name + tier badge
- Nav links list: 52px rows, icon + label + chevron
  - Home / Booking / My Membership / Community / Events / Settings / Support / Legal
- Sign Out: bottom, #FF3B30 text

---

### SCREEN: Delete Account
- Title: "Delete Account" 22px Bold #FF3B30
- Warning body: consequences of deletion, 15px
- Reason selector (optional): radio list
- CTA "Delete My Account": full-width, bg:#FF3B30, text:#FFFFFF
- Cancel: ghost button or text link below

---

### SCREEN: Onboarding Tour (2 slides)
- Full-screen illustrated slides
- Page dots: centered bottom, 8px circles (active filled, inactive outline)
- Skip: top-right, 13px text
- Next: pill button, bottom-right
- Slide 1: "Book your space" — spaces/rooms feature
- Slide 2: "Join the community" — community feature
- Last slide: "Get Started" -> Home

---

### SCREEN: Administrator
- Role-based screens
- Dashboard: occupancy %, bookings today, revenue
- User management list
- Booking approval/rejection flow
- Distinct admin mode indicator (badge, color)

---

### SCREEN: Upsell Screens
- Triggered on feature gate
- Modal or full-screen
- Feature icon/illustration
- Headline: "[Feature] is a Premium Feature"
- Plan teaser (1-2 plan cards)
- CTA: "Upgrade Now" -> Plans flow
- Dismiss: x or "Maybe later"

---

### SCREEN: Legal (Legan updated)
- Terms of Use: scrollable long-form text, 15px body
- Privacy Policy: same
- Accessible from Profile and Sign-up

---

### SCREEN: Disabled / Error States
- Disabled button: opacity:40%, pointer-events:none
- Disabled input: bg:#F2F2F7, text:#C7C7CC
- Error input: border #FF3B30 + 12px error message below
- Network error: icon + "Something went wrong" + "Retry" CTA
- Permission denied: explanatory text + settings link

---

## 4. Component Library

### Primary Button
```
height: 52px
border-radius: 26px
background: #1E1E1E
color: #FFFFFF
font-size: 17px
font-weight: 600
width: calc(100% - 32px) [margin: 0 16px]
disabled: opacity 0.4
```

### Secondary Button
```
same dimensions
background: transparent
border: 1.5px solid #1E1E1E
color: #1E1E1E
```

### Destructive Button
```
same dimensions
background: #FF3B30
color: #FFFFFF
```

### Text/Link Button
```
background: none
color: #007AFF
text-decoration: underline
height: auto
```

### Input Field (Default)
```
height: 52px
border-radius: 10px
border: 1px solid #E5E5EA
background: #FFFFFF
padding: 12px 16px
label-font: 10px uppercase tracking-wider color:#8E8E93
value-font: 16px regular color:#1E1E1E
focus: border 1.5px #007AFF
error: border 1.5px #FF3B30
disabled: background #F2F2F7, color #C7C7CC
```

### Search Input
```
height: 44px
border-radius: 10px
background: #F2F2F7
border: none
padding-left: 36px
icon-left: 20px magnifier #8E8E93
```

### OTP Box
```
width: 44px
height: 56px
border-radius: 8px
border: 1.5px solid #E5E5EA
font: 24px 600 centered
active: border 2px #007AFF
error: border 2px #FF3B30
filled: border 1.5px #1E1E1E
6 boxes, gap: 8px
```

### Toggle Switch
```
width: 51px / height: 31px
ON: bg #007AFF, thumb #FFFFFF
OFF: bg #E5E5EA, thumb #FFFFFF
transition: 0.2s spring
```

### Checkbox
```
size: 20x20px
border-radius: 4px
unchecked: border 1.5px #C7C7CC
checked: bg #1E1E1E, checkmark #FFFFFF
```

### Bottom Tab Bar
```
height: 83px (49px + 34px safe area)
background: rgba(255,255,255,0.95)
border-top: 0.5px rgba(0,0,0,0.2)
backdrop-filter: blur(20px)

tab-item: flex:1
  icon: 25x25px SF Symbol / Material icon
  label: 10px 400
  active: #1E1E1E
  inactive: #8E8E93
  icon-to-label gap: 4px
```

### Card (Standard)
```
background: #FFFFFF
border-radius: 12-16px
box-shadow: 0 8px 32px rgba(0,0,0,0.12)
padding: 16px
```

### Card (Flat/Form)
```
background: #F7F7F7
border-radius: 12px
padding: 16px
shadow: none
```

### Availability Badge
```
Available: bg rgba(52,199,89,0.15), text #34C759, dot #34C759
Unavailable: bg rgba(255,59,48,0.15), text #FF3B30, dot #FF3B30
height: 24px / padding: 4px 10px / radius: 12px / font: 11px SemiBold
dot: 8x8px circle, left of text, gap: 4px
```

### Membership Badge
```
height: 20px / padding: 2px 8px / radius: 10px / font: 11px SemiBold uppercase
Free: bg #8E8E93, text #FFFFFF
Starter: bg #34C759, text #FFFFFF
Premium: bg #FFD60A, text #000000
```

### System Banner
```
min-height: 44px / border-radius: 10px / padding: 12px 16px
info: bg #D1ECF1 / warning: bg #FFF3CD / error: bg #F8D7DA
icon: 20x20px left / text: 13px / optional x dismiss right
```

### Country Code Pill
```
width: ~100px / height: 52px / radius: 10px / border: 1px #E5E5EA
content: "+XXX v" 15px SemiBold
tap -> Country Search sheet
```

### Avatar
```
32px: tab bar / list items
72px: profile header (border: 2px white, shadow: lg)
circle: border-radius: 50%
placeholder: initials on #F2F2F7 bg
```

---

## 5. Navigation Architecture

```
Root Navigator
├── Splash (auto-advance 401ms)
└── Auth Stack
    ├── Welcome Screen
    └── Sign-up Stack
        ├── Sign-up Form
        │   └── [Modal] Country Search Sheet
        ├── OTP Screen (5 states)
        └── Continue Screen
            └── Main Tab Navigator
                ├── Tab 0: Home Stack
                │   ├── Home
                │   ├── Event Detail
                │   └── Space/Room Detail
                ├── Tab 1: Booking Stack
                │   ├── Booking Landing (tabs: Rooms/Lockers/Day Pass)
                │   ├── Meetings Rooms List
                │   ├── Room Detail
                │   ├── Booking Time Picker
                │   ├── Booking Confirmation
                │   ├── Book a Locker
                │   └── Day Pass
                ├── Tab 2: Community Stack
                │   ├── Community (Feed/Members/Events)
                │   └── Post Detail
                ├── Tab 3: Profile Stack
                │   ├── Profile
                │   ├── Edit Profile
                │   ├── Payment Methods
                │   ├── Invite Visitor
                │   ├── Notifications
                │   ├── Terms of Use
                │   ├── Privacy Policy
                │   └── Delete Account
                └── Tab 4: More (Drawer)
                    ├── Burger Menu
                    ├── My Membership
                    │   ├── Plans Overview (x4)
                    │   ├── Plans Choose
                    │   └── Become Member Flow
                    │       ├── Intro
                    │       ├── Plan Selection
                    │       ├── Payment
                    │       └── Confirmation
                    ├── Paid Events Stack
                    │   ├── Event List
                    │   ├── Event Detail
                    │   └── Purchase + Confirmation
                    ├── Settings
                    └── [Modal] Upsell Screen (feature gate)

Onboarding (first-launch overlay)
    Tour Slide 1 -> Tour Slide 2 -> dismiss -> Home

Admin Role (separate root)
    Administrator Dashboard
    User Management
    Booking Oversight
```

---

## 6. Interaction Patterns

| Trigger | Behavior |
|---|---|
| Tap primary button | Haptic (medium impact) + navigate |
| Tap destructive button | Confirm modal first |
| Form submit (valid) | Button loading state -> navigate |
| Form submit (invalid) | Scroll to first error, shake error fields |
| Pull to refresh | Refresh list/feed data |
| Swipe left on row | Reveal delete/action (red) |
| Swipe right (iOS) | Back navigation |
| Long press on card | Preview / peek |
| Keyboard appears | Layout shifts up, scroll to active input |
| Country code tap | Present bottom sheet (spring from bottom) |
| OTP digit entered | Auto-advance to next box |
| All OTP filled | Auto-submit |

---

## 7. Accessibility

| Requirement | Value |
|---|---|
| Minimum touch target | 44 x 44 px |
| Body text minimum | 13px |
| Color contrast body/bg | >= 4.5:1 (WCAG AA) |
| Focus ring | 2px #007AFF |
| Error communication | Text + color (never color-only) |
| VoiceOver labels | All interactive elements labeled |
| Dynamic Type | Support iOS Dynamic Type sizes |
| Semantic headings | h1 > h2 > h3 hierarchy |
| Loading states | Announced to screen reader |

---

## 8. Platform Notes

### iOS
- Font: SF Pro (system-ui)
- Status bar height: 44px (notch) / 20px (no notch)
- Safe area bottom: 34px (home-indicator devices)
- Tab bar total: 83px
- Haptic: UIImpactFeedbackGenerator
- Keyboard avoidance: ScrollView + contentInsetAdjustmentBehavior
- Push notifications: request after sign-up onboarding

### Android
- Font: Roboto
- Status bar: 24dp
- Navigation bar: 48dp
- Ripple on all tappable elements
- Bottom nav: Material NavigationBar
- Match Material You system colors where applicable

---

## 9. Asset Specifications

| Asset | Format | Sizes |
|---|---|---|
| App Icon | PNG | 20, 29, 40, 60, 76, 83.5, 1024 px |
| Tab bar icons | SF Symbols / SVG | 25pt @1x, 2x, 3x |
| Card hero images | JPEG/WebP | @2x (752px wide for 376pt) |
| Illustrations/onboarding | SVG or PNG @3x | — |
| Badges/tags | Code-rendered | — |

---

## 10. Developer Checklist

### Foundation
- [ ] Design tokens: colors, typography, spacing, radii as constants
- [ ] Theme provider / style system setup
- [ ] Safe area configuration (iOS + Android)
- [ ] Font configuration (SF Pro / Roboto)
- [ ] Spring animation config (stiffness:35.6, damping:13.33, mass:1)
- [ ] Mobile grid layout (376px base width)

### Authentication
- [ ] Splash screen — black bg, logo, 401ms auto-advance, spring transition
- [ ] Welcome screen — full-screen photo, dark gradient, bold headline, pill CTA
- [ ] Sign-up form — name/phone fields, country code, newsletter toggle, checkboxes, Continue CTA
- [ ] Country search sheet — search, country list, empty state
- [ ] OTP screen — 6-box input, all 5 states, auto-advance on fill
- [ ] Too-many-failed-attempts lockout screen
- [ ] Loader screen
- [ ] Continue screen

### Main App Shell
- [ ] Bottom tab bar — 5 tabs, active/inactive states, safe area
- [ ] Home screen — header, content sections, notification badge

### Booking
- [ ] Meetings Rooms — list + 6 states (default/filtered/detail/time/confirm/unavailable)
- [ ] Book a Locker — grid, color states, duration picker
- [ ] Day Pass — calendar, price, CTA

### Plans & Membership
- [ ] Plans overview — 4 tiers, feature lists
- [ ] Plans Choose — comparison, billing toggle, recommended highlight
- [ ] Become Member flow — 4 screens (intro/plan/payment/confirm)
- [ ] Paid Events — 3 states (list/detail/purchase)
- [ ] Upsell screens — feature gate modal

### Community
- [ ] Community — Feed / Members / Events tabs

### Profile & Account
- [ ] Profile — avatar, badge, settings sections
- [ ] Edit Profile
- [ ] Payment Methods — list + add card
- [ ] Invite Visitor — form + date/time picker
- [ ] Notifications — list, unread, swipe to dismiss
- [ ] Legal — Terms + Privacy scrollable
- [ ] Delete Account — confirmation + destructive CTA

### Navigation
- [ ] Burger Menu / More drawer

### States
- [ ] Disabled states (buttons, inputs)
- [ ] Error states (inputs, network, auth)
- [ ] Empty states (lists, feed)
- [ ] Loading states (skeleton / spinner)
- [ ] Success states (confirmations)

### Onboarding
- [ ] Tour slides (2+), page dots, skip/next, spring transitions

### Admin
- [ ] Administrator screens (role-based)

### Polish
- [ ] Haptic feedback on primary actions
- [ ] Keyboard avoidance all forms
- [ ] Scroll-to-error on validation failure
- [ ] Pull-to-refresh on feed/list screens
- [ ] VoiceOver / TalkBack accessibility labels
- [ ] Dynamic Type support (iOS)

---

*End of Dblock UX/UI Design Specification*
*Source: Figma — DB-UX/UI (hAGUWLHQYa00n0VYqIWzPY) — iOS Ready for Dev*
*For use with Claude Code — February 2026*
Here is the **complete specification document** to give to Claude Code for your **DB-UX/UI (Dblock)** app:

---

# DBLOCK iOS APP — FULL DESIGN SPECIFICATION
## Figma Source: DB-UX/UI

---

## PROJECT OVERVIEW

**App Name:** Dblock (D Block Workspace)
**Platform:** iOS (ready for dev), with Android page also present
**App Type:** Coworking space management app for members, visitors, and administrators
**Brand:** Dblock Stamba / D Block Workspace
**Design System Colors:** Background `#1E1E1E` (dark), Borders `#FFFFFF`, Primary accent: Blue/Purple, Success: Green, Error: Red, Locker screens: Bright blue
**Text Styles:** Custom "text" style
**Color Styles:** `linear-top` (gradient), `linear-gradient`
**Effect Styles:** `lg` (shadow), `bg` (background)
**Layout Guide:** `mobile-grid`

---

## PAGES IN FIGMA

### PAGE 1: Terms Cases
### PAGE 2: Appstore Screens
### PAGE 3: 🍎 iOS - Ready for dev (MAIN PAGE)
### PAGE 4: Android

---

## PAGE 1: TERMS CASES

### 1.1 personal-id-01
- **Sign-up at Dblock** — Dark-themed form with: First Name, Last Name ("Enter as it appears on your ID"), Contact Information (country code +995, mobile number), checkboxes for: "I agree General Terms and conditions & Privacy Policy", "I agree Dblock's marketing policy Direct Marketing policy" (x2), Continue button
- **Finish signing up** — Light-themed (Airbnb-like reference): Email field, Password field (with Show toggle), "By selecting Agree and continue, I agree to Airbnb's Terms of Service, Payments Terms of Service and Nondiscrimination Policy and acknowledge the Privacy Policy", "Agree and continue" button, marketing opt-out checkbox

### 1.2 Up-sell day-pass
- **Checkout** — "Pay and Book" header, Overview section (Start date: 16:30-17:00, Duration: 1 Hour, Room: MR 6.0)
- **Day pass upsell modal** — "Meeting room is more effective with day pass", "Day pass + 50GEL" with blue checkmark, description: "A one-time pass to the D Block when you need a desk for one day only or want to test the experience at our workspaces", "Add to order" button (blue), "I don't want it" link

### 1.3 Other company
- **Meeting room 0.3** — Header with "CHECK THE MANDATORY FIELDS" banner (red), room photo, tags: SMARTBOARD, 4 GUESTS, 80.00 GEL / HOUR
- **Book a meeting** — Time picker (9AM-2PM with colored blocks), time: 12:00-13:00, Duration 30 min, Starting date: 26 May, Community section with team member avatar (Dati Jaliashvili, Community Team), "Book for 80.00 GEL" button, "Please Review our Terms and conditions" link

### 1.4 On Request — Empty placeholder section
### 1.5 Without Request — Empty placeholder section

---

## PAGE 2: APPSTORE SCREENS (1620 × 2880px each)

### Screen 1 — Landing/Onboarding
- Full-screen coworking space photo (people working at desks)
- "A growing community of Startups"
- "Get started" white button
- "By registering you are agreeing to our Terms & Conditions and Privacy Policy of D Block Workspaces."

### Screen 2 — Home/Explore
- Hero image of Dblock interior (modern lounge with art)
- User avatar top-left, notification bell
- "Welcome to Dblock Stamba"
- "Explore Memberships" pill button
- "Make a Booking" (dark) and "Buy Day pass" (blue/purple) buttons
- "Blog and Announcements" section with "See all" link
- Article cards: "Renovation Works in the Dining Area", "Join us..."
- **Tab Bar:** EXPLORE (house icon), COMMUNITY (people icon), + (center add button), BOOKING (calendar icon), MORE (hamburger)

### Screen 3 — Community
- User avatar + "Oneph..." tag
- MEMBERS / EVENTS tab selector
- "Latest stories" section
- Article card: "Exploring the Unique Amenities Offered by D Block Coworking Space" (5 MIN READ)
- "All stories" section with more article cards
- Same tab bar as Screen 2

---

## PAGE 3: 🍎 iOS - READY FOR DEV (MAIN DESIGN PAGE)

### DESIGN TOKENS & FLOWS
- **Flows defined:** Flow 1, Flow 4, Flow 5, Manage Team 1
- **Overall frame:** User - iOS (67,904 × 24,252px)
- **Admin frame:** Administrator - iOS (27,200 × 21,802px)

---

## USER - iOS SECTIONS

### 3.1 SIGN-UP (Sing-up) — 6,505 × 2,904px
**Screens (left to right, top row):**
1. **Splash** — D BLOCK logo on dark background, "A growing community of Startups"
2. **Welcome** — Coworking space photo, "A growing community of Startups", Get started button, Terms link
3. **Continue with** — Social login options (Continue with Apple/Google/Email)
4. **OTP / Verify your Email** — Email verification screen, "Verify your Email", verification code input
5. **Loading** — Verification in progress (spinner/loading state)
6. **Personal info** — "Sign-up at Dblock" form with personal information fields
7. **Personal info (dark keyboard)** — Same form with dark keyboard visible
8. **Personal info (validation)** — Form with field validation states
9. **Personal info (variant)** — Additional form variant with different field states
10. **Settings/Newsletter** — "Dblock Newsletter" preferences, "Sounds fine? Step..." completion
11. **Newsletter confirmation** — Newsletter signup confirmation

**Bottom row (OTP variants):**
12. **OTP (empty)** — "Verify your Email" with empty code fields
13. **OTP (filled)** — Code fields with numbers entered
14. **OTP (error)** — Verification with error state
15. **Toast/blocked** — "Your account is temporary blocked" error message
16. **OTP (success)** — Successful OTP verification

### 3.2 BOOK A LOCKER — 5,876 × 1,982px
**Full flow screens:**
1. **Choose date** — Calendar date picker (monthly view, blue selected dates)
2. **Location/Book a locker** — Locker selection with floor/section dropdown, "Start date since" field
3. **Choose date (variant)** — Alternate date picker
4. **Checkout** — Overview with Locker details (Locker MD, pricing ~$60.95), duration, Payment section
5. **Checkout (variant 2)** — Different locker type/pricing
6. **Checkout (variant 3)** — Additional checkout variant
7. **Pay with** — Payment method selection screen (Apple Pay, credit card)
8. **General Success 1** — "Your locker was purchased" (green checkmark, light theme)
9. **General Success 2** — "Your locker was purchased" (green checkmark, dark/variant)
10. **General Error** — "Operation was unsuccessful" (red X, with "2" badge)
11. **Payment Error** — "We couldn't charge from your card" (dark theme)
12. **Unlock - Locker found** — Full blue screen, lock icon, "Locker found"
13. **Unlock - Welcome back** — Full blue screen, lock icon, "Welcome back"

### 3.3 BOOKING — 14,365 × 6,290px (Largest section)
**Sub-sections include:**
- Meeting room booking flow (dark and light themes)
- Room selection and details
- Time slot picker
- Checkout and payment flow
- Booking confirmation screens
- Multiple booking states and variants
- Location-based booking

### 3.4 BECOME MEMBER — 11,940 × 10,564px
**Sub-sections:**
1. **Become Member (main)** — Membership plan selection screens, plan comparison, pricing tiers
2. **PHS-87-book Fixed desk** — Fixed desk booking within membership
3. **Company details** — Company information form for business memberships
4. **Flex membership** — Flexible membership plans and options
5. **Day pass - Administrator** — Day pass management (admin view) with "Dpa..." sub-section
6. **Plans Check out** — Plan purchase checkout flow, scrolling variant with extended details
7. **Scrolling variant** — Long-scroll version of plan checkout

### 3.5 INVITE VISITOR — 5,229 × 3,203px
**Screens:**
1. **Invite a visitor (main)** — Form with "Date & Time" and "Add visitor" tabs
2. **Invite a visitor (add visitor)** — "Add visitor" modal with name/email input fields, keyboard visible
3. **Invite a visitor (filled)** — Form with visitor details filled, "Send Request" toggle
4. **Invite a visitor (confirmation)** — Completed invitation state
5. **Search flow** — Search for existing contacts/members
6. **Search (typing)** — Search with keyboard, search results appearing
7. **Search (results)** — Search results with "Recently found" list
8. **Visitors list** — "Invite visitor" screen showing Date & Time, Attendees tabs, Visitors list with toggles, "Book a meeting room" prompt, "Add Attendees" and "Remove" buttons

### 3.6 HOME — 5,806 × 5,214px
**Top row (Home variants by user type):**
1. **Member Home 1** — "Welcome to Dblock Stamba" with workspace photo, "Explore Memberships", Make a Booking/Buy Day pass buttons, Blog and Announcements
2. **Member Home 2** — "Dblock Stamba/OnePhase" variant
3. **Member Home 3** — Different workspace branch variant
4. **Member Home 4** — Additional variant

**Middle row:**
5. **Unlock** — "Locker found" blue screen
6. **Home (standard)** — "Dblock Workspace at Stamba" with blog announcements, "Happening now" section
7. **Home (variant)** — Different blog content
8. **Member Home (meeting alert 1)** — "On-going meeting starting soon in MR 6.0" notification card
9. **Member Home (meeting alert 2)** — "2 hour meeting starting soon in MR 6.0"
10. **Visitor Home 1** — "Welcome to Dblock Stamba" visitor variant with "Guga will visit you in 2 Hours" notification
11. **Multi-location** — "Welcome to Dblock Stamba" with "Workshop for Product Design" event card
12. **Visitor Home 2** — Visitor screen with article/announcement cards

**Bottom row:**
13. **Plus/Booking** — Meeting room card with "OnePhase", "Time credit hours", 14 hrs available
14. **Flexible** — "Book a meeting" with payment section
15. **Checkout** — Payment processing screen
16. **General Success 1** — "Time credits was purchased" (green checkmark, step 1)
17. **General Success 2** — "Time credits was purchased" (alternate success)
18. **General Error** — "Operation was unsuccessful" (step 2, red)
19. **Payment Error** — "We couldn't charge from your card"

### 3.7 MEETINGS ROOMS — Multiple frame sets (376 × 812px each, 4+ variants)
**Variants showing different tab bar configurations:**
1. **Visitor view** — D Block Workspace with BOOKING, MORE tabs only, lock icon
2. **Member view** — HOME, COMMUNITY, +, BOOKING, MORE full tab bar
3. **Member view (variant)** — HOME, COMMUNITY, + with different icons
4. **Additional variants** — Different membership levels showing different navigation

### 3.8 COMMUNITY — Section inside User - iOS
- Members list/directory
- Events listing and details
- Community blog/stories
- Member profiles
- Latest stories feed
- All stories feed

### 3.9 NOTIFICATIONS
- Push notification templates
- In-app notification center
- Notification preferences

### 3.10 ADDITIONAL PAGES
- Additional screens and states

### 3.11 DELETE ACCOUNT
- Account deletion flow
- Confirmation dialogs
- Deletion reasons

### 3.12 BURGER MENU
- Side menu / hamburger menu
- Menu items and navigation

### 3.13 PROFILE
- User profile view/edit
- Profile settings

### 3.14 PAYMENT METHODS
- Payment method management
- Add/remove payment methods
- Default payment selection

### 3.15 UPSELL
- Upsell prompts and modals
- Upgrade membership CTAs

### 3.16 RADIO-CITY CONCEPT
- Alternate branding/concept screens

### 3.17 LOADING EXAMPLES
- Loading states and skeleton screens
- Shimmer effects and placeholders

---

## LEGAN UPDATED (Legal Terms Update) — 4,356 × 2,282px
**6 Home screen variants with legal update modals:**
1. Home + "Please review our updated General Terms and conditions" — "Accept" button
2. Home + "Please subscribe to updated Privacy Policy" — "Accept" button
3. Home + "Please subscribe to updated conditions" — "Discard" option
4. Home + "Please review our updated Direct Marketing Policy" — "I've already reviewed and confirm" + "Subscribe" buttons
5. Home + "Please subscribe to updated Direct Marketing Policy" — "I've already reviewed and confirm" + "Description" buttons
6. Additional variant

---

## TOUR — 376 × 882px
**Screens:**
1. **Tour (intro)** — Red/dark themed, "Tour" title, "CHECK THE MANDATORY FIELDS" header, Dblock branches selection, desired time fields, "Guest Terms and Conditions" checkbox, "Direct Marketing Policy" checkbox, "Send request" purple button, legal disclaimer text
2. **Book a Tour** — Clean white form: Location (Choose from Dblock branches), Date (Select desired time), Time (Select desired time), "I agree to Dblock's Guest Terms and Conditions" checkbox, "Send request" button, legal text about terms
3. **Connect apps** — "Add and manage your payment methods, secure payment system": Google Calendar, Outlook, iOS Calendar integration options

---

## DISABLED SCREENS
- Archive of disabled/deprecated screen designs

---

## ADMINISTRATOR - iOS — 27,200 × 21,802px

### ADMIN SECTIONS:

### A.1 EMPTY STATE
- Empty state screens for when admin has no data

### A.2 PRICE BREAKDOWN
- Pricing details and breakdown views

### A.3 SHARE TIME CREDITS
- Time credit sharing between team members
- Credit allocation management

### A.4 MY PRODUCTS
- Admin's product/subscription overview
- Active products list

### A.5 PRODUCT MANAGEMENT
- Product CRUD operations
- Product settings and configuration

### A.6 ASSIGN LOCKER
- Locker assignment to team members
- Locker management dashboard

### A.7 ASSIGN CREDIT
- Credit assignment interface
- Credit balance management

### A.8 MEMBERSHIPS (Admin)
- Membership management
- Member list and status
- Membership plan administration

### A.9 DAY PASS (Admin)
- Day pass issuance and management
- Day pass tracking

### A.10 HOME & MENU (Admin)
- Admin home dashboard
- Admin navigation menu

### A.11 MENU (Admin)
- Admin-specific menu items
- Settings and preferences

### A.12 TICKETS (Admin)
- Support ticket management
- Ticket status tracking

### A.13 MEETING ROOM MY PRODUCTS (Admin)
- Meeting room product management
- Room availability and pricing

### A.14 MANAGE TEAM
- Team member management
- Add/remove team members
- Role assignment
- Team overview dashboard

### A.15 INVOICES & BILLING
- **Invoices & Billing (main)** — Invoice list and overview
- **PHS-97 Shipard...** — Specific invoice/billing reference
- **Each invoice Page** — Individual invoice detail view
- **Transactions** — Transaction history and details
- **PHS-98 Payment...** — Payment processing screens

### A.16 CANCEL (Admin)
- Cancellation flow for admin products/memberships

---

## STANDALONE SECTIONS ON iOS PAGE

### PAID EVENT (3 frame sets)
- Paid event booking and management screens
- Event details and ticketing
- Event payment flow

### PLANS (4 frame sets)
- Membership plan displays
- Plan comparison screens
- Plan pricing variants

---

## TAB BAR NAVIGATION (Bottom)

**Full Member view:** HOME | COMMUNITY | + (Add/Book) | BOOKING | MORE
**Visitor view:** BOOKING | MORE (reduced)
**Icons:** Home (house), Community (people), Add (+), Booking (calendar/gift), More (hamburger)

---

## DESIGN PATTERNS & COMPONENTS

### Color Scheme
- **Dark mode primary:** `#1E1E1E`
- **Accent/CTA:** Blue/Purple (`#0000FF` range)
- **Success:** Green (checkmark screens)
- **Error:** Red/Dark (error screens)
- **Locker screens:** Bright blue with white icon
- **Borders:** `#FFFFFF` at 10-80% opacity
- **Section backgrounds:** `#4B4F55` at 10% opacity
- **Section borders:** `#4B4F55`, 25px

### Recurring Patterns
- **Success states:** Full-screen with large green checkmark + step number badge, message, blue "Go to home" button
- **Error states:** Full-screen dark with red X or "Operation was unsuccessful", retry option
- **Payment error:** "We couldn't charge from your card" with retry
- **Locker screens:** Full blue background with white lock/unlock icon
- **Form validation:** Red "CHECK THE MANDATORY FIELDS" banner at top
- **Modals:** Bottom sheet style with rounded corners
- **Calendar pickers:** Month view with blue highlighted dates
- **Time pickers:** Horizontal scrolling time blocks (9AM-2PM)

### Corner Radius
- **Cards/Sections:** 120px (large), 200px (User-iOS frame)
- **Buttons:** Standard iOS rounded
- **Input fields:** Standard iOS rounded
- **Modal sheets:** Large top corners

### Typography
- Custom "text" style used throughout
- Headings in bold/semibold
- Body text in regular weight
- Labels in uppercase for categories (SMARTBOARD, GUESTS, etc.)

---

## COMPLETE SCREEN INVENTORY SUMMARY

| Section | Approx. Screen Count |
|---------|---------------------|
| Sign-up | ~16 screens |
| Book a Locker | ~13 screens |
| Booking | ~30+ screens |
| Become Member | ~25+ screens |
| Invite Visitor | ~8 screens |
| Home | ~19 screens |
| Meeting Rooms | ~4+ variants |
| Community | ~9+ screens |
| Notifications | ~5+ screens |
| Additional Pages | ~5+ screens |
| Delete Account | ~4+ screens |
| Burger Menu | ~3+ screens |
| Profile | ~5+ screens |
| Payment Methods | ~5+ screens |
| Upsell | ~3+ screens |
| Loading Examples | ~5+ screens |
| Tour | ~3 screens |
| Legal Updated | ~6 screens |
| **Admin: Total** | **~40+ screens** |
| Appstore Screens | 3 screens |
| Terms Cases | ~6 screens |
| **TOTAL ESTIMATED** | **~220+ unique screens** |

---

## NOTES FOR CLAUDE CODE

1. **The app serves 3 user roles:** Visitor (limited nav), Member (full nav), Administrator (separate admin section with team/billing management)
2. **Currency:** GEL (Georgian Lari) — this is a Georgian coworking space app
3. **Multi-location support:** Dblock Stamba, OnePhase, Radio-City Concept
4. **Calendar integrations:** Google Calendar, Outlook, iOS Calendar
5. **Payment methods:** Apple Pay, credit cards
6. **Locker system:** Physical locker booking with Bluetooth/NFC unlock
7. **Meeting rooms:** Time-credit-based booking system with per-hour pricing
8. **Community features:** Blog, Events, Member directory, Stories, Perks
9. **Legal compliance:** Terms & Conditions, Privacy Policy, Direct Marketing Policy — with update notification modals
10. **The Figma design URL:** `https://www.figma.com/design/hAGUWLHQYa00n0VYqIWzPY/DB-UX-UI`

---

This gives Claude Code the full picture of every section, screen, flow, user role, and design pattern in the project. Let me know if you'd like me to dive deeper into any specific section!

# D Block Workspace -- App Store Screenshot Guidelines

## Required Screenshot Sizes

### iOS (App Store Connect)

| Device Class        | Display Size | Resolution (Portrait) | Resolution (Landscape) | Required |
|---------------------|--------------|-----------------------|------------------------|----------|
| iPhone 15 Pro Max   | 6.7"         | 1290 x 2796 px        | 2796 x 1290 px         | Yes      |
| iPhone 14 Plus      | 6.7"         | 1284 x 2778 px        | 2778 x 1284 px         | Yes      |
| iPhone 8 Plus       | 5.5"         | 1242 x 2208 px        | 2208 x 1242 px         | Yes      |
| iPad Pro 12.9" (6th)| 12.9"        | 2048 x 2732 px        | 2732 x 2048 px         | Optional |
| iPad Pro 11" (4th)  | 11"          | 1668 x 2388 px        | 2388 x 1668 px         | Optional |

- **Minimum:** 3 screenshots per device class
- **Maximum:** 10 screenshots per device class
- **Format:** PNG or JPEG (no alpha channel)
- **Recommended:** 8-10 screenshots per locale

### Android (Google Play Console)

| Device Class    | Minimum Resolution      | Maximum Resolution      | Required |
|-----------------|-------------------------|-------------------------|----------|
| Phone           | 320 x 320 px            | 3840 x 3840 px          | Yes      |
| 7" Tablet       | 320 x 320 px            | 3840 x 3840 px          | Optional |
| 10" Tablet      | 320 x 320 px            | 3840 x 3840 px          | Optional |

- **Recommended phone resolution:** 1080 x 1920 px (portrait) or 1920 x 1080 px (landscape)
- **Recommended tablet resolution:** 1200 x 1920 px (7") / 1600 x 2560 px (10")
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Format:** PNG or JPEG (24-bit, no alpha)
- **Aspect ratio:** 16:9 or 9:16 recommended

### Additional Google Play Assets

| Asset               | Dimensions       | Format       | Required |
|----------------------|------------------|--------------|----------|
| Feature Graphic      | 1024 x 500 px    | PNG or JPEG  | Yes      |
| App Icon (Hi-res)    | 512 x 512 px     | PNG (32-bit) | Yes      |
| Promo Video          | YouTube URL       | N/A          | Optional |

---

## Screenshot Content Plan

Create the following 10 key screens in both English and Georgian. Each screenshot should include a device frame and a short marketing headline above the screen capture.

### Screen 1: Welcome / Onboarding
- **Content:** App splash screen or onboarding first step showing D Block branding
- **Headline EN:** "Your Workspace, One Tap Away"
- **Headline KA:** "თქვენი სამუშაო სივრცე, ერთი შეხებით"

### Screen 2: Location Selection
- **Content:** Map or list view showing all three D Block locations (Stamba Hotel, Radio City, Rooms Hotel Batumi)
- **Headline EN:** "Three Locations Across Georgia"
- **Headline KA:** "სამი ლოკაცია საქართველოში"

### Screen 3: Space Booking -- Browse
- **Content:** Grid or list view of available spaces (meeting rooms, hot desks, offices) with photos and pricing
- **Headline EN:** "Book Any Space in Seconds"
- **Headline KA:** "დაჯავშნეთ ნებისმიერი სივრცე წამებში"

### Screen 4: Space Booking -- Detail
- **Content:** Detailed view of a meeting room with photos, amenities, capacity, calendar availability, and booking button
- **Headline EN:** "See Every Detail Before You Book"
- **Headline KA:** "ნახეთ ყველა დეტალი დაჯავშნამდე"

### Screen 5: Coworking Passes
- **Content:** Pass selection screen showing hourly through annual options with pricing
- **Headline EN:** "Flexible Plans for Every Schedule"
- **Headline KA:** "მოქნილი გეგმები ყველა განრიგისთვის"

### Screen 6: BLE Door Access
- **Content:** Door unlock screen showing the BLE unlock animation or confirmation
- **Headline EN:** "Unlock Doors with Your Phone"
- **Headline KA:** "გახსენით კარები ტელეფონით"

### Screen 7: Dashboard / My Bookings
- **Content:** User dashboard showing upcoming bookings, active pass status, and quick actions
- **Headline EN:** "Manage Everything from One Place"
- **Headline KA:** "მართეთ ყველაფერი ერთი ადგილიდან"

### Screen 8: B2B Company Management
- **Content:** Company account screen showing team members list, access permissions, and usage summary
- **Headline EN:** "Manage Your Team's Workspace"
- **Headline KA:** "მართეთ გუნდის სამუშაო სივრცე"

### Screen 9: Invoices & Payments
- **Content:** Invoice list with payment status indicators and pay button
- **Headline EN:** "Billing Made Simple"
- **Headline KA:** "გამარტივებული ბილინგი"

### Screen 10: Visitor Registration
- **Content:** Visitor registration form or active visitor pass screen
- **Headline EN:** "Welcome Your Guests Effortlessly"
- **Headline KA:** "მიიღეთ სტუმრები მარტივად"

---

## Design Guidelines

### Device Frames
- Use official Apple and Google device frames
- iPhone 15 Pro Max frame for iOS hero screenshots
- Pixel 8 Pro frame for Android hero screenshots
- Maintain consistent frame style across all screenshots

### Layout
- **Orientation:** Portrait only (unless a specific screen benefits from landscape)
- **Headline position:** Top third of the image, above the device frame
- **Device frame position:** Center-bottom of the image
- **Background:** Extend behind the device frame with brand colors or subtle gradients

### Typography
- **Headline font:** Match the D Block brand typeface
- **Headline size:** Large enough to be legible at thumbnail size (minimum 60px equivalent)
- **Headline color:** White text on dark backgrounds, or dark text on light backgrounds
- **Headline max length:** 5-7 words per line, maximum 2 lines

### Color Palette
- Use the D Block Workspace brand colors as defined in the design system
- Primary background options:
  - Dark background (brand dark) for premium feel
  - Light background (brand light) for clean, modern look
- Maintain consistent background treatment across the set
- Use accent colors sparingly for emphasis

### Content Rules
- All screenshots must use realistic but non-identifiable sample data
- Never use real user names, emails, or phone numbers
- Use placeholder company names for B2B screens
- Ensure all text in screenshots matches the locale (EN screenshots use English, KA screenshots use Georgian)
- Prices should reflect actual D Block pricing in GEL

### Quality Requirements
- All screenshots must be generated from actual app builds (no mockups for submission)
- Ensure pixel-perfect rendering at all required resolutions
- No compression artifacts
- No visible debug UI, developer tools, or status bar anomalies
- Ensure battery icon shows full charge
- Ensure time in status bar reads a pleasant time (e.g., 9:41 for iOS)

---

## File Naming Convention

```
{platform}/{locale}/{device_class}/{##}_{screen_name}.png
```

Examples:
```
ios/en-US/6.7inch/01_welcome.png
ios/en-US/6.7inch/02_locations.png
ios/en-US/6.5inch/01_welcome.png
ios/ka/6.7inch/01_welcome.png
android/en-US/phone/01_welcome.png
android/ka/phone/01_welcome.png
android/en-US/7inch_tablet/01_welcome.png
android/en-US/10inch_tablet/01_welcome.png
```

---

## Locales to Prepare

| Locale Code | Language  | Priority |
|-------------|-----------|----------|
| en-US       | English   | P0       |
| ka          | Georgian  | P0       |

---

## Screenshot Generation Workflow

1. **Prepare test data** -- Set up demo accounts with realistic sample bookings, invoices, and team members
2. **Capture raw screenshots** -- Use iOS Simulator and Android Emulator at exact required resolutions
3. **Apply device frames** -- Use Figma or a screenshot framing tool (e.g., Screenshots Pro, LaunchMatic)
4. **Add marketing headlines** -- Overlay headlines following the design guidelines above
5. **Export at required resolutions** -- Export separate assets for each device class
6. **Review and approve** -- Product and design team review before upload
7. **Upload to stores** -- Upload via App Store Connect and Google Play Console

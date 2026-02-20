# Cookie Policy / ქუქი-ფაილების პოლიტიკა

**D Block Workspace**
**Adjara Group LLC / ადჯარა გრუპი შ.პ.ს.**

**Last Updated / ბოლო განახლება:** {{LAST_UPDATED_DATE}}
**Effective Date / ძალაში შესვლის თარიღი:** {{EFFECTIVE_DATE}}

---

## 1. Introduction / შესავალი

**English:**
This Cookie Policy explains how Adjara Group LLC ("we," "us," or "our") uses cookies, local storage, and similar technologies in the D Block Workspace mobile application (the "App") and on our website at https://dblock.ge (the "Website"). This policy should be read alongside our Privacy Policy and Terms of Service.

Cookies and similar technologies help us provide, protect, and improve the Service by enabling essential functionality, remembering your preferences, and understanding how you interact with the App.

**ქართული:**
ეს ქუქი-ფაილების პოლიტიკა განმარტავს, თუ როგორ იყენებს ადჯარა გრუპი შ.პ.ს. ("ჩვენ" ან "ჩვენი") ქუქი-ფაილებს, ლოკალურ საცავს და მსგავს ტექნოლოგიებს D Block Workspace მობილურ აპლიკაციაში ("აპლიკაცია") და ჩვენს ვებსაიტზე https://dblock.ge ("ვებსაიტი"). ეს პოლიტიკა უნდა წაიკითხოთ ჩვენი კონფიდენციალურობის პოლიტიკასთან და მომსახურების პირობებთან ერთად.

ქუქი-ფაილები და მსგავსი ტექნოლოგიები გვეხმარება სერვისის მიწოდებაში, დაცვასა და გაუმჯობესებაში არსებითი ფუნქციონალობის უზრუნველყოფით, თქვენი პრეფერენციების დამახსოვრებით და აპლიკაციასთან თქვენი ინტერაქციის გაგებით.

---

## 2. What Are Cookies and Similar Technologies? / რა არის ქუქი-ფაილები და მსგავსი ტექნოლოგიები?

**English:**
- **Cookies** are small text files stored on your device by a website or application. They contain data that helps identify your device and store preferences.
- **Local Storage / AsyncStorage** is a mechanism used by mobile applications to store small amounts of data locally on your device, similar to cookies but specifically designed for apps.
- **Session Tokens** are temporary identifiers used to maintain your authenticated session.
- **Device Identifiers** are unique identifiers assigned to your device, used for BLE access control and push notifications.

In this policy, we use the term "cookies" broadly to refer to all of these technologies.

**ქართული:**
- **ქუქი-ფაილები** არის მცირე ტექსტური ფაილები, რომლებიც ინახება თქვენს მოწყობილობაზე ვებსაიტის ან აპლიკაციის მიერ. ისინი შეიცავს მონაცემებს, რომლებიც ეხმარება თქვენი მოწყობილობის იდენტიფიცირებასა და პრეფერენციების შენახვას.
- **ლოკალური საცავი / AsyncStorage** არის მექანიზმი, რომელსაც მობილური აპლიკაციები იყენებენ მცირე რაოდენობის მონაცემების ლოკალურად შესანახად თქვენს მოწყობილობაზე, ქუქი-ფაილების მსგავსი, მაგრამ სპეციალურად აპლიკაციებისთვის შექმნილი.
- **სესიის ტოკენები** არის დროებითი იდენტიფიკატორები, რომლებიც გამოიყენება თქვენი ავთენტიფიცირებული სესიის შესანარჩუნებლად.
- **მოწყობილობის იდენტიფიკატორები** არის თქვენი მოწყობილობისთვის მინიჭებული უნიკალური იდენტიფიკატორები, რომლებიც გამოიყენება BLE წვდომის კონტროლისა და Push შეტყობინებებისთვის.

ამ პოლიტიკაში ჩვენ ვიყენებთ ტერმინს "ქუქი-ფაილები" ფართოდ, ყველა ამ ტექნოლოგიის აღსანიშნავად.

---

## 3. Types of Cookies We Use / ქუქი-ფაილების ტიპები, რომლებსაც ვიყენებთ

### 3.1 Strictly Necessary Cookies / მკაცრად აუცილებელი ქუქი-ფაილები

**English:**
These cookies are essential for the App to function and cannot be disabled. They enable core functionality without which the Service would not operate.

| Cookie / Technology | Purpose | Duration | Can Be Disabled? |
|---------------------|---------|----------|------------------|
| Authentication Token (JWT) | Maintains your logged-in session securely | Session / refresh token duration | No |
| Refresh Token | Enables automatic session renewal without re-login | {{REFRESH_TOKEN_DURATION}} days | No |
| BLE Access Credentials | Stores encrypted SaltoKS access keys for door unlock | Duration of active pass | No |
| CSRF Token | Protects against cross-site request forgery attacks | Session | No |
| Device Registration ID | Links your device to your account for push notifications | Until logout | No |
| Session State | Maintains navigation state and temporary data during app use | Session | No |

**ქართული:**
ეს ქუქი-ფაილები აუცილებელია აპლიკაციის ფუნქციონირებისთვის და მათი გამორთვა შეუძლებელია. ისინი უზრუნველყოფენ ძირითად ფუნქციონალობას, რომლის გარეშეც სერვისი ვერ იმუშავებს.

| ქუქი-ფაილი / ტექნოლოგია | მიზანი | ხანგრძლივობა | შეიძლება გამორთვა? |
|-------------------------|--------|-------------|-------------------|
| ავთენტიფიკაციის ტოკენი (JWT) | უსაფრთხოდ ინარჩუნებს თქვენს შესულ სესიას | სესია / განახლების ტოკენის ხანგრძლივობა | არა |
| განახლების ტოკენი | უზრუნველყოფს სესიის ავტომატურ განახლებას ხელახლა შესვლის გარეშე | {{REFRESH_TOKEN_DURATION}} დღე | არა |
| BLE წვდომის სერტიფიკატები | ინახავს დაშიფრულ SaltoKS წვდომის გასაღებებს კარის გასახსნელად | აქტიური აბონემენტის ხანგრძლივობა | არა |
| CSRF ტოკენი | იცავს საიტის მოთხოვნის გაყალბების თავდასხმებისგან | სესია | არა |
| მოწყობილობის რეგისტრაციის ID | აკავშირებს თქვენს მოწყობილობას ანგარიშთან Push შეტყობინებებისთვის | გამოსვლამდე | არა |
| სესიის მდგომარეობა | ინარჩუნებს ნავიგაციის მდგომარეობას და დროებით მონაცემებს აპლიკაციის გამოყენებისას | სესია | არა |

---

### 3.2 Functional Cookies / ფუნქციური ქუქი-ფაილები

**English:**
These cookies remember your choices and preferences to provide a personalized experience. Disabling these cookies may reduce the quality of your experience but will not prevent core functionality.

| Cookie / Technology | Purpose | Duration | Can Be Disabled? |
|---------------------|---------|----------|------------------|
| Language Preference | Remembers your selected language (English / Georgian) | Persistent | Yes |
| Theme Preference | Stores your display theme preference (light / dark) | Persistent | Yes |
| Default Location | Remembers your preferred D Block location | Persistent | Yes |
| Booking Preferences | Saves your preferred booking filters and sort options | Persistent | Yes |
| Notification Settings | Stores your notification preferences | Persistent | Yes |
| Recently Viewed Spaces | Caches recently viewed spaces for quick access | 30 days | Yes |
| Onboarding Status | Tracks whether you have completed the app onboarding | Persistent | Yes |

**ქართული:**
ეს ქუქი-ფაილები იმახსოვრებენ თქვენს არჩევანსა და პრეფერენციებს პერსონალიზებული გამოცდილების უზრუნველსაყოფად. ამ ქუქი-ფაილების გამორთვამ შეიძლება შეამციროს თქვენი გამოცდილების ხარისხი, მაგრამ ვერ შეაფერხებს ძირითად ფუნქციონალობას.

| ქუქი-ფაილი / ტექნოლოგია | მიზანი | ხანგრძლივობა | შეიძლება გამორთვა? |
|-------------------------|--------|-------------|-------------------|
| ენის პრეფერენცია | იმახსოვრებს თქვენს არჩეულ ენას (ინგლისური / ქართული) | მუდმივი | დიახ |
| თემის პრეფერენცია | ინახავს თქვენი ჩვენების თემის პრეფერენციას (ღია / მუქი) | მუდმივი | დიახ |
| ნაგულისხმევი ლოკაცია | იმახსოვრებს თქვენს სასურველ D Block ლოკაციას | მუდმივი | დიახ |
| ჯავშნის პრეფერენციები | ინახავს თქვენს სასურველ ჯავშნის ფილტრებსა და სორტირების ვარიანტებს | მუდმივი | დიახ |
| შეტყობინებების პარამეტრები | ინახავს თქვენი შეტყობინებების პრეფერენციებს | მუდმივი | დიახ |
| ბოლოს ნანახი სივრცეები | ქეშირებს ბოლოს ნანახ სივრცეებს სწრაფი წვდომისთვის | 30 დღე | დიახ |
| ონბორდინგის სტატუსი | ადევნებს თვალყურს, დაასრულეთ თუ არა აპლიკაციის ონბორდინგი | მუდმივი | დიახ |

---

### 3.3 Analytics Cookies / ანალიტიკის ქუქი-ფაილები

**English:**
These cookies help us understand how users interact with the App so we can improve features, fix issues, and optimize the user experience. Analytics data is collected in pseudonymized or aggregated form.

| Cookie / Technology | Provider | Purpose | Duration | Can Be Disabled? |
|---------------------|----------|---------|----------|------------------|
| PostHog Analytics | PostHog (EU-hosted) | Tracks pseudonymized user interactions, feature usage, and navigation patterns to improve the product | Session + 1 year | Yes |
| Firebase Analytics | Google (Firebase) | Collects app usage statistics, screen views, and engagement metrics | Up to 14 months | Yes |
| Firebase Crashlytics | Google (Firebase) | Captures crash reports, error logs, and performance data to improve app stability | Until resolved | Yes |
| Firebase Performance Monitoring | Google (Firebase) | Monitors app startup time, network request latency, and screen rendering performance | 90 days | Yes |

**We do not use any advertising or tracking cookies.** We do not sell your data to third parties or use it for advertising purposes.

**ქართული:**
ეს ქუქი-ფაილები გვეხმარება გავიგოთ, თუ როგორ ურთიერთქმედებენ მომხმარებლები აპლიკაციასთან, რათა გავაუმჯობესოთ ფუნქციები, გამოვასწოროთ პრობლემები და ოპტიმიზაცია გავუკეთოთ მომხმარებლის გამოცდილებას. ანალიტიკის მონაცემები გროვდება ფსევდონიმიზებული ან აგრეგირებული ფორმით.

| ქუქი-ფაილი / ტექნოლოგია | მომწოდებელი | მიზანი | ხანგრძლივობა | შეიძლება გამორთვა? |
|-------------------------|-----------|--------|-------------|-------------------|
| PostHog ანალიტიკა | PostHog (EU-ზე ჰოსტირებული) | თვალყურს ადევნებს ფსევდონიმიზებულ მომხმარებლის ინტერაქციებს, ფუნქციების გამოყენებასა და ნავიგაციის შაბლონებს პროდუქტის გასაუმჯობესებლად | სესია + 1 წელი | დიახ |
| Firebase ანალიტიკა | Google (Firebase) | აგროვებს აპლიკაციის გამოყენების სტატისტიკას, ეკრანის ნახვებსა და ჩართულობის მეტრიკებს | 14 თვემდე | დიახ |
| Firebase Crashlytics | Google (Firebase) | იჭერს ავარიის ანგარიშებს, შეცდომების ჟურნალებს და წარმადობის მონაცემებს აპლიკაციის სტაბილურობის გასაუმჯობესებლად | გადაწყვეტამდე | დიახ |
| Firebase წარმადობის მონიტორინგი | Google (Firebase) | ამოწმებს აპლიკაციის გაშვების დროს, ქსელის მოთხოვნის შეყოვნებასა და ეკრანის რენდერინგის წარმადობას | 90 დღე | დიახ |

**ჩვენ არ ვიყენებთ არანაირ სარეკლამო ან თვალყურის დევნის ქუქი-ფაილებს.** ჩვენ არ ვყიდით თქვენს მონაცემებს მესამე პირებისთვის და არ ვიყენებთ მათ სარეკლამო მიზნებისთვის.

---

## 4. No Advertising Cookies / სარეკლამო ქუქი-ფაილები არ გამოიყენება

**English:**
D Block Workspace does not use any advertising cookies, retargeting pixels, or third-party ad tracking technologies. We do not:
- Serve advertisements within the App
- Share your data with advertising networks
- Track your activity across other websites or applications for advertising purposes
- Use fingerprinting techniques for ad targeting

**ქართული:**
D Block Workspace არ იყენებს არანაირ სარეკლამო ქუქი-ფაილებს, ხელახალი მიზნობრივი პიქსელებს ან მესამე მხარის სარეკლამო თვალყურის დევნის ტექნოლოგიებს. ჩვენ არ:
- ვაჩვენებთ რეკლამებს აპლიკაციაში
- ვუზიარებთ თქვენს მონაცემებს სარეკლამო ქსელებს
- ვთვალყურობთ თქვენს აქტივობას სხვა ვებსაიტებსა ან აპლიკაციებზე სარეკლამო მიზნებისთვის
- ვიყენებთ თითის ანაბეჭდის ტექნიკებს სარეკლამო მიზნობრიობისთვის

---

## 5. How to Manage Cookies / როგორ მართოთ ქუქი-ფაილები

**English:**

### 5.1 In-App Settings
You can manage functional and analytics cookies directly within the App:

1. Open the D Block Workspace App
2. Navigate to **Settings** > **Privacy** > **Cookie Preferences**
3. Toggle individual cookie categories on or off:
   - **Functional Cookies:** Controls preference storage (language, theme, default location)
   - **Analytics Cookies:** Controls PostHog and Firebase analytics data collection

Note: Strictly necessary cookies cannot be disabled as they are required for the App to function.

### 5.2 Device-Level Controls
You can also manage data storage at the device level:

**iOS:**
1. Go to **Settings** > **General** > **iPhone Storage**
2. Select **D Block Workspace**
3. Choose **Offload App** (preserves data) or **Delete App** (removes all data)

**Android:**
1. Go to **Settings** > **Apps** > **D Block Workspace**
2. Select **Storage & Cache**
3. Choose **Clear Cache** (removes temporary data) or **Clear Storage** (removes all data)

### 5.3 Website Cookies
If you visit our website at https://dblock.ge, you can manage cookies through:
- The cookie consent banner displayed on your first visit
- Your browser settings (see your browser's help documentation)
- Browser extensions that block cookies

### 5.4 Opting Out of Analytics

**PostHog:**
- Disable analytics in the App: Settings > Privacy > Cookie Preferences > Analytics
- PostHog respects the Do Not Track (DNT) browser signal on our website

**Firebase:**
- Disable analytics in the App: Settings > Privacy > Cookie Preferences > Analytics
- On iOS: Enable "Limit Ad Tracking" in device settings
- On Android: Opt out of "Ads Personalization" in Google Settings

**ქართული:**

### 5.1 აპლიკაციის პარამეტრები
თქვენ შეგიძლიათ მართოთ ფუნქციური და ანალიტიკის ქუქი-ფაილები პირდაპირ აპლიკაციაში:

1. გახსენით D Block Workspace აპლიკაცია
2. გადადით **პარამეტრები** > **კონფიდენციალურობა** > **ქუქი-ფაილების პრეფერენციები**
3. ჩართეთ ან გამორთეთ ინდივიდუალური ქუქი-ფაილების კატეგორიები:
   - **ფუნქციური ქუქი-ფაილები:** აკონტროლებს პრეფერენციების შენახვას (ენა, თემა, ნაგულისხმევი ლოკაცია)
   - **ანალიტიკის ქუქი-ფაილები:** აკონტროლებს PostHog-ისა და Firebase-ის ანალიტიკის მონაცემთა შეგროვებას

შენიშვნა: მკაცრად აუცილებელი ქუქი-ფაილების გამორთვა შეუძლებელია, რადგან ისინი საჭიროა აპლიკაციის ფუნქციონირებისთვის.

### 5.2 მოწყობილობის დონის კონტროლი
თქვენ ასევე შეგიძლიათ მართოთ მონაცემთა შენახვა მოწყობილობის დონეზე:

**iOS:**
1. გადადით **პარამეტრები** > **ზოგადი** > **iPhone-ის მეხსიერება**
2. აირჩიეთ **D Block Workspace**
3. აირჩიეთ **აპლიკაციის გადმოტვირთვა** (ინახავს მონაცემებს) ან **აპლიკაციის წაშლა** (წაშლის ყველა მონაცემს)

**Android:**
1. გადადით **პარამეტრები** > **აპლიკაციები** > **D Block Workspace**
2. აირჩიეთ **მეხსიერება და ქეში**
3. აირჩიეთ **ქეშის გასუფთავება** (წაშლის დროებით მონაცემებს) ან **მეხსიერების გასუფთავება** (წაშლის ყველა მონაცემს)

### 5.3 ვებსაიტის ქუქი-ფაილები
თუ ეწვიეთ ჩვენს ვებსაიტს https://dblock.ge, შეგიძლიათ მართოთ ქუქი-ფაილები:
- პირველი ვიზიტისას გამოჩენილი ქუქი-ფაილების თანხმობის ბანერის მეშვეობით
- თქვენი ბრაუზერის პარამეტრების მეშვეობით (იხილეთ თქვენი ბრაუზერის დახმარების დოკუმენტაცია)
- ბრაუზერის გაფართოებებით, რომლებიც ბლოკავენ ქუქი-ფაილებს

### 5.4 ანალიტიკაზე უარის თქმა

**PostHog:**
- გამორთეთ ანალიტიკა აპლიკაციაში: პარამეტრები > კონფიდენციალურობა > ქუქი-ფაილების პრეფერენციები > ანალიტიკა
- PostHog პატივს სცემს Do Not Track (DNT) ბრაუზერის სიგნალს ჩვენს ვებსაიტზე

**Firebase:**
- გამორთეთ ანალიტიკა აპლიკაციაში: პარამეტრები > კონფიდენციალურობა > ქუქი-ფაილების პრეფერენციები > ანალიტიკა
- iOS-ზე: ჩართეთ "სარეკლამო თვალყურის დევნის შეზღუდვა" მოწყობილობის პარამეტრებში
- Android-ზე: უარი თქვით "რეკლამის პერსონალიზაციაზე" Google-ის პარამეტრებში

---

## 6. Impact of Disabling Cookies / ქუქი-ფაილების გამორთვის გავლენა

**English:**
Disabling certain cookies may affect your experience:

| Disabled Category | Impact |
|-------------------|--------|
| Functional Cookies | Language and theme preferences will reset each session; you will need to re-select your preferred location; recently viewed spaces will not be cached |
| Analytics Cookies | No impact on App functionality; we will have less data to improve the product and fix issues |
| Strictly Necessary (cannot disable) | App will not function; authentication, BLE access, and core features will fail |

**ქართული:**
გარკვეული ქუქი-ფაილების გამორთვამ შეიძლება იმოქმედოს თქვენს გამოცდილებაზე:

| გამორთული კატეგორია | გავლენა |
|--------------------|---------|
| ფუნქციური ქუქი-ფაილები | ენისა და თემის პრეფერენციები განახლდება ყოველ სესიაზე; საჭირო იქნება სასურველი ლოკაციის ხელახლა არჩევა; ბოლოს ნანახი სივრცეები არ იქნება ქეშირებული |
| ანალიტიკის ქუქი-ფაილები | არანაირი გავლენა აპლიკაციის ფუნქციონალობაზე; ჩვენ გვექნება ნაკლები მონაცემები პროდუქტის გასაუმჯობესებლად და პრობლემების გამოსასწორებლად |
| მკაცრად აუცილებელი (გამორთვა შეუძლებელია) | აპლიკაცია ვერ იმუშავებს; ავთენტიფიკაცია, BLE წვდომა და ძირითადი ფუნქციები ვერ იმუშავებს |

---

## 7. Data Transfers / მონაცემთა გადაცემა

**English:**
Some analytics data processed by cookies may be transferred to servers outside of Georgia:

- **PostHog:** Data is processed on EU-based servers
- **Firebase (Google):** Data may be processed in the USA or EU, subject to Google's data processing terms and Standard Contractual Clauses

For full details on international data transfers, please refer to our Privacy Policy (Section 10).

**ქართული:**
ქუქი-ფაილებით დამუშავებული ზოგიერთი ანალიტიკის მონაცემი შეიძლება გადაიცეს საქართველოს ფარგლებს გარეთ არსებულ სერვერებზე:

- **PostHog:** მონაცემები მუშავდება EU-ზე დაფუძნებულ სერვერებზე
- **Firebase (Google):** მონაცემები შეიძლება დამუშავდეს აშშ-ში ან EU-ში, Google-ის მონაცემთა დამუშავების პირობებისა და სტანდარტული სახელშეკრულებო პირობების შესაბამისად

საერთაშორისო მონაცემთა გადაცემის სრული დეტალებისთვის, გთხოვთ იხილოთ ჩვენი კონფიდენციალურობის პოლიტიკა (ნაწილი 10).

---

## 8. Changes to This Cookie Policy / ცვლილებები ამ ქუქი-ფაილების პოლიტიკაში

**English:**
We may update this Cookie Policy from time to time. Changes will be posted within the App and on our website, with the "Last Updated" date revised accordingly. Material changes will be communicated through in-app notifications.

We encourage you to review this policy periodically to stay informed about our use of cookies.

**ქართული:**
ჩვენ შეიძლება დროდადრო განვაახლოთ ეს ქუქი-ფაილების პოლიტიკა. ცვლილებები გამოქვეყნდება აპლიკაციაში და ჩვენს ვებსაიტზე, "ბოლო განახლების" თარიღის შესაბამისი შესწორებით. მნიშვნელოვანი ცვლილებები გაცნობებული იქნება აპლიკაციის შეტყობინებებით.

ჩვენ გირჩევთ, პერიოდულად გადახედოთ ამ პოლიტიკას, რათა იყოთ ინფორმირებული ქუქი-ფაილების გამოყენების შესახებ.

---

## 9. Contact Us / დაგვიკავშირდით

**English:**
If you have questions about this Cookie Policy, please contact us:

- **Data Protection Officer:** {{DPO_NAME}}
- **Email:** {{DPO_EMAIL}}
- **Address:** Adjara Group LLC, {{REGISTERED_ADDRESS}}, Tbilisi, Georgia
- **Website:** https://dblock.ge/cookie-policy

**ქართული:**
თუ გაქვთ შეკითხვები ამ ქუქი-ფაილების პოლიტიკასთან დაკავშირებით, გთხოვთ დაგვიკავშირდეთ:

- **მონაცემთა დაცვის ოფიცერი:** {{DPO_NAME}}
- **ელ. ფოსტა:** {{DPO_EMAIL}}
- **მისამართი:** ადჯარა გრუპი შ.პ.ს., {{REGISTERED_ADDRESS}}, თბილისი, საქართველო
- **ვებსაიტი:** https://dblock.ge/cookie-policy

---

*This Cookie Policy was prepared as a template and should be reviewed by qualified legal counsel before publication.*

*ეს ქუქი-ფაილების პოლიტიკა მომზადებულია შაბლონის სახით და გამოქვეყნებამდე უნდა გადაიხედოს კვალიფიციური იურიდიული მრჩევლის მიერ.*

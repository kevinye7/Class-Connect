# Hunter College Course Data Scraper & Firebase Import

This directory contains scripts to scrape Hunter College course data using Selenium and import it into Firebase Firestore.

## 📋 Overview

1. **Python Selenium Scraper** (`scrape_courses.py`) - Scrapes Hunter College course data using browser automation
2. **Firebase Import Script** (`import_to_firebase.js`) - Imports the scraped data into Firestore

## 🚀 Step 1: Environment Setup

### Install Python Dependencies

```bash
# Navigate to the scripts directory
cd scripts

# Install required packages
pip install -r requirements.txt
```

## 🔍 Step 2: Run the Scraper

```bash
# From the scripts directory
python scrape_courses.py
```

This will:
- Launch a Chrome browser window
- Navigate to CUNY Global Search
- Select Hunter College and Fall 2025 term
- Expand all course sections
- Extract course codes and names using regex patterns
- Save results to hunter_courses.json

### Output Format

The scraper generates `hunter_courses.json` with this structure:

```json
[
  {
    "course_code": "CSC 101",
    "course_name": "Introduction to Computer Science",
    "instructor": "Extract Separately",
    "college": "Hunter College"
  }
]
```

### ⚠️ Important Notes

1. **Browser Automation**: The script uses Selenium WebDriver which opens a real Chrome browser window

2. **No Credits Field**: The current implementation doesn't extract credits information

3. **Hunter College Only**: Currently configured for Hunter College (HTR01)

4. **Manual Verification**: You may need to manually complete CAPTCHA if prompted

## 🔥 Step 3: Set Up Firebase Import

### Prerequisites

1. **Install Firebase Admin SDK**:
   ```bash
   npm install firebase-admin
   ```

2. **Get Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** > **Service Accounts**
   - Click **Generate New Private Key**
   - Save the JSON file as `firebase-service-account.json` in the `scripts` directory

### Import to Firebase

```bash
# From the project root
node scripts/import_to_firebase.js
```

This will:
- Read `cuny_courses.json`
- Create/update documents in the `courses` Firestore collection
- Use batch writes for efficiency
- Display progress

## 📊 Step 4: Verify Firebase Structure

After importing, verify in Firebase Console:

1. Go to **Firestore Database**
2. Check the `courses` collection
3. Each document should have:
   - `course_code` (string)
   - `course_name` (string)
   - `college` (string)
   - `instructor` (string)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

## 🔒 Step 5: Set Up Firestore Security Rules

Make sure your Firestore rules allow reading courses:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read courses
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (via Admin SDK)
    }
    
    // ... your other rules
  }
}
```

## 🐛 Troubleshooting

### Scraper Issues

1. **Chrome Driver Not Found**: 
   - Download Chrome Driver and add to PATH
   - Or use webdriver-manager to handle it automatically

2. **CAPTCHA Blocking**:
   - The script may be blocked by CAPTCHA
   - You might need to manually solve it during the first run

2. **No Courses Found**:
   - Check if the website structure has changed
   - Verify the college code (HTR01) is still valid

### Firebase Import Issues

1. **Service account not found**:
   - Make sure `firebase-service-account.json` is in the `scripts` directory
   - Verify the file has valid JSON structure

2. **Permission errors**:
   - Check that your service account has Firestore write permissions
   - Verify the project ID matches your Firebase project

3. **Batch size errors**:
   - The script uses batches of 500 (Firestore limit)
   - If you get batch errors, reduce `BATCH_SIZE` in the script

## 📝 Next Steps

Once the data is imported:

1. Update your app to query the `courses` collection from Firestore
2. Replace mock data in `lib/data.ts` with real Firestore queries
3. Implement course search and filtering
4. Link selected courses to users in the `users` collection

## 📁 File Structure

```
scripts/
├── scrape_courses.py              # Selenium scraper script
├── requirements.txt               # Python dependencies
├── import_to_firebase.js          # Firebase import script
├── hunter_courses.json            # Generated course data
└── SCRAPER_README.md              # This file
```
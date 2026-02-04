/**
 * Firebase Import Script for Hunter College Courses
 * 
 * This script imports course data from hunter_courses.json into Firebase Firestore.
 * 
 * Usage:
 *   1. Make sure you have hunter_courses.json in the scripts directory
 *   2. Set up your Firebase credentials
 *   3. Run: node scripts/import_to_firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
let serviceAccount;
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
} else {
  console.error('Error: firebase-service-account.json not found!');
  console.log('\nTo fix this:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate New Private Key"');
  console.log('3. Save the file as "firebase-service-account.json" in the scripts directory');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Import courses from JSON file to Firestore
 */
async function importCoursesToFirebase() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'hunter_courses.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`Error: ${jsonPath} not found!`);
      console.log('Please run scrape_courses.py first to generate the JSON file.');
      process.exit(1);
    }
    
    const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (!Array.isArray(coursesData) || coursesData.length === 0) {
      console.error('Error: No course data found in JSON file!');
      process.exit(1);
    }
    
    console.log(`\n📚 Starting import of ${coursesData.length} Hunter College courses to Firebase...\n`);
    
    const batch = db.batch();
    let batchCount = 0;
    let totalImported = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (let i = 0; i < coursesData.length; i++) {
      const course = coursesData[i];
      
      // Generate a unique document ID
      const docId = `${course.college.toLowerCase().replace(/\s+/g, '-')}-${course.course_code.replace(/\s+/g, '-')}`;
      
      // Create document reference
      const courseRef = db.collection('courses').doc(docId);
      
      // Prepare course data for Firestore
      const firestoreCourse = {
        course_code: course.course_code,
        course_name: course.course_name,
        college: course.college,
        instructor: course.instructor || "Not specified",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Set the document
      batch.set(courseRef, firestoreCourse, { merge: true });
      batchCount++;
      
      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        totalImported += batchCount;
        console.log(`  ✓ Imported batch: ${totalImported}/${coursesData.length} courses`);
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      totalImported += batchCount;
    }
    
    console.log(`\n✅ Successfully imported ${totalImported} Hunter College courses to Firebase Firestore!`);
    console.log(`   Collection: courses`);
    console.log(`   Total documents: ${totalImported}`);
    console.log(`   College: Hunter College\n`);
    
  } catch (error) {
    console.error('❌ Error importing courses:', error);
    process.exit(1);
  }
}

// Run the import
importCoursesToFirebase()
  .then(() => {
    console.log('Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
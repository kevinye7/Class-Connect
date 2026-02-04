/**
 * Import CUNY courses from JSON to Firestore
 * 
 * This script reads cuny_all_courses_raw.json and imports all courses
 * into the Firestore 'courses' collection.
 * 
 * Usage: npm run import:courses
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Term code for Fall 2025
const TERM_CODE = '1259';

// Initialize Firebase Admin SDK
let serviceAccount;
const possibleServiceAccountPaths = [
  path.join(__dirname, 'serviceAccountKey.json'),
  path.join(__dirname, 'class-connect-58d87-firebase-adminsdk-fbsvc-37feea5b00.json'),
];

let serviceAccountPath = null;
for (const pathOption of possibleServiceAccountPaths) {
  if (fs.existsSync(pathOption)) {
    serviceAccountPath = pathOption;
    break;
  }
}

if (!serviceAccountPath) {
  console.error('❌ Error: Firebase service account file not found!');
  console.log('\nPlease ensure one of these files exists:');
  possibleServiceAccountPaths.forEach(p => console.log(`  - ${p}`));
  process.exit(1);
}

serviceAccount = require(serviceAccountPath);
console.log(`✅ Using service account: ${path.basename(serviceAccountPath)}`);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Generate a deterministic document ID for a course
 * Format: termCode:collegeCode:subject:catalogNumber:section
 * Then hash it with MD5 and take first 12 chars
 */
function generateCourseId(course) {
  const parts = [
    TERM_CODE,
    course.collegeCode || '',
    course.subject || '',
    course.catalogNumber || '',
    course.section || ''
  ];
  
  const base = parts.join(':');
  const hash = crypto.createHash('md5').update(base).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Main import function
 */
async function importCourses() {
  try {
    // Read the JSON file - check both scripts/ and data/ folders
    const possibleJsonPaths = [
      path.join(__dirname, 'cuny_all_courses_raw.json'),
      path.join(__dirname, '..', 'data', 'cuny_all_courses_raw.json'),
    ];
    
    let jsonPath = null;
    for (const pathOption of possibleJsonPaths) {
      if (fs.existsSync(pathOption)) {
        jsonPath = pathOption;
        break;
      }
    }
    
    if (!jsonPath) {
      console.error('❌ Error: cuny_all_courses_raw.json not found!');
      console.log('\nPlease ensure the file exists in one of these locations:');
      possibleJsonPaths.forEach(p => console.log(`  - ${p}`));
      process.exit(1);
    }
    
    console.log(`📂 Reading courses from: ${jsonPath}`);
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const coursesData = JSON.parse(fileContent);
    
    if (!Array.isArray(coursesData)) {
      console.error('❌ Error: JSON file must contain an array of courses');
      process.exit(1);
    }
    
    if (coursesData.length === 0) {
      console.error('❌ Error: No courses found in JSON file');
      process.exit(1);
    }
    
    console.log(`\n📚 Starting import of ${coursesData.length} courses to Firestore...\n`);
    
    let batch = db.batch();
    let batchCount = 0;
    let totalImported = 0;
    let skipped = 0;
    const BATCH_SIZE = 450; // Stay under Firestore's 500 limit
    
    for (let i = 0; i < coursesData.length; i++) {
      const course = coursesData[i];
      
      try {
        // Generate deterministic document ID
        const docId = generateCourseId(course);
        const courseRef = db.collection('courses').doc(docId);
        
        // Prepare course data for Firestore
        const firestoreCourse = {
          termCode: TERM_CODE,
          collegeCode: course.collegeCode || null,
          collegeName: course.collegeName || null,
          subject: course.subject || null,
          subjectName: course.subjectName || null,
          courseCode: course.courseCode || null,
          catalogNumber: course.catalogNumber || null,
          classNumber: course.classNumber || null,
          section: course.section || null,
          title: course.title || null,
          days: course.days || null,
          startTime: course.startTime || null,
          endTime: course.endTime || null,
          rawDaysTimes: course.rawDaysTimes || null,
          location: course.location || null,
          instructor: course.instructor || 'TBA',
          status: course.status || null,
          instructionMode: course.instructionMode || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Use merge: true so re-running the script updates instead of duplicating
        batch.set(courseRef, firestoreCourse, { merge: true });
        batchCount++;
        
        // Commit batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          totalImported += batchCount;
          const percentage = Math.round((totalImported / coursesData.length) * 100);
          console.log(`  ✓ Imported batch: ${totalImported}/${coursesData.length} courses (${percentage}%)`);
          batchCount = 0;
          batch = db.batch(); // Create new batch
        }
      } catch (error) {
        console.error(`  ⚠️ Error processing course at index ${i}:`, error.message);
        skipped++;
        continue;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      totalImported += batchCount;
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Successfully imported ${totalImported} courses to Firestore!`);
    console.log(`   Collection: courses`);
    console.log(`   Total documents: ${totalImported}`);
    if (skipped > 0) {
      console.log(`   Skipped: ${skipped} courses due to errors`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('❌ Error importing courses:', error);
    process.exit(1);
  }
}

// Run the import
importCourses()
  .then(() => {
    console.log('🎉 Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });


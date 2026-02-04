export interface User {
  email: string;
  name?: string;
}

export interface College {
  id: string;
  name: string;
  abbreviation: string;
  domain: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  students: number;
  collegeId: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  courseId: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  description?: string;
  addedBy: string;
  timestamp: string;
  courseId: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // Array of user emails who voted for this option
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  timestamp: string;
  courseId: string;
}

// Firestore course document type
export interface CourseDoc {
  id: string; // Firestore document ID (not stored in doc, used in app)
  termCode: string; // e.g. "1259"
  collegeCode: string | null;
  collegeName: string | null;
  subject: string | null;
  subjectName: string | null;
  courseCode: string | null;
  catalogNumber: string | null;
  classNumber: string | null;
  section: string | null;
  title: string | null;
  days: string | null;
  startTime: string | null;
  endTime: string | null;
  rawDaysTimes: string | null;
  location: string | null;
  instructor: string; // default to "TBA" when missing
  status: string | null;
  instructionMode: string | null;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
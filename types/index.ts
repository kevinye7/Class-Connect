export interface User {
  email: string;
  name?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  students: number;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  courseId: string;
}
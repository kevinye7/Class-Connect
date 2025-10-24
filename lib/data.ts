import { Course, Message } from '../types';

// Mock data - in a real app, this would come from a database
const availableCourses: Course[] = [
  { id: '1', name: 'Introduction to Computer Science', code: 'CSC101', instructor: 'Smith', students: 45 },
  { id: '2', name: 'Calculus I', code: 'MATH201', instructor: 'Johnson', students: 38 },
  { id: '3', name: 'English Composition', code: 'ENG101', instructor: 'Williams', students: 52 },
  { id: '4', name: 'Data Structures', code: 'CSC211', instructor: 'Brown', students: 32 },
  { id: '5', name: 'Physics I', code: 'PHY101', instructor: 'Davis', students: 41 },
  { id: '6', name: 'Web Development', code: 'CSC317', instructor: 'Miller', students: 28 },
];

// In-memory storage for messages (will reset on page refresh)
const chatMessages: Record<string, Message[]> = {};

export const getAvailableCourses = (): Course[] => {
  return availableCourses;
};

export const getCourseById = (id: string): Course | undefined => {
  return availableCourses.find(course => course.id === id);
};

export const getUserCourses = (): Course[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('userCourses');
  return stored ? JSON.parse(stored) : [];
};

export const getChatMessages = (courseId: string): Message[] => {
  return chatMessages[courseId] || [];
};

export const addMessage = (courseId: string, message: Message): void => {
  if (!chatMessages[courseId]) {
    chatMessages[courseId] = [];
  }
  chatMessages[courseId].push(message);
};
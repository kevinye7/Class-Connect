import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllCourses } from '../../lib/firebaseHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const courses = await getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses from Firebase:', error);
    res.status(500).json({ error: 'Failed to fetch courses from Firebase', details: error });
  }
}

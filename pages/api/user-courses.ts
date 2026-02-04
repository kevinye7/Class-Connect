import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserCourses, addUserCourse, removeUserCourse } from '../../lib/firebaseHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const userEmail = req.query.email as string;

  if (!userEmail) {
    return res.status(400).json({ error: 'User email is required' });
  }

  switch (method) {
    case 'GET':
      try {
        const courses = await getUserCourses(userEmail);
        res.status(200).json(courses);
      } catch (error) {
        console.error('Error fetching user courses:', error);
        res.status(500).json({ error: 'Failed to fetch user courses' });
      }
      break;

    case 'POST':
      try {
        const { courseId } = req.body;
        if (!courseId) {
          return res.status(400).json({ error: 'Course ID is required' });
        }
        await addUserCourse(userEmail, courseId);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error adding user course:', error);
        res.status(500).json({ error: 'Failed to add user course' });
      }
      break;

    case 'DELETE':
      try {
        const { courseId } = req.body;
        if (!courseId) {
          return res.status(400).json({ error: 'Course ID is required' });
        }
        await removeUserCourse(userEmail, courseId);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error removing user course:', error);
        res.status(500).json({ error: 'Failed to remove user course' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}


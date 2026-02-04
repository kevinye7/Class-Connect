import type { NextApiRequest, NextApiResponse } from 'next';
import { getMessages, addMessage } from '../../lib/firebaseHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const courseId = req.query.courseId as string;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  switch (method) {
    case 'GET':
      try {
        const messages = await getMessages(courseId);
        res.status(200).json(messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
      }
      break;

    case 'POST':
      try {
        const message = req.body;
        if (!message.text || !message.sender) {
          return res.status(400).json({ error: 'Invalid message data' });
        }
        message.courseId = courseId;
        await addMessage(message);
        res.status(200).json({ success: true, message });
      } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}


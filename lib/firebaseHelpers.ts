import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Course, Message, Resource, Poll } from '../types';

// Course functions
export async function getAllCourses(): Promise<Course[]> {
  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.title || '',
        code: data.code || '',
        instructor: data.instructor || 'TBA',
        students: data.students || 0,
        collegeId: data.collegeId || ''
      };
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const courseRef = doc(db, 'courses', id);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      return null;
    }
    
    const data = courseSnap.data();
    return {
      id: courseSnap.id,
      name: data.name || data.title || '',
      code: data.code || '',
      instructor: data.instructor || 'TBA',
      students: data.students || 0,
      collegeId: data.collegeId || ''
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

export async function getCoursesByCollege(collegeId: string): Promise<Course[]> {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('collegeId', '==', collegeId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.title || '',
        code: data.code || '',
        instructor: data.instructor || 'TBA',
        students: data.students || 0,
        collegeId: data.collegeId || ''
      };
    });
  } catch (error) {
    console.error('Error fetching courses by college:', error);
    return [];
  }
}

// User courses functions
export async function getUserCourses(userEmail: string): Promise<Course[]> {
  try {
    const userCoursesRef = collection(db, 'user_courses');
    const q = query(userCoursesRef, where('userEmail', '==', userEmail));
    const snapshot = await getDocs(q);
    
    const courseIds = snapshot.docs.map(doc => doc.data().courseId);
    
    if (courseIds.length === 0) {
      return [];
    }
    
    // Fetch course details
    const courses: Course[] = [];
    for (const courseId of courseIds) {
      const course = await getCourseById(courseId);
      if (course) {
        courses.push(course);
      }
    }
    
    return courses;
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }
}

export async function addUserCourse(userEmail: string, courseId: string): Promise<void> {
  try {
    const userCoursesRef = collection(db, 'user_courses');
    // Check if already enrolled
    const q = query(
      userCoursesRef,
      where('userEmail', '==', userEmail),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(userCoursesRef, {
        userEmail,
        courseId,
        joinedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error adding user course:', error);
    throw error;
  }
}

export async function removeUserCourse(userEmail: string, courseId: string): Promise<void> {
  try {
    const userCoursesRef = collection(db, 'user_courses');
    const q = query(
      userCoursesRef,
      where('userEmail', '==', userEmail),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch (error) {
    console.error('Error removing user course:', error);
    throw error;
  }
}

// Message functions
export async function getMessages(courseId: string): Promise<Message[]> {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        sender: data.sender,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        courseId: data.courseId
      };
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function addMessage(message: Message): Promise<void> {
  try {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
      text: message.text,
      sender: message.sender,
      timestamp: serverTimestamp(),
      courseId: message.courseId
    });
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

// Resource functions
export async function getResources(courseId: string): Promise<Resource[]> {
  try {
    const resourcesRef = collection(db, 'resources');
    const q = query(resourcesRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        url: data.url,
        description: data.description,
        addedBy: data.addedBy,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        courseId: data.courseId
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching resources:', error);
    return [];
  }
}

export async function addResource(resource: Resource): Promise<void> {
  try {
    const resourcesRef = collection(db, 'resources');
    await addDoc(resourcesRef, {
      title: resource.title,
      url: resource.url,
      description: resource.description || null,
      addedBy: resource.addedBy,
      timestamp: serverTimestamp(),
      courseId: resource.courseId
    });
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
}

export async function deleteResource(resourceId: string): Promise<void> {
  try {
    const resourceRef = doc(db, 'resources', resourceId);
    await deleteDoc(resourceRef);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
}

// Poll functions (using flat structure: polls, poll_options, poll_votes)
export async function getPolls(courseId: string): Promise<Poll[]> {
  try {
    const pollsRef = collection(db, 'polls');
    const q = query(pollsRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    
    const polls: Poll[] = [];
    
    for (const pollDoc of snapshot.docs) {
      const pollData = pollDoc.data();
      
      // Get poll options
      const optionsRef = collection(db, 'poll_options');
      const optionsQuery = query(optionsRef, where('pollId', '==', pollDoc.id));
      const optionsSnapshot = await getDocs(optionsQuery);
      
      const options = await Promise.all(
        optionsSnapshot.docs.map(async (optionDoc) => {
          const optionData = optionDoc.data();
          
          // Get votes for this option
          const votesRef = collection(db, 'poll_votes');
          const votesQuery = query(
            votesRef,
            where('pollId', '==', pollDoc.id),
            where('optionId', '==', optionDoc.id)
          );
          const votesSnapshot = await getDocs(votesQuery);
          const votes = votesSnapshot.docs.map(voteDoc => voteDoc.data().userEmail);
          
          return {
            id: optionDoc.id,
            text: optionData.text,
            votes
          };
        })
      );
      
      polls.push({
        id: pollDoc.id,
        question: pollData.question,
        options,
        createdBy: pollData.createdBy,
        timestamp: pollData.timestamp?.toDate?.()?.toISOString() || pollData.timestamp || new Date().toISOString(),
        courseId: pollData.courseId
      });
    }
    
    return polls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
}

export async function addPoll(poll: Poll): Promise<void> {
  try {
    const pollsRef = collection(db, 'polls');
    const pollDoc = await addDoc(pollsRef, {
      question: poll.question,
      createdBy: poll.createdBy,
      timestamp: serverTimestamp(),
      courseId: poll.courseId
    });
    
    // Add options to poll_options collection
    const optionsRef = collection(db, 'poll_options');
    for (const option of poll.options) {
      await addDoc(optionsRef, {
        pollId: pollDoc.id,
        text: option.text
      });
    }
  } catch (error) {
    console.error('Error adding poll:', error);
    throw error;
  }
}

export async function voteOnPoll(pollId: string, optionId: string, userEmail: string): Promise<void> {
  try {
    // Remove existing vote for this user on this poll
    const votesRef = collection(db, 'poll_votes');
    const existingVotesQuery = query(
      votesRef,
      where('pollId', '==', pollId),
      where('userEmail', '==', userEmail)
    );
    const existingVotes = await getDocs(existingVotesQuery);
    
    for (const voteDoc of existingVotes.docs) {
      await deleteDoc(voteDoc.ref);
    }
    
    // Add new vote
    await addDoc(votesRef, {
      pollId,
      optionId,
      userEmail,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
}

export async function deletePoll(pollId: string): Promise<void> {
  try {
    const pollRef = doc(db, 'polls', pollId);
    await deleteDoc(pollRef);
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
}


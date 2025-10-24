'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserCourses, getAvailableCourses } from '../../lib/data';
import CourseCard from '../../components/CourseCard';
import { Course, User } from '../../types';

export default function Dashboard() {
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!userData || isLoggedIn !== 'true') {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    setUserCourses(getUserCourses());
    setAvailableCourses(getAvailableCourses().slice(0, 3));
  }, [router]);

  const joinCourse = (courseId: string) => {
    const courses = getUserCourses();
    const courseToJoin = getAvailableCourses().find(course => course.id === courseId);
    
    if (courseToJoin && !courses.find(course => course.id === courseId)) {
      const updatedCourses = [...courses, courseToJoin];
      localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
      setUserCourses(updatedCourses);
      setAvailableCourses(availableCourses.filter(course => course.id !== courseId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Manage your courses and connect with classmates
        </p>
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
          <span>Logged in as:</span>
          <span className="font-medium">{user.email}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {userCourses.length} enrolled
              </span>
            </div>
            
            {userCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-500 mb-4">Join courses to start collaborating with classmates</p>
                <a
                  href="/courses"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Courses
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onJoin={joinCourse}
                    isJoined={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/courses"
                className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">+</span>
                  </div>
                  <span className="font-medium text-gray-900">Join New Course</span>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </a>
              
              {userCourses.length > 0 && (
                <a
                  href={`/chat/${userCourses[0].id}`}
                  className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">💬</span>
                    </div>
                    <span className="font-medium text-gray-900">Recent Chat</span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600">→</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Courses</h3>
            <div className="space-y-3">
              {availableCourses.map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.code}</h4>
                    <p className="text-sm text-gray-500">{course.name}</p>
                  </div>
                  <button
                    onClick={() => joinCourse(course.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
              {availableCourses.length === 0 && (
                <p className="text-gray-500 text-center py-2">No available courses</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableCourses, getUserCourses } from '../../lib/data';
import CourseCard from '../../components/CourseCard';
import { Course, User } from '../../types';

export default function Courses() {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
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
    setAvailableCourses(getAvailableCourses());
    setUserCourses(getUserCourses());
  }, [router]);

  const joinCourse = (courseId: string) => {
    const courseToJoin = availableCourses.find(course => course.id === courseId);
    
    if (courseToJoin && !userCourses.find(course => course.id === courseId)) {
      const updatedCourses = [...userCourses, courseToJoin];
      localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
      setUserCourses(updatedCourses);
    }
  };

  const leaveCourse = (courseId: string) => {
    const updatedCourses = userCourses.filter(course => course.id !== courseId);
    localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
    setUserCourses(updatedCourses);
  };

  const filteredCourses = availableCourses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h1>
        <p className="text-gray-600">Join your courses to access class group chats</p>
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
          <span>Logged in as:</span>
          <span className="font-medium">{user.email}</span>
        </div>
      </div>

      {/* Rest of the courses page code remains the same */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses by name, code, or instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Courses</h2>
              <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                {filteredCourses.length} courses
              </span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onJoin={joinCourse}
                    onLeave={leaveCourse}
                    isJoined={userCourses.some(uc => uc.id === course.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
            <div className="space-y-3">
              {userCourses.map(course => (
                <div key={course.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{course.code.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{course.code}</h4>
                    <p className="text-sm text-gray-500 truncate">{course.name}</p>
                  </div>
                </div>
              ))}
              {userCourses.length === 0 && (
                <p className="text-gray-500 text-center py-4">No courses joined yet</p>
              )}
            </div>
          </div>

          <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Can't find your course? Contact your instructor to add it to the system.
            </p>
            <button className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
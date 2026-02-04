'use client';
import { useEffect, useState } from 'react';
import { getUserCourses, fetchAvailableCourses, getLastMessage } from '../../lib/data';
import CourseCard from '../../components/CourseCard';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';
import { formatMessageTime } from '@/lib/utils';
import { Course, Message } from '../../types';

function DashboardContent() {
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    setUserCourses(getUserCourses());
    // Fetch real courses from API and show first 3
    fetchAvailableCourses().then(courses => {
      setAvailableCourses(courses.slice(0, 3));
    });
  }, []);

  const joinCourse = async (courseId: string) => {
    const courses = getUserCourses();
    // Fetch latest available courses
    const allCourses = await fetchAvailableCourses();
    const courseToJoin = allCourses.find(course => course.id === courseId);
    if (courseToJoin && !courses.find(course => course.id === courseId)) {
      const updatedCourses = [...courses, courseToJoin];
      localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
      setUserCourses(updatedCourses);
      setAvailableCourses(availableCourses.filter(course => course.id !== courseId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Manage your courses and connect with classmates
        </p>
        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
          <span>Logged in as:</span>
          <span className="font-medium">{user?.email}</span>
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
                {userCourses.map(course => {
                  const lastMessage = getLastMessage(course.id);
                  return (
                    <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{course.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{course.code}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Prof. {course.instructor}</span>
                            <span>•</span>
                            <span>{course.students} students</span>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shrink-0 ml-4">
                          <span className="text-white font-bold text-sm">{course.code.split(' ')[0]}</span>
                        </div>
                      </div>
                      
                      {/* Recent Message Preview */}
                      {lastMessage && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              {lastMessage.sender.split('@')[0]}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(lastMessage.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 truncate">
                            {lastMessage.text}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <a
                          href={`/chat/${course.id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Enter Chat
                        </a>
                      </div>
                    </div>
                  );
                })}
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
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
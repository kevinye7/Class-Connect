import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onJoin: (courseId: string) => void;
  onLeave?: (courseId: string) => void;
  isJoined: boolean;
}

export default function CourseCard({ course, onJoin, onLeave, isJoined }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
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
      
      <div className="flex space-x-2">
        {isJoined ? (
          <>
            <a
              href={`/chat/${course.id}`}
              className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Enter Chat
            </a>
            {onLeave && (
              <button
                onClick={() => onLeave(course.id)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Leave
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onJoin(course.id)}
            className="flex-1 bg-linear-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
          >
            Join Course
          </button>
        )}
      </div>
    </div>
  );
}
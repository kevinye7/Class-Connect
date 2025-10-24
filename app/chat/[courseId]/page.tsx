'use client';
import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseById, getChatMessages, addMessage } from '../../../lib/data';
import { Course, Message, User } from '../../../types';

// Remove the ChatParams interface and use Params directly

export default function Chat() {
  const [course, setCourse] = useState<Course | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!userData || isLoggedIn !== 'true') {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    
    // Safely access courseId from params
    const courseId = params.courseId as string;
    if (!courseId) {
      router.push('/dashboard');
      return;
    }

    const courseData = getCourseById(courseId);
    if (!courseData) {
      router.push('/dashboard');
      return;
    }

    setCourse(courseData);
    setMessages(getChatMessages(courseId));
  }, [params, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const courseId = params.courseId as string;
    
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: user.email,
      timestamp: new Date().toISOString(),
      courseId: courseId
    };

    addMessage(courseId, message);
    setMessages([...messages, message]);
    setNewMessage('');
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
              <p className="text-gray-600">{course.code} • {course.students} students</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isSameSender = index > 0 && messages[index - 1].sender === message.sender;
                
                return (
                  <div key={message.id} className={`flex ${isSameSender ? 'mt-1' : 'mt-4'}`}>
                    {!isSameSender && (
                      <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3 shrink-0">
                        <span className="text-white text-xs font-bold">
                          {message.sender.split('@')[0].charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`flex-1 ${isSameSender ? 'ml-11' : ''}`}>
                      {!isSameSender && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {message.sender.split('@')[0]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`bg-white rounded-2xl px-4 py-2 shadow-sm border ${
                        isSameSender ? 'rounded-tl-md' : 'rounded-tl-2xl'
                      }`}>
                        <p className="text-gray-900">{message.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
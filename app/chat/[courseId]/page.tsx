'use client';
import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourseById, getChatMessages, addMessage, leaveCourse, getCourseResources, addCourseResource, deleteCourseResource, getCoursePolls, addCoursePoll, voteOnPoll, deleteCoursePoll } from '../../../lib/data';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';
import { formatMessageTime } from '@/lib/utils';
import { Course, Message, Resource, Poll, PollOption } from '../../../types';

function ChatContent() {
  const [course, setCourse] = useState<Course | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'resources' | 'polls'>('chat');
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResourceTitle, setNewResourceTitle] = useState<string>('');
  const [newResourceUrl, setNewResourceUrl] = useState<string>('');
  const [newResourceDescription, setNewResourceDescription] = useState<string>('');
  const [showAddResource, setShowAddResource] = useState<boolean>(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState<string>('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [showAddPoll, setShowAddPoll] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  useEffect(() => {
    // Safely access courseId from params
    if (!params) {
      router.push('/dashboard');
      return;
    }
    const courseId = params.courseId as string;
    if (!courseId) {
      router.push('/dashboard');
      return;
    }

    // Fetch course data asynchronously
    getCourseById(courseId).then((courseData) => {
      if (!courseData) {
        router.push('/dashboard');
        return;
      }
      setCourse(courseData);
    });

    setMessages(getChatMessages(courseId));
    setResources(getCourseResources(courseId));
    setPolls(getCoursePolls(courseId));
  }, [params, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !params) return;

    const courseId = params.courseId as string;
    
    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: user.email || 'Unknown',
      timestamp: new Date().toISOString(),
      courseId: courseId
    };

    addMessage(courseId, message);
    setMessages([...messages, message]);
    setNewMessage('');
    
    // Refocus input after sending
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  };

  const handleLeaveChat = () => {
    if (!params) return;
    const courseId = params.courseId as string;
    leaveCourse(courseId);
    router.push('/dashboard');
  };

  const handleAddResource = (e: FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim() || !user || !params) return;

    const courseId = params.courseId as string;
    const resource: Resource = {
      id: Date.now().toString(),
      title: newResourceTitle.trim(),
      url: newResourceUrl.trim(),
      description: newResourceDescription.trim() || undefined,
      addedBy: user.email || 'Unknown',
      timestamp: new Date().toISOString(),
      courseId: courseId
    };

    addCourseResource(courseId, resource);
    setResources([...resources, resource]);
    setNewResourceTitle('');
    setNewResourceUrl('');
    setNewResourceDescription('');
    setShowAddResource(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (!params) return;
    const courseId = params.courseId as string;
    deleteCourseResource(courseId, resourceId);
    setResources(resources.filter(r => r.id !== resourceId));
  };

  const handleAddPollOption = () => {
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePollOption = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const handleCreatePoll = (e: FormEvent) => {
    e.preventDefault();
    if (!newPollQuestion.trim() || !user || !params) return;
    
    const validOptions = newPollOptions.filter(opt => opt.trim()).map((opt, index) => ({
      id: `option_${Date.now()}_${index}`,
      text: opt.trim(),
      votes: [] as string[]
    }));

    if (validOptions.length < 2) {
      alert('Please add at least 2 options');
      return;
    }

    const courseId = params.courseId as string;
    const poll: Poll = {
      id: `poll_${Date.now()}`,
      question: newPollQuestion.trim(),
      options: validOptions,
      createdBy: user.email || 'Unknown',
      timestamp: new Date().toISOString(),
      courseId: courseId
    };

    addCoursePoll(courseId, poll);
    setPolls([...polls, poll]);
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
    setShowAddPoll(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (!user || !params) return;
    const courseId = params.courseId as string;
    voteOnPoll(courseId, pollId, optionId, user.email || '');
    
    // Reload polls from localStorage to get updated vote counts
    setPolls(getCoursePolls(courseId));
  };

  const handleDeletePoll = (pollId: string) => {
    if (!params) return;
    const courseId = params.courseId as string;
    deleteCoursePoll(courseId, pollId);
    setPolls(polls.filter(p => p.id !== pollId));
  };

  const getUserVote = (poll: Poll): string | null => {
    if (!user) return null;
    const userEmail = user.email;
    for (const option of poll.options) {
      if (option.votes.includes(userEmail || '')) {
        return option.id;
      }
    }
    return null;
  };

  const getTotalVotes = (poll: Poll): number => {
    return poll.options.reduce((total, option) => total + option.votes.length, 0);
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Leave Chat
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'resources'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📚 Resources
            </button>
            <button
              onClick={() => setActiveTab('polls')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'polls'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Polls
            </button>
          </div>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Leave Chat?</h3>
                <p className="text-sm text-gray-600">Are you sure you want to leave this course chat?</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You'll no longer have access to this chat. You can rejoin the course later if needed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveChat}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Leave Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'chat' ? (
            <>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-linear-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💬</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
                  <p className="text-gray-500 mb-4">Be the first to send a message in this course chat</p>
                  <p className="text-sm text-gray-400">Your messages will be saved automatically</p>
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
                            {formatMessageTime(message.timestamp)}
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
            </>
          ) : activeTab === 'resources' ? (
            /* Resources Tab */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Course Resources</h2>
                <button
                  onClick={() => setShowAddResource(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  + Add Resource
                </button>
              </div>

              {showAddResource && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <form onSubmit={handleAddResource} className="space-y-3">
                    <input
                      type="text"
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      placeholder="Resource title (e.g., 'Study Guide', 'Lecture Notes')"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <input
                      type="url"
                      value={newResourceUrl}
                      onChange={(e) => setNewResourceUrl(e.target.value)}
                      placeholder="URL (https://...)"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <textarea
                      value={newResourceDescription}
                      onChange={(e) => setNewResourceDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Add Resource
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddResource(false);
                          setNewResourceTitle('');
                          setNewResourceUrl('');
                          setNewResourceDescription('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {resources.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-linear-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📚</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                  <p className="text-gray-500 mb-4">Share helpful links, study materials, and resources with your classmates</p>
                  <button
                    onClick={() => setShowAddResource(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add First Resource
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              {resource.title}
                            </a>
                            <span className="text-xs text-gray-500">🔗</span>
                          </div>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Added by {resource.addedBy.split('@')[0]}</span>
                            <span>•</span>
                            <span>{formatMessageTime(resource.timestamp)}</span>
                          </div>
                        </div>
                        {(user?.email === resource.addedBy) && (
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Polls Tab */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Course Polls</h2>
                <button
                  onClick={() => setShowAddPoll(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  + Create Poll
                </button>
              </div>

              {showAddPoll && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <form onSubmit={handleCreatePoll} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Poll Question
                      </label>
                      <input
                        type="text"
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        placeholder="e.g., What time works best for study sessions?"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (at least 2 required)
                      </label>
                      <div className="space-y-2">
                        {newPollOptions.map((option, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleUpdatePollOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              required={index < 2}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {newPollOptions.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePollOption(index)}
                                className="px-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPollOption}
                        className="mt-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        + Add Option
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Create Poll
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPoll(false);
                          setNewPollQuestion('');
                          setNewPollOptions(['', '']);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {polls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-linear-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
                  <p className="text-gray-500 mb-4">Create polls to get quick feedback from your classmates</p>
                  <button
                    onClick={() => setShowAddPoll(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create First Poll
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {polls.map((poll) => {
                    const userVote = getUserVote(poll);
                    const totalVotes = getTotalVotes(poll);
                    
                    return (
                      <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.question}</h3>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created by {poll.createdBy.split('@')[0]}</span>
                              <span>•</span>
                              <span>{formatMessageTime(poll.timestamp)}</span>
                              <span>•</span>
                              <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                            </div>
                          </div>
                          {(user?.email === poll.createdBy) && (
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {poll.options.map((option) => {
                            const voteCount = option.votes.length;
                            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                            const isSelected = userVote === option.id;
                            
                            return (
                              <div key={option.id} className="relative">
                                <button
                                  onClick={() => handleVote(poll.id, option.id)}
                                  disabled={!!userVote}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : userVote
                                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                      {option.text}
                                    </span>
                                    {userVote && (
                                      <span className="text-xs text-gray-500">
                                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percentage}%)
                                      </span>
                                    )}
                                  </div>
                                  {userVote && (
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </button>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <span className="text-blue-600 text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Input - Only show for Chat tab */}
      {activeTab === 'chat' && (
        <div className="bg-white border-t border-gray-200 px-4 py-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                autoFocus
                disabled={!user}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !user}
                className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
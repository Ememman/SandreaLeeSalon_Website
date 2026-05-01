import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/SideBar";
import {
  learningModulesAPI,
  leaderboardsAPI,
  handleApiError,
  staffSession,
  getCurrentUser,
  stylistsAPI, // Add this import
  staffUtils, // Add this import
} from "../services/api";

const LearningModules = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulesData, setModulesData] = useState({ modules: [] });
  const [leaderboardData, setLeaderboardData] = useState({
    topPerformers: [],
    currentUser: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleDetails, setShowModuleDetails] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResults, setQuizResults] = useState(null);

  // NEW: Staff data state
  const [staffData, setStaffData] = useState([]);
  const [availableStylists, setAvailableStylists] = useState([]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get current staff session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setGreeting(getGreeting());
        } else {
          const session = await staffSession.getStaffSession();
          if (session.isValid) {
            setCurrentUser(session.user);
            setGreeting(getGreeting());
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // NEW: Fetch staff/salon employees data
  const fetchStaffData = async () => {
    try {
      console.log("👥 Fetching staff data...");

      // Fetch all stylists/salon staff
      const staffResponse = await stylistsAPI.getAll();
      if (staffResponse.data?.success) {
        const formattedStaff = staffResponse.data.data.map((staff) =>
          staffUtils.formatStaffData(staff)
        );
        setStaffData(formattedStaff);
        console.log(
          "✅ Staff data loaded:",
          formattedStaff.length,
          "staff members"
        );
      }

      // Fetch available stylists
      const availableResponse = await stylistsAPI.getAvailable();
      if (availableResponse.data?.success) {
        const formattedAvailable = availableResponse.data.data.map((staff) =>
          staffUtils.formatStaffData(staff)
        );
        setAvailableStylists(formattedAvailable);
        console.log("✅ Available stylists:", formattedAvailable.length);
      }
    } catch (error) {
      console.error("❌ Error fetching staff data:", error);
      // Set fallback empty arrays
      setStaffData([]);
      setAvailableStylists([]);
    }
  };

  // Real-time data fetching for current employee
  const fetchLearningData = async (isRefresh = false) => {
    if (!currentUser) return;

    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(true);
      setError(null);

      console.log("🔄 Fetching learning data for staff:", currentUser.id);

      // NEW: Fetch staff data alongside learning data
      const [modulesResponse, leaderboardResponse] = await Promise.all([
        learningModulesAPI.getUserDashboard(),
        leaderboardsAPI.getMyPerformance(),
      ]);

      // Process real API responses
      const modulesRawData =
        modulesResponse.data?.data || modulesResponse.data || {};
      const leaderboardRawData =
        leaderboardResponse.data?.data || leaderboardResponse.data || {};

      const processedModules = {
        modules: modulesRawData.modules || modulesRawData.progress || [],
        progress:
          modulesRawData.overallProgress || modulesRawData.progress || 0,
        completedCount:
          modulesRawData.completedCount || modulesRawData.completed || 0,
        inProgressCount:
          modulesRawData.inProgressCount || modulesRawData.inProgress || 0,
        totalModules: modulesRawData.totalModules || modulesRawData.total || 0,
        certificationCount:
          modulesRawData.certificationCount ||
          modulesRawData.certifications ||
          0,
      };

      const processedLeaderboard = {
        topPerformers: leaderboardRawData.topPerformers || [],
        currentUser: {
          rank: leaderboardRawData.myRank || leaderboardRawData.rank || 0,
          points: leaderboardRawData.myPoints || leaderboardRawData.points || 0,
          progress: leaderboardRawData.progress || 0,
        },
      };

      setModulesData(processedModules);
      setLeaderboardData(processedLeaderboard);

      // NEW: Fetch staff data
      await fetchStaffData();

      setLastUpdated(new Date());

      console.log("✅ Learning data loaded for staff:", {
        modules: processedModules.modules.length,
        progress: processedModules.progress,
        staff: staffData.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Error fetching learning data:", err);
      setError(handleApiError(err).message || "Failed to load learning data");

      // Set minimal fallback data
      setModulesData({
        modules: [],
        progress: 0,
        completedCount: 0,
        inProgressCount: 0,
        totalModules: 0,
        certificationCount: 0,
      });
      setLeaderboardData({
        topPerformers: [],
        currentUser: null,
      });
      setStaffData([]);
      setAvailableStylists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (currentUser) {
      fetchLearningData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        fetchLearningData(true);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleRefresh = () => {
    fetchLearningData(true);
  };

  // NEW: Enhanced staff-related functions
  const getStaffStats = () => {
    const totalStaff = staffData.length;
    const availableStaff = availableStylists.length;
    const busyStaff = totalStaff - availableStaff;

    return {
      totalStaff,
      availableStaff,
      busyStaff,
      availabilityRate:
        totalStaff > 0 ? Math.round((availableStaff / totalStaff) * 100) : 0,
    };
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = minutes / 60;
      return hours === 1 ? "1hr" : `${hours}hr`;
    }
  };

  const categories = [
    { id: "all", name: "All Courses", count: modulesData.modules?.length || 0 },
    {
      id: "coloring",
      name: "Coloring",
      count:
        modulesData.modules?.filter((m) => m.category === "coloring").length ||
        0,
    },
    {
      id: "cutting",
      name: "Cutting",
      count:
        modulesData.modules?.filter((m) => m.category === "cutting").length ||
        0,
    },
    {
      id: "safety",
      name: "Safety",
      count:
        modulesData.modules?.filter((m) => m.category === "safety").length || 0,
    },
    {
      id: "business",
      name: "Business",
      count:
        modulesData.modules?.filter((m) => m.category === "business").length ||
        0,
    },
  ];

  const filteredModules =
    activeCategory === "all"
      ? modulesData.modules || []
      : (modulesData.modules || []).filter(
          (module) => module.category === activeCategory
        );

  // Module Content Viewing - ENHANCED with Training.tsx patterns
  const handleViewModule = (module) => {
    setSelectedModule(module);
    setShowModuleDetails(true);
  };

  // ENHANCED: Module press handler following Training.tsx pattern
  const handleModulePress = async (module) => {
    try {
      console.log("📱 Navigating to module:", module.id);

      // Ensure user is enrolled in the module (from Training.tsx)
      if (!module.userProgress) {
        try {
          const enrollResponse = await learningModulesAPI.enroll(module._id);
          if (enrollResponse.success) {
            console.log("✅ Enrolled in module:", module.title);
          }
        } catch (enrollError) {
          console.log("Enrollment might already exist:", enrollError);
        }
      }

      // Enhanced parameter validation (from Training.tsx)
      const safeParams = {
        moduleId: module.id || "",
        moduleTitle: module.title || "Untitled Module",
        moduleDescription: module.description || "No description available",
        moduleCategory: module.category || "General",
        moduleInstructor: JSON.stringify(
          module.instructor || {
            name: "SandreaLee Admin",
            bio: "Professional beauty education",
            profileImage: "",
            credentials: [],
          }
        ),
        moduleCoverImage: getSafeImageUrl(module.coverImage),
        moduleDuration: (
          module.estimatedDuration ||
          module.duration ||
          60
        ).toString(),
        moduleDifficulty: module.difficulty || "beginner",
        moduleHasQuiz: module.hasQuiz ? "true" : "false",
        moduleRequirements: JSON.stringify(module.requirements || []),
        moduleLearningObjectives: JSON.stringify(
          module.learningObjectives || []
        ),
        moduleProgress: (module.progress || 0).toString(),
        moduleYoutubeVideos: JSON.stringify(module.youtubeVideos || []),
        moduleResources: JSON.stringify(module.resources || []),
        moduleStatus: module.status || "not-started",
        moduleQuiz: JSON.stringify(module.quiz || {}),
        moduleQuizAnalytics: JSON.stringify(module.quizAnalytics || {}),
      };

      console.log("🚀 Navigating with enhanced parameters");

      // Set module for details view
      setSelectedModule(module);
      setShowModuleDetails(true);
    } catch (error) {
      console.error("Error accessing module:", error);
      // You might want to show a toast notification here
    }
  };

  // ENHANCED: Take quiz handler following ModuleDetail.tsx patterns
  const handleTakeQuiz = (module) => {
    setSelectedModule(module);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizResults(null);
    setShowQuiz(true);
  };

  // NEW: Helper function from Training.tsx for image URL validation
  const getSafeImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== "string") {
      return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    if (imageUrl.startsWith("/")) {
      return imageUrl;
    }

    return "https://via.placeholder.com/300x200/1a1f3a/ffffff?text=Module+Cover";
  };

  // ENHANCED: Quiz handlers following ModuleDetail.tsx patterns
  const handleAnswerSelect = (answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (selectedModule?.quiz?.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedModule?.quiz) return;

    let correctAnswers = 0;
    const results = selectedModule.quiz.questions.map((question, index) => {
      const isCorrect = userAnswers[index] === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        question: question.question,
        userAnswer: userAnswers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = Math.round(
      (correctAnswers / selectedModule.quiz.questions.length) * 100
    );
    const passed = score >= selectedModule.quiz.passingScore;

    setQuizResults({
      score,
      correctAnswers,
      totalQuestions: selectedModule.quiz.questions.length,
      passed,
      results,
    });

    // Submit results to API
    try {
      await learningModulesAPI.submitQuiz(selectedModule._id, {
        answers: userAnswers,
        score,
        passed,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const handleCloseQuiz = () => {
    setShowQuiz(false);
    setSelectedModule(null);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizResults(null);
    // Refresh data to update progress
    fetchLearningData(true);
  };

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    return match ? match[1] : null;
  };

  // Real-time progress animation effect
  useEffect(() => {
    const progressElements = document.querySelectorAll(".progress-bar");
    progressElements.forEach((element, index) => {
      setTimeout(() => {
        element.style.width = element.getAttribute("data-progress") + "%";
      }, index * 100);
    });
  }, [filteredModules]);

  // NEW: Staff stats
  const staffStats = getStaffStats();

  if (loading && !modulesData.modules?.length) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-6 lg:p-8">
        {/* Enhanced Header with Real-time Status and Staff Info */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {greeting}
                  {currentUser
                    ? `, ${currentUser.firstName || currentUser.username}!`
                    : "!"}
                </h1>
                {refreshing && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-sm">Live updating...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                Enhance your skills and track your learning progress
              </p>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Progress Overview with Real-time Stats - ENHANCED with Staff Info */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 mt-4 lg:mt-0">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {modulesData.completedCount || 0}
                  </div>
                  <div className="text-blue-300 text-sm">Completed</div>
                </div>
                <div className="h-12 w-px bg-blue-500/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {modulesData.totalModules || 0}
                  </div>
                  <div className="text-purple-300 text-sm">Total Courses</div>
                </div>
                <div className="h-12 w-px bg-blue-500/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {modulesData.progress || 0}%
                  </div>
                  <div className="text-green-300 text-sm">Overall Progress</div>
                </div>
                {/* NEW: Staff Availability */}
                <div className="h-12 w-px bg-blue-500/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {staffStats.availableStaff}/{staffStats.totalStaff}
                  </div>
                  <div className="text-yellow-300 text-sm">Staff Available</div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh Data">
                  <svg
                    className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-300">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    activeCategory === category.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }
                `}>
                {category.name}
                <span className="ml-2 px-1.5 py-0.5 bg-gray-800 rounded-full text-xs">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Learning Modules Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Your Learning Modules
              </h2>
              <span className="text-sm text-gray-400">
                {filteredModules.length} courses available
              </span>
            </div>

            <div className="space-y-6">
              {filteredModules.map((module) => (
                <div
                  key={module._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 group">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {module.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`
                            px-2 py-1 rounded-full text-xs font-bold
                            ${
                              module.level === "Advanced"
                                ? "bg-red-500/20 text-red-400"
                                : module.level === "Intermediate"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }
                          `}>
                            {module.level}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        By {module.instructor}
                      </p>
                      <p className="text-gray-300 text-sm mb-3">
                        {module.description}
                      </p>
                    </div>

                    {/* Rating Stars */}
                    <div className="flex items-center space-x-1">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(module.rating || 5))}
                        {"☆".repeat(5 - Math.floor(module.rating || 5))}
                      </div>
                      <span className="text-gray-400 text-sm ml-1">
                        ({module.rating})
                      </span>
                    </div>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Your Progress</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400">
                          {module.progress || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="progress-bar bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        data-progress={module.progress || 0}
                        style={{ width: "0%" }}></div>
                    </div>
                  </div>

                  {/* Module Resources */}
                  {(module.youtubeVideos?.length > 0 ||
                    module.resources?.length > 0) && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                        <span>Resources:</span>
                        {module.youtubeVideos?.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <span>🎥</span>
                            <span>{module.youtubeVideos.length} videos</span>
                          </span>
                        )}
                        {module.resources?.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <span>📚</span>
                            <span>{module.resources.length} materials</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Module Info and Actions */}
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>{formatDuration(module.duration || 480)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>👥</span>
                        <span>{module.enrolled || 0} enrolled</span>
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleModulePress(module)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                        View Content
                      </button>
                      {module.quiz?.isEnabled && (
                        <button
                          onClick={() => handleTakeQuiz(module)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                          Take Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredModules.length === 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📚</span>
                  </div>
                  <p className="text-gray-400 text-lg">No courses found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    No courses available in this category
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar with Leaderboard and Staff Information */}
          <div className="space-y-8">
            {/* Enhanced Leaderboard Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Learning Leaderboard
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Live</span>
                </div>
              </div>

              <div className="space-y-3">
                {leaderboardData.topPerformers?.map((user, index) => (
                  <div
                    key={user._id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      user.isCurrentUser
                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30"
                        : "bg-gray-700/30 hover:bg-gray-700/50"
                    }`}>
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          index === 0
                            ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/25"
                            : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                            ? "bg-amber-700 text-white"
                            : "bg-gray-600 text-white"
                        }`}>
                        {index + 1}
                      </div>

                      {/* User Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {user.name} {user.isCurrentUser && "(You)"}
                          </span>
                          {user.isCurrentUser && (
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{user.points || 0} Points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!leaderboardData.topPerformers ||
                  leaderboardData.topPerformers.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">🏆</span>
                    </div>
                    <p className="text-gray-400">
                      No leaderboard data available
                    </p>
                  </div>
                )}
              </div>

              {/* Current User Stats */}
              {leaderboardData.currentUser && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Your Position</p>
                    <p className="text-2xl font-bold text-white">
                      #{leaderboardData.currentUser.rank}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {leaderboardData.currentUser.points} Total Points
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            leaderboardData.currentUser.progress || 0
                          }%`,
                        }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NEW: Staff Availability Section */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">
                Salon Staff Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Staff</span>
                  <span className="text-yellow-400 font-semibold">
                    {staffStats.totalStaff}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Available Now</span>
                  <span className="text-green-400 font-semibold">
                    {staffStats.availableStaff}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Currently Busy</span>
                  <span className="text-red-400 font-semibold">
                    {staffStats.busyStaff}
                  </span>
                </div>
                <div className="pt-3 border-t border-yellow-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Availability Rate</span>
                    <span className="text-orange-400 font-semibold">
                      {staffStats.availabilityRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Staff List */}
              {availableStylists.length > 0 && (
                <div className="mt-4 pt-4 border-t border-yellow-500/30">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Available Staff:
                  </h4>
                  <div className="space-y-2">
                    {availableStylists.slice(0, 3).map((staff) => (
                      <div key={staff.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                          {staff.initials}
                        </div>
                        <span className="text-white text-sm">
                          {staff.displayName}
                        </span>
                        <span className="text-green-400 text-xs ml-auto">
                          Available
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Stats Card */}
            <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">
                Your Learning Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Weekly Progress</span>
                  <span className="text-green-400 font-semibold">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg. Completion Time</span>
                  <span className="text-blue-400 font-semibold">3.2 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Certificates Earned</span>
                  <span className="text-yellow-400 font-semibold">
                    {modulesData.certificationCount || 0}
                  </span>
                </div>
                <div className="pt-3 border-t border-green-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-purple-400 font-semibold">
                      {modulesData.progress || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCED: Module Details Modal following Training.tsx and ModuleDetail.tsx patterns */}
        {showModuleDetails && selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📚</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedModule.title}
                    </h2>
                    <p className="text-gray-400">{selectedModule.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModuleDetails(false)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Enhanced Module Header with Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <div className="bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">
                        About This Module
                      </h3>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {selectedModule.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h4 className="text-white font-semibold mb-2">
                        Your Progress
                      </h4>
                      <div className="w-full bg-gray-600 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                          style={{
                            width: `${selectedModule.progress || 0}%`,
                          }}></div>
                      </div>
                      <p className="text-gray-300 text-sm mt-2 text-center">
                        {selectedModule.progress || 0}% Complete
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <h4 className="text-white font-semibold mb-2">
                        Module Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white">
                            {formatDuration(selectedModule.duration || 480)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Difficulty:</span>
                          <span className="text-white">
                            {selectedModule.level}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Instructor:</span>
                          <span className="text-white">
                            {selectedModule.instructor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Content Sections following ModuleDetail.tsx patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* YouTube Videos Section */}
                  {selectedModule.youtubeVideos?.length > 0 && (
                    <div className="bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="mr-2">🎥</span>
                        Video Content ({selectedModule.youtubeVideos.length})
                      </h3>
                      <div className="space-y-4">
                        {selectedModule.youtubeVideos.map((video, index) => (
                          <div
                            key={index}
                            className="bg-gray-600/50 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                            <div className="flex items-start space-x-4">
                              <div className="w-16 h-12 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-white">▶</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-1">
                                  {video.title}
                                </h4>
                                {video.description && (
                                  <p className="text-gray-400 text-sm">
                                    {video.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Materials Section */}
                  {selectedModule.resources?.length > 0 && (
                    <div className="bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="mr-2">📚</span>
                        Learning Materials ({selectedModule.resources.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedModule.resources.map((resource, index) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-600/50 rounded-lg hover:bg-gray-600 transition-colors group">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-lg">📄</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                                {resource.title}
                              </h4>
                              {resource.description && (
                                <p className="text-gray-400 text-sm">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                            <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quiz Section - Enhanced with ModuleDetail.tsx patterns */}
                {selectedModule.quiz?.isEnabled && (
                  <div className="mt-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white flex items-center">
                          <span className="mr-2">🧠</span>
                          Module Assessment
                        </h3>
                        <p className="text-gray-300">
                          Test your knowledge with this module's quiz
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <span>⭐</span>
                        <span className="font-semibold">
                          {selectedModule.quiz.passingScore}% to pass
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedModule.quiz.questions?.length || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedModule.quiz.timeLimit}
                        </div>
                        <div className="text-gray-400 text-sm">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedModule.quiz.maxAttempts}
                        </div>
                        <div className="text-gray-400 text-sm">Attempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedModule.quiz.totalPoints || 100}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Total Points
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowModuleDetails(false);
                          handleTakeQuiz(selectedModule);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                        <span>🚀</span>
                        <span>Start Quiz</span>
                      </button>
                      <button
                        onClick={() => setShowModuleDetails(false)}
                        className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                        Review First
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quiz Modal - Enhanced with ModuleDetail.tsx patterns */}
        {showQuiz && selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">🧠</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedModule.quiz?.title ||
                        `${selectedModule.title} Quiz`}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Question {currentQuestion + 1} of{" "}
                      {selectedModule.quiz.questions.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseQuiz}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {!quizResults ? (
                  <>
                    {/* Quiz Progress */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>
                          Question {currentQuestion + 1} of{" "}
                          {selectedModule.quiz.questions.length}
                        </span>
                        <span>
                          {Math.round(
                            ((currentQuestion + 1) /
                              selectedModule.quiz.questions.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              ((currentQuestion + 1) /
                                selectedModule.quiz.questions.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Current Question */}
                    {selectedModule.quiz.questions[currentQuestion] && (
                      <div className="space-y-6">
                        <div className="bg-gray-700/50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            {
                              selectedModule.quiz.questions[currentQuestion]
                                .question
                            }
                          </h3>

                          {selectedModule.quiz.questions[currentQuestion]
                            .questionType === "multiple-choice" && (
                            <div className="space-y-3">
                              {selectedModule.quiz.questions[
                                currentQuestion
                              ].options.map((option, index) => (
                                <label
                                  key={index}
                                  className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors">
                                  <input
                                    type="radio"
                                    name="quizAnswer"
                                    value={option.id}
                                    checked={
                                      userAnswers[currentQuestion] === option.id
                                    }
                                    onChange={() =>
                                      handleAnswerSelect(option.id)
                                    }
                                    className="rounded-full border-gray-400 text-blue-500 focus:ring-blue-500"
                                  />
                                  <span className="text-white flex-1">
                                    {option.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}

                          {selectedModule.quiz.questions[currentQuestion]
                            .questionType === "true-false" && (
                            <div className="grid grid-cols-2 gap-4">
                              <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="quizAnswer"
                                  value="true"
                                  checked={
                                    userAnswers[currentQuestion] === "true"
                                  }
                                  onChange={() => handleAnswerSelect("true")}
                                  className="rounded-full border-gray-400 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-white">True</span>
                              </label>
                              <label className="flex items-center space-x-3 p-4 border border-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="quizAnswer"
                                  value="false"
                                  checked={
                                    userAnswers[currentQuestion] === "false"
                                  }
                                  onChange={() => handleAnswerSelect("false")}
                                  className="rounded-full border-gray-400 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-white">False</span>
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4 border-t border-gray-700">
                          <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestion === 0}
                            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Previous
                          </button>

                          {currentQuestion ===
                          selectedModule.quiz.questions.length - 1 ? (
                            <button
                              onClick={handleSubmitQuiz}
                              disabled={
                                userAnswers.length !==
                                selectedModule.quiz.questions.length
                              }
                              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105">
                              Submit Quiz
                            </button>
                          ) : (
                            <button
                              onClick={handleNextQuestion}
                              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                              Next Question
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Enhanced Quiz Results following ModuleDetail.tsx patterns */
                  <div className="text-center">
                    <div
                      className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                        quizResults.passed
                          ? "bg-green-500/20 border-2 border-green-500"
                          : "bg-red-500/20 border-2 border-red-500"
                      }`}>
                      {quizResults.passed ? (
                        <svg
                          className="w-10 h-10 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-10 h-10 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {quizResults.passed ? "Quiz Passed! 🎉" : "Quiz Failed"}
                    </h3>
                    <p className="text-gray-300 mb-6 text-lg">
                      You scored{" "}
                      <span className="font-bold text-2xl text-white">
                        {quizResults.score}%
                      </span>{" "}
                      ({quizResults.correctAnswers} out of{" "}
                      {quizResults.totalQuestions} correct)
                    </p>

                    {/* Enhanced Results Breakdown */}
                    <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
                      <h4 className="text-white font-semibold mb-4 text-lg">
                        Question Review
                      </h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {quizResults.results.map((result, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 ${
                              result.isCorrect
                                ? "border-green-500/30 bg-green-500/10"
                                : "border-red-500/30 bg-red-500/10"
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-white font-medium">
                                Q{index + 1}: {result.question}
                              </span>
                              <span
                                className={`text-xs px-3 py-1 rounded-full ${
                                  result.isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }`}>
                                {result.isCorrect ? "Correct" : "Incorrect"}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="text-gray-400">
                                Your answer:{" "}
                                <span className="text-white">
                                  {result.userAnswer || "Not answered"}
                                </span>
                              </p>
                              {!result.isCorrect && (
                                <p className="text-gray-400">
                                  Correct answer:{" "}
                                  <span className="text-green-400">
                                    {result.correctAnswer}
                                  </span>
                                </p>
                              )}
                              {result.explanation && (
                                <p className="text-blue-400 mt-2">
                                  💡 {result.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleCloseQuiz}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                        Close
                      </button>
                      {!quizResults.passed &&
                        selectedModule.quiz.allowRetakes && (
                          <button
                            onClick={() => {
                              setQuizResults(null);
                              setCurrentQuestion(0);
                              setUserAnswers([]);
                            }}
                            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105">
                            Retry Quiz
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status Footer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <span>•</span>
              <span>Auto-refresh every 30 seconds</span>
              <span>•</span>
              <span>
                Last sync:{" "}
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
              </span>
              {/* NEW: Staff status in footer */}
              <span>•</span>
              <span>
                Staff: {staffStats.availableStaff}/{staffStats.totalStaff}{" "}
                available
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-50">
              {refreshing ? "Refreshing..." : "Refresh Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningModules;

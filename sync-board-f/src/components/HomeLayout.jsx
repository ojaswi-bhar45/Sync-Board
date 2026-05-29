import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Menu, Grid3x3, PlusSquare, User, MessageSquare } from 'lucide-react';
import Sidebar from './Sidebar';
import Feed from '../pages/Feed';
import CreateProject from '../pages/CreateProject';
import Workspace from './Workspace';
import Profile from './Profile';
import ChatPanel from './ChatPanel';
import ToastContainer from './Toast';
import ProjectsList from './ProjectsList';

export default function HomeLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('feed');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [feedSubView, setFeedSubView] = useState(null);
  const [chatProjectId, setChatProjectId] = useState(null);
  const [chatProjectName, setChatProjectName] = useState('');

  const handleStartChat = (projectId, projectName) => {
    setChatProjectId(projectId);
    setChatProjectName(projectName || '');
    setChatOpen(true);
  };

  const handleChatClose = () => {
    setChatProjectId(null);
    setChatProjectName('');
    setChatOpen(false);
  };

  const openProject = (project) => {
    setSelectedProject(project);
    setActiveView('workspace');
  };

  const handleNavigate = (view, project, subView) => {
    if (view === 'projects' && project) {
      setSelectedProject(project);
      setChatProjectId(project._id);
      setChatProjectName(project.title || '');
      setActiveView('workspace');
    } else if (view === 'workspace' && project) {
      setSelectedProject(project);
      setChatProjectId(project._id);
      setChatProjectName(project.title || '');
      setActiveView('workspace');
    } else if (view === 'canvas') {
      setSelectedProject(null);
      setChatProjectId(null);
      setChatProjectName('');
      setActiveView('projects');
    } else if (view !== 'workspace') {
      setSelectedProject(null);
      setChatProjectId(null);
      setChatProjectName('');
      setActiveView(view);
    } else {
      setActiveView(view);
    }
    if (subView) setFeedSubView(subView);
    else setFeedSubView(null);
    setSidebarOpen(false);
  };

  const activeViewForSidebar =
    activeView === 'workspace' ? 'canvas' :
    activeView === 'projects' ? 'canvas' :
    activeView === 'feed' ? 'feed' :
    activeView === 'create' ? 'create' :
    activeView === 'profile' ? 'profile' : activeView;

  return (
    <>
      <ToastContainer />
      <div className="app-container">
        <Sidebar
          toggleTheme={toggleTheme}
          theme={theme}
          onNavigate={handleNavigate}
          activeView={activeViewForSidebar}
          activeSubView={feedSubView}
          user={user}
          onLogout={logout}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        <div className="main-content">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/5 md:hidden">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-white">SyncBoard</span>
          </div>
          {activeView === 'feed' && (
            <Feed
              onNavigate={handleNavigate}
              initialSubView={feedSubView}
              clearSubView={() => setFeedSubView(null)}
              onStartChat={handleStartChat}
            />
          )}
          {activeView === 'create' && <CreateProject onNavigate={handleNavigate} />}
          {activeView === 'profile' && <Profile />}
          {activeView === 'projects' && (
            <ProjectsList
              onNavigate={handleNavigate}
              onStartChat={handleStartChat}
            />
          )}
          {activeView === 'workspace' && <Workspace project={selectedProject} />}
          {activeView !== 'create' && activeView !== 'workspace' && (
            <ChatPanel
              projectId={chatProjectId}
              projectName={chatProjectName}
              isOpen={chatOpen}
              setIsOpen={setChatOpen}
              onClose={handleChatClose}
            />
          )}

          {/* ─── Mobile Bottom Tab Bar ─── */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around h-14 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)] backdrop-blur-xl bg-opacity-90">
            {[
              { view: 'feed', icon: Grid3x3, label: 'Feed' },
              { view: 'create', icon: PlusSquare, label: 'New' },
              { view: 'profile', icon: User, label: 'Profile' },
            ].map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => handleNavigate(view)}
                className={`flex flex-col items-center justify-center gap-0.5 h-full px-4 transition-colors ${
                  activeView === view ? 'text-[var(--accent-color)]' : 'text-gray-500'
                }`}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-4 transition-colors ${
                chatOpen ? 'text-[var(--accent-color)]' : 'text-gray-500'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <MessageSquare size={20} />
              <span className="text-[10px] font-medium">Chat</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

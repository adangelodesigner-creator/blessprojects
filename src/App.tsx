import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import * as db from './services/db';
import { invalidateUidCache } from './services/db';
import { readLocalSnapshot, readLocalSnapshotFrom } from './lib/migrateLocal';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Finances } from './components/Finances';
import { ProjectDetails } from './components/ProjectDetails';
import { Settings } from './components/Settings';
import { AppToaster } from './components/Toaster';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarView } from './components/CalendarView';
import { AdminPanel } from './components/AdminPanel';

import { ProjectModal, TaskModal } from './components/Modals';
import type { Project, Task, SubTask, Invoice, Settings as SettingsType, TaskStatus, TaskPriority, ProjectStatus, Profile } from './types';
import confetti from 'canvas-confetti';
import { initGCal, isGCalConnected, connectGCal, disconnectGCal, syncTaskToCalendar, removeTaskFromCalendar } from './services/googleCalendar';



const DEFAULT_SETTINGS: SettingsType = {
  googleCalendarUrl: 'https://calendar.google.com/calendar/embed?src=adangelodesigner%40gmail.com&ctz=America%2FCaracas',
};

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { user, loading: authLoading, signIn, signOut, resetPassword } = useAuth();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('gp_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('gp_theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const [gcalConnected, setGCalConnected] = useState(false);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    initGCal();
    const check = () => setGCalConnected(isGCalConnected());
    check();
    const iv = setInterval(check, 30000);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(iv); window.removeEventListener('focus', onFocus); };
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('gp_sidebar') === 'collapsed');
  const toggleCollapse = () => setSidebarCollapsed((prev) => {
    const next = !prev;
    localStorage.setItem('gp_sidebar', next ? 'collapsed' : 'expanded');
    return next;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currentTab, setTab] = useState<NavTab>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>(() => readCache('gp_projects', []));
  const [tasks, setTasks] = useState<Task[]>(() => readCache('gp_tasks', []));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SettingsType>(() => readCache('gp_settings', DEFAULT_SETTINGS));

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [connectionOk, setConnectionOk] = useState(true);
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const refetchAll = async () => {
    try {
      const data = await db.fetchAllData();
      const cloudEmpty = data.projects.length === 0 && data.tasks.length === 0;
      const local = readLocalSnapshot();
      const hasLocal = local.projects.length > 0 || local.tasks.length > 0;
      const alreadyAsked = localStorage.getItem('gp_migrated') === '1';

      if (cloudEmpty && hasLocal && !alreadyAsked) {
        const ok = confirm(
          `Detectamos ${local.projects.length} proyecto(s) y ${local.tasks.length} tarea(s) ` +
          `guardados en este dispositivo. ¿Importarlos a la nube?`,
        );
        localStorage.setItem('gp_migrated', '1');
        if (ok) {
          await db.bulkInsert(local);
          const fresh = await db.fetchAllData();
          setProjects(fresh.projects);
          setTasks(fresh.tasks);
          if (fresh.settings) setSettings(fresh.settings);
          return;
        }
      }

      setConnectionOk(data.connectionOk);
      setInvoices(data.invoices);
      setProjects(data.projects);
      setTasks(data.tasks);
      if (data.settings) setSettings(data.settings);
      setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Error cargando datos', e);
    }
  };

  useEffect(() => {
    invalidateUidCache();
    if (!isSupabaseConfigured || !user) return;
    refetchAll();
    db.fetchProfiles().then((p) => {
      setProfiles(p);
      const me = p.find((pr) => pr.id === user.id);
      setIsAdmin(me?.role === 'admin');
      setCurrentProfile(me ?? null);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    document.body.classList.remove('user-aranza');
    if (currentProfile?.displayName === 'Aranza') {
      document.body.classList.add('user-aranza');
    }
  }, [currentProfile]);

  const isAranza = currentProfile?.displayName === 'Aranza';

  useEffect(() => { localStorage.setItem('gp_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('gp_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('gp_settings', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { refetchAll(); }, 300);
    };

    const channel = supabase
      .channel('gp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, debouncedRefetch)
      .subscribe();

    const onFocus = () => { if (document.visibilityState === 'visible') refetchAll(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ==========================================
  // PROJECT OPERATIONS
  // ==========================================
  const handleDbError = (e: unknown) => {
    console.error('DB error, syncing from cloud:', e);
    setTimeout(() => refetchAll(), 500);
  };

  const handleSaveProject = async (projectData: {
    name: string; description: string; color: string;
    client: string; status: ProjectStatus; startDate: string; dueDate: string;
  }) => {
    if (editingProject) {
      const updated: Project = { ...editingProject, ...projectData };
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProject(null);
      try { await db.upsertProject(updated); } catch (e) { handleDbError(e); }
    } else {
      const newProj: Project = {
        id: crypto.randomUUID(),
        ...projectData,
        notes: '', links: [], objectives: [], sharedWith: [],
        userId: user?.id ?? '',
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      setTab('project');
      try { await db.upsertProject(newProj); } catch (e) { handleDbError(e); }
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try { await db.upsertProject(updated); } catch (e) { handleDbError(e); }
  };

  const handleDeleteProject = async () => {
    if (!activeProjectId) return;
    const id = activeProjectId;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setActiveProjectId(null);
    setTab('dashboard');
    try { await db.deleteProjectCascade(id); } catch (e) { handleDbError(e); }
  };

  // ==========================================
  // TASK OPERATIONS
  // ==========================================
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
    subtasks: SubTask[];
  }) => {
    if (!activeProjectId) return;
    if (editingTask) {
      const isNowDone = taskData.status === 'done' && editingTask.status !== 'done';
      const updated: Task = { ...editingTask, ...taskData };
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
      if (isNowDone) triggerSuccessConfetti();
      try { await db.upsertTask(updated); } catch (e) { handleDbError(e); }
      syncTaskToCalendar(updated);
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(), projectId: activeProjectId, ...taskData,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      if (newTask.status === 'done') triggerSuccessConfetti();
      try { await db.upsertTask(newTask); } catch (e) { handleDbError(e); }
      syncTaskToCalendar(newTask);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingTask(null);
    removeTaskFromCalendar(taskId);
    try { await db.deleteTask(taskId); } catch (e) { handleDbError(e); }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;
    const wasDone = taskToMove.status === 'done';
    const updated: Task = { ...taskToMove, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (newStatus === 'done' && !wasDone) triggerSuccessConfetti();
    try { await db.upsertTask(updated); } catch (e) { handleDbError(e); }
    syncTaskToCalendar(updated);
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated: Task = {
      ...task,
      subtasks: task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s,
      ),
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    try { await db.upsertTask(updated); } catch (e) { handleDbError(e); }
  };

  const handleUpdateTask = async (updated: Task) => {
    const prevTask = tasks.find((t) => t.id === updated.id);
    const isNowDone = updated.status === 'done' && prevTask?.status !== 'done';
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (isNowDone) triggerSuccessConfetti();
    try { await db.upsertTask(updated); } catch (e) { handleDbError(e); }
    syncTaskToCalendar(updated);
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#F97316', '#FB923C', '#FDE68A', '#FFFFFF', '#22C55E'],
    });
  };

  const handleSaveInvoice = async (inv: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInv: Invoice = {
      ...inv, id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [...prev, newInv]);
    try { await db.upsertInvoice(newInv); } catch (e) { handleDbError(e); }
  };

  const handleUpdateInvoice = async (updated: Invoice) => {
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    try { await db.upsertInvoice(updated); } catch (e) { handleDbError(e); }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    try { await db.deleteInvoice(invoiceId); } catch (e) { handleDbError(e); }
  };

  // ==========================================
  // SYSTEM PREFERENCES & BACKUP
  // ==========================================
  const handleUpdateSettings = async (newSettings: SettingsType) => {
    setSettings(newSettings);
    try { await db.upsertSettings(newSettings); } catch (e) { handleDbError(e); }
  };

  const handleExportData = () => {
    const exportObj = {
      projects,
      tasks,
      settings,
      invoices,
      backupVersion: '1.0',
      exportedAt: new Date().toISOString(),
    };
    localStorage.setItem('lastBackupDate', new Date().toISOString());

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `blessprojects-respaldo-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object') throw new Error('El archivo no contiene un objeto JSON válido.');
      if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) throw new Error('Formato inválido: faltan projects o tasks.');
      if (parsed.backupVersion !== '1.0') throw new Error(`Versión de respaldo incompatible: ${parsed.backupVersion}.`);
      if (parsed.invoices !== undefined && (!Array.isArray(parsed.invoices) || !parsed.invoices.every((i: any) => i.id && i.projectId && i.month))) throw new Error('Formato inválido: invoices tienen estructura incorrecta.');
      const snap = readLocalSnapshotFrom(parsed);
      setProjects(snap.projects);
      setTasks(snap.tasks);
      
      if (snap.settings) setSettings(snap.settings);
      db.bulkInsert(snap).catch((e) => console.error('Error importando a la nube', e));
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!isSupabaseConfigured) {
    return (
      <div className="gp-flex-center" style={{ minHeight: '100vh', padding: '2rem', background: '#0B0B0F', color: '#EDEDEF' }}>
        <div className="gp-text-center" style={{ maxWidth: '400px' }}>
          <div className="gp-mb-4" style={{ fontSize: '2rem' }}>⚠️</div>
          <h1 className="gp-mb-2" style={{ fontSize: '1.2rem' }}>BlessProjects no está configurado</h1>
          <p style={{ color: '#868690', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Las variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) no están definidas o son inválidas.
          </p>
        </div>
      </div>
    );
  }
  if (authLoading) {
    return <div className="gp-flex-center" style={{ minHeight: '100vh', color: 'var(--gp-text-secondary)' }}>Cargando…</div>;
  }
  if (!user) {
    return <Login onSignIn={signIn} onReset={resetPassword} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        activeProjectId={activeProjectId}
        projects={projects}
        setTab={setTab}
        setActiveProjectId={setActiveProjectId}
        onAddProjectClick={() => {
          setEditingProject(null);
          setProjectModalOpen(true);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isAdmin={isAdmin}
      />

      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <button
          onClick={() => { if (!connectionOk) refetchAll(); }}
          title={connectionOk ? `Última sincronización: ${lastSyncTime || '—'}` : 'Sin conexión — haz clic para reconectar'}
          style={{
            position: 'fixed', top: '8px', right: '16px', zIndex: 100,
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '8px',
            background: connectionOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${connectionOk ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: '0.65rem', fontWeight: 600,
            color: connectionOk ? '#16a34a' : '#ef4444',
            cursor: connectionOk ? 'default' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: connectionOk ? '#22c55e' : '#ef4444',
            animation: connectionOk ? 'none' : 'pulse-glow 2s ease-in-out infinite',
          }} />
          {connectionOk ? `Sync ${lastSyncTime || ''}` : 'Sin conexión'}
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab + (activeProjectId || '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentTab === 'dashboard' && (
              <Dashboard
                projects={projects}
                tasks={tasks}
                onProjectSelect={(id) => {
                  setActiveProjectId(id);
                  setTab('project');
                }}
                onAddProjectClick={() => {
                  setEditingProject(null);
                  setProjectModalOpen(true);
                }}
                profiles={profiles}
                currentUserId={user?.id ?? ''}
                onUpdateProject={handleUpdateProject}
                isAdmin={isAdmin}
              />
            )}

            {currentTab === 'project' && activeProject && (
              <ProjectDetails
                project={activeProject}
                tasks={tasks}
                onAddRuleClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                onEditProject={() => {
                  setEditingProject(activeProject);
                  setProjectModalOpen(true);
                }}
                onDeleteProject={handleDeleteProject}
                onUpdateProject={handleUpdateProject}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onToggleSubtask={handleToggleSubtask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                profiles={profiles}
                currentUserId={user?.id ?? ''}
                isAdmin={isAdmin}
              />
            )}

            {currentTab === 'finances' && (
              <Finances
                projects={projects}
                invoices={invoices}
                onSaveInvoice={handleSaveInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {currentTab === 'admin' && isAdmin && (
              <AdminPanel
                projects={projects}
                onUpdateProject={handleUpdateProject}
                currentUserId={user?.id ?? ''}
              />
            )}

            {currentTab === 'clients' && (
              <Clients
                projects={projects}
                tasks={tasks}
                onProjectSelect={(id) => {
                  setActiveProjectId(id);
                  setTab('project');
                }}
                onAddProjectClick={() => {
                  setEditingProject(null);
                  setProjectModalOpen(true);
                }}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                projects={projects}
                tasks={tasks}
                onTaskClick={(task) => {
                  setEditingTask(task);
                  setActiveProjectId(task.projectId);
                  setTaskModalOpen(true);
                }}
                gcalConnected={gcalConnected}
                onGCalConnect={async () => { const ok = await connectGCal(); if (ok) setGCalConnected(true); }}
              />
            )}

            {currentTab === 'settings' && (
              <Settings
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onSignOut={signOut}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                gcalConnected={gcalConnected}
                onGCalConnect={async () => { const ok = await connectGCal(); if (ok) setGCalConnected(true); }}
                onGCalDisconnect={() => { disconnectGCal(); setGCalConnected(false); }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AppToaster />

      <div className="mobile-menu-btn-wrapper">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <BottomNav
        currentTab={currentTab}
        setTab={setTab}
        setActiveProjectId={setActiveProjectId}
        isAdmin={isAdmin}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {activeProjectId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setTaskModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          task={editingTask}
        />
      )}

      {isAranza && <div className="pink-particles" />}
    </div>
  );
}

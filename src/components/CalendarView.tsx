import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ExternalLink, LogIn } from 'lucide-react';
import type { Project, Task } from '../types';
import { fetchEvents } from '../services/googleCalendar';

interface CalendarViewProps {
  projects: Project[];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  gcalConnected: boolean;
  onGCalConnect: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  tasks,
  onTaskClick,
  gcalConnected,
  onGCalConnect,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'gcal'>('local');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (activeTab !== 'gcal' || !gcalConnected) return;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    fetchEvents(start.toISOString(), end.toISOString()).then(setGcalEvents);
  }, [activeTab, gcalConnected, year, month]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({ date: dayDate, isCurrentMonth: false, dayNum: prevMonthTotalDays - i });
    }
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(year, month, i);
      days.push({ date: dayDate, isCurrentMonth: true, dayNum: i });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({ date: dayDate, isCurrentMonth: false, dayNum: i });
    }
    return days;
  };

  const calendarDays = getDaysInMonth();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getTasksForDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    return tasks.filter((t) => t.dueDate === dateKey);
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.color : 'var(--gp-text-tertiary)';
  };

  const getGcalEventsForDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    return gcalEvents.filter((e: any) => {
      const start = e.start?.date || e.start?.dateTime?.split('T')[0] || '';
      return start === dateKey;
    });
  };

  const formatGcalTime = (event: any): string | null => {
    if (event.start?.dateTime) {
      const d = new Date(event.start.dateTime);
      return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  };

  return (
    <div>
      <h1 className="title-large">Calendario de Agenda</h1>
      <p className="subtitle">Visualiza tus fechas límite y eventos integrados.</p>

      <div className="view-toggle-container gp-inline-flex gp-mb-6">
        <button className={`view-toggle-btn ${activeTab === 'local' ? 'active' : ''}`}
          onClick={() => setActiveTab('local')}>
          <Calendar size={16} />
          <span>Mi Agenda (Tareas)</span>
        </button>
        <button className={`view-toggle-btn ${activeTab === 'gcal' ? 'active' : ''}`}
          onClick={() => setActiveTab('gcal')}>
          <ExternalLink size={16} />
          <span>Google Calendar</span>
        </button>
      </div>

      {activeTab === 'local' && (
        <div className="calendar-grid">
          <div className="calendar-header">
            <h2 className="calendar-month">{monthNames[month]} {year}</h2>
            <div className="gp-flex-center gp-gap-2">
              <button className="btn btn-ghost btn-sm" onClick={handleToday}>Hoy</button>
              <button className="btn btn-ghost btn-sm" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost btn-sm" onClick={handleNextMonth}><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="calendar-weekdays">
            <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, idx) => {
              const dayTasks = getTasksForDay(day.date);
              const isToday = formatDateKey(day.date) === formatDateKey(new Date());
              return (
                <div key={idx} className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isCurrentMonth ? 'hover-lift scale-in' : ''}`} style={day.isCurrentMonth ? { animationDelay: `${(idx % 7) * 0.03}s` } : undefined}>
                  <div>
                    <span className={`calendar-day-number ${isToday ? 'today' : ''}`}>{day.dayNum}</span>
                  </div>
                  <div className="calendar-day-events">
                    {dayTasks.map((task) => (
                      <div key={task.id}
                        onClick={() => onTaskClick(task)}
                        className={`calendar-task-chip ${task.status === 'done' ? 'done' : 'pending'}`}
                        style={{ borderLeftColor: getProjectColor(task.projectId) }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'gcal' && (
        <div>
          {!gcalConnected ? (
            <div className="gp-surface gp-border-line gp-rounded-md calendar-empty-state">
              <div className="empty-state-icon gp-mx-auto gp-mb-4">
                <LogIn size={24} />
              </div>
              <h3 className="gp-text-xl gp-font-bold gp-mb-2">
                Google Calendar no conectado
              </h3>
              <p className="empty-state-desc gp-mx-auto gp-mb-6">
                Conecta tu Google Calendar en Ajustes para ver tus eventos sincronizados aqui.
              </p>
              <button className="btn btn-primary" onClick={onGCalConnect}>
                Conectar Google Calendar
              </button>
            </div>
          ) : (
            <div className="calendar-grid">
              <div className="calendar-header">
                <h2 className="calendar-month">{monthNames[month]} {year}</h2>
                <div className="gp-flex-center gp-gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={handleToday}>Hoy</button>
                  <button className="btn btn-ghost btn-sm" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={handleNextMonth}><ChevronRight size={16} /></button>
                </div>
              </div>

              <div className="calendar-weekdays">
                <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
              </div>

              <div className="calendar-days">
                {calendarDays.map((day, idx) => {
                  const dayTasks = getTasksForDay(day.date);
                  const dayEvents = getGcalEventsForDay(day.date);
                  const isToday = formatDateKey(day.date) === formatDateKey(new Date());
                  return (
                    <div key={idx} className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isCurrentMonth ? 'hover-lift scale-in' : ''}`} style={day.isCurrentMonth ? { animationDelay: `${(idx % 7) * 0.03}s` } : undefined}>
                      <div>
                        <span className={`calendar-day-number ${isToday ? 'today' : ''}`}>{day.dayNum}</span>
                      </div>
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 2).map((ev: any, i: number) => {
                          const time = formatGcalTime(ev);
                          return (
                            <div key={i}
                              title={ev.summary}
                              className="gcal-event-chip"
                            >
                              {time && <span className="gcal-event-chip-time">{time} </span>}
                              {ev.summary}
                            </div>
                          );
                        })}
                        {dayTasks.slice(0, 3 - dayEvents.length).map((task) => (
                          <div key={task.id}
                            onClick={() => onTaskClick(task)}
                            className={`calendar-task-chip ${task.status === 'done' ? 'done' : 'pending'}`}
                            style={{ borderLeftColor: getProjectColor(task.projectId) }}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD format
  tags: string[];
  subtasks: SubTask[];
  createdAt: string;
}

export type ProjectStatus = 'active' | 'paused' | 'done';

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface ProjectObjective {
  id: string;
  text: string;
  done: boolean;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'brother';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color code
  client: string; // cliente/contacto ('' si no aplica)
  status: ProjectStatus;
  startDate: string; // '' o YYYY-MM-DD
  dueDate: string; // '' o YYYY-MM-DD
  notes: string; // brief/docs
  links: ProjectLink[];
  objectives: ProjectObjective[]; // metas marcables del proyecto
  userId: string; // owner UUID (maps to DB user_id)
  sharedWith: string[]; // UUIDs of users who can access this project
  createdAt: string;
}

export type InvoiceStatus = 'pendiente' | 'pagada';

export interface InvoiceLineItem {
  id: string;
  description: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  month: string; // YYYY-MM
  items: InvoiceLineItem[];
  total: number;
  status: InvoiceStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface Settings {
  googleCalendarUrl: string; // Google Calendar embed URL
}

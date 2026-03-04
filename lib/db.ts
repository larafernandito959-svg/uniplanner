const DB_NAME = 'uniplanner-pro'
const DB_VERSION = 1

export interface UserRecord {
  username: string
  passwordHash: string
  createdAt: string
}

export interface ScheduleClass {
  id: string
  userId: string
  name: string
  professor: string
  room: string
  dayOfWeek: number // 0=Monday, 6=Sunday
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  color: string
  weekType: 'both' | 'A' | 'B'
  semester: string
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  date: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
  type: 'class' | 'evaluation' | 'project' | 'task'
  domain: string
  description?: string
  linkedEvaluationId?: string
  linkedProjectId?: string
}

export interface Evaluation {
  id: string
  userId: string
  subject: string
  type: string
  date: string
  time?: string
  weight: number // percentage 0-100
  grade?: number
  maxGrade: number
  description?: string
}

export interface Project {
  id: string
  userId: string
  name: string
  subject?: string
  description?: string
  startDate: string
  dueDate: string
  status: 'planning' | 'in-progress' | 'review' | 'completed'
  stages: ProjectStage[]
  estimatedHours: number
  loggedHours: number
}

export interface ProjectStage {
  id: string
  name: string
  dueDate: string
  completed: boolean
}

export interface PomodoroSession {
  id: string
  userId: string
  date: string
  startedAt: string
  duration: number // minutes
  type: 'focus' | 'short-break' | 'long-break'
  completed: boolean
  subject?: string
}

export interface SpecialDate {
  id: string
  userId: string
  date: string // MM-DD
  title: string
  message: string
}

export interface UserSettings {
  userId: string
  scheduleStartHour: number
  scheduleEndHour: number
  pomodoroFocus: number
  pomodoroShort: number
  pomodoroLong: number
  currentSemester: string
  currentWeekType: 'A' | 'B'
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' })
      }
      if (!db.objectStoreNames.contains('scheduleClasses')) {
        const store = db.createObjectStore('scheduleClasses', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('calendarEvents')) {
        const store = db.createObjectStore('calendarEvents', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('date', 'date', { unique: false })
      }
      if (!db.objectStoreNames.contains('evaluations')) {
        const store = db.createObjectStore('evaluations', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('projects')) {
        const store = db.createObjectStore('projects', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('pomodoroSessions')) {
        const store = db.createObjectStore('pomodoroSessions', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('specialDates')) {
        const store = db.createObjectStore('specialDates', { keyPath: 'id' })
        store.createIndex('userId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'userId' })
      }
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
  const db = await openDB()
  const tx = db.transaction(storeName, mode)
  return { store: tx.objectStore(storeName), tx }
}

export const db = {
  async getAll<T>(storeName: string, userId?: string): Promise<T[]> {
    const { store } = await getStore(storeName)
    return new Promise((resolve, reject) => {
      if (userId) {
        const index = store.index('userId')
        const request = index.getAll(userId)
        request.onsuccess = () => resolve(request.result as T[])
        request.onerror = () => reject(request.error)
      } else {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result as T[])
        request.onerror = () => reject(request.error)
      }
    })
  },

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const { store } = await getStore(storeName)
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result as T | undefined)
      request.onerror = () => reject(request.error)
    })
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const { store } = await getStore(storeName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  async delete(storeName: string, key: string): Promise<void> {
    const { store } = await getStore(storeName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },

  async clear(storeName: string): Promise<void> {
    const { store } = await getStore(storeName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// Simple hash for local auth (not cryptographic - local only)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'uniplanner-salt-2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

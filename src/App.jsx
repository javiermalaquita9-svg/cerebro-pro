import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, Briefcase, Wallet, User, Users, Coffee, 
  Target, CheckCircle, Lightbulb, UserCheck, Plus, 
  ChevronRight, Calendar, BarChart2, Layout, List, 
  Flag, ArrowLeft, Filter, Search, MoreHorizontal,
  Flame, Check, Inbox, Rocket, Trash2, X, Info,
  FileText, Clock, PlayCircle, Hash, Edit2,
  TrendingUp, CalendarDays, ChevronDown, Folder, 
  File, Paperclip, MoreVertical, LayoutGrid, Quote, Timer,
  Link as LinkIcon, ExternalLink, Save, BookOpen, GraduationCap,
  Video, Share2, FileSpreadsheet, Search as SearchIcon,
  Clapperboard, FileType, AlertTriangle, TrendingDown, DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight, Settings,
  RotateCcw, Globe, Landmark, CreditCard, Building, PieChart
, Archive, MoveRight, LogOut, AtSign, KeyRound } from 'lucide-react';

import { useAuth } from './AuthContext';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// --- Constantes Globales ---
const ICON_MAP = { 
  Heart, Briefcase, Wallet, User, Users, Coffee, 
  Target, Lightbulb, Folder, BookOpen, GraduationCap, Rocket 
};

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const CAT_COLORS = {
  ingreso: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ArrowUpRight },
  egreso: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: ArrowDownRight },
  ahorro: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: PiggyBank }
};

const LINK_ICONS = { Globe, Landmark, CreditCard, Building, PieChart, Wallet, Briefcase };

// --- Subcomponentes Estáticos ---

// eslint-disable-next-line no-unused-vars
const SidebarButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
      active 
        ? 'bg-white text-slate-900 shadow-lg font-bold border border-slate-100' 
        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'
    }`}
  >
    <Icon size={18} />
    <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
  </button>
);

const AreaIcon = ({ name, ...props }) => {
  const Icon = ICON_MAP[name] || Folder;
  return <Icon {...props} />;
};

const LineChart = ({ data, weekDates }) => {
  const width = 800;
  const height = 180;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxVal = Math.max(...data, 1); 
  
  const points = data.map((val, i) => {
    const x = padding + (i * (chartWidth / (data.length - 1)));
    const y = height - padding - (val * (chartHeight / maxVal));
    return `${x},${y}`;
  }).join(' ');

  const dateRangeStr = weekDates && weekDates.length === 7 
    ? `Semana del ${weekDates[0].dayNum} ${weekDates[0].month} al ${weekDates[6].dayNum} ${weekDates[6].month}`
    : '';

  return (
    <div className="w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> Rendimiento Semanal
          </h4>
          {dateRangeStr && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {dateRangeStr}
            </p>
          )}
        </div>
        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
          Visión Gráfica
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <polyline 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          points={points} 
        />
        {data.map((val, i) => {
          const x = padding + (i * (chartWidth / (data.length - 1)));
          const y = height - padding - (val * (chartHeight / maxVal));
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="white" stroke="#3b82f6" strokeWidth="3" />
              <text x={x} y={height - 22} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="800" className="uppercase">
                {weekDates[i]?.label || ''}
              </text>
              <text x={x} y={height - 8} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="600">
                {weekDates[i] ? `${weekDates[i].dayNum} ${weekDates[i].month}` : ''}
              </text>
              <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="bold">
                {val > 0 ? val : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- Componente de Login ---
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No se encontró un usuario con ese correo.');
          break;
        case 'auth/wrong-password':
          setError('La contraseña es incorrecta.');
          break;
        case 'auth/email-already-in-use':
          setError('El correo electrónico ya está en uso.');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres.');
          break;
        default:
          setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 font-sans">
      <div className="w-full max-w-sm space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900">Cerebro Pro</h1>
          <p className="mt-2 text-sm text-slate-500">{isLoginView ? 'Inicia sesión para continuar' : 'Crea una cuenta para empezar'}</p>
        </div>
        <form className="space-y-6" onSubmit={handleAuthAction}>
          <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><AtSign className="h-5 w-5 text-slate-400" /></div><input type="email" placeholder="Correo electrónico" required className="w-full rounded-2xl border border-slate-200 bg-white p-4 pl-10 text-sm font-medium text-slate-800 outline-none focus:border-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><KeyRound className="h-5 w-5 text-slate-400" /></div><input type="password" placeholder="Contraseña" required className="w-full rounded-2xl border border-slate-200 bg-white p-4 pl-10 text-sm font-medium text-slate-800 outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
          <div><button type="submit" className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg hover:bg-slate-800">{isLoginView ? 'Entrar' : 'Registrarse'}</button></div>
        </form>
        <p className="text-center text-xs"><button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-blue-600 hover:underline">{isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button></p>
      </div>
    </div>
  );
};

// --- Componente Principal ---

export default function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('finances'); 
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- Estado de Datos Generales ---
  const [mainEntities, setMainEntities] = useState([
    { id: 'a1', type: 'areas', title: 'Salud Física y Mental', category: 'Personal', icon: 'Heart', color: 'text-red-500', bg: 'bg-red-50', details: 'Mi área central para el bienestar. Incluye dieta, ejercicio, sueño y salud mental.' },
    { id: 'a2', type: 'areas', title: 'Carrera Profesional', category: 'Empresa', icon: 'Briefcase', color: 'text-blue-500', bg: 'bg-blue-50', details: '' },
    { id: 'c1', type: 'courses', title: 'Maestría en React', category: 'Tecnología', icon: 'BookOpen', color: 'text-cyan-500', bg: 'bg-cyan-50', details: 'Curso intensivo para dominar React y su ecosistema.' },
    { id: 'p1', type: 'projects', title: 'Lanzamiento de App', category: 'Empresa', icon: 'Rocket', color: 'text-purple-500', bg: 'bg-purple-50', details: '' },
  ]);

  const [subcategories, setSubcategories] = useState([
    { id: 1, parentId: 'a1', title: 'Nutrición Pro', objTitle: 'Déficit Calórico', objDesc: 'Bajar al 12% de grasa corporal.', start: '2024-05-01', end: '2024-08-01' },
    { id: 2, parentId: 'c1', title: 'Módulo: Hooks Avanzados', objTitle: 'Mastering useMemo', objDesc: 'Optimizar renders pesados.', start: '2024-06-01', end: '2024-06-15' },
    { id: 3, parentId: 'p1', title: 'Fase 1: MVP', objTitle: 'Diseño y Prototipo', objDesc: 'Tener la versión inicial lista para pruebas con usuarios.', start: '2024-05-15', end: '2024-06-30' },
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, subId: 1, title: 'Comprar balanza gramera', completed: false, completedAt: null },
    { id: 2, subId: 1, title: 'Preparar batch cooking', completed: true, completedAt: '2024-05-12' },
    { id: 3, subId: 3, title: 'Crear Wireframes en Figma', completed: false, completedAt: null },
  ]);

  const [resources, setResources] = useState([
    { id: 1, subId: 2, type: 'video', title: 'Tutorial Hooks', url: 'https://youtube.com/...' },
  ]);

  const [habits, setHabits] = useState([
    { id: 1, name: 'Meditar 10 min', desc: 'Calmar la mente para mejorar el enfoque', completed: [true, true, false, true, false, false, false] },
    { id: 2, name: 'Leer 20 páginas', desc: 'Fomentar el aprendizaje continuo', completed: [true, true, true, false, true, true, false] },
  ]);

  // --- Estado de Finanzas ---
  const [financeTab, setFinanceTab] = useState('resumen'); // 'resumen' o 'configuracion'
  
  const [financeCategories, setFinanceCategories] = useState({
    ingreso: ['Salario', 'Honorarios', 'Ventas'],
    egreso: ['Servicios', 'Alimentación', 'Transporte', 'Entretenimiento', 'Salud'],
    ahorro: ['Fondo de Emergencia', 'Inversión ETF', 'Viajes']
  });

  const [financeLinks, setFinanceLinks] = useState([
    { id: 1, title: 'Mi Banco Principal', url: 'https://www.banco.com', icon: 'Landmark' },
    { id: 2, title: 'Plataforma de Inversión', url: 'https://www.broker.com', icon: 'PieChart' }
  ]);
  const [newFinanceLink, setNewFinanceLink] = useState({ title: '', url: '', icon: 'Globe' });

  const [transactions, setTransactions] = useState([
    { id: 1, type: 'ingreso', amount: 2500, desc: 'Sueldo Base', date: '2024-05-01', category: 'Salario' },
    { id: 2, type: 'egreso', amount: 45, desc: 'Internet y Teléfono', date: '2024-05-05', category: 'Servicios' },
    { id: 3, type: 'egreso', amount: 150, desc: 'Supermercado', date: '2024-05-10', category: 'Alimentación' },
    { id: 4, type: 'ahorro', amount: 300, desc: 'Ahorro Automático', date: '2024-05-15', category: 'Fondo de Emergencia' },
  ]);
  
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [newTransaction, setNewTransaction] = useState({ type: 'egreso', amount: '', desc: '', date: new Date().toISOString().split('T')[0], category: financeCategories.egreso[0] });
  
  const [financeDateFrom, setFinanceDateFrom] = useState('2024-05-01');
  const [financeDateTo, setFinanceDateTo] = useState('2024-05-31');
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCatName, setNewCatName] = useState({ type: '', val: '' });

  // --- Estado de Anotaciones ---
  const [notes, setNotes] = useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDetails, setNewNoteDetails] = useState('');
  const [newNoteTasks, setNewNoteTasks] = useState([]);
  const [newNoteTaskInput, setNewNoteTaskInput] = useState('');
  const [addingTaskToNoteId, setAddingTaskToNoteId] = useState(null);
  const [newNoteTaskTitle, setNewNoteTaskTitle] = useState('');
  const [expandedArchivedNoteId, setExpandedArchivedNoteId] = useState(null);

  // --- Estado de Bandeja de Entrada ---
  const [inboxItems, setInboxItems] = useState([
    { id: 'i1', text: 'Revisar el nuevo libro de Atomic Habits', createdAt: '2024-05-21T11:00:00Z' },
    { id: 'i2', text: 'Idea para el proyecto X: usar D3.js para las visualizaciones', createdAt: '2024-05-21T12:30:00Z' }
  ]);
  const [newInboxItemText, setNewInboxItemText] = useState('');
  const [processingItemId, setProcessingItemId] = useState(null);
  const [taskTargetSubId, setTaskTargetSubId] = useState('');
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [isEditingInboxItem, setIsEditingInboxItem] = useState(false);
  const [editedInboxItemText, setEditedInboxItemText] = useState('');

  // --- Estados de UI Generales ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState(null); 
  const [entityToDelete, setEntityToDelete] = useState(null);
  
  const [newForm, setNewForm] = useState({ title: '', category: 'General', icon: 'Folder', details: '' });
  const [editingEntityId, setEditingEntityId] = useState(null);
  const [newSubForm, setNewSubForm] = useState({ title: '', objTitle: '', objDesc: '', start: '', end: '' });
  const [newHabitForm, setNewHabitForm] = useState({ name: '', desc: '' });
  
  const [editingSubId, setEditingSubId] = useState(null);
  const [addingTaskToSubId, setAddingTaskToSubId] = useState(null);
  const [attachingToSubId, setAttachingToSubId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newResForm, setNewResForm] = useState({ title: '', url: '', type: 'video' });
  const [dateFrom, setDateFrom] = useState('2024-05-13');
  
  // --- Lógica de Sincronización con Firestore ---
  useEffect(() => {
    if (currentUser) {
      // Si hay un usuario, nos suscribimos a sus anotaciones.
      const notesCollectionRef = collection(db, 'users', currentUser.uid, 'notes');
      const q = query(notesCollectionRef);

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString(),
          tasks: doc.data().tasks.map(t => ({ ...t, completedAt: t.completedAt?.toDate()?.toISOString() || null }))
        }));
        setNotes(notesData);
      });

      // La función de limpieza se ejecuta cuando el usuario cambia o el componente se desmonta.
      return () => {
        unsubscribe();
        setNotes([]); // Limpiamos el estado al cerrar sesión.
        // Aquí también se limpiarían los otros estados.
      };
    }
  }, [currentUser]);

  // --- Lógica de Finanzas ---
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (financeDateFrom && t.date < financeDateFrom) return false;
      if (financeDateTo && t.date > financeDateTo) return false;
      return true;
    });
  }, [transactions, financeDateFrom, financeDateTo]);

  const financeStats = useMemo(() => {
    const ingresos = filteredTransactions.filter(t => t.type === 'ingreso').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const egresos = filteredTransactions.filter(t => t.type === 'egreso').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const ahorros = filteredTransactions.filter(t => t.type === 'ahorro').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const balance = ingresos - egresos - ahorros;
    const tasaAhorro = ingresos > 0 ? (ahorros / ingresos) * 100 : 0;
    
    return { ingresos, egresos, ahorros, balance, tasaAhorro: tasaAhorro.toFixed(1) };
  }, [filteredTransactions]);

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.desc) return;
    
    if (editingTransactionId) {
      setTransactions(transactions.map(t => t.id === editingTransactionId ? { ...newTransaction, amount: Number(newTransaction.amount) } : t));
      setEditingTransactionId(null);
    } else {
      setTransactions([{ ...newTransaction, id: crypto.randomUUID(), amount: Number(newTransaction.amount) }, ...transactions]);
    }
    setIsFinanceModalOpen(false);
    setNewTransaction({ type: 'egreso', amount: '', desc: '', date: new Date().toISOString().split('T')[0], category: financeCategories.egreso[0] });
  };

  const handleEditTransaction = (t) => {
    setNewTransaction(t);
    setEditingTransactionId(t.id);
    setIsFinanceModalOpen(true);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleTransactionTypeChange = (type) => {
    setNewTransaction({ ...newTransaction, type, category: financeCategories[type][0] || '' });
  };

  const handleAddFinanceCategory = (type) => {
    if (!newCatName.val.trim() || newCatName.type !== type) return;
    setFinanceCategories(prev => ({
        ...prev,
        [type]: [...prev[type], newCatName.val.trim()]
    }));
    setNewCatName({ type: '', val: '' });
  };

  const handleDeleteFinanceCategory = (type, cat) => {
    setFinanceCategories(prev => ({
        ...prev,
        [type]: prev[type].filter(c => c !== cat)
    }));
  };

  const handleSaveEditCategory = () => {
    if (!editingCategory.newVal.trim()) return;
    setFinanceCategories(prev => ({
        ...prev,
        [editingCategory.type]: prev[editingCategory.type].map(c => c === editingCategory.oldVal ? editingCategory.newVal.trim() : c)
    }));
    setTransactions(prev => prev.map(t => 
        (t.type === editingCategory.type && t.category === editingCategory.oldVal) 
        ? { ...t, category: editingCategory.newVal.trim() } 
        : t
    ));
    setEditingCategory(null);
  };

  const handleAddFinanceLink = () => {
    if (!newFinanceLink.title.trim() || !newFinanceLink.url.trim()) return;
    setFinanceLinks([...financeLinks, { id: crypto.randomUUID(), title: newFinanceLink.title.trim(), url: newFinanceLink.url.trim(), icon: newFinanceLink.icon }]);
    setNewFinanceLink({ title: '', url: '', icon: 'Globe' });
  };

  const handleDeleteFinanceLink = (id) => {
    setFinanceLinks(financeLinks.filter(l => l.id !== id));
  };

  // --- Lógica de Anotaciones ---
  const getNoteProgress = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || note.tasks.length === 0) return 0;
    const completedTasks = note.tasks.filter(t => t.completed).length;
    return Math.round((completedTasks / note.tasks.length) * 100);
  };

  const openNewNoteModal = () => {
    setNewNoteTitle('');
    setNewNoteDetails('');
    setNewNoteTasks([]);
    setNewNoteTaskInput('');
    setIsNoteModalOpen(true);
  };

  const closeNewNoteModal = () => {
    setIsNoteModalOpen(false);
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !currentUser) return;
    const notesCollectionRef = collection(db, 'users', currentUser.uid, 'notes');
    const newNote = {
        title: newNoteTitle.trim(),
        details: newNoteDetails.trim(),
        createdAt: serverTimestamp(),
        archived: false,
        tasks: newNoteTasks
    };
    await addDoc(notesCollectionRef, newNote);
    closeNewNoteModal();
  };

  const handleAddTaskToNewNote = () => {
    if (!newNoteTaskInput.trim()) return;
    const newTask = {
        id: crypto.randomUUID(),
        title: newNoteTaskInput.trim(),
        completed: false,
        completedAt: null
    };
    setNewNoteTasks([...newNoteTasks, newTask]);
    setNewNoteTaskInput('');
  };

  const handleRemoveTaskFromNewNote = (taskId) => {
    setNewNoteTasks(newNoteTasks.filter(t => t.id !== taskId));
  };

  const handleAddNoteTask = async (noteId) => {
      if (!newNoteTaskTitle.trim() || !currentUser) return;
      const noteDocRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      
      const newTask = { id: crypto.randomUUID(), title: newNoteTaskTitle, completed: false, completedAt: null };
      const updatedTasks = [...note.tasks, newTask];
      
      await updateDoc(noteDocRef, { tasks: updatedTasks });
      
      setNewNoteTaskTitle('');
      setAddingTaskToNoteId(null);
  };

  const toggleNoteTask = async (noteId, taskId) => {
    if (!currentUser) return;
    const noteDocRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedTasks = note.tasks.map(t => {
      if (t.id === taskId) {
        const isNowCompleted = !t.completed;
        return { ...t, completed: isNowCompleted, completedAt: isNowCompleted ? new Date() : null };
      }
      return t;
    });

    await updateDoc(noteDocRef, { tasks: updatedTasks });
  };

  const handleDeleteNoteTask = async (noteId, taskId) => {
    if (!currentUser) return;
    const noteDocRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const updatedTasks = note.tasks.filter(t => t.id !== taskId);
    await updateDoc(noteDocRef, { tasks: updatedTasks });
  };

  const archiveNote = async (noteId, shouldArchive) => {
      if (!currentUser) return;
      const noteDocRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
      await updateDoc(noteDocRef, { archived: shouldArchive });
  };

  const deleteNote = async (noteId) => {
      if (!currentUser) return;
      const noteDocRef = doc(db, 'users', currentUser.uid, 'notes', noteId);
      await deleteDoc(noteDocRef);
  };

  // --- Lógica de Bandeja de Entrada ---
  const handleAddInboxItem = () => {
    if (!newInboxItemText.trim()) return;
    const newItem = {
        id: crypto.randomUUID(),
        text: newInboxItemText.trim(),
        createdAt: new Date().toISOString()
    };
    setInboxItems([newItem, ...inboxItems]);
    setNewInboxItemText('');
  };

  const handleDeleteInboxItem = (itemId) => {
    setInboxItems(inboxItems.filter(i => i.id !== itemId));
    if (processingItemId === itemId) {
      setProcessingItemId(null);
    }
  };

  const handleSelectProcessingItem = (itemId) => {
    setProcessingItemId(itemId);
    setShowTaskAssignment(false);
    setTaskTargetSubId('');
    setIsEditingInboxItem(false);
  };

  const processItem = (action) => {
    const itemToProcess = inboxItems.find(i => i.id === processingItemId);
    if (!itemToProcess) return;

    const { text } = itemToProcess;

    switch (action) {
        case 'toTask':
            if (!taskTargetSubId) {
                alert("Por favor, selecciona una subcategoría para la tarea.");
                return;
            }
            setTasks([...tasks, { id: crypto.randomUUID(), subId: taskTargetSubId, title: text, completed: false, completedAt: null }]);
            break;
        case 'toNote':
            setNotes([{ id: crypto.randomUUID(), title: text, createdAt: new Date().toISOString(), archived: false, tasks: [] }, ...notes]);
            break;
        case 'toHabit':
            setHabits([...habits, { id: crypto.randomUUID(), name: text, desc: 'Añadir descripción...', completed: new Array(7).fill(false) }]);
            break;
        case 'toArea':
        case 'toProject':
        case 'toCourse':
            {
              const entityTypeMap = { toArea: 'areas', toProject: 'projects', toCourse: 'courses' };
              setMainEntities([...mainEntities, {
                  id: crypto.randomUUID(),
                  type: entityTypeMap[action],
                  title: text,
                  category: 'Desde Bandeja',
                  icon: 'Folder',
                  color: 'text-gray-500', bg: 'bg-gray-50'
              }]);
              break;
            }
        default:
            return;
    }

    // Limpiar después de procesar
    setInboxItems(inboxItems.filter(i => i.id !== processingItemId));
    setProcessingItemId(null);
    setShowTaskAssignment(false);
    setTaskTargetSubId('');
  };

  const handleUpdateInboxItemText = () => {
    if (!editedInboxItemText.trim()) return;
    setInboxItems(inboxItems.map(item => item.id === processingItemId ? { ...item, text: editedInboxItemText.trim() } : item));
    setIsEditingInboxItem(false);
    setEditedInboxItemText('');
  };

  // --- Lógica Modular General ---
  const getProgress = (subId) => {
    const subTasks = tasks.filter(t => t.subId === subId);
    if (subTasks.length === 0) return 0;
    return Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100);
  };

  const getParentProgress = (parentId) => {
    const subs = subcategories.filter(s => s.parentId === parentId);
    if (subs.length === 0) return 0;
    const totalProgress = subs.reduce((acc, s) => acc + getProgress(s.id), 0);
    return Math.round(totalProgress / subs.length);
  };

  const handleCreateEntity = () => {
    if (!newForm.title) return;
    if (editingEntityId) {
      setMainEntities(mainEntities.map(e => e.id === editingEntityId ? { ...e, ...newForm } : e));
      setEditingEntityId(null);
    } else {
      const newEntry = { ...newForm, id: crypto.randomUUID(), type: activeTab, color: 'text-blue-500', bg: 'bg-blue-50' };
      setMainEntities([...mainEntities, newEntry]);
    }
    setIsModalOpen(false);
    setNewForm({ title: '', category: 'General', icon: 'Folder', details: '' });
  };

  const handleEditEntityInit = (entity) => {
    setNewForm({ title: entity.title, category: entity.category, icon: entity.icon, details: entity.details || '' });
    setEditingEntityId(entity.id);
    setIsModalOpen(true);
  };

  const handleDeleteEntity = (id) => {
    setMainEntities(mainEntities.filter(e => e.id !== id));
    const subsToRemove = subcategories.filter(s => s.parentId === id).map(s => s.id);
    setSubcategories(subcategories.filter(s => s.parentId !== id));
    setTasks(tasks.filter(t => !subsToRemove.includes(t.subId)));
    setResources(resources.filter(r => !subsToRemove.includes(r.subId)));
    setEntityToDelete(null);
  };

  const handleAddSub = () => {
    if (!newSubForm.title || !selectedParentId) return;
    const nSub = { id: crypto.randomUUID(), parentId: selectedParentId, ...newSubForm };
    setSubcategories([...subcategories, nSub]);
    setIsSubModalOpen(false);
    setNewSubForm({ title: '', objTitle: '', objDesc: '', start: '', end: '' });
  };

  const handleDeleteSub = (subId) => {
    setSubcategories(subcategories.filter(s => s.id !== subId));
    setTasks(tasks.filter(t => t.subId !== subId));
    setResources(resources.filter(r => r.subId !== subId));
    setSubToDelete(null);
  };

  const handleAddTask = (sId) => {
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), subId: sId, title: newTaskTitle, completed: false, completedAt: null }]);
    setNewTaskTitle('');
    setAddingTaskToSubId(null);
  };

  const handleAddRes = (sId) => {
    if (!newResForm.title || !newResForm.url) return;
    setResources([...resources, { id: crypto.randomUUID(), subId: sId, ...newResForm }]);
    setNewResForm({ title: '', url: '', type: 'video' });
    setAttachingToSubId(null);
  };

  const updateSubInfo = (sId, fields) => {
    setSubcategories(subcategories.map(s => s.id === sId ? { ...s, ...fields } : s));
  };

  const handleAddHabit = () => {
    if (!newHabitForm.name.trim() || !newHabitForm.desc.trim()) return;
    setHabits([...habits, { id: crypto.randomUUID(), name: newHabitForm.name.trim(), desc: newHabitForm.desc.trim(), completed: new Array(7).fill(false) }]);
    setNewHabitForm({ name: '', desc: '' });
  };

  const toggleHabitDay = (habitId, dayIndex) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const newStatus = [...h.completed];
        newStatus[dayIndex] = !newStatus[dayIndex];
        return { ...h, completed: newStatus };
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  // --- Memos y Filtros ---
  const activeParent = mainEntities.find(e => e.id === selectedParentId);
  
  const filteredEntities = useMemo(() => {
    return mainEntities
      .filter(e => e.type === activeTab)
      .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [mainEntities, activeTab, searchQuery]);

  const filteredSubcategories = useMemo(() => {
    if (!selectedParentId) return [];
    return subcategories
      .filter(s => s.parentId === selectedParentId)
      .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [subcategories, selectedParentId, searchQuery]);

  const completedParentTasks = useMemo(() => {
    if (!selectedParentId) return [];
    const subIds = subcategories.filter(s => s.parentId === selectedParentId).map(s => s.id);
    return tasks.filter(t => subIds.includes(t.subId) && t.completed);
  }, [tasks, subcategories, selectedParentId]);

  const activeNotes = useMemo(() => notes.filter(n => !n.archived).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [notes]);
  const archivedNotes = useMemo(() => notes.filter(n => n.archived).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [notes]);

  const processingItem = useMemo(() => inboxItems.find(i => i.id === processingItemId), [inboxItems, processingItemId]);

  const subcategoryOptions = useMemo(() => {
    return mainEntities.map(parent => {
        const childSubs = subcategories.filter(s => s.parentId === parent.id);
        if (childSubs.length === 0) return null;
        return (
            <optgroup key={parent.id} label={parent.title}>
                {childSubs.map(sub => <option key={sub.id} value={sub.id}>{sub.title}</option>)}
            </optgroup>
        );
    }).filter(Boolean);
  }, [mainEntities, subcategories]);

  const weekDates = useMemo(() => {
    const start = new Date(dateFrom + 'T00:00:00');
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label: DAYS_OF_WEEK[i], dayNum: d.getDate(), month: d.toLocaleString('es-ES', { month: 'short' }).replace('.', '') };
    });
  }, [dateFrom]);

  const weeklyStats = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
      return habits.reduce((acc, habit) => acc + (habit.completed[dayIndex] ? 1 : 0), 0);
    });
  }, [habits]);

  const { currentStreak, streakAdvice } = useMemo(() => {
    const totalCompleted = habits.reduce((acc, h) => acc + h.completed.filter(Boolean).length, 0);
    let advice = "";
    if (totalCompleted === 0) advice = "El mejor momento para empezar es hoy. ¡Da el primer paso!";
    else if (totalCompleted < 5) advice = "Buen inicio. Recuerda, la constancia supera a la intensidad.";
    else if (totalCompleted < 10) advice = "¡Vas por buen camino! Estás creando conexiones neuronales duraderas.";
    else advice = "¡Imparable! La disciplina que estás forjando ya es parte de tu identidad.";
    return { currentStreak: totalCompleted, streakAdvice: advice };
  }, [habits]);

  const formatDate = (dateStr) => {
      if (!dateStr) return '---';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const formatDateTime = (dateStr) => {
      if (!dateStr) return '---';
      const d = new Date(dateStr);
      return d.toLocaleString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
      });
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-slate-50/50 p-4 flex-col gap-6 hidden md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold italic text-sm">B2</div>
          <h1 className="font-bold text-slate-900 tracking-tight text-sm uppercase">Cerebro Pro</h1>
        </div>

        <nav className="flex flex-col gap-1">
          <SidebarButton icon={LayoutGrid} label="Gestión de Áreas" active={activeTab === 'areas'} onClick={() => { setActiveTab('areas'); setSelectedParentId(null); }} />
          <SidebarButton icon={Rocket} label="Proyectos" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSelectedParentId(null); }} />
          <SidebarButton icon={BookOpen} label="Capacitaciones" active={activeTab === 'courses'} onClick={() => { setActiveTab('courses'); setSelectedParentId(null); }} />
          <SidebarButton icon={Inbox} label="Bandeja de Entrada" active={activeTab === 'inbox'} onClick={() => { setActiveTab('inbox'); setSelectedParentId(null); }} />
          <SidebarButton icon={FileText} label="Anotaciones" active={activeTab === 'notes'} onClick={() => { setActiveTab('notes'); setSelectedParentId(null); }} />
          <SidebarButton icon={Wallet} label="Finanzas" active={activeTab === 'finances'} onClick={() => { setActiveTab('finances'); setSelectedParentId(null); }} />
          <SidebarButton icon={UserCheck} label="Seguimiento de Hábitos" active={activeTab === 'habits'} onClick={() => { setActiveTab('habits'); setSelectedParentId(null); }} />
        </nav>

        <div className="mt-auto px-4 py-5 bg-blue-600 rounded-3xl text-white shadow-xl">
          <div className="text-[10px] font-bold uppercase opacity-70 mb-1">Efectividad General</div>
          <div className="text-2xl font-black">72%</div>
        </div>
        <div className="border-t border-slate-200 pt-2 mt-2">
          <p className="text-[10px] text-slate-400 font-bold px-4 truncate">{currentUser.email}</p>
          <SidebarButton icon={LogOut} label="Cerrar Sesión" active={false} onClick={handleSignOut} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        <header className="sticky top-0 bg-white/90 backdrop-blur-md z-30 px-8 py-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-6">
            {selectedParentId && (
              <button onClick={() => setSelectedParentId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold">
              {activeTab === 'habits' ? 'Mis Hábitos' : 
               activeTab === 'finances' ? 'Control Financiero' :
               activeTab === 'inbox' ? 'Bandeja de Entrada' :
               activeTab === 'notes' ? 'Anotaciones' :
               activeParent ? activeParent.title : 
               activeTab === 'areas' ? 'Gestión de Áreas' : 
               activeTab === 'projects' ? 'Mis Proyectos' :
               'Capacitaciones'}
            </h2>
            
            {activeTab !== 'habits' && activeTab !== 'finances' && activeTab !== 'notes' && activeTab !== 'inbox' && (
              <div className="relative group hidden sm:block">
                 <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs w-64 focus:bg-white outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 overflow-x-auto max-w-[300px] xl:max-w-[500px] px-2 scrollbar-hide">
             {financeLinks.map(link => {
                const Icon = LINK_ICONS[link.icon] || Globe;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap border border-slate-200 shadow-sm flex-shrink-0">
                    <Icon size={14} className="text-blue-500" />
                    <span>{link.title}</span>
                  </a>
                );
             })}
          </div>

          <div className="flex gap-3">
             {activeTab === 'notes' && !selectedParentId && (
                <button onClick={openNewNoteModal} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                  <Plus size={16} /> Nueva Anotación
                </button>
             )}
             {activeTab === 'finances' && !selectedParentId && financeTab === 'resumen' && (
                <button onClick={() => setIsFinanceModalOpen(true)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                  <Plus size={16} /> Movimiento
                </button>
             )}
             {!selectedParentId && (activeTab === 'areas' || activeTab === 'courses' || activeTab === 'projects') && (
                <button onClick={() => { setEditingEntityId(null); setNewForm({ title: '', category: 'General', icon: 'Folder' }); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                  <Plus size={16} /> {activeTab === 'areas' ? 'Nueva Área' : activeTab === 'courses' ? 'Nuevo Curso' : 'Nuevo Proyecto'}
                </button>
              )}
              {selectedParentId && (
                <button onClick={() => setIsSubModalOpen(true)} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg">
                  <Plus size={16} /> Añadir Subcategoría
                </button>
              )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-8">
          
          {/* 1. VISTA GRILLA (Áreas/Cursos/Proyectos) */}
          {!selectedParentId && (activeTab === 'areas' || activeTab === 'courses' || activeTab === 'projects') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {filteredEntities.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedParentId(item.id)} 
                  className="relative p-6 bg-white border border-slate-200 rounded-3xl hover:shadow-2xl transition-all cursor-pointer group"
                >
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleEditEntityInit(item); }} className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEntityToDelete(item); }} className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${item.bg} ${item.color}`}>
                    <AreaIcon name={item.icon} size={24} />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                      <span>Progreso</span>
                      <span>{getParentProgress(item.id)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${getParentProgress(item.id)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. VISTA DETALLE (Subcategorías) */}
          {selectedParentId && activeParent && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                {activeParent.details && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalles</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{activeParent.details}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredSubcategories.map(sub => {
                    const subTasks = tasks.filter(t => t.subId === sub.id);
                    const pendingTasks = subTasks.filter(t => !t.completed);
                    const isSubCompleted = subTasks.length > 0 && pendingTasks.length === 0;

                    return (
                    <div key={sub.id} className={`border rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors group/card ${isSubCompleted ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-blue-100'}`}>
                      <div className={`p-5 border-b flex items-center justify-between ${isSubCompleted ? 'border-emerald-100 bg-emerald-100/30' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2">
                          <Folder size={16} className={isSubCompleted ? 'text-emerald-600' : 'text-blue-500'} />
                          <h4 className="font-bold text-slate-800">{sub.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isSubCompleted ? 'text-emerald-700 bg-emerald-200/60' : 'text-blue-500 bg-blue-50'}`}>
                            {getProgress(sub.id)}% {isSubCompleted && 'COMPLETADO'}
                          </span>
                          <button 
                              onClick={() => setSubToDelete(sub)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                              title="Eliminar Subcategoría"
                          >
                              <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* OBJETIVO ESTRATÉGICO */}
                        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-3 group/obj relative">
                          <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> Objetivo Estratégico</span>
                              <div className="flex gap-1">
                                  {editingSubId === sub.id ? (
                                      <button onClick={() => setEditingSubId(null)} className="p-1.5 text-emerald-600 bg-white border border-emerald-100 rounded-lg shadow-sm hover:bg-emerald-50"><Check size={14} strokeWidth={3} /></button>
                                  ) : (
                                      <button onClick={() => setEditingSubId(sub.id)} className="p-1.5 text-slate-400 bg-white border border-slate-100 rounded-lg shadow-sm opacity-0 group-hover/obj:opacity-100 hover:text-blue-500 transition-all"><Edit2 size={14} /></button>
                                  )}
                              </div>
                          </div>

                          {editingSubId === sub.id ? (
                            <div className="space-y-3">
                              <input autoFocus className="text-sm font-bold w-full bg-white border border-blue-200 rounded-xl p-2 outline-none" value={sub.objTitle} onChange={(e) => updateSubInfo(sub.id, {objTitle: e.target.value})} />
                              <textarea className="text-xs w-full bg-white border border-blue-100 rounded-xl p-2 outline-none h-20 resize-none" value={sub.objDesc} onChange={(e) => updateSubInfo(sub.id, {objDesc: e.target.value})} />
                              <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Inicio</label>
                                      <input type="date" className="text-[10px] p-2 border rounded-xl w-full bg-white" value={sub.start} onChange={(e) => updateSubInfo(sub.id, {start: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Fin</label>
                                      <input type="date" className="text-[10px] p-2 border rounded-xl w-full bg-white" value={sub.end} onChange={(e) => updateSubInfo(sub.id, {end: e.target.value})} />
                                  </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <h5 className="text-sm font-bold text-slate-800">{sub.objTitle}</h5>
                              <p className="text-xs text-slate-500 italic leading-relaxed">{sub.objDesc}</p>
                              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 pt-1 bg-white/50 w-fit px-2 py-1 rounded-full border border-slate-200">
                                  <Calendar size={10} /> Del {sub.start} al {sub.end}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PLAN DE ACCIÓN PENDIENTES */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan de Acción</h5>
                              <button onClick={() => setAddingTaskToSubId(sub.id)} className="text-blue-500 font-bold text-[10px] uppercase hover:underline flex items-center gap-1"><Plus size={12} /> Añadir</button>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${isSubCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${getProgress(sub.id)}%` }}></div></div>

                          {addingTaskToSubId === sub.id && (
                            <div className="flex gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                               <input autoFocus type="text" placeholder="Tarea..." className="flex-1 text-xs p-2 bg-white rounded-lg outline-none" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask(sub.id)} />
                               <button onClick={() => handleAddTask(sub.id)} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
                            </div>
                          )}

                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                            {subTasks.map(task => (
                              <div key={task.id} className="flex items-center gap-3 group/task">
                                <button onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString().split('T')[0] : null} : t))} className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-500 text-transparent'}`}><Check size={12} strokeWidth={3} /></button>
                                <span className={`text-xs flex-1 font-medium transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="text-slate-300 opacity-0 group-hover/task:opacity-100 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                            {subTasks.length === 0 && (
                              <p className="text-[10px] text-slate-400 italic">No hay tareas pendientes.</p>
                            )}
                          </div>
                        </div>

                        {/* RECURSOS */}
                        <div className="space-y-3 pt-5 border-t border-slate-100">
                          <div className="flex justify-between items-center px-1">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recursos vinculados</h5>
                              <button onClick={() => setAttachingToSubId(sub.id)} className="text-slate-400 hover:text-blue-500 font-bold text-[10px] uppercase flex items-center gap-1"><Paperclip size={12} /> Adjuntar</button>
                          </div>

                          {attachingToSubId === sub.id && (
                            <div className="p-4 bg-slate-900 rounded-2xl space-y-3 animate-in zoom-in-95">
                               <input type="text" placeholder="Nombre del recurso..." className="w-full p-2 bg-white/10 border-none rounded-xl text-xs text-white outline-none" value={newResForm.title} onChange={(e) => setNewResForm({...newResForm, title: e.target.value})} />
                               <div className="flex gap-2">
                                  <select className="bg-white/10 text-white text-[10px] font-bold rounded-xl px-2 outline-none flex-1 border-none" value={newResForm.type} onChange={(e) => setNewResForm({...newResForm, type: e.target.value})}>
                                      <option className="text-slate-900" value="video">Video (YouTube)</option>
                                      <option className="text-slate-900" value="short">Reels / TikTok</option>
                                      <option className="text-slate-900" value="docs">Documento (Docs)</option>
                                      <option className="text-slate-900" value="sheets">Hoja de Cálculo (Sheets)</option>
                                      <option className="text-slate-900" value="link">Otro Enlace</option>
                                  </select>
                               </div>
                               <input type="text" placeholder="URL o enlace..." className="w-full p-2 bg-white/10 border-none rounded-xl text-xs text-white outline-none" value={newResForm.url} onChange={(e) => setNewResForm({...newResForm, url: e.target.value})} />
                               <div className="flex gap-2">
                                  <button onClick={() => handleAddRes(sub.id)} className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-[10px] font-bold">GUARDAR</button>
                                  <button onClick={() => setAttachingToSubId(null)} className="px-4 bg-white/20 text-white py-2 rounded-xl text-[10px]">X</button>
                               </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2">
                            {resources.filter(r => r.subId === sub.id).map(res => (
                              <div key={res.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-2xl group/res transition-all cursor-pointer">
                                {res.type === 'video' ? <PlayCircle size={14} className="text-red-500" /> : 
                                 res.type === 'short' ? <Clapperboard size={14} className="text-pink-500" /> :
                                 res.type === 'sheets' ? <FileSpreadsheet size={14} className="text-emerald-500" /> :
                                 res.type === 'docs' ? <FileType size={14} className="text-blue-500" /> :
                                 <LinkIcon size={14} className="text-slate-500" />}
                                <span className="text-[11px] font-bold text-slate-600 truncate flex-1">{res.title}</span>
                                <div className="flex gap-1 opacity-0 group-hover/res:opacity-100 transition-all">
                                  <a href={res.url} target="_blank" rel="noreferrer" className="p-1 text-slate-400 hover:text-blue-500"><ExternalLink size={12}/></a>
                                  <button onClick={() => setResources(resources.filter(x => x.id !== res.id))} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12}/></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HISTORIAL TABLA UNIFICADA */}
              {completedParentTasks.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mt-8">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Historial de Actividades Concretadas</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{completedParentTasks.length} completadas</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Actividad</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Categoría Principal</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Subcategoría</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedParentTasks.sort((a,b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)).map(task => {
                                    const sub = subcategories.find(s => s.id === task.subId);
                                    return (
                                        <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group/hist">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle size={16} className="text-emerald-500" />
                                                    <span className="text-sm font-medium text-slate-500 line-through">{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-1 rounded uppercase tracking-wider">{activeParent.title}</span>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{sub?.title || 'Desconocida'}</span>
                                            </td>
                                            <td className="p-5 text-xs text-slate-500 font-medium">
                                                {formatDate(task.completedAt)}
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover/hist:opacity-100 transition-all">
                                                    <button onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, completed: false, completedAt: null} : t))} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Mover a pendientes"><RotateCcw size={16} /></button>
                                                    <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}

            </div>
          )}

          {/* VISTA HÁBITOS */}
          {activeTab === 'habits' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center border border-slate-800 space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nuevo Hábito</h4>
                        <div className="flex flex-col gap-3">
                            <input 
                              type="text" 
                              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-blue-400 font-bold text-sm text-white placeholder:text-slate-400" 
                              placeholder="Nombre del Hábito (ej: Beber 2L de agua)" 
                              value={newHabitForm.name} 
                              onChange={e => setNewHabitForm({...newHabitForm, name: e.target.value})} 
                            />
                            <textarea 
                              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-blue-400 text-xs text-slate-300 resize-none h-20 placeholder:text-slate-400" 
                              placeholder="Motivación / Descripción..." 
                              value={newHabitForm.desc} 
                              onChange={e => setNewHabitForm({...newHabitForm, desc: e.target.value})} 
                            />
                            <button 
                              onClick={handleAddHabit} 
                              disabled={!newHabitForm.name.trim() || !newHabitForm.desc.trim()}
                              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 transition-all w-full flex justify-center items-center gap-2 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                              <Plus size={16}/> CAPTURAR HÁBITO
                            </button>
                        </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Tu Progreso Activo</p>
                            <Flame size={24} className="text-orange-500" fill="currentColor" />
                        </div>
                        <p className="text-4xl font-black text-orange-900 mb-2">
                          {currentStreak} <span className="text-lg font-bold opacity-50">Pts. Constancia</span>
                        </p>
                        <p className="text-xs text-orange-700 leading-relaxed font-medium">
                          {streakAdvice}
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Calendario Semanal</h3>
                        <input type="date" className="bg-white border rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Detalle del Hábito</th>
                                    {weekDates.map((item, idx) => (
                                        <th key={idx} className="p-4 text-center">
                                            <div className="text-[10px] font-black text-slate-400 uppercase">{item.label}</div>
                                            <div className="text-[9px] font-bold text-slate-300">{item.dayNum} {item.month}</div>
                                        </th>
                                    ))}
                                    <th className="p-4 text-center w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {habits.map((habit) => (
                                    <tr key={habit.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-bold text-sm text-slate-800">{habit.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 italic line-clamp-1">{habit.desc}</div>
                                        </td>
                                        {habit.completed.map((done, idx) => (
                                            <td key={idx} className="p-2 text-center">
                                                <button onClick={() => toggleHabitDay(habit.id, idx)} className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center transition-all ${done ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 hover:bg-slate-200'}`}><Check size={18} strokeWidth={3} /></button>
                                            </td>
                                        ))}
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleDeleteHabit(habit.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <LineChart data={weeklyStats} weekDates={weekDates} />
            </div>
          )}

          {/* VISTA ANOTACIONES */}
          {activeTab === 'notes' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Tarjetas de Anotaciones Activas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeNotes.map(note => {
                  const progress = getNoteProgress(note.id);
                  const isCompleted = progress === 100 && note.tasks.length > 0;
                  return (
                    <div key={note.id} className={`border rounded-3xl overflow-hidden shadow-sm flex flex-col transition-colors group/card ${isCompleted ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200'}`}>
                      <div className={`p-5 border-b flex items-center justify-between ${isCompleted ? 'border-emerald-100 bg-emerald-100/30' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-3">
                          <FileText size={16} className={isCompleted ? 'text-emerald-600' : 'text-blue-500'} />
                          <h4 className="font-bold text-slate-800">{note.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md ${isCompleted ? 'text-emerald-700 bg-emerald-200/60' : 'text-blue-500 bg-blue-50'}`}>
                            {progress}%
                          </span>
                          <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => archiveNote(note.id, true)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Archivar"><Archive size={14} /></button>
                            <button onClick={() => deleteNote(note.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>{formatDateTime(note.createdAt)}</span>
                          <span>{note.tasks.filter(t => t.completed).length} / {note.tasks.length} completadas</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div></div>
                        {note.details && (
                          <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">{note.details}</p>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tareas</h5>
                            <button onClick={() => setAddingTaskToNoteId(note.id)} className="text-blue-500 font-bold text-[10px] uppercase hover:underline flex items-center gap-1"><Plus size={12} /> Añadir</button>
                          </div>
                          {addingTaskToNoteId === note.id && (
                            <div className="flex gap-2 p-2 bg-blue-50 rounded-xl border border-blue-100">
                                <input autoFocus type="text" placeholder="Nueva tarea..." className="flex-1 text-xs p-2 bg-white rounded-lg outline-none" value={newNoteTaskTitle} onChange={(e) => setNewNoteTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNoteTask(note.id)} />
                                <button onClick={() => handleAddNoteTask(note.id)} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
                            </div>
                          )}
                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                            {note.tasks.map(task => (
                              <div key={task.id} className="flex items-center gap-3 group/task">
                                <button onClick={() => toggleNoteTask(note.id, task.id)} className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-500 text-transparent'}`}><Check size={12} strokeWidth={3} /></button>
                                <span className={`text-xs flex-1 font-medium transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                <button onClick={() => handleDeleteNoteTask(note.id, task.id)} className="text-slate-300 opacity-0 group-hover/task:opacity-100 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                              </div>
                            ))}
                            {note.tasks.length === 0 && (
                              <p className="text-[10px] text-slate-400 italic">No hay tareas en esta anotación.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {activeNotes.length === 0 && (
                  <div className="col-span-full text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-slate-300" size={32} />
                    </div>
                    <h3 className="font-bold text-slate-700">No hay anotaciones activas</h3>
                    <p className="text-sm text-slate-500 mt-2">Crea tu primera anotación para empezar a organizar tus tareas.</p>
                    <button onClick={() => setIsNoteModalOpen(true)} className="mt-6 bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg mx-auto">
                      <Plus size={16} /> Crear Anotación
                    </button>
                  </div>
                )}
              </div>

              {/* Historial de Anotaciones */}
              {archivedNotes.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mt-8">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Historial de Anotaciones Realizadas</h3>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{archivedNotes.length} archivadas</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Anotación</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Fecha de Creación</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center">Tareas</th>
                                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archivedNotes.map(note => {
                                    const completedTasks = note.tasks.filter(t => t.completed);
                                    const isExpanded = expandedArchivedNoteId === note.id;
                                    return (
                                        <React.Fragment key={note.id}>
                                            <tr onClick={() => setExpandedArchivedNoteId(isExpanded ? null : note.id)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group/hist cursor-pointer">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <Archive size={16} className="text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-500">{note.title}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-xs text-slate-500 font-medium">
                                                    {formatDateTime(note.createdAt)}
                                                </td>
                                                <td className="p-5 text-xs text-slate-500 font-medium text-center">
                                                    {completedTasks.length} / {note.tasks.length}
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover/hist:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); archiveNote(note.id, false); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Restaurar"><RotateCcw size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar Permanentemente"><Trash2 size={16} /></button>
                                                        </div>
                                                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/70">
                                                    <td colSpan="4" className="p-5 border-t border-slate-200">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tareas Completadas</h4>
                                                        {completedTasks.length > 0 ? (
                                                            <ul className="space-y-2 pl-4 border-l-2 border-slate-200">
                                                                {completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).map(task => (
                                                                    <li key={task.id} className="flex justify-between items-center text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <CheckCircle size={12} className="text-emerald-500" />
                                                                            <span className="text-slate-600 font-medium">{task.title}</span>
                                                                        </div>
                                                                        <span className="text-slate-400 font-bold bg-white px-2 py-1 rounded-md border border-slate-100">{formatDateTime(task.completedAt)}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic pl-4">No se completaron tareas en esta anotación.</p>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA BANDEJA DE ENTRADA */}
          {activeTab === 'inbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500">
                {/* Columna Izquierda: Captura y Lista */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Formulario de captura */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Captura una idea, tarea o pensamiento..."
                        className="flex-1 bg-transparent text-sm font-medium outline-none px-2"
                        value={newInboxItemText}
                        onChange={(e) => setNewInboxItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInboxItem()}
                      />
                      <button
                        onClick={handleAddInboxItem}
                        className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                        disabled={!newInboxItemText.trim()}
                      >
                        <Plus size={14} /> Capturar
                      </button>
                    </div>

                    {/* Lista de items en la bandeja */}
                    <div className="space-y-3">
                        {inboxItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => handleSelectProcessingItem(item.id)}
                              className={`p-4 rounded-2xl border flex items-center justify-between group transition-all cursor-pointer ${
                                processingItemId === item.id 
                                ? 'bg-blue-50 border-blue-200 shadow-lg' 
                                : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-md'
                              }`}
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{item.text}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{formatDateTime(item.createdAt)}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteInboxItem(item.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {inboxItems.length === 0 && (
                            <div className="text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"><Inbox className="text-slate-300" size={32} /></div>
                                <h3 className="font-bold text-slate-700">Bandeja de entrada vacía</h3>
                                <p className="text-sm text-slate-500 mt-2">¡Buen trabajo! Has procesado todos tus pensamientos.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna Derecha: Procesador */}
                <div className="lg:col-span-2">
                  <div className="sticky top-28">
                    {processingItem ? (
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-6 animate-in fade-in duration-300">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Procesando</h3>
                          {isEditingInboxItem ? (
                            <div className="space-y-2">
                              <textarea 
                                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 resize-y"
                                value={editedInboxItemText}
                                onChange={(e) => setEditedInboxItemText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button onClick={handleUpdateInboxItemText} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold">Guardar</button>
                                <button onClick={() => setIsEditingInboxItem(false)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold">Cancelar</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-base font-medium text-slate-700 italic flex-1">"{processingItem.text}"</p>
                              <button onClick={() => { setIsEditingInboxItem(true); setEditedInboxItemText(processingItem.text); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 pt-6 border-t border-slate-100">
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Convertir en...</h4>
                          <button onClick={() => setShowTaskAssignment(!showTaskAssignment)} className="w-full flex items-center justify-between text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors">
                            <span className="text-sm font-bold text-slate-700">Tarea</span><MoveRight size={16} className="text-blue-500"/>
                          </button>
                          {showTaskAssignment && (
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2 animate-in fade-in duration-300">
                              <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest ml-1">Asignar a subcategoría:</label>
                              <select
                                  className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none text-sm font-bold cursor-pointer"
                                  value={taskTargetSubId}
                                  onChange={e => setTaskTargetSubId(e.target.value)}
                              >
                                  <option value="" disabled>Selecciona una subcategoría...</option>
                                  {subcategoryOptions}
                              </select>
                              <button onClick={() => processItem('toTask')} disabled={!taskTargetSubId} className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50">Confirmar Tarea</button>
                            </div>
                          )}
                          <button onClick={() => processItem('toNote')} className="w-full flex items-center justify-between text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"><span className="text-sm font-bold text-slate-700">Anotación</span><MoveRight size={16} className="text-blue-500"/></button>
                          <button onClick={() => processItem('toHabit')} className="w-full flex items-center justify-between text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"><span className="text-sm font-bold text-slate-700">Hábito</span><MoveRight size={16} className="text-blue-500"/></button>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => processItem('toArea')} className="flex-1 text-center p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">Área</button>
                            <button onClick={() => processItem('toProject')} className="flex-1 text-center p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">Proyecto</button>
                            <button onClick={() => processItem('toCourse')} className="flex-1 text-center p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors">Curso</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-10 bg-slate-50/70 rounded-3xl border-2 border-dashed border-slate-200">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                              <MoveRight className="text-slate-300" size={32} />
                          </div>
                          <h3 className="font-bold text-slate-600">Procesa tu bandeja</h3>
                          <p className="text-sm text-slate-400 mt-2">Selecciona un elemento de la izquierda para decidir qué hacer con él.</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

          {/* VISTA FINANZAS */}
          {activeTab === 'finances' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               
               {/* Sub-Navegación de Finanzas */}
               <div className="flex gap-6 border-b border-slate-100">
                  <button 
                    onClick={() => setFinanceTab('resumen')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${financeTab === 'resumen' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Resumen y Movimientos
                    {financeTab === 'resumen' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setFinanceTab('configuracion')}
                    className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${financeTab === 'configuracion' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Configuración y Enlaces
                    {financeTab === 'configuracion' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                  </button>
               </div>

               {financeTab === 'resumen' ? (
                 <>
                   {/* Header Finanzas (Mes y Resumen) */}
                   <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Resumen del Período</h3>
                        <p className="text-sm font-bold text-slate-800">Del {financeDateFrom} al {financeDateTo}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Tasa de Ahorro</p>
                            <p className={`text-xl font-black ${financeStats.tasaAhorro >= 20 ? 'text-emerald-500' : financeStats.tasaAhorro > 0 ? 'text-blue-500' : 'text-red-500'}`}>{financeStats.tasaAhorro}%</p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col justify-center">
                         <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ingresos</p>
                            <div className="w-8 h-8 bg-emerald-200/50 text-emerald-600 rounded-full flex items-center justify-center"><ArrowUpRight size={16}/></div>
                         </div>
                         <p className="text-3xl font-black text-emerald-900">${financeStats.ingresos.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex flex-col justify-center">
                         <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Egresos</p>
                            <div className="w-8 h-8 bg-red-200/50 text-red-600 rounded-full flex items-center justify-center"><ArrowDownRight size={16}/></div>
                         </div>
                         <p className="text-3xl font-black text-red-900">${financeStats.egresos.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-center">
                         <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Disponible</p>
                            <div className="w-8 h-8 bg-white/10 text-white rounded-full flex items-center justify-center"><PiggyBank size={16}/></div>
                         </div>
                         <p className="text-3xl font-black text-white">${financeStats.balance.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Tabla de transacciones */}
                   <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">Registro de Movimientos</h3>
                          <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Desde</span>
                                  <input type="date" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-slate-600" value={financeDateFrom} onChange={(e) => setFinanceDateFrom(e.target.value)} />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-[8px] font-black text-slate-400 uppercase ml-1">Hasta</span>
                                  <input type="date" className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-bold text-slate-600" value={financeDateTo} onChange={(e) => setFinanceDateTo(e.target.value)} />
                              </div>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="border-b border-slate-100">
                                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Descripción</th>
                                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase">Categoría</th>
                                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-right">Monto</th>
                                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase text-center w-24">Acción</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredTransactions.length === 0 && (
                                    <tr>
                                      <td colSpan="5" className="p-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Wallet className="text-slate-200" size={32} />
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No hay movimientos en este periodo.</p>
                                      </td>
                                    </tr>
                                  )}
                                  {filteredTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                      <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                                          <td className="p-5 text-xs text-slate-500 font-medium">{t.date}</td>
                                          <td className="p-5 text-sm font-bold text-slate-800">{t.desc}</td>
                                          <td className="p-5">
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{t.category}</span>
                                          </td>
                                          <td className={`p-5 text-sm font-black text-right ${t.type === 'ingreso' ? 'text-emerald-500' : t.type === 'ahorro' ? 'text-blue-500' : 'text-slate-800'}`}>
                                            {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString()}
                                          </td>
                                          <td className="p-5 text-center">
                                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                  <button onClick={() => handleEditTransaction(t)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                                  <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                   </div>
                 </>
               ) : (
                 /* Pestaña de Configuración de Categorías Financieras */
                 <div className="space-y-8 animate-in fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {['ingreso', 'egreso', 'ahorro'].map(type => {
                         const styling = CAT_COLORS[type];
                         const TypeIcon = styling.icon;
                         return (
                           <div key={type} className={`bg-white border ${styling.border} rounded-3xl overflow-hidden shadow-sm flex flex-col`}>
                              <div className={`p-5 border-b ${styling.border} ${styling.bg} flex items-center justify-between`}>
                                 <h4 className={`font-black text-sm uppercase tracking-widest ${styling.text} flex items-center gap-2`}>
                                    <TypeIcon size={18}/> {type}s
                                 </h4>
                              </div>
                              <div className="p-5 space-y-4 flex-1">
                                 <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {financeCategories[type].map(cat => (
                                       <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/cat">
                                          {editingCategory?.oldVal === cat && editingCategory?.type === type ? (
                                             <div className="flex flex-1 items-center gap-2 mr-2">
                                                <input 
                                                  autoFocus
                                                  type="text" 
                                                  className="flex-1 bg-white border border-blue-200 rounded p-1 text-xs font-bold outline-none"
                                                  value={editingCategory.newVal}
                                                  onChange={e => setEditingCategory({...editingCategory, newVal: e.target.value})}
                                                  onKeyDown={e => e.key === 'Enter' && handleSaveEditCategory()}
                                                />
                                                <button onClick={handleSaveEditCategory} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded"><Check size={14}/></button>
                                             </div>
                                          ) : (
                                             <span className="text-xs font-bold text-slate-700">{cat}</span>
                                          )}
                                          
                                          {(!editingCategory || editingCategory.oldVal !== cat) && (
                                             <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingCategory({type, oldVal: cat, newVal: cat})} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"><Edit2 size={12}/></button>
                                                <button onClick={() => handleDeleteFinanceCategory(type, cat)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={12}/></button>
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                                 <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <input 
                                       type="text" 
                                       placeholder={`Nueva categoría...`}
                                       className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400"
                                       value={newCatName.type === type ? newCatName.val : ''}
                                       onChange={e => setNewCatName({ type, val: e.target.value })}
                                       onKeyDown={e => e.key === 'Enter' && handleAddFinanceCategory(type)}
                                    />
                                    <button onClick={() => handleAddFinanceCategory(type)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800"><Plus size={16}/></button>
                                 </div>
                              </div>
                           </div>
                         )
                      })}
                   </div>

                   {/* Accesos Rápidos Financieros */}
                   <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <h4 className="font-black text-sm uppercase tracking-widest text-slate-700 flex items-center gap-2">
                            <LinkIcon size={18}/> Accesos Rápidos (Bancos, Brokers, etc.)
                         </h4>
                      </div>
                      <div className="p-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            {financeLinks.map(link => {
                                const Icon = LINK_ICONS[link.icon] || Globe;
                                return (
                                <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group/link border border-slate-100 hover:border-blue-200 transition-colors">
                                    <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline truncate">
                                       <Icon size={14}/>
                                       <span className="truncate">{link.title}</span>
                                    </a>
                                    <button onClick={() => handleDeleteFinanceLink(link.id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/link:opacity-100 transition-opacity rounded-lg">
                                       <Trash2 size={12}/>
                                    </button>
                                </div>
                            )})}
                            {financeLinks.length === 0 && (
                                <p className="text-xs text-slate-400 italic col-span-full">No hay enlaces guardados.</p>
                            )}
                         </div>
                         
                         <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                            <div className="flex gap-2 flex-wrap">
                                {Object.keys(LINK_ICONS).map(key => {
                                    const Icon = LINK_ICONS[key];
                                    return (
                                        <button 
                                            key={key} 
                                            onClick={() => setNewFinanceLink({...newFinanceLink, icon: key})} 
                                            className={`p-2 rounded-xl border transition-all ${newFinanceLink.icon === key ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'}`}
                                        >
                                            <Icon size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                   type="text" 
                                   placeholder="Nombre (ej: Mi Banco)"
                                   className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-400"
                                   value={newFinanceLink.title}
                                   onChange={e => setNewFinanceLink({ ...newFinanceLink, title: e.target.value })}
                                />
                                <input 
                                   type="text" 
                                   placeholder="URL (ej: https://...)"
                                   className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-400"
                                   value={newFinanceLink.url}
                                   onChange={e => setNewFinanceLink({ ...newFinanceLink, url: e.target.value })}
                                   onKeyDown={e => e.key === 'Enter' && handleAddFinanceLink()}
                                />
                                <button onClick={handleAddFinanceLink} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all">Añadir</button>
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          )}

        </div>
      </main>

      {/* MODALES REUTILIZADOS... */}
      {/* MODAL: CONFIRMACIÓN ELIMINACIÓN SUBCATEGORÍA */}
      {subToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
            </div>
            <div className="text-center space-y-2">
                <h3 className="font-black text-xl text-slate-800">¿Eliminar subcategoría?</h3>
                <p className="text-sm text-slate-500">Esta acción borrará definitivamente <b>"{subToDelete.title}"</b> y todas sus tareas y recursos. No se puede deshacer.</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => handleDeleteSub(subToDelete.id)} 
                className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
              >
                SÍ, ELIMINAR TODO
              </button>
              <button 
                onClick={() => setSubToDelete(null)} 
                className="w-full py-4 font-black text-slate-400 text-xs uppercase tracking-widest hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN ELIMINACIÓN ENTIDAD PRINCIPAL */}
      {entityToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
            </div>
            <div className="text-center space-y-2">
                <h3 className="font-black text-xl text-slate-800">¿Eliminar elemento?</h3>
                <p className="text-sm text-slate-500">Esta acción borrará definitivamente <b>"{entityToDelete.title}"</b> y absolutamente todas las subcategorías, tareas y recursos dentro de él. Esta acción es irreversible.</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => handleDeleteEntity(entityToDelete.id)} 
                className="w-full py-4 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
              >
                SÍ, ELIMINAR TODO
              </button>
              <button 
                onClick={() => setEntityToDelete(null)} 
                className="w-full py-4 font-black text-slate-400 text-xs uppercase tracking-widest hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR ÁREA / CURSO / PROYECTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="font-black text-xl tracking-tight">{editingEntityId ? 'Editar Elemento' : 'Nuevo Elemento'}</h3>
            <div className="space-y-4">
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" placeholder="Nombre..." value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})} />
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm h-24 resize-none" placeholder="Detalles adicionales..." value={newForm.details} onChange={e => setNewForm({...newForm, details: e.target.value})} />
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="Categoría" value={newForm.category} onChange={e => setNewForm({...newForm, category: e.target.value})} />
                <div className="flex gap-2">
                    {Object.keys(ICON_MAP).slice(0, 5).map(key => (
                        <button key={key} onClick={() => setNewForm({...newForm, icon: key})} className={`p-3 rounded-xl border ${newForm.icon === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400'}`}><AreaIcon name={key} size={18} /></button>
                    ))}
                </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setIsModalOpen(false); setEditingEntityId(null); setNewForm({ title: '', category: 'General', icon: 'Folder', details: '' }); }} className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Cancelar</button>
              <button onClick={handleCreateEntity} className="flex-1 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:bg-blue-700">{editingEntityId ? 'ACTUALIZAR' : 'CREAR'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORMULARIO SUBCATEGORIA */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <h3 className="font-black text-xl tracking-tight">Nueva Subcategoría</h3>
            <div className="space-y-4">
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" placeholder="Título..." value={newSubForm.title} onChange={e => setNewSubForm({...newSubForm, title: e.target.value})} />
                <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Título del Objetivo" value={newSubForm.objTitle} onChange={e => setNewSubForm({...newSubForm, objTitle: e.target.value})} />
                    <textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs h-24 resize-none" placeholder="Descripción..." value={newSubForm.objDesc} onChange={e => setNewSubForm({...newSubForm, objDesc: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" value={newSubForm.start} onChange={e => setNewSubForm({...newSubForm, start: e.target.value})} />
                    <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" value={newSubForm.end} onChange={e => setNewSubForm({...newSubForm, end: e.target.value})} />
                </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => setIsSubModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Cancelar</button>
              <button onClick={handleAddSub} className="flex-1 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:bg-blue-700">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR TRANSACCIÓN FINANCIERA */}
      {isFinanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="font-black text-xl tracking-tight">{editingTransactionId ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h3>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
               <button onClick={() => handleTransactionTypeChange('egreso')} className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${newTransaction.type === 'egreso' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}>Egreso</button>
               <button onClick={() => handleTransactionTypeChange('ingreso')} className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${newTransaction.type === 'ingreso' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>Ingreso</button>
               <button onClick={() => handleTransactionTypeChange('ahorro')} className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${newTransaction.type === 'ahorro' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Ahorro</button>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                    <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-xl" placeholder="0.00" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                    <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Ej: Pago de luz, Salario..." value={newTransaction.desc} onChange={e => setNewTransaction({...newTransaction, desc: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                        <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                        <select 
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold cursor-pointer" 
                           value={newTransaction.category} 
                           onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                        >
                           {financeCategories[newTransaction.type]?.map(cat => (
                               <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 pt-2 border-t mt-6">
              <button 
                  onClick={() => { setIsFinanceModalOpen(false); setEditingTransactionId(null); setNewTransaction({ type: 'egreso', amount: '', desc: '', date: new Date().toISOString().split('T')[0], category: financeCategories.egreso[0] }); }} 
                  className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest"
              >
                  Cancelar
              </button>
              <button 
                onClick={handleAddTransaction} 
                disabled={!newTransaction.amount || !newTransaction.desc}
                className={`flex-1 py-4 text-white font-black text-xs uppercase rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:shadow-none ${
                    newTransaction.type === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 
                    newTransaction.type === 'ahorro' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200' : 
                    'bg-red-500 hover:bg-red-600 shadow-red-200'
                }`}
              >
                {editingTransactionId ? 'ACTUALIZAR' : 'GUARDAR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR ANOTACIÓN */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <h3 className="font-black text-xl tracking-tight">Nueva Anotación</h3>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 -mr-2">
                <input 
                    autoFocus
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 font-bold" 
                    placeholder="Título de la anotación..." 
                    value={newNoteTitle} 
                    onChange={e => setNewNoteTitle(e.target.value)}
                />
                <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm h-24 resize-none" 
                    placeholder="Detalles o notas adicionales..." 
                    value={newNoteDetails} 
                    onChange={e => setNewNoteDetails(e.target.value)}
                />
                
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tareas</h4>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Añadir una tarea..." 
                            className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" 
                            value={newNoteTaskInput} 
                            onChange={(e) => setNewNoteTaskInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTaskToNewNote()}
                        />
                        <button onClick={handleAddTaskToNewNote} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {newNoteTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg group">
                                <span className="text-xs flex-1 font-medium text-slate-700">{task.title}</span>
                                <button onClick={() => handleRemoveTaskFromNewNote(task.id)} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {newNoteTasks.length === 0 && (
                            <p className="text-center text-[10px] text-slate-400 italic py-4">Aún no has añadido tareas.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button onClick={closeNewNoteModal} className="flex-1 py-4 font-black text-slate-400 text-xs uppercase tracking-widest">Cancelar</button>
              <button onClick={handleAddNote} className="flex-1 py-4 bg-blue-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50" disabled={!newNoteTitle.trim()}>CREAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

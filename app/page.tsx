"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus, Search, Trash2, Edit2, Users, SlidersHorizontal,
  Loader2, Sparkles, GraduationCap, ChevronUp, ChevronDown,
  CheckSquare, Square, AlertTriangle, X, ChevronRight,
  TrendingUp, Activity, Shield, Zap, ArrowUpDown, RefreshCw,
  BarChart2, Filter
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = "name" | "age" | "email" | "active";
type SortDir = "asc" | "desc";

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GROUP_COLORS = [
  { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-400", text: "text-blue-400", glow: "shadow-blue-500/20", ring: "ring-blue-500/30" },
  { bg: "bg-violet-500/10", border: "border-violet-500/30", dot: "bg-violet-400", text: "text-violet-400", glow: "shadow-violet-500/20", ring: "ring-violet-500/30" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/30", dot: "bg-cyan-400", text: "text-cyan-400", glow: "shadow-cyan-500/20", ring: "ring-cyan-500/30" },
  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-500/20", ring: "ring-emerald-500/30" },
  { bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400", text: "text-amber-400", glow: "shadow-amber-500/20", ring: "ring-amber-500/30" },
  { bg: "bg-rose-500/10", border: "border-rose-500/30", dot: "bg-rose-400", text: "text-rose-400", glow: "shadow-rose-500/20", ring: "ring-rose-500/30" },
];

function getGroupColor(idx: number) {
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <div className={`relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden group hover:border-white/[0.1] transition-all duration-300`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${color} blur-3xl`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <div className={`p-1.5 rounded-lg ${color.replace("bg-", "bg-").replace("/5", "/10")}`}>
            <Icon className={`h-3.5 w-3.5 ${color.includes("blue") ? "text-blue-400" : color.includes("emerald") ? "text-emerald-400" : color.includes("amber") ? "text-amber-400" : "text-violet-400"}`} />
          </div>
        </div>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-white tracking-tight"
        >
          {value}
        </motion.p>
        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{sub}</p>
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, currentKey, dir, onSort }: {
  label: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir; onSort: (k: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="py-3.5 px-5 text-left cursor-pointer select-none group"
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
        {label}
        <span className={`transition-all duration-150 ${active ? "text-blue-400" : "text-slate-700 group-hover:text-slate-500"}`}>
          {active ? (dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
        </span>
      </span>
    </th>
  );
}

function AgeBar({ age }: { age: number }) {
  const pct = Math.min((age / 40) * 100, 100);
  const color = age < 20 ? "bg-blue-500" : age < 30 ? "bg-emerald-500" : age < 35 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-slate-300 w-6 text-right text-xs">{age}</span>
      <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden max-w-[48px]">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/30 rounded-lg px-2 py-1 backdrop-blur-sm"
    >
      <AlertTriangle className="h-3 w-3 text-rose-400 flex-shrink-0" />
      <span className="text-[10px] text-rose-300 font-bold whitespace-nowrap">Sure?</span>
      <button onClick={onConfirm} className="ml-1 text-[10px] font-black text-rose-400 hover:text-white transition-colors">Yes</button>
      <span className="text-rose-700">/</span>
      <button onClick={onCancel} className="text-[10px] font-black text-slate-500 hover:text-white transition-colors">No</button>
    </motion.div>
  );
}

function ExpandedRow({ student, group, color }: { student: Students; group?: Group; color: typeof GROUP_COLORS[0] }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <td colSpan={8} className="px-5 pb-3 pt-0">
        <div className={`rounded-xl border ${color.border} ${color.bg} p-4 grid grid-cols-2 md:grid-cols-4 gap-4`}>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
            <p className="text-sm font-bold text-white">{student.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
            <p className="text-xs font-mono text-slate-300 break-all">{student.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Group</p>
            <p className={`text-sm font-bold ${color.text}`}>{group?.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Student ID</p>
            <p className="text-xs font-mono text-slate-500">#{String(student.id).padStart(6, "0")}</p>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdvancedDashboard() {
  const [activeModal, setActiveModal] = useState<"group" | "student" | null>(null);
  const [students, setStudents] = useState<Students[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 180);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [groupName, setGroupName] = useState("");
  const [studentForm, setStudentForm] = useState({
    name: "", age: "" as number | "", email: "", groupId: 0, active: false
  });
  const [editingStudent, setEditingStudent] = useState<Students | null>(null);

  const supabase = createClient();
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setActiveModal("student");
      }
      if (e.key === "Escape") {
        closeStudentModal();
        setPendingDeleteId(null);
        setPendingBulkDelete(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    const [sr, gr] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("groups").select("*"),
    ]);
    if (sr.data) setStudents(sr.data);
    if (gr.data) {
      setGroups(gr.data);
      if (gr.data.length > 0 && studentForm.groupId === 0) {
        setStudentForm(p => ({ ...p, groupId: gr.data[0].id }));
      }
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const groupMap = useMemo(() => new Map(groups.map((g, i) => [g.id, { group: g, color: getGroupColor(i) }])), [groups]);

  const { filteredStudents, groupCounts, activeCount } = useMemo(() => {
    const counts: Record<number, number> = {};
    let activeCount = 0;
    students.forEach(s => {
      counts[s.groupId] = (counts[s.groupId] || 0) + 1;
      if (s.active) activeCount++;
    });

    const q = debouncedSearch.toLowerCase();
    let filtered = students.filter(s => {
      const matchesGroup = selectedGroupId ? s.groupId === selectedGroupId : true;
      const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });

    filtered = [...filtered].sort((a, b) => {
      let av: string | number |boolean = a[sortKey] ?? "";
      let bv: string | number | boolean = b[sortKey] ?? "";
      if (typeof av === "boolean") av = av ? 1 : 0;
      if (typeof bv === "boolean") bv = bv ? 1 : 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return { filteredStudents: filtered, groupCounts: counts, activeCount };
  }, [students, selectedGroupId, debouncedSearch, sortKey, sortDir]);

  const activeRate = students.length > 0 ? Math.round((activeCount / students.length) * 100) : 0;

  // ── Sorting ────────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredStudents.map(s => s.id)));
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleAddGroup = async () => {
    if (!groupName.trim()) return;
    const tempId = Date.now();
    const tempGroup: Group = { id: tempId, name: groupName };
    setGroups(p => [...p, tempGroup]);
    setGroupName("");
    setActiveModal(null);
    const { data, error } = await supabase.from("groups").insert({ name: tempGroup.name }).select();
    if (error) setGroups(p => p.filter(g => g.id !== tempId));
    else if (data) setGroups(p => p.map(g => g.id === tempId ? data[0] : g));
  };

  const handleSaveStudent = async () => {
    if (!studentForm.name || !studentForm.email || !studentForm.groupId) return;
    const isEditing = !!editingStudent;
    const targetId = isEditing ? editingStudent!.id : Date.now();
    const payload: Students = {
      id: targetId, name: studentForm.name,
      age: Number(studentForm.age) || 0,
      email: studentForm.email, groupId: studentForm.groupId, active: studentForm.active
    };
    const backup = [...students];
    setStudents(p => isEditing ? p.map(s => s.id === targetId ? payload : s) : [...p, payload]);
    closeStudentModal();
    const res = isEditing
      ? await supabase.from("students").update({ ...studentForm, age: Number(studentForm.age) }).eq("id", targetId).select()
      : await supabase.from("students").insert({ ...studentForm, age: Number(studentForm.age) }).select();
    if (res.error) { setStudents(backup); }
    else if (res.data && !isEditing) setStudents(p => p.map(s => s.id === targetId ? res.data[0] : s));
  };

  const handleDeleteStudent = async (id: number) => {
    const backup = [...students];
    setStudents(p => p.filter(s => s.id !== id));
    setPendingDeleteId(null);
    setSelectedIds(p => { const n = new Set(p); n.delete(id); return n; });
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) setStudents(backup);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const backup = [...students];
    setStudents(p => p.filter(s => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    setPendingBulkDelete(false);
    const { error } = await supabase.from("students").delete().in("id", ids);
    if (error) setStudents(backup);
  };

  const handleToggleActive = async (student: Students) => {
    const updated = { ...student, active: !student.active };
    setStudents(p => p.map(s => s.id === student.id ? updated : s));
    const { error } = await supabase.from("students").update({ active: updated.active }).eq("id", student.id);
    if (error) setStudents(p => p.map(s => s.id === student.id ? student : s));
  };

  const startEdit = (student: Students) => {
    setEditingStudent(student);
    setStudentForm({ name: student.name, age: student.age, email: student.email, groupId: student.groupId, active: student.active });
    setActiveModal("student");
  };

  const closeStudentModal = () => {
    setActiveModal(null);
    setEditingStudent(null);
    setStudentForm({ name: "", age: "", email: "", groupId: groups[0]?.id || 0, active: false });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#04070f] text-slate-100 antialiased selection:bg-blue-500/30">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] bg-cyan-600/[0.02] rounded-full blur-3xl -translate-x-1/2" />
      </div>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#04070f]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-md" />
              <div className="relative p-2 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white">NEXUS<span className="text-blue-400">Academy</span></h1>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">Management OS</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-white/[0.06] mx-1" />

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search students…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 pl-9 pr-3 text-xs text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/60 focus:bg-white/[0.04] focus:ring-2 focus:ring-blue-500/10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Keyboard hint */}
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-600 font-mono bg-white/[0.03] border border-white/[0.05] px-2 py-1 rounded-lg">
              <kbd>Ctrl</kbd><span>+</span><kbd>K</kbd>
            </span>

            <button
              onClick={() => fetchData(true)}
              className={`p-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all ${isRefreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveModal("group")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.06] transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-slate-500" /> Group
            </button>
            <button
              onClick={() => setActiveModal("student")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Student
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6 relative">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Students" value={students.length} sub="across all groups" color="bg-blue-500/5" />
          <StatCard icon={Activity} label="Active Rate" value={`${activeRate}%`} sub={`${activeCount} currently active`} color="bg-emerald-500/5" />
          <StatCard icon={BarChart2} label="Groups" value={groups.length} sub="class segments" color="bg-violet-500/5" />
          <StatCard icon={TrendingUp} label="Showing" value={filteredStudents.length} sub="matching current filter" color="bg-amber-500/5" />
        </div>

        <LayoutGroup>
          {/* ── Group Filter Grid ── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest inline-flex items-center gap-2">
                <Filter className="h-3 w-3" /> Filter by Group
              </span>
              {selectedGroupId && (
                <button onClick={() => setSelectedGroupId(null)} className="text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors inline-flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
            </div>

            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                ))
              ) : (
                groups.map((g) => {
                  const count = groupCounts[g.id] || 0;
                  const isSelected = selectedGroupId === g.id;
                  const gm = groupMap.get(g.id);
                  const color = gm?.color || GROUP_COLORS[0];
                  return (
                    <motion.div
                      key={g.id}
                      layout
                      onClick={() => setSelectedGroupId(isSelected ? null : g.id)}
                      className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden group ${isSelected
                          ? `${color.border} ${color.bg} shadow-lg ${color.glow} ring-1 ${color.ring}`
                          : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08]"
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mb-2 ${isSelected ? color.dot : "bg-white/10"}`} />
                      <p className={`text-xs font-bold truncate transition-colors ${isSelected ? color.text : "text-slate-400 group-hover:text-white"}`}>{g.name}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-medium">{count} students</p>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </div>

          {/* ── Bulk action bar ── */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 bg-blue-950/60 border border-blue-500/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300">{selectedIds.size} student{selectedIds.size > 1 ? "s" : ""} selected</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-500 hover:text-white font-bold transition-colors">Deselect all</button>
                    <AnimatePresence mode="wait">
                      {pendingBulkDelete ? (
                        <DeleteConfirm key="confirm" onConfirm={handleBulkDelete} onCancel={() => setPendingBulkDelete(false)} />
                      ) : (
                        <motion.button
                          key="delete"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setPendingBulkDelete(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Trash2 className="h-3 w-3" /> Delete selected
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Registry table ── */}
          <div className="bg-white/[0.01] border border-white/[0.05] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Registry</h2>
                {isRefreshing && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              </div>
              <div className="flex items-center gap-3">
                {(debouncedSearch || selectedGroupId) && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> Filtered
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-600 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md">
                  {filteredStudents.length} / {students.length} rows
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-xs text-slate-600 font-medium">Loading registry…</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                      <th className="py-3 px-5 w-10">
                        <button onClick={toggleAll} className="text-slate-600 hover:text-white transition-colors">
                          {selectedIds.size === filteredStudents.length && filteredStudents.length > 0
                            ? <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                            : <Square className="h-3.5 w-3.5" />}
                        </button>
                      </th>
                      <th className="py-3 px-5 w-10 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">#</th>
                      <SortHeader label="Name" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Age" sortKey="age" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Email" sortKey="email" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <th className="py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Group</th>
                      <SortHeader label="Status" sortKey="active" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <th className="py-3 px-5 text-right text-[10px] font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-sm">
                    <AnimatePresence mode="popLayout">
                      {filteredStudents.length === 0 ? (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={8} className="py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <svg className="w-12 h-12 text-slate-800" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                                <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                              </svg>
                              <p className="text-xs text-slate-600 font-medium">No students match your current filter</p>
                              <button
                                onClick={() => { setSearchQuery(""); setSelectedGroupId(null); }}
                                className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors"
                              >
                                Clear all filters
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const gm = groupMap.get(student.groupId);
                          const color = gm?.color || GROUP_COLORS[0];
                          const isSelected = selectedIds.has(student.id);
                          const isExpanded = expandedId === student.id;
                          const isPendingDelete = pendingDeleteId === student.id;
                          return (
                            <>
                              <motion.tr
                                key={student.id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 400, damping: 35, delay: idx * 0.02 }}
                                className={`group/row transition-colors cursor-pointer ${isSelected ? "bg-blue-500/[0.03]" : isExpanded ? "bg-white/[0.02]" : "hover:bg-white/[0.015]"
                                  }`}
                                onClick={() => setExpandedId(isExpanded ? null : student.id)}
                              >
                                {/* Checkbox */}
                                <td className="py-3.5 px-5" onClick={(e) => { e.stopPropagation(); toggleSelect(student.id); }}>
                                  {isSelected
                                    ? <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                                    : <Square className="h-3.5 w-3.5 text-slate-700 group-hover/row:text-slate-500 transition-colors" />}
                                </td>

                                {/* Index */}
                                <td className="py-3.5 px-5 text-center">
                                  <span className="text-[10px] font-mono text-slate-700">{String(idx + 1).padStart(2, "0")}</span>
                                </td>

                                {/* Name */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${color.bg} ${color.text} flex-shrink-0`}>
                                      {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-white">{student.name}</span>
                                    <ChevronRight className={`h-3 w-3 text-slate-700 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                                  </div>
                                </td>

                                {/* Age bar */}
                                <td className="py-3.5 px-5">
                                  <AgeBar age={student.age} />
                                </td>

                                {/* Email */}
                                <td className="py-3.5 px-5">
                                  <span className="text-xs font-mono text-slate-500">{student.email}</span>
                                </td>

                                {/* Group badge */}
                                <td className="py-3.5 px-5">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${color.bg} ${color.border} ${color.text}`}>
                                    <span className={`w-1 h-1 rounded-full ${color.dot}`} />
                                    {gm?.group.name || "—"}
                                  </span>
                                </td>

                                {/* Status toggle */}
                                <td className="py-3.5 px-5" onClick={(e) => { e.stopPropagation(); handleToggleActive(student); }}>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${student.active
                                      ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/15 hover:bg-emerald-500/10"
                                      : "bg-white/[0.02] text-slate-600 border-white/[0.04] hover:bg-white/[0.05] hover:text-slate-400"
                                    }`}>
                                    <span className={`w-1 h-1 rounded-full ${student.active ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
                                    {student.active ? "Active" : "Inactive"}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end items-center gap-1">
                                    <AnimatePresence mode="wait">
                                      {isPendingDelete ? (
                                        <DeleteConfirm
                                          key="confirm"
                                          onConfirm={() => handleDeleteStudent(student.id)}
                                          onCancel={() => setPendingDeleteId(null)}
                                        />
                                      ) : (
                                        <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150">
                                          <button
                                            onClick={() => startEdit(student)}
                                            className="p-1.5 hover:bg-amber-500/10 text-slate-600 hover:text-amber-400 rounded-lg transition-colors"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => setPendingDeleteId(student.id)}
                                            className="p-1.5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </td>
                              </motion.tr>

                              {/* Expanded detail row */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <ExpandedRow key={`exp-${student.id}`} student={student} group={gm?.group} color={color} />
                                )}
                              </AnimatePresence>
                            </>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>

            {/* Table footer */}
            {!isLoading && filteredStudents.length > 0 && (
              <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between bg-white/[0.005]">
                <span className="text-[10px] text-slate-700 font-mono">
                  Sorted by <span className="text-slate-500 font-bold">{sortKey}</span> · {sortDir === "asc" ? "↑ ascending" : "↓ descending"}
                </span>
                <span className="text-[10px] text-slate-700 font-mono">
                  Click row to expand · Click status to toggle
                </span>
              </div>
            )}
          </div>
        </LayoutGroup>
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeStudentModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
              className="relative w-full max-w-md bg-[#0a0f1e] border border-white/[0.07] rounded-2xl shadow-2xl z-10 overflow-hidden"
            >
              {/* Modal top accent */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              <div className="p-6">
                {activeModal === "group" ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-black text-white flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-400" /> New Group
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">Create a new class segment</p>
                      </div>
                      <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-600 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                      type="text"
                      placeholder="Group name…"
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-700"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">Cancel</button>
                      <button onClick={handleAddGroup} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-600/20">
                        Create Group
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-black text-white">{editingStudent ? "Edit Student" : "Add Student"}</h2>
                        <p className="text-xs text-slate-600 mt-0.5">{editingStudent ? "Update student details" : "Register a new student"}</p>
                      </div>
                      <button onClick={closeStudentModal} className="p-1.5 text-slate-600 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Full Name</label>
                        <input
                          autoFocus={!editingStudent}
                          value={studentForm.name}
                          onChange={(e) => setStudentForm(p => ({ ...p, name: e.target.value }))}
                          type="text"
                          placeholder="John Doe"
                          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-700"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Age</label>
                          <input
                            value={studentForm.age}
                            onChange={(e) => setStudentForm(p => ({ ...p, age: e.target.value !== "" ? Number(e.target.value) : "" }))}
                            type="number"
                            placeholder="22"
                            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Group</label>
                          <select
                            className="w-full rounded-xl border border-white/[0.07] bg-[#0a0f1e] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/60"
                            value={studentForm.groupId}
                            onChange={(e) => setStudentForm(p => ({ ...p, groupId: Number(e.target.value) }))}
                          >
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Email</label>
                        <input
                          value={studentForm.email}
                          onChange={(e) => setStudentForm(p => ({ ...p, email: e.target.value }))}
                          type="email"
                          placeholder="john@example.com"
                          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.01] px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-400">Active Status</p>
                        <p className="text-[10px] text-slate-700 mt-0.5">Mark as currently enrolled</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studentForm.active}
                          onChange={(e) => setStudentForm(p => ({ ...p, active: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4" />
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button onClick={closeStudentModal} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-white transition-colors rounded-xl hover:bg-white/[0.05]">Cancel</button>
                      <button
                        onClick={handleSaveStudent}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
                      >
                        {editingStudent ? "Save Changes" : "Add Student"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


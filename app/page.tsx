"use client"

import { useEffect, useState, useMemo, startTransition } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus, Search, Trash2, Edit2, Users, CheckCircle2,
  XCircle, SlidersHorizontal, Loader2, Sparkles, GraduationCap
} from "lucide-react";

// Simple, performant debounce hook for enterprise filtering
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdvancedDashboard() {
  // UI Control States
  const [activeModal, setActiveModal] = useState<"group" | "student" | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Server Data Sync
  const [students, setStudents] = useState<Students[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Interactive Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Form States
  const [groupName, setGroupName] = useState("");
  const [studentForm, setStudentForm] = useState({
    name: "",
    age: "" as number | "",
    email: "",
    groupId: 0,
    active: false
  });
  const [editingStudent, setEditingStudent] = useState<Students | null>(null);

  const supabase = createClient();

  // Initial High-Speed Fetch
  useEffect(() => {
    async function initData() {
      const [studentsRes, groupsRes] = await Promise.all([
        supabase.from("students").select("*"),
        supabase.from("groups").select("*")
      ]);
      if (studentsRes.data) setStudents(studentsRes.data);
      if (groupsRes.data) {
        setGroups(groupsRes.data);
        if (groupsRes.data.length > 0) {
          setStudentForm(prev => ({ ...prev, groupId: groupsRes.data[0].id }));
        }
      }
    }
    initData();
  }, []);

  // Performance Optimization: Memoized pipeline prevents layout thrashing
  const { filteredStudents, groupCounts } = useMemo(() => {
    const counts = students.reduce((acc, s) => {
      acc[s.groupId] = (acc[s.groupId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const filtered = students.filter((student) => {
      const matchesGroup = selectedGroupId ? student.groupId === selectedGroupId : true;
      const matchesSearch = student.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesGroup && matchesSearch;
    });

    return { filteredStudents: filtered, groupCounts: counts };
  }, [students, selectedGroupId, debouncedSearch]);

  // --- OPTIMISTIC ARCHITECTURE WRAPPERS ---

  const handleAddGroup = async () => {
    if (!groupName.trim()) return;

    const referenceId = Date.now(); // Temp ID for layout engine
    const temporaryGroup: Group = { id: referenceId, name: groupName };

    // UI snaps instantly
    setGroups(prev => [...prev, temporaryGroup]);
    setGroupName("");
    setActiveModal(null);

    const { data, error } = await supabase.from("groups").insert({ name: temporaryGroup.name }).select();

    if (error) {
      // Revert instantly on network/DB crash
      setGroups(prev => prev.filter(g => g.id !== referenceId));
      alert("Database Synchronization Failed.");
    } else if (data) {
      // Swap temp ID out smoothly behind the scenes
      setGroups(prev => prev.map(g => g.id === referenceId ? data[0] : g));
    }
  };

  const handleSaveStudent = async () => {
    if (!studentForm.name || !studentForm.email || !studentForm.groupId) return;

    const isEditing = !!editingStudent;
    const targetId = isEditing ? editingStudent!.id : Date.now();

    const structuralStudent: Students = {
      id: targetId,
      name: studentForm.name,
      age: Number(studentForm.age) || 0,
      email: studentForm.email,
      groupId: studentForm.groupId,
      active: studentForm.active
    };

    const backupState = [...students];

    // Optimistic UI Swap
    setStudents(prev => {
      if (isEditing) {
        return prev.map(s => s.id === targetId ? structuralStudent : s);
      }
      return [...prev, structuralStudent];
    });

    closeStudentModal();

    const response = isEditing
      ? await supabase.from("students").update({ ...studentForm, age: Number(studentForm.age) }).eq("id", targetId).select()
      : await supabase.from("students").insert({ ...studentForm, age: Number(studentForm.age) }).select();

    if (response.error) {
      setStudents(backupState); // Rollback
      alert("Error processing transaction.");
    } else if (response.data && !isEditing) {
      // Swap temporary payload ID for real production DB index key
      setStudents(prev => prev.map(s => s.id === targetId ? response.data[0] : s));
    }
  };

  const handleDeleteStudent = async (id: number) => {
    const backupState = [...students];
    // Immediate clean layout contraction animation triggers
    setStudents(prev => prev.filter(s => s.id !== id));

    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      setStudents(backupState); // Graceful fallback
      alert("Could not remove record from the cloud engine.");
    }
  };

  const startEdit = (student: Students) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name,
      age: student.age,
      email: student.email,
      groupId: student.groupId,
      active: student.active
    });
    setActiveModal("student");
  };

  const closeStudentModal = () => {
    setActiveModal(null);
    setEditingStudent(null);
    setStudentForm({ name: "", age: "", email: "", groupId: groups[0]?.id || 0, active: false });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-blue-500/30">

      {/* Dynamic Glassmorphic Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090d16]/70 p-4 backdrop-blur-xl px-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">EduCore OS</h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase">Institutional Core</p>
          </div>
        </div>

        {/* Neural search interface wrapper */}
        <div className="relative flex-1 max-w-lg mx-0 md:mx-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Query string lookup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/80 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal("group")}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200 transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <Plus className="h-4 w-4 text-slate-400" /> Group
          </button>
          <button
            onClick={() => setActiveModal("student")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Student
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        {/* Class Groups Segment Grid Layout System */}
        <LayoutGroup>
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest inline-flex items-center gap-2">
                <SlidersHorizontal className="h-3 w-3" /> Filter Matrix
              </span>
              {selectedGroupId && (
                <button
                  onClick={() => setSelectedGroupId(null)}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  Clear Selection Filter
                </button>
              )}
            </div>

            <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {groups.map((g) => {
                const count = groupCounts[g.id] || 0;
                const isSelected = selectedGroupId === g.id;

                return (
                  <motion.div
                    key={g.id}
                    layout
                    onClick={() => setSelectedGroupId(isSelected ? null : g.id)}
                    className={`relative p-5 rounded-2xl border cursor-pointer group transition-all duration-300 overflow-hidden ${isSelected
                        ? "border-blue-500 bg-blue-500/[0.04] shadow-xl shadow-blue-500/5"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]"
                      }`}
                  >
                    <div className="flex justify-between items-start z-10 relative">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{g.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> {count} Allocated
                        </p>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? "bg-blue-500 ring-4 ring-blue-500/20" : "bg-white/10"}`} />
                    </div>
                    {/* Abstract Grid background glow element */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300" />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Core Institutional Student Registry Table Section */}
          <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-400">Registry Ledger</h2>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
              </div>
              <span className="text-[11px] font-mono tracking-tight bg-white/[0.06] text-slate-400 font-bold px-2.5 py-0.5 rounded-md">
                DATALINK ACTIVE ({filteredStudents.length} rows)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-white/[0.01]">
                    <th className="py-4 px-6 w-16 text-center">Idx</th>
                    <th className="py-4 px-6">Identity Parameter</th>
                    <th className="py-4 px-6 text-center w-24">Age</th>
                    <th className="py-4 px-6">Network Endpoint Address</th>
                    <th className="py-4 px-6 text-center w-32">Status Flag</th>
                    <th className="py-4 px-6 text-right w-32">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300 font-medium">
                  <AnimatePresence mode="popLayout">
                    {filteredStudents.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={6} className="text-center py-16 text-slate-600 font-normal">
                          No nodes match the active querying filters.
                        </td>
                      </motion.tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          className="hover:bg-white/[0.02] group/row transition-colors"
                        >
                          <td className="py-4 px-6 text-center text-slate-600 font-mono text-xs">{index + 1}</td>
                          <td className="py-4 px-6 font-semibold text-white tracking-wide">{student.name}</td>
                          <td className="py-4 px-6 text-center text-slate-400 font-mono">{student.age}</td>
                          <td className="py-4 px-6 text-slate-500 font-normal font-mono text-xs">{student.email}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${student.active
                                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
                                : "bg-white/[0.02] text-slate-500 border-white/[0.04]"
                              }`}>
                              <span className={`w-1 h-1 rounded-full ${student.active ? "bg-emerald-400" : "bg-slate-600"}`} />
                              {student.active ? "ACTIVE" : "DISALIGNED"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={() => startEdit(student)}
                                className="p-2 hover:bg-white/[0.06] text-slate-500 hover:text-amber-400 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </LayoutGroup>
      </main>

      {/* --- PURE CUSTOM FRAME MOTION MODAL ENGINE OVERLAYS --- */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeStudentModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Window Panel Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-[#0e1424] border border-white/[0.08] rounded-2xl p-6 shadow-2xl z-10 overflow-hidden"
            >
              {activeModal === "group" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" /> Segment Allocation</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Spawns a custom processing class tier block.</p>
                  </div>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    type="text"
                    placeholder="Engineering Phase Alpha"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-700"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleAddGroup} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all">Instantiate</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{editingStudent ? "Modify Dynamic Profile" : "Append Core Registry Entry"}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Update indexing parameters for student data schema updates.</p>
                  </div>

                  <div className="space-y-3">
                    <input value={studentForm.name} onChange={(e) => setStudentForm(p => ({ ...p, name: e.target.value }))} type="text" placeholder="Full name identifier" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-700" />
                    <input value={studentForm.age} onChange={(e) => setStudentForm(p => ({ ...p, age: e.target.value !== "" ? Number(e.target.value) : "" }))} type="number" placeholder="Age parameter" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-700" />
                    <input value={studentForm.email} onChange={(e) => setStudentForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="Interface routing address (Email)" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-700" />
                  </div>

                  <div className="flex items-center justify-between border border-white/[0.04] rounded-xl p-3 bg-white/[0.01]">
                    <span className="text-xs font-bold text-slate-400">System Activity Flag</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={studentForm.active} onChange={(e) => setStudentForm(p => ({ ...p, active: e.target.checked }))} className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Database Node Path</label>
                    <select
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0e1424] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-blue-500"
                      value={studentForm.groupId}
                      onChange={(e) => setStudentForm(p => ({ ...p, groupId: Number(e.target.value) }))}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={closeStudentModal} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">Abort</button>
                    <button onClick={handleSaveStudent} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all">
                      {editingStudent ? "Re-index Cluster" : "Commit Matrix"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


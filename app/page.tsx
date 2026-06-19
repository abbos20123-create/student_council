"use client"

import { useEffect, useState } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";
import Rodal from "rodal";
import 'rodal/lib/rodal.css';
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Edit2, Users, CheckCircle, XCircle } from "lucide-react";

export default function Home() {
  const [groupModal, setGroupModal] = useState(false);
  const [studentModal, setStudentModal] = useState(false);

  const [students, setStudents] = useState<Students[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [groupName, setGroupName] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState<number>(0);
  const [active, setActive] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Students | null>(null);

  const supabase = createClient();

  useEffect(() => {
    getStudents();
    getGroups();
  }, []);

  useEffect(() => {
    if (groups.length > 0 && !groupId) {
      setGroupId(groups[0].id);
    }
  }, [groups, groupId]);

  const getStudents = async () => {
    const { data, error } = await supabase.from("students").select("*");
    if (error) console.error("Error fetching students:", error);
    if (data) setStudents(data);
  };

  const getGroups = async () => {
    const { data, error } = await supabase.from("groups").select("*");
    if (error) console.error("Error fetching groups:", error);
    if (data) setGroups(data);
  };

  const addGroup = async () => {
    if (!groupName.trim()) return;
    const { data, error } = await supabase.from("groups").insert({ name: groupName }).select();

    if (error) {
      console.error("Error adding group:", error);
      return;
    }

    if (data) {
      setGroups([...groups, data[0]]);
      setGroupName("");
      setGroupModal(false);
    }
  };

  const saveStudent = async () => {
    if (!name || !email || !groupId) {
      alert("Please fill in all student details.");
      return;
    }

    let response;

    if (editingStudent) {
      response = await supabase
        .from("students")
        .update({
          name,
          age: Number(age),
          email,
          groupId,
          active,
        })
        .eq("id", editingStudent.id)
        .select();
    } else {
      response = await supabase
        .from("students")
        .insert({
          name,
          age: Number(age),
          email,
          groupId,
          active,
        })
        .select();
    }

    const { data, error } = response;

    if (error) {
      console.log(error);
      return;
    }

    if (editingStudent) {
      setStudents(
        students.map((student) =>
          student.id === editingStudent.id ? data[0] : student
        )
      );
    } else {
      setStudents([...students, data[0]]);
    }

    setEditingStudent(null);
    setName("");
    setAge("");
    setEmail("");
    setActive(false);
    setStudentModal(false);
  };

  const startEdit = (student: Students) => {
    setEditingStudent(student);
    setName(student.name);
    setAge(student.age);
    setEmail(student.email);
    setGroupId(student.groupId);
    setActive(student.active);
    setStudentModal(true);
  };

  const deleteStudent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) {
      console.error("Error deleting student:", error);
      return;
    }

    setStudents(students.filter((student) => student.id !== id));
  };

  const closeStudentModal = () => {
    setStudentModal(false);
    setEditingStudent(null);
    setName("");
    setAge("");
    setEmail("");
    setActive(false);
  };

  const filteredStudents = students.filter((student) => {
    const matchesGroup = selectedGroupId ? student.groupId === selectedGroupId : true;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-500/20">
      <nav className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white/80 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`px-5 py-2.5 rounded-xl font-semibold tracking-wide text-sm border transition-all duration-200 ${selectedGroupId === null
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            All Students
          </button>
        </div>

        <div className="relative flex-1 max-w-md mx-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            onClick={() => setGroupModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Group
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:bg-blue-700 active:scale-95"
            onClick={() => setStudentModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">

        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Class Groups</h2>
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((g: Group) => {
              const studentCount = students.filter((s) => s.groupId === g.id).length;
              const isSelected = selectedGroupId === g.id;

              return (
                <motion.div
                  key={g.id}
                  layoutId={`group-card-${g.id}`}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGroupId(isSelected ? null : g.id)}
                  className={`group relative flex flex-col justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                      ? "border-blue-500 bg-white shadow-xl shadow-blue-500/5"
                      : "border-white bg-white shadow-sm hover:shadow-md"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {g.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-400 mt-1 inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {studentCount} student{studentCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="pointer-events-none">
                      <div className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${isSelected ? 'bg-blue-500' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isSelected ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-500">Student Roster</h2>
            <span className="text-xs bg-slate-200/60 text-slate-600 font-bold px-2.5 py-1 rounded-full">
              {filteredStudents.length} Results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="py-4 px-6 w-16 text-center">№</th>
                  <th className="py-4 px-6">Fullname</th>
                  <th className="py-4 px-6 w-24 text-center">Age</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6 w-32 text-center">Status</th>
                  <th className="py-4 px-6 w-32 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                <AnimatePresence mode="popLayout">
                  {filteredStudents.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-normal">
                        No students found matching the criteria.
                      </td>
                    </motion.tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-4 px-6 text-center text-slate-400 font-normal">{index + 1}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{student.name}</td>
                        <td className="py-4 px-6 text-center text-slate-600">{student.age}</td>
                        <td className="py-4 px-6 text-slate-500 font-normal">{student.email}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${student.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                            }`}>
                            {student.active ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {student.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => startEdit(student)}
                              className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                              title="Edit Student"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
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
      </main>

      
      <Rodal visible={groupModal} onClose={() => setGroupModal(false)} customStyles={{ width: "400px", height: "240px", borderRadius: "20px", padding: "24px" }}>
        <div className="flex flex-col gap-4 text-slate-900">
          <div>
            <h2 className="text-xl font-bold">Create Group</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a new class section segment.</p>
          </div>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            type="text"
            placeholder="e.g. Computer Science 101"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white"
          />
          <button onClick={addGroup} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95 mt-1">
            Create Group
          </button>
        </div>
      </Rodal>

      <Rodal visible={studentModal} onClose={closeStudentModal} customStyles={{ width: "420px", height: "480px", borderRadius: "20px", padding: "24px" }}>
        <div className="flex flex-col gap-4 text-slate-900">
          <div>
            <h2 className="text-xl font-bold">{editingStudent ? "Edit Student Profile" : "Register Student"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill out registration details correctly.</p>
          </div>

          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white" />
            <input value={age} onChange={(e) => setAge(e.target.value !== "" ? Number(e.target.value) : "")} type="number" placeholder="Age" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-slate-50/50 focus:bg-white" />
          </div>

          <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50/30">
            <span className="text-sm font-semibold text-slate-600">Active Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Group</label>
            <select className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white" value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={saveStudent} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95 mt-2">
            {editingStudent ? "Save Changes" : "Register Student"}
          </button>
        </div>
      </Rodal>
    </div>
  );
}


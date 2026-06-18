"use client"

import { useEffect, useState } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";
import Rodal from "rodal";
import 'rodal/lib/rodal.css'

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

  const supabase = createClient()


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
  


  const closeStudentModal = () =>{
    setStudentModal(false);
    setEditingStudent(null);

    setName("");
    setAge("");
    setEmail("");
    setActive(false);
  }



const filteredStudents = students.filter((student) => {
    const matchesGroup = selectedGroupId ? student.groupId === selectedGroupId : true;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });


  return (
    <div>
      <nav className="flex items-center justify-between border-b p-4">
        <div
          className="w-20 h-14 border rounded-xl flex items-center justify-center font-bold text-blue-500 cursor-pointer"
          onClick={() => setSelectedGroupId(null)}
        >
          ALL
        </div>

        <input
          type="text"
          placeholder="Search by student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-96 border rounded-xl px-4 py-3 text-center text-black"
        />

        <div className="flex gap-4">
          <button
            className="px-5 py-3 border cursor-pointer border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50"
            onClick={() => setGroupModal(true)}
          >
            Add Group
          </button>

          <button
            className="px-5 cursor-pointer py-3 border border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50"
            onClick={() => setStudentModal(true)}
          >
            Add Student
          </button>
        </div>
      </nav>



      <div className="flex flex-wrap gap-6 p-6">
        {groups.map((g:Group) => {
          const studentCount = students.filter((s) => s.groupId === g.id).length;
          const isSelected = selectedGroupId === g.id;

          return (
            <div
              key={g.id}
              onClick={() => setSelectedGroupId(isSelected ? null : g.id)}
              className={`w-80 h-52 border-2 rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all ${isSelected ? "border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-gray-400"
                }`}
            >
              <div>
                <h1 className="text-4xl font-bold text-center">{g.name}</h1>
                <p className="text-center text-xl text-gray-600 mt-2">
                  {studentCount} student{studentCount !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex justify-end">
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => setSelectedGroupId(isSelected ? null : g.id)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-blue-500"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition peer-checked:translate-x-6"></div>
                </label>
              </div>
            </div>
          );
        })}
      </div>


      
      <div className="px-8 mt-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-2xl border-b text-center">
              <th className="pb-4">№</th>
              <th className="pb-4">Fullname</th>
              <th className="pb-4">Age</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Active</th>
              <th className="pb-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 text-xl">
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={student.id} className="text-xl text-center h-20 border-b border-gray-100 hover:bg-gray-50">
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.email}</td>
                  <td>
                    <input type="checkbox" checked={student.active} disabled className="w-5 h-5 accent-blue-500" />
                  </td>
                  <td>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => startEdit(student)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition shadow-sm"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>





      <Rodal visible={groupModal} onClose={() => setGroupModal(false)} customStyles={{ width: "400px", height: "230px" }}>
        <div className="flex flex-col gap-4 p-2 text-black">
          <h2 className="text-2xl font-bold">Add Group</h2>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            type="text"
            placeholder="Group name"
            className="border p-2 rounded w-full outline-blue-500 text-black bg-white"
          />
          <button onClick={addGroup} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded transition">
            Add Group
          </button>
        </div>
      </Rodal>

      <Rodal visible={studentModal} onClose={closeStudentModal} customStyles={{ width: "400px", height: "450px" }}>
        <div className="flex flex-col gap-4 p-2 text-black">
          <h2 className="text-2xl font-bold">{editingStudent ? "Update Student": "Save Student" }</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Student name" className="border p-2 rounded w-full outline-blue-500 text-black bg-white" />
          <input value={age} onChange={(e) => setAge(e.target.value !== "" ? Number(e.target.value) : "")} type="number" placeholder="Student age" className="border p-2 rounded w-full outline-blue-500 text-black bg-white" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Student Email" className="border p-2 rounded w-full outline-blue-500 text-black bg-white" />

          <label className="flex gap-3 items-center select-none text-gray-700 font-medium">
            <span>Active:</span>
            <input checked={active} onChange={(e) => setActive(e.target.checked)} type="checkbox" className="w-5 h-5 accent-blue-500" />
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">Assign to Group</label>
            <select className="border p-2 rounded w-full bg-white text-black outline-blue-500" value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={saveStudent} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded transition w-full mt-2">
            {editingStudent ?"Update Student":"Save Student"}
          </button>
        </div>
      </Rodal>

    </div>
  );
}

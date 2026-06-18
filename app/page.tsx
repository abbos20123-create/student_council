"use client"

import { useEffect, useState } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";
import Rodal from "rodal";
import 'rodal/rodal/css/lib'

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

  const supabase = createClient()


  useEffect(() => {
    getStudents();
    getGroups();
  }, []);


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
  
    const addStudent = async () => {
      if (!name || !email || !groupId) {
        alert("Please fill in all student details.");
        return;
      }
  
      const { data, error } = await supabase.from("students").insert({
          name,
          age: Number(age) || 0,
          email,
          groupId: groupId,
          active,
        }).select();
  
      if (error) {
        console.error("Error adding student:", error);
        return;
      }
  
      if (data) {
        setStudents(data);

        setName("");
        setAge("");
        setEmail("");
        setActive(false);
        setStudentModal(false);
      }
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
            className="px-5 py-3 border border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50"
            onClick={() => setGroupModal(true)}
          >
            Add Group
          </button>

          <button
            className="px-5 py-3 border border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50"
            onClick={() => setStudentModal(true)}
          >
            Add Student
          </button>
        </div>
      </nav>



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

      <Rodal visible={studentModal} onClose={() => setStudentModal(false)} customStyles={{ width: "400px", height: "450px" }}>
        <div className="flex flex-col gap-4 p-2 text-black">
          <h2 className="text-2xl font-bold">Add Student</h2>
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

          <button onClick={addStudent} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded transition w-full mt-2">
            Add Student
          </button>
        </div>
      </Rodal>

    </div>
  );
}

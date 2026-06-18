"use client"

import { useEffect, useState } from "react";
import { Group, Students } from "./types";
import { createClient } from "@/utilis/supabase/clientComponents";


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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { Car, Trophy, RefreshCcw, UserPlus, X, Star, Settings, ArrowLeft, Folder, Plus, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string;
  score: number;
  color: string;
};

type StageRule = {
  description: string;
  timeLimit: string;
  targetScore: number;
};

type Group = {
  id: string;
  name: string;
  stages: StageRule[];
  bonusRule: { description: string; score: number };
  students: Student[];
  pointHistory: Record<string, any>[];
};

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

const DEFAULT_STAGES = [
  { description: "", timeLimit: "", targetScore: 100 },
  { description: "", timeLimit: "", targetScore: 300 },
  { description: "", timeLimit: "", targetScore: 600 }
];
const DEFAULT_BONUS = { description: "보너스", score: 10 };

export default function Home() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFindingAccount, setIsFindingAccount] = useState(false);
  const [findName, setFindName] = useState("");
  const [findPhone, setFindPhone] = useState("");
  const [foundAccount, setFoundAccount] = useState<{id: string, pw: string} | null>(null);

  // --- DASHBOARD STATE ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // --- ACTIVE GROUP STATE ---
  const [activeTab, setActiveTab] = useState(1);
  const [stages, setStages] = useState<StageRule[]>(DEFAULT_STAGES);
  const [bonusRule, setBonusRule] = useState(DEFAULT_BONUS);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [pointInputs, setPointInputs] = useState<Record<string, number | "">>({});
  const [pointHistory, setPointHistory] = useState<Record<string, any>[]>([]);

  const highestStudentScore = students.reduce((max, s) => Math.max(max, s.score), 0);
  const maxScore = Math.max(100, Math.ceil((highestStudentScore === 0 ? 1 : highestStudentScore) / 100) * 100);

  // --- SUPABASE SYNC ---
  // Load groups when logged in
  useEffect(() => {
    async function loadData() {
      if (isLoggedIn && currentUser) {
        setIsDataLoaded(false);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('data')
          .eq('user_id', currentUser)
          .single();

        if (!error && data?.data?.groups) {
          setGroups(data.data.groups);
        } else {
          setGroups([]);
        }
        setIsDataLoaded(true);
      }
    }
    loadData();
  }, [isLoggedIn, currentUser]);

  // Save groups whenever it changes
  useEffect(() => {
    async function saveData() {
      if (isLoggedIn && currentUser && isDataLoaded) {
        await supabase
          .from('user_profiles')
          .upsert({ 
            user_id: currentUser, 
            data: { groups } 
          }, { onConflict: 'user_id' });
      }
    }
    
    const timeoutId = setTimeout(() => {
      saveData();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [groups, isLoggedIn, currentUser, isDataLoaded]);

  // Sync Active Group State -> Groups Array
  useEffect(() => {
    if (selectedGroupId) {
      setGroups(prev => prev.map(g => {
        if (g.id === selectedGroupId) {
          return { ...g, stages, bonusRule, students, pointHistory };
        }
        return g;
      }));
    }
  }, [stages, bonusRule, students, pointHistory, selectedGroupId]);

  // Load Active Group State when selected
  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        setStages(group.stages || DEFAULT_STAGES);
        setBonusRule(group.bonusRule || DEFAULT_BONUS);
        setStudents(group.students || []);
        setPointHistory(group.pointHistory || []);
        setActiveTab(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  // --- AUTH HANDLERS ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!regName.trim() || !regPhone.trim() || !loginId.trim() || !loginPw.trim()) {
        alert("모든 정보(이름, 전화번호, 아이디, 비밀번호)를 입력해주세요.");
        return;
      }
    } else {
      if (!loginId.trim() || !loginPw.trim()) {
        alert("아이디와 비밀번호를 입력해주세요.");
        return;
      }
    }

    const accountsStr = localStorage.getItem("pointApp_accounts");
    const accounts = accountsStr ? JSON.parse(accountsStr) : {};

    if (isRegistering) {
      if (accounts[loginId]) {
        alert("이미 존재하는 아이디입니다.");
        return;
      }
      accounts[loginId] = {
        password: loginPw,
        name: regName,
        phone: regPhone
      };
      localStorage.setItem("pointApp_accounts", JSON.stringify(accounts));
      setCurrentUser(loginId);
      setIsLoggedIn(true);
      alert("회원가입이 완료되었습니다.");
    } else {
      const account = accounts[loginId];
      if (account) {
        // Handle both old string format and new object format
        const isPasswordCorrect = typeof account === 'string' ? account === loginPw : account.password === loginPw;
        if (isPasswordCorrect) {
          setCurrentUser(loginId);
          setIsLoggedIn(true);
          setSelectedGroupId(null);
        } else {
          alert("아이디 또는 비밀번호가 틀렸습니다.");
        }
      } else {
        alert("아이디 또는 비밀번호가 틀렸습니다.");
      }
    }
  };

  const handleFindAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findName.trim() || !findPhone.trim()) {
      alert("이름과 전화번호를 모두 입력해주세요.");
      return;
    }

    const accountsStr = localStorage.getItem("pointApp_accounts");
    const accounts = accountsStr ? JSON.parse(accountsStr) : {};

    let foundId = null;
    let foundPw = null;

    for (const [id, account] of Object.entries(accounts)) {
      if (typeof account === 'object' && account !== null) {
        if ((account as any).name === findName && (account as any).phone === findPhone) {
          foundId = id;
          foundPw = (account as any).password;
          break;
        }
      }
    }

    if (foundId) {
      setFoundAccount({ id: foundId, pw: foundPw });
    } else {
      alert("일치하는 계정 정보를 찾을 수 없습니다.");
      setFoundAccount(null);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setLoginId("");
    setLoginPw("");
    setSelectedGroupId(null);
    setGroups([]);
  };

  // --- DASHBOARD HANDLERS ---
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      stages: DEFAULT_STAGES,
      bonusRule: DEFAULT_BONUS,
      students: [],
      pointHistory: []
    };
    setGroups([...groups, newGroup]);
    setNewGroupName("");
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("정말 이 그룹을 삭제하시겠습니까?")) {
      setGroups(groups.filter(g => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    }
  };

  // --- APP HANDLERS ---
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim() || students.length >= 10) return;
    const newId = Date.now().toString();
    const newStudent: Student = {
      id: newId,
      name: newStudentName.trim(),
      score: 0,
      color: COLORS[students.length % COLORS.length]
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName("");
    
    const today = getTodayDateString();
    setPointHistory(prev => {
      const newHistory = [...prev];
      const todayIndex = newHistory.findIndex(e => e.date === today);
      if (todayIndex >= 0) {
        newHistory[todayIndex] = { ...newHistory[todayIndex], [newStudent.name]: 0 };
      } else {
        newHistory.push({ date: today, [newStudent.name]: 0 });
      }
      return newHistory;
    });
  };

  const handleRemoveStudent = (idToRemove: string, nameToRemove: string) => {
    setStudents(prev => prev.filter(s => s.id !== idToRemove));
    setPointHistory(prev => prev.map(entry => {
      const newEntry = { ...entry };
      delete newEntry[nameToRemove];
      return newEntry;
    }));
  };

  const handleAddPoints = (studentId: string, pts: number) => {
    if (pts === 0) return;
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return { ...s, score: Math.max(0, s.score + pts) };
      }
      return s;
    });
    setStudents(updatedStudents);
    
    const today = getTodayDateString();
    setPointHistory(prev => {
      const newHistory = [...prev];
      const todayIndex = newHistory.findIndex(e => e.date === today);
      if (todayIndex >= 0) {
        const entry = { ...newHistory[todayIndex] };
        updatedStudents.forEach(s => { entry[s.name] = s.score; });
        newHistory[todayIndex] = entry;
      } else {
        const entry: Record<string, any> = { date: today };
        updatedStudents.forEach(s => { entry[s.name] = s.score; });
        newHistory.push(entry);
      }
      return newHistory;
    });
    setPointInputs(prev => ({ ...prev, [studentId]: "" }));
  };

  const handleReset = () => {
    if (confirm("모든 학생의 점수를 0점으로 초기화하시겠습니까?")) {
      setStudents(prev => prev.map(s => ({ ...s, score: 0 })));
      setPointHistory([]);
    }
  };

  const updateStage = (index: number, field: keyof StageRule, value: string | number) => {
    setStages(prev => {
      const newStages = [...prev];
      newStages[index] = { ...newStages[index], [field]: value };
      return newStages;
    });
  };

  const handleExportCSV = () => {
    if (pointHistory.length === 0) return;
    
    // Header
    const headers = ["날짜", ...students.map(s => s.name)];
    let csvContent = headers.join(",") + "\n";
    
    // Rows
    pointHistory.forEach(entry => {
      const row = [entry.date];
      students.forEach(s => {
        row.push(entry[s.name] ?? 0);
      });
      csvContent += row.join(",") + "\n";
    });
    
    // Create Blob and download link (with BOM for UTF-8 Excel support)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeGroup?.name || '그룹'}_점수기록.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER VIEWS ---
  
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 font-sans text-gray-900 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-400 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          {isFindingAccount ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-800 mb-2">계정 찾기</h2>
                <p className="text-gray-500 font-bold">가입 시 등록한 이름과 전화번호를 입력하세요.</p>
              </div>

              {foundAccount ? (
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-center space-y-4 mb-6">
                  <p className="text-gray-600 font-bold">회원님의 계정 정보입니다.</p>
                  <div className="text-lg bg-white p-4 rounded-xl border border-indigo-100">
                    <p className="mb-2">아이디: <span className="font-black text-indigo-700">{foundAccount.id}</span></p>
                    <p>비밀번호: <span className="font-black text-indigo-700">{foundAccount.pw}</span></p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsFindingAccount(false);
                      setFoundAccount(null);
                      setLoginId(foundAccount.id);
                      setLoginPw(foundAccount.pw);
                    }}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    이 정보로 로그인하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFindAccount} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
                    <input 
                      type="text" 
                      value={findName} 
                      onChange={(e) => setFindName(e.target.value)}
                      placeholder="이름 입력"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">전화번호</label>
                    <input 
                      type="tel" 
                      value={findPhone} 
                      onChange={(e) => setFindPhone(e.target.value)}
                      placeholder="예: 010-1234-5678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md mt-4">
                    계정 찾기
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <button 
                  onClick={() => { setIsFindingAccount(false); setFoundAccount(null); }} 
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  뒤로 가기
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-5xl font-black tracking-tight drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">포인트 UP</h1>
                <p className="text-gray-500 font-bold">
                  {isRegistering ? "새로운 계정을 만들어보세요!" : "환영합니다! 로그인해주세요."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {isRegistering && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
                      <input 
                        type="text" 
                        value={regName} 
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="이름 입력"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">전화번호</label>
                      <input 
                        type="tel" 
                        value={regPhone} 
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="전화번호 입력 (예: 010-1234-5678)"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">아이디</label>
                  <input 
                    type="text" 
                    value={loginId} 
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디 입력"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
                  <input 
                    type="password" 
                    value={loginPw} 
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md mt-4">
                  {isRegistering ? "회원가입 완료" : "로그인"}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <button 
                  onClick={() => setIsRegistering(!isRegistering)} 
                  className="block w-full text-sm font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  {isRegistering ? "이미 계정이 있으신가요? 로그인하기" : "계정이 없으신가요? 회원가입하기"}
                </button>
                {!isRegistering && (
                  <button 
                    onClick={() => setIsFindingAccount(true)} 
                    className="block w-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    아이디/비밀번호 찾기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  if (isLoggedIn && !selectedGroupId) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800"><span className="text-indigo-600">{currentUser}</span>님의 대시보드</h1>
              <p className="text-gray-500 text-sm mt-1">관리할 학생 그룹(클래스)을 선택하거나 새로 만드세요.</p>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
              로그아웃
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 min-h-[400px]">
            <form onSubmit={handleCreateGroup} className="flex gap-4 mb-8">
              <input 
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                placeholder="새로운 그룹 이름 (예: 오전반)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-lg"
              />
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                <Plus className="w-5 h-5" /> 그룹 생성
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => setSelectedGroupId(group.id)}
                  className="group relative bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-6 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <button 
                    onClick={(e) => handleDeleteGroup(e, group.id)}
                    className="absolute top-4 right-4 text-indigo-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-indigo-200 p-3 rounded-xl text-indigo-700">
                      <Folder className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-indigo-900">{group.name}</h3>
                  </div>
                  <div className="text-sm font-bold text-indigo-500">
                    등록된 학생 수: {group.students?.length || 0}명
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400 font-medium">
                  아직 그룹이 없습니다. 위에서 새로운 그룹을 생성해주세요!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const activeGroup = groups.find(g => g.id === selectedGroupId);

  const bgColors: Record<number, string> = {
    1: "bg-[#f0f9ff] bg-[radial-gradient(#bae6fd_2px,transparent_2px)] [background-size:24px_24px]", // Sky blue dotted
    2: "bg-[#f0fdf4] bg-[radial-gradient(#bbf7d0_2px,transparent_2px)] [background-size:24px_24px]", // Green dotted
    3: "bg-[#faf5ff] bg-[radial-gradient(#e9d5ff_2px,transparent_2px)] [background-size:24px_24px]"  // Purple dotted
  };

  return (
    <main className={`min-h-screen p-6 font-sans text-gray-900 transition-all duration-500 ${bgColors[activeTab] || bgColors[1]}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-4 animate-in slide-in-from-top-2">
          <button 
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> 대시보드로 돌아가기
          </button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm" style={{ color: '#2E7D32' }}>
              {activeGroup?.name} <span className="text-gray-400 font-medium text-lg ml-2">포인트 UP</span>
            </h1>
          </div>
          <div className="w-[150px]"></div> {/* Spacer for centering */}
        </div>

        {/* Main Interface */}
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Tabs */}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setActiveTab(1)}
              className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center space-x-2 ${activeTab === 1 ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
              <span>1 (규칙)</span>
            </button>
            <button 
              onClick={() => setActiveTab(2)}
              className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center space-x-2 ${activeTab === 2 ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              <Car className="w-5 h-5" />
              <span>2 (게임)</span>
            </button>
            <button 
              onClick={() => setActiveTab(3)}
              className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center space-x-2 ${activeTab === 3 ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
            >
              <Trophy className="w-5 h-5" />
              <span>3 (그래프)</span>
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[600px]">
            {/* TAB 1: RULES */}
            {activeTab === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">게임 규칙 설정</h2>
                  <div className="text-sm text-gray-500">설정된 목표는 2번 탭에 반영됩니다.</div>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-6">
                  <div className="grid grid-cols-12 gap-4 text-sm font-bold text-indigo-800 px-2">
                    <div className="col-span-2">단계</div>
                    <div className="col-span-5">내용</div>
                    <div className="col-span-3">시간 체크</div>
                    <div className="col-span-2">목표 점수</div>
                  </div>

                  {stages.map((stage, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                      <div className="col-span-2 font-black text-indigo-500 text-lg text-center">Stage {i + 1}</div>
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          value={stage.description} 
                          onChange={e => updateStage(i, 'description', e.target.value)}
                          placeholder="어떤 미션인가요?"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="text" 
                          value={stage.timeLimit} 
                          onChange={e => updateStage(i, 'timeLimit', e.target.value)}
                          placeholder="예: 10분 이내"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          value={stage.targetScore} 
                          onChange={e => updateStage(i, 'targetScore', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-indigo-400 font-bold text-indigo-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                  <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center"><Star className="w-5 h-5 mr-2" />비고 (추가 점수) 규칙</h3>
                  <div className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-xl shadow-sm border border-yellow-50">
                    <div className="col-span-2 font-black text-yellow-600 text-center">비고칸</div>
                    <div className="col-span-8">
                      <input 
                        type="text" 
                        value={bonusRule.description} 
                        onChange={e => setBonusRule({...bonusRule, description: e.target.value})}
                        placeholder="추가 점수를 줄 항목 (예: 발표 잘함, 양보함)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <span className="text-gray-500 font-bold">+</span>
                      <input 
                        type="number" 
                        value={bonusRule.score} 
                        onChange={e => setBonusRule({...bonusRule, score: Number(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-yellow-400 font-bold text-yellow-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GAME */}
            {activeTab === 2 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Setup Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center space-x-4 bg-indigo-50 p-4 rounded-2xl w-full md:w-auto">
                    <label className="text-sm font-bold text-gray-700 whitespace-nowrap">학생 추가</label>
                    <input 
                      type="text" 
                      value={newStudentName} 
                      onChange={e => setNewStudentName(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleAddStudent()}
                      placeholder="이름 입력 (최대 10명)"
                      className="w-48 px-4 py-2 rounded-xl border border-gray-200 shadow-sm focus:border-indigo-500 outline-none disabled:opacity-50"
                      disabled={students.length >= 10}
                    />
                    <button 
                      onClick={handleAddStudent}
                      disabled={students.length >= 10 || !newStudentName.trim()}
                      className="bg-indigo-600 text-white p-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>


                </div>

                {/* Student Controls & Visual Car Track */}
                <div className="space-y-8">
                  {students.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                      학생을 추가하면 자동차가 나타납니다!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8">
                      {/* Track Container */}
                      <div className="relative pt-6 pb-4 px-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner overflow-hidden">
                        {/* Stage Markers */}
                        <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-300" style={{ left: '4px' }}></div>
                        {stages[0].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-200 border-l border-dashed border-indigo-300" style={{ left: `calc(${(stages[0].targetScore / maxScore) * 100}% + 16px)` }}></div>}
                        {stages[1].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-300 border-l border-dashed border-indigo-400" style={{ left: `calc(${(stages[1].targetScore / maxScore) * 100}% + 16px)` }}></div>}
                        {stages[2].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-400 border-l border-dashed border-indigo-500" style={{ left: `calc(${(stages[2].targetScore / maxScore) * 100}% + 16px)` }}></div>}
                        
                        {stages[0].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-400 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${(stages[0].targetScore / maxScore) * 100}% + 16px)` }}>1단계 ({stages[0].targetScore})</div>}
                        {stages[1].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-500 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${(stages[1].targetScore / maxScore) * 100}% + 16px)` }}>2단계 ({stages[1].targetScore})</div>}
                        {stages[2].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-600 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${(stages[2].targetScore / maxScore) * 100}% + 16px)` }}>3단계 ({stages[2].targetScore})</div>}

                        {/* Cars */}
                        <div className="space-y-12 mt-6">
                          {students.map(student => {
                             const carPosition = Math.min((student.score / maxScore) * 100, 100);
                             return (
                              <div key={student.id} className="relative h-1 bg-gray-200 rounded-full w-[calc(100%-32px)] ml-4">
                                <div 
                                  className="absolute h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${carPosition}%`, backgroundColor: student.color }}
                                ></div>
                                <div 
                                  className="absolute -top-6 transition-all duration-1000 ease-out transform -translate-x-1/2 z-20"
                                  style={{ left: `${carPosition}%` }}
                                >
                                  <div className="flex flex-col items-center">
                                    <div className="whitespace-nowrap text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1" style={{ backgroundColor: student.color }}>
                                      {student.name} ({student.score})
                                    </div>
                                    <Car className="w-8 h-8 drop-shadow-md" style={{ color: student.color }} />
                                  </div>
                                </div>
                              </div>
                             )
                          })}
                        </div>
                      </div>

                      {/* Student List & Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(student => {
                          const currentStage = student.score >= stages[1].targetScore ? 3 : student.score >= stages[0].targetScore ? 2 : 1;
                          return (
                            <div key={student.id} className="bg-white p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between" style={{ borderColor: `${student.color}40` }}>
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-bold text-lg" style={{ color: student.color }}>{student.name}</h3>
                                  <div className="text-sm text-gray-500 font-bold">Stage {currentStage} • <span className="text-gray-800">{student.score} 점</span></div>
                                </div>
                                <button onClick={() => handleRemoveStudent(student.id, student.name)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="삭제">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Direct Point Add */}
                                <div className="flex space-x-2">
                                  <input 
                                    type="number"
                                    value={pointInputs[student.id] ?? ''}
                                    onChange={e => setPointInputs(prev => ({...prev, [student.id]: Number(e.target.value)}))}
                                    placeholder="점수"
                                    className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-center font-bold outline-none focus:border-indigo-500"
                                  />
                                  <button 
                                    onClick={() => handleAddPoints(student.id, Number(pointInputs[student.id] || 0))}
                                    className="flex-1 text-white font-bold rounded-xl transition-all active:scale-95 text-sm"
                                    style={{ backgroundColor: student.color }}
                                  >
                                    추가
                                  </button>
                                </div>
                                
                                {/* Bonus Rule Button */}
                                <button
                                  onClick={() => handleAddPoints(student.id, bonusRule.score)}
                                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm font-bold"
                                >
                                  <Star className="w-4 h-4" />
                                  <span className="truncate max-w-[120px]" title={bonusRule.description}>{bonusRule.description}</span>
                                  <span>(+{bonusRule.score})</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GRAPH */}
            {activeTab === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">일자별 누적 점수 그래프</h2>
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleExportCSV}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-bold text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>엑셀(CSV) 다운로드</span>
                    </button>
                    <div className="text-sm font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg flex items-center">
                      날짜별 최종 기록
                    </div>
                  </div>
                </div>
                
                <div className="h-[500px] w-full border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  {pointHistory.length === 0 || students.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col text-gray-400 space-y-4">
                      <Trophy className="w-12 h-12 opacity-20" />
                      <p>학생을 추가하고 점수를 올려 그래프를 확인해보세요!</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pointHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ color: '#4b5563', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        
                        {students.map((student) => (
                          <Line 
                            key={student.id}
                            type="monotone" 
                            dataKey={student.name} 
                            name={`${student.name} (총 ${student.score}점)`}
                            stroke={student.color} 
                            strokeWidth={3} 
                            dot={{ fill: student.color, strokeWidth: 2, r: 4, stroke: 'white' }}
                            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                            animationDuration={1000}
                          >
                            <LabelList dataKey={student.name} position="top" style={{ fontSize: '12px', fill: student.color, fontWeight: 'bold' }} />
                          </Line>
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
// trigger HMR

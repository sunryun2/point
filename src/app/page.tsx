"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Car, Trophy, RefreshCcw, UserPlus, X, Star, Settings } from "lucide-react";

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

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

export default function Home() {
  // Tabs: 1 = Rules, 2 = Game, 3 = Graph
  const [activeTab, setActiveTab] = useState(1);
  
  // Rules State
  const [stages, setStages] = useState<StageRule[]>([
    { description: "", timeLimit: "", targetScore: 100 },
    { description: "", timeLimit: "", targetScore: 300 },
    { description: "", timeLimit: "", targetScore: 600 }
  ]);
  const [bonusRule, setBonusRule] = useState({ description: "보너스", score: 10 });
  
  // Student State
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [pointInputs, setPointInputs] = useState<Record<string, number | "">>({});
  
  // History format: { date: "6/1", "Student 1": 100, "Student 2": 50, ... }
  const [pointHistory, setPointHistory] = useState<Record<string, any>[]>([]);

  const maxScore = stages[2].targetScore > 0 ? stages[2].targetScore : 1000;

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
    
    // Add to today's history
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
    
    // Remove their data from history
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
    
    // Update history
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
    
    // Clear input
    setPointInputs(prev => ({ ...prev, [studentId]: "" }));
  };

  const handleReset = () => {
    setStudents(prev => prev.map(s => ({ ...s, score: 0 })));
    setPointHistory([]);
  };

  const updateStage = (index: number, field: keyof StageRule, value: string | number) => {
    setStages(prev => {
      const newStages = [...prev];
      newStages[index] = { ...newStages[index], [field]: value };
      return newStages;
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-sm" style={{ color: '#2E7D32' }}>
            포인트 UP !
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setActiveTab(1)}
            className={`px-8 py-3 rounded-full font-bold text-xl transition-all flex items-center space-x-2 ${activeTab === 1 ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            <Settings className="w-5 h-5" />
            <span>1 (규칙)</span>
          </button>
          <button 
            onClick={() => setActiveTab(2)}
            className={`px-8 py-3 rounded-full font-bold text-xl transition-all flex items-center space-x-2 ${activeTab === 2 ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            <Car className="w-5 h-5" />
            <span>2 (게임)</span>
          </button>
          <button 
            onClick={() => setActiveTab(3)}
            className={`px-8 py-3 rounded-full font-bold text-xl transition-all flex items-center space-x-2 ${activeTab === 3 ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            <Trophy className="w-5 h-5" />
            <span>3 (그래프)</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 min-h-[600px]">
          
          {/* TAB 1: RULES */}
          {activeTab === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
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

                <button 
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors border border-red-100 bg-white"
                  title="모든 점수 초기화"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span className="font-bold text-sm">초기화</span>
                </button>
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
                      {stages[0].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-200 border-l border-dashed border-indigo-300" style={{ left: `calc(${Math.min((stages[0].targetScore / maxScore) * 100, 100)}% + 16px)` }}></div>}
                      {stages[1].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-300 border-l border-dashed border-indigo-400" style={{ left: `calc(${Math.min((stages[1].targetScore / maxScore) * 100, 100)}% + 16px)` }}></div>}
                      {stages[2].targetScore > 0 && <div className="absolute top-0 bottom-0 w-px bg-indigo-400 border-l border-dashed border-indigo-500" style={{ left: `calc(${Math.min((stages[2].targetScore / maxScore) * 100, 100)}% + 16px)` }}></div>}
                      
                      {stages[0].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-400 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${Math.min((stages[0].targetScore / maxScore) * 100, 100)}% + 16px)` }}>1단계 ({stages[0].targetScore})</div>}
                      {stages[1].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-500 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${Math.min((stages[1].targetScore / maxScore) * 100, 100)}% + 16px)` }}>2단계 ({stages[1].targetScore})</div>}
                      {stages[2].targetScore > 0 && <div className="absolute -top-4 text-[10px] font-bold text-indigo-600 -translate-x-1/2 whitespace-nowrap" style={{ left: `calc(${Math.min((stages[2].targetScore / maxScore) * 100, 100)}% + 16px)` }}>3단계 ({stages[2].targetScore})</div>}

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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">일자별 누적 점수 그래프</h2>
                <div className="text-sm font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg">
                  날짜별 최종 기록
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
                          name={student.name}
                          stroke={student.color} 
                          strokeWidth={3} 
                          dot={{ fill: student.color, strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                          animationDuration={1000}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

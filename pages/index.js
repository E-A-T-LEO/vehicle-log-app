import { useState } from "react";

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [entry, setEntry] = useState({ date: "", from: "", to: "", purpose: "", fuel: "", toll: "", km: "" });

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    if (entry.date && entry.from && entry.to) {
      setLogs([...logs, entry]);
      setEntry({ date: "", from: "", to: "", purpose: "", fuel: "", toll: "", km: "" });
    }
  };

  const totalKm = logs.reduce((sum, log) => sum + Number(log.km || 0), 0);
  const totalFuel = logs.reduce((sum, log) => sum + Number(log.fuel || 0), 0);
  const totalToll = logs.reduce((sum, log) => sum + Number(log.toll || 0), 0);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">🚗 차량 운행일지</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input name="date" placeholder="날짜 (예: 2025-05-14)" value={entry.date} onChange={handleChange} className="border p-2" />
        <input name="from" placeholder="출발지" value={entry.from} onChange={handleChange} className="border p-2" />
        <input name="to" placeholder="도착지" value={entry.to} onChange={handleChange} className="border p-2" />
        <input name="purpose" placeholder="운행 목적" value={entry.purpose} onChange={handleChange} className="border p-2" />
        <input name="fuel" placeholder="유류비 (원)" value={entry.fuel} onChange={handleChange} className="border p-2" />
        <input name="toll" placeholder="통행료 (원)" value={entry.toll} onChange={handleChange} className="border p-2" />
        <input name="km" placeholder="주행거리 (km)" value={entry.km} onChange={handleChange} className="border p-2" />
      </div>
      <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded">기록 추가</button>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">📋 운행기록</h2>
        {logs.map((log, idx) => (
          <div key={idx} className="border p-2 text-sm mb-2">
            {log.date} | {log.from} → {log.to} | {log.purpose} | 🚗 {log.km}km | ⛽ {log.fuel}원 | 🛣 {log.toll}원
          </div>
        ))}
        <div className="mt-4 text-sm font-semibold">
          총 주행거리: {totalKm}km / 총 유류비: {totalFuel}원 / 총 통행료: {totalToll}원
        </div>
      </div>
    </div>
  );
}

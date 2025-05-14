import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { GoogleMap, LoadScript, Polyline } from "@react-google-maps/api";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const firebaseConfig = {
  apiKey: "AIzaSyB4HL8EUbLrQx4tPehoZ5xDS7nv8jcUlNM",
  authDomain: "vehicle-log-app-9a199.firebaseapp.com",
  projectId: "vehicle-log-app-9a199",
  storageBucket: "vehicle-log-app-9a199.firebasestorage.app",
  messagingSenderId: "237686694452",
  appId: "1:237686694452:web:b6df2e8ff915ba1edfe061",
  measurementId: "G-BT5SPDXG5M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

export default function VehicleLogApp() {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [entry, setEntry] = useState({ date: "", from: "", to: "", purpose: "", fuel: "", toll: "", km: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "logs"), where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const loadedLogs = querySnapshot.docs.map(doc => doc.data());
        setLogs(loadedLogs);
      } else {
        setLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const selectedStr = selectedDate.toISOString().split("T")[0];
    const dayLogs = logs.filter(log => log.date === selectedStr);
    const dummyGeocode = addr => {
      const hash = addr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return { lat: 35 + (hash % 10) * 0.01, lng: 128 + (hash % 10) * 0.01 };
    };
    const coords = [];
    for (const log of dayLogs) {
      coords.push(dummyGeocode(log.from));
      coords.push(dummyGeocode(log.to));
    }
    setCoordinates(coords);
  }, [selectedDate, logs]);

  const handleChange = (e) => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    if (!user) return;
    if (entry.date && entry.from && entry.to) {
      const newEntry = { ...entry, uid: user.uid };
      await addDoc(collection(db, "logs"), newEntry);
      setLogs([...logs, newEntry]);
      setEntry({ date: "", from: "", to: "", purpose: "", fuel: "", toll: "", km: "" });
    }
  };

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const totalKm = logs.reduce((sum, log) => sum + Number(log.km || 0), 0);
  const totalFuel = logs.reduce((sum, log) => sum + Number(log.fuel || 0), 0);
  const totalToll = logs.reduce((sum, log) => sum + Number(log.toll || 0), 0);

  const monthlyStats = logs.reduce((acc, log) => {
    const month = (log.date || "").slice(0, 7);
    if (!acc[month]) acc[month] = { km: 0, fuel: 0, toll: 0 };
    acc[month].km += Number(log.km || 0);
    acc[month].fuel += Number(log.fuel || 0);
    acc[month].toll += Number(log.toll || 0);
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(monthlyStats),
    datasets: [
      {
        label: "주행거리 (km)",
        data: Object.values(monthlyStats).map(stat => stat.km),
        backgroundColor: "#3B82F6",
      },
      {
        label: "유류비 (원)",
        data: Object.values(monthlyStats).map(stat => stat.fuel),
        backgroundColor: "#10B981",
      },
      {
        label: "통행료 (원)",
        data: Object.values(monthlyStats).map(stat => stat.toll),
        backgroundColor: "#F59E0B",
      },
    ]
  };

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedMonth = selectedDate.toISOString().slice(0, 7);
  const dayTotal = logs
    .filter(log => log.date === selectedDateStr)
    .reduce((acc, log) => acc + Number(log.km || 0), 0);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">차량 운행일지</h1>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.displayName}</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-2 py-1 rounded text-sm">로그아웃</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="bg-blue-500 text-white px-3 py-1 rounded">Google 로그인</button>
        )}
      </div>

      {user && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input name="date" placeholder="날짜 (예: 2025-05-14)" value={entry.date} onChange={handleChange} className="border p-2" />
            <input name="from" placeholder="출발지" value={entry.from} onChange={handleChange} className="border p-2" />
            <input name="to" placeholder="도착지" value={entry.to} onChange={handleChange} className="border p-2" />
            <input name="purpose" placeholder="운행 목적" value={entry.purpose} onChange={handleChange} className="border p-2" />
            <input name="fuel" placeholder="유류비 (원)" value={entry.fuel} onChange={handleChange} className="border p-2" />
            <input name="toll" placeholder="통행료 (원)" value={entry.toll} onChange={handleChange} className="border p-2" />
            <input name="km" placeholder="주행거리 (km)" value={entry.km} onChange={handleChange} className="border p-2" />
          </div>
          <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded">기록 추가</button>
        </>
      )}

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

      <div className="mt-10">
        <h2 className="font-semibold mb-2">📊 월별 통계 차트</h2>
        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" }, title: { display: true, text: "월별 운행 통계" } } }} />
      </div>

      <div className="mt-10">
        <h2 className="font-semibold mb-2">📅 일별 주행거리 보기</h2>
        <Calendar onChange={setSelectedDate} value={selectedDate} />
        <div className="mt-2 text-sm font-semibold">
          선택한 날짜: {selectedDateStr} / 주행거리: {dayTotal}km
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-semibold mb-2">🗺️ 이동 경로 보기</h2>
        <LoadScript googleMapsApiKey="AIzaSyAyKZUPUo1JQfay_Mm6XQMzpSrglLzA4O4">
          <GoogleMap mapContainerStyle={mapContainerStyle} center={{ lat: 35.8, lng: 128.6 }} zoom={9}>
            <Polyline path={coordinates} options={{ strokeColor: "#3B82F6", strokeOpacity: 0.8, strokeWeight: 4 }} />
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="mt-10">
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const sheetData = [
              ["날짜", "출발지", "도착지", "운행 목적", "유류비", "통행료", "주행거리"]
            ];
            logs.filter(log => (log.date || '').startsWith(selectedMonth)).forEach(log => {
              sheetData.push([
                log.date, log.from, log.to, log.purpose, log.fuel, log.toll, log.km
              ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(wb, ws, "운행기록");
            XLSX.writeFile(wb, `vehicle_log_${selectedMonth}.xlsx`);
          }}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          📤 엑셀로 내보내기
        </button>
      </div>
    </div>
  );
}

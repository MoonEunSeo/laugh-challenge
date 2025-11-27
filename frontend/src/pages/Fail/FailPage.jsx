import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import "./FailPage.css";

export default function FailPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const photos = state?.images || [];
  const nickname = state?.nickname || "";
  const sessionUUID = state?.sessionUUID;

  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
  
    const INTERVAL = 1000;
    const STEP1_TIMEOUT = 20000;
    const STEP2_TIMEOUT = 40000;
  
    async function pollForFirstEvent() {
      const start = Date.now();
  
      while (isMounted) {
        const res = await fetch(`http://localhost:5001/laugh-event/${sessionUUID}`);
        const list = await res.json();
  
        const firstEvent = list.find(e => e.event_index === 1);
  
        if (firstEvent) return firstEvent;
  
        if (Date.now() - start > STEP1_TIMEOUT) return null;
  
        await new Promise(r => setTimeout(r, INTERVAL));
      }
    }
  
    async function pollForTags() {
      const start = Date.now();
  
      while (isMounted) {
        const res = await fetch(`http://localhost:5001/laugh-event/${sessionUUID}`);
        const list = await res.json();
  
        const ev = list.find(e => e.event_index === 1);
  
        // 🔥 안전한 tags 체크
        if (ev?.tags && ev.tags !== "[]") {
          try {
            return ev.tags;  
          } catch (err) {
            console.error("JSON Parse 실패:", err);
          }
        }
  
        if (Date.now() - start > STEP2_TIMEOUT) return null;
  
        await new Promise(r => setTimeout(r, INTERVAL));
      }
    }
  
    async function run() {
      const firstEvent = await pollForFirstEvent();
      if (!firstEvent) return;
  
      const tags = await pollForTags(firstEvent);
      if (!tags) return;
  
      const resp = await fetch("http://localhost:5001/youtube/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
  
      const data = await resp.json();
  
      setVideos(data.videos);
      setQuery(tags.join(" "));
    }
  
    run();
    return () => { isMounted = false; };
  }, []);
  
  return (
    <div className="fail-wrapper">
      <h1>💀 아웃!</h1>
      <p>{nickname}님, 웃음을 참지 못했습니다!</p>

      <h2>📸 웃은 순간 캡처</h2>

      <div className="photo-list">
        {photos.length === 0 && <p>캡처가 존재하지 않습니다.</p>}
        {photos.map((url, i) => (
          <div key={i} className="photo-item">
            <img src={url} alt={`capture_${i}`} />
          </div>
        ))}
      </div>

      <button
        className="hall-button"
        onClick={() => navigate("/leaderboard1")}
      >
        🏆 명예의 전당 바로가기
      </button>

      {/* 추천 영상 버튼 */}
      <button
  className="lauther-btn"
  disabled={!videos.length}
  onClick={() =>
    navigate("/recommend", {
      state: { videos, query }
    })
  }
>
  <h1>
    {videos.length ? "추천 웃긴영상 보러가기" : "영상 분석중..."}
  </h1>
</button>

    </div>
  );
}

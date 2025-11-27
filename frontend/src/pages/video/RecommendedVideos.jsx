import React from "react";
import { useLocation } from "react-router-dom";
import "./Lauther.css";

const RecommendedVideos2 = () => {
  const { state } = useLocation();
  const videos = state?.videos || [];
  const query = state?.query || "";

  if (!videos.length) {
    return <p>추천 영상을 불러오는 중...</p>;
  }

  return (
    <div className="recommendation-container">
      <div className="header-box">
        <h2 className="title">🎉 추천 영상 목록</h2>
        <span className="subtitle">(키워드: {query})</span>
      </div>

      <ul className="video-list">
        {videos.map((video, index) => (
          <li key={index} className="video-card">
            <div className="video-number">{index + 1}</div>

            {/* 유튜브 썸네일 */}
            <img src={video.thumbnail} className="thumbnail" alt="thumbnail" />

            <div className="video-info">
              <a 
                href={video.video_url} 
                target="_blank"
                rel="noopener noreferrer"
                className="video-title"
              >
                {video.title}
              </a>

              <p className="video-channel">📺 {video.channel}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecommendedVideos2;

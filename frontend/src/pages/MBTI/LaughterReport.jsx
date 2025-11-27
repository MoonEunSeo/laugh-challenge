import React, { useEffect, useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Smile, Award, Zap, ChevronRight } from 'lucide-react';
import './LaughterReport.css';
import { useNavigate } from 'react-router-dom'; // 라우터 사용 시 주석 해제

// 게이트웨이 베이스 URL (소프트코딩)
const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5001';

/** JSX 안에서 바로 쓰는 MBTI 배지 컴포넌트 */
const includesAny = (text, keywords) => keywords.some((kw) => String(text || '').includes(kw));
const pickMbtiByLabel = (label = '', tags = '') => {
  const text = `${label} ${tags}`;
  // 1. E-N: 창의적이고 엉뚱함
  if (includesAny(text, ['반전', '풍자', '병맛'])) return 'E-N 성향 (창의적 유머)';
  // 2. E-S: 현실적이고 따뜻함
  if (includesAny(text, ['귀여움', '감동', '공감', '일상유머'])) return 'E-S 성향 (현실 공감)';
  // 3. E-F: 활동적이고 리액션 중심
  if (includesAny(text, ['슬랩스틱', '예측불가능', '당황'])) return 'E-F 성향 (리액션/활동)';
  // 4. E-P: 즉흥적이고 상황 중심
  if (includesAny(text, ['즉흥', '전염성', '상황개그'])) return 'E-P 성향 (즉흥/상황극)';
  // 5. E-J: 직설적이고 명확함
  if (includesAny(text, ['팩트폭격'])) return 'E-J 성향 (사이다/직설)';
  // 그 외: I
  return 'I 성향 (분석/내향)';
};

const MBTIBadge = ({ label, tags }) => {
  const mbti = pickMbtiByLabel(label, tags);
  const tone = mbti.startsWith('E-N') ? '#6C5CE7'
    : mbti.startsWith('E-S') ? '#00B894'
    : mbti.startsWith('E-F') ? '#FF7675'
    : mbti.startsWith('E-P') ? '#0984E3'
    : mbti.startsWith('E-J') ? '#FDDA0D'
    : '#636e72';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        background: `${tone}22`,
        color: '#2d3436',
        border: `1px solid ${tone}`,
        fontSize: 12,
        fontWeight: 600,
      }}
      title={`label: ${label || '-'}, tags: ${tags || '-'}`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: tone,
          display: 'inline-block',
        }}
      />
      {mbti}
    </span>
  );
};

const formatTimeHMSS = (seconds) => {
  const s = Math.floor(Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const LaughterReport = () => {
  // const navigate = useNavigate();

  // 게이트웨이에서 가져온 Supabase 이벤트들
  const [events, setEvents] = useState([]); // [{ id, session_uuid, event_index, detected_time, start_time, end_time, tags, label, summary, created_at, webcam_image_urls, nickname }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 분석 결과
  const [analysis, setAnalysis] = useState({
    mbti: '',
    desc: '',
    topTag: '',
    avgIntensity: 0,
    bestMoment: null, // supabase 이벤트 row
  });

  // 🔌 포트 5001 게이트웨이에서 이벤트 불러오기
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // 👇 수정된 부분: "/laugh-events" (s가 붙은 경로)에서 
        // 👇 백엔드에 정의된 경로인 "/laugh-event" (s가 없는 경로)로 수정되었습니다.
        const res = await fetch(`${API_BASE}/laugh-event?event_index=4`); 
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // 방어적 파싱
        const rows = Array.isArray(data) ? data : [];
        setEvents(rows);
      } catch (e) {
        console.error('[fetchEvents]', e);
        setError(e?.message || '이벤트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // 🧠 분석: bestMoment(최대 detected_time)로 topTag/MBTI/avgIntensity 계산
  useEffect(() => {
    if (!events || events.length === 0) {
      setAnalysis({
        mbti: 'I와 T성향이 강합니다',
        desc: '웃음 장벽이 에베레스트급! 냉철한 분석가 스타일입니다. 당신의 감정에 충실하도록 노력하십시오!',
        topTag: '없음',
        avgIntensity: 0,
        bestMoment: null,
      });
      return;
    }

    // bestMoment: 가장 오래 버틴 이벤트
    const best = events.reduce((a, b) =>
      (Number(a?.detected_time) || 0) > (Number(b?.detected_time) || 0) ? a : b
    );

    const topTagRaw = (best?.label || best?.tags || '').trim();
    const mbtiResult = pickMbtiByLabel(best?.label, best?.tags);

    // 평균 강도: detected_time 평균을 최대값으로 정규화 후 %
    const times = events.map((e) => Number(e?.detected_time) || 0);
    const avg = times.reduce((acc, v) => acc + v, 0) / times.length;
    const max = Math.max(...times, 1);
    const avgPct = Number(((avg / max) * 100).toFixed(1));

    setAnalysis({
      mbti: mbtiResult,
      desc: `사용자님은 '${topTagRaw || '태그 미상'}' 요소에 가장 크게 반응했습니다.`,
      topTag: topTagRaw || '없음',
      avgIntensity: avgPct,
      bestMoment: best || null,
    });
  }, [events]);

  // 레이더 차트 데이터 (MBTI에 따라 가중)
  const radarData = useMemo(() => ([
    { subject: '공감/감동', A: analysis.mbti.includes('E-S') ? 5 : 3, fullMark: 5 },
    { subject: '지적 유머', A: analysis.mbti.includes('E-N') || analysis.mbti.includes('N') ? 5 : 2, fullMark: 5 },
    { subject: '몸개그',   A: analysis.mbti.includes('E-F') || analysis.mbti.includes('F') ? 4 : 2, fullMark: 5 },
    { subject: '반전/스릴', A: analysis.mbti.includes('E-N') || analysis.mbti.includes('N') ? 4 : 3, fullMark: 5 },
    { subject: '사회적 관계', A: 3, fullMark: 5 },
  ]), [analysis.mbti]);

  const handleRecommendClick = () => {
    // React Router를 쓰신다면 navigate('/report') 권장
    window.location.href = '/report';
  };

  return (
    <div className="report-container">
      <div className="glass-panel">
        {/* 헤더 */}
        <header className="report-header">
          <h1>😊 AI 표정 분석 리포트</h1>
          <p className="subtitle">당신의 웃음 코드를 완벽하게 분석했습니다</p>
        </header>

        {/* 로딩/오류 */}
        {loading && (
          <div className="card"><p>불러오는 중...</p></div>
        )}
        {!loading && error && (
          <div className="card"><p className="error">오류: {error}</p></div>
        )}

        {!loading && !error && (
          <div className="dashboard-grid">
            {/* 1. 결과 요약 카드 (MBTI) */}
            <div className="card result-card">
              <div className="badge">분석 결과</div>
              <h2>{analysis.mbti}</h2>
              <p className="description">{analysis.desc}</p>
              <div className="stat-row">
                <div className="stat-item">
                  <Zap size={20} />
                  <span>반응 태그 <strong>{analysis.topTag}</strong></span>
                </div>
                
              </div>
            </div>

            {/* 2. 레이더 차트 (성향 분석) */}
            <div className="card chart-card">
              <h3>웃음 유발 요소 분석</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e0e0e0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      name="My Laugh"
                      dataKey="A"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      fill="#FF6B6B"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. 최고의 장면 (Supabase 데이터 기반) */}
            <div className="card best-moment-card">
              <h3><Award size={20} className="icon" /> 최고의 웃음 순간</h3>
              {analysis.bestMoment ? (
                <div className="moment-content">
                  <div className="time-badge">
                    {formatTimeHMSS(analysis.bestMoment.detected_time)} 버틴 구간
                  </div>
                  <div className="moment-desc">
                    "{analysis.bestMoment.summary || analysis.bestMoment.label || analysis.bestMoment.tags || '설명 없음'}"
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <MBTIBadge label={analysis.bestMoment.label} tags={analysis.bestMoment.tags} />
                  </div>
                  <p className="comment">
                    닉네임: <strong>{analysis.bestMoment.nickname || '익명'}</strong> / 이벤트 인덱스: {analysis.bestMoment.event_index ?? '-'}
                  </p>
                </div>
              ) : (
                <p>웃음 데이터가 충분하지 않습니다.</p>
              )}
            </div>

            {/* 4. [수정 3] 추천 콘텐츠 (긴 버튼으로 변경됨) */}
            <div
              className="card recommend-card clickable-card"
              onClick={handleRecommendClick}
              role="button"
              tabIndex={0}
            >
              <div className="recommend-content">
                <div className="recommend-left">
                  <h4>맞춤 추천 보러가기</h4>
                  <p>당신의 웃음 성향에 맞춘 콘텐츠 추천을 확인하세요</p>
                </div>
                <div className="recommend-right">
                  <ChevronRight size={28} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default LaughterReport;
import axios from "axios";

const API_KEY = process.env.YOUTUBE_API_KEY;

// tags: ["휠체어", "넘어짐", "경사로"]
export async function getYoutubeRecommendations(req, res) {
  try {
    const { tags } = req.body;

    if (!tags || !tags.length) {
      return res.status(400).json({ error: "tags is required" });
    }

    const query = tags.join(" ") + " 웃긴 영상";

    console.log("🔍 YouTube 검색 쿼리:", query);

    const url = "https://www.googleapis.com/youtube/v3/search";

    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        q: query,
        part: "snippet",
        type: "video",
        maxResults: 5,
        order: "relevance"
      }
    });

    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.medium.url
    }));

    return res.json({ query, videos });

  } catch (err) {
    console.error("🔥 YouTube API 에러:", err);
    return res.status(500).json({ error: "YouTube 검색 실패" });
  }
}

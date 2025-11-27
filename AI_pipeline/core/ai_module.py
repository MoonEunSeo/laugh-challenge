# AI_pipeline/core/ai_module.py

import os
import time
import json
from google import genai
from dotenv import load_dotenv
from google.genai import types

# .env 로드
load_dotenv("/workspace/AI_emotion_browser/AI_pipeline/.env")

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise RuntimeError("❌ GOOGLE_API_KEY is missing!")

client = genai.Client(api_key=API_KEY)


# ------------------------------------------------------------
# 1) Gemini Files Upload
# ------------------------------------------------------------
def upload_frames_to_gemini(frame_paths):
    uploaded_ids = []

    for path in frame_paths:
        uploaded = client.files.upload(
            file=path,
            #mime_type="image/jpeg"
        )
        uploaded_ids.append(uploaded.name)
        print("📤 업로드됨:", uploaded.name)

    return uploaded_ids


# ------------------------------------------------------------
# 2) Files ACTIVE 대기
# ------------------------------------------------------------
def wait_until_active(file_ids):
    print("⏳ File 상태 확인 중…")

    for fid in file_ids:
        while True:
            f = client.files.get(name=fid)
            print(f" ➤ {fid} 상태: {f.state}")

            if f.state == "ACTIVE":
                break
            elif f.state == "FAILED":
                raise RuntimeError(f"❌ 파일 처리 실패: {fid}")

            time.sleep(0.3)

    print("🎉 모든 파일 ACTIVE!")


# ------------------------------------------------------------
# 3) LLM 분석
# ------------------------------------------------------------
PROMPT = """
다음 이미지 시퀀스를 분석해서 사용자가 어떤 장면에서 웃었는지 JSON 형태로 정확히 출력해줘.

1) youtube 검색을 위한 태그 3개  
→ 반드시 '명사' 형태로 출력  
→ 영상 맥락/상황/캐릭터를 표현하는 단어 위주  
→ 예: ['포장마차', '커플', '병맛']

2) 사용자의 웃음을 유발한 감성 라벨 1개  
→ 아래 카테고리 중 하나로 선택:
   ['병맛', '풍자', '반전', '귀여움', '감동', '공감', '일상유머', '슬랩스틱', '예측불가능', '당황', '즉흥', '전염성', '상황개그', '팩트폭격']

3) 간단한 요약 문장 1개

형식 예시는 아래와 동일하게 유지:

{
  "tags": ["상황", "캐릭터", "감정"],
  "label": "감정요약",
  "summary": "짧은 설명"
}

설명 없이 JSON만 출력해.
"""


def analyze_frames_with_llm(file_ids):
    contents = [client.files.get(name=fid) for fid in file_ids]

    schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "tags": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
            "label": types.Schema(type=types.Type.STRING),
            "summary": types.Schema(type=types.Type.STRING)
        },
        required=["tags", "label", "summary"]
    )

    response = client.models.generate_content(
        model="models/gemini-2.5-pro",
        contents=contents + [PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema
        ),
    )

    print("🎯 LLM Structured Output:", response)

    # ⚠️ 실제 JSON string 추출
    json_text = response.candidates[0].content.parts[0].text

    # dict로 파싱
    data = json.loads(json_text)

    return {
        "tags": data.get("tags", []),
        "label": data.get("label", ""),
        "summary": data.get("summary", ""),
    }
# ------------------------------------------------------------
# 4) Files 삭제
# ------------------------------------------------------------
def cleanup_gemini_files(file_ids):
    for fid in file_ids:
        client.files.delete(name=fid)
        print("🗑️ 삭제됨:", fid)

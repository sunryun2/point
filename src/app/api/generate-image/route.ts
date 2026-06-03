import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    // @google/generative-ai SDK 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // gemini-2.0-flash 모델 설정
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 프롬프트 전송 및 답변 생성
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // { text: '...' } 형태로 반환
    return NextResponse.json({ text: text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'API 호출에 실패했습니다.' }, { status: 500 });
  }
}

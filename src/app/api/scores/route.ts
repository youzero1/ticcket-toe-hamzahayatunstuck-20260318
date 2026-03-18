import 'reflect-metadata';
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { GameResult } from '@/lib/entities/GameResult';

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const results = await repo.find({
      order: { datePlayed: 'DESC' },
      take: 50,
    });

    const xWins = results.filter((r) => r.winner === 'X').length;
    const oWins = results.filter((r) => r.winner === 'O').length;
    const draws = results.filter((r) => r.winner === 'Draw').length;

    return NextResponse.json({
      scores: { xWins, oWins, draws },
      history: results,
    });
  } catch (error) {
    console.error('GET /api/scores error:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winner } = body as { winner: 'X' | 'O' | 'Draw' };

    if (!winner || !['X', 'O', 'Draw'].includes(winner)) {
      return NextResponse.json({ error: 'Invalid winner value' }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const gameResult = repo.create({ winner });
    await repo.save(gameResult);

    return NextResponse.json({ success: true, result: gameResult }, { status: 201 });
  } catch (error) {
    console.error('POST /api/scores error:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}

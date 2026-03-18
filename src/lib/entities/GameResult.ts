import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('game_results')
export class GameResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 10 })
  winner!: 'X' | 'O' | 'Draw';

  @CreateDateColumn()
  datePlayed!: Date;
}

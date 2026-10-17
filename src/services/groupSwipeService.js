/**
 * GroupSwipeService - Group Mode ("Swipe together")
 * Real-time voting simulation with travel squad consensus matching and celebrations.
 */

import confetti from 'canvas-confetti';
import { audio } from './audioService.js';

export class GroupSwipeService {
  constructor() {
    this.roomCode = localStorage.getItem('furo_room_code') || this.generateRoomCode();
    this.isActive = localStorage.getItem('furo_group_active') === 'true';
    this.members = [
      { id: 'you', name: 'You (Host)', avatar: '🤠', isUser: true },
      { id: 'alex', name: 'Alex (Foodie)', avatar: '🍜', interests: ['Food & Drink', 'Areas of Exploration'] },
      { id: 'maya', name: 'Maya (Culture)', avatar: '⛩️', interests: ['Places to Visit', 'Sights & Views'] },
      { id: 'jordan', name: 'Jordan (Explorer)', avatar: '🧗', interests: ['Sights & Views', 'Areas of Exploration', 'Events & Gigs'] }
    ];
    this.groupMatches = this.loadMatches();
  }

  generateRoomCode() {
    const code = 'FURO-' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('furo_room_code', code);
    return code;
  }

  getMatches(destId) {
    return destId ? this.groupMatches.filter(m => !m.destinationId || m.destinationId === destId) : this.groupMatches;
  }

  loadMatches() {
    try {
      const legacy = localStorage.getItem('travelswipe_group_matches');
      return JSON.parse(localStorage.getItem('furo_group_matches') || legacy || '[]');
    } catch (e) {
      return [];
    }
  }

  saveMatches() {
    localStorage.setItem('furo_group_matches', JSON.stringify(this.groupMatches));
  }

  toggleGroupMode() {
    this.isActive = !this.isActive;
    localStorage.setItem('furo_group_active', this.isActive ? 'true' : 'false');
    return this.isActive;
  }

  registerSwipe(place, action) {
    if (!this.isActive) return null;

    if (action !== 'right' && action !== 'star') {
      return null;
    }

    // Simulate buddy voting logic based on their personality interests
    const votes = {
      you: true
    };

    let positiveVotes = 1;
    this.members.slice(1).forEach(member => {
      // High chance if category matches their interests
      const hasInterestMatch = member.interests.some(cat => place.category === cat || (place.tags || []).includes(cat));
      const vote = hasInterestMatch ? (Math.random() > 0.15) : (Math.random() > 0.45);
      votes[member.id] = vote;
      if (vote) positiveVotes++;
    });

    const isConsensusMatch = positiveVotes >= 3;

    if (isConsensusMatch) {
      // Check if already in group matches
      if (!this.groupMatches.some(m => m.id === place.id)) {
        this.groupMatches.push({
          ...place,
          destinationId: place.destinationId,
          matchedAt: new Date().toISOString(),
          positiveVotes,
          totalVotes: this.members.length
        });
        this.saveMatches();
      }

      // Trigger celebratory confetti and fanfare
      audio.playMatchFanfare();
      this.triggerConfetti();

      return {
        isMatch: true,
        place,
        positiveVotes,
        totalVotes: this.members.length,
        voters: this.members.filter(m => votes[m.id]).map(m => m.name)
      };
    }

    return {
      isMatch: false,
      place,
      positiveVotes,
      totalVotes: this.members.length
    };
  }

  triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 200);
    }
  }
}

export const groupSwipe = new GroupSwipeService();

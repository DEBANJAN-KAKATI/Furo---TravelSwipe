/**
 * Gamification & Explorer Badges.
 * `progress(ctx)` returns [current, target] so the badge sheet can show progress.
 */

export const BADGES = [
  {
    id: 'first_swipe',
    title: 'Wanderlust Spark',
    desc: 'Make your very first swipe',
    icon: '✨',
    progress: c => [Math.min(c.swipes, 1), 1]
  },
  {
    id: 'explorer_5',
    title: 'City Scout',
    desc: 'Save 5 places to your trip',
    icon: '🗺️',
    progress: c => [Math.min(c.saved, 5), 5]
  },
  {
    id: 'foodie_lover',
    title: 'Street Food Gourmet',
    desc: 'Save 3 food & drink spots',
    icon: '🍜',
    progress: c => [Math.min(c.food, 3), 3]
  },
  {
    id: 'temple_seeker',
    title: 'Zen Seeker',
    desc: 'Save 2 temples, shrines or heritage sites',
    icon: '🛕',
    progress: c => [Math.min(c.heritage, 2), 2]
  },
  {
    id: 'knowledge_curious',
    title: 'Smart Traveler',
    desc: 'Open the details of 3 cards',
    icon: '💡',
    progress: c => [Math.min(c.flips, 3), 3]
  },
  {
    id: 'itinerary_master',
    title: 'Master Planner',
    desc: 'Optimize a day route or auto-plan a trip',
    icon: '⚡',
    progress: c => [Math.min(c.optimized, 1), 1]
  },
  {
    id: 'group_matcher',
    title: 'Squad Goals',
    desc: 'Get a group match in Swipe Together',
    icon: '🎉',
    progress: c => [Math.min(c.groupMatches, 1), 1]
  },
  {
    id: 'globetrotter',
    title: 'Globetrotter',
    desc: 'Save places in 3 different cities',
    icon: '🌍',
    progress: c => [Math.min(c.cities, 3), 3]
  },
  {
    id: 'community_voice',
    title: 'Local Legend',
    desc: 'Drop a spot for other travellers',
    icon: '📣',
    progress: c => [Math.min(c.drops, 1), 1]
  },
  {
    id: 'trailblazer',
    title: 'Trailblazer',
    desc: 'Check off 3 places as visited',
    icon: '✅',
    progress: c => [Math.min(c.visited, 3), 3]
  }
];

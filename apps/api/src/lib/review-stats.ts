/** Average star rating rounded to one decimal, plus count. */
export function aggregateRatings(ratings: number[]): { rating: number; reviewCount: number } {
  if (ratings.length === 0) return { rating: 0, reviewCount: 0 };
  const sum = ratings.reduce((acc, value) => acc + value, 0);
  return {
    rating: Math.round((sum / ratings.length) * 10) / 10,
    reviewCount: ratings.length,
  };
}

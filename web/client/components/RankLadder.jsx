import React from 'react';
import { SeasonWinsBadge, rankRequirements, currentRankFor, winsToNextRank } from './SeasonWinsBadge';

const winsWord = (count) => (count === 1 ? 'win' : 'wins');

const seasonWinsLabel = (count) => `${count} season ${winsWord(count)}`;

const progressText = (seasonsWon) => {
  const remaining = winsToNextRank(seasonsWon);
  return remaining === null ? 'Highest rank reached' : `${remaining} more season ${winsWord(remaining)} to the next rank`;
};

const RankRow = ({ minWins, isCurrent }) => (
  <li className={`d-flex align-items-center gap-3 px-2 py-1 rounded ${isCurrent ? 'bg-light bg-opacity-10' : ''}`}>
    <SeasonWinsBadge seasonsWon={minWins} size={40} />
    <span>{seasonWinsLabel(minWins)}</span>
    {isCurrent ? <span className="ms-auto small text-warning">Current rank</span> : null}
  </li>
);

const RankLadder = ({ seasonsWon }) => (
  <div>
    <p className="small text-muted mb-2">{progressText(seasonsWon)}</p>
    <ul className="list-unstyled d-flex flex-column gap-1 mb-0">
      {rankRequirements.map((minWins) => (
        <RankRow key={minWins} minWins={minWins} isCurrent={minWins === currentRankFor(seasonsWon)} />
      ))}
    </ul>
  </div>
);

export { RankLadder };

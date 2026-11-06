import React, { useEffect, useState } from 'react';
import { PlayerName } from './PlayerName';
import { fetchPlayerLeagueStats } from '../api/endpoints';

// Career card surfaces only the worst offenders; the API returns all of them.
const MAX_NEMESES = 5;

// Match the scoreboard's win/loss ratio formatting (undefeated shows "∞").
const formatRatio = ({ won, lost }) =>
  lost === 0 ? '∞' : (won / lost).toFixed(2);

const Stat = ({ label, value }) => (
  <div className="text-center px-2">
    <div className="display-6">{value}</div>
    <small className="text-muted">{label}</small>
  </div>
);

const TeammateLine = ({ label, teammate }) => {
  if (!teammate) return null;
  return (
    <div className="d-flex justify-content-between py-1">
      <span>
        {label}: <PlayerName playerid={teammate.playerId} />
      </span>
      <span className="text-muted">
        {teammate.won}–{teammate.lost} together (W/L {formatRatio(teammate)})
      </span>
    </div>
  );
};

/**
 * A player's career card within a single league: totals, high/low score,
 * best & worst partner and nemeses. Reads on mount from the REST API — the
 * stats are folded on demand server-side (no reactive socket needed).
 */
const PlayerLeagueStats = ({ leagueId, playerId }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setStats(null);
    setError(null);
    fetchPlayerLeagueStats(leagueId, playerId)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) setError(err.message ?? 'Failed to load stats');
      });
    return () => {
      active = false;
    };
  }, [leagueId, playerId]);

  if (error)
    return <div className="text-danger">Could not load stats: {error}</div>;
  if (!stats) return <div>Loading…</div>;

  if (stats.played === 0) {
    return (
      <div>
        <h3 className="h4">
          <PlayerName playerid={playerId} />
        </h3>
        <p className="text-muted">No matches played in this league yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="h4 mb-3">
        <PlayerName playerid={playerId} />
      </h3>

      <div className="d-flex justify-content-around bg-light bg-opacity-10 rounded p-2 mb-3">
        <Stat label="Played" value={stats.played} />
        <Stat label="Won" value={stats.won} />
        <Stat label="Lost" value={stats.lost} />
      </div>

      <div className="d-flex justify-content-around bg-light bg-opacity-10 rounded p-2 mb-3">
        <Stat label="High score" value={stats.highScore ?? '—'} />
        <Stat label="Low score" value={stats.lowScore ?? '—'} />
        <Stat label="Seasons won" value={stats.seasonsWon ?? 0} />
      </div>

      {(stats.bestTeammate || stats.worstTeammate) && (
        <div className="mb-3">
          <h4 className="h6">Teammates</h4>
          <TeammateLine label="Best" teammate={stats.bestTeammate} />
          <TeammateLine label="Worst" teammate={stats.worstTeammate} />
        </div>
      )}

      {stats.nemeses.length > 0 && (
        <div>
          <h4 className="h6">Nemeses</h4>
          <table className="table table-sm">
            <tbody>
              {stats.nemeses.slice(0, MAX_NEMESES).map((nemesis) => (
                <tr key={nemesis.playerId}>
                  <td>
                    <PlayerName playerid={nemesis.playerId} />
                  </td>
                  <td className="text-end text-muted">
                    {nemesis.won}–{nemesis.lost} (W/L {formatRatio(nemesis)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { PlayerLeagueStats };

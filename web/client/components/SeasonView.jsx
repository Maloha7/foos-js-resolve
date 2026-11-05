import React, { useState, useEffect } from 'react';
//import { useQuery, useViewModel } from '@resolve-js/react-hooks'
import { MatchRegistration } from './MatchRegistration';
import { MatchCorrection } from './MatchCorrection';
import { PlayerName } from './PlayerName';
import { useSelector } from 'react-redux';
import { useReduxViewModel } from '@resolve-js/redux';
import { Helmet } from 'react-helmet';
import { Modal } from 'react-bootstrap';
import { Navigate } from 'react-router';
import LoggedInContent from './LoggedInContent';
import Moment from './DateText';
import SeasonHistoryChart from './SeasonHistoryChart';
import { PlayerLeagueStats } from './PlayerLeagueStats';

const byRankDesc = (a, b) => b.rank - a.rank;
const byWinStreak = (a, b) => b.longestWinStreak - a.longestWinStreak;
const byLossStreak = (a, b) => b.longestLossStreak - a.longestLossStreak;

const showTicker = false;

const NoRenderContainer = ({ children }) => {
  return children;
};

const millisecondsSinceMidnight = () => {
  const now = new Date();
  const then = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  return now.getTime() - then.getTime();
};

const classesByRank = (rank) => {
  if (rank == 0) return 'h4 text-primary';
  if (rank < 3) return 'h4 text-success';
  return 'h4';
};

const RecordCard = ({ record }) => (
  <div className="rounded bg-light bg-opacity-10 p-3">
    <div className="d-flex">
      <div className="w-75">
        <h3 className="card-title h6">{record.title}</h3>
        <div className="h4 text-truncate">
          <PlayerName playerid={record.id}></PlayerName>
        </div>
      </div>
      <div className="display-5 w-25 text-end">{record.record}</div>
    </div>
  </div>
);

const SeasonView = ({ id, leagueId }) => {
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [statsPlayer, setStatsPlayer] = useState(null);
  const [correctingMatch, setCorrectingMatch] = useState(null);

  const me = useSelector((state) => state.jwt);

  // Mirrors the server rule (see decideCorrectMatch): a superuser, or a player
  // who was in the match, may correct or void it. The backend re-checks, so this
  // only governs whether we surface the control.
  const canModify = (match) =>
    Boolean(
      me?.superuser ||
        (me?.id && [...match.winners, ...match.losers].includes(me.id)),
    );

  const {
    connect,
    dispose,
    selector: playersSelector,
  } = useReduxViewModel({
    name: 'SeasonRanks',
    aggregateIds: [id],
  });
  const { data: players, playersStatus } = useSelector(playersSelector);
  const rankedPlayerIds = players?.ranks?.map((rank) => rank.id) ?? [];

  useEffect(() => {
    connect();
    return () => {
      dispose();
    };
  }, []);

  return (
    <div className="d-flex flex-lg-column flex-column-reverse my-2">
      <div className="d-flex justify-content-between my-2">
        {(() => {
          if (players?.records?.winStreak) {
            return (
              <div className="w-50 pe-2" style={{ maxWidth: '350px' }}>
                <RecordCard record={players.records.winStreak} />
              </div>
            );
          }
        })()}
        {(() => {
          if (players?.records?.lossStreak) {
            return (
              <div className="w-50 ps-2" style={{ maxWidth: '350px' }}>
                <RecordCard record={players.records.lossStreak} />
              </div>
            );
          }
        })()}
      </div>
      <div className="d-flex flex-column flex-lg-row-reverse">
        <div className="ms-lg-2 w-lg-50">
          <h2 className="h4">Scoreboard</h2>
          <table className="table">
            <thead>
              <tr className="h5">
                <th className="text-start">Player</th>
                <th className="text-center d-none d-sm-table-cell">
                  <span className="d-none d-md-inline">Win/loss ratio</span>
                  <span className="d-inline d-md-none">W/L</span>
                </th>
                <th className="text-end">Rank</th>
              </tr>
            </thead>
            <tbody>
              {players?.ranks?.map((player, idx) => (
                <tr key={player.id} className={classesByRank(idx)}>
                  <td className="text-start">
                    {leagueId ? (
                      <span
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setStatsPlayer(player.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setStatsPlayer(player.id);
                          }
                        }}
                        title="View career stats in this league"
                      >
                        <PlayerName playerid={player.id}></PlayerName>
                      </span>
                    ) : (
                      <PlayerName playerid={player.id}></PlayerName>
                    )}
                  </td>
                  <td className="text-center d-none d-sm-table-cell">
                    {player.lossCount > 0
                      ? (player.winCount / player.lossCount).toFixed(2)
                      : 'No loss'}
                  </td>
                  <td className="text-end">{player.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="me-lg-2 w-lg-50">
          <h2 className="h4">Latest matches</h2>
          <table className="table">
            <thead>
              <tr className="h5">
                <th className="text-start">When</th>
                <th className="text-center d-md-table-cell">Winner(s)</th>
                <th className="text-end">Loser(s)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players?.recentMatches?.map((match, idx) => (
                <tr key={match.timestamp}>
                  <td className="d-table-cell">
                    <Moment
                      date={new Date(match.timestamp)}
                      className="text-light"
                      fromNowDuring={millisecondsSinceMidnight()}
                      format="ll"
                    ></Moment>
                  </td>
                  <td className="d-table-cell">
                    {match.winners.map((id, idx) => (
                      <NoRenderContainer key={idx}>
                        {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                        <PlayerName playerid={id} />
                      </NoRenderContainer>
                    ))}
                  </td>
                  <td className="d-table-cell">
                    {match.losers.map((id, idx) => (
                      <>
                        {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                        <PlayerName playerid={id} />
                      </>
                    ))}
                  </td>
                  <td className="text-end">
                    {canModify(match) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0"
                        title="Correct or void this match"
                        onClick={() => setCorrectingMatch(match)}
                      >
                        Edit
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <SeasonHistoryChart id={id}></SeasonHistoryChart>
        </div>
      </div>

      <LoggedInContent>
        <button
          className="btn btn-primary my-2"
          onClick={() => setShowCreateMatch(true)}
        >
          New Match
        </button>
        <Modal
          fullscreen={'md-down'}
          show={showCreateMatch}
          onHide={() => setShowCreateMatch(false)}
        >
          <Modal.Header>
            <h2>New Match</h2>
          </Modal.Header>
          <Modal.Body>
            <MatchRegistration
              season={id}
              rankedPlayerIds={rankedPlayerIds}
              onCancel={() => setShowCreateMatch(false)}
              onCreated={() => setShowCreateMatch(false)}
            ></MatchRegistration>
          </Modal.Body>
        </Modal>
      </LoggedInContent>

      <Modal
        fullscreen={'md-down'}
        show={Boolean(correctingMatch)}
        onHide={() => setCorrectingMatch(null)}
      >
        <Modal.Header closeButton>
          <h2 className="h5 mb-0">Correct match</h2>
        </Modal.Header>
        <Modal.Body>
          {correctingMatch ? (
            <MatchCorrection
              season={id}
              match={correctingMatch}
              rankedPlayerIds={rankedPlayerIds}
              onCancel={() => setCorrectingMatch(null)}
              onDone={() => setCorrectingMatch(null)}
            />
          ) : null}
        </Modal.Body>
      </Modal>

      <Modal
        fullscreen={'md-down'}
        show={Boolean(statsPlayer)}
        onHide={() => setStatsPlayer(null)}
      >
        <Modal.Header closeButton>
          <h2 className="h5 mb-0">Career stats</h2>
        </Modal.Header>
        <Modal.Body>
          {statsPlayer ? (
            <PlayerLeagueStats leagueId={leagueId} playerId={statsPlayer} />
          ) : null}
        </Modal.Body>
      </Modal>

      {showTicker ? (
        <div className="d-none d-lg-inline my-2">
          <div className="ticker-wrap bg-dark">
            <div className="ticker">
              {players?.recentMatches?.map((match, idx) => (
                <div className="ticker__item" key={match.timestamp}>
                  <Moment
                    date={new Date(match.timestamp)}
                    className="text-light"
                    fromNowDuring={millisecondsSinceMidnight()}
                    format="ll[:]"
                  ></Moment>
                  {match.winners.map((id, idx) => (
                    <NoRenderContainer key={idx}>
                      {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                      <PlayerName playerid={id} className="ms-1" />
                    </NoRenderContainer>
                  ))}
                  <span className="ms-1">won against</span>
                  {match.losers.map((id, idx) => (
                    <NoRenderContainer key={idx}>
                      {idx > 0 ? <span>&nbsp;and&nbsp;</span> : null}
                      <PlayerName playerid={id} className="ms-1" />
                    </NoRenderContainer>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export { SeasonView };

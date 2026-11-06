import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useCommand } from '@resolve-js/react-hooks';
import { PlayerSelect } from './PlayerSelect';
import ConfirmButton from './ConfirmButton';

/**
 * Correct or void an already-registered match.
 *
 * The backend (`decideCorrectMatch`/`decideVoidMatch`) authorizes this — only a
 * superuser or a player who was in the match — and derives `correctedBy` /
 * `voidedBy` from the session, so we send only the outcome and a reason. The
 * side sizes are taken from the match being corrected (1v1 stays 1v1, 2v2 stays
 * 2v2). The live `SeasonRanks` socket push refreshes the scoreboard on success.
 */
const MatchCorrection = ({ season, match, rankedPlayerIds, onDone, onCancel }) => {
  const [winners, setWinners] = useState(match.winners);
  const [losers, setLosers] = useState(match.losers);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  const setAt = (setter) => (index) => (playerId) =>
    setter((prev) => prev.map((p, i) => (i === index ? playerId : p)));
  const setWinnerAt = setAt(setWinners);
  const setLoserAt = setAt(setLosers);

  const swapSides = () => {
    setWinners(losers);
    setLosers(winners);
  };

  const done = (err, result) => {
    if (err) {
      setError(err.message ?? 'Could not update the match');
      return;
    }
    setError(null);
    if (typeof onDone === 'function') onDone(result);
  };

  const correct = useCommand(
    {
      type: 'correctMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: match.matchid, winners, losers, reason },
    },
    done,
  );

  const voidMatch = useCommand(
    {
      type: 'voidMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: match.matchid, reason },
    },
    done,
  );

  const incomplete =
    winners.some((p) => !p) ||
    losers.some((p) => !p) ||
    new Set([...winners, ...losers]).size !== winners.length + losers.length;

  return (
    <Form>
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Form.Label className="text-success">Winner(s)</Form.Label>
      {winners.map((playerId, idx) => (
        // key includes the id so a swap re-seeds PlayerSelect (it reads `player`
        // only on mount).
        <Form.Group key={`w-${idx}-${playerId}`}>
          <PlayerSelect
            player={playerId}
            rankedPlayerIds={rankedPlayerIds}
            onSelected={setWinnerAt(idx)}
            unselectedText="Winner"
            variant="success"
          />
        </Form.Group>
      ))}

      <Form.Label className="text-warning mt-2">Loser(s)</Form.Label>
      {losers.map((playerId, idx) => (
        <Form.Group key={`l-${idx}-${playerId}`}>
          <PlayerSelect
            player={playerId}
            rankedPlayerIds={rankedPlayerIds}
            onSelected={setLoserAt(idx)}
            unselectedText="Loser"
            variant="warning"
          />
        </Form.Group>
      ))}

      <Form.Group className="mt-2">
        <Button variant="outline-secondary" size="sm" onClick={swapSides}>
          Swap winners / losers
        </Button>
      </Form.Group>

      <Form.Group className="mt-3">
        <Form.Label>Reason</Form.Label>
        <Form.Control
          type="text"
          value={reason}
          placeholder="Why is this being changed?"
          onChange={(e) => setReason(e.target.value)}
        />
      </Form.Group>

      <div className="d-flex justify-content-between mt-4">
        <div>
          <Button
            variant="primary"
            className="me-2"
            disabled={incomplete}
            onClick={correct}
          >
            Save correction
          </Button>
          <Button variant="outline-primary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <ConfirmButton
          text="Void match"
          confirmText="Void it?"
          onConfirm={voidMatch}
        />
      </div>
    </Form>
  );
};

export { MatchCorrection };

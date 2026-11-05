import React, { useState } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { v4 as uuid } from 'uuid'
import { useCommand } from '@resolve-js/react-hooks'
import { Button, Form } from "react-bootstrap";

const DoubleMatchCreate = ({ season, rankedPlayerIds, onDone, onCancel }) => {
  const [winner1, setWinner1] = useState()
  const [winner2, setWinner2] = useState()
  const [loser1, setLoser1] = useState()
  const [loser2, setLoser2] = useState()

  const registerMatch = useCommand(
    {
      type: 'registerMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: uuid(), winners: [winner1, winner2], losers: [loser1, loser2] },
    },
    (err, result) => {
      console.log(err, result)
      if (!err && onDone && typeof(onDone) === "function")
        onDone(result)
    }
  )

  const cancelMatch = () => {
    if (onCancel && typeof(onCancel) === "function") 
      onCancel()
    else if (onDone && typeof(onDone) === "function")
      onDone()
  }

  return (<Form>
    <Form.Group controlId="formWinner">
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setWinner1(p)} unselectedText="Winner 1" variant="success"></PlayerSelect>
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setWinner2(p)} unselectedText="Winner 2" variant="success"></PlayerSelect>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setLoser1(p)} unselectedText="Loser 1" variant="warning"></PlayerSelect>
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setLoser2(p)} unselectedText="Loser 2" variant="warning"></PlayerSelect>
    </Form.Group>
    <Form.Group className="mt-4">
      <Button onClick={registerMatch} className="me-2" variant="primary" style={{"width": "10ch"}}>Add</Button> 
      <Button onClick={cancelMatch} variant="outline-primary" style={{"width": "10ch"}}>Cancel</Button>
    </Form.Group>
  </Form>)
}

export { DoubleMatchCreate }
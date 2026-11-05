import React, { useState } from "react";
import { PlayerSelect } from "./PlayerSelect";
import { v4 as uuid } from 'uuid'
import { useCommand } from '@resolve-js/react-hooks'
import { Button, Form } from "react-bootstrap";

const SingleMatchCreate = ({ season, rankedPlayerIds, onDone, onCancel }) => {
  const [winner, setWinner] = useState()
  const [loser, setLoser] = useState()

  const registerMatch = useCommand(
    {
      type: 'registerMatch',
      aggregateId: season,
      aggregateName: 'Season',
      payload: { matchid: uuid(), winners: [winner], losers: [loser] },
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
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setWinner(p)} unselectedText="Winner" variant="success"></PlayerSelect>
    </Form.Group>
    <Form.Group controlId="formLoser">
      <PlayerSelect rankedPlayerIds={rankedPlayerIds} onSelected={(p) => setLoser(p)} unselectedText="Loser" variant="warning"></PlayerSelect>
    </Form.Group>
    <Form.Group className="mt-4">
      <Button onClick={registerMatch} className="me-2" variant="primary" style={{"width": "10ch"}}>Add</Button> 
      <Button onClick={cancelMatch} variant="outline-primary" style={{"width": "10ch"}}>Cancel</Button>
    </Form.Group>
  </Form>)
}

export { SingleMatchCreate }
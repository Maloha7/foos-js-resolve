import React, { useState } from "react";
import { Button, Form, FormGroup } from "react-bootstrap";
import { DoubleMatchCreate } from "./DoubleMatchCreate";
import { SingleMatchCreate } from "./SingleMatchCreate";

const MatchRegistration = ({season, rankedPlayerIds, onCancel, onCreated}) => {
  const [registration, setRegistration] = useState()

  const onDone = function () {
    setRegistration()
    if (onCreated && typeof(onCreated) === "function")
      onCreated();
  }

  return (
    <div>
      {(() => {
        switch (registration) {
          case "single":
            return <SingleMatchCreate season={season} rankedPlayerIds={rankedPlayerIds} onDone={onDone} onCancel={onCancel}></SingleMatchCreate>
          case "double":
            return <DoubleMatchCreate season={season} rankedPlayerIds={rankedPlayerIds} onDone={onDone} onCancel={onCancel}></DoubleMatchCreate>
          default:
            return <FormGroup>
              <Button onClick={() => setRegistration("single")} className="me-2" size="lg" style={{"width": "14ch"}}>Single</Button>
              <Button onClick={() => setRegistration("double")} className="me-2" size="lg" style={{"width": "14ch"}}>Double</Button>
              <Button onClick={onCancel} variant="outline-primary" size="lg">Cancel</Button>
            </FormGroup>
        }
      })()}
    </div>)
}

export { MatchRegistration }
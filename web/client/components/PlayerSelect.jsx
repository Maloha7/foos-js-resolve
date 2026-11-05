import React, { useState, useEffect } from 'react'
import { useQuery } from '@resolve-js/react-hooks'
import Gravatar from 'react-gravatar';

const PlayerAvatar = ({player, unselectedText, size = 64}) => {
  if (player) {
    if (player.avatar)
      return (<img className="me-2 rounded-circle bg-light d-md flex-shrink-0" height={size} width={size} src={player.avatar} alt=""></img>)
    else
      return (<Gravatar className="me-2 rounded-circle bg-light d-md flex-shrink-0" email={player.email} size={size} default="robohash"></Gravatar>)
  } else {
    return (<svg className='me-2 rounded-circle' xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice" width={size} height={size}>
    <rect width="100%" height="100%" fill="#868e96"></rect>
    <text textAnchor="middle" x="50%" y="50%" fill="#dee2e6" dy=".5em">{unselectedText ?? "P"}</text>
  </svg>)
  }
}

const playersInRankOrder = (players, rankedPlayerIds) =>
  rankedPlayerIds
    .map((id) => players.find((p) => p.id == id))
    .filter(Boolean)

const matchesSearch = (search) => (player) =>
  (player.name ?? '').toLowerCase().includes(search.trim().toLowerCase())

const PlayerPill = ({ player, isSelected, onPick }) => (
  <button
    type="button"
    className={`btn ${isSelected ? "btn-secondary" : "btn-outline-secondary"} rounded-pill m-1 p-1 pe-3 d-inline-flex align-items-center`}
    style={{ maxWidth: "100%" }}
    onClick={() => onPick(player)}
  >
    <PlayerAvatar player={player} size={32}></PlayerAvatar>
    <span className="text-truncate">{player.name}</span>
  </button>
)

const PlayerSelect = ({player, onSelected, unselectedText, variant, rankedPlayerIds = []}) => {
  const [selected, setSelected] = useState(player)
  const [selectedPlayer, setSelectedPlayer] = useState()
  const [showSelect, setShowSelect] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [players, setPlayers] = useState([])

  const getPlayers = useQuery({ name: 'Players', resolver: 'all', args: {} }, (error, result) => {
    setPlayers(result.data)
  })

  useEffect(() => {
    getPlayers()
  }, [])

  useEffect(() => {
    const p = players.find((p) => p.id == selected)
    setSelectedPlayer(p)
  }, [players, selected])

  const rankedPlayers = playersInRankOrder(players, rankedPlayerIds)
  const isExpanded = showAll || rankedPlayers.length === 0
  const visiblePlayers = isExpanded ? players.filter(matchesSearch(search)) : rankedPlayers

  const closeSelect = () => {
    setShowSelect(false)
    setShowAll(false)
    setSearch('')
  }

  const pickPlayer = (p) => {
    setSelected(p.id)
    if (onSelected && typeof(onSelected) === "function")
      onSelected(p.id);
    closeSelect()
  }

  const shortText = unselectedText.match(/(?:^|\W)[\w]/g).map(l => l.trim().toUpperCase()).join("").replace("-", "");
  return (
    <div className='my-2'>
      <div onClick={() => setShowSelect(true)} className={`d-flex d-flex-row align-items-center rounded-pill p-1 btn btn-${ selected ? variant ?? "secondary" : "outline-secondary" }`}>
        <PlayerAvatar player={selectedPlayer} unselectedText={shortText}></PlayerAvatar>
        <div className={`h3 text-truncate ${ showSelect ? "d-none": ""}`}>{selectedPlayer?.name ?? unselectedText}</div>
      </div>
      {showSelect ? (
        <div className="bg-dark rounded" style={{ position: "absolute", inset: 0, zIndex: 10, overflowY: "auto", minHeight: "60vh" }}>
          <div className="bg-dark d-flex align-items-center gap-2 p-2 border-bottom border-secondary" style={{ position: "sticky", top: 0, zIndex: 1 }}>
            {isExpanded ? (
              <input
                type="search"
                className="form-control"
                placeholder="Search players"
                aria-label="Search players"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            ) : (
              <span className="h5 mb-0 flex-grow-1">{unselectedText}</span>
            )}
            <button type="button" className="btn-close btn-close-white flex-shrink-0" aria-label="Close" onClick={closeSelect}></button>
          </div>
          <div className="d-flex flex-wrap p-1">
            {visiblePlayers.map((p) => (
              <PlayerPill key={p.id} player={p} isSelected={p.id == selected} onPick={pickPlayer}></PlayerPill>
            ))}
            {visiblePlayers.length === 0 ? (
              <div className="text-muted p-2">No players match "{search}"</div>
            ) : null}
          </div>
          {rankedPlayers.length > 0 ? (
            <div className="p-2">
              <button type="button" className="btn btn-link p-0" onClick={() => { setShowAll(!showAll); setSearch('') }}>
                {showAll ? "Show scoreboard only" : "Show all players"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export { PlayerSelect }

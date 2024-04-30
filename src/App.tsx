import { produce } from "immer";
import { useReducer } from "react";
import { twMerge } from "tailwind-merge";

const STATE: State = {
  players: ["Jogador", "Jogador"],
  turn: 0,
  winner: null,
  board: Array.from({ length: 9 }, (_, id) => ({
    id,
    player: null,
    lifetime: 0,
  })),
};

const CELL_VALUE = ["x", "o"];
const CELL_COLORS = ["text-blue-400", "text-green-500"];
const PLAYER_TURN = ["bg-blue-400 text-white", "bg-green-500 text-white"];

function App() {
  const [state, send] = useReducer<typeof reducer>(reducer, STATE);
  const hasWinner = state.winner != null;

  return (
    <div className="grid h-full w-full grid-rows-[20%_1fr] items-center justify-center">
      <div className="flex justify-between py-2">
        {state.players.map((player, id) => (
          <div
            key={id}
            className={twMerge(
              state.turn === id ? PLAYER_TURN[id] : CELL_COLORS[id],
              "flex items-center gap-4 p-4 text-6xl font-bold uppercase",
            )}
          >
            <div
              contentEditable={true}
              className="w-fit bg-transparent font-sans"
            >
              {player}
            </div>
            {CELL_VALUE[id]}
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="grid grid-cols-3 gap-4 bg-white/10">
          {state.board.map((cell) => {
            const isWinner = hasWinner && state.winner === cell.player;

            return (
              <button
                key={cell.id}
                className={twMerge(
                  "leading-none",
                  "flex h-56 w-56 cursor-pointer select-none items-center justify-center bg-base text-[15rem] font-bold",
                  isWinner
                    ? PLAYER_TURN[cell.player!]
                    : CELL_COLORS[cell.player ?? -1],
                )}
                disabled={state.winner != null}
                onClick={() => {
                  send({
                    type: "move",
                    player: state.turn,
                    position: cell.id,
                  });
                }}
              >
                <span
                  data-winner={state.winner}
                  className={twMerge(
                    "uppercase leading-none",
                    cell.lifetime === 1 && !isWinner
                      ? "opacity-20"
                      : "opacity-100",
                  )}
                >
                  {cell.player == null ? null : CELL_VALUE[cell.player]}
                </span>
              </button>
            );
          })}
        </div>

        {hasWinner ? (
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-base/80">
            <button
              className="rounded border-b-[0.5rem] border-black/30 bg-white px-8 py-4 text-4xl font-bold uppercase tracking-wider text-black active:border-b-0"
              onClick={() => {
                send({
                  type: "restart",
                });
              }}
            >
              Recomeçar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;

type State = {
  players: string[];
  turn: number;
  winner: number | null;
  board: {
    id: number;
    player: number | null;
    lifetime: number;
  }[];
};

type Actions = {
  move: {
    player: number;
    position: number;
  };
  restart: {};
};

function updateLifetime(state: State) {
  for (const cell of state.board) {
    cell.lifetime = Math.max(0, cell.lifetime - 1);

    if (cell.lifetime === 0 && cell.player != null) {
      cell.player = null;
    }
  }
}

function checkWinner(state: State) {
  // 0 1 2 | 0, 1, 2, 3, 4, 5, 6, 7, 8
  // 3 4 5
  // 6 7 8
  //
  // x x x | x, x, x, 3, 4, 5, 6, 7, 8
  // - - -
  // - - -
  //
  // x - - | x, 1, 2, x, 4, 5, x, 7, 8
  // x - -
  // x - -
  const checks = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8],
  ];

  for (const positions of checks) {
    let winner: number | null = null;

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const { player } = state.board[position];

      if (i === 0) {
        winner = player;
        continue;
      }

      if (player !== winner) {
        winner = null;
        break;
      }

      if (i === positions.length - 1 && winner != null) {
        return winner;
      }
    }
  }

  return null;
}

function nextTurn(state: State) {
  state.turn = (state.turn + 1) % state.players.length;
}

function reducer(state: State, action: Action): State {
  if (action.type === "restart") {
    const draft = {
      ...STATE,
      turn: state.turn,
      players: state.players,
    };

    nextTurn(draft);

    return draft;
  }

  if (action.type === "move") {
    if (state.winner != null) {
      return state;
    }

    const cell = state.board[action.position];

    if (cell.lifetime > 1) {
      return state;
    }

    const next = produce(state, (draft) => {
      updateLifetime(draft);

      const cell = draft.board[action.position];
      cell.player = action.player;
      cell.lifetime = 6;

      draft.winner = checkWinner(draft);

      if (draft.winner == null) {
        nextTurn(draft);
      }
    });

    return next;
  }

  return state;
}

type Identity<T> = T extends object
  ? {
      [P in keyof T]: T[P];
    }
  : T;

type Action = {
  [Key in keyof Actions]: Identity<{ type: Key } & Actions[Key]>;
}[keyof Actions];

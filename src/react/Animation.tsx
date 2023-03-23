import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import { AnimationEngineContext } from "./context";
import { AnimationEngine } from "../Engine";

interface Props {
  id: string;
  halt?: [boolean, Dispatch<SetStateAction<boolean>>];
  clockState?: [number, Dispatch<SetStateAction<number>>];
  intervalState?: [number, Dispatch<SetStateAction<number>>];

  children: ReactNode;
}

export function Animation({
  id,
  halt: [_halt, _setHalt] = [null!, null!],
  intervalState: [_interval, _setInterval] = [null!, null!],
  children,
}: Props) {
  const [__halt, __setHalt] = useState(false),
    [__interval, __setInterval] = useState(50),
    [halt, setHalt] = [_halt || __halt, _setHalt || __setHalt],
    [interval, setInterval] = [
      _interval || __interval,
      _setInterval || __setInterval,
    ];

  const [engine] = useState(new AnimationEngine(id));

  useEffect(() => {
    engine.halt = halt;
  }, [halt]);

  useEffect(() => {
    engine.interval = interval;
  }, [interval]);

  return (
    <AnimationEngineContext.Provider
      value={{
        clock: engine.clock,
        interval: engine.interval,
        events: {},
        insert: engine.schedule,
        remove: engine.deschedule,
      }}
    >
      {children}
    </AnimationEngineContext.Provider>
  );
}

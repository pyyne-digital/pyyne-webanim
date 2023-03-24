import { createContext, Dispatch, SetStateAction } from "react";

type State<T> = readonly [T, Dispatch<SetStateAction<T>>];

export namespace NSAnimation {
  export type Triggers = ({ time: number } | { flags: string[] }) &
    Partial<{ time: number; flags: string[] }>;

  export type Event = {
    id: string;
    delay?: number;
    triggers: NSAnimation.Triggers;

    flags?: Partial<{
      start: string[];
      end: string[];
    }>;

    function: Function;
  };

  export type ScheduledEvent = Event & { action: "insert" | "remove" };

  export type EventBuilder = (params: {
    clock: number;
  }) => Event | ScheduledEvent;

  export type Schedule = {
    [componentName: string]: {
      [eventId: string]: NSAnimation.ScheduledEvent;
    };
  };

  export type EventCollection = {
    [componentName: string]: {
      [eventId: string]: NSAnimation.Event;
    };
  };
}

export const defaultContext = {
  halt: null! as State<boolean> | undefined,
  clock: 0,
  interval: 10,

  events: {} as NSAnimation.EventCollection,

  insert: (() => {
    throw new Error("Context not initialised");
  }) as (
    componentName: string,
    builder: NSAnimation.EventBuilder
  ) => NSAnimation.Event,

  remove: (() => {
    throw new Error("Context not initialised");
  }) as (
    componentName: string,
    eventId?: string
  ) => NSAnimation.EventCollection[string] | NSAnimation.Event | null,
};

export const AnimationEngineContext = createContext(defaultContext);

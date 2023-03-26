import { NSAnimation } from "./react/context";

declare global {
  interface Window {
    __pyyne: Partial<{
      animations: {
        [animationId: string]: AnimationEngine;
      };
    }>;
  }
}

type InitialisationOptions = Partial<{
  interval: number;
}>;

type TimeParameter = number | ((clock: number) => number);
type FnParameter = (clock: number) => void;

export class AnimationEngine {
  Id: string;
  Halt = true;

  clock = 0;
  Interval = 50;
  intervals: NodeJS.Timer[] = [];

  events: NSAnimation.EventCollection = {};

  constructor(id: string, { interval = 20 }: InitialisationOptions = {}) {
    this.Id = id;
    this.interval = interval;

    if (!window.__pyyne) window.__pyyne = {};
    if (!window.__pyyne.animations) window.__pyyne.animations = {};

    window.__pyyne.animations[id] = this;
  }

  get id() {
    return this.Id;
  }

  get interval() {
    return this.Interval;
  }

  set interval(value: number) {
    const halted = this.halt;

    this.halt = true;
    this.Interval = value;
    this.halt = halted;
  }

  get halt() {
    return this.Halt;
  }

  set halt(value: boolean) {
    if (value) this.intervals.forEach(clearInterval);
    else
      this.intervals = [
        setInterval(this.tick, this.interval),
        setInterval(this.purge, this.interval * 100),
      ];

    this.Halt = value;
  }

  fire(event: NSAnimation.Event) {
    event.function();
  }

  isExpired = (event: NSAnimation.Event) => {
    return (event.triggers.time || -1) < this.clock;
  };

  schedule = (componentName: string, builder: NSAnimation.EventBuilder) => {
    const { clock } = this,
      event = builder({ clock });

    this.events[componentName] = {
      ...(this.events[componentName] || {}),
      [event.id]: event,
    };

    return event;
  };

  deschedule = (componentName: string, eventId?: string) => {
    const collection = this.events[componentName],
      event = eventId ? collection?.[eventId] : null;

    if (!collection || (eventId && !event)) {
      console.error(
        `Attempted to unschedule event or collection "${componentName}.${eventId}" but it could not be found`
      );

      return null;
    }

    if (eventId) delete this.events[componentName][eventId];
    else delete this.events[componentName];

    return event ?? collection ?? null;
  };

  tick = () => {
    if (this.halt) return;

    this.clock++;

    Object.values(this.events)
      .reduce(
        (otherEvents, collection) => [
          ...otherEvents,
          ...(Object.values(collection).filter(
            (event) => event.triggers?.time === this.clock
          ) || []),
        ],
        [] as NSAnimation.Event[]
      )
      .forEach(this.fire);
  };

  purge = () => {
    this.events = Object.entries(this.events).reduce(
      (all, [componentName, collection]) => ({
        ...all,
        [componentName]: Object.entries(collection).reduce(
          (otherEvents, [eventId, event]) =>
            this.isExpired(event)
              ? otherEvents
              : { ...otherEvents, [eventId]: event },
          {}
        ),
      }),
      {}
    );
  };

  registerFrame =
    (componentName: string) =>
    (id: string) =>
    (time: TimeParameter) =>
    (fn: FnParameter, adjustment = 0) =>
      this.schedule(componentName, ({ clock }) => ({
        id,
        function: fn,
        triggers: {
          time: (typeof time === "function" ? time(clock) : time) + adjustment,
        },
      }));

  timerById =
    (componentName: string, id: string) =>
    (time: TimeParameter) =>
    (fn: FnParameter, adjustment = 0) =>
      this.registerFrame(componentName)(id)(time)(fn, adjustment);

  timerByIndexedId =
    (componentName: string, id: string, i = 0) =>
    (time: TimeParameter) =>
    (fn: FnParameter, adjustment = 0) => {
      this.registerFrame(componentName)(`${id}-${i}`)(time)(fn, adjustment);

      return this.timerByIndexedId(componentName, id, i + 1);
    };

  timer =
    (componentName: string, time: TimeParameter) =>
    (id: string) =>
    (fn: FnParameter, adjustment = 0) =>
      this.registerFrame(componentName)(id)(time)(fn, adjustment);
}

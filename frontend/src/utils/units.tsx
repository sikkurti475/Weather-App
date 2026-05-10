import { createContext, useContext, useState, ReactNode } from 'react';

export type Unit = 'imperial' | 'metric';

interface UnitsCtx {
  unit: Unit;
  toggle: () => void;
}

const Ctx = createContext<UnitsCtx>({ unit: 'imperial', toggle: () => {} });

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>('imperial');
  return (
    <Ctx.Provider value={{ unit, toggle: () => setUnit(u => u === 'imperial' ? 'metric' : 'imperial') }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUnits() { return useContext(Ctx); }

// Conversions — backend always sends imperial
export function toTemp(f: number, unit: Unit) {
  return unit === 'imperial' ? Math.round(f) : Math.round((f - 32) * 5 / 9);
}

export function tempLabel(unit: Unit) { return unit === 'imperial' ? '°F' : '°C'; }

export function toWind(mph: number, unit: Unit) {
  return unit === 'imperial' ? Math.round(mph) : Math.round(mph * 1.60934);
}

export function windLabel(unit: Unit) { return unit === 'imperial' ? 'mph' : 'km/h'; }

export function toVisibility(mi: number, unit: Unit) {
  return unit === 'imperial' ? Math.round(mi) : Math.round(mi * 1.60934);
}

export function visibilityLabel(unit: Unit) { return unit === 'imperial' ? 'mi' : 'km'; }

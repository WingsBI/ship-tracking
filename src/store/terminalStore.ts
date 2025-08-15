import { create } from 'zustand'

type TerminalState = {
	selectedTerminalId: string | null
	setSelectedTerminalId: (id: string | null) => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
    selectedTerminalId: null, // Start with null so the effect can set it properly
	setSelectedTerminalId: (id) => set({ selectedTerminalId: id }),
}))



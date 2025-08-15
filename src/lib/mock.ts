import AxiosMockAdapter from 'axios-mock-adapter'
import { apiClient } from './api'

export function enableApiMocks() {
	const mock = new AxiosMockAdapter(apiClient, { delayResponse: 400 })

	const terminals = [
		{ id: 't1', name: 'Terminal A' },
		{ id: 't2', name: 'Terminal B' },
	]

	mock.onGet('/terminals').reply(200, terminals)

	function vesselsFor(terminalId: string) {
		const suffix = terminalId.toUpperCase()
		return [
			{ id: `v1-${terminalId}`, name: `Evergreen ${suffix}`, eta: '2025-08-20T08:00:00Z', status: 'On route' },
			{ id: `v2-${terminalId}`, name: `Maersk ${suffix}`, eta: '2025-08-21T10:00:00Z', status: 'Delayed' },
		]
	}

	function allVessels() {
		return terminals.flatMap(terminal => vesselsFor(terminal.id))
	}

	mock.onGet('/vessels/expected-arrivals').reply((config) => {
		const terminalId = (config.params?.terminalId as string) || 't1'
		if (terminalId === 'all') {
			return [200, allVessels()]
		}
		return [200, vesselsFor(terminalId)]
	})
	mock.onGet('/vessels/imports').reply((config) => {
		const terminalId = (config.params?.terminalId as string) || 't1'
		if (terminalId === 'all') {
			return [200, allVessels().map((v) => ({ ...v, status: 'Discharging' }))]
		}
		return [200, vesselsFor(terminalId).map((v) => ({ ...v, status: 'Discharging' }))]
	})
	mock.onGet('/vessels/expected-departures').reply((config) => {
		const terminalId = (config.params?.terminalId as string) || 't1'
		if (terminalId === 'all') {
			return [200, allVessels().map((v) => ({ ...v, status: 'Departing soon' }))]
		}
		return [200, vesselsFor(terminalId).map((v) => ({ ...v, status: 'Departing soon' }))]
	})
	mock.onGet('/vessels/anchored').reply((config) => {
		const terminalId = (config.params?.terminalId as string) || 't1'
		if (terminalId === 'all') {
			return [200, allVessels().map((v) => ({ ...v, status: 'Anchored' }))]
		}
		return [200, vesselsFor(terminalId).map((v) => ({ ...v, status: 'Anchored' }))]
	})

	mock.onGet('/cargo').reply((config) => {
		const terminalId = (config.params?.terminalId as string) || 't1'
		return [
			200,
			[
				{ id: `c1-${terminalId}`, reference: `REF-${terminalId}-001`, type: 'Container', status: 'Arrived', lastUpdated: '2025-08-18T09:00:00Z' },
				{ id: `c2-${terminalId}`, reference: `REF-${terminalId}-002`, type: 'Bulk', status: 'In transit', lastUpdated: '2025-08-17T12:00:00Z' },
			],
		]
	})

	// Search cargo akin to USP_CargoTracking
	mock.onGet('/cargo/search').reply((config) => {
		const searchString = (config.params?.SearchString as string) || ''
		const operator = (config.params?.Operator as string) || 'Contains'
		const terminalCode = (config.params?.TerminalCode as string | null) ?? null

		// Create cargo data for all terminals when terminalCode is null (All terminals)
		const allCargo = terminals.flatMap(terminal => 
			['600BRG40-001', '600BRG40-XYZ', 'ABCD1234', 'EFGH5678'].map((ref, idx) => ({
				id: `c${idx + 1}-${terminal.id}`,
				reference: ref,
				type: idx % 2 === 0 ? 'Container' : 'Bulk',
				status: idx % 2 === 0 ? 'Arrived' : 'In transit',
				lastUpdated: '2025-08-18T09:00:00Z',
			}))
		)

		// Use specific terminal data if terminalCode is provided
		const pool = terminalCode ? 
			['600BRG40-001', '600BRG40-XYZ', 'ABCD1234', 'EFGH5678'].map((ref, idx) => ({
				id: `c${idx + 1}-${terminalCode}`,
				reference: ref,
				type: idx % 2 === 0 ? 'Container' : 'Bulk',
				status: idx % 2 === 0 ? 'Arrived' : 'In transit',
				lastUpdated: '2025-08-18T09:00:00Z',
			})) : allCargo

		function matches(ref: string) {
			if (!searchString) return true
			switch (operator) {
				case 'Equals':
					return ref.toLowerCase() === searchString.toLowerCase()
				case 'StartsWith':
					return ref.toLowerCase().startsWith(searchString.toLowerCase())
				case 'Contains':
				default:
					return ref.toLowerCase().includes(searchString.toLowerCase())
			}
		}

		return [200, pool.filter((c) => matches(c.reference))]
	})

	mock.onGet(/\/cargo\/.+\/tracking/).reply((config) => {
		const cargoId = config.url?.split('/')[2] || 'c1'
		return [
			200,
			{
				cargoId,
				timeline: [
					{ time: '2025-08-16T08:00:00Z', status: 'Loaded at origin', location: 'Shanghai' },
					{ time: '2025-08-18T11:00:00Z', status: 'Arrived at terminal', location: 'Terminal A' },
					{ time: '2025-08-19T14:30:00Z', status: 'Customs cleared' },
				],
			},
		]
	})

	return mock
}



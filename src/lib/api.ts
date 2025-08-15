import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { z } from 'zod'

// API Response wrapper schema
export const ApiResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().nullable(),
	data: z.unknown().nullable(),
	statusCode: z.number(),
})

export const TerminalSchema = z.object({
	terminalID: z.string().nullable(),
	terminalCode: z.string().nullable(),
	terminalName: z.string().nullable(),
})
export type Terminal = z.infer<typeof TerminalSchema>

export const VesselSchema = z.object({
	vesselId: z.number(),
	vesselName: z.string().nullable(),
	arrivalDate: z.string().nullable(),
	departureDate: z.string().nullable(),
})
export type Vessel = z.infer<typeof VesselSchema>

export const CargoSchema = z.object({
	terminal: z.string().nullable(),
	blId: z.number(),
	blNumber: z.string().nullable(),
	blType: z.string().nullable(),
	cargoID: z.number(),
	qtyOrdered: z.number(),
	totalQtyHandled: z.number(),
	totalQtyHandledOut: z.number(),
	cargoType: z.string().nullable(),
	containerID: z.string().nullable(),
	mvvin: z.string().nullable(),
	gcmarks: z.string().nullable(),
})
export type Cargo = z.infer<typeof CargoSchema>

export const CargoTrackingEventSchema = z.object({
	eventNo: z.number(),
	eventDescription: z.string().nullable(),
	eventDate: z.string(), // Changed from datetime() to just string to handle various date formats
})
export type CargoTrackingEvent = z.infer<typeof CargoTrackingEventSchema>

export const CargoTrackingDetailResponseSchema = z.object({
	trackingDetails: z.array(CargoTrackingEventSchema).nullable(),
	success: z.boolean(),
	message: z.string().nullable(),
})
export type CargoTrackingDetailResponse = z.infer<typeof CargoTrackingDetailResponseSchema>

export const CargoTrackingRequestSchema = z.object({
	searchString: z.string().nullable(),
	operator: z.string().nullable(),
	terminalCode: z.string().nullable(),
})
export type CargoTrackingRequest = z.infer<typeof CargoTrackingRequestSchema>

export const CargoTrackingResponseSchema = z.object({
	cargoList: z.array(CargoSchema).nullable(),
	success: z.boolean(),
	message: z.string().nullable(),
})
export type CargoTrackingResponse = z.infer<typeof CargoTrackingResponseSchema>

export const GetVesselDetailsResponseSchema = z.object({
	vessels: z.array(VesselSchema).nullable(),
})
export type GetVesselDetailsResponse = z.infer<typeof GetVesselDetailsResponseSchema>

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7115'

export const apiClient: AxiosInstance = axios.create({
	baseURL: apiBaseUrl,
	withCredentials: false, // Changed to false for CORS
	timeout: 10000,
})

// Add request interceptor for debugging
apiClient.interceptors.request.use((config) => {
	console.log('Making API request:', config.method?.toUpperCase(), config.url)
	return config
})

apiClient.interceptors.response.use(
	(response) => {
		console.log('API response received:', response.status, response.config.url)
		return response
	},
	(error) => {
		console.error('API error:', {
			message: error.message,
			url: error.config?.url,
			status: error.response?.status,
			data: error.response?.data
		})
		return Promise.reject(error)
	}
)

async function parseApiResponse<T>(schema: z.ZodType<T>, response: unknown): Promise<T | null> {
	const apiResponse = ApiResponseSchema.safeParse(response)
	if (!apiResponse.success || !apiResponse.data.success) {
		console.error('API response error:', apiResponse.data?.message || 'Unknown error')
		return null
	}
	
	const parsed = schema.safeParse(apiResponse.data.data)
	if (!parsed.success) {
		console.error('Schema parsing error:', parsed.error)
		return null
	}
	return parsed.data
}



export const Api = {
	// GET /api/Tracking/getAllTerminalInformation
	getTerminals: async (): Promise<Terminal[]> => {
		const { data } = await apiClient.get('/api/Tracking/getAllTerminalInformation')
		const apiResponse = ApiResponseSchema.safeParse(data)
		if (!apiResponse.success || !apiResponse.data.success) {
			console.error('API response error:', apiResponse.data?.message || 'Unknown error')
			return []
		}
		
		// The data field contains the terminal array directly
		const parsed = z.array(TerminalSchema).safeParse(apiResponse.data.data)
		if (!parsed.success) {
			console.error('Schema parsing error:', parsed.error)
			return []
		}
		return parsed.data
	},

	// GET /api/Tracking/getVesselDetailsByTerminal/{terminalCode}
	getVesselsByTerminal: async (terminalCode: string): Promise<Vessel[]> => {
		const { data } = await apiClient.get(`/api/Tracking/getVesselDetailsByTerminal/${terminalCode}`)
		const result = await parseApiResponse(GetVesselDetailsResponseSchema, data)
		return result?.vessels || []
	},

	// For backward compatibility, map the old vessel methods to the new API
	getVesselExpectedArrivals: async (terminalCode: string): Promise<Vessel[]> => {
		return Api.getVesselsByTerminal(terminalCode)
	},
	getVesselImports: async (terminalCode: string): Promise<Vessel[]> => {
		return Api.getVesselsByTerminal(terminalCode)
	},
	getVesselExpectedDepartures: async (terminalCode: string): Promise<Vessel[]> => {
		return Api.getVesselsByTerminal(terminalCode)
	},
	getVesselAnchored: async (terminalCode: string): Promise<Vessel[]> => {
		return Api.getVesselsByTerminal(terminalCode)
	},

	// GET /api/Tracking/searchCargoTracking
	searchCargo: async (params: { searchString: string; operator?: string; terminalCode?: string | null }): Promise<Cargo[]> => {
		const { data } = await apiClient.get('/api/Tracking/searchCargoTracking', {
			params: {
				searchString: params.searchString,
				operator: params.operator || 'Equals',
				terminalCode: params.terminalCode,
			},
		})
		const result = await parseApiResponse(CargoTrackingResponseSchema, data)
		return result?.cargoList || []
	},

	// GET /api/Tracking/getAllCargoTracking
	getCargoByTerminal: async (terminalCode?: string): Promise<Cargo[]> => {
		const { data } = await apiClient.get('/api/Tracking/getAllCargoTracking', {
			params: terminalCode ? { terminalCode } : {},
		})
		const result = await parseApiResponse(CargoTrackingResponseSchema, data)
		return result?.cargoList || []
	},

	// GET /api/Tracking/getCargoTrackingDetail/{cargoId}
	getCargoTracking: async (cargoId: number): Promise<CargoTrackingDetailResponse | null> => {
		const { data } = await apiClient.get(`/api/Tracking/getCargoTrackingDetail/${cargoId}`)
		const apiResponse = ApiResponseSchema.safeParse(data)
		if (!apiResponse.success || !apiResponse.data.success) {
			console.error('API response error:', apiResponse.data?.message || 'Unknown error')
			return null
		}
		
		// The API returns a single tracking detail object with nested structure
		const trackingDetail = CargoTrackingDetailResponseSchema.safeParse(apiResponse.data.data)
		if (!trackingDetail.success) {
			console.error('Schema parsing error:', trackingDetail.error)
			return null
		}
		
		return trackingDetail.data
	},
}



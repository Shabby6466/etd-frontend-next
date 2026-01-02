import { z } from "zod"

export const citizenSchema = z.object({
  citizen_id: z
    .string({ invalid_type_error: "Citizen ID must be a 13-digit number", required_error: "Citizen ID is required" })
    .length(13, "Citizen ID must be exactly 13 digits")
    .refine((value) => /^\d{13}$/.test(value), "Citizen ID must be a 13-digit number"),
  first_name: z.string().min(1, "First name is required").max(50, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  image: z.string().min(1, "Image is required"),
  father_name: z.string().min(1, "Father's name is required").max(100, "Father's name too long"),
  mother_name: z.string().min(1, "Mother's name is required").max(100, "Mother's name too long"),
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  profession: z.string().min(1, "Profession is required"),
  pakistan_address: z.string().min(1, "Address is required").max(200, "Address too long"),
  birth_country: z.string().min(1, "Birth country is required"),
  birth_city: z.string().min(1, "Birth city is required"),
  height: z.string().optional(),
  color_of_eyes: z.string().optional(),
  color_of_hair: z.string().optional(),
  transport_mode: z.string().optional(),
  requested_by: z.string().min(1, "Requested by is required"),
  reason_for_deport: z.string().optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val)
        return isNaN(parsed) ? 0 : parsed
      }
      return val || 0
    })
    .optional()
    .default(0),
  currency: z.string().optional(),
  is_fia_blacklist: z.coerce.boolean().default(false),
  status: z.string().optional().default("DRAFT"),
  investor: z.string().optional(),
  securityDeposit: z.string().optional(),
  passport_api_data: z.any().optional(),
  nadra_api_data: z.any().optional(),
  passport_response_id: z.union([z.string(), z.number()]).transform(val => val?.toString() || "").optional()
})

export type CitizenFormData = z.infer<typeof citizenSchema>

export const nadraCitizenDataResponse = z.object({
  citizen_id: z
    .string({ invalid_type_error: "Citizen ID must be a 13-digit number", required_error: "Citizen ID is required" })
    .length(13, "Citizen ID must be exactly 13 digits")
    .refine((value) => /^\d{13}$/.test(value), "Citizen ID must be a 13-digit number"),
  full_name: z.string().min(1, "Full name is required").max(50, "First name too long"),
  image: z.string().min(1, "Image is required"),
  father_name: z.string().min(1, "Father's name is required").max(100, "Father's name too long"),
  mother_name: z.string().min(1, "Mother's name is required").max(100, "Mother's name too long"),
  gender: z.string().min(1, "Gender is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  present_address: z.string().min(1, "Present address is required").max(250, "Address too long"),
  permanent_address: z.string().min(1, "Permanent address is required").max(250, "Address too long"),
})

export type NadraCitizenDataResponse = z.infer<typeof nadraCitizenDataResponse>
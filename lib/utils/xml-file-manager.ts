import fs from "fs"
import path from "path"
import os from "os"

export const XML_DRAFT_DIR = path.join(os.homedir(), "AppData", "Local", "xml_draft")
export const XML_SUBMIT_DIR = path.join(os.homedir(), "AppData", "Local", "xml_submit")
export const XML_COMPLETE_DIR = path.join(os.homedir(), "AppData", "Local", "xml_complete")

const ensureDirectory = (dirPath: string, createIfMissing = false) => {
  if (!fs.existsSync(dirPath) && createIfMissing) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export const listXmlFiles = (dirPath: string = XML_DRAFT_DIR) => {
  if (!fs.existsSync(dirPath)) {
    return []
  }
  return fs.readdirSync(dirPath).filter((file) => file.toLowerCase().endsWith(".xml")).sort()
}

export const readXmlFile = (fileName: string, dirPath: string = XML_DRAFT_DIR) => {
  ensureDirectory(dirPath)
  const filePath = path.join(dirPath, fileName)
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found")
  }
  return fs.readFileSync(filePath, "utf-8")
}

export const moveXmlFile = (
  fileName: string,
  sourceDir = XML_DRAFT_DIR,
  destinationDir = XML_COMPLETE_DIR
) => {
  ensureDirectory(destinationDir, true)
  const sourcePath = path.join(sourceDir, fileName)
  const destinationPath = path.join(destinationDir, fileName)

  if (!fs.existsSync(sourcePath)) {
    throw new Error("Source file not found")
  }

  fs.renameSync(sourcePath, destinationPath)
}

const extractField = (xml: string, field: string, optional = false) => {
  const regex = new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, "i")
  const match = xml.match(regex)
  if (!match) {
    return optional ? "" : ""
  }
  return match[1].trim()
}

export interface ParsedXmlApplication {
  citizenId: string
  firstName: string
  lastName: string
  fatherName: string
  motherName: string
  gender: string
  dateOfBirth: string
  profession: string
  pakistanAddress: string
  pakistanCity: string
  birthCountry: string
  birthCity: string
  requestedBy: string
  height?: string
  colorOfEyes?: string
  colorOfHair?: string
  transportMode?: string
  investor?: string
  reasonForDeport?: string
  amount?: string
  currency?: string
  locationId?: string
  image?: string
  wsqFingerprint?: string
  fingerprint?: string
  fingerprintTemplate?: string
  xmlContent: string
}

export const parseApplicationXml = (xmlContent: string): ParsedXmlApplication => {
  const biometricDataMatch = xmlContent.match(/<biometric_data[^>]*>([\\s\\S]*?)<\\/biometric_data>/i)
  let biometricImage = ""
  let biometricFingerprint = ""
  let biometricTemplate = ""

  if (biometricDataMatch) {
    const biometricContent = biometricDataMatch[1]
    biometricImage = extractField(biometricContent, "image_base64", true)
    biometricFingerprint = extractField(biometricContent, "fingerprint", true)
    biometricTemplate = extractField(biometricContent, "template", true)
  }

  return {
    citizenId: extractField(xmlContent, "citizen_id"),
    firstName: extractField(xmlContent, "first_name"),
    lastName: extractField(xmlContent, "last_name"),
    fatherName: extractField(xmlContent, "father_name"),
    motherName: extractField(xmlContent, "mother_name"),
    gender: extractField(xmlContent, "gender"),
    dateOfBirth: extractField(xmlContent, "date_of_birth"),
    profession: extractField(xmlContent, "profession"),
    pakistanAddress: extractField(xmlContent, "pakistan_address"),
    pakistanCity: extractField(xmlContent, "pakistan_city"),
    birthCountry: extractField(xmlContent, "birth_country"),
    birthCity: extractField(xmlContent, "birth_city"),
    requestedBy: extractField(xmlContent, "requested_by"),
    height: extractField(xmlContent, "height", true),
    colorOfEyes: extractField(xmlContent, "color_of_eyes", true),
    colorOfHair: extractField(xmlContent, "color_of_hair", true),
    transportMode: extractField(xmlContent, "transport_mode", true),
    investor: extractField(xmlContent, "investor", true),
    reasonForDeport: extractField(xmlContent, "reason_for_deport", true),
    amount: extractField(xmlContent, "amount", true),
    currency: extractField(xmlContent, "currency", true),
    locationId: extractField(xmlContent, "location_id", true),
    image: biometricImage || extractField(xmlContent, "image", true),
    wsqFingerprint: extractField(xmlContent, "wsqFingerprint", true) || biometricImage,
    fingerprint: biometricFingerprint || extractField(xmlContent, "fingerprint", true),
    fingerprintTemplate: biometricTemplate || extractField(xmlContent, "fingerprintTemplate", true),
    xmlContent,
  }
}

export const formatAmount = (value?: string) => {
  if (!value) return undefined
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}


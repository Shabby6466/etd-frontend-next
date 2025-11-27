import { TempApplicationData } from "../api/applications"

export function parseXMLToApplicationData(xmlContent: string): TempApplicationData | null {
    try {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

        // Check for parsing errors
        const parserError = xmlDoc.querySelector("parsererror")
        if (parserError) {
            console.error("XML parsing error:", parserError.textContent)
            return null
        }

        // Helper function to get text content from XML element
        const getTextContent = (tagName: string): string => {
            const element = xmlDoc.querySelector(tagName)
            return element?.textContent?.trim() || ""
        }

        // Helper function to decode XML entities
        const decodeXML = (str: string): string => {
            return str
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
        }

        // Extract data from XML
        const amountText = getTextContent("amount")
        const amount = amountText ? parseInt(amountText) : 0

        const data: TempApplicationData = {
            citizen_id: decodeXML(getTextContent("citizen_id")),
            first_name: decodeXML(getTextContent("first_name")),
            last_name: decodeXML(getTextContent("last_name")),
            father_name: decodeXML(getTextContent("father_name")),
            mother_name: decodeXML(getTextContent("mother_name")),
            gender: decodeXML(getTextContent("gender")),
            date_of_birth: decodeXML(getTextContent("date_of_birth")),
            profession: decodeXML(getTextContent("profession")),
            pakistan_address: decodeXML(getTextContent("pakistan_address")),
            birth_country: decodeXML(getTextContent("birth_country")),
            birth_city: decodeXML(getTextContent("birth_city")),
            requested_by: decodeXML(getTextContent("requested_by")),
            location_id: "2010", // Default location
            image: getTextContent("image_base64") || getTextContent("image"),
            height: decodeXML(getTextContent("height")),
            color_of_eyes: decodeXML(getTextContent("color_of_eyes")),
            color_of_hair: decodeXML(getTextContent("color_of_hair")),
            transport_mode: decodeXML(getTextContent("transport_mode")),
            investor: decodeXML(getTextContent("investor")),
            reason_for_deport: decodeXML(getTextContent("reason_for_deport")),
            amount: amount, // Required field, default to 0
            currency: decodeXML(getTextContent("currency")) || "PKR", // Required field, default to PKR
            wsqFingerprint: getTextContent("wsq_fingerprint") || undefined,
            created_by_id: 2, // Required field, default to 2
        }

        // Validate required fields
        if (!data.citizen_id || !data.first_name || !data.last_name) {
            console.error("Missing required fields in XML")
            return null
        }

        return data
    } catch (error) {
        console.error("Error parsing XML:", error)
        return null
    }
}

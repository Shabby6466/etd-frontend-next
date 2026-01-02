"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { applicationAPI } from "@/lib/api/applications"
import { showNotification } from "@/lib/utils/notifications"

export default function TestRejectedApplications() {
  const [results, setResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoints = async () => {
    setIsLoading(true)
    const testResults: any = {}

    try {
      // Test 1: Get all rejected applications (first page)
      console.log("Testing: GET /rejected")
      const rejectedApps = await applicationAPI.getRejectedApplications({
        page: 1,
        limit: 10
      })
      testResults.rejectedApplications = {
        success: true,
        count: rejectedApps.data.length,
        total: rejectedApps.total,
        data: rejectedApps.data.slice(0, 2) // Show first 2 for brevity
      }
      console.log("✅ Rejected applications fetched:", rejectedApps)
    } catch (error) {
      testResults.rejectedApplications = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error("❌ Failed to fetch rejected applications:", error)
    }

    try {
      // Test 2: Get rejected applications with search
      console.log("Testing: GET /applications/rejected?search=test")
      const searchResults = await applicationAPI.getRejectedApplications({
        page: 1,
        limit: 5,
        search: "test"
      })
      testResults.searchResults = {
        success: true,
        count: searchResults.data.length,
        total: searchResults.total,
        data: searchResults.data.slice(0, 2)
      }
      console.log("✅ Search results:", searchResults)
    } catch (error) {
      testResults.searchResults = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error("❌ Failed to search rejected applications:", error)
    }

    try {
      // Test 3: Get rejected applications statistics
      console.log("Testing: GET /rejected/stats")
      const stats = await applicationAPI.getRejectedApplicationsStats()
      testResults.stats = {
        success: true,
        data: stats
      }
      console.log("✅ Stats fetched:", stats)
    } catch (error) {
      testResults.stats = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      console.error("❌ Failed to fetch stats:", error)
    }

    setResults(testResults)
    showNotification.success("API tests completed. Check console for details.")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Rejected Applications API Test</h1>
          <Button onClick={testEndpoints} disabled={isLoading}>
            {isLoading ? "Testing..." : "Run API Tests"}
          </Button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.entries(results).map(([testName, result]: [string, any]) => (
              <Card key={testName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={result.success ? "text-green-600" : "text-red-600"}>
                      {result.success ? "✅" : "❌"}
                    </span>
                    {testName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-2">
                      {result.count !== undefined && (
                        <p><strong>Count:</strong> {result.count}</p>
                      )}
                      {result.total !== undefined && (
                        <p><strong>Total:</strong> {result.total}</p>
                      )}
                      {result.data && (
                        <div>
                          <p><strong>Sample Data:</strong></p>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {result.data && !Array.isArray(result.data) && (
                        <div>
                          <p><strong>Data:</strong></p>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p><strong>Error:</strong> {result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

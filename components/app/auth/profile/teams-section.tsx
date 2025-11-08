"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { formatDate } from "./utils"

interface TeamsSectionProps {
  teams: any[]
}

export function TeamsSection({ teams }: TeamsSectionProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </CardTitle>
        <CardDescription>
          Teams you belong to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teams.length > 0 ? (
          teams.map((team: any) => (
            <div key={team.$id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {team.total} member{team.total !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Created</p>
                <p>{formatDate(team.$createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No teams found</p>
            <p className="text-sm">You are not a member of any teams</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


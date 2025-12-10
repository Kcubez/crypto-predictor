"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface MarketContextProps {
  context: string;
}

export function MarketContext({ context }: MarketContextProps) {
  return (
    <Card className="bg-slate-900/50 border-emerald-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          Market Context
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 leading-relaxed">{context}</p>
      </CardContent>
    </Card>
  );
}

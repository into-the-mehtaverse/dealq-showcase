"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Clock } from 'lucide-react';

export default function PreferencesPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-slate-900">Preferences</h1>
          <Badge variant="secondary">
            Coming Soon
          </Badge>
        </div>
        <p className="text-slate-600 text-lg">
          Set your investment criteria and let our AI find deals that match your buy-box
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Buy Box Feature Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-slate-600" />
              <div>
                <CardTitle className="text-xl">AI-Powered Buy Box</CardTitle>
                <p className="text-slate-600 text-sm mt-1">
                  Define your investment criteria and let our AI identify matching deals
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investment Criteria */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Investment Criteria</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Geographic Preferences</p>
                    <p className="text-xs text-slate-500">Markets, cities, neighborhoods</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Price Range</p>
                    <p className="text-xs text-slate-500">Min/max deal size, price per unit</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Property Types</p>
                    <p className="text-xs text-slate-500">Multifamily, office, retail, mixed-use</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Return Requirements</p>
                    <p className="text-xs text-slate-500">IRR, cash-on-cash, cap rate targets</p>
                  </div>
                </div>
              </div>

              {/* AI Matching */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">AI Matching Engine</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Deal Scoring</p>
                    <p className="text-xs text-slate-500">AI rates deals against your criteria</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Smart Filtering</p>
                    <p className="text-xs text-slate-500">AI filters deals based on your criteria</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-sm">Market Analysis</p>
                    <p className="text-xs text-slate-500">AI analyzes market trends for your criteria</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">How It Works</h4>
              <p className="text-slate-600 text-sm">
                Set your investment criteria once, and our AI will continuously scan the market for deals that match your buy-box.
                Focus only on opportunities that align with your investment strategy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto">
                <Clock className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Preferences Coming Soon
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  We&apos;re building an intelligent buy-box system that will help you find and evaluate deals that match your investment criteria.
                </p>
              </div>
              <Button variant="outline" disabled>
                <Clock className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

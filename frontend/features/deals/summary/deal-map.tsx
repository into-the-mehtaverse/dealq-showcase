import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface DealMapProps {
  className?: string;
}

export default function DealMap({ className = '' }: DealMapProps) {
  return (
    <Card className={className}>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          {/* Google Maps Logo */}
          <div className="w-full h-64 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Image
                src="/google-maps.png"
                alt="Google Maps"
                width={80}
                height={80}
                className="object-contain"
              />
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium">
                  Google Maps integration coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

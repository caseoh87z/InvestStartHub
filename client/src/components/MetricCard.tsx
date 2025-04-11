import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Link } from 'wouter';

interface MetricCardProps {
  icon: string;
  iconBgColor: string;
  title: string;
  value: string | number;
  linkText?: string;
  linkHref?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconBgColor,
  title,
  value,
  linkText,
  linkHref
}) => {
  // Determine background color class
  let bgColorClass = 'bg-primary';
  
  if (iconBgColor === 'secondary') {
    bgColorClass = 'bg-secondary';
  } else if (iconBgColor === 'accent') {
    bgColorClass = 'bg-accent';
  }
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${bgColorClass} rounded-md p-3`}>
              <i className={`${icon} text-white text-xl`}></i>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </CardContent>
      
      {linkText && linkHref && (
        <CardFooter className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <Link href={linkHref}>
              <a className="font-medium text-primary hover:text-blue-500">
                {linkText}
              </a>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MetricCard;

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function TestApiPage() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // آدرس یکی از اندپوئینت‌های پابلیک بکندت که دیتا برمی‌گرداند (مثل products یا categories)
    apiClient('/product')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 font-mono dir-ltr text-left">
      <h1 className="text-xl font-bold mb-4">API Connection Test</h1>

      {loading && <p className="text-amber-500">Connecting to Backend...</p>}

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 text-red-600 rounded">
          ❌ خطا در دریافت دیتا: {error}
        </div>
      )}

      {Boolean(data) && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded">
          <p className="text-emerald-700 font-bold mb-2">✅ ارتباط با بکند با موفقیت برقرار شد!</p>
          <pre className="text-xs overflow-auto max-h-96 bg-white p-3 border rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
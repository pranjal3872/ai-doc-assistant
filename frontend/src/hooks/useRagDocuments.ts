"use client";

import { useState, useEffect, useCallback } from "react";

export interface DocumentItem {
  filename: string;
  pages?: number;
  chunks?: number;
}

export function useRagDocuments(apiGatewayUrl = "http://localhost:5000/api/rag") {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res = await fetch(`${apiGatewayUrl}/documents`);
      if (!res.ok) {
        res = await fetch("http://127.0.0.1:8000/documents");
      }
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error(`HTTP error ${res.status}`);
      }
    } catch (err: any) {
      console.error("FastAPI/Gateway server offline, using mock document list:", err);
      setError(err.message || "Failed to load documents");
      setDocuments([
        { filename: "financial_report_2023.pdf", pages: 3, chunks: 7 },
        { filename: "market_analysis.pdf", pages: 8, chunks: 32 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [apiGatewayUrl]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, setDocuments, isLoading, error, refetch: fetchDocuments };
}

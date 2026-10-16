'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Sanitizes partially streamed or raw markdown strings to prevent parser crashes
 * caused by dangling escape slashes, incomplete angle brackets, or invalid unicode sequences.
 */
export function safeMarkdownString(raw: string | undefined | null): string {
  if (!raw) return '';
  let safe = String(raw)
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '');

  // Strip trailing single backslash that could escape the markdown parser or quote
  if (safe.endsWith('\\') && !safe.endsWith('\\\\')) {
    safe = safe.slice(0, -1);
  }

  // Strip unclosed trailing HTML tags (e.g., '<' or '<span' without '>') at end of stream chunk
  safe = safe.replace(/<[a-zA-Z0-9_\-\s]*$/g, '');

  return safe;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackContent?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught an error parsing/rendering stream markdown:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // When children update with incoming chunks, reset error state so markdown can re-render
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && (prevProps.children !== this.props.children || prevProps.fallbackContent !== this.props.fallbackContent)) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="whitespace-pre-wrap font-serif text-zinc-300 leading-relaxed">
          {this.props.fallbackContent || 'Rendering content...'}
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

/**
 * Processa texto com parênteses e aplica efeito degradê nas palavras entre parênteses
 * Exemplo: "Cuidando da sua (saúde mental) com carinho" 
 * → "Cuidando da sua" + gradiente("saúde mental") + "com carinho"
 */
export function processTextWithGradient(text: string): React.ReactNode {
  if (!text) return text;
  
  // Regex para encontrar texto entre parênteses
  const regex = /\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Adiciona texto antes dos parênteses
    const beforeText = text.slice(lastIndex, match.index);
    if (beforeText) {
      parts.push(beforeText);
    }

    // Adiciona texto com gradiente (sem os parênteses)
    const gradientText = match[1];
    parts.push(
      <span key={match.index} className="text-gradient">
        {gradientText}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  // Adiciona texto restante após o último match
  const remainingText = text.slice(lastIndex);
  if (remainingText) {
    parts.push(remainingText);
  }

  // Se não encontrou parênteses, retorna o texto original
  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
}

/**
 * Hook para processar textos com gradiente
 */
export function useTextGradient(text: string): React.ReactNode {
  return React.useMemo(() => processTextWithGradient(text), [text]);
}
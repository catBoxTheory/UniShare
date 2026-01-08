export interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Format timestamp to VTT format (HH:MM:SS.mmm)
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Generate VTT content from segments
 */
export function generateVTT(segments: SubtitleSegment[]): string {
  let vtt = "WEBVTT\n\n";

  segments.forEach((seg, index) => {
    vtt += `${index + 1}\n`;
    vtt += `${formatTimestamp(seg.start)} --> ${formatTimestamp(seg.end)}\n`;
    vtt += `${seg.text}\n\n`;
  });

  return vtt;
}

/**
 * Generate bilingual VTT (English on top, Chinese below)
 * Assumes segments are roughly aligned in time
 */
export function generateBilingualVTT(enSegments: SubtitleSegment[], zhSegments: SubtitleSegment[]): string {
  let vtt = "WEBVTT\n\n";

  // Use English segments as the timing base
  enSegments.forEach((enSeg, index) => {
    // Find matching Chinese segment by proximity of start time
    const zhSeg = zhSegments.find(zh => 
      Math.abs(zh.start - enSeg.start) < 2.0 // Relaxed matching
    );

    vtt += `${index + 1}\n`;
    vtt += `${formatTimestamp(enSeg.start)} --> ${formatTimestamp(enSeg.end)}\n`;
    vtt += `${enSeg.text}\n`;
    if (zhSeg) {
      vtt += `${zhSeg.text}\n`;
    }
    vtt += `\n`;
  });

  return vtt;
}

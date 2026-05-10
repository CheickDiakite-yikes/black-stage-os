export type TranscriptSegment = {
  id: string;
  text: string;
  isFinal: boolean;
  createdAt: string;
};

export type TranscriptState = {
  segments: TranscriptSegment[];
};

export function createTranscriptState(): TranscriptState {
  return {
    segments: []
  };
}

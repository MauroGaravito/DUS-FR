/**
 * Placeholder AI transcription service.
 * Provider-agnostic; replace implementation with real API calls later.
 */

async function requestTranscription(entry) {
  // Simulate success for now. A real implementation would call an external API.
  // Use a deterministic placeholder to keep behavior predictable in tests.
  if (!entry || entry.type !== 'audio') {
    const error = new Error('Transcription supported only for audio entries');
    error.code = 'UNSUPPORTED_TYPE';
    throw error;
  }

  // Example of simulating occasional errors could go here; keep stable for MVP.
  const mockedTranscription = `Transcription placeholder for entry ${entry._id}`;

  return {
    text: mockedTranscription,
    completedAt: new Date()
  };
}

module.exports = { requestTranscription };

// This service is deprecated as the application now uses local processing.
// Keeping the file structure valid but empty to avoid broken imports in other unused legacy code.

export const analyzeSpeechText = async (text: string): Promise<any> => {
  throw new Error("This function is deprecated. Use local processing in InputStage.");
};

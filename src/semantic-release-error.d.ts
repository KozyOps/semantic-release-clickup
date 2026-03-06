declare module "@semantic-release/error" {
  class SemanticReleaseError extends Error {
    code: string;
    details: string;
    semanticRelease: true;
    constructor(message: string, code: string, details?: string);
  }
  export = SemanticReleaseError;
}

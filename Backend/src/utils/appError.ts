/** Error with an HTTP status, thrown by services and handled centrally. */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

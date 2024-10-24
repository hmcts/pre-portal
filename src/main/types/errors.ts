export class HTTPError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class InternalServerError extends HTTPError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}

export class BadRequestError extends HTTPError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class TermsNotAcceptedError extends ForbiddenError {
  constructor(email: string, message: string = 'Terms and conditions not accepted') {
    super(`${message} by email ${email.substring(0, 5)}...`);
  }
}

export class UserNotActiveError extends ForbiddenError {
  constructor(userId: string, message: string = 'User not active') {
    super(`${message}: ${userId}`);
  }
}

export class UserNotAuthenticatedError extends UnauthorizedError {
  constructor(userId: string, message: string = 'User not authenticated') {
    super(`${message}: ${userId}`);
  }
}

export class UserNotInvitedError extends ForbiddenError {
  constructor(userId: string, message: string = 'User not invited') {
    super(`${message}: ${userId}`);
  }
}

export class RecordingNotFoundError extends NotFoundError {
  constructor(recordingId: string, message: string = 'Recording not found') {
    super(`${message}: ${recordingId}`);
  }
}

export class RecordingNotSharedError extends ForbiddenError {
  constructor(userId: string, recordingId: string, message: string = 'Recording not shared') {
    super(`${message}: ${userId} -> ${recordingId}`);
  }
}

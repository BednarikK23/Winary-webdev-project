import type { Request, Response } from 'express';
import type { ZodSchema, ZodTypeDef } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class InternalError extends Error {}

export const handleRepositoryErrors = (e: Error, res: Response) => {
  if (e instanceof NotFoundError) {
    res.status(404).send({
      name: e.name || 'NotFoundError',
      message: e.message || 'Entity not found',
    });
  } else if (e instanceof InternalError) {
    res.status(500).send({
      name: e.name || 'InternalError',
      message: e.message || 'Something went wrong on our side.',
    });
  } else if (e instanceof ConflictError) {
    res.status(400).send({
      name: e.name || 'ConflictError',
      message: e.message || 'Conflict',
    });
  } else {
    res.status(500).send({
      name: 'UnknownError',
      message: 'Something went wrong.',
    });
  }
};

export const parseRequest = async <
  Output,
  Def extends ZodTypeDef = ZodTypeDef,
  Input = Output,
>(
  schema: ZodSchema<Output, Def, Input>,
  req: Request,
  res: Response,
) => {
  const parsedRequest = await schema.safeParseAsync(req);

  if (!parsedRequest.success) {
    const error = fromZodError(parsedRequest.error);
    const errorResponse: Error = {
      name: 'ValidationError',
      message: error.message,
    };
    res.status(400).send(errorResponse);
    return null;
  }

  return parsedRequest.data;
};

export const handleErrors = (e: Error, res: Response) => {
  if (e instanceof NotFoundError) {
    const { name, message, cause } = e;
    const response: Error = { name, message, cause };
    res.status(404).send(response);
    return;
  }

  const { name, message, cause } = e;
  if (!(e instanceof InternalError)) {
    e = new InternalError();
  }

  const response: Error = { name, message, cause };
  res.status(500).send(response);
};
